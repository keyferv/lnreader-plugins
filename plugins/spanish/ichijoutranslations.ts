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
  workImages?: {
    image_url: string;
    image_type: {
      code: string;
    };
  }[];
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
  version = '1.5.0';
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

  /** Genera un slug URL-friendly desde un título (similar al del sitio). */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[',¡!¿?.:;()["]]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
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

    // Cover – obtener de workImages (card o cover)
    const coverImage =
      work.workImages?.find(
        img => img.image_type.code === 'card' && img.image_url,
      ) ??
      work.workImages?.find(
        img => img.image_type.code === 'cover' && img.image_url,
      );
    const cover = coverImage?.image_url
      ? this.buildCdnUrl(coverImage.image_url)
      : undefined;

    // Genres
    const genres = work.workGenres?.map(g => g.genre.name) || [];

    // Build chapters list from volumes and chapters
    const chapters: Plugin.ChapterItem[] = [];
    let chapterNumber = 0;

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
          fileUrl && this.isPdfFile(fileUrl) ? this.buildCdnUrl(fileUrl) : null;
        // Incluir workSlug y chapterSlug para fallback a la nueva API
        const chapterSlug = this.slugify(chapter.title);
        chapters.push({
          name: `Capítulo ${chapter.orderIndex}: ${chapter.title}`,
          path: pdfPath ?? `/capitulo/${chapter.id}/${workSlug}/${chapterSlug}`,
          releaseTime: chapter.createdAt,
          chapterNumber,
        });
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

    // Capítulos con ruta /capitulo/{id}[/{workSlug}/{chapterSlug}]
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
        const newUrl = `${this.apiHomeBase}/works/${workSlug}/chapters/${chapterKey}`;

        try {
          const newResult = await fetchApi(newUrl);
          const newBody = (await newResult.json()) as {
            statusCode: number;
            data?: {
              chapter?: {
                content?: string | null | TiptapDoc;
                images?: Array<{
                  pageIndex: number;
                  imageUrl: string;
                  width?: number;
                  height?: number;
                }>;
              };
            };
          };

          const chapter = newBody.data?.chapter;
          const rawContent = chapter?.content;

          // 1. Imágenes (manhwa) — ordenar por pageIndex y generar HTML
          if (!rawContent && chapter?.images?.length) {
            chapterApiFailed = false;
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
            chapterApiFailed = false;
            if (this.isPdfFile(rawContent)) {
              return (
                '<div style="text-align:center;padding:32px 16px;font-family:sans-serif;">' +
                '<p style="font-size:18px;margin-bottom:24px;">Este capítulo está en formato PDF.</p>' +
                `<a href="${rawContent}" style="display:inline-block;padding:14px 28px;` +
                'background:#1976D2;color:#fff;text-decoration:none;border-radius:8px;' +
                'font-size:16px;">Abrir PDF</a></div>'
              );
            }
            return rawContent; // HTML viejo
          }

          // 3. Contenido es objeto Tiptap → el reader endpoint resuelve URLs de imágenes
          if (rawContent && typeof rawContent === 'object') {
            // Caemos al intento 3 (reader) que devuelve URLs firmadas de R2
          }
        } catch {
          // La API nueva falló — seguir al reader endpoint
        }
      }

      // ── Intento 3 (fallback): Reader endpoint /api/home/{chapterId}/reader ──
      // Devuelve Tiptap JSON con urls de imágenes ya resueltas (R2 firmadas)
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
      const newUrl = `${this.apiHomeBase}/works/${workSlug}/chapters/${chapterKey}`;

      try {
        const newResult = await fetchApi(newUrl);
        const newBody = (await newResult.json()) as {
          statusCode: number;
          data?: {
            chapter?: {
              content?: string | null | TiptapDoc;
              images?: Array<{
                pageIndex: number;
                imageUrl: string;
                width?: number;
                height?: number;
              }>;
            };
          };
        };
        const chapter = newBody.data?.chapter;
        const rawContent = chapter?.content;

        // 1. Imágenes (manhwa)
        if (!rawContent && chapter?.images?.length) {
          fallbackChapterApiFailed = false;
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
          fallbackChapterApiFailed = false;
          if (this.isPdfFile(rawContent)) {
            return (
              '<div style="text-align:center;padding:32px 16px;font-family:sans-serif;">' +
              '<p style="font-size:18px;margin-bottom:24px;">Este capítulo está en formato PDF.</p>' +
              `<a href="${rawContent}" style="display:inline-block;padding:14px 28px;` +
              'background:#1976D2;color:#fff;text-decoration:none;border-radius:8px;' +
              'font-size:16px;">Abrir PDF</a></div>'
            );
          }
          return rawContent; // HTML viejo
        }

        // 3. Tiptap objeto → caer al reader endpoint
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
        path: `/obras/${work.id}-${work.slug}`,
      });
    });

    return novels;
  }
}

export default new IchijouTranslations();
