/* eslint-env node */ /* global process */
import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const pluginsDir = path.join(workspaceRoot, 'plugins');

const IGNORED_DIRS = new Set(['multisrc']);

const DEFAULT_TIMEOUT_MS = Number(process.env.AUDIT_TIMEOUT_MS || 12000);
const DEFAULT_CONCURRENCY = Number(process.env.AUDIT_CONCURRENCY || 6);
const MAX_BYTES = Number(process.env.AUDIT_MAX_BYTES || 250_000);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function listFilesRecursive(dirPath) {
  /** @type {string[]} */
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath));
      continue;
    }
    results.push(fullPath);
  }
  return results;
}

function extractPluginMeta(tsSource) {
  const id = /\bid\s*=\s*['"]([^'"]+)['"]/m.exec(tsSource)?.[1];
  const name = /\bname\s*=\s*['"]([^'"]+)['"]/m.exec(tsSource)?.[1];
  const site = /\bsite\s*=\s*['"]([^'"]+)['"]/m.exec(tsSource)?.[1];

  return { id, name, site };
}

async function readTextUpTo(response, maxBytes) {
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let received = 0;
  /** @type {Uint8Array[]} */
  const chunks = [];

  for (; ;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.byteLength;
      chunks.push(value);
      if (received >= maxBytes) break;
    }
  }

  // Cancelar para no descargar el resto
  try {
    await reader.cancel();
  } catch {
    // ignore
  }

  // Decodificar lo acumulado
  let text = '';
  for (const chunk of chunks) text += decoder.decode(chunk, { stream: true });
  text += decoder.decode();
  return text;
}

function classifyHtml(html) {
  const lower = html.toLowerCase();

  if (!lower || lower.length < 2000) return 'invalid';

  // Cloudflare / anti-bot (heurístico)
  if (
    lower.includes('just a moment') &&
    (lower.includes('cloudflare') || lower.includes('cf-'))
  ) {
    return 'challenge';
  }

  // Debe parecer HTML
  const looksHtml =
    lower.includes('<html') ||
    lower.includes('<!doctype html') ||
    lower.includes('<head') ||
    lower.includes('<body');

  if (!looksHtml) return 'invalid';

  // 404 típicos
  if (
    lower.includes('<title>404') ||
    lower.includes('page not found') ||
    lower.includes('404 not found')
  ) {
    return 'not-found';
  }

  return 'ok';
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Un UA simple ayuda con sitios que bloquean el default
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function runLimited(items, limit, worker) {
  /** @type {Array<any>} */
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runner() {
    for (; ;) {
      const current = nextIndex++;
      if (current >= items.length) return;
      results[current] = await worker(items[current], current);
    }
  }

  const runners = Array.from({ length: Math.max(1, limit) }, () => runner());
  await Promise.all(runners);
  return results;
}

function ensureTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function isHttpUrl(u) {
  return (
    typeof u === 'string' &&
    (u.startsWith('http://') || u.startsWith('https://'))
  );
}

async function auditOne(plugin) {
  const siteUrl = ensureTrailingSlash(plugin.site);

  const startedAt = Date.now();
  try {
    const res = await fetchWithTimeout(siteUrl, DEFAULT_TIMEOUT_MS);

    const contentType = res.headers.get('content-type') || '';
    const status = res.status;

    // Aceptamos redirect ok; pero si termina en 4xx/5xx, falla
    if (status >= 400) {
      return {
        ...plugin,
        url: siteUrl,
        ok: false,
        status,
        contentType,
        classification: 'http-error',
        ms: Date.now() - startedAt,
      };
    }

    if (!contentType.toLowerCase().includes('text/html')) {
      // Algunos sitios no mandan content-type bien; igual intentamos con HTML parcial
      // pero lo marcamos para revisión.
    }

    const html = await readTextUpTo(res, MAX_BYTES);
    const classification = classifyHtml(html);

    return {
      ...plugin,
      url: siteUrl,
      ok: classification === 'ok',
      status,
      contentType,
      classification,
      ms: Date.now() - startedAt,
      finalUrl: res.url,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isTimeout = msg.toLowerCase().includes('aborted');

    return {
      ...plugin,
      url: siteUrl,
      ok: false,
      status: null,
      contentType: null,
      classification: isTimeout ? 'timeout' : 'network-error',
      error: msg,
      ms: Date.now() - startedAt,
    };
  }
}

function buildMarkdownReport(results) {
  const totals = results.reduce((acc, r) => {
    acc.total += 1;
    acc[r.classification] = (acc[r.classification] || 0) + 1;
    return acc;
  }, /** @type {Record<string, number>} */({ total: 0 }));

  const lines = [];
  lines.push(`# Plugin Site Audit`);
  lines.push('');
  lines.push(`- Total: ${totals.total}`);
  lines.push(
    `- OK: ${totals.ok || 0} | not-found: ${totals['not-found'] || 0} | invalid: ${totals.invalid || 0} | challenge: ${totals.challenge || 0} | http-error: ${totals['http-error'] || 0} | timeout: ${totals.timeout || 0} | network-error: ${totals['network-error'] || 0}`,
  );
  lines.push('');
  lines.push(`| id | name | site | status | classification | ms |`);
  lines.push(`|---|---|---|---:|---|---:|`);

  for (const r of results) {
    const site = r.url || '';
    const status = r.status ?? '';
    const ms = r.ms ?? '';
    lines.push(
      `| ${r.id || ''} | ${r.name || ''} | ${site} | ${status} | ${r.classification} | ${ms} |`,
    );
  }

  lines.push('');
  lines.push('## Sugerencia de limpieza');
  lines.push('');
  lines.push(
    `- Candidatos a quitar (fácil): classification = not-found / http-error / timeout / network-error`,
  );
  lines.push(
    `- Revisión manual: classification = challenge (Cloudflare/anti-bot)`,
  );

  return lines.join('\n');
}

async function main() {
  if (!fs.existsSync(pluginsDir)) {
    console.error('No se encontró plugins/.');
    process.exit(1);
  }

  const all = listFilesRecursive(pluginsDir)
    .filter(f => f.toLowerCase().endsWith('.ts'))
    .filter(f => toPosix(path.relative(pluginsDir, f)) !== 'index.ts')
    .filter(f => {
      const rel = toPosix(path.relative(pluginsDir, f));
      const top = rel.split('/')[0];
      return top && !IGNORED_DIRS.has(top);
    });

  /** @type {{id?: string, name?: string, site?: string, file: string}[]} */
  const plugins = [];

  for (const file of all) {
    const src = fs.readFileSync(file, 'utf-8');
    const meta = extractPluginMeta(src);
    if (!meta.id || !meta.site) continue;
    if (!isHttpUrl(meta.site)) continue;

    plugins.push({
      ...meta,
      file: toPosix(path.relative(workspaceRoot, file)),
    });
  }

  plugins.sort((a, b) => (a.id || '').localeCompare(b.id || ''));

  console.log(
    `Audit: ${plugins.length} plugins | concurrency=${DEFAULT_CONCURRENCY} timeoutMs=${DEFAULT_TIMEOUT_MS} maxBytes=${MAX_BYTES}`,
  );

  let done = 0;

  const results = await runLimited(plugins, DEFAULT_CONCURRENCY, async p => {
    const r = await auditOne(p);
    done += 1;

    if (done % 25 === 0 || done === plugins.length) {
      process.stdout.write(`Progreso: ${done}/${plugins.length}\n`);
    }

    return r;
  });

  const reportsDir = path.join(workspaceRoot, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const jsonPath = path.join(reportsDir, 'plugin-site-audit.json');
  const mdPath = path.join(reportsDir, 'plugin-site-audit.md');

  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');
  fs.writeFileSync(mdPath, buildMarkdownReport(results), 'utf-8');

  const bad = results.filter(r => !r.ok && r.classification !== 'challenge');
  const challenge = results.filter(r => r.classification === 'challenge');

  console.log(`\n✅ Reporte generado:`);
  console.log(`- ${toPosix(path.relative(workspaceRoot, jsonPath))}`);
  console.log(`- ${toPosix(path.relative(workspaceRoot, mdPath))}`);
  console.log('');
  console.log(`Resumen:`);
  console.log(`- OK: ${results.filter(r => r.ok).length}`);
  console.log(`- Candidatos a quitar (no-OK y no challenge): ${bad.length}`);
  console.log(`- Challenge (revisión manual): ${challenge.length}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});


