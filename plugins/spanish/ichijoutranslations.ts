import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { Filters, FilterTypes } from '@libs/filterInputs';

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

type IchijouDetailChapter = {
  id: number;
  title: string;
  orderIndex: number;
  slug?: string;
  chapter_file?: {
    fileUrl: string;
    file_type: {
      code: string;
    };
  };
};

type IchijouVolume = {
  id: number;
  title: string;
  orderIndex: number;
  displayNumber: string;
  volume_file?: {
    fileUrl: string;
    file_type: {
      code: string;
    };
  };
  chapters: IchijouDetailChapter[];
};

type IchijouWorkDetailsResponse = {
  statusCode: number;
  message: string;
  data: IchijouWorkDetails;
};

type IchijouWorkDetails = IchijouWork & {
  chapters: IchijouDetailChapter[];
  volumes: IchijouVolume[];
};

class IchijouTranslations implements Plugin.PluginBase {
  id = 'ichijoutranslations';
  name = 'Ichijou Translations';
  site = 'https://www.ichijoutranslations.com';
  apiSite = 'https://api.ichijoutranslations.com/api';
  cdnSite = 'https://cdn.ichijoutranslations.com';
  private readonly apiHomeBase = 'https://api.ichijoutranslations.com/api/home';
  version = '1.1.2';
  icon = 'src/es/ichijoutranslations/icon.png';
  lang = 'Spanish';

  private buildCdnUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) return relativePath;
    return (
      this.cdnSite +
      (relativePath.startsWith('/') ? relativePath : `/${relativePath}`)
    );
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

    const novels: Plugin.NovelItem[] = [];

    body.data.data.forEach(work => {
      const coverImage =
        work.workImages.find(
          img => img.image_type.code === 'card' && img.image_url,
        ) ||
        work.workImages.find(
          img => img.image_type.code === 'cover' && img.image_url,
        );

      const cover = coverImage?.image_url
        ? this.buildCdnUrl(coverImage.image_url)
        : undefined;

      novels.push({
        name: work.title,
        cover,
        path: `/obras/${work.slug}`,
      });
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const slug = novelPath.split('/').pop();
    if (!slug) throw new Error('No se pudo obtener el slug de la novela');

    const url = `${this.apiHomeBase}/works/${slug}`;
    const result = await fetchApi(url);
    const body = (await result.json()) as IchijouWorkDetailsResponse;
    const work = body.data;

    // Cover
    const coverImage =
      work.workImages.find(
        img => img.image_type.code === 'card' && img.image_url,
      ) ||
      work.workImages.find(
        img => img.image_type.code === 'cover' && img.image_url,
      );
    const cover = coverImage?.image_url
      ? this.buildCdnUrl(coverImage.image_url)
      : undefined;

    // Genres
    const genres = work.workGenres?.map(g => g.genre.name) || [];
    if (work.type?.name) genres.push(work.type.name);

    // Build chapters list from volumes and chapters
    const chapters: Plugin.ChapterItem[] = [];
    let chapterNumber = 0;

    if (work.volumes?.length) {
      const sortedVolumes = [...work.volumes].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      for (const volume of sortedVolumes) {
        if (volume.volume_file?.fileUrl) {
          chapterNumber++;
          // URL directa al PDF → LNReader abre visor PDF nativo
          chapters.push({
            name: `Volumen ${volume.displayNumber || volume.orderIndex} - ${volume.title}`,
            path: this.buildCdnUrl(volume.volume_file.fileUrl),
            chapterNumber,
          });
        }

        if (volume.chapters?.length) {
          const sortedChapters = [...volume.chapters].sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
          for (const chapter of sortedChapters) {
            chapterNumber++;
            if (chapter.chapter_file?.fileUrl) {
              chapters.push({
                name: chapter.title,
                path: this.buildCdnUrl(chapter.chapter_file.fileUrl),
                chapterNumber,
              });
            } else {
              chapters.push({
                name: chapter.title,
                path: `/capitulo/${chapter.id}${chapter.slug ? '-' + chapter.slug : ''}`,
                chapterNumber,
              });
            }
          }
        }
      }
    }

    if (work.chapters?.length) {
      const sortedChapters = [...work.chapters].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      for (const chapter of sortedChapters) {
        chapterNumber++;
        if (chapter.chapter_file?.fileUrl) {
          chapters.push({
            name: chapter.title,
            path: this.buildCdnUrl(chapter.chapter_file.fileUrl),
            chapterNumber,
          });
        } else {
          chapters.push({
            name: chapter.title,
            path: `/capitulo/${chapter.id}${chapter.slug ? '-' + chapter.slug : ''}`,
            chapterNumber,
          });
        }
      }
    }

    const hasPdf = chapters.some(c => /\.pdf(\?|$)/i.test(c.path));
    const summary = hasPdf
      ? `${work.synopsis}\n\nEste título contiene volúmenes/capítulos en PDF.`
      : work.synopsis;

    return {
      path: novelPath,
      name: work.title,
      cover,
      summary,
      status: work.publicationStatus?.name?.trim(),
      genres: genres.join(', '),
      chapters,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    // Los capítulos PDF (URLs que terminan en .pdf) son abiertos
    // directamente por el visor PDF nativo de LNReader.
    // parseChapter solo se llama para capítulos de texto.

    if (/\.pdf(\?|$)/i.test(chapterPath)) {
      return 'Este capítulo es un PDF. Ábrelo desde la app.';
    }

    const id = chapterPath
      .split('/')
      .pop()
      ?.match(/^(\d+)/)?.[1];
    if (!id) throw new Error('No se pudo obtener el ID del capítulo');
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

    const novels: Plugin.NovelItem[] = [];

    body.data.data.forEach(work => {
      const coverImage =
        work.workImages.find(
          img => img.image_type.code === 'card' && img.image_url,
        ) ||
        work.workImages.find(
          img => img.image_type.code === 'cover' && img.image_url,
        );

      const cover = coverImage?.image_url
        ? this.buildCdnUrl(coverImage.image_url)
        : undefined;

      novels.push({
        name: work.title,
        cover,
        path: `/obras/${work.slug}`,
      });
    });

    return novels;
  }
}

export default new IchijouTranslations();
