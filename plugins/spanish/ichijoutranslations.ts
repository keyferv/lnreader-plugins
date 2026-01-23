import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { Filters, FilterTypes } from '@libs/filterInputs';
import { load as loadCheerio } from 'cheerio';

type IchijouResponse = {
  data: {
    data: IchijouWork[];
    meta: {
      totalPages: number;
    };
  };
};

type IchijouWork = {
  id: number;
  title: string;
  slug: string;
  synopsis: string;
  workImages: {
    image_url: string;
    image_type: {
      code: string;
    };
  }[];
  publicationStatus: {
    name: string;
  };
  type: {
    name: string;
  };
  workGenres: {
    genre: {
      name: string;
    };
  }[];
};

type IchijouChapter = {
  id: number;
  title: string;
  number: number;
  slug: string;
};

type IchijouWorkDetails = IchijouWork & {
  chapters: IchijouChapter[];
};

class IchijouTranslations implements Plugin.PluginBase {
  id = 'ichijoutranslations';
  name = 'Ichijou Translations';
  site = 'https://www.ichijoutranslations.com';
  apiSite = 'https://api.ichijoutranslations.com/api';
  cdnSite = 'https://cdn.ichijoutranslations.com';
  version = '1.0.6';
  icon = 'src/es/ichijoutranslations/icon.png';
  lang = 'Spanish';

  private buildExploreUrl(
    pageNo: number,
    sortBy: string,
    sortOrder: string,
    searchTerm?: string,
  ): string {
    let url = `${this.site}/explorar?page=${pageNo}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }

    return url;
  }

  private parseExploreHtml(html: string): Plugin.NovelItem[] {
    const $ = loadCheerio(html);
    const novels: Plugin.NovelItem[] = [];

    $('div.grid article').each((_, element) => {
      const article = $(element);
      const anchor = article.find('a[href*="/obras/"]').first();
      const href = anchor.attr('href');
      const title = article.find('h3').first().text().trim();
      const img = article.find('img').first();
      const imgSrc = img.attr('src');

      if (!href || !title || !imgSrc) return;

      let cover = imgSrc;
      if (!cover.startsWith('http')) {
        cover = new URL(cover, this.site).toString();
      }

      let path = href;
      if (path.startsWith('http')) {
        path = new URL(path).pathname;
      }
      if (!path.startsWith('/')) {
        path = `/${path}`;
      }

      novels.push({
        name: title,
        cover,
        path,
      });
    });

    return novels;
  }

  filters = {
    sortBy: {
      type: FilterTypes.Picker,
      label: 'Ordenar por',
      value: 'title',
      options: [
        { label: 'Título', value: 'title' },
        { label: 'Agregado', value: 'createdAt' },
        { label: 'Actualizado', value: 'updatedAt' },
        { label: 'Vistas', value: 'views' },
      ],
    },
    sortOrder: {
      type: FilterTypes.Picker,
      label: 'Orden',
      value: 'ASC',
      options: [
        { label: 'Ascendente', value: 'ASC' },
        { label: 'Descendente', value: 'DESC' },
      ],
    },
  } satisfies Filters;

  async popularNovels(
    pageNo: number,
    { filters }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const sortBy = filters?.sortBy?.value || this.filters.sortBy.value;
    const sortOrder = filters?.sortOrder?.value || this.filters.sortOrder.value;
    const url = this.buildExploreUrl(pageNo, sortBy, sortOrder);

    const result = await fetchApi(url);
    const html = await result.text();

    return this.parseExploreHtml(html);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const id = novelPath
      .split('/')
      .pop()
      ?.match(/^(\d+)-/)?.[1];
    if (!id) throw new Error('No se pudo obtener el ID de la novela');

    // Assuming the endpoint for work details follows the pattern /home/work/:id
    // If this is incorrect, it needs to be updated based on the actual API.
    const url = `${this.apiSite}/home/work/${id}`;

    const result = await fetchApi(url);
    const body = (await result.json()) as { data: IchijouWorkDetails };
    const work = body.data;

    const coverImage =
      work.workImages.find(
        img => img.image_type.code === 'card' && img.image_url,
      ) ||
      work.workImages.find(
        img => img.image_type.code === 'cover' && img.image_url,
      );

    let cover = coverImage?.image_url;
    if (cover && !cover.startsWith('http')) {
      cover = this.cdnSite + (cover.startsWith('/') ? cover : `/${cover}`);
    }

    const genres = work.workGenres?.map(g => g.genre.name) || [];
    if (work.type?.name) genres.push(work.type.name);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: work.title,
      cover: cover,
      summary: work.synopsis,
      status: work.publicationStatus?.name?.trim(),
      genres: genres.join(', '),
    };

    if (work.chapters) {
      novel.chapters = work.chapters.map(chapter => ({
        name: `Capítulo ${chapter.number}: ${chapter.title}`,
        path: `/capitulo/${chapter.id}-${chapter.slug}`,
        chapterNumber: chapter.number,
      }));
    }

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const id = chapterPath
      .split('/')
      .pop()
      ?.match(/^(\d+)-/)?.[1];
    if (!id) throw new Error('No se pudo obtener el ID del capítulo');
    // Assuming endpoint for chapter details
    const url = `${this.apiSite}/home/chapter/${id}`;

    const result = await fetchApi(url);
    const body = (await result.json()) as { data: { content: string } };

    return body.data.content;
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const sortBy = this.filters.sortBy.value;
    const sortOrder = this.filters.sortOrder.value;
    const url = this.buildExploreUrl(pageNo, sortBy, sortOrder, searchTerm);

    const result = await fetchApi(url);
    const html = await result.text();

    return this.parseExploreHtml(html);
  }
}

export default new IchijouTranslations();
