const cheerio = require('cheerio');

(async function main() {
  const url =
    process.argv[2] ||
    'https://panchonovels.online/novel/la-victima-de-la-academia/ch-1';

  console.log('Fetching', url);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Fetch failed with status ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const content = $('#chapterContent').html() || '';
  const paragraphCount = $('#chapterContent p.mb-2').length;
  const text = $('#chapterContent').text();

  if (!content.trim()) {
    throw new Error('No chapter content found in #chapterContent');
  }

  if (paragraphCount < 5) {
    throw new Error(`Expected chapter paragraphs, got ${paragraphCount}`);
  }

  if (!text.includes('Capítulo 1: Prólogo')) {
    throw new Error('Expected chapter title text was not found');
  }

  if (content.includes('readNav') || content.includes('Haz click sobre el icono')) {
    throw new Error('Chapter content includes reader navigation UI');
  }

  console.log('Paragraphs:', paragraphCount);
  console.log('Starts with:', text.trim().slice(0, 80));
  console.log('Content selector:', '#chapterContent');
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
