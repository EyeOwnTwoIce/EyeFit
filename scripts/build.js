#!/usr/bin/env node
/* EyeFit — Build script (esbuild)
   - Comprime CSS → dist/styles.[hash].css
   - Bundlea JS (IIFE) → dist/app.[hash].js
   - Inyecta nombres hasheados en dist/index.html
   - Copia estáticos (rutina.xlsx, manifest.json, icons/, etc.)
   - Genera dist/sw.js con CACHE versionado + CORE_ASSETS hasheados */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { build } = require('esbuild');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const STATIC_FILES = [
  'manifest.json', 'rutina.xlsx', 'slim-dataset.json',
  'robots.txt', 'sitemap.xml', 'utils.js', 'supabase.js',
  'xlsx.full.min.js'
];

// Archivos que viven en src/ y se copian tal cual a dist/
const SRC_FILES = ['db.js'];

const STATIC_DIRS = ['icons'];

function hashSum(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

function rmDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function copyStatic() {
  // Archivos static del root → dist/
  for (const f of STATIC_FILES) {
    const from = path.join(ROOT, f);
    if (!fs.existsSync(from)) continue;
    fs.copyFileSync(from, path.join(DIST, f));
  }
  // Archivos que viven en src/ (db.js) → dist/
  for (const f of SRC_FILES) {
    const from = path.join(SRC, f);
    if (!fs.existsSync(from)) continue;
    fs.copyFileSync(from, path.join(DIST, f));
  }
  // Directorios
  for (const d of STATIC_DIRS) {
    fs.cpSync(path.join(ROOT, d), path.join(DIST, d), { recursive: true });
  }
}

async function buildCss() {
  const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');
  const minResult = await build({
    stdin: { contents: css, loader: 'css', resolveDir: SRC },
    minify: true,
    write: false,
    logLevel: 'silent'
  });
  const minCss = minResult.outputFiles[0].text;
  const name = `styles.${hashSum(Buffer.from(minCss))}.css`;
  fs.writeFileSync(path.join(DIST, name), minCss);
  return name;
}

async function buildJs() {
  const result = await build({
    entryPoints: [path.join(SRC, 'app.js')],
    bundle: false, // app.js se basa en window.EyeFitUtils/window.supabase globales; no bundlear
    format: 'iife',
    minify: true,
    write: false,
    logLevel: 'silent'
  });
  const js = result.outputFiles[0].text;
  const name = `app.${hashSum(Buffer.from(js))}.js`;
  fs.writeFileSync(path.join(DIST, name), js);
  return name;
}

function buildHtml(cssName, jsName) {
  let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  html = html.replace('<!--EYEFIT_CSS-->', cssName);
  html = html.replace('<!--EYEFIT_APP_JS-->', `<script src="${jsName}" defer></script>`);
  fs.writeFileSync(path.join(DIST, 'index.html'), html);
}

function buildSw(coreAssets) {
  let sw = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8');
  const version = `eyefit-v${Date.now().toString(36)}`;
  sw = sw.replace('/*EYEFIT_CACHE*/', JSON.stringify(version));
  sw = sw.replace('/*EYEFIT_ASSETS*/', JSON.stringify(coreAssets));
  fs.writeFileSync(path.join(DIST, 'sw.js'), sw);
}

(async () => {
  rmDist();
  copyStatic();
  const [cssName, jsName] = await Promise.all([buildCss(), buildJs()]);
  buildHtml(cssName, jsName);
  const coreAssets = ['./', './index.html', `./${cssName}`, `./${jsName}`,
    './manifest.json', './utils.js', './db.js', './supabase.js', './rutina.xlsx',
    './slim-dataset.json', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png'];
  buildSw(coreAssets);
  console.log(`✔ Build OK → dist/ (${cssName}, ${jsName})`);
})();