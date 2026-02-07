import { load as parseHTML } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';

class LoreNovels implements Plugin.PluginBase {
  id = 'lorenovels';
  name = 'Lore Novels';
  icon = 'src/en/lorenovels/icon.svg';
  site = 'https://lorenovels.com';
  version = '1.0.0';

  private resolvePath(href?: string | null): string | undefined {
    if (!href) return undefined;
    if (href.startsWith('http')) {
      const url = new URL(href);
      if (!url.hostname.endsWith('lorenovels.com')) return undefined;
      return url.pathname;
    }
    if (!href.startsWith('/')) return `/${href}`;
    return href;
  }

  private resolveCover(src?: string | null): string | undefined {
    if (!src) return undefined;
    if (src.startsWith('http')) return src;
    return new URL(src, this.site).toString();
  }

  private parseHomeNovels(loadedCheerio: ReturnType<typeof parseHTML>) {
    const container = loadedCheerio(
      'div.entry-content.alignwide.wp-block-post-content',
    ).first();
    const root = container.length ? container : loadedCheerio;
    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    root.find('div.wp-block-column').each((_, el) => {
      const column = loadedCheerio(el);
      const link = column.find('h2 a').first().attr('href');
      const name = column.find('h2 a').first().text().trim();
      const cover = this.resolveCover(column.find('figure img').attr('src'));
      const path = this.resolvePath(link);

      if (!name || !path || seen.has(path)) return;
      seen.add(path);
      novels.push({
        name,
        path,
        cover,
      });
    });

    return novels;
  }

  async popularNovels(
    pageNo: number,
    { showLatestNovels }: Plugin.PopularNovelsOptions,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return [];
    const body = await fetchApi(this.site).then(res => res.text());
    const loadedCheerio = parseHTML(body);

    if (showLatestNovels) {
      return this.parseHomeNovels(loadedCheerio);
    }

    return this.parseHomeNovels(loadedCheerio);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const body = await fetchApi(this.site + novelPath).then(res => res.text());
    const loadedCheerio = parseHTML(body);

    const name = loadedCheerio('h1.entry-title, h1.wp-block-post-title, h1')
      .first()
      .text()
      .trim();

    const cover = this.resolveCover(
      loadedCheerio('img.wp-post-image').first().attr('src') ||
        loadedCheerio('.wp-block-image img').first().attr('src') ||
        loadedCheerio('figure img').first().attr('src'),
    );

    const summary = loadedCheerio('div.entry-content p')
      .map((_, el) => loadedCheerio(el).text().trim())
      .get()
      .filter(Boolean)
      .shift();

    const chapters: Plugin.ChapterItem[] = [];
    const seen = new Set<string>();

    loadedCheerio('div.entry-content a').each((_, el) => {
      const anchor = loadedCheerio(el);
      const href = anchor.attr('href');
      const path = this.resolvePath(href);
      const title = anchor.text().trim();

      if (!path || !title) return;
      if (path.includes('#') || path.includes('/wp-content/')) return;
      if (!/chapter|cap|ch\.?\s?\d/i.test(title) && !/chapter/i.test(path)) {
        return;
      }
      if (seen.has(path)) return;
      seen.add(path);

      chapters.push({
        name: title,
        path,
      });
    });

    return {
      path: novelPath,
      name: name || 'Untitled',
      cover,
      summary,
      chapters,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const body = await fetchApi(this.site + chapterPath).then(res =>
      res.text(),
    );
    const loadedCheerio = parseHTML(body);

    loadedCheerio(
      'script, style, .sharedaddy, .wp-block-buttons, nav, form, .comment-respond',
    ).remove();

    return loadedCheerio('div.entry-content').html() || '';
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return [];
    const url = `${this.site}/?s=${encodeURIComponent(searchTerm)}`;
    const body = await fetchApi(url).then(res => res.text());
    const loadedCheerio = parseHTML(body);

    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    loadedCheerio('article').each((_, el) => {
      const article = loadedCheerio(el);
      const link = article.find('h2 a, h1 a').first().attr('href');
      const name = article.find('h2, h1').first().text().trim();
      const cover = this.resolveCover(article.find('img').first().attr('src'));
      const path = this.resolvePath(link);

      if (!name || !path || seen.has(path)) return;
      if (/chapter|cap|ch\.?\s?\d/i.test(name)) return;

      seen.add(path);
      novels.push({
        name,
        path,
        cover,
      });
    });

    if (novels.length) return novels;

    return this.parseHomeNovels(loadedCheerio);
  }
}

export default new LoreNovels();
