const cheerio = require('cheerio');

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractArrayLiteral(source, key) {
  const keyMatch = new RegExp(`["']?${key}["']?\\s*:\\s*\\[`).exec(source);
  if (!keyMatch) return undefined;

  const start = keyMatch.index + keyMatch[0].length - 1;
  let depth = 0;
  let inString = false;
  let quote = '';

  for (let i = start; i < source.length; i++) {
    const char = source[i];
    const prev = i > 0 ? source[i - 1] : '';

    if (inString) {
      if (char === quote && prev !== '\\') inString = false;
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === '[') depth++;
    if (char === ']') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  return undefined;
}

function parseChaptersFromSource(source) {
  if (!source) return [];

  const normalizedSource = decodeHtmlEntities(source);
  const chaptersLiteral = extractArrayLiteral(normalizedSource, 'chapters');
  if (!chaptersLiteral) return [];

  const chaptersData = JSON.parse(chaptersLiteral);
  if (!Array.isArray(chaptersData)) return [];

  const chapters = [];

  chaptersData.forEach(entry => {
    const chapter = typeof entry === 'object' && entry !== null ? entry : {};
    const slug = typeof chapter.chapterSlug === 'string' ? chapter.chapterSlug.trim() : '';
    const name = typeof chapter.chapterName === 'string' ? chapter.chapterName.trim() : '';

    if (!slug || !name) return;

    const extendedName =
      typeof chapter.chapterNameExtended === 'string' && chapter.chapterNameExtended.trim()
        ? ` - ${chapter.chapterNameExtended.trim()}`
        : '';

    chapters.push({
      name: `${name}${extendedName}`,
      path: slug,
      releaseTime: chapter.chapterDate,
      chapterNumber: chapter.chapterIndex ?? chapter.chapterNumber,
    });
  });

  return chapters;
}

function assertAscending(chapters) {
  for (let i = 1; i < chapters.length; i++) {
    const previous = chapters[i - 1].chapterNumber;
    const current = chapters[i].chapterNumber;

    if (typeof previous !== 'number' || typeof current !== 'number') {
      throw new Error(`Chapter number missing around index ${i}`);
    }

    if (current < previous) {
      throw new Error(`Chapters are not ascending at index ${i}: ${previous} > ${current}`);
    }
  }
}

(async function main() {
  const url = process.argv[2] || 'https://panchonovels.online/novel/esclavo-de-las-sombras';
  const novelSlug = url.split('/novel/')[1]?.replace(/\/$/, '') || '';

  console.log('Fetching', url);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Fetch failed with status ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const chapterMap = new Map();

  $('[x-data]').each((index, el) => {
    const xdata = $(el).attr('x-data') || '';
    if (!xdata.includes('chapters:')) return;

    const chapters = parseChaptersFromSource(xdata);

    chapters.forEach(chapter => {
      const path = `novel/${novelSlug}/${chapter.path}`;
      if (!chapterMap.has(path)) {
        chapterMap.set(path, {
          ...chapter,
          path,
        });
      }
    });
  });

  const sourceOrder = Array.from(chapterMap.values());
  const finalOrder = [...sourceOrder].reverse();

  if (finalOrder.length === 0) {
    throw new Error('No chapters parsed from page x-data');
  }

  assertAscending(finalOrder);

  console.log('Parsed chapters:', finalOrder.length);
  console.log('First chapter:', finalOrder[0]);
  console.log('Last chapter:', finalOrder[finalOrder.length - 1]);
  console.log('Order:', 'ascending old-to-new');
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
