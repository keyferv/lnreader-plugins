/* eslint-env node */ /* global process */
/* eslint-disable no-undef */
import { load as cheerioLoad } from 'cheerio';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const url = 'https://devilnovels.com/listado-de-novelas/';
console.log('Fetching', url);

const res = await fetch(url, {
  headers: { 'User-Agent': 'LNReader-plugins-test/1.0' },
});
if (!res.ok) {
  console.error('HTTP error', res.status);
  process.exit(1);
}
const body = await res.text();
const $ = cheerioLoad(body);

const map = new Map();

$('.pvc-featured-pages-grid .pvc-featured-page-item').each((i, el) => {
  const item = $(el);
  const a = item.find('a').first();
  const href = a.attr('href') || '';
  const img = item.find('img').attr('src') || '';
  const title =
    item.find('p.pvc-page-title a').text().trim() ||
    a.attr('title') ||
    a.text().trim();
  const path = href.replace('https://devilnovels.com/', '');
  if (title) map.set(path || href, { name: title, path, cover: img });
});

$('p.pvc-page-title a').each((i, el) => {
  const a = $(el);
  const href = a.attr('href') || '';
  const title = a.text().trim();
  const parent = a.closest('.pvc-featured-page-item');
  const img =
    parent && parent.length ? parent.find('img').attr('src') || '' : '';
  const path = href.replace('https://devilnovels.com/', '');
  if (title) map.set(path || href, { name: title, path, cover: img });
});

$('table tbody tr').each((i, el) => {
  const tds = $(el).find('td');
  if (tds.length < 1) return;
  const left = tds.first();
  const titleA = left.find('a').first();
  const href = titleA.attr('href') || '';
  const name = titleA.text().trim();
  const img = left.find('img').attr('src') || '';
  const path = href.replace('https://devilnovels.com/', '');
  if (name) map.set(path || href, { name, path, cover: img });
});

const all = Array.from(map.values());
console.log('Total found:', all.length);

async function page(n) {
  const perPage = 10;
  const start = (n - 1) * perPage;
  const batch = all.slice(start, start + perPage);
  console.log(`\nPage ${n} -> items ${start + 1}-${start + batch.length}`);
  batch.forEach((b, i) =>
    console.log(`${start + i + 1}. ${b.name} -> ${b.path}`),
  );
  await sleep(600);
}

await page(1);
await page(2);
await page(3);

process.exit(0);


