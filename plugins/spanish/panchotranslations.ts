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
    this.version = '1.1.3';
  }

  private decodeHtmlEntities(value: string): string {
    return value
      .replace(/&quot;|&#34;/g, '"')
      .replace(/&apos;|&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  private extractArrayLiteral(source: string, key: string): string | undefined {
    const keyMatch = new RegExp(`["']?${key}["']?\\s*:`).exec(source);
    if (!keyMatch) return undefined;

    const start = source.indexOf('[', keyMatch.index + keyMatch[0].length);
    if (start === -1) return undefined;

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

  private parseNovelsFromSource(source?: string | null): Plugin.NovelItem[] {
    if (!source) return [];

    const normalizedSource = this.decodeHtmlEntities(source);
    const novelsLiteral = this.extractArrayLiteral(normalizedSource, 'novels');
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

    if (showLatestNovels) {
      const latestSection = $('section')
        .filter((i, el) =>
          $(el)
            .find('h1')
            .toArray()
            .some(heading =>
              /Novelas\s+Actualizadas/i.test($(heading).text().trim()),
            ),
        )
        .first();

      const latestFromXData = this.parseNovelsFromSource(
        latestSection.find('[x-data*="novels"]').first().attr('x-data'),
      );
      if (latestFromXData.length) return latestFromXData;

      const latestFromSectionHtml = this.parseNovelsFromSource(
        latestSection.html(),
      );
      if (latestFromSectionHtml.length) return latestFromSectionHtml;
    }

    const novels = this.parseNovelsFromSource(html);

    if (novels.length === 0) {
      $('ul.grid li').each((i, el) => {
        const name = $(el).find('h3').text().trim();
        const cover = $(el).find('img').attr('src');
        const path = $(el).find('picture a').attr('href');

        if (name && path) {
          novels.push({
            name,
            cover: cover || defaultCover,
            path: path.replace(/^\//, ''),
          });
        }
      });
    }

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

    // Logic to extract chapters from x-data blocks as requested
    const blocks = $('[x-data]').toArray();
    const chapterMap = new Map<string, Plugin.ChapterItem>();

    interface PanchoChapter {
      chapterName: string;
      chapterSlug: string;
      chapterDate?: string;
      chapterNumber?: number;
    }

    blocks.forEach(el => {
      const xdata = $(el).attr('x-data') || '';
      if (!xdata.includes('chapters:')) return;

      const m = xdata.match(
        /chapters\s*:\s*(\[[\s\S]*?\])\s*,\s*visibleChapters/,
      );
      if (!m) return;

      try {
        const jsonStr = m[1]
          .replace(/\s+/g, ' ')
          .replace(/([{,])\s*([a-zA-Z_$][\w$]*)\s*:/g, '$1"$2":')
          .replace(/'/g, '"');

        const chaptersData: PanchoChapter[] = JSON.parse(jsonStr);
        const novelSlug = novelPath.split('/').filter(Boolean).pop() || '';

        chaptersData.forEach((ch, index) => {
          if (!ch.chapterSlug || !ch.chapterName) return;

          const path = `novel/${novelSlug}/${ch.chapterSlug}`;

          if (!chapterMap.has(path)) {
            chapterMap.set(path, {
              name: ch.chapterName,
              path: path,
              releaseTime: ch.chapterDate,
              chapterNumber: ch.chapterNumber, // If available in source, else could infer
            });
          }
        });
      } catch (e) {
        // Ignore parsing errors for individual blocks
      }
    });

    novel.chapters = Array.from(chapterMap.values());
    // Assume source arrays are Newest->Oldest, so reversing gives Oldest->Newest
    novel.chapters.reverse();

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const $ = await this.getCheerio(this.site + chapterPath);

    // The content is usually in a div containing p.mb-2
    const chapterText = $('p.mb-2').parent().first().html() || '';

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
