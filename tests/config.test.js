/* EyeFit — Tests del algoritmo de progresión (src/modules/config.js)
   config.js es un IIFE de navegador; se carga en un sandbox vm con los
   globals mínimos (utils, persistencia, días). */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CODE = fs.readFileSync(path.join(__dirname, '..', 'src', 'modules', 'config.js'), 'utf8');

function loadConfig() {
  const sandbox = { console };
  sandbox.window = sandbox;
  sandbox.DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  sandbox.EyeFitUtils = {
    escapeHtmlAttr: s => String(s),
    epley1RM: (kg, reps) => (reps <= 1 ? +kg : +kg * (1 + reps / 30)),
    localDateKey: d => d.toISOString().slice(0, 10)
  };
  sandbox.EyeFit = {
    Persistence: {
      getHistory: () => [],
      getPending: () => ({ sessions: [], routine: null, deleted: [] }),
      setPending: () => {},
      getRoutine: () => [],
      lsGet: () => null,
      lsSet: () => {}
    },
    Supabase: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(CODE, sandbox, { filename: 'config.js' });
  return sandbox.EyeFit.Config;
}

const EX = { datasetOriginal: 'barbell bench press', peso_kg: 50, series: 3, reps: 8 };
const historyWith = (kg, reps) => [{
  date: '2026-11-01',
  exercises: [{ dataset: 'barbell bench press', sets: [{ kg, reps, done: true }, { kg, reps, done: true }] }]
}];

test('progresión lineal: al llegar al tope sube el peso (regresión de precedencia)', () => {
  const C = loadConfig();
  C.trainingConfig = { ...C.TRAINING_DEFAULTS, tipo_progresion: 'lineal' };
  const dec = C.computeProgressionDecision(EX, historyWith(50, 10));
  assert.equal(dec.action, 'up');
  assert.equal(dec.delta, 2.5);
  assert.equal(dec.peso_sugerido, 52.5);
});

test('progresión lineal: si peso_kg no es válido usa el peso real del historial', () => {
  const C = loadConfig();
  C.trainingConfig = { ...C.TRAINING_DEFAULTS, tipo_progresion: 'lineal' };
  const dec = C.computeProgressionDecision({ ...EX, peso_kg: undefined }, historyWith(40, 10));
  assert.equal(dec.peso_sugerido, 42.5);
});

test('doble progresión: tope del rango sube el peso', () => {
  const C = loadConfig();
  C.trainingConfig = { ...C.TRAINING_DEFAULTS, tipo_progresion: 'doble' };
  const dec = C.computeProgressionDecision(EX, historyWith(50, 10));
  assert.equal(dec.action, 'up');
  assert.equal(dec.peso_sugerido, 52.5);
});

test('doble progresión: por debajo del mínimo baja el peso', () => {
  const C = loadConfig();
  C.trainingConfig = { ...C.TRAINING_DEFAULTS, tipo_progresion: 'doble' };
  const dec = C.computeProgressionDecision(EX, historyWith(50, 5));
  assert.equal(dec.action, 'down');
  assert.equal(dec.peso_sugerido, 47.5);
});

test('doble progresión: dentro del rango mantiene el peso', () => {
  const C = loadConfig();
  C.trainingConfig = { ...C.TRAINING_DEFAULTS, tipo_progresion: 'doble' };
  const dec = C.computeProgressionDecision(EX, historyWith(50, 8));
  assert.equal(dec.action, 'keep');
  assert.equal(dec.peso_sugerido, 50);
});

test('sin historial no hay decisión de progresión', () => {
  const C = loadConfig();
  assert.equal(C.computeProgressionDecision(EX, []), null);
});
