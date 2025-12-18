import { CheerioAPI, load } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import { Filters, FilterTypes } from '@libs/filterInputs';
import { localStorage, storage } from '@libs/storage';

class NovelFire implements Plugin.PluginBase {
  id = 'novelfire';
  name = 'Novel Fire';
  version = '1.0.12';
  icon = 'src/en/novelfire/icon.png';
  site = 'https://novelfire.net/';

  // Enables access to host-provided LocalStorage/SessionStorage (if available)
  webStorageUtilized = true;

  private getCookieHeader(): string | undefined {
    const fromStorage =
      (storage.get('cookies') as string | undefined) ??
      (storage.get('cookie') as string | undefined) ??
      (storage.get(`${this.id}.cookies`) as string | undefined);

    const ls = localStorage.get?.();
    const fromLocalStorage =
      (ls?.cookies as string | undefined) ??
      (ls?.cookie as string | undefined) ??
      (ls?.[`${this.id}.cookies`] as string | undefined);

    const candidate = fromStorage ?? fromLocalStorage;
    const cookie = typeof candidate === 'string' ? candidate.trim() : '';
    return cookie.length ? cookie : undefined;
  }

  private requestHeaders(referer?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,*;q=0.8',
      'Upgrade-Insecure-Requests': '1',
    };

    const cookie = this.getCookieHeader();
    if (cookie) headers.Cookie = cookie;
    if (referer) headers.Referer = referer;
    return headers;
  }

  private ajaxHeaders(referer: string): Record<string, string> {
    return {
      ...this.requestHeaders(referer),
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
    };
  }

  private async fetchWithHeaders(url: string, referer?: string) {
    return fetchApi(url, { headers: this.requestHeaders(referer) });
  }

  private async fetchAjax(url: string, referer: string) {
    return fetchApi(url, { headers: this.ajaxHeaders(referer) });
  }

  private detectBlockReason(html: string): string | undefined {
    const text = (html || '').toLowerCase();
    if (!text) return undefined;

    if (
      text.includes('cf-challenge') ||
      text.includes('challenge-platform') ||
      text.includes('just a moment') ||
      text.includes('checking your browser') ||
      text.includes('cloudflare')
    ) {
      return 'Cloudflare/anti-bot challenge detected';
    }

    if (text.includes('you are being rate limited')) {
      return 'Rate limited by NovelFire';
    }

    if (
      text.includes('access denied') ||
      text.includes('you have been blocked')
    ) {
      return 'Access blocked';
    }

    return undefined;
  }

  private inferChaptersRefererFromPath(pathOrUrl: string): string | undefined {
    const abs = this.resolveAbsUrl(pathOrUrl, this.site);
    try {
      const u = new URL(abs);
      const parts = u.pathname.split('/').filter(Boolean);
      // Expected patterns:
      // - /book/<slug>/chapter-123
      // - /book/<slug>/chapters
      if (parts[0] === 'book' && parts[1]) {
        return `${this.site}book/${parts[1]}/chapters`;
      }
      return this.site;
    } catch {
      return this.site;
    }
  }

  private resolveAbsUrl(href: string, baseUrl: string) {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  }

  private toPath(absUrl: string) {
    return absUrl.replace(this.site, '').replace(/^\//, '');
  }

  private normalizePath(href: string, baseUrl: string) {
    return this.toPath(this.resolveAbsUrl(href, baseUrl));
  }

  private extractPostIdFromChaptersHtml(html: string): string | undefined {
    // Seen patterns:
    // - listChapterDataAjax?post_id=2888
    // - post_id: 2888
    // - post_id=2888
    const directUrl = html.match(
      /listChapterDataAjax\?[^"'<>]*post_id=(\d+)/i,
    )?.[1];
    if (directUrl) return directUrl;

    const keyVal = html.match(/\bpost_id\b\s*[:=]\s*"?(\d+)"?/i)?.[1];
    return keyVal;
  }

  private extractChapterItemsFromAjaxPayload(
    payload: any,
    baseUrl: string,
  ): Plugin.ChapterItem[] {
    const items: Plugin.ChapterItem[] = [];
    const seen = new Set<string>();

    const push = (name: string | undefined, href: string | undefined) => {
      if (!href) return;
      const abs = this.resolveAbsUrl(href, baseUrl);
      const path = this.toPath(abs);
      if (!path || seen.has(path)) return;
      seen.add(path);
      items.push({ name: (name || '').trim() || 'No Title Found', path });
    };

    const tryFromHtmlString = (html: string) => {
      const $ = load(html);
      const a = $('a[href]').first();
      if (!a.length) return;
      const href = a.attr('href');
      const name = a.text().trim() || a.attr('title') || undefined;
      push(name, href);
    };

    const visit = (node: any) => {
      if (node == null) return;
      if (typeof node === 'string') {
        if (node.includes('<a') && node.includes('href=')) {
          tryFromHtmlString(node);
        }
        return;
      }
      if (Array.isArray(node)) {
        for (const v of node) visit(v);
        return;
      }
      if (typeof node === 'object') {
        // Common keys in DataTables responses
        const href =
          (node.href as string | undefined) ??
          (node.url as string | undefined) ??
          (node.link as string | undefined);
        const title =
          (node.title as string | undefined) ??
          (node.name as string | undefined);
        if (href) push(title, href);

        // Sometimes fields contain HTML strings
        for (const v of Object.values(node)) {
          if (
            typeof v === 'string' &&
            v.includes('<a') &&
            v.includes('href=')
          ) {
            tryFromHtmlString(v);
          } else {
            visit(v);
          }
        }
      }
    };

    // DataTables typically: { data: [...] }
    visit(payload?.data ?? payload);
    return items;
  }

  async getCheerio(url: string, search: boolean): Promise<CheerioAPI> {
    const r = await this.fetchWithHeaders(url, this.site);
    if (!r.ok && search != true)
      throw new Error(
        'Could not reach site (' +
          r.status +
          '). If Cloudflare blocks you, open in webview or provide cookies (cf_clearance).',
      );
    const html = await r.text();

    const blockReason = this.detectBlockReason(html);
    if (blockReason && search != true)
      throw new Error(
        `${blockReason}. Open in webview or provide cookies (cf_clearance + novelfirenet_session + XSRF-TOKEN).`,
      );

    const $ = load(html);

    return $;
  }

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels,
      filters,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    let url = '';

    // Usar el endpoint específico de "latest-release-novels" para recientes
    if (showLatestNovels) {
      url = `${this.site}latest-release-novels?page=${pageNo}`;
    } else if (filters) {
      url = this.site + 'search-adv';

      const params = new URLSearchParams();
      for (const language of filters.language.value) {
        params.append('country_id[]', language);
      }
      params.append('ctgcon', filters.genre_operator.value);
      for (const genre of filters.genres.value) {
        params.append('categories[]', genre);
      }
      params.append('totalchapter', filters.chapters.value);
      params.append('ratcon', filters.rating_operator.value);
      params.append('rating', filters.rating.value);
      params.append('status', filters.status.value);
      params.append('sort', filters.sort.value);
      params.append('page', pageNo.toString());
      url += `?${params.toString()}`;
    } else {
      // Endpoint por defecto para "popular" (sin filtros)
      url = `${this.site}search-adv?ctgcon=and&totalchapter=0&ratcon=min&rating=0&status=-1&sort=rank-top&page=${pageNo}`;
    }

    const loadedCheerio = await this.getCheerio(url, false);

    // Selector diferente para latest-release-novels vs search-adv
    const novelSelector = showLatestNovels
      ? '.novel-list.horizontal .novel-item' // Selector para latest-release-novels
      : '.novel-item'; // Selector para search-adv y popular

    return loadedCheerio(novelSelector)
      .map((index, ele) => {
        // Para latest-release-novels, el título está en .novel-title (texto directo)
        // Para search-adv, está en el atributo 'title' del <a>
        const novelName = showLatestNovels
          ? loadedCheerio(ele).find('.novel-title').text().trim() ||
            loadedCheerio(ele).find('.novel-title > a').attr('title') ||
            'No Title Found'
          : loadedCheerio(ele).find('.novel-title > a').attr('title') ||
            loadedCheerio(ele).find('.novel-title > a').text().trim() ||
            loadedCheerio(ele).find('.title > a').attr('title') ||
            loadedCheerio(ele).find('.title > a').text().trim() ||
            loadedCheerio(ele).find('h2.title a').text().trim() ||
            loadedCheerio(ele).find('a').attr('title') ||
            'No Title Found';

        // Probar diferentes atributos para la portada
        const novelCover =
          loadedCheerio(ele).find('.novel-cover > img').attr('data-src') ||
          loadedCheerio(ele).find('.novel-cover > img').attr('src') ||
          loadedCheerio(ele).find('img').attr('data-src') ||
          loadedCheerio(ele).find('img').attr('src');

        const novelHref =
          loadedCheerio(ele).find('.novel-title > a').attr('href') ||
          loadedCheerio(ele).find('.cover-wrap > a').attr('href') ||
          loadedCheerio(ele).find('a').attr('href');

        if (!novelHref) return null;

        const path = this.normalizePath(novelHref, url);
        if (!path) return null;

        return {
          name: novelName,
          cover: novelCover,
          path,
        };
      })
      .get()
      .filter(novel => novel !== null);
  }

  async parseChapters(
    chaptersBasePath: string,
    pages: number,
  ): Promise<Plugin.ChapterItem[]> {
    const pagesArray = Array.from(
      { length: Math.max(1, pages) },
      (_, i) => i + 1,
    );
    const allChapters: Plugin.ChapterItem[] = [];

    // Prefer DataTables AJAX endpoint when present (the HTML table may be empty)
    const base = this.resolveAbsUrl(chaptersBasePath, this.site);
    const referer = base;
    try {
      const chaptersPageRes = await this.fetchWithHeaders(base, referer);
      const chaptersHtml = await chaptersPageRes.text();

      const blockReason = this.detectBlockReason(chaptersHtml);
      if (blockReason) {
        throw new Error(
          `${blockReason}. Open in webview or provide cookies (cf_clearance + novelfirenet_session + XSRF-TOKEN).`,
        );
      }

      const postId = this.extractPostIdFromChaptersHtml(chaptersHtml);

      if (postId) {
        const ajaxUrl = new URL(
          this.resolveAbsUrl('/listChapterDataAjax', this.site),
        );
        let draw = 1;
        let start = 0;
        // Match captured request defaults more closely.
        const length = 20;

        const all: Plugin.ChapterItem[] = [];
        const seenAll = new Set<string>();

        // Loop until we reach recordsTotal or no progress
        // DataTables uses many query params; we provide the essentials.
        for (let guard = 0; guard < 500; guard++) {
          ajaxUrl.search = '';
          ajaxUrl.searchParams.set('post_id', postId);
          ajaxUrl.searchParams.set('draw', String(draw++));
          ajaxUrl.searchParams.set('start', String(start));
          ajaxUrl.searchParams.set('length', String(length));
          ajaxUrl.searchParams.set('order[0][column]', '2');
          ajaxUrl.searchParams.set('order[0][dir]', 'asc');

          // Columns (mirrors captured request)
          ajaxUrl.searchParams.set('columns[0][data]', 'title');
          ajaxUrl.searchParams.set('columns[0][name]', '');
          ajaxUrl.searchParams.set('columns[0][searchable]', 'true');
          ajaxUrl.searchParams.set('columns[0][orderable]', 'false');
          ajaxUrl.searchParams.set('columns[0][search][value]', '');
          ajaxUrl.searchParams.set('columns[0][search][regex]', 'false');

          ajaxUrl.searchParams.set('columns[1][data]', 'created_at');
          ajaxUrl.searchParams.set('columns[1][name]', '');
          ajaxUrl.searchParams.set('columns[1][searchable]', 'true');
          ajaxUrl.searchParams.set('columns[1][orderable]', 'true');
          ajaxUrl.searchParams.set('columns[1][search][value]', '');
          ajaxUrl.searchParams.set('columns[1][search][regex]', 'false');

          ajaxUrl.searchParams.set('columns[2][data]', 'n_sort');
          ajaxUrl.searchParams.set('columns[2][name]', '');
          ajaxUrl.searchParams.set('columns[2][searchable]', 'false');
          ajaxUrl.searchParams.set('columns[2][orderable]', 'true');
          ajaxUrl.searchParams.set('columns[2][search][value]', '');
          ajaxUrl.searchParams.set('columns[2][search][regex]', 'false');

          ajaxUrl.searchParams.set('search[value]', '');
          ajaxUrl.searchParams.set('search[regex]', 'false');

          // Cache-buster used by DataTables in browsers
          ajaxUrl.searchParams.set('_', String(Date.now()));

          const r = await this.fetchAjax(ajaxUrl.toString(), referer);
          if (!r.ok) break;

          const contentType = (
            r.headers.get('content-type') || ''
          ).toLowerCase();
          let payload: any = null;
          if (contentType.includes('application/json')) {
            payload = await r.json().catch(() => null);
          } else {
            const text = await r.text().catch(() => '');
            const ajaxBlockReason = this.detectBlockReason(text);
            if (ajaxBlockReason) {
              throw new Error(
                `${ajaxBlockReason}. Open in webview or provide cookies (cf_clearance + novelfirenet_session + XSRF-TOKEN).`,
              );
            }
            payload = null;
          }
          if (!payload) break;

          const batch = this.extractChapterItemsFromAjaxPayload(
            payload,
            referer,
          );
          let added = 0;
          for (const c of batch) {
            if (!c?.path || seenAll.has(c.path)) continue;
            seenAll.add(c.path);
            all.push(c);
            added++;
          }

          const recordsTotal =
            typeof payload.recordsTotal === 'number'
              ? payload.recordsTotal
              : typeof payload.recordsFiltered === 'number'
                ? payload.recordsFiltered
                : undefined;

          start += length;
          const doneByTotal = recordsTotal != null && start >= recordsTotal;

          if (doneByTotal) break;
          if (added === 0) break;
        }

        if (all.length) return all;
      }
    } catch {
      // ignore and fallback to HTML parsing
    }

    // Function to parse a single page (HTML fallback)
    const parsePage = async (page: number) => {
      const url = `${base}${base.includes('?') ? '&' : '?'}page=${page}`;
      const result = await this.fetchWithHeaders(url, base);
      const body = await result.text();

      const loadedCheerio = load(body);

      if (loadedCheerio.text().includes('You are being rate limited')) {
        throw new NovelFireThrottlingError();
      }

      const chapters: Plugin.ChapterItem[] = [];
      const seen = new Set<string>();

      // Nuevo layout: tabla DataTables
      loadedCheerio('#listChapter-table tbody tr td a[href]').each((_, a) => {
        const href = loadedCheerio(a).attr('href');
        if (!href) return;
        const abs = this.resolveAbsUrl(href, url);
        const path = this.toPath(abs);
        if (!path || seen.has(path)) return;

        const name =
          loadedCheerio(a).text().trim() ||
          loadedCheerio(a).attr('title') ||
          'No Title Found';
        seen.add(path);
        chapters.push({ name, path });
      });

      // Fallback antiguo: lista .chapter-list
      if (!chapters.length) {
        loadedCheerio('.chapter-list li a[href]').each((_, a) => {
          const href = loadedCheerio(a).attr('href');
          if (!href) return;
          const abs = this.resolveAbsUrl(href, url);
          const path = this.toPath(abs);
          if (!path || seen.has(path)) return;

          const name =
            loadedCheerio(a).attr('title') ||
            loadedCheerio(a).text().trim() ||
            'No Title Found';
          seen.add(path);
          chapters.push({ name, path });
        });
      }

      return chapters;
    };

    // When pages > ~30, we get rate limited. To mitigate, split into chunks and retry chunk on rate limit with delay.
    const chunkSize = 5; // 5 pages per chunk was tested to be a good balance between speed and rate limiting.
    const retryCount = 10;
    const sleepTime = 3.5; // Rate limit seems to be around ~10s, so usually 3 retries should be enough for another ~30 pages.

    const chaptersArray: Plugin.ChapterItem[][] = [];

    for (let i = 0; i < pagesArray.length; i += chunkSize) {
      const pagesArrayChunk = pagesArray.slice(i, i + chunkSize);

      const firstPage = pagesArrayChunk[0];
      const lastPage = pagesArrayChunk[pagesArrayChunk.length - 1];

      let attempt = 0;

      while (attempt < retryCount) {
        try {
          // Parse all pages in chunk in parallel
          const chaptersArrayChunk = await Promise.all(
            pagesArrayChunk.map(parsePage),
          );

          chaptersArray.push(...chaptersArrayChunk);
          break;
        } catch (err) {
          if (err instanceof NovelFireThrottlingError) {
            attempt += 1;
            console.warn(
              `[pages=${firstPage}-${lastPage}] Novel Fire is rate limiting requests. Retry attempt ${attempt + 1} in ${sleepTime} seconds...`,
            );
            if (attempt === retryCount) {
              throw err;
            }

            // Sleep for X second before retrying
            await new Promise(resolve => setTimeout(resolve, sleepTime * 1000));
          } else {
            throw err;
          }
        }
      }
    }

    // Merge all chapters into a single array (dedupe entre páginas)
    const seenAll = new Set<string>();
    for (const chapters of chaptersArray) {
      for (const c of chapters) {
        if (!c?.path || seenAll.has(c.path)) continue;
        seenAll.add(c.path);
        allChapters.push(c);
      }
      // Si la paginación realmente no cambia el HTML, evitamos recorrer páginas de más
      if (chapters.length === 0) break;
    }

    if (allChapters.length === 0) {
      throw new Error(
        'Could not parse chapters page. If Cloudflare blocks you, provide cookies (cf_clearance + novelfirenet_session + XSRF-TOKEN) and ensure Cookie is a single-line “k=v; k2=v2” string.',
      );
    }

    return allChapters;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const novelUrl = this.resolveAbsUrl(novelPath, this.site);
    const $ = await this.getCheerio(novelUrl, false);
    const baseUrl = this.site;

    const novel: Partial<Plugin.SourceNovel> = {
      path: novelPath,
    };

    novel.name =
      $('.novel-title').text().trim() ??
      $('.cover > img').attr('alt') ??
      'No Titled Found';
    const coverUrl =
      $('.cover > img').attr('data-src') ?? $('.cover > img').attr('src');

    if (coverUrl) {
      novel.cover = new URL(coverUrl, baseUrl).href;
    }

    novel.genres = $('.categories .property-item')
      .map((i, el) => $(el).text())
      .toArray()
      .join(',');

    let summary = $('.summary .content').text().trim();

    if (summary) {
      summary = summary.replace('Show More', '');
      novel.summary = summary;
    } else {
      novel.summary = 'No Summary Found';
    }

    novel.author =
      $('.author .property-item > span').text() || 'No Author Found';

    const rawStatus =
      $('.header-stats .ongoing').text() ||
      $('.header-stats .completed').text() ||
      'Unknown';
    const map: Record<string, string> = {
      ongoing: NovelStatus.Ongoing,
      hiatus: NovelStatus.OnHiatus,
      dropped: NovelStatus.Cancelled,
      cancelled: NovelStatus.Cancelled,
      completed: NovelStatus.Completed,
      unknown: NovelStatus.Unknown,
    };
    novel.status = map[rawStatus.toLowerCase()] ?? NovelStatus.Unknown;

    const totalChaptersText = $('.header-stats .icon-book-open')
      .parent()
      .text()
      .trim();

    // La página de la novela ahora suele enlazar explícitamente a /chapters
    const chaptersHref = $(
      'a.grdbtn.chapter-latest-container[href], a.chapter-latest-container[href]',
    )
      .first()
      .attr('href');

    const chaptersBasePath = chaptersHref
      ? this.toPath(this.resolveAbsUrl(chaptersHref, novelUrl))
      : `${this.toPath(novelUrl).replace(/\/$/, '')}/chapters`;

    // Heurística de páginas: antes era 100 por página; mantenemos eso como fallback.
    const totalChaptersNum = parseInt(
      (totalChaptersText || '').replace(/[^0-9]/g, ''),
      10,
    );
    const pages = totalChaptersNum ? Math.ceil(totalChaptersNum / 100) : 1;
    novel.chapters = await this.parseChapters(chaptersBasePath, pages);

    return novel as Plugin.SourceNovel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.resolveAbsUrl(chapterPath, this.site);
    const referer = this.inferChaptersRefererFromPath(url);
    const result = await this.fetchWithHeaders(url, referer);
    const body = await result.text();

    const blockReason = this.detectBlockReason(body);
    if (blockReason) {
      throw new Error(
        `${blockReason}. Provide cookies (cf_clearance + novelfirenet_session + XSRF-TOKEN) and use the novel /chapters page as referer.`,
      );
    }

    const loadedCheerio = load(body);

    const bloatElements = [
      '.box-ads',
      '.box-notification',
      /^nf/, // Regular expression to match tags starting with 'nf'
    ];
    bloatElements.forEach(tag => {
      if (tag instanceof RegExp) {
        loadedCheerio('*')
          .filter((_, el) =>
            tag.test(loadedCheerio(el).prop('tagName')!.toLowerCase()),
          )
          .remove();
      } else {
        loadedCheerio(tag).remove();
      }
    });

    const html =
      loadedCheerio('#content').html() ||
      loadedCheerio('.chapter-content').html() ||
      loadedCheerio('article').html();

    if (!html) {
      throw new Error(
        'Could not parse chapter content. If Cloudflare blocks you, provide cookies (cf_clearance) and session cookies.',
      );
    }

    return html;
  }

  async searchNovels(
    searchTerm: string,
    page: number,
  ): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}search?keyword=${encodeURIComponent(searchTerm)}&page=${page}`;
    const result = await this.fetchWithHeaders(url, this.site);
    const body = await result.text();

    const loadedCheerio = load(body);

    return loadedCheerio('.novel-list.chapters .novel-item')
      .map((index, ele) => {
        const novelName =
          loadedCheerio(ele).find('a').attr('title') || 'No Title Found';
        const novelCover = loadedCheerio(ele)
          .find('.novel-cover > img')
          .attr('src');
        const novelHref = loadedCheerio(ele).find('a').attr('href');

        if (!novelHref) return null;

        const path = this.normalizePath(novelHref, url);
        if (!path) return null;

        return {
          name: novelName,
          cover: novelCover,
          path,
        };
      })
      .get()
      .filter(novel => novel !== null);
  }

  filters = {
    sort: {
      label: 'Sort Results By',
      value: 'rank-top',
      options: [
        { label: 'Rank (Top)', value: 'rank-top' },
        { label: 'Rating Score (Top)', value: 'rating-score-top' },
        { label: 'Bookmark Count (Most)', value: 'bookmark' },
        { label: 'Review Count (Most)', value: 'review' },
        { label: 'Title (A>Z)', value: 'abc' },
        { label: 'Title (Z>A)', value: 'cba' },
        { label: 'Last Updated (Newest)', value: 'date' },
        { label: 'Chapter Count (Most)', value: 'chapter-count-most' },
      ],
      type: FilterTypes.Picker,
    },
    status: {
      label: 'Translation Status',
      value: '-1',
      options: [
        { label: 'All', value: '-1' },
        { label: 'Completed', value: '1' },
        { label: 'Ongoing', value: '0' },
      ],
      type: FilterTypes.Picker,
    },
    genre_operator: {
      label: 'Genres (And/Or)',
      value: 'and',
      options: [
        { label: 'And', value: 'and' },
        { label: 'Or', value: 'or' },
      ],
      type: FilterTypes.Picker,
    },
    genres: {
      label: 'Genres',
      value: [],
      options: [
        { label: 'Action', value: '3' },
        { label: 'Adult', value: '28' },
        { label: 'Adventure', value: '4' },
        { label: 'Anime', value: '46' },
        { label: 'Arts', value: '47' },
        { label: 'Comedy', value: '5' },
        { label: 'Drama', value: '24' },
        { label: 'Eastern', value: '44' },
        { label: 'Ecchi', value: '26' },
        { label: 'Fan-fiction', value: '48' },
        { label: 'Fantasy', value: '6' },
        { label: 'Game', value: '19' },
        { label: 'Gender Bender', value: '25' },
        { label: 'Harem', value: '7' },
        { label: 'Historical', value: '12' },
        { label: 'Horror', value: '37' },
        { label: 'Isekai', value: '49' },
        { label: 'Josei', value: '2' },
        { label: 'Lgbt+', value: '45' },
        { label: 'Magic', value: '50' },
        { label: 'Magical Realism', value: '51' },
        { label: 'Manhua', value: '52' },
        { label: 'Martial Arts', value: '15' },
        { label: 'Mature', value: '8' },
        { label: 'Mecha', value: '34' },
        { label: 'Military', value: '53' },
        { label: 'Modern Life', value: '54' },
        { label: 'Movies', value: '55' },
        { label: 'Mystery', value: '16' },
        { label: 'Psychological', value: '9' },
        { label: 'Realistic Fiction', value: '56' },
        { label: 'Reincarnation', value: '43' },
        { label: 'Romance', value: '1' },
        { label: 'School Life', value: '21' },
        { label: 'Sci-fi', value: '20' },
        { label: 'Seinen', value: '10' },
        { label: 'Shoujo', value: '38' },
        { label: 'Shoujo Ai', value: '57' },
        { label: 'Shounen', value: '17' },
        { label: 'Shounen Ai', value: '39' },
        { label: 'Slice of Life', value: '13' },
        { label: 'Smut', value: '29' },
        { label: 'Sports', value: '42' },
        { label: 'Supernatural', value: '18' },
        { label: 'System', value: '58' },
        { label: 'Tragedy', value: '32' },
        { label: 'Urban', value: '63' },
        { label: 'Urban Life', value: '59' },
        { label: 'Video Games', value: '60' },
        { label: 'War', value: '61' },
        { label: 'Wuxia', value: '31' },
        { label: 'Xianxia', value: '23' },
        { label: 'Xuanhuan', value: '22' },
        { label: 'Yaoi', value: '14' },
        { label: 'Yuri', value: '62' },
      ],
      type: FilterTypes.CheckboxGroup,
    },
    language: {
      label: 'Language',
      value: [],
      options: [
        { label: 'Chinese', value: '1' },
        { label: 'Korean', value: '2' },
        { label: 'Japanese', value: '3' },
        { label: 'English', value: '4' },
      ],
      type: FilterTypes.CheckboxGroup,
    },
    rating_operator: {
      label: 'Rating (Min/Max)',
      value: 'min',
      options: [
        { label: 'Min', value: 'min' },
        { label: 'Max', value: 'max' },
      ],
      type: FilterTypes.Picker,
    },
    rating: {
      label: 'Rating',
      value: '0',
      options: [
        { label: 'All', value: '0' },
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5', value: '5' },
      ],
      type: FilterTypes.Picker,
    },
    chapters: {
      label: 'Chapters',
      value: '0',
      options: [
        { label: 'All', value: '0' },
        { label: '<50', value: '1,49' },
        { label: '50-100', value: '50,100' },
        { label: '100-200', value: '100,200' },
        { label: '200-500', value: '200,500' },
        { label: '500-1000', value: '500,1000' },
        { label: '>1000', value: '1001,1000000' },
      ],
      type: FilterTypes.Picker,
    },
  } satisfies Filters;
}

export default new NovelFire();

// Custom error for when Novel Fire is rate limiting requests
class NovelFireThrottlingError extends Error {
  constructor(message = 'Novel Fire is rate limiting requests') {
    super(message);
    this.name = 'NovelFireError';
  }
}
