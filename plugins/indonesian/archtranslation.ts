import { fetchText } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class ArchTranslation implements Plugin.PluginBase {
  id = 'archtranslation';
  name = 'ArchTranslation';
  site = 'https://www.archtranslation.com';
  icon = 'src/id/archtranslation/icon.png';
  version = '1.0.8'; // Versión con arreglo de enlaces relativos

  async popularNovels(
    pageNo: number,
    { filters }: Plugin.PopularNovelsOptions,
  ): Promise<Plugin.NovelItem[]> {
    let url = `${this.site}/search/label/LN?max-results=6`;

    if (pageNo > 1) {
      let currentUrl = url;
      for (let i = 1; i < pageNo; i++) {
        const pageBody = await fetchText(currentUrl);
        const page$ = loadCheerio(pageBody);
        const nextUrl = page$('.blog-pager-older-link').attr('href');
        if (!nextUrl) {
          return [];
        }
        currentUrl = nextUrl;
      }
      url = currentUrl;
    }

    const body = await fetchText(url);
    const $ = loadCheerio(body);

    const novels: Plugin.NovelItem[] = [];

    $('.blog-post').each((i, el) => {
      let title = $(el).find('.entry-title a').text().trim();
      const path = $(el).find('.entry-title a').attr('href');
      let cover =
        $(el).find('.post-filter-image img').attr('data-src') ||
        $(el).find('.post-filter-image img').attr('src');

      if (cover) {
        cover = cover.replace(/(s\d+(-c)?)|(w\d+-h\d+(-?p-k-no-nu)?)/g, 's0');
      }

      title = title.replace(/(Chapter|Vol|Volume)\s*\d+.*/i, '').trim();

      if (path && title) {
        novels.push({
          name: title,
          path: path.replace(this.site, ''),
          cover: cover || defaultCover,
        });
      }
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    let body = await fetchText(this.site + novelPath);
    let $ = loadCheerio(body);

    let postBody = $('.post-body');
    if (postBody.length === 0) {
      postBody = $('.entry-content');
    }

    // --- 1. EXTRACCIÓN DE PORTADA ---
    let coverUrl = defaultCover;
    // Buscamos primero en el contenedor típico de blogger
    let coverImg = postBody.find('.separator img').first();
    // Si no, la primera imagen que encontremos
    if (coverImg.length === 0) {
      coverImg = postBody.find('img').first();
    }

    let rawCoverUrl = coverImg.attr('data-src') || coverImg.attr('src');
    if (rawCoverUrl) {
      // Asegurar URL absoluta
      if (rawCoverUrl.startsWith('//')) {
        rawCoverUrl = 'https:' + rawCoverUrl;
      } else if (rawCoverUrl.startsWith('/')) {
        rawCoverUrl = this.site + rawCoverUrl;
      }

      // Limpieza de tamaño
      if (rawCoverUrl.match(/\/s\d+.*?\//)) {
        rawCoverUrl = rawCoverUrl.replace(/\/s\d+.*?\//, '/s0/');
      } else if (rawCoverUrl.match(/=(s\d+|w\d+).*?$/)) {
        rawCoverUrl = rawCoverUrl.replace(/=(s\d+|w\d+).*?$/, '=s0');
      }
      coverUrl = rawCoverUrl;
    }

    // --- 2. EXTRACCIÓN DE CAPÍTULOS ---
    const chapters: Plugin.ChapterItem[] = [];
    const chapterSet = new Set<string>();

    const chapterRegex =
      /Chapter|Vol|Prolo|Epilo|Ilustra|Selingan|Short story|Side Story|Extras|Ekstra|Batch|Tamat|Bagian/i;

    postBody.find('a').each((i, el) => {
      let href = $(el).attr('href');
      const text = $(el).text().trim();

      if (href && text) {
        // Normalizar URL a absoluta para pasar los filtros
        if (href.startsWith('//')) href = 'https:' + href;
        else if (href.startsWith('/')) href = this.site + href;

        if (href.includes('archtranslation.com')) {
          // Limpiar parámetros de la URL (?m=1, etc) que causan duplicados
          href = href.split('?')[0];

          const isExcluded =
            href.includes('/search/label') ||
            href.includes('/author/') ||
            href.replace(this.site, '') === novelPath;

          if (chapterRegex.test(text) && !isExcluded) {
            if (!chapterSet.has(href)) {
              chapterSet.add(href);
              chapters.push({
                name: text,
                path: href.replace(this.site, ''),
                releaseTime: null,
                chapterNumber: chapters.length + 1,
              });
            }
          }
        }
      }
    });

    // --- 3. REDIRECCIÓN (Fallback) ---
    // Solo si no encontramos capítulos y parece un post antiguo
    if (chapters.length === 0 && novelPath.match(/\/\d{4}\/\d{2}\//)) {
      let projectUrl: string | undefined;

      $('a[href*="/p/"]').each((_, el) => {
        let href = $(el).attr('href');
        const text = $(el).text().toLowerCase();

        if (href) {
          if (href.startsWith('/')) href = this.site + href;

          if (href.includes(this.site)) {
            if (
              !text.includes('privacy') &&
              !text.includes('dmca') &&
              !text.includes('contact')
            ) {
              const currentTitle = $('.entry-title')
                .text()
                .trim()
                .toLowerCase();
              if (
                currentTitle.includes(text) ||
                text.includes('project') ||
                text.includes('toc') ||
                text.includes('read')
              ) {
                projectUrl = href;
                return false;
              }
            }
          }
        }
      });

      if (projectUrl) {
        const newPath = projectUrl.replace(this.site, '');
        // Evitar bucle infinito si la redirección es a la misma página
        if (newPath !== novelPath) {
          return this.parseNovel(newPath);
        }
      }
    }

    // --- 4. METADATOS ---
    let contentText = '';
    postBody.find('div, p, span, h4').each((_, el) => {
      const t = $(el).text().trim();
      if (t) contentText += t + '\n';
    });

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('.entry-title').text().trim() || 'Untitled',
      cover: coverUrl,
      chapters: chapters,
    };

    const authorMatch = contentText.match(/Author\s*:\s*(.+)/i);
    const artistMatch = contentText.match(/Artist\s*:\s*(.+)/i);
    const genreMatch = contentText.match(/Genre\s*:\s*(.+)/i);
    const statusMatch = contentText.match(/Status\s*:\s*(.+)/i);

    if (authorMatch) novel.author = authorMatch[1].trim();
    if (artistMatch) novel.artist = artistMatch[1].trim();
    if (genreMatch) novel.genres = genreMatch[1].trim();
    if (statusMatch) {
      const status = statusMatch[1].toLowerCase();
      if (status.includes('ongoing')) novel.status = NovelStatus.Ongoing;
      else if (status.includes('completed'))
        novel.status = NovelStatus.Completed;
      else if (status.includes('hiatus')) novel.status = NovelStatus.OnHiatus;
      else novel.status = NovelStatus.Unknown;
    }

    const sinopsisIndex = contentText.toLowerCase().indexOf('sinopsis');
    if (sinopsisIndex !== -1) {
      let summary = contentText.substring(sinopsisIndex + 9);
      const nextSectionMatch = summary.match(
        /(Volume \d+|Chapter \d+|Prolo(g|ue))/i,
      );
      if (nextSectionMatch && nextSectionMatch.index) {
        summary = summary.substring(0, nextSectionMatch.index);
      }
      novel.summary = summary.trim();
    } else {
      novel.summary = contentText.substring(0, 300) + '...';
    }

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const body = await fetchText(this.site + chapterPath);
    const $ = loadCheerio(body);

    const content = $('.post-body');

    content
      .find(
        '#bottom-ad-placeholder, .widget, .adsbygoogle, script, #related-post, .post-footer',
      )
      .remove();
    content.find('.btn, .separator a').remove();

    content.find('a').each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (
        text === 'previous' ||
        text === 'next' ||
        text === 'contents' ||
        text.includes('daftar isi')
      ) {
        $(el).remove();
      }
    });

    content.find('img').each((i, el) => {
      const dataSrc = $(el).attr('data-src');
      if (dataSrc) {
        $(el).attr('src', dataSrc);
        $(el).removeAttr('data-src');
      }

      let src = $(el).attr('src');
      if (src) {
        if (src.includes('blogger.googleusercontent.com')) {
          src = src.replace(/\/s\d+.*?\//, '/s1600/');
          src = src.replace(/=s\d+.*?$/, '=s1600');
        }
        $(el).attr('src', src);
      }

      $(el).removeAttr('style');
      $(el).removeAttr('height');
      $(el).removeAttr('width');
    });

    content.find('.separator').removeAttr('style').css('text-align', 'center');

    return content.html() || '';
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}/search?q=${encodeURIComponent(
      searchTerm,
    )}&max-results=20&start=${(pageNo - 1) * 20}`;
    const body = await fetchText(url);
    const $ = loadCheerio(body);

    const novels: Plugin.NovelItem[] = [];

    $('.blog-post').each((i, el) => {
      let title = $(el).find('.entry-title a').text().trim();
      const path = $(el).find('.entry-title a').attr('href');
      let cover =
        $(el).find('.post-filter-image img').attr('src') ||
        $(el).find('.post-filter-image img').attr('data-src');

      if (cover) {
        cover = cover.replace(/(s\d+(-c)?)|(w\d+-h\d+(-?p-k-no-nu)?)/g, 's0');
      }

      title = title.replace(/(Chapter|Vol|Volume)\s*\d+.*/i, '').trim();

      if (path && title) {
        novels.push({
          name: title,
          path: path.replace(this.site, ''),
          cover: cover || defaultCover,
        });
      }
    });

    return novels;
  }
}

export default new ArchTranslation();
