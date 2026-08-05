#!/usr/bin/env node
/* EyeFit — Genera slim-dataset.json desde el dataset completo de
   hasaneyldrm/exercises-dataset (17.4 MB) → subset commiteado (~1 MB).

   Estrategia:
   - Incluye TODOS los ejercicios de DEFAULT_ROUTINE + ALTERNATIVAS
     (normalizados) + todos los del mismo body_part de cada ejercicio
     usado, para que getVariants() siga encontrando alternativas reales.
   - Solo guarda {id, name, image, instr.es, part} (sin weight_male/etc.)
   - Se ejecuta manualmente (npm run gen:slim-data) o en CI si falta.

   Uso: node tools/generate_slim_dataset.js
   Salida: slim-dataset.json
*/
'use strict';

const fs = require('fs');
const path = require('path');

const URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
const OUT = path.join(__dirname, '..', 'slim-dataset.json');

// Normalización idéntica a utils.normalizeName
function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\sà-úá-ú]/g, '')
    .replace(/\s+/g, ' ');
}

async function main() {
  console.log('⬇️  Descargando dataset completo…');
  const resp = await fetch(URL);
  if (!resp.ok) throw new Error('fetch failed: ' + resp.status);
  const full = await resp.json();
  console.log(`   ${full.length} ejercicios en total`);

  // Fuente de ejercicios usados (DEFAULT_ROUTINE + ALTERNATIVAS)
  const utilsSrc = fs.readFileSync(path.join(__dirname, '..', 'utils.js'), 'utf8');

  // Extraer todos los datasets de DEFAULT_ROUTINE (campos "dataset:")
  const used = new Set();
  for (const m of utilsSrc.matchAll(/dataset:\s*"([^"]+)"/g)) used.add(m[1]);
  // Extraer alternativas (arrays de strings españoles en ALTERNATIVAS)
  for (const m of utilsSrc.matchAll(/"([^"]{3,})"\s*,\s*"([^"]{3,})"\s*,\s*"([^"]{3,})"\s*,/g)) {
    used.add(m[1]); used.add(m[2]); used.add(m[3]);
  }

  const wanted = new Set([...used].map(normalizeName).filter(Boolean));
  const byName = new Map();
  for (const ex of full) byName.set(normalizeName(ex.name), ex);

  // 1) Ejercicios exactos usados
  const selected = [];
  const selectedNames = new Set();
  const parts = new Set();
  for (const n of wanted) {
    const ex = byName.get(n);
    if (ex) {
      selected.push(ex);
      selectedNames.add(normalizeName(ex.name));
      if (ex.body_part) parts.add(ex.body_part);
    }
  }
  // 2) Todos los ejercicio del mismo body_part (para variantes automáticas)
  for (const ex of full) {
    if (parts.has(ex.body_part) && !selectedNames.has(normalizeName(ex.name))) {
      selected.push(ex);
      selectedNames.add(normalizeName(ex.name));
    }
  }

  // Slim: solo campos necesarios
  const slim = selected.map(ex => ({
    id: ex.id,
    name: ex.name,
    image: ex.image,
    instr: (ex.instructions && ex.instructions.es) || '',
    part: ex.body_part || ''
  }));

  fs.writeFileSync(OUT, JSON.stringify(slim));
  console.log(`✔ slim-dataset.json generado: ${slim.length} ejercicios (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB) → ${OUT}`);
}

main().catch(err => { console.error('✖', err.message); process.exit(1); });