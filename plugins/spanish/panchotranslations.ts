import { fetchApi } from '@libs/fetch';
import { Filters } from '@libs/filterInputs';
import { Plugin } from '@/types/plugin';
import { CheerioAPI, load as parseHTML } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class PanchoPlugin implements Plugin.PluginBase {
  id: string;
  name: string;
  icon: string;
  site: string;
  version: string;
  filters?: Filters | undefined;

  constructor() {
    this.id = 'panchotranslations';
    this.name = 'Pancho Translations';
    this.icon = `multisrc/madara/panchotranslations/icon.png`;
    this.site = 'https://panchonovels.online/';
    this.version = '1.1.7';
  }

  private decodeHtmlEntities(value: string): string {
    return value
      .replace(/&quot;|&#34;/g, '"')
      .replace(/&apos;|&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  private extractArrayLiteral(source: string, key: string): string | undefined {
    // Matches key followed by start of array [, handling quotes and whitespace
    const keyMatch = new RegExp(`["']?${key}["']?\\s*:\\s*\\[`).exec(source);
    if (!keyMatch) return undefined;

    const start = keyMatch.index + keyMatch[0].length - 1; // index of [

    let depth = 0;
    let inString = false;
    let quote = '';

    for (let i = start; i < source.length; i++) {
      const char = source[i];
      const prev = i > 0 ? source[i - 1] : '';

      if (inString) {
        if (char === quote && prev !== '\\') {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        quote = char;
        continue;
      }

      if (char === '[') depth++;
      if (char === ']') {
        depth--;
        if (depth === 0) {
          return source.slice(start, i + 1);
        }
      }
    }

    return undefined;
  }

  private parseNovelsFromSource(
    source?: string | null,
    key = 'novels',
  ): Plugin.NovelItem[] {
    if (!source) return [];

    const normalizedSource = this.decodeHtmlEntities(source);
    const novelsLiteral = this.extractArrayLiteral(normalizedSource, key);
    if (!novelsLiteral) return [];

    try {
      const novelsData = JSON.parse(novelsLiteral);
      if (!Array.isArray(novelsData)) return [];

      const novels: Plugin.NovelItem[] = [];
      const seen = new Set<string>();

      type HomeNovel = {
        novelSlug?: string;
        novelName?: string;
        novelImg?: string;
      };

      novelsData.forEach(entry => {
        const n =
          typeof entry === 'object' && entry !== null
            ? (entry as HomeNovel)
            : {};
        const slug = typeof n?.novelSlug === 'string' ? n.novelSlug.trim() : '';
        const name = typeof n?.novelName === 'string' ? n.novelName.trim() : '';
        if (!slug || !name) return;

        const path = `novel/${slug}`;
        if (seen.has(path)) return;
        seen.add(path);

        novels.push({
          name,
          cover:
            typeof n?.novelImg === 'string' && n.novelImg.trim()
              ? n.novelImg
              : defaultCover,
          path,
        });
      });

      return novels;
    } catch (e) {
      return [];
    }
  }

  private parseChaptersFromSource(
    source?: string | null,
  ): Plugin.ChapterItem[] {
    if (!source) return [];

    const normalizedSource = this.decodeHtmlEntities(source);
    const chaptersLiteral = this.extractArrayLiteral(
      normalizedSource,
      'chapters',
    );
    if (!chaptersLiteral) return [];

    try {
      const chaptersData = JSON.parse(chaptersLiteral);
      if (!Array.isArray(chaptersData)) return [];

      type PanchoChapter = {
        chapterName?: string;
        chapterNameExtended?: string | null;
        chapterSlug?: string;
        chapterDate?: string;
        chapterIndex?: number;
        chapterNumber?: number;
      };

      const chapters: Plugin.ChapterItem[] = [];

      chaptersData.forEach(entry => {
        const chapter =
          typeof entry === 'object' && entry !== null
            ? (entry as PanchoChapter)
            : {};
        const slug =
          typeof chapter.chapterSlug === 'string'
            ? chapter.chapterSlug.trim()
            : '';
        const name =
          typeof chapter.chapterName === 'string'
            ? chapter.chapterName.trim()
            : '';

        if (!slug || !name) return;

        const extendedName =
          typeof chapter.chapterNameExtended === 'string' &&
          chapter.chapterNameExtended.trim()
            ? ` - ${chapter.chapterNameExtended.trim()}`
            : '';

        chapters.push({
          name: `${name}${extendedName}`,
          path: slug,
          releaseTime: chapter.chapterDate,
          chapterNumber: chapter.chapterIndex ?? chapter.chapterNumber,
        });
      });

      return chapters;
    } catch (e) {
      return [];
    }
  }

  async getCheerio(url: string): Promise<CheerioAPI> {
    const r = await fetchApi(url);
    if (!r.ok)
      throw new Error(
        'Could not reach site (' + r.status + ') try to open in webview.',
      );
    return parseHTML(await r.text());
  }

  async popularNovels(
    pageNo: number,
    { showLatestNovels }: Plugin.PopularNovelsOptions,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return []; // Site seems to use single page with "Load more"
    const html = await fetchApi(this.site + 'home').then(res => res.text());
    const $ = parseHTML(html);

    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    const addNovel = (novel: Plugin.NovelItem) => {
      if (!seen.has(novel.path)) {
        seen.add(novel.path);
        novels.push(novel);
      }
    };

    // 1. Parse Carousel (Popular) - ONLY if NOT showing latest (Recents)
    if (!showLatestNovels) {
      $('div.embla > div.flex > div').each((i, el) => {
        const name = $(el)
          .find('span.text-white.text-base.font-semibold')
          .text()
          .trim();
        const cover = $(el).find('img').attr('src');
        const path = $(el).find('a').attr('href');

        if (name && path) {
          addNovel({
            name,
            cover: cover || defaultCover,
            path: path.replace(/^\//, ''),
          });
        }
      });
    }

    // 2. Parse Main List (Grid) - Used for Latest/Recientes only
    const otherNovels: Plugin.NovelItem[] = [];

    if (showLatestNovels) {
      const latestSection = $('div.pt-7.pb-20');
      const allXData = latestSection.length
        ? latestSection.find('[x-data]').toArray()
        : $('[x-data]').toArray();

      for (const el of allXData) {
        const data = $(el).attr('x-data');
        if (!data) continue;

        const parsedNovels = /allNovels\s*:/.test(data)
          ? this.parseNovelsFromSource(data, 'allNovels')
          : this.parseNovelsFromSource(data);

        otherNovels.push(...parsedNovels);
      }
    }

    // Also parse the server-rendered DOM entries (first items are often server-side)
    const domNovels: Plugin.NovelItem[] = [];
    $('ul.grid li').each((i, el) => {
      const name = $(el).find('h3').text().trim();
      const cover = $(el).find('img').attr('src');
      const path = $(el).find('picture a').attr('href');

      if (name && path) {
        domNovels.push({
          name,
          cover: cover || defaultCover,
          path: path.replace(/^\//, ''),
        });
      }
    });

    // If caller wants Latest/Recientes, return the grid (DOM + x-data merged),
    // otherwise (Popular) return only the carousel items parsed earlier.
    if (showLatestNovels) {
      // Include both server-rendered DOM novels and client-side x-data novels.
      // Use `addNovel` (with `seen`) to avoid duplicates and prevent parsing
      // the same novel twice.
      domNovels.forEach(addNovel);
      otherNovels.forEach(addNovel);

      return novels;
    }

    // showLatestNovels === false -> Popular: do not add grid items, return carousel only
    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const html = await fetchApi(this.site + novelPath).then(res => res.text());
    const $ = parseHTML(html);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('h1').text().trim(),
    };

    novel.cover =
      $('img.aspect-\\[2\\/3\\]').attr('src') ||
      $('img').first().attr('src') ||
      defaultCover;

    novel.summary = $('div[x-ref="novelDescription"]').text().trim();

    const genres: string[] = [];
    $('ul.flex.flex-wrap li').each((i, el) => {
      genres.push($(el).text().trim());
    });
    novel.genres = genres.join(', ');

    novel.author = $('a[href^="/translator/"]').text().trim() || 'Pancho';

    const statusText = $('span:contains("Novela")').text();
    if (statusText.includes('Activa')) {
      novel.status = NovelStatus.Ongoing;
    } else if (statusText.includes('Finalizada')) {
      novel.status = NovelStatus.Completed;
    } else {
      novel.status = NovelStatus.Unknown;
    }

    const blocks = $('[x-data]').toArray();
    const chapterMap = new Map<string, Plugin.ChapterItem>();

    blocks.forEach(el => {
      const xdata = $(el).attr('x-data') || '';
      if (!xdata.includes('chapters:')) return;

      const novelSlug = novelPath.split('/').filter(Boolean).pop() || '';
      const chapters = this.parseChaptersFromSource(xdata);

      chapters.forEach(chapter => {
        const path = `novel/${novelSlug}/${chapter.path}`;

        if (!chapterMap.has(path)) {
          chapterMap.set(path, {
            ...chapter,
            path,
          });
        }
      });
    });

    novel.chapters = Array.from(chapterMap.values());
    // Assume source arrays are Newest->Oldest, so reversing gives Oldest->Newest
    novel.chapters.reverse();

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const $ = await this.getCheerio(this.site + chapterPath);

    const chapterText =
      $('#chapterContent').html() || $('p.mb-2').parent().first().html() || '';

    return chapterText;
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const $ = await this.getCheerio(
      this.site + 'novel/search?q=' + encodeURIComponent(searchTerm),
    );
    const novels: Plugin.NovelItem[] = [];

    $('div.mx-px, div.mx-1').each((i, el) => {
      const name = $(el).find('span.text-white').first().text().trim();
      const cover = $(el).find('img').attr('src');
      const path = $(el).find('a[href^="/novel/"]').attr('href');

      if (name && path) {
        novels.push({
          name,
          cover: cover || defaultCover,
          path: path.replace(/^\//, ''),
        });
      }
    });

    return novels;
  }
}

const plugin = new PanchoPlugin();

export default plugin;
