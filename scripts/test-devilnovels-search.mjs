import { load as cheerioLoad } from 'cheerio';

const term = 'villanas';
const url = `https://devilnovels.com/?post_type=page&s=${encodeURIComponent(term)}`;
console.log('Fetching', url);
const res = await fetch(url, { headers: { 'User-Agent': 'LNReader-plugins-test/1.0' } });
if (!res.ok) {
  console.error('HTTP error', res.status);
  process.exit(1);
}
const body = await res.text();
const $ = cheerioLoad(body);

const results = [];
$('.ast-article-inner').each((i, el) => {
  const block = $(el);
  const a = block.find('h2.entry-title a').first();
  const href = a.attr('href') || '';
  const title = a.text().trim();
  const img = block.find('.post-thumb img').attr('src') || '';
  if (title) results.push({ title, href, img });
});

console.log(`Found ${results.length} results`);
results.slice(0, 20).forEach((r, i) => console.log(`${i+1}. ${r.title} -> ${r.href} [img:${r.img? 'yes' : 'no'}]`));

process.exit(results.length ? 0 : 2);
