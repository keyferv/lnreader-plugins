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
  version = '1.0.2';
  icon = 'src/es/ichijoutranslations/icon.png';
  lang = 'Spanish';

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
    let url = `${this.apiSite}/home/explore?page=${pageNo}&limit=12`;

    if (filters?.sortBy?.value) {
      url += `&sortBy=${filters.sortBy.value}`;
    }
    if (filters?.sortOrder?.value) {
      url += `&sortOrder=${filters.sortOrder.value}`;
    }

    const result = await fetchApi(url);
    const body = (await result.json()) as IchijouResponse;

    const novels: Plugin.NovelItem[] = [];

    body.data.data.forEach(work => {
      const coverImage = work.workImages.find(
        img =>
          img.image_type.code === 'cover' || img.image_type.code === 'card',
      );
      const cover = coverImage
        ? this.cdnSite + coverImage.image_url
        : undefined;

      novels.push({
        name: work.title,
        cover: cover,
        path: `obras/${work.id}-${work.slug}`,
      });
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const id = novelPath.split('/')[1].split('-')[0];
    // Assuming the endpoint for work details follows the pattern /home/work/:id
    // If this is incorrect, it needs to be updated based on the actual API.
    const url = `${this.apiSite}/home/work/${id}`;

    const result = await fetchApi(url);
    const body = (await result.json()) as { data: IchijouWorkDetails };
    const work = body.data;

    const coverImage = work.workImages.find(
      img => img.image_type.code === 'cover' || img.image_type.code === 'card',
    );

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: work.title,
      cover: coverImage ? this.cdnSite + coverImage.image_url : undefined,
      summary: work.synopsis,
      status: work.publicationStatus.name,
      genres: work.workGenres.map(g => g.genre.name).join(', '),
    };

    if (work.chapters) {
      novel.chapters = work.chapters.map(chapter => ({
        name: `Capítulo ${chapter.number}: ${chapter.title}`,
        path: `capitulo/${chapter.id}-${chapter.slug}`,
        chapterNumber: chapter.number,
      }));
    }

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const id = chapterPath.split('/')[1].split('-')[0];
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
    const url = `${this.apiSite}/home/explore?page=${pageNo}&limit=12&search=${encodeURIComponent(
      searchTerm,
    )}`;

    const result = await fetchApi(url);
    const body = (await result.json()) as IchijouResponse;

    const novels: Plugin.NovelItem[] = [];

    body.data.data.forEach(work => {
      const coverImage = work.workImages.find(
        img =>
          img.image_type.code === 'cover' || img.image_type.code === 'card',
      );
      const cover = coverImage
        ? this.cdnSite + coverImage.image_url
        : undefined;

      novels.push({
        name: work.title,
        cover: cover,
        path: `obras/${work.id}-${work.slug}`,
      });
    });

    return novels;
  }
}

export default new IchijouTranslations();
