import { useState } from 'react';
import { Plugin } from '@/types/plugin';
import { generateEpub } from '@/lib/epub';
import { useAppStore } from '@/store';
import { toast } from 'sonner';

export const useEpubExport = (
  sourceNovel: Plugin.SourceNovel | undefined,
  chapters: Plugin.ChapterItem[],
) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const plugin = useAppStore(state => state.plugin);

  const exportEpub = async () => {
    if (!sourceNovel || !plugin || chapters.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    const chapterContents: { title: string; content: string }[] = [];

    try {
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        try {
          // Add delay to prevent rate limiting
          if (i > 0) await new Promise(resolve => setTimeout(resolve, 500));
          
          const content = await plugin.parseChapter(chapter.path);
          chapterContents.push({
            title: chapter.name,
            content: content,
          });
        } catch (e) {
            console.error(`Failed to parse chapter ${chapter.name}`, e);
            chapterContents.push({
                title: chapter.name,
                content: `<p>Failed to load content: ${e instanceof Error ? e.message : 'Unknown error'}</p>`
            });
        } finally {
            setExportProgress(((i + 1) / chapters.length) * 100);
        }
      }

      await generateEpub(sourceNovel, chapterContents);
      toast.success('EPUB exported successfully!');
    } catch (error) {
      console.error('Failed to export EPUB:', error);
      toast.error('Failed to export EPUB');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return {
    isExporting,
    exportProgress,
    exportEpub,
  };
};
