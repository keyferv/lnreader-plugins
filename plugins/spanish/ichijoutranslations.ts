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

type IchijouWorkImage = {
  imageTypeCode?: string;
  imageUrl?: string;
  image_type?: {
    code?: string;
  } | null;
  image_url?: string;
};

type IchijouWork = {
  id: number;
  title: string;
  slug: string;
  synopsis: string;
  workImages: IchijouWorkImage[];
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
  createdAt?: string;
  chapterFile?: {
    fileUrl: string;
  };
  fileUrl?: string;
};

type IchijouVolume = {
  id: number;
  title: string;
  orderIndex: number;
  createdAt?: string;
  volume_file?: {
    fileUrl: string;
  };
  fileUrl?: string;
};

type IchijouWorkDetailsResponse = {
  statusCode: number;
  message: string;
  data: IchijouWorkDetails;
};

type IchijouWorkDetails = {
  id: number;
  title: string;
  synopsis: string;
  slug?: string;
  workImages?: IchijouWorkImage[];
  publicationStatus?: {
    name: string;
  };
  workGenres?: {
    genre: {
      name: string;
    };
  }[];
  chapters?: IchijouDetailChapter[] | null;
  volumes?: IchijouVolume[] | null;
};

type IchijouContentChapter = {
  id: number;
  title: string;
  displayNumber?: string | null;
  orderIndex: number;
  createdAt?: string;
  volumeId?: number | null;
};

type IchijouContentResponse = {
  statusCode: number;
  message: string;
  data: {
    volumes?: IchijouVolume[] | null;
    chapters?: IchijouContentChapter[] | null;
  };
};

// ── Nueva API de capítulos (/works/{workKey}/chapters/{chapterKey}) ──

type IchijouChapterImage = {
  pageIndex: number;
  imageUrl: string;
  width?: number;
  height?: number;
};

type IchijouChapterResponse = {
  statusCode: number;
  message: string;
  data?: {
    work?: {
      id?: number;
      slug?: string;
    };
    chapter?: {
      content?: string | null | TiptapDoc;
      images?: IchijouChapterImage[];
    };
  };
};

// ── Tiptap (ProseMirror) document types ──

type TiptapDoc = {
  type: 'doc';
  content?: TiptapNode[];
};

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapInlineNode[];
};

type TiptapInlineNode = {
  type: string;
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

type TiptapImageAttrs = {
  width?: number;
  height?: number;
  imageId?: string;
  urls?: {
    original?: string;
    sm?: string;
    md?: string;
  };
};

// ── Reader endpoint response ──

type IchijouReaderResponse = {
  statusCode: number;
  data?: {
    content?: TiptapDoc;
    chapter?: {
      id: number;
      title: string;
    };
  };
};

class IchijouTranslations implements Plugin.PluginBase {
  id = 'ichijoutranslations';
  name = 'Ichijou Translations';
  site = 'https://www.ichijoutranslations.com';
  apiSite = 'https://api.ichijoutranslations.com/api';
  private readonly apiRoot = 'https://api.ichijoutranslations.com';
  cdnSite = 'https://cdn.ichijoutranslations.com';
  private readonly apiHomeBase = 'https://api.ichijoutranslations.com/api/home';
  version = '1.5.3';
  icon = 'src/es/ichijoutranslations/icon.png';
  lang = 'Spanish';

  private buildCdnUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) return relativePath;
    return (
      this.cdnSite +
      (relativePath.startsWith('/') ? relativePath : `/${relativePath}`)
    );
  }

  private isPdfFile(fileUrl: string): boolean {
    return /\.pdf(\?|$)/i.test(fileUrl);
  }

  /** URL de la imagen principal (card o cover) soportando ambas formas de la API. */
  private getWorkImageUrl(
    images?: IchijouWorkImage[] | null,
  ): string | undefined {
    if (!Array.isArray(images)) return undefined;
    const findUrlByCode = (code: string): string | undefined => {
      for (const img of images) {
        if (!img) continue;
        const imgCode = img.imageTypeCode ?? img.image_type?.code;
        if (imgCode !== code) continue;
        const url = img.imageUrl ?? img.image_url;
        if (url) return url;
      }
      return undefined;
    };
    return findUrlByCode('card') ?? findUrlByCode('cover');
  }

  /** Genera un slug URL-friendly desde un título (igual al del sitio). */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** Escapa caracteres HTML en texto plano. */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Renderiza un nodo inline (text con marks, hardBreak). */
  private renderInlineNode(node: TiptapInlineNode): string {
    if (node.type === 'text') {
      let text = this.escapeHtml(node.text ?? '');
      if (node.marks) {
        for (const mark of node.marks) {
          switch (mark.type) {
            case 'italic':
              text = `<em>${text}</em>`;
              break;
            case 'bold':
              text = `<strong>${text}</strong>`;
              break;
            case 'underline':
              text = `<u>${text}</u>`;
              break;
            case 'strike':
              text = `<s>${text}</s>`;
              break;
            case 'code':
              text = `<code>${text}</code>`;
              break;
          }
        }
      }
      return text;
    }
    if (node.type === 'hardBreak') return '<br />';
    return '';
  }

  /** Renderiza un nodo Tiptap de nivel bloque (paragraph, heading, inlineImage, hardBreak). */
  private renderTiptapNode(node: TiptapNode): string {
    switch (node.type) {
      case 'paragraph': {
        const align = node.attrs?.textAlign as string | undefined;
        const style = align ? ` style="text-align:${align}"` : '';
        const children =
          node.content?.map(n => this.renderInlineNode(n)).join('') ?? '';
        return `<p${style}>${children || '<br />'}</p>`;
      }
      case 'heading': {
        const level = (node.attrs?.level as number) ?? 2;
        const tag = level >= 1 && level <= 6 ? `h${level}` : 'h2';
        const align = node.attrs?.textAlign as string | undefined;
        const style = align ? ` style="text-align:${align}"` : '';
        const children =
          node.content?.map(n => this.renderInlineNode(n)).join('') ?? '';
        return `<${tag}${style}>${children}</${tag}>`;
      }
      case 'inlineImage': {
        const attrs = node.attrs as TiptapImageAttrs | undefined;
        // Preferir md (medium), luego sm, luego original
        const src = attrs?.urls?.md || attrs?.urls?.sm || attrs?.urls?.original;
        if (!src) return '';
        return `<img src="${src}" style="display:block;width:100%;height:auto;margin:8px 0;" />`;
      }
      case 'hardBreak':
        return '<br />';
      case 'horizontalRule':
        return '<hr />';
      case 'blockquote': {
        const children =
          node.content?.map(n => this.renderTiptapNode(n)).join('\n') ?? '';
        return `<blockquote>${children}</blockquote>`;
      }
      default:
        return '';
    }
  }

  /** Convierte un documento Tiptap (ProseMirror) a HTML. */
  private renderTiptap(doc: TiptapDoc): string {
    if (!doc?.content?.length) return '';
    return doc.content
      .map(node => this.renderTiptapNode(node))
      .filter(Boolean)
      .join('\n');
  }

  /** Aviso HTML para capítulos en formato PDF. */
  private renderPdfNotice(pdfUrl: string): string {
    return (
      '<div style="text-align:center;padding:32px 16px;font-family:sans-serif;">' +
      '<p style="font-size:18px;margin-bottom:24px;">Este capítulo está en formato PDF.</p>' +
      `<a href="${pdfUrl}" style="display:inline-block;padding:14px 28px;` +
      'background:#1976D2;color:#fff;text-decoration:none;border-radius:8px;' +
      'font-size:16px;">Abrir PDF</a></div>'
    );
  }

  /** Renderiza el contenido de un capítulo de la API nueva (imágenes o string). */
  private renderChapterContent(
    chapter?: {
      content?: string | null | TiptapDoc;
      images?: IchijouChapterImage[];
    } | null,
  ): string | null {
    if (!chapter) return null;
    const rawContent = chapter.content;

    // 1. Imágenes (manhwa) — ordenar por pageIndex y generar HTML
    if (!rawContent && chapter.images?.length) {
      const sortedImages = [...chapter.images].sort(
        (a, b) => a.pageIndex - b.pageIndex,
      );
      return sortedImages
        .map(
          img =>
            `<img src="${img.imageUrl}" style="display:block;width:100%;height:auto;margin:0;" />`,
        )
        .join('\n');
    }

    // 2. Contenido string: PDF o HTML
    if (typeof rawContent === 'string' && rawContent.length > 0) {
      if (this.isPdfFile(rawContent)) return this.renderPdfNotice(rawContent);
      return rawContent;
    }

    // 3. Contenido es objeto Tiptap → el reader endpoint resuelve URLs de imágenes
    return null;
  }

  /** Fetch a la API nueva de capítulos y devuelve HTML renderizado o null. */
  private async fetchNewApiChapter(
    workKey: string,
    chapterKey: string,
  ): Promise<string | null> {
    const newUrl = `${this.apiHomeBase}/works/${workKey}/chapters/${chapterKey}`;
    const newResult = await fetchApi(newUrl);
    const newBody = (await newResult.json()) as IchijouChapterResponse;
    return this.renderChapterContent(newBody.data?.chapter);
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
      const coverUrl = this.getWorkImageUrl(work.workImages);
      const cover = coverUrl ? this.buildCdnUrl(coverUrl) : undefined;

      novels.push({
        name: work.title,
        cover,
        path: `/obras/${work.id}-${work.slug}`,
      });
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    // El path tiene formato /obras/{id}-{slug} (ej: /obras/80-como-podrias-gustar...)
    const pathSegment = novelPath.split('/').pop() ?? '';
    const workId = pathSegment.match(/^(\d+)/)?.[1];
    if (!workId) throw new Error('No se pudo obtener el ID de la obra');
    const workSlug = pathSegment.replace(/^\d+-/, '');

    const url = `${this.apiHomeBase}/works/${workId}`;
    const result = await fetchApi(url);
    const body = (await result.json()) as IchijouWorkDetailsResponse;
    const work = body.data;

    // Cover – obtener de workImages (card o cover) en ambas formas de la API
    const coverUrl = this.getWorkImageUrl(work.workImages);
    const cover = coverUrl ? this.buildCdnUrl(coverUrl) : undefined;

    // Genres
    const genres = work.workGenres?.map(g => g.genre.name) || [];

    // Build chapters list from volumes and chapters
    const chapters: Plugin.ChapterItem[] = [];
    let chapterNumber = 0;

    const slug = work.slug || workSlug;

    // La API de detalle ya no incluye chapters/volumes: obtenerlos desde el
    // endpoint de contenido (data.chapters[]) cuando esté disponible.
    const contentChapters: Plugin.ChapterItem[] = [];
    try {
      const contentUrl = `${this.apiHomeBase}/getContentWork/work/${workId}`;
      const contentResult = await fetchApi(contentUrl);
      if (contentResult.ok) {
        const contentBody =
          (await contentResult.json()) as IchijouContentResponse;
        const rawChapters = Array.isArray(contentBody.data?.chapters)
          ? contentBody.data.chapters
          : [];
        if (rawChapters.length) {
          const sortedChapters = [...rawChapters].sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
          for (const chapter of sortedChapters) {
            chapterNumber++;
            const displayNumber =
              chapter.displayNumber ?? String(chapter.orderIndex);
            const chapterSlug = this.slugify(chapter.title);
            contentChapters.push({
              name: `Capítulo ${displayNumber}: ${chapter.title}`,
              path: `/obras/${workId}-${slug}/capitulo/${chapter.id}-${chapterSlug}`,
              releaseTime: chapter.createdAt,
              chapterNumber,
            });
          }
        }
      }
    } catch {
      // El endpoint de contenido falló — se usan los datos legacy del detalle
    }

    if (contentChapters.length) {
      chapters.push(...contentChapters);
    } else {
      const volumes = Array.isArray(work.volumes) ? work.volumes : [];
      if (volumes.length) {
        const sortedVolumes = [...volumes].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );
        for (const volume of sortedVolumes) {
          const fileUrl = volume.fileUrl || volume.volume_file?.fileUrl;
          if (fileUrl && this.isPdfFile(fileUrl)) {
            chapterNumber++;
            chapters.push({
              name: `Volumen ${volume.orderIndex}: ${volume.title}`,
              path: this.buildCdnUrl(fileUrl),
              releaseTime: volume.createdAt,
              chapterNumber,
            });
          }
        }
      }

      const rootChapters = Array.isArray(work.chapters) ? work.chapters : [];
      if (rootChapters.length) {
        const sortedChapters = [...rootChapters].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );
        for (const chapter of sortedChapters) {
          chapterNumber++;
          const fileUrl = chapter.fileUrl || chapter.chapterFile?.fileUrl;
          const pdfPath =
            fileUrl && this.isPdfFile(fileUrl)
              ? this.buildCdnUrl(fileUrl)
              : null;
          // Incluir workId-slug y chapterSlug para fallback a la nueva API
          const chapterSlug = this.slugify(chapter.title);
          chapters.push({
            name: `Capítulo ${chapter.orderIndex}: ${chapter.title}`,
            path:
              pdfPath ??
              `/obras/${workId}-${slug}/capitulo/${chapter.id}-${chapterSlug}`,
            releaseTime: chapter.createdAt,
            chapterNumber,
          });
        }
      }
    }

    return {
      path: novelPath,
      name: work.title,
      cover,
      summary: work.synopsis,
      status: work.publicationStatus?.name?.trim(),
      genres: genres.join(', '),
      chapters,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    // PDF directo (URL CDN completa) — la app redirige a PdfReaderScreen antes
    // de llegar aquí, pero lo dejamos como fallback por si acaso.
    if (this.isPdfFile(chapterPath)) {
      const pdfUrl = chapterPath.startsWith('http')
        ? chapterPath
        : this.buildCdnUrl(chapterPath);
      return (
        '<div style="text-align:center;padding:32px 16px;font-family:sans-serif;">' +
        '<p style="font-size:18px;margin-bottom:24px;">Este capítulo está en formato PDF.</p>' +
        `<a href="${pdfUrl}" style="display:inline-block;padding:14px 28px;` +
        'background:#1976D2;color:#fff;text-decoration:none;border-radius:8px;' +
        'font-size:16px;">Abrir PDF</a></div>'
      );
    }

    // Backward compat: rutas /leer-pdf/ antiguas
    if (chapterPath.includes('/leer-pdf/')) {
      const relativePath = chapterPath.replace('/leer-pdf', '');
      const pdfUrl = this.buildCdnUrl(relativePath);
      return (
        '<div style="text-align:center;padding:32px 16px;font-family:sans-serif;">' +
        '<p style="font-size:18px;margin-bottom:24px;">Este capítulo está en formato PDF.</p>' +
        `<a href="${pdfUrl}" style="display:inline-block;padding:14px 28px;` +
        'background:#1976D2;color:#fff;text-decoration:none;border-radius:8px;' +
        'font-size:16px;">Abrir PDF</a></div>'
      );
    }

    // Capítulos con ruta /obras/{workId}-{workSlug}/capitulo/{chapterId}-{chapterSlug}
    if (chapterPath.startsWith('/obras/')) {
      const parts = chapterPath.split('/').filter(Boolean); // ['obras', workKey, 'capitulo', chapterKey]
      const workKey = parts[1] ?? '';
      const chapterKey = parts[3] ?? '';
      const chapterId = chapterKey.match(/^(\d+)/)?.[1];
      if (!workKey || !chapterKey || !chapterId) {
        throw new Error('No se pudo obtener el ID del capítulo');
      }

      // ── Intento 1: API nueva /works/{workKey}/chapters/{chapterKey} ──
      let chapterApiFailed = true;
      try {
        const html = await this.fetchNewApiChapter(workKey, chapterKey);
        if (html !== null) {
          chapterApiFailed = false;
          return html;
        }
        // Contenido Tiptap → el reader endpoint resuelve URLs de imágenes
      } catch {
        // La API nueva falló — seguir al reader endpoint
      }

      // ── Intento 2 (fallback): Reader endpoint /api/home/{chapterId}/reader ──
      try {
        const readerUrl = `${this.apiHomeBase}/${chapterId}/reader`;
        const readerResult = await fetchApi(readerUrl);
        if (readerResult.ok) {
          const readerBody =
            (await readerResult.json()) as IchijouReaderResponse;
          const readerContent = readerBody.data?.content;
          if (readerContent?.content?.length) {
            return this.renderTiptap(readerContent);
          }
        }
      } catch {
        // El reader endpoint también falló
      }

      if (!chapterApiFailed) {
        // La API de capítulo dijo que sí encontró algo pero no pudimos
        // renderizarlo — probablemente Tiptap sin URLs de imagen
        throw new Error(
          'No se pudo renderizar el contenido Tiptap del capítulo',
        );
      }

      throw new Error('No se encontró contenido del capítulo');
    }

    // Backward compat: capítulos con ruta antigua
    // /capitulo/{id}[/{workSlug}/{chapterSlug}]
    if (chapterPath.startsWith('/capitulo/')) {
      const parts = chapterPath.split('/').filter(Boolean); // ['capitulo', id, workSlug?, chapterSlug?]
      const chapterId = parts[1]?.match(/^(\d+)/)?.[1];
      if (!chapterId) throw new Error('No se pudo obtener el ID del capítulo');

      const workSlug = parts[2] ?? '';
      const chapterSlug = parts[3] ?? '';

      // ── Intento 1: API vieja /api/home/chapter/{id} ──
      try {
        const oldUrl = `${this.apiSite}/home/chapter/${chapterId}`;
        const oldResult = await fetchApi(oldUrl);
        if (oldResult.ok) {
          const oldBody = (await oldResult.json()) as {
            data?: { content?: string };
            content?: string;
          };
          const oldContent = oldBody.data?.content ?? oldBody.content ?? '';
          if (oldContent) return oldContent;
        }
      } catch {
        // La API vieja falló (404 u otro error) — seguir al fallback
      }

      // ── Intento 2 (fallback): API nueva /api/home/works/{workSlug}/chapters/{id}-{slug} ──
      let chapterApiFailed = true;
      if (workSlug && chapterSlug) {
        const chapterKey = `${chapterId}-${chapterSlug}`;

        try {
          const html = await this.fetchNewApiChapter(workSlug, chapterKey);
          if (html !== null) {
            chapterApiFailed = false;
            return html;
          }
          // Contenido Tiptap → el reader endpoint resuelve URLs de imágenes
        } catch {
          // La API nueva falló — seguir al reader endpoint
        }
      }

      // ── Intento 3 (fallback): Reader endpoint /api/home/{chapterId}/reader ──
      try {
        const readerUrl = `${this.apiHomeBase}/${chapterId}/reader`;
        const readerResult = await fetchApi(readerUrl);
        if (readerResult.ok) {
          const readerBody =
            (await readerResult.json()) as IchijouReaderResponse;
          const readerContent = readerBody.data?.content;
          if (readerContent?.content?.length) {
            return this.renderTiptap(readerContent);
          }
        }
      } catch {
        // El reader endpoint también falló
      }

      if (!chapterApiFailed) {
        // La API de capítulo dijo que sí encontró algo pero no pudimos
        // renderizarlo — probablemente Tiptap sin URLs de imagen
        throw new Error(
          'No se pudo renderizar el contenido Tiptap del capítulo',
        );
      }

      throw new Error('No se encontró contenido del capítulo');
    }

    // Fallback para rutas que no empiezan con /capitulo/
    const parts = chapterPath.split('/').filter(Boolean);
    const id = parts.pop()?.match(/^(\d+)/)?.[1];
    if (!id) throw new Error('No se pudo obtener el ID del capítulo');

    try {
      const oldUrl = `${this.apiSite}/home/chapter/${id}`;
      const oldResult = await fetchApi(oldUrl);
      if (oldResult.ok) {
        const oldBody = (await oldResult.json()) as {
          data?: { content?: string };
          content?: string;
        };
        const oldContent = oldBody.data?.content ?? oldBody.content ?? '';
        if (oldContent) return oldContent;
      }
    } catch {
      // fall through
    }

    // Si hay suficientes partes, intentar nueva API
    let fallbackChapterApiFailed = true;
    const workSlug = parts.length >= 1 ? parts.join('/') : '';
    const chapterSlug = parts.length >= 2 ? parts.pop() ?? '' : '';
    if (workSlug && chapterSlug && id) {
      const chapterKey = `${id}-${chapterSlug}`;

      try {
        const html = await this.fetchNewApiChapter(workSlug, chapterKey);
        if (html !== null) {
          fallbackChapterApiFailed = false;
          return html;
        }
        // Contenido Tiptap → el reader endpoint resuelve URLs de imágenes
      } catch {
        // fall through
      }
    }

    // ── Reader endpoint fallback ──
    try {
      const readerUrl = `${this.apiHomeBase}/${id}/reader`;
      const readerResult = await fetchApi(readerUrl);
      if (readerResult.ok) {
        const readerBody = (await readerResult.json()) as IchijouReaderResponse;
        const readerContent = readerBody.data?.content;
        if (readerContent?.content?.length) {
          return this.renderTiptap(readerContent);
        }
      }
    } catch {
      // fall through
    }

    if (!fallbackChapterApiFailed) {
      throw new Error('No se pudo renderizar el contenido Tiptap del capítulo');
    }

    throw new Error('No se encontró contenido del capítulo');
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
      const coverUrl = this.getWorkImageUrl(work.workImages);
      const cover = coverUrl ? this.buildCdnUrl(coverUrl) : undefined;

      novels.push({
        name: work.title,
        cover,
        path: `/obras/${work.id}-${work.slug}`,
      });
    });

    return novels;
  }
}

export default new IchijouTranslations();
