import { CheerioAPI, load as parseHTML } from 'cheerio';
import { Plugin } from '@/types/plugin';
import { defaultCover } from '@libs/defaultCover';
import { fetchApi } from '@libs/fetch';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

class DevilNovels implements Plugin.PluginBase {
  id = 'DevilNovels';
  name = 'DevilNovels';
  icon = 'src/es/devilnovels/icon.png';
  site = 'https://devilnovels.com/';
  version = '1.0.2';

  async popularNovels(
    page: number,
    { filters }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const novels: Plugin.NovelItem[] = [];

    // Prefer the listing page which contains the featured grid and titles
    const url = this.site + 'listado-de-novelas/';
    const res = await fetchApi(url);
    if (!res.ok) return novels;
    const body = await res.text();
    const $ = parseHTML(body);

    // Use a map to deduplicate by path
    const map = new Map<string, Plugin.NovelItem>();

    // 1) Featured grid items
    $('.pvc-featured-pages-grid .pvc-featured-page-item').each((i, el) => {
      const item = $(el);
      const a = item.find('a').first();
      const href = a.attr('href') || '';
      const img = item.find('img').attr('src') || defaultCover;
      const title =
        item.find('p.pvc-page-title a').text().trim() ||
        a.attr('title') ||
        a.text().trim();
      const path = href.replace(this.site, '');
      if (title) map.set(path || href, { name: title, path, cover: img });
    });

    // 2) Any standalone titles (p.pvc-page-title a)
    $('p.pvc-page-title a').each((i, el) => {
      const a = $(el);
      const href = a.attr('href') || '';
      const title = a.text().trim();
      const parent = a.closest('.pvc-featured-page-item');
      const img =
        parent && parent.length
          ? parent.find('img').attr('src') || defaultCover
          : defaultCover;
      const path = href.replace(this.site, '');
      if (title) map.set(path || href, { name: title, path, cover: img });
    });

    // 3) Fallback: parse table rows (some pages show a table of updates)
    $('table tbody tr').each((i, el) => {
      const tds = $(el).find('td');
      if (tds.length < 1) return;
      const left = tds.first();
      const right = tds.eq(1);

      const titleA = left.find('a').first();
      const href = titleA.attr('href') || '';
      const name = titleA.text().trim();
      const img = left.find('img').attr('src') || defaultCover;
      const path = href.replace(this.site, '');

      // Try to capture the latest chapter from the second <td>
      let latestChapter: { name: string; path: string } | undefined;
      if (right && right.length) {
        const latestA = right.find('a').first();
        const lhref = latestA.attr('href') || '';
        const lname = latestA.text().trim();
        if (lname) {
          latestChapter = { name: lname, path: lhref.replace(this.site, '') };
        }
      }

      if (name) map.set(path || href, { name, path, cover: img, latestChapter });
    });

    // Convert to array and support pagination (10 items per page)
    const all = Array.from(map.values());
    const perPage = 10;
    const pageNo = Math.max(1, page || 1);
    const start = (pageNo - 1) * perPage;
    const end = start + perPage;
    const batch = all.slice(start, end);

    // Slight pause to avoid hammering the site when iterating pages
    await sleep(600);

    return batch;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = novelPath.startsWith('http')
      ? novelPath
      : this.site + novelPath;
    const res = await fetchApi(url);
    const body = await res.text();
    const $ = parseHTML(body);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name:
        $('meta[property="og:title"]').attr('content') ||
        $('h1').first().text().trim() ||
        '',
      cover: $('meta[property="og:image"]').attr('content') || defaultCover,
      summary: $('.entry-content').first().text().trim() || undefined,
      chapters: [],
    };

    // Attempt to collect chapter links if present (deduplicate)
    const seen = new Set<string>();
    $('.entry-content a, .post a').each((i, el) => {
      const a = $(el);
      const href = a.attr('href') || '';
      const text = a.text().trim();
      if (!href || !text) return;
      // basic heuristic: chapter links often contain 'chapter' or 'capitulo' or '/act/'
      if (/chapter|capitulo|cap|act/i.test(href)) {
        const path = href.replace(this.site, '');
        if (!seen.has(path)) {
          seen.add(path);
          novel.chapters!.push({ name: text, path });
        }
      }
    });

    // Some themes (Elementor) list posts/articles as chapter links inside
    // an elementor-posts grid — handle those too (h3.elementor-post__title a)
    $('.elementor-posts-container article, .elementor-post').each((i, el) => {
      const block = $(el);
      const a = block.find('h3.elementor-post__title a, h3.elementor-post__title > a, a[data-wpel-link="internal"]').first();
      const href = a.attr('href') || '';
      const text = a.text().trim();
      if (!href || !text) return;
      const path = href.replace(this.site, '');
      if (!seen.has(path)) {
        seen.add(path);
        novel.chapters!.push({ name: text, path });
      }
    });

    // Handle pagination: gather page links from elementor pagination and fetch them
    const pageLinks: string[] = $('.elementor-pagination a.page-numbers')
      .map((i, el) => $(el).attr('href') || '')
      .get()
      .filter(h => !!h);

    // Remove duplicates and ensure we don't re-fetch the current page
    const uniquePageLinks = Array.from(new Set(pageLinks));

    for (const pageUrl of uniquePageLinks) {
      // If the link is the same as the novel page, skip
      const normalizedPageUrl = pageUrl.replace(/#.*$/, '');
      if (!normalizedPageUrl) continue;
      // Avoid refetching the main novel URL
      if (normalizedPageUrl === (url) || normalizedPageUrl === (this.site + novelPath)) continue;

      try {
        const abs = normalizedPageUrl.startsWith('http')
          ? normalizedPageUrl
          : this.site + normalizedPageUrl.replace(/^\//, '');
        const pres = await fetchApi(abs);
        if (!pres.ok) continue;
        const pbody = await pres.text();
        const $$ = parseHTML(pbody);

        // extract chapter links from this page (same selectors)
        $$('.elementor-posts-container article, .elementor-post').each((i, el) => {
          const block = $$(el);
          const a = block.find('h3.elementor-post__title a, h3.elementor-post__title > a, a[data-wpel-link="internal"]').first();
          const href = a.attr('href') || '';
          const text = a.text().trim();
          if (!href || !text) return;
          const path = href.replace(this.site, '');
          if (!seen.has(path)) {
            seen.add(path);
            novel.chapters!.push({ name: text, path });
          }
        });

        // small pause between page fetches
        await sleep(300);
      } catch (e) {
        // ignore individual page fetch errors
        continue;
      }
    }

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = chapterPath.startsWith('http')
      ? chapterPath
      : this.site + chapterPath;
    const res = await fetchApi(url);
    const body = await res.text();
    const $ = parseHTML(body);

    // prefer main content area
    const content =
      $('.entry-content').first().html() || $('article').first().html() || '';
    return content;
  }

  async searchNovels(
    searchTerm: string,
    page: number,
  ): Promise<Plugin.NovelItem[]> {
    const novels: Plugin.NovelItem[] = [];

    // Use the pages search endpoint which returns page results
    const pageQuery = page && page > 1 ? `&paged=${page}` : '';
    const url = `${this.site}?post_type=page&s=${encodeURIComponent(searchTerm)}${pageQuery}`;
    const res = await fetchApi(url);
    if (!res.ok) return novels;
    const body = await res.text();
    const $ = parseHTML(body);

    // Each result is rendered as an article block with class 'ast-article-inner'
    $('.ast-article-inner').each((i, el) => {
      const block = $(el);
      const a = block.find('h2.entry-title a').first();
      const href = a.attr('href') || '';
      const title = a.text().trim();
      const img = block.find('.post-thumb img').attr('src') || defaultCover;
      const path = href.replace(this.site, '');
      if (title) novels.push({ name: title, path, cover: img });
    });

    return novels;
  }

  filters = {} as any;
}

export default new DevilNovels();
