/* eslint-env node */ /* global process */
import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const pluginsDir = path.join(workspaceRoot, 'plugins');

const IGNORED_PLUGIN_DIRS = new Set(['multisrc', 'multi']);

function listDirectories(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
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

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function main() {
  if (!fs.existsSync(pluginsDir)) {
    console.error('No se encontró la carpeta plugins/.');
    process.exit(1);
  }

  const topLevelDirs = listDirectories(pluginsDir);
  const languageDirs = topLevelDirs
    .filter(d => !IGNORED_PLUGIN_DIRS.has(d))
    .filter(d => d !== 'node_modules');

  const allowedTopLevelTs = new Set(['index.ts']);

  const allPluginFiles = listFilesRecursive(pluginsDir);
  const tsFiles = allPluginFiles.filter(f => f.toLowerCase().endsWith('.ts'));

  /** @type {string[]} */
  const errors = [];

  for (const filePath of tsFiles) {
    const rel = path.relative(workspaceRoot, filePath);
    const relPosix = toPosix(rel);

    // plugins/index.ts es válido
    if (relPosix.startsWith('plugins/') && relPosix.split('/').length === 2) {
      const fileName = relPosix.split('/')[1];
      if (!allowedTopLevelTs.has(fileName)) {
        errors.push(
          `${relPosix} está en plugins/ raíz. Muévelo a plugins/<idioma>/ o justifica por qué debe estar ahí.`,
        );
      }
      continue;
    }

    // plugins/<dir>/...
    const parts = relPosix.split('/');
    const top = parts[1];

    if (!top) continue;

    if (IGNORED_PLUGIN_DIRS.has(top)) {
      // multisrc/ y multi/ tienen su propio layout
      continue;
    }

    if (!languageDirs.includes(top)) {
      errors.push(
        `${relPosix} está bajo plugins/${top}/, pero ${top} no es un idioma reconocido.`,
      );
    }
  }

  if (errors.length) {
    console.error('❌ Validación de layout de plugins falló:\n');
    for (const e of errors) console.error(`- ${e}`);
    console.error(
      `\nIdiomas detectados: ${languageDirs.sort().join(', ')}\n` +
        'Sugerencia: mantén cada plugin en plugins/<idioma>/*.ts',
    );
    process.exit(1);
  }

  console.log('✅ Layout de plugins OK (organizado por idiomas).');
}

main();
