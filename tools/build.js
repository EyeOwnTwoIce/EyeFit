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
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const VENDOR = path.join(ROOT, 'vendor');

/* Origen de cada arquivo que se copia tal cual a dist/ */
const STATIC_SOURCES = [
  'public/manifest.json', 'public/rutina.xlsx', 'data/slim-dataset.json', 'data/exercise-meta.json',
  'public/robots.txt', 'public/sitemap.xml', 'src/utils.js', 'vendor/supabase.js',
  'vendor/xlsx.full.min.js'
];

// Destino en dist/ (nombre archivo)
const STATIC_FILES = [
  'manifest.json', 'rutina.xlsx', 'slim-dataset.json', 'exercise-meta.json',
  'robots.txt', 'sitemap.xml', 'utils.js', 'supabase.js',
  'xlsx.full.min.js'
];

// Archivos que viven en src/ y se copian tal cual a dist/
const SRC_FILES = ['db.js'];

// Carpetas fuente (relativas a ROOT) cuyo CONTENIDO va a dist/<basename>
const STATIC_DIRS = ['public/icons'];

function hashSum(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

function rmDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function copyStatic() {
  // Archivos static organizados → dist/ (mantienen el nombre en dist)
  for (let i = 0; i < STATIC_FILES.length; i++) {
    const from = path.join(ROOT, STATIC_SOURCES[i] || STATIC_FILES[i]);
    const to = path.join(DIST, STATIC_FILES[i]);
    if (!fs.existsSync(from)) continue;
    fs.copyFileSync(from, to);
  }
  // Archivos que viven en src/ (db.js) → dist/
  for (const f of SRC_FILES) {
    const from = path.join(SRC, f);
    if (!fs.existsSync(from)) continue;
    fs.copyFileSync(from, path.join(DIST, f));
  }
  // Directorios: icons vive en public/ y se copia a la raíz de dist/ (como dist/icons)
  for (const src of STATIC_DIRS) {
    const fromDir = path.join(ROOT, src);
    if (!fs.existsSync(fromDir)) continue;
    const baseName = path.basename(src); // "icons"
    fs.cpSync(fromDir, path.join(DIST, baseName), { recursive: true });
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

/* Extrae el CSS crítico (shell visible: header + tabbar) y lo minifica
   para inyectarlo inline en <head> (evita render-blocking del CSS completo). */
async function buildCriticalCss() {
  const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');
  const markerIdx = css.indexOf('EYEFIT_CRITICAL_END');
  // Incluir el cierre del comentario que contiene el marcador
  const commentEnd = markerIdx >= 0 ? css.indexOf('*/', markerIdx) : -1;
  const critical = commentEnd >= 0
    ? css.slice(0, commentEnd + 2)
    : (markerIdx >= 0 ? css.slice(0, markerIdx) : css);
  const minResult = await build({
    stdin: { contents: critical, loader: 'css', resolveDir: SRC },
    minify: true,
    write: false,
    logLevel: 'silent'
  });
  return minResult.outputFiles[0].text;
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

function buildHtml(cssName, jsName, criticalCss) {
  let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  html = html.replace('/*EYEFIT_CRITICAL_CSS*/', criticalCss);
  /* Reemplazar TODAS las ocurrencias del CSS filename (link + noscript) */
  html = html.split('<!--EYEFIT_CSS-->').join(cssName);
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
  const [cssName, jsName, criticalCss] = await Promise.all([buildCss(), buildJs(), buildCriticalCss()]);
  buildHtml(cssName, jsName, criticalCss);
  const coreAssets = ['./', './index.html', `./${cssName}`, `./${jsName}`,
    './manifest.json', './utils.js', './db.js', './supabase.js', './rutina.xlsx',
    './slim-dataset.json', './exercise-meta.json', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png'];
  buildSw(coreAssets);
  console.log(`✔ Build OK → dist/ (${cssName}, ${jsName}, critical ${criticalCss.length} bytes)`);
})();