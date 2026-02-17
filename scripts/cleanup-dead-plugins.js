/* eslint-env node */ /* global process */
import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const reportsDir = path.join(workspaceRoot, 'reports');

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function parseArgs(argv) {
  const args = new Set(argv);
  const apply = args.has('--apply');
  const mode =
    argv.find(a => a.startsWith('--mode='))?.split('=')[1] || 'strict';
  const input =
    argv.find(a => a.startsWith('--input='))?.split('=')[1] ||
    'reports/plugin-site-audit.json';

  return { apply, mode, input };
}

function loadAuditResults(inputPath) {
  const abs = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(workspaceRoot, inputPath);

  if (!fs.existsSync(abs)) {
    throw new Error(
      `No existe el archivo de auditoría: ${toPosix(path.relative(workspaceRoot, abs))}\n` +
        `Ejecuta primero: npm run audit:plugins`,
    );
  }

  const raw = fs.readFileSync(abs, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('El JSON de auditoría no es un array.');
  }

  return { abs, results: parsed };
}

function isDefinitelyDeadStrict(r) {
  // Solo casos “claros” para borrar sin mucha duda.
  if (r.classification === 'not-found') return true;

  if (r.classification === 'http-error') {
    const s = Number(r.status);
    // 404 / 410: recurso no existe
    if (s === 404 || s === 410) return true;
    // 5xx: sitio cayéndose (aun así, puede ser temporal, pero suele ser mal estado)
    if (s >= 500 && s <= 599) return true;
    return false;
  }

  return false;
}

function isCandidateAggressive(r) {
  // Más agresivo: incluye timeouts y errores de red.
  if (isDefinitelyDeadStrict(r)) return true;
  if (r.classification === 'timeout') return true;
  if (r.classification === 'network-error') return true;
  return false;
}

function pickCandidates(results, mode) {
  const picker =
    mode === 'aggressive' ? isCandidateAggressive : isDefinitelyDeadStrict;

  return results
    .filter(r => r && r.file && typeof r.file === 'string')
    .filter(r => picker(r))
    .map(r => ({
      id: r.id,
      name: r.name,
      file: r.file,
      site: r.site,
      status: r.status ?? null,
      classification: r.classification,
      finalUrl: r.finalUrl,
    }));
}

function writePlan(candidates, auditPath, mode) {
  fs.mkdirSync(reportsDir, { recursive: true });

  const mdPath = path.join(reportsDir, 'plugin-cleanup-plan.md');
  const listPath = path.join(reportsDir, 'plugin-cleanup-list.txt');

  const lines = [];
  lines.push(`# Plugin Cleanup Plan`);
  lines.push('');
  lines.push(`- Mode: ${mode}`);
  lines.push(
    `- Audit input: ${toPosix(path.relative(workspaceRoot, auditPath))}`,
  );
  lines.push(`- Candidates: ${candidates.length}`);
  lines.push('');
  lines.push(`| id | name | file | status | classification | site |`);
  lines.push(`|---|---|---|---:|---|---|`);

  for (const c of candidates) {
    lines.push(
      `| ${c.id || ''} | ${c.name || ''} | ${c.file} | ${c.status ?? ''} | ${c.classification} | ${c.site || ''} |`,
    );
  }

  lines.push('');
  lines.push('## Nota');
  lines.push('');
  lines.push(
    `- Este script solo borra archivos .ts de plugins. Iconos/recursos pueden quedar huérfanos y se pueden limpiar luego.`,
  );

  fs.writeFileSync(mdPath, lines.join('\n'), 'utf-8');
  fs.writeFileSync(
    listPath,
    candidates.map(c => c.file).join('\n') + (candidates.length ? '\n' : ''),
    'utf-8',
  );

  return { mdPath, listPath };
}

function deleteCandidates(candidates) {
  /** @type {{file: string, deleted: boolean, reason?: string}[]} */
  const outcomes = [];

  for (const c of candidates) {
    const abs = path.join(workspaceRoot, c.file);
    if (!abs.toLowerCase().endsWith('.ts')) {
      outcomes.push({ file: c.file, deleted: false, reason: 'no-ts' });
      continue;
    }

    if (!fs.existsSync(abs)) {
      outcomes.push({ file: c.file, deleted: false, reason: 'missing' });
      continue;
    }

    fs.unlinkSync(abs);
    outcomes.push({ file: c.file, deleted: true });
  }

  return outcomes;
}

async function main() {
  const { apply, mode, input } = parseArgs(process.argv.slice(2));
  if (mode !== 'strict' && mode !== 'aggressive') {
    throw new Error(`--mode debe ser strict o aggressive (recibido: ${mode})`);
  }

  const { abs: auditAbs, results } = loadAuditResults(input);
  const candidates = pickCandidates(results, mode);

  const { mdPath, listPath } = writePlan(candidates, auditAbs, mode);

  console.log('✅ Plan generado:');
  console.log(`- ${toPosix(path.relative(workspaceRoot, mdPath))}`);
  console.log(`- ${toPosix(path.relative(workspaceRoot, listPath))}`);
  console.log(`Candidatos (${mode}): ${candidates.length}`);

  if (!apply) {
    console.log('\nModo plan solamente (sin borrar).');
    console.log(
      'Para aplicar borrado: node scripts/cleanup-dead-plugins.js --apply',
    );
    console.log(
      'Para modo agresivo:   node scripts/cleanup-dead-plugins.js --apply --mode=aggressive',
    );
    return;
  }

  const outcomes = deleteCandidates(candidates);
  const deleted = outcomes.filter(o => o.deleted).length;

  console.log(`\n🧹 Borrados: ${deleted}/${outcomes.length}`);
}

main().catch(e => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
