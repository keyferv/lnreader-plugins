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

function parseNovelsFromSource(source) {
  if (!source) return [];
  const normalized = decodeHtmlEntities(source);
  const literal = extractArrayLiteral(normalized, 'novels');
  if (!literal) return [];
  try {
    const data = JSON.parse(literal);
    if (!Array.isArray(data)) return [];
    return data
      .map(entry => {
        const slug = entry?.novelSlug || entry?.slug || '';
        const name = entry?.novelName || entry?.name || '';
        const img = entry?.novelImg || entry?.novel_image || '';
        if (!slug || !name) return null;
        return {
          name: String(name).trim(),
          cover: img || null,
          path: `novel/${String(slug).trim()}`,
        };
      })
      .filter(Boolean);
  } catch (e) {
    return [];
  }
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

  // DOM novels (server-rendered)
  const domNovels = [];
  $('ul.grid li').each((i, el) => {
    const name = $(el).find('h3').text().trim();
    const cover = $(el).find('img').attr('src') || null;
    const path = $(el).find('picture a').attr('href') || null;
    if (name && path)
      domNovels.push({ name, cover, path: path.replace(/^\//, '') });
  });

  // x-data novels
  let xDataString = $('[x-data*="novels"][x-data*=":"]').first().attr('x-data');
  if (!xDataString) {
    const all = $('[x-data]').toArray();
    for (const el of all) {
      const d = $(el).attr('x-data');
      if (d && /novels\s*:/.test(d)) {
        xDataString = d;
        break;
      }
    }
  }

  const xDataNovels = parseNovelsFromSource(xDataString);

  console.log('\nDOM (server-rendered) novels:');
  console.log(JSON.stringify(domNovels.slice(0, 50), null, 2));

  console.log('\nX-data (client) novels:');
  console.log(JSON.stringify(xDataNovels.slice(0, 50), null, 2));

  // Merged as plugin would when showLatestNovels = true
  const seen = new Set();
  const merged = [];
  for (const n of domNovels.concat(xDataNovels)) {
    const key = n.path;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(n);
    }
  }

  console.log('\nMerged (DOM then x-data):');
  console.log(JSON.stringify(merged.slice(0, 200), null, 2));
})();
