const cheerio = require('cheerio');

function normalizePath(p) {
  return p ? p.replace(/^\//, '').trim() : '';
}

(async function main() {
  const url = 'https://panchonovels.online/home';
  console.log('Fetching', url);
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Fetch failed', res.status);
    process.exit(1);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  // Parse carousel (popular)
  const popular = [];
  $('div.embla > div.flex > div').each((i, el) => {
    const name = $(el).find('span.text-white.text-base.font-semibold').text().trim();
    const cover = $(el).find('img').attr('src') || null;
    const path = $(el).find('a').attr('href') || null;
    if (name && path) popular.push({ name, cover, path: normalizePath(path) });
  });

  // Parse dom recents
  const recents = [];
  $('ul.grid li').each((i, el) => {
    const name = $(el).find('h3').text().trim();
    const cover = $(el).find('img').attr('src') || null;
    const path = $(el).find('picture a').attr('href') || null;
    if (name && path) recents.push({ name, cover, path: normalizePath(path) });
  });

  // Compute overlap by path
  const popularPaths = new Set(popular.map(p => p.path));
  const recentsPaths = new Set(recents.map(r => r.path));
  const overlap = [...popularPaths].filter(p => recentsPaths.has(p));

  console.log('\nPopular (carousel) count:', popular.length);
  console.log(JSON.stringify(popular, null, 2));

  console.log('\nRecents (DOM) count:', recents.length);
  console.log(JSON.stringify(recents, null, 2));

  console.log('\nOverlap count:', overlap.length);
  console.log(JSON.stringify(overlap, null, 2));

  if (overlap.length === 0) {
    console.log('\nResult: No overlap — popular and recents are distinct.');
  } else {
    console.log('\nResult: There is overlap — some items appear in both lists.');
  }
})();
