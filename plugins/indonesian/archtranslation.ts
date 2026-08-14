import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { CheerioAPI, load as parseHTML } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';
import dayjs from 'dayjs';

const includesAny = (str: string, keywords: string[]) =>
  new RegExp(keywords.join('|')).test(str);

const CURRENT_PATH_REGEX = /^\/?manga\//;
const LEGACY_PATH_REGEX = /^\/?(\d{4})\/(\d{2})\/([^/]+)\.html\/?$/;

class ArchTranslation implements Plugin.PluginBase {
  id = 'archtranslation';
  name = 'ArchTranslation';
  site = 'https://archtranslation.com/';
  icon = 'src/id/archtranslation/icon.png';
  version = '1.3.0'; // Legacy Blogger path migration via WordPress search

  getHostname(url: string): string {
    url = url.split('/')[2];
    const url_parts = url.split('.');
    url_parts.pop(); // remove TLD
    return url_parts.join('.');
  }

  async getCheerio(url: string, search: boolean): Promise<CheerioAPI> {
    const r = await fetchApi(url);
    if (!r.ok && search != true)
      throw new Error(
        'Could not reach site (' + r.status + ') try to open in webview.',
      );
    const $ = parseHTML(await r.text());
    const title = $('title').text().trim();
    if (
      this.getHostname(url) != this.getHostname(r.url) ||
      title == 'Bot Verification' ||
      title == 'You are being redirected...' ||
      title == 'Un instant...' ||
      title == 'Just a moment...' ||
      title == 'Redirecting...'
    )
      throw new Error('Captcha error, please open in webview');
    return $;
  }

  private async resolveLegacyPath(novelPath: string): Promise<string> {
    if (
      CURRENT_PATH_REGEX.test(novelPath) ||
      !LEGACY_PATH_REGEX.test(novelPath)
    ) {
      return novelPath;
    }

    const slug = novelPath.replace(LEGACY_PATH_REGEX, '$3');
    const searchTerm = slug.replace(/-/g, ' ');

    let loadedCheerio: CheerioAPI;
    try {
      loadedCheerio = await this.getCheerio(
        this.site + '?s=' + encodeURIComponent(searchTerm),
        true,
      );
    } catch {
      return novelPath;
    }

    const candidates: string[] = [];
    loadedCheerio('.page-item-detail .post-title a').each((_, element) => {
      const href = loadedCheerio(element).attr('href');
      if (!href) return;
      const path = href.replace(/^https?:\/\/[^/]+\//, '');
      if (/^manga\//.test(path)) candidates.push(path);
    });

    if (new Set(candidates).size !== 1) return novelPath;
    return candidates[0];
  }

  parseNovels(loadedCheerio: CheerioAPI): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];

    loadedCheerio('.manga-title-badges').remove();

    loadedCheerio('.page-item-detail, .c-tabs-item__content').each(
      (index, element) => {
        const novelName = loadedCheerio(element)
          .find('.post-title')
          .text()
          .trim();
        const novelUrl =
          loadedCheerio(element).find('.post-title').find('a').attr('href') ||
          '';
        if (!novelName || !novelUrl) return;
        const image = loadedCheerio(element).find('img');
        const novelCover =
          image.attr('data-src') ||
          image.attr('src') ||
          image.attr('data-lazy-srcset') ||
          defaultCover;
        const novel: Plugin.NovelItem = {
          name: novelName,
          cover: novelCover,
          path: novelUrl.replace(/https?:\/\/.*?\//, ''),
        };
        novels.push(novel);
      },
    );

    return novels;
  }

  async popularNovels(
    pageNo: number,
    { showLatestNovels }: Plugin.PopularNovelsOptions,
  ): Promise<Plugin.NovelItem[]> {
    let url = this.site + '?m_orderby=rating&page=' + pageNo;
    if (showLatestNovels) url = this.site + '?m_orderby=latest&page=' + pageNo;

    const loadedCheerio = await this.getCheerio(url, pageNo != 1);
    return this.parseNovels(loadedCheerio);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const resolvedPath = (await this.resolveLegacyPath(novelPath)).replace(
      /^\/+/,
      '',
    );
    const loadedCheerio = await this.getCheerio(
      this.site + resolvedPath,
      false,
    );

    loadedCheerio('.manga-title-badges, #manga-title span').remove();
    const novel: Plugin.SourceNovel = {
      path: resolvedPath,
      name:
        loadedCheerio('.post-title h1').text().trim() ||
        loadedCheerio('#manga-title h1').text().trim() ||
        loadedCheerio('.manga-title').text().trim() ||
        '',
    };

    novel.cover =
      loadedCheerio('.summary_image > a > img').attr('data-lazy-src') ||
      loadedCheerio('.summary_image > a > img').attr('data-src') ||
      loadedCheerio('.summary_image > a > img').attr('src') ||
      defaultCover;

    loadedCheerio('.post-content_item, .post-content').each(function () {
      const detailName = loadedCheerio(this).find('h5').text().trim();
      const detail = loadedCheerio(this).find('.summary-content');

      switch (detailName) {
        case 'Genre(s)':
        case 'Genre':
        case 'Tags(s)':
        case 'Tag(s)':
        case 'Tags':
        case 'Género(s)':
        case 'Kategori':
          if (novel.genres)
            novel.genres +=
              ', ' +
              detail
                .find('a')
                .map((i, el) => loadedCheerio(el).text())
                .get()
                .join(', ');
          else
            novel.genres = detail
              .find('a')
              .map((i, el) => loadedCheerio(el).text())
              .get()
              .join(', ');
          break;
        case 'Author(s)':
        case 'Author':
        case 'Autor(es)':
          novel.author = detail.text().trim();
          break;
        case 'Status':
        case 'Novel':
        case 'Estado':
          novel.status =
            detail.text().trim().includes('OnGoing') ||
            detail.text().trim().includes('مستمرة')
              ? NovelStatus.Ongoing
              : NovelStatus.Completed;
          break;
        case 'Artist(s)':
          novel.artist = detail.text().trim();
          break;
      }
    });

    // Fallbacks for "Madara NovelHub" variant selectors
    {
      if (!novel.genres)
        novel.genres = loadedCheerio('.genres-content').text().trim();
      if (!novel.status)
        novel.status = loadedCheerio('.manga-status')
          .text()
          .trim()
          .includes('OnGoing')
          ? NovelStatus.Ongoing
          : NovelStatus.Completed;
      if (!novel.author)
        novel.author = loadedCheerio('.manga-author a').text().trim();
      if (!novel.rating)
        novel.rating = parseFloat(
          loadedCheerio('.post-rating span').text().trim(),
        );
    }

    if (!novel.author)
      novel.author = loadedCheerio('.manga-authors').text().trim();

    loadedCheerio('div.summary__content .code-block,script,noscript').remove();
    novel.summary =
      loadedCheerio('div.summary__content').text().trim() ||
      loadedCheerio('#tab-manga-about').text().trim() ||
      loadedCheerio('.manga-summary p')
        .map((i, el) => loadedCheerio(el).text())
        .get()
        .join('\n\n')
        .trim() ||
      loadedCheerio('.manga-excerpt p')
        .map((i, el) => loadedCheerio(el).text())
        .get()
        .join('\n\n')
        .trim();

    const chapters: Plugin.ChapterItem[] = [];

    const html = await fetchApi(this.site + resolvedPath + 'ajax/chapters/', {
      method: 'POST',
      referrer: this.site + resolvedPath,
    }).then(res => res.text());

    if (html !== '0') {
      const chapterCheerio = parseHTML(html);
      chapterCheerio('.wp-manga-chapter').each((chapterIndex, element) => {
        const chapterName = chapterCheerio(element).find('a').text().trim();

        let releaseDate = chapterCheerio(element)
          .find('span.chapter-release-date')
          .text()
          .trim();

        if (releaseDate) {
          releaseDate = this.parseData(releaseDate);
        } else {
          releaseDate = dayjs().format('LL');
        }

        const chapterUrl = chapterCheerio(element).find('a').attr('href') || '';

        if (chapterUrl && chapterUrl != '#') {
          chapters.push({
            name: chapterName,
            path: chapterUrl.replace(/https?:\/\/.*?\//, ''),
            releaseTime: releaseDate || null,
            chapterNumber: chapterIndex + 1,
          });
        }
      });
    }

    novel.chapters = chapters;
    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const loadedCheerio = await this.getCheerio(this.site + chapterPath, false);

    const selectors = [
      '.reading-content .text-left',
      '.text-left',
      '.text-right',
      '.entry-content',
      '.c-blog-post > div > div:nth-child(2)',
    ];

    let chapterText = loadedCheerio('');
    for (const selector of selectors) {
      chapterText = loadedCheerio(selector);
      if (chapterText.length > 0) break;
    }

    return chapterText.html() || '';
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const url =
      this.site + '?s=' + encodeURIComponent(searchTerm) + '&page=' + pageNo;
    const loadedCheerio = await this.getCheerio(url, true);
    return this.parseNovels(loadedCheerio);
  }

  parseData = (date: string) => {
    let dayJSDate = dayjs(); // today
    const timeAgo = date.match(/\d+/)?.[0] || '';
    const timeAgoInt = parseInt(timeAgo, 10);

    if (!timeAgo) return date; // there is no number!

    if (includesAny(date, ['detik', 'segundo', 'second', 'วินาที'])) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'second'); // go back N seconds
    } else if (
      includesAny(date, [
        'menit',
        'dakika',
        'min',
        'minute',
        'minuto',
        'นาที',
        'دقائق',
      ])
    ) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'minute'); // go back N minute
    } else if (
      includesAny(date, [
        'jam',
        'saat',
        'heure',
        'hora',
        'hour',
        'ชั่วโมง',
        'giờ',
        'ore',
        'ساعة',
        '小时',
      ])
    ) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'hours'); // go back N hours
    } else if (
      includesAny(date, [
        'hari',
        'gün',
        'jour',
        'día',
        'dia',
        'day',
        'วัน',
        'ngày',
        'giorni',
        'أيام',
        '天',
      ])
    ) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'days'); // go back N days
    } else if (includesAny(date, ['week', 'semana'])) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'week'); // go back N a week
    } else if (includesAny(date, ['month', 'mes'])) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'month'); // go back N months
    } else if (includesAny(date, ['year', 'año'])) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'year'); // go back N years
    } else {
      if (dayjs(date).format('LL') !== 'Invalid Date') {
        return dayjs(date).format('LL');
      }
      return date;
    }

    return dayJSDate.format('LL');
  };
}

export default new ArchTranslation();
