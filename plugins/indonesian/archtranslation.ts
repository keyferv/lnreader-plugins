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
  version = '1.0.4';

  async popularNovels(
    pageNo: number,
    { filters }: Plugin.PopularNovelsOptions,
  ): Promise<Plugin.NovelItem[]> {
    // Blogspot uses token-based pagination (updated-max), not simple offset
    // We need to follow the chain of "Older Posts" links
    let url = `${this.site}/search/label/LN?max-results=6`;

    // For pages > 1, follow the pagination chain
    if (pageNo > 1) {
      let currentUrl = url;
      for (let i = 1; i < pageNo; i++) {
        const pageBody = await fetchText(currentUrl);
        const page$ = loadCheerio(pageBody);
        const nextUrl = page$('.blog-pager-older-link').attr('href');
        if (!nextUrl) {
          return []; // No more pages available
        }
        currentUrl = nextUrl;
      }
      url = currentUrl;
    }

    const body = await fetchText(url);
    const $ = loadCheerio(body);

    const novels: Plugin.NovelItem[] = [];

    $('.blog-post').each((i, el) => {
      const title = $(el).find('.entry-title a').text().trim();
      const path = $(el).find('.entry-title a').attr('href');
      let cover =
        $(el).find('.post-filter-image img').attr('data-src') ||
        $(el).find('.post-filter-image img').attr('src');

      if (cover) {
        cover = cover.replace(/(s\d+(-c)?)|(w\d+-h\d+(-?p-k-no-nu)?)/g, 's0');
      }

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
    const body = await fetchText(this.site + novelPath);
    const $ = loadCheerio(body);
    const postBody = $('.post-body');

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('.entry-title').text().trim() || 'Untitled',
      cover: defaultCover,
      chapters: [],
    };

    const coverImg = postBody.find('img').first();
    let coverUrl = coverImg.attr('data-src') || coverImg.attr('src');
    if (coverUrl) {
      coverUrl = coverUrl.replace(
        /(s\d+(-c)?)|(w\d+-h\d+(-?p-k-no-nu)?)/g,
        's0',
      );
      novel.cover = coverUrl;
    }

    let contentText = '';
    // Includes h4 for user specific structure
    postBody.find('div, p, span, h4').each((_, el) => {
      const t = $(el).text().trim();
      if (t) contentText += t + '\n';
    });

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

    const chapterSet = new Set<string>();
    postBody.find('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();

      if (href && href.includes('archtranslation.com') && text) {
        const isChapter =
          /Chapter|Vol|Prolo|Epilo|Ilustra|Selingan|Short story/i.test(text);
        const isExcluded =
          href.includes('/search/label') ||
          href.includes('/author/') ||
          href.startsWith(this.site + '/?');

        if (isChapter && !isExcluded && !chapterSet.has(href)) {
          chapterSet.add(href);
          novel.chapters?.push({
            name: text,
            path: href.replace(this.site, ''),
            releaseTime: null,
            chapterNumber: novel.chapters.length + 1,
          });
        }
      }
    });

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const body = await fetchText(this.site + chapterPath);
    const $ = loadCheerio(body);

    const content = $('.post-body');

    content.find('#bottom-ad-placeholder').remove();
    content.find('.widget.HTML').remove();
    content.find('.adsbygoogle').remove();
    content.find('script').remove();
    content.find('#related-post').remove();
    content.find('.post-footer').remove();

    content.find('.btn').remove();
    content.find('a').each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (text === 'previous' || text === 'next' || text === 'contents') {
        $(el).remove();
      }
    });

    content.find('img').each((i, el) => {
      const dataSrc = $(el).attr('data-src');
      if (dataSrc) {
        $(el).attr('src', dataSrc);
        $(el).removeAttr('data-src');
      }
      const src = $(el).attr('src');
      if (src) {
        $(el).attr(
          'src',
          src.replace(/(s\d+(-c)?)|(w\d+-h\d+(-?p-k-no-nu)?)/g, 's0'),
        );
      }
    });

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
      const title = $(el).find('.entry-title a').text().trim();
      const path = $(el).find('.entry-title a').attr('href');
      let cover =
        $(el).find('.post-filter-image img').attr('src') ||
        $(el).find('.post-filter-image img').attr('data-src');

      if (cover) {
        if (cover.match(/(s\d+(-c)?)|(w\d+-h\d+)/)) {
          cover = cover.replace(/(s\d+(-c)?)|(w\d+-h\d+(-?p-k-no-nu)?)/, 's0');
        }
      }

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
