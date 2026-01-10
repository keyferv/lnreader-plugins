import { load as parseHTML, type CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { fetchApi } from '@libs/fetch';
import { FilterTypes } from '@libs/filterInputs';
import { Plugin } from '@/types/plugin';

function cleanText(input?: string | null) {
  return (input || '').replace(/\s+/g, ' ').trim();
}

function getImgSrc($: CheerioAPI, el: AnyNode | undefined) {
  if (!el) return undefined;
  const img = $(el);
  return (
    img.attr('data-lazy-src') ||
    img.attr('data-src') ||
    img.attr('data-original') ||
    img.attr('src') ||
    undefined
  );
}

function absolutizeUrl(site: string, href: string) {
  try {
    return new URL(href, site).toString();
  } catch {
    return href;
  }
}

function toPath(site: string, fullUrl: string) {
  const normalizedSite = site.replace(/\/$/, '');
  return fullUrl.replace(normalizedSite, '').replace(/^\//, '');
}

class NovelasLigerasNet implements Plugin.PluginBase {
  id = 'novelasligerasnet';
  name = 'Novelas Ligeras (net)';
  icon = 'src/es/novelasligeranet/icon.png';
  site = 'https://novelasligeras.net/';
  version = '1.0.1';

  filters = {
    category: {
      type: FilterTypes.Picker,
      label: 'Categoría',
      value: '',
      options: [
        { label: 'Cualquiera', value: '' },
        { label: 'Acción', value: '40' },
        { label: 'Adulto', value: '53' },
        { label: 'Artes Marciales', value: '52' },
        { label: 'Aventura', value: '41' },
        { label: 'Ciencia Ficción', value: '59' },
        { label: 'Comedia', value: '43' },
        { label: 'Deportes', value: '68' },
        { label: 'Drama', value: '44' },
        { label: 'Ecchi', value: '45' },
        { label: 'Fantasía', value: '46' },
        { label: 'Gender Bender', value: '47' },
        { label: 'Harem', value: '48' },
        { label: 'Histórico', value: '49' },
        { label: 'Horror', value: '50' },
        { label: 'Josei', value: '51' },
        { label: 'Mechas', value: '54' },
        { label: 'Misterio', value: '55' },
        { label: 'Psicológico', value: '56' },
        { label: 'Recuentos de la Vida', value: '66' },
        { label: 'Romance', value: '57' },
        { label: 'Seinen', value: '60' },
        { label: 'Shojo', value: '62' },
        { label: 'Shojo Ai', value: '63' },
        { label: 'Shonen', value: '64' },
        { label: 'Smut', value: '67' },
        { label: 'Sobrenatural', value: '69' },
        { label: 'Tragedia', value: '70' },
        { label: 'Vida Escolar', value: '58' },
        { label: 'Xianxia', value: '72' },
        { label: 'Xuanhuan', value: '73' },
        { label: 'Yuri', value: '75' },
      ],
    },
    status: {
      type: FilterTypes.Picker,
      label: 'Estado',
      value: '',
      options: [
        { label: 'Cualquiera', value: '' },
        { label: 'Cancelado', value: '18' },
        { label: 'Completado', value: '407' },
        { label: 'En Proceso', value: '16' },
        { label: 'Pausado', value: '17' },
      ],
    },
    type: {
      type: FilterTypes.Picker,
      label: 'Tipo',
      value: '',
      options: [
        { label: 'Cualquiera', value: '' },
        { label: 'Novela Ligera', value: '23' },
        { label: 'Novela Web', value: '24' },
      ],
    },
    country: {
      type: FilterTypes.Picker,
      label: 'País',
      value: '',
      options: [
        { label: 'Cualquiera', value: '' },
        { label: 'China', value: '20' },
        { label: 'Corea', value: '22' },
        { label: 'Japón', value: '21' },
      ],
    },
  };

  resolveUrl(path: string) {
    try {
      return new URL(path, this.site).toString();
    } catch {
      return path;
    }
  }

  private async getDocument(url: string) {
    const res = await fetchApi(url, {
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(
        `Could not reach site (${res.status}). If this is Cloudflare-protected, open in webview or provide cookies (cf_clearance) in Settings.`,
      );
    }

    const html = await res.text();
    return parseHTML(html);
  }

  private extractNovelCandidates(
    $: CheerioAPI,
    options: { max?: number } = {},
  ) {
    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    const maxItems = options.max || 30;

    const pushNovel = (name: string, url: string, cover?: string) => {
      const abs = absolutizeUrl(this.site, url);
      const path = toPath(this.site, abs);
      if (!path || seen.has(path)) return;
      const cleanName = cleanText(name);
      if (!cleanName) return;
      seen.add(path);
      novels.push({ name: cleanName, path, cover });
    };

    const looksLikeNovelUrl = (href: string) => {
      const h = href.toLowerCase();
      if (h.includes('wp-login') || h.includes('wp-admin')) return false;
      if (
        h.includes('#') ||
        h.startsWith('javascript:') ||
        h.startsWith('data:') ||
        h.startsWith('vbscript:')
      )
        return false;
      if (h.includes('mailto:') || h.includes('tel:')) return false;
      if (h.includes('/category/') || h.includes('/tag/')) return false;
      if (h.includes('/feed/') || h.includes('rss')) return false;
      // Common slugs
      return (
        h.includes('/producto/') ||
        h.includes('/product/') ||
        h.includes('novela') ||
        h.includes('novel') ||
        h.includes('serie') ||
        h.includes('series')
      );
    };

    // Prefer dt-css-grid (WooCommerce product grid)
    $('.dt-css-grid .wf-cell').each((_idx: number, cell: AnyNode) => {
      const a = $(cell).find('h4.entry-title a[href]').first();
      const href = a.attr('href');
      if (!href) return;
      const abs = absolutizeUrl(this.site, href);
      if (!abs.includes('novelasligeras.net')) return;
      if (!looksLikeNovelUrl(abs)) return;

      const name =
        cleanText($(cell).attr('data-name')) ||
        cleanText(a.text()) ||
        cleanText(a.attr('title'));

      const cover =
        getImgSrc($, $(cell).find('img.attachment-woocommerce_thumbnail')[0]) ||
        getImgSrc($, $(cell).find('figure.woocom-project img')[0]) ||
        undefined;

      pushNovel(name, abs, cover);
    });

    if (novels.length) return novels.slice(0, maxItems);

    // Prefer article/title patterns (WordPress-ish)
    const selectors = [
      'article h2 a[href]',
      'article h3 a[href]',
      'article h4 a[href]',
      'h4.entry-title a[href]',
      '.entry-content a[href]',
      'main a[href]',
    ];

    for (const sel of selectors) {
      $(sel).each((_idx: number, a: AnyNode) => {
        const href = $(a).attr('href');
        if (!href) return;
        const abs = absolutizeUrl(this.site, href);
        if (!abs.includes('novelasligeras.net')) return;
        if (!looksLikeNovelUrl(abs)) return;

        const name = cleanText($(a).text()) || cleanText($(a).attr('title'));
        const cover =
          getImgSrc($, $(a).find('img')[0]) ||
          getImgSrc($, $(a).closest('article').find('img')[0]);

        pushNovel(name, abs, cover);
      });
      if (novels.length >= maxItems) break;
    }

    return novels.slice(0, maxItems);
  }

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels,
      filters,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const base = this.site + 'index.php/lista-de-novela-ligera-novela-web/';

    const params = new URLSearchParams();
    params.set('paged', String(pageNo));

    // URLs confirmadas por ti:
    // - Recientes: /lista-de-novela-ligera-novela-web/
    // - Popular:   /lista-de-novela-ligera-novela-web/?orderby=popularity
    if (!showLatestNovels) params.set('orderby', 'popularity');

    if (filters) {
      if (filters.category?.value)
        params.set('product-search-filter-product_cat', filters.category.value);
      if (filters.status?.value)
        params.set('product-search-filter-pa_estado', filters.status.value);
      if (filters.type?.value)
        params.set('product-search-filter-pa_tipo', filters.type.value);
      if (filters.country?.value)
        params.set('product-search-filter-pa_pais', filters.country.value);
    }

    const listUrl = `${base}?${params.toString()}`;
    const $ = await this.getDocument(listUrl);
    const novels = this.extractNovelCandidates($, { max: 30 });

    // Fallback: homepage
    if (!novels.length) {
      const $home = await this.getDocument(this.site);
      return this.extractNovelCandidates($home, { max: 30 });
    }

    return novels;
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const params = new URLSearchParams();
    params.set('s', searchTerm);
    params.set('post_type', 'product');
    params.set('paged', String(pageNo));
    const url = `${this.site}?${params.toString()}`;
    const $ = await this.getDocument(url);

    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    $('article').each((_idx: number, article: AnyNode) => {
      const a = $(article).find('h2 a[href], h3 a[href], h4 a[href]').first();
      const href = a.attr('href');
      if (!href) return;
      const abs = absolutizeUrl(this.site, href);
      const path = toPath(this.site, abs);
      if (!path || seen.has(path)) return;
      const name = cleanText(a.text()) || cleanText(a.attr('title'));
      if (!name) return;

      const cover =
        getImgSrc($, $(article).find('img')[0]) ||
        $(article).find('meta[property="og:image"]').attr('content') ||
        undefined;

      seen.add(path);
      novels.push({ name, path, cover });
    });

    if (novels.length) return novels;

    // Broad fallback
    return this.extractNovelCandidates($, { max: 30 });
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = this.resolveUrl(novelPath);
    const $ = await this.getDocument(url);

    const name =
      cleanText($('h1.entry-title').first().text()) ||
      cleanText($('h1').first().text()) ||
      cleanText($('meta[property="og:title"]').attr('content')) ||
      novelPath;

    const cover =
      $('meta[property="og:image"]').attr('content') ||
      getImgSrc($, $('img.wp-post-image')[0]) ||
      getImgSrc($, $('article img')[0]) ||
      undefined;

    const summary =
      cleanText($('meta[property="og:description"]').attr('content')) ||
      cleanText(
        $('article .entry-content p')
          .slice(0, 5)
          .toArray()
          .map(p => $(p).text())
          .join('\n'),
      ) ||
      cleanText($('.entry-content').text());

    const novel: Plugin.SourceNovel = {
      name,
      path: novelPath,
      cover,
      summary,
    };

    // Author/status/genres heuristics
    const infoText = cleanText($('article').text());
    const authorMatch = infoText.match(/Autor\s*:?\s*([^\n\r]+)/i);
    if (authorMatch?.[1]) novel.author = cleanText(authorMatch[1]);

    const statusMatch = infoText.match(/Estado\s*:?\s*([^\n\r]+)/i);
    if (statusMatch?.[1]) novel.status = cleanText(statusMatch[1]);

    // Chapters
    const chapterLinks: { name: string; href: string }[] = [];
    const chapterSelectors = [
      '.wp-manga-chapter a[href]',
      '.chapter-list a[href]',
      '.chapters a[href]',
      '.woocommerce-product-details__short-description a[href]',
      '.entry-summary a[href]',
      'ol li a[href]',
      'ul li a[href]',
    ];

    const looksLikeChapterUrl = (href: string) => {
      const h = href.toLowerCase();
      if (!h.includes('novelasligeras.net')) return false;
      if (
        h.includes('#') ||
        h.startsWith('javascript:') ||
        h.startsWith('data:') ||
        h.startsWith('vbscript:')
      )
        return false;
      // Ejemplo real: /index.php/2025/09/17/shadow-slave-cap-1-novela-web-2/
      const looksDatedPost = /\/index\.php\/20\d{2}\/\d{2}\/\d{2}\//.test(h);
      return (
        looksDatedPost ||
        h.includes('-cap-') ||
        h.includes('/cap-') ||
        h.includes('capitulo') ||
        h.includes('cap') ||
        h.includes('chapter') ||
        h.includes('epis')
      );
    };

    for (const sel of chapterSelectors) {
      $(sel).each((_idx: number, a: AnyNode) => {
        const href = $(a).attr('href');
        if (!href) return;
        const abs = absolutizeUrl(this.site, href);
        if (!looksLikeChapterUrl(abs)) return;
        const title = cleanText($(a).text()) || cleanText($(a).attr('title'));
        if (!title) return;
        chapterLinks.push({ name: title, href: abs });
      });
      if (chapterLinks.length) break;
    }

    // If nothing matched, fallback to any link in entry-content that looks like chapter
    if (!chapterLinks.length) {
      $('.entry-content a[href]').each((_idx: number, a: AnyNode) => {
        const href = $(a).attr('href');
        if (!href) return;
        const abs = absolutizeUrl(this.site, href);
        if (!looksLikeChapterUrl(abs)) return;
        const title = cleanText($(a).text()) || cleanText($(a).attr('title'));
        if (!title) return;
        chapterLinks.push({ name: title, href: abs });
      });
    }

    // Fallback extra para páginas tipo /producto/: cualquier link dentro del contenido que parezca capítulo
    if (!chapterLinks.length) {
      $('a[href]').each((_idx: number, a: AnyNode) => {
        const href = $(a).attr('href');
        if (!href) return;
        const abs = absolutizeUrl(this.site, href);
        if (!looksLikeChapterUrl(abs)) return;

        const title = cleanText($(a).text()) || cleanText($(a).attr('title'));
        if (!title) return;
        chapterLinks.push({ name: title, href: abs });
      });
    }

    const seenChapter = new Set<string>();
    const chapters: Plugin.ChapterItem[] = [];
    chapterLinks.forEach((c, idx) => {
      const path = toPath(this.site, c.href);
      if (!path || seenChapter.has(path)) return;
      seenChapter.add(path);
      chapters.push({
        name: c.name,
        path,
        chapterNumber: idx + 1,
        releaseTime: null,
      });
    });

    if (chapters.length) novel.chapters = chapters;

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.resolveUrl(chapterPath);
    const $ = await this.getDocument(url);

    // Remove common junk
    $('script, style, noscript, iframe').remove();
    $('.ads, .ad, .advertisement, .sharedaddy, .wp-block-buttons').remove();
    $('header, nav, footer').remove();

    const containers = [
      '#chapter-content',
      '.reading-content',
      '.entry-content',
      'article',
      'main',
    ];

    for (const sel of containers) {
      const html = $(sel).first().html();
      if (html && cleanText(html).length > 50) return html;
    }

    return $('.entry-content').html() || '';
  }
}

export default new NovelasLigerasNet();
