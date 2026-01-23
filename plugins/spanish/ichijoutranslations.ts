import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { Filters, FilterTypes } from '@libs/filterInputs';
import { load as loadCheerio } from 'cheerio';

type IchijouResponse = {
  data: {
    data: IchijouWork[];
    meta: {
      totalPages: number;
    };
  };
};

type IchijouWork = {
  id: number;
  title: string;
  slug: string;
  synopsis: string;
  workImages: {
    image_url: string;
    image_type: {
      code: string;
    };
  }[];
  publicationStatus: {
    name: string;
  };
  type: {
    name: string;
  };
  workGenres: {
    genre: {
      name: string;
    };
  }[];
};

type IchijouChapter = {
  id: number;
  title: string;
  number: number;
  slug: string;
};

type IchijouWorkDetails = IchijouWork & {
  chapters: IchijouChapter[];
};

class IchijouTranslations implements Plugin.PluginBase {
  id = 'ichijoutranslations';
  name = 'Ichijou Translations';
  site = 'https://www.ichijoutranslations.com';
  apiSite = 'https://api.ichijoutranslations.com/api';
  cdnSite = 'https://cdn.ichijoutranslations.com';
  private readonly apiHomeBase = 'https://api.ichijoutranslations.com/api/home';
  version = '1.0.9';
  icon = 'src/es/ichijoutranslations/icon.png';
  lang = 'Spanish';

  private buildExploreUrl(
    pageNo: number,
    sortBy: string,
    sortOrder: string,
    searchTerm?: string,
  ): string {
    let url = `${this.site}/explorar?page=${pageNo}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }

    return url;
  }

  private async fetchExploreCoverMap(
    pageNo: number,
    sortBy: string,
    sortOrder: string,
    searchTerm?: string,
  ): Promise<Map<string, string>> {
    const url = this.buildExploreUrl(pageNo, sortBy, sortOrder, searchTerm);
    const result = await fetchApi(url);
    const html = await result.text();
    const $ = loadCheerio(html);
    const coverMap = new Map<string, string>();

    const articleSelector =
      'div.grid.grid-cols-2 article[role="button"], div.grid article';

    $(articleSelector).each((_, element) => {
      const article = $(element);
      const title = article.find('h3').first().text().trim();
      const img = article.find('div.relative img').first().length
        ? article.find('div.relative img').first()
        : article.find('img').first();
      const imgSrc = img.attr('src');

      if (!title || !imgSrc) return;

      let cover = imgSrc;
      if (!cover.startsWith('http')) {
        cover = new URL(cover, this.site).toString();
      }

      coverMap.set(title, cover);
    });

    return coverMap;
  }

  private buildVolumeApiUrl(pageUrl: string): string {
    const cleanUrl = pageUrl.split('?')[0];
    const match = cleanUrl.match(/obras\/([^/]+)\/volumen\/([^/]+)/);
    if (!match) {
      throw new Error('La URL no tiene el formato esperado de obra/volumen');
    }

    const workSlug = match[1];
    const volumeSlug = match[2];

    return `${this.apiHomeBase}/works/${workSlug}/volumes/${volumeSlug}`;
  }

  filters = {
    sortBy: {
      type: FilterTypes.Picker,
      label: 'Ordenar por',
      value: 'title',
      options: [
        { label: 'Título', value: 'title' },
        { label: 'Agregado', value: 'createdAt' },
        { label: 'Actualizado', value: 'updatedAt' },
        { label: 'Vistas', value: 'views' },
      ],
    },
    sortOrder: {
      type: FilterTypes.Picker,
      label: 'Orden',
      value: 'ASC',
      options: [
        { label: 'Ascendente', value: 'ASC' },
        { label: 'Descendente', value: 'DESC' },
      ],
    },
  } satisfies Filters;

  async popularNovels(
    pageNo: number,
    { filters }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const sortBy = filters?.sortBy?.value || this.filters.sortBy.value;
    const sortOrder = filters?.sortOrder?.value || this.filters.sortOrder.value;
    const url = `${this.apiSite}/home/explore?page=${pageNo}&limit=12&sortBy=${sortBy}&sortOrder=${sortOrder}`;

    const result = await fetchApi(url);
    const body = (await result.json()) as IchijouResponse;
    const coverMap = await this.fetchExploreCoverMap(pageNo, sortBy, sortOrder);

    const novels: Plugin.NovelItem[] = [];

    body.data.data.forEach(work => {
      let cover = coverMap.get(work.title);

      if (!cover) {
        const coverImage =
          work.workImages.find(
            img => img.image_type.code === 'card' && img.image_url,
          ) ||
          work.workImages.find(
            img => img.image_type.code === 'cover' && img.image_url,
          );

        cover = coverImage?.image_url;
        if (cover && !cover.startsWith('http')) {
          cover = this.cdnSite + (cover.startsWith('/') ? cover : `/${cover}`);
        }
      }

      novels.push({
        name: work.title,
        cover: cover,
        path: `/obras/${work.id}-${work.slug}`,
      });
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const id = novelPath
      .split('/')
      .pop()
      ?.match(/^(\d+)-/)?.[1];
    if (!id) throw new Error('No se pudo obtener el ID de la novela');

    // Assuming the endpoint for work details follows the pattern /home/work/:id
    // If this is incorrect, it needs to be updated based on the actual API.
    const url = `${this.apiSite}/home/work/${id}`;

    const result = await fetchApi(url);
    const body = (await result.json()) as { data: IchijouWorkDetails };
    const work = body.data;

    let statusFromSite: string | undefined;
    let genresFromSite: string[] | undefined;
    let chaptersFromSite: Plugin.ChapterItem[] | undefined;
    let summaryFromSite: string | undefined;
    let altNamesFromSite: string[] | undefined;
    let hasPdfVolumes = false;
    let pdfVolumesFromSite: Plugin.ChapterItem[] | undefined;
    try {
      const novelResult = await fetchApi(`${this.site}${novelPath}`);
      const novelHtml = await novelResult.text();
      const $ = loadCheerio(novelHtml);
      statusFromSite = $('div.flex.flex-wrap.items-center.gap-2 span')
        .first()
        .text()
        .trim();
      const summaryText = $('div.space-y-3 p.text-muted-foreground')
        .first()
        .text()
        .trim();
      if (summaryText) {
        summaryFromSite = summaryText;
      }
      const altSection = $('section.space-y-4')
        .has('h2:contains("Nombres alternativos")')
        .first();
      const altNames = altSection
        .find('ul li')
        .map((_, el) => {
          const row = $(el);
          const label = row.find('span.font-medium').first().text().trim();
          const value = row
            .find('span.text-muted-foreground')
            .last()
            .text()
            .trim();
          if (!value) return '';
          return label ? `${label}: ${value}` : value;
        })
        .get()
        .filter(Boolean);
      if (altNames.length) {
        altNamesFromSite = altNames;
      }
      const genreSection = $('section.space-y-4')
        .has('h2:contains("Géneros")')
        .first();
      const genres = genreSection
        .find('div.flex.flex-wrap.gap-2 a')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean);
      if (genres.length) {
        genresFromSite = genres;
      }

      const chapterSection = $('section.space-y-6')
        .has('h2:contains("Capítulos")')
        .first();
      const chapters: Plugin.ChapterItem[] = [];
      chapterSection.find('div.group.flex').each((_, el) => {
        const row = $(el);
        const numberText = row.find('span.text-right').first().text().trim();
        const titleText = row.find('p').first().text().trim();
        const href =
          row.find('a[href*="/capitulo/"]').attr('href') ||
          row.attr('data-href') ||
          row.attr('data-url') ||
          row.attr('data-path') ||
          row.find('[data-href]').attr('data-href') ||
          row.find('[data-url]').attr('data-url') ||
          row.find('[data-path]').attr('data-path');

        if (!titleText) return;

        const chapterNumber = Number.parseFloat(
          numberText.replace(',', '.').trim(),
        );

        if (!href) return;

        let path = href;
        if (path.startsWith('http')) {
          path = new URL(path).pathname;
        }
        if (!path.startsWith('/')) {
          path = `/${path}`;
        }

        chapters.push({
          name: titleText,
          path,
          chapterNumber: Number.isNaN(chapterNumber)
            ? undefined
            : chapterNumber,
        });
      });

      if (chapters.length) {
        chaptersFromSite = chapters;
      }

      const pdfVolumeGrid = $('div.grid')
        .has('img[src*="/volume-cards/"]')
        .first();
      if (pdfVolumeGrid.length) {
        hasPdfVolumes = true;
        const volumes: Plugin.ChapterItem[] = [];
        pdfVolumeGrid.find('div.group').each((index, el) => {
          const card = $(el);
          const titleText = card.find('h3').first().text().trim();
          const volLabel = card
            .find('div.absolute.top-2.left-2 span')
            .first()
            .text()
            .trim();
          const link =
            card.find('a[href*="/obras/"]').attr('href') ||
            card.attr('data-href') ||
            card.attr('data-url') ||
            card.attr('data-path') ||
            card.find('[data-href]').attr('data-href') ||
            card.find('[data-url]').attr('data-url') ||
            card.find('[data-path]').attr('data-path');

          if (!link) return;

          let path = link;
          if (path.startsWith('http')) {
            path = new URL(path).pathname;
          }
          if (!path.startsWith('/')) {
            path = `/${path}`;
          }

          const nameParts = [volLabel, titleText].filter(Boolean);
          const name = nameParts.length ? nameParts.join(' - ') : titleText;

          volumes.push({
            name,
            path: `/pdf${path}`,
            page: 'pdf',
            chapterNumber: index + 1,
          });
        });

        if (volumes.length) {
          pdfVolumesFromSite = volumes;
        }
      }
    } catch {
      statusFromSite = undefined;
      genresFromSite = undefined;
      chaptersFromSite = undefined;
      summaryFromSite = undefined;
      altNamesFromSite = undefined;
      hasPdfVolumes = false;
      pdfVolumesFromSite = undefined;
    }

    const coverImage =
      work.workImages.find(
        img => img.image_type.code === 'card' && img.image_url,
      ) ||
      work.workImages.find(
        img => img.image_type.code === 'cover' && img.image_url,
      );

    let cover = coverImage?.image_url;
    if (cover && !cover.startsWith('http')) {
      cover = this.cdnSite + (cover.startsWith('/') ? cover : `/${cover}`);
    }

    const genres =
      genresFromSite || work.workGenres?.map(g => g.genre.name) || [];
    if (work.type?.name) genres.push(work.type.name);

    const summaryBase = summaryFromSite || work.synopsis;
    const summaryWithAltNames = altNamesFromSite?.length
      ? `${summaryBase}\n\nNombres alternativos: ${altNamesFromSite.join(' | ')}`
      : summaryBase;
    const summaryFinal = hasPdfVolumes
      ? `${summaryWithAltNames}\n\nEste título contiene volúmenes en PDF.`
      : summaryWithAltNames;

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: work.title,
      cover: cover,
      summary: summaryFinal,
      status: statusFromSite || work.publicationStatus?.name?.trim(),
      genres: genres.join(', '),
    };

    if (chaptersFromSite?.length) {
      novel.chapters = chaptersFromSite;
    } else if (pdfVolumesFromSite?.length) {
      novel.chapters = pdfVolumesFromSite;
    } else if (work.chapters) {
      novel.chapters = work.chapters.map(chapter => ({
        name: `Capítulo ${chapter.number}: ${chapter.title}`,
        path: `/capitulo/${chapter.id}-${chapter.slug}`,
        chapterNumber: chapter.number,
      }));
    }

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    if (chapterPath.startsWith('/pdf/')) {
      const pagePath = chapterPath.replace(/^\/pdf/, '');
      const pageUrl = `${this.site}${pagePath}`;
      const apiUrl = this.buildVolumeApiUrl(pageUrl);

      const result = await fetchApi(apiUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: this.site,
        },
      });
      const body = (await result.json()) as {
        data?: { volume?: { fileUrl?: string } };
      };

      const relativePath = body.data?.volume?.fileUrl;
      if (!relativePath) {
        throw new Error('No se pudo obtener el enlace del PDF');
      }
      const fullPdfUrl = relativePath.startsWith('http')
        ? relativePath
        : `${this.cdnSite}${relativePath}`;

      return `<p>Este volumen está en PDF:</p><p><a href="${fullPdfUrl}">${fullPdfUrl}</a></p>`;
    }

    try {
      const chapterPage = await fetchApi(`${this.site}${chapterPath}`);
      const chapterHtml = await chapterPage.text();
      const $ = loadCheerio(chapterHtml);
      const volumeHref =
        $('div.flex.flex-wrap.items-center.gap-3 a[href*="/volumen/"]')
          .first()
          .attr('href') || $('a[href*="/volumen/"]').first().attr('href');

      if (volumeHref) {
        const pageUrl = volumeHref.startsWith('http')
          ? volumeHref
          : `${this.site}${volumeHref}`;
        const apiUrl = this.buildVolumeApiUrl(pageUrl);
        const result = await fetchApi(apiUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Referer: this.site,
          },
        });
        const body = (await result.json()) as {
          data?: { volume?: { fileUrl?: string } };
        };
        const relativePath = body.data?.volume?.fileUrl;
        if (!relativePath) {
          throw new Error('No se pudo obtener el enlace del PDF');
        }
        const fullPdfUrl = relativePath.startsWith('http')
          ? relativePath
          : `${this.cdnSite}${relativePath}`;

        return `<p>Este volumen está en PDF:</p><p><a href="${fullPdfUrl}">${fullPdfUrl}</a></p>`;
      }
    } catch {
      // Si falla el flujo PDF, continuar con la API de capítulos.
    }

    const id = chapterPath
      .split('/')
      .pop()
      ?.match(/^(\d+)-/)?.[1];
    if (!id) throw new Error('No se pudo obtener el ID del capítulo');
    // Assuming endpoint for chapter details
    const url = `${this.apiSite}/home/chapter/${id}`;

    const result = await fetchApi(url);
    const body = (await result.json()) as { data: { content: string } };

    return body.data.content;
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const sortBy = this.filters.sortBy.value;
    const sortOrder = this.filters.sortOrder.value;
    const url = `${this.apiSite}/home/explore?page=${pageNo}&limit=12&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${encodeURIComponent(
      searchTerm,
    )}`;

    const result = await fetchApi(url);
    const body = (await result.json()) as IchijouResponse;
    const coverMap = await this.fetchExploreCoverMap(
      pageNo,
      sortBy,
      sortOrder,
      searchTerm,
    );

    const novels: Plugin.NovelItem[] = [];

    body.data.data.forEach(work => {
      let cover = coverMap.get(work.title);

      if (!cover) {
        const coverImage =
          work.workImages.find(
            img => img.image_type.code === 'card' && img.image_url,
          ) ||
          work.workImages.find(
            img => img.image_type.code === 'cover' && img.image_url,
          );

        cover = coverImage?.image_url;
        if (cover && !cover.startsWith('http')) {
          cover = this.cdnSite + (cover.startsWith('/') ? cover : `/${cover}`);
        }
      }

      novels.push({
        name: work.title,
        cover: cover,
        path: `/obras/${work.id}-${work.slug}`,
      });
    });

    return novels;
  }
}

export default new IchijouTranslations();
