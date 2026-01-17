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
  version = '1.1.1'; // Agrupación por Volúmenes

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

      let img = $(el).find('.post-filter-image img');
      if (img.length === 0) img = $(el).find('img');

      let cover = img.first().attr('data-src') || img.first().attr('src');

      if (cover) {
        if (cover.startsWith('//')) cover = 'https:' + cover;
        cover = cover.replace(/=[^=]+$/, '=s0');
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

    // Selectores seguros
    let postBody = $('#postBody');
    if (postBody.length === 0) postBody = $('.post-body');
    if (postBody.length === 0) postBody = $('.entry-content');

    // --- 1. EXTRACCIÓN DE PORTADA ---
    let coverUrl = defaultCover;
    let coverImg = postBody.find('.separator img').first();
    if (coverImg.length === 0) coverImg = postBody.find('img').first();

    let rawCoverUrl = coverImg.attr('data-src') || coverImg.attr('src');
    if (rawCoverUrl) {
      if (rawCoverUrl.startsWith('//')) rawCoverUrl = 'https:' + rawCoverUrl;
      else if (rawCoverUrl.startsWith('/'))
        rawCoverUrl = this.site + rawCoverUrl;
      rawCoverUrl = rawCoverUrl.replace(/=[^=]+$/, '=s0');
      coverUrl = rawCoverUrl;
    }

    // --- 2. EXTRACCIÓN DE CAPÍTULOS CON VOLÚMENES ---
    const chapters: Plugin.ChapterItem[] = [];
    const chapterSet = new Set<string>();
    let currentVolume = ''; // Variable para guardar el volumen actual

    const chapterRegex =
      /Chapter|Vol|Prolo|Epilo|Ilustra|Selingan|Short story|Side Story|Extras|Ekstra|Batch|Tamat|Bagian/i;

    // Recorremos TODOS los elementos en orden para detectar encabezados de volumen
    postBody.find('*').each((i, el) => {
      const $el = $(el);

      // A) Detección de Cabecera de Volumen
      // Si el elemento contiene texto como "Volume 1", actualizamos currentVolume
      // Ignoramos enlaces para esto, solo texto plano o contenedores
      if (el.tagName !== 'a') {
        const text = $el.text().trim();
        // Regex estricto: Debe ser "Volume X" o "Vol X" exacto
        if (/^(Volume|Vol\.?)\s*\d+$/i.test(text)) {
          currentVolume = text;
          return;
        }
      }

      // B) Detección de Capítulo
      if (el.tagName === 'a') {
        let href = $el.attr('href');
        const text = $el.text().trim();

        if (href && text) {
          if (href && href.startsWith('//')) href = 'https:' + href;
          else if (href && href.startsWith('/')) href = this.site + href;

          if (href && href.includes('archtranslation.com')) {
            href = href.split('?')[0];

            const isExcluded =
              href.includes('/search/label') ||
              href.includes('/author/') ||
              href.replace(this.site, '') === novelPath;

            if (chapterRegex.test(text) && !isExcluded) {
              if (!chapterSet.has(href)) {
                chapterSet.add(href);

                // Construimos el nombre final
                let displayName = text;
                if (currentVolume) {
                  displayName = `${currentVolume} ${text}`;
                }

                chapters.push({
                  name: displayName,
                  path: href.replace(this.site, ''),
                  releaseTime: null,
                  chapterNumber: chapters.length + 1,
                  volume: currentVolume || undefined, // Agrupa en la UI si la app lo soporta
                });
              }
            }
          }
        }
      }
    });

    // --- 3. REDIRECCIÓN (Fallback) ---
    if (chapters.length === 0 && novelPath.match(/\/\d{4}\/\d{2}\//)) {
      let projectUrl: string | undefined;

      $('a[href*="/p/"]').each((_, el) => {
        let href = $(el).attr('href');
        const text = $(el).text().toLowerCase();
        if (href && href.includes(this.site)) {
          if (!text.includes('privacy') && !text.includes('dmca')) {
            const currentTitle = $('.entry-title').text().trim().toLowerCase();
            if (
              currentTitle.includes(text) ||
              text.includes('project') ||
              text.includes('toc')
            ) {
              projectUrl = href;
              return false;
            }
          }
        }
      });

      if (projectUrl) {
        const newPath = projectUrl.replace(this.site, '');
        if (newPath !== novelPath) return this.parseNovel(newPath);
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
          src = src.replace(/=[^=]+$/, '=s1600');
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

      let img = $(el).find('.post-filter-image img');
      if (img.length === 0) img = $(el).find('img');

      let cover = img.first().attr('data-src') || img.first().attr('src');

      if (cover) {
        if (cover.startsWith('//')) cover = 'https:' + cover;
        cover = cover.replace(/=[^=]+$/, '=s0');
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
