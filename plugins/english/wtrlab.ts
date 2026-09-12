import { Plugin } from '@/types/plugin';
import { fetchApi } from '@libs/fetch';
import { FilterTypes, Filters } from '@libs/filterInputs';
import { load as parseHTML } from 'cheerio';

class WTRLAB implements Plugin.PluginBase {
  id = 'WTRLAB';
  name = 'WTR-LAB';
  site = 'https://wtr-lab.com/';
  version = '1.0.2';
  icon = 'src/en/wtrlab/icon.png';
  sourceLang = 'en/';
  baggage = '';
  trace = '';

  get headers(): Record<string, string> {
    return {
      baggage: this.baggage,
      'sentry-trace': this.trace,
    };
  }

  async popularNovels(
    page: number,
    {
      showLatestNovels,
      filters,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    let link = this.site + this.sourceLang + 'novel-list?';
    link += `orderBy=${filters.order.value}`;
    link += `&order=${filters.sort.value}`;
    link += `&filter=${filters.storyStatus.value}`;
    link += `&page=${page}`; //TODO Genre & Advance Searching Filter. Ez to implement, too much manual work, too lazy.

    if (showLatestNovels) {
      const response = await fetchApi(this.site + 'api/home/recent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page: page }),
      });

      const recentNovel: JsonNovel = await response.json();

      // Parse novels from JSON
      const novels: Plugin.NovelItem[] = recentNovel.data.map(
        (datum: Datum) => ({
          name: datum.serie.data.title || datum.serie.slug || '',
          cover: datum.serie.data.image,
          path:
            this.sourceLang +
              'serie-' +
              datum.serie.raw_id +
              '/' +
              datum.serie.slug || '',
        }),
      );

      return novels;
    } else {
      const body = await fetchApi(link).then(res => res.text());
      const loadedCheerio = parseHTML(body);
      const novels: Plugin.NovelItem[] = loadedCheerio('.serie-item')
        .map((index, element) => ({
          name:
            loadedCheerio(element)
              .find('.title-wrap > a')
              .text()
              .replace(loadedCheerio(element).find('.rawtitle').text(), '') ||
            '',
          cover: loadedCheerio(element).find('img').attr('src'),
          path: loadedCheerio(element).find('a').attr('href') || '',
        }))
        .get()
        .filter(novel => novel.name && novel.path);
      return novels;
    }
  }

  async fetchTokens() {
    const body = await fetchApi(this.site + this.sourceLang).then(res =>
      res.text(),
    );
    const $ = parseHTML(body);

    this.baggage = $('meta[name="baggage"]').attr('content') ?? '';
    this.trace = $('meta[name="sentry-trace"]').attr('content') ?? '';
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const body = await fetchApi(this.site + novelPath).then(res => res.text());
    const loadedCheerio = parseHTML(body);

    const baggage = loadedCheerio('meta[name="baggage"]').attr('content');
    const trace = loadedCheerio('meta[name="sentry-trace"]').attr('content');

    if (baggage && trace) {
      this.baggage = baggage;
      this.trace = trace;
    } else if (!this.baggage || !this.trace) {
      await this.fetchTokens();
    }

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: loadedCheerio('h1.text-uppercase').text(),
      cover: loadedCheerio('.img-wrap > img').attr('src'),
      summary: loadedCheerio('.lead').text().trim(),
    };

    novel.genres = loadedCheerio('td:contains("Genre")')
      .next()
      .find('a')
      .map((i, el) => loadedCheerio(el).text())
      .toArray()
      .join(',');

    novel.author = loadedCheerio('td:contains("Author")')
      .next()
      .text()
      .replace(/[\t\n]/g, '');

    novel.status = loadedCheerio('td:contains("Status")')
      .next()
      .text()
      .replace(/[\t\n]/g, '');

    const chapterJson = loadedCheerio('#__NEXT_DATA__').html() + '';
    const jsonData: NovelJson = JSON.parse(chapterJson);

    let rawId: number | null =
      jsonData.props.pageProps.serie.serie_data.raw_id ?? null;
    let slug: string | null =
      jsonData.props.pageProps.serie.serie_data.slug ?? null;

    const urlMatch = novelPath.match(/(?:serie|novel)-?(\d+)\/([^/]+)/);
    if (urlMatch) {
      rawId = parseInt(urlMatch[1]);
      slug = urlMatch[2];
    }

    let chapters: Plugin.ChapterItem[] = [];

    if (rawId && slug) {
      try {
        chapters = await this.fetchAllChapters(rawId, slug);
      } catch (error) {
        console.error('Failed to fetch chapters via API:', error);
        chapters = [];
      }
    } else {
      console.warn('Could not extract rawId or slug from page', {
        rawId,
        slug,
      });
    }

    if (chapters.length === 0) {
      chapters = jsonData.props.pageProps.serie.chapters.map(
        (jsonChapter, chapterIndex) => ({
          name: jsonChapter.title,
          path:
            this.sourceLang +
            'serie-' +
            jsonData.props.pageProps.serie.serie_data.raw_id +
            '/' +
            jsonData.props.pageProps.serie.serie_data.slug +
            '/chapter-' +
            jsonChapter.order, // Assuming 'slug' is the intended path
          releaseTime: (
            jsonChapter?.created_at || jsonChapter?.updated_at
          )?.substring(0, 10),
          chapterNumber: chapterIndex + 1,
        }),
      );
    }

    novel.chapters = chapters;

    return novel;
  }

  async fetchAllChapters(
    rawId: number,
    slug: string,
  ): Promise<Plugin.ChapterItem[]> {
    const allChapters: Plugin.ChapterItem[] = [];
    const batchSize = 500;
    let start = 1;
    let hasMore = true;

    while (hasMore) {
      const end = start + batchSize - 1;

      try {
        const response = await fetchApi(
          `${this.site}api/chapters/${rawId}?start=${start}&end=${end}`,
          {
            headers: {
              ...this.headers,
            },
          },
        );

        const data = await response.json();
        const chapters = data.chapters ?? data.data?.chapters ?? [];

        if (!Array.isArray(chapters) || chapters.length === 0) {
          hasMore = false;
          break;
        }

        const batchChapters: Plugin.ChapterItem[] = chapters.map(
          (apiChapter: ApiChapter) => ({
            name:
              apiChapter.title ||
              apiChapter.name ||
              `Chapter ${apiChapter.order}`,
            path: `${this.sourceLang}serie-${rawId}/${slug}/chapter-${apiChapter.order}`,
            releaseTime: apiChapter.updated_at?.substring(0, 10),
            chapterNumber: apiChapter.order,
          }),
        );

        allChapters.push(...batchChapters);

        if (chapters.length < batchSize) {
          hasMore = false;
          break;
        }

        start += batchSize;
      } catch (error) {
        console.error(`Failed to fetch chapters ${start}-${end}:`, error);
        hasMore = false;
        break;
      }
    }

    return allChapters.sort(
      (a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0),
    );
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const body = await fetchApi(this.site + chapterPath).then(res =>
      res.text(),
    );

    const loadedCheerio = parseHTML(body);
    const chapterJson = loadedCheerio('#__NEXT_DATA__').html() + '';
    const jsonData: NovelJson = JSON.parse(chapterJson);

    const chapterContent = JSON.stringify(
      jsonData.props.pageProps.serie.chapter_data.data.body,
    );
    const parsedArray = JSON.parse(chapterContent);
    let htmlString = '';

    for (const text of parsedArray) {
      htmlString += `<p>${text}</p>`;
    }

    return htmlString;
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const response = await fetchApi(this.site + 'api/search', {
      headers: {
        'Content-Type': 'application/json',
        Referer: this.site + this.sourceLang,
        Origin: this.site,
      },
      method: 'POST',
      body: JSON.stringify({ text: searchTerm }),
    });

    const recentNovel: JsonNovel = await response.json();

    // Parse novels from JSON
    const novels: Plugin.NovelItem[] = recentNovel.data.map((datum: Datum) => ({
      name: datum.data.title || '',
      cover: datum.data.image,
      path: this.sourceLang + 'serie-' + datum.raw_id + '/' + datum.slug || '',
    }));

    return novels;
  }

  filters = {
    order: {
      value: 'chapter',
      label: 'Order by',
      options: [
        { label: 'View', value: 'view' },
        { label: 'Name', value: 'name' },
        { label: 'Addition Date', value: 'date' },
        { label: 'Reader', value: 'reader' },
        { label: 'Chapter', value: 'chapter' },
      ],
      type: FilterTypes.Picker,
    },
    sort: {
      value: 'desc',
      label: 'Sort by',
      options: [
        { label: 'Descending', value: 'desc' },
        { label: 'Ascending', value: 'asc' },
      ],
      type: FilterTypes.Picker,
    },
    storyStatus: {
      value: 'all',
      label: 'Status',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Ongoing', value: 'ongoing' },
        { label: 'Completed', value: 'completed' },
      ],
      type: FilterTypes.Picker,
    },
  } satisfies Filters;
}

type NovelJson = {
  props: Props;
  page: string;
};

type Props = {
  pageProps: PageProps;
  __N_SSP: boolean;
};

type PageProps = {
  serie: Serie;
  server_time: Date;
};

type Serie = {
  serie_data: SerieData;
  chapters: Chapter[];
  recommendation: SerieData[];
  chapter_data: ChapterData;
  id: number;
  raw_id: number;
  slug: string;
  data: Data;
  is_default: boolean;
  raw_type: string;
};

type Chapter = {
  serie_id: number;
  id: number;
  order: number;
  slug: string;
  title: string;
  name: string;
  created_at: string;
  updated_at: string;
};
type ApiChapter = {
  serie_id: number;
  id: number;
  order: number;
  title: string;
  name: string;
  updated_at: string;
};
type ChapterData = {
  data: ChapterContent;
};
type ChapterContent = {
  title: string;
  body: string;
};

type SerieData = {
  serie_id?: number;
  recommendation_id?: number;
  score?: string;
  id: number;
  slug: string;
  search_text: string;
  status: number;
  data: Data;
  created_at: string;
  updated_at: string;
  view: number;
  in_library: number;
  rating: number | null;
  chapter_count: number;
  power: number;
  total_rate: number;
  user_status: number;
  verified: boolean;
  from: null;
  raw_id: number;
  genres?: number[];
};

type Data = {
  title: string;
  author: string;
  description: string;
  image: string;
};

type JsonNovel = {
  success: boolean;
  data: Datum[];
};
type Datum = {
  serie: Serie;
  chapters: Chapter[];
  updated_at: Date;
  raw_id: number;
  slug: string;
  data: Data;
};

export default new WTRLAB();
