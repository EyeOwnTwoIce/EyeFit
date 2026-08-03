/* EyeFit — Tests unitarios de utils.js (node:test, sin dependencias) */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  getApodo, epley1RM, setVolume, formatRest, normalizeName,
  buildExerciseSets, isValidSessionRecord, computeRemainingSessions, sortRoutine
} = require('../utils.js');

/* ============ getApodo ============ */
test('getApodo: devuelve apodo mapeado', () => {
  assert.equal(getApodo({ dataset: 'barbell bench press' }), 'Press Banca');
});

test('getApodo: cae a las primeras 3 palabras del nombre', () => {
  assert.equal(getApodo({ dataset: 'ejercicio desconocido', nombre_es: 'Press banca plano con barra' }), 'Press banca plano');
});

test('getApodo: maneja nombre vacío', () => {
  assert.equal(getApodo({ dataset: 'x', nombre_es: '' }), '');
});

/* ============ epley1RM ============ */
test('epley1RM: fórmula Epley correcta (100kg × 10 reps → 133.3)', () => {
  assert.equal(epley1RM(100, 10), 133.3);
});

test('epley1RM: 1 rep → peso directo', () => {
  assert.equal(epley1RM(100, 1), 100);
});

test('epley1RM: 0 reps → 0', () => {
  assert.equal(epley1RM(100, 0), 0);
});

test('epley1RM: peso 0 → 0', () => {
  assert.equal(epley1RM(0, 10), 0);
});

test('epley1RM: NaN en kg → 0 (sin NaN propagado)', () => {
  assert.equal(epley1RM(undefined, 10), 0);
  assert.equal(Number.isNaN(epley1RM(NaN, 10)), false);
});

/* ============ setVolume ============ */
test('setVolume: peso × reps', () => {
  assert.equal(setVolume(40, 8), 320);
});

test('setVolume: NaN → 0', () => {
  assert.equal(setVolume(undefined, 8), 0);
});

/* ============ formatRest ============ */
test('formatRest: minutos y segundos', () => {
  assert.equal(formatRest(180), '3min');
  assert.equal(formatRest(185), '3m 5s');
  assert.equal(formatRest(60), '1min');
  assert.equal(formatRest(45), '45s');
});

test('formatRest: 0 o falsy → em dash', () => {
  assert.equal(formatRest(0), '—');
  assert.equal(formatRest(null), '—');
  assert.equal(formatRest(undefined), '—');
});

/* ============ normalizeName ============ */
test('normalizeName: quita acentos y normaliza espacios', () => {
  assert.equal(normalizeName('  Press Banca  Plano '), 'press banca plano');
});

test('normalizeName: tolera null/undefined', () => {
  assert.equal(normalizeName(null), '');
  assert.equal(normalizeName(undefined), '');
});

/* ============ buildExerciseSets (bug NaN, BUG-2) ============ */
test('buildExerciseSets: sin historial usa fallback de la rutina', () => {
  const ex = { series: 3, peso_kg: 40, reps: 8 };
  const sets = buildExerciseSets(ex, null);
  assert.equal(sets.length, 3);
  for (const s of sets) {
    assert.equal(s.kg, 40);
    assert.equal(s.reps, 8);
    assert.equal(s.done, false);
  }
});

test('buildExerciseSets: con historial sano usa los pesos reales', () => {
  const ex = { series: 3, peso_kg: 40, reps: 8 };
  const lastPerf = [{ kg: 42.5, reps: 9 }, { kg: 45, reps: 8 }, { kg: 45, reps: 7 }];
  const sets = buildExerciseSets(ex, lastPerf);
  assert.deepEqual(sets.map(s => s.kg), [42.5, 45, 45]);
  assert.deepEqual(sets.map(s => s.reps), [9, 8, 7]);
});

test('buildExerciseSets: datos corruptos (undefined/NaN/"") caen al fallback, sin NaN (BUG-2)', () => {
  const ex = { series: 3, peso_kg: 40, reps: 8 };
  const lastPerf = [
    { kg: undefined, reps: undefined },
    { kg: NaN, reps: NaN },
    { kg: '', reps: '' },
    { kg: 50, reps: 10 } // extra, se ignora si no hay más series
  ];
  const sets = buildExerciseSets(ex, lastPerf);
  assert.equal(sets.length, 3);
  for (const s of sets) {
    assert.equal(Number.isNaN(s.kg), false, `kg no debe ser NaN (era ${s.kg})`);
    assert.equal(Number.isNaN(s.reps), false, `reps no debe ser NaN (era ${s.reps})`);
    assert.equal(Number.isFinite(s.kg), true);
    assert.equal(Number.isFinite(s.reps), true);
  }
});

test('buildExerciseSets: historial con menos series rellena con la última y nunca NaN', () => {
  const ex = { series: 4, peso_kg: 40, reps: 8 };
  const lastPerf = [{ kg: 50, reps: 6 }];
  const sets = buildExerciseSets(ex, lastPerf);
  assert.equal(sets.length, 4);
  for (const s of sets) {
    assert.equal(Number.isFinite(s.kg), true);
    assert.equal(Number.isFinite(s.reps), true);
  }
  assert.deepEqual(sets.map(s => s.kg), [50, 50, 50, 50]);
});

/* ============ isValidSessionRecord (validación historial, F2-A2) ============ */
test('isValidSessionRecord: registro válido', () => {
  const ok = { date: '2026-01-01T10:00:00.000Z', day: 'Lunes', exercises: [ { dataset: 'x', sets: [] } ] };
  assert.equal(isValidSessionRecord(ok), true);
});

test('isValidSessionRecord: rechaza null/undefined/arrays/primitivos', () => {
  assert.equal(isValidSessionRecord(null), false);
  assert.equal(isValidSessionRecord(undefined), false);
  assert.equal(isValidSessionRecord([]), false);
  assert.equal(isValidSessionRecord('string'), false);
  assert.equal(isValidSessionRecord(42), false);
});

test('isValidSessionRecord: rechaza sin date, sin day o sin exercises', () => {
  assert.equal(isValidSessionRecord({ day: 'Lunes', exercises: [] }), false);
  assert.equal(isValidSessionRecord({ date: '2026-01-01', exercises: [] }), false);
  assert.equal(isValidSessionRecord({ date: '2026-01-01', day: 'Lunes' }), false);
  assert.equal(isValidSessionRecord({ date: '', day: 'Lunes', exercises: [] }), false);
});

/* ============ computeRemainingSessions (bug pérdida de datos, BUG-1) ============ */
test('computeRemainingSessions: todas suben → cola vacía', () => {
  const remaining = computeRemainingSessions([1, 2, 3], () => true);
  assert.deepEqual(remaining, []);
});

test('computeRemainingSessions: primera falla → todas permanecen', () => {
  const remaining = computeRemainingSessions([1, 2, 3], () => false);
  assert.deepEqual(remaining, [1, 2, 3]); // NINGUNA se pierde
});

test('computeRemainingSessions: falla la segunda → esa y las siguientes permanecen (BUG-1)', () => {
  const remaining = computeRemainingSessions([1, 2, 3, 4],
    (s) => s !== 2); // falla el 2
  assert.deepEqual(remaining, [2, 3, 4]); // NO solo [2]
});

test('computeRemainingSessions: falla la última → solo la última permanece', () => {
  const remaining = computeRemainingSessions([1, 2, 3],
    (s) => s !== 3);
  assert.deepEqual(remaining, [3]);
});

test('computeRemainingSessions: lista vacía → vacía', () => {
  const remaining = computeRemainingSessions([], () => true);
  assert.deepEqual(remaining, []);
});

/* ============ sortRoutine ============ */
test('sortRoutine: ordena por día y luego por orden', () => {
  const routine = [
    { dia: 'Viernes', orden: 2 },
    { dia: 'Lunes', orden: 2 },
    { dia: 'Lunes', orden: 1 },
    { dia: 'Miércoles', orden: 1 }
  ];
  const sorted = sortRoutine(routine);
  assert.deepEqual(sorted.map(e => `${e.dia}-${e.orden}`), ['Lunes-1', 'Lunes-2', 'Miércoles-1', 'Viernes-2']);
});

test('sortRoutine: día desconocido va al final', () => {
  const routine = [
    { dia: 'Viernes', orden: 1 },
    { dia: 'Sabado', orden: 1 },
    { dia: 'Lunes', orden: 1 }
  ];
  const sorted = sortRoutine(routine);
  assert.deepEqual(sorted.map(e => e.dia), ['Lunes', 'Viernes', 'Sabado']);
});