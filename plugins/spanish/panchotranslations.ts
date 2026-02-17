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
    this.version = '1.1.0';
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
    options: Plugin.PopularNovelsOptions,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return []; // Site seems to use single page with "Load more"
    const html = await fetchApi(this.site + 'home').then(res => res.text());
    const $ = parseHTML(html);
    const novels: Plugin.NovelItem[] = [];

    // Try to extract from JSON first
    const novelsMatch = html
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .match(/novels":\s*(\[.*?\])/);

    if (novelsMatch) {
      try {
        const novelsData = JSON.parse(novelsMatch[1]);
        novelsData.forEach((n: any) => {
          novels.push({
            name: n.novelName,
            cover: n.novelImg || defaultCover,
            path: `novel/${n.novelSlug}`,
          });
        });
      } catch (e) {
        // Fallback to DOM
      }
    }

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

    const chapters: Plugin.ChapterItem[] = [];
    const chaptersMatch = html
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .match(/chapters\\?":\s*(\[.*?\])/);
    if (chaptersMatch) {
      try {
        const chaptersData = JSON.parse(chaptersMatch[1]);
        const novelSlug = novelPath.split('/').filter(Boolean).pop() || '';
        chaptersData.forEach((ch: any, index: number) => {
          chapters.push({
            name: ch.chapterName,
            path: `novel/${novelSlug}/${ch.chapterSlug}`,
            releaseTime: ch.chapterDate,
            chapterNumber: chaptersData.length - index,
          });
        });
      } catch (e) {
        // Fallback or ignore
      }
    }

    novel.chapters = chapters.reverse();
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
