import { fetchText } from '@/lib/fetch';
import { Plugin } from '@/types/plugin';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class ArchTranslation implements Plugin.PluginBase {
  id = 'archtranslation';
  name = 'ArchTranslation';
  site = 'https://www.archtranslation.com';
  icon = 'src/id/archtranslation/icon.png';
  version = '1.0.0';

  async popularNovels(
    pageNo: number,
    { filters }: Plugin.PopularNovelsOptions,
  ): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}/search/label/LN?max-results=20`;

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

    // Cover
    const coverImg = postBody.find('img').first();
    let coverUrl = coverImg.attr('src') || coverImg.attr('data-src');
    if (coverUrl) {
      if (coverUrl.match(/(s\d+(-c)?)|(w\d+-h\d+)/)) {
        coverUrl = coverUrl.replace(
          /(s\d+(-c)?)|(w\d+-h\d+(-?p-k-no-nu)?)/,
          's0',
        );
      }
      novel.cover = coverUrl;
    }

    // Metadata extraction
    const contentText = postBody.text();

    if (contentText.includes('Author:')) {
      novel.author = contentText.split('Author:')[1].split('\n')[0].trim();
    }
    if (contentText.includes('Artist:')) {
      novel.artist = contentText.split('Artist:')[1].split('\n')[0].trim();
    }
    if (contentText.includes('Genre:')) {
      novel.genres = contentText.split('Genre:')[1].split('\n')[0].trim();
    }
    if (contentText.includes('Status:')) {
      const statusStr = contentText
        .split('Status:')[1]
        .split('\n')[0]
        .trim()
        .toLowerCase();
      if (statusStr.includes('ongoing')) novel.status = NovelStatus.Ongoing;
      else if (statusStr.includes('completed'))
        novel.status = NovelStatus.Completed;
      else if (statusStr.includes('hiatus'))
        novel.status = NovelStatus.OnHiatus;
      else novel.status = NovelStatus.Unknown;
    }

    // Synopsis
    if (contentText.includes('Sinopsis:')) {
      let synopsis = contentText.split('Sinopsis:')[1];
      if (synopsis.includes('Volume 1')) {
        synopsis = synopsis.split('Volume 1')[0];
      }
      novel.summary = synopsis.trim();
    }

    // Chapters
    const chapterSet = new Set<string>();

    postBody.find('a').each((i, el) => {
      const link = $(el);
      const href = link.attr('href');
      const text = link.text().trim();

      if (!href) return;

      if (
        href.includes('archtranslation.com') &&
        !href.includes('/label/') &&
        !href.includes('.jpg') &&
        !href.includes('.png') &&
        !href.includes('search/label') &&
        text.length > 0 &&
        text.toLowerCase() !== 'read more'
      ) {
        // Additional heuristic: Exclude the Prologue link if found in summary or similar, but here we just collect links.
        // The structure has explicit links like "Chapter 1", "Prologue" etc.
        // Filter out links that are just 'Volume 1' or 'Illustrations' if they point to images or same page anchors (snippet shows explicit links so it's fine)

        if (!chapterSet.has(href)) {
          chapterSet.add(href);
          novel.chapters?.push({
            name: text,
            path: href.replace(this.site, ''),
            releaseTime: undefined,
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

    // Remove Ads and widgets
    content.find('#bottom-ad-placeholder').remove();
    content.find('.widget.HTML').remove();
    content.find('.adsbygoogle').remove();
    content.find('script').remove();

    // Remove navigation buttons (Previous, Contents, Next)
    content.find('.btn').remove();
    content.find('a').each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (text === 'previous' || text === 'next' || text === 'contents') {
        $(el).remove();
      }
    });

    // Remove other clutter
    content.find('#related-post').remove();
    content.find('.post-footer').remove();

    return content.html() || '';
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}/search?q=${encodeURIComponent(searchTerm)}&max-results=20`;
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
