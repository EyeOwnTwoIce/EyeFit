#!/usr/bin/env node
/* EyeFit — Resuelve la versión del release actual.
   Prioridad:
     1. Env EYEFIT_VERSION (lo inyecta el CI tras esperar al tag de auto-tag.yml).
     2. Último tag vX.Y.Z que apunta al commit actual (git tag --points-at HEAD),
        que es la fuente de verdad del release automático.
     3. package.json (fallback: desarrollo sin tags o fuera de git).
   Uso: node tools/current_version.js   (imprime solo el número, sin 'v') */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function gitTagAtHead() {
  try {
    const out = execSync(
      'git tag --points-at HEAD 2>/dev/null | grep -E "^v[0-9]" | sort -V | tail -1 | sed "s/^v//"',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    return out || null;
  } catch (_) { return null; }
}

function pkgVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return pkg.version || '0.0.0';
  } catch (_) { return '0.0.0'; }
}

function currentVersion() {
  if (process.env.EYEFIT_VERSION) return process.env.EYEFIT_VERSION;
  return gitTagAtHead() || pkgVersion();
}

module.exports = { currentVersion, gitTagAtHead, pkgVersion };

if (require.main === module) {
  process.stdout.write(currentVersion());
}
