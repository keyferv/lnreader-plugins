import { useState } from 'react';
import { toast } from 'sonner';
import { Plugin } from '@/types/plugin';
import { createEpub, downloadBlob } from '@/lib/epub';

type UseEpubExportOptions = {
  plugin: Plugin.PluginBase | null;
  sourceNovel: (Plugin.SourceNovel & { totalPages?: number }) | undefined;
  chapters: Plugin.ChapterItem[];
  novelPath: string;
};

const CHAPTER_FETCH_ATTEMPTS = 3;
const CHAPTER_RETRY_BASE_DELAY_MS = 500;
const CHAPTER_THROTTLE_DELAY_MS = 200;

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchChapterWithRetry(
  parseChapter: (chapterPath: string) => Promise<string>,
  chapterPath: string,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= CHAPTER_FETCH_ATTEMPTS; attempt++) {
    try {
      return await parseChapter(chapterPath);
    } catch (error) {
      lastError = error;
      if (attempt < CHAPTER_FETCH_ATTEMPTS) {
        await sleep(CHAPTER_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastError;
}

export function useEpubExport({
  plugin,
  sourceNovel,
  chapters,
  novelPath,
}: UseEpubExportOptions) {
  const [isExporting, setIsExporting] = useState(false);

  const exportEpub = async () => {
    if (!plugin || !sourceNovel || chapters.length === 0) {
      toast.error('No novel or chapters available to export');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Starting EPUB export...', {
      description: `Preparing to export ${chapters.length} chapters`,
    });

    try {
      const allChapters: Plugin.ChapterItem[] = [];

      if (sourceNovel.totalPages && sourceNovel.totalPages > 1) {
        toast.loading('Fetching all chapters...', {
          id: toastId,
          description: `Found ${sourceNovel.totalPages} pages`,
        });

        const failedPages: number[] = [];
        for (let page = 1; page <= sourceNovel.totalPages; page++) {
          try {
            const pageResult = await (plugin as Plugin.PagePlugin).parsePage(
              novelPath,
              page.toString(),
            );
            allChapters.push(...pageResult.chapters);

            toast.loading('Fetching chapters...', {
              id: toastId,
              description: `Page ${page}/${sourceNovel.totalPages} - ${allChapters.length} chapters collected`,
            });
          } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            failedPages.push(page);
          }
        }

        // Never silently export a partial chapter list: abort when any page
        // of the table of contents failed to load.
        if (failedPages.length > 0) {
          toast.error('Export aborted: incomplete chapter list', {
            id: toastId,
            description: `Pages ${failedPages.join(', ')} of ${sourceNovel.totalPages} failed to load.`,
          });
          setIsExporting(false);
          return;
        }
      } else {
        allChapters.push(...chapters);
      }

      if (allChapters.length === 0) {
        toast.error('No chapters found to export', { id: toastId });
        setIsExporting(false);
        return;
      }

      toast.loading('Fetching chapter content...', {
        id: toastId,
        description: `0/${allChapters.length} chapters processed`,
      });

      type Chapter = {
        title: string;
        content: string;
        path: string;
      };
      const chapterContents: Chapter[] = [];
      const failedChapters: string[] = [];

      for (let i = 0; i < allChapters.length; i++) {
        const chapter = allChapters[i];
        try {
          // Throttle sequential requests and retry transient failures with
          // bounded exponential backoff instead of hammering the source.
          if (i > 0) await sleep(CHAPTER_THROTTLE_DELAY_MS);
          const content = await fetchChapterWithRetry(
            chapterPath => plugin.parseChapter(chapterPath),
            chapter.path,
          );
          chapterContents.push({
            title: chapter.name,
            content: content || '<p>No content available</p>',
            path: chapter.path,
          });

          const progress = Math.round(((i + 1) / allChapters.length) * 100);
          toast.loading('Fetching chapter content...', {
            id: toastId,
            description: `${i + 1}/${allChapters.length} chapters processed (${progress}%)`,
          });
        } catch (error) {
          console.error(`Error fetching chapter ${i + 1}:`, error);
          failedChapters.push(chapter.name);
          chapterContents.push({
            title: chapter.name,
            content: `<p>Error: Failed to fetch chapter content</p>`,
            path: chapter.path,
          });
        }
      }

      toast.loading('Generating EPUB file...', {
        id: toastId,
        description: 'Creating EPUB structure',
      });

      let coverUrl = sourceNovel.cover;
      if (coverUrl && plugin.resolveUrl) {
        coverUrl = plugin.resolveUrl(coverUrl, true);
      } else if (
        coverUrl &&
        !coverUrl.startsWith('http://') &&
        !coverUrl.startsWith('https://')
      ) {
        coverUrl = coverUrl.startsWith('/') ? coverUrl : '/' + coverUrl;
      }

      const epubBlob = await createEpub(chapterContents, {
        title: sourceNovel.name,
        author: sourceNovel.author,
        description: sourceNovel.summary,
        cover: coverUrl,
        language: 'en',
      });

      const filename = `${sourceNovel.name.replace(/[^a-z0-9]/gi, '_')}.epub`;
      downloadBlob(epubBlob, filename);

      // Never silently deliver a partial book: report failed chapters
      // explicitly instead of a blanket success.
      if (failedChapters.length > 0) {
        toast.error('EPUB export incomplete', {
          id: toastId,
          description: `${failedChapters.length}/${allChapters.length} chapters failed after ${CHAPTER_FETCH_ATTEMPTS} attempts: ${failedChapters.slice(0, 5).join(', ')}${failedChapters.length > 5 ? ', …' : ''}`,
        });
      } else {
        toast.success('EPUB exported successfully!', {
          id: toastId,
          description: `Downloaded ${allChapters.length} chapters as ${filename}`,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to export EPUB';
      toast.error('Export failed', {
        id: toastId,
        description: errorMessage,
      });
      console.error('Error exporting EPUB:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportEpub,
    isExporting,
  };
}
