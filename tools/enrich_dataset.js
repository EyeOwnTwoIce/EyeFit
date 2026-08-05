#!/usr/bin/env node
/* EyeFit — Generador de metadatos de ejercicios (exercise-meta.json)
   Amplía slim-dataset.json con:
   - equip:  tipo de equipamiento (barbell, dumbbell, cable, machine, band,
             kettlebell, bodyweight, other)
   - muscle: músculo primario (derivado de part)
   - secondary: músculos secundarios (reglas + heurísticas de nombre)

   También imprime (stdout) un bloque JS con las primeras N entradas
   para ampliar EMBEDDED_IMAGES en src/app.js si se pide --images=N.

   Uso:
     node tools/enrich_dataset.js                → genera exercise-meta.json
     node tools/enrich_dataset.js --images=120   → además imprime bloque EMBEDDED_IMAGES
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATASET = path.join(ROOT, 'slim-dataset.json');
const OUT = path.join(ROOT, 'exercise-meta.json');

/* ---------- Clasificación de equipamiento ---------- */
const EQUIP_RULES = [
  { kw: ['barbell'],                        equip: 'barbell' },
  { kw: ['dumbbell'],                       equip: 'dumbbell' },
  { kw: ['kettlebell'],                     equip: 'kettlebell' },
  { kw: ['cable'],                          equip: 'cable' },
  { kw: ['lever ', 'lever-', 'assisted', 'smith', 'machine ', 'machine-'], equip: 'machine' },
  { kw: ['band'],                           equip: 'band' },
  { kw: ['bodyweight', 'bodyweight squatting', 'bodyweight standing', ' push-up', 'push-up', 'push up',
         ' pull-up', 'pull-up', 'pull up', ' chin-up', 'chin-up', 'close-grip push-up', 'chest dip',
         'bench dip', 'dip (', 'deep push', 'drop push', 'clap push', 'diamond push', 'archer push',
         'decline push', 'flexiones', 'squat', 'lunge', 'crunch', 'plank', 'sit-up', 'bridge',
         'jump', 'kickback', 'leg raise', 'toe touch', 'stretch', 'swing', 'yoga', 'ankle circles',
         'balance board', 'body-up', 'back lever', 'skater', 'burpee', 'mountain climber'], equip: 'bodyweight' }
];
function classifyEquip(name){
  const n = String(name || '').toLowerCase();
  for(const rule of EQUIP_RULES){
    if(rule.kw.some(k => n.includes(k))) return rule.equip;
  }
  return 'other';
}

/* ---------- Músculo primario desde part ---------- */
const PART_MUSCLE = {
  'chest':       'Pectoral mayor',
  'back':        'Dorsal ancho / Espalda',
  'shoulders':   'Deltoides',
  'upper arms':  'Bíceps y tríceps',
  'upper legs':  'Cuádriceps / Isquiotibiales',
  'lower legs':  'Gemelos y sóleo'
};
function primaryMuscle(part){
  return PART_MUSCLE[part] || part || '';
}

/* ---------- Músculos secundarios ---------- */
const SECONDARY_RULES = [
  /* Press de pecho → tríceps + deltoides anterior */
  { kw: ['bench press', 'incline press', 'decline press', 'chest press', 'push-up', 'push up', 'close-grip bench'],
    sec: ['Deltoides anterior', 'Tríceps braquial'] },
  /* Press de hombro → tríceps */
  { kw: ['shoulder press', 'military press', 'overhead press', 'arnold press', 'dumbbell press', 'clean and press'],
    sec: ['Tríceps braquial', 'Pectoral mayor (porción alta)'] },
  /* Remo / jalones → bíceps */
  { kw: ['row', 'pulldown', 'pull-up', 'pull up', 'chin-up', 'chin up', 'face pull', 'rear delt'],
    sec: ['Bíceps braquial', 'Romboides'] },
  /* Sentadillas → glúteos + core */
  { kw: ['squat', 'leg press', 'lunge', 'step-up', 'step up', 'hack squat'],
    sec: ['Glúteo mayor', 'Core (recto abdominal)'] },
  /* Peso muerto → glúteos + espalda baja */
  { kw: ['deadlift', 'good morning', 'hip thrust', 'glute bridge', 'back extension', 'stiff leg'],
    sec: ['Glúteo mayor', 'Erectores espinales'] },
  /* Cruces / flys de pecho → deltoides anterior */
  { kw: ['fly', 'crossover', 'cable standing fly', 'pec deck'],
    sec: ['Deltoides anterior'] },
  /* Elevaciones laterales → trapecio (sometimes) */
  { kw: ['lateral raise', 'lateral delt', 'upright row'],
    sec: ['Trapecio superior'] },
  /* Peso muerto rumano / curl femoral → glúteos */
  { kw: ['romanian', 'leg curl', 'femoral', 'good morning'],
    sec: ['Glúteo mayor'] },
  /* Fondos tríceps → tríceps (focalíza tríceps con pecho) */
  { kw: ['triceps extension', 'tricep extension', 'pushdown', 'kickback', 'french press', 'skull crusher'],
    sec: ['Ancóneo'] },
  /* Pullover → dorsal */
  { kw: ['pullover'],
    sec: ['Dorsal ancho'] },
  /* Sit-up / crunch → flexores de cadera */
  { kw: ['crunch', 'sit-up', 'sit up'],
    sec: ['Flexores de cadera (psoas)'] },
  /* Extensiones de rodilla → sin secundario relevante */
  { kw: ['leg extension'],
    sec: [] }
];
function secondaryMuscles(name){
  const n = String(name || '').toLowerCase();
  for(const rule of SECONDARY_RULES){
    if(rule.kw.some(k => n.includes(k))) return rule.sec;
  }
  /* Isquiotibiales/gemelos/aislamiento puro → sin secundarios */
  return [];
}

/* ---------- Generar metadata ---------- */
function buildMeta(){
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  const exercises = {};
  for(const ex of dataset){
    const key = ex.name;
    exercises[key] = {
      id: ex.id,
      equip: classifyEquip(ex.name),
      muscle: primaryMuscle(ex.part),
      secondary: secondaryMuscles(ex.name)
    };
  }
  return {
    meta: { version: 1, updated: new Date().toISOString(), count: dataset.length },
    exercises
  };
}

/* ---------- Generar bloque JS para EMBEDDED_IMAGES ---------- */
function genImagesBlock(dataset, n){
  const entries = [];
  for(const ex of dataset){
    const key = ex.name;
    if(!key) continue;
    /* Solo ejercicios con nombre único normalizado (evita duplicados/colisiones) */
    const base = String(ex.image || '').replace('images/', '').replace('.jpg', '').replace('.png', '');
    if(!base) continue;
    entries.push([key, base]);
    if(entries.length >= n) break;
  }
  const lines = entries.map(([k, v]) =>
    `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
  return `const EMBEDDED_IMAGES = {\n${lines},\n};`;
}

/* ---------- Main ---------- */
const meta = buildMeta();
fs.writeFileSync(OUT, JSON.stringify(meta, null, 2), 'utf8');
console.log(`✔ exercise-meta.json generado (${meta.meta.count} ejercicios, ${meta.meta.count * 0} grupos)`);

const args = process.argv.slice(2);
const imgArg = args.find(a => a.startsWith('--images='));
if(imgArg){
  const n = parseInt(imgArg.split('=')[1], 10) || 120;
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  console.log('\n/* ==== Bloque ampliado EMBEDDED_IMAGES (pegado en src/app.js) ==== */');
  console.log(genImagesBlock(dataset, n));
  console.log('/* ==== Fin bloque ==== */');
}