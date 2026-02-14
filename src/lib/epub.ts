import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Plugin } from '@/types/plugin';

interface ChapterContent {
  title: string;
  content: string;
}

const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
};

export const generateEpub = async (
  novel: Plugin.SourceNovel,
  chapters: ChapterContent[],
) => {
  const zip = new JSZip();

  // Mimetype
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // META-INF
  const metaInf = zip.folder('META-INF');
  metaInf?.file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8" ?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  // OEBPS
  const oebps = zip.folder('OEBPS');

  // content.opf
  let manifest = '';
  let spine = '';
  let toc = '';

  chapters.forEach((chapter, index) => {
    const fileName = `chapter_${index + 1}.xhtml`; // XHTML is standard for EPUB
    manifest += `<item id="chapter_${index + 1}" href="${fileName}" media-type="application/xhtml+xml"/>\n`;
    spine += `<itemref idref="chapter_${index + 1}"/>\n`;
    toc += `<navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${escapeXml(chapter.title)}</text>
      </navLabel>
      <content src="${fileName}"/>
    </navPoint>\n`;

    oebps?.file(
      fileName,
      `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(chapter.title)}</title>
  <style>
    body { font-family: serif; }
    h1 { text-align: center; }
  </style>
</head>
<body>
  <h1>${escapeXml(chapter.title)}</h1>
  ${chapter.content}
</body>
</html>`,
    );
  });

  const contentOpf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${escapeXml(novel.name)}</dc:title>
    <dc:creator opf:role="aut">${escapeXml(novel.author || 'Unknown')}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId" opf:scheme="UUID">urn:uuid:12345</dc:identifier>
    ${novel.cover ? '<meta name="cover" content="cover-image" />' : ''}
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${manifest}
    ${
      novel.cover
        ? `<item id="cover-image" href="cover.jpg" media-type="image/jpeg"/>`
        : ''
    }
  </manifest>
  <spine toc="ncx">
    ${spine}
  </spine>
</package>`;

  oebps?.file('content.opf', contentOpf);

  // toc.ncx
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:12345"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(novel.name)}</text>
  </docTitle>
  <navMap>
    ${toc}
  </navMap>
</ncx>`;

  oebps?.file('toc.ncx', tocNcx);

  if (novel.cover) {
    try {
      const coverUrl = novel.cover.startsWith('/')
        ? novel.cover
        : '/' + novel.cover;
      const response = await fetch(coverUrl);
      const blob = await response.blob();
      oebps?.file('cover.jpg', blob);
    } catch (e) {
      console.error('Failed to fetch cover', e);
    }
  }

  const content = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
  });
  saveAs(content, `${novel.name}.epub`);
};
