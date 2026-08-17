/* EyeFit — Tests unitarios core de utils.js (node:test, sin dependencias)
   Funciones principales. Edge cases → tests/utils-edge.test.js (refactor #6). */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  getApodo, epley1RM, formatRest, normalizeName,
  buildExerciseSets, sortRoutine, escapeHtmlAttr,
  localDateKey, genUUID, clampNum, isValidDay
} = require('../src/utils.js');

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

/* ============ escapeHtmlAttr (XSS fix) ============ */
test('escapeHtmlAttr: escapa comillas, &, < > para atributos', () => {
  assert.equal(escapeHtmlAttr('"><script>alert(1)</script>'),
    '\u0026quot;\u0026gt;\u0026lt;script\u0026gt;alert(1)\u0026lt;/script\u0026gt;');
});

test('escapeHtmlAttr: tolera null/undefined/numbers', () => {
  assert.equal(escapeHtmlAttr(null), '');
  assert.equal(escapeHtmlAttr(undefined), '');
  assert.equal(escapeHtmlAttr(42), '42');
});

/* ============ localDateKey (fix streak TZ) ============ */
test('localDateKey: usa componentes locales, no UTC', () => {
  const d = new Date(2026, 2, 8, 0, 30); // 8 marzo 00:30 hora local
  const key = localDateKey(d);
  const tzOff = -new Date(2026, 2, 8).getTimezoneOffset();
  const expected = tzOff >= 0 ? '2026-03-08' : '2026-03-07';
  assert.equal(key, expected);
});

test('localDateKey: fecha inválida → cadena vacía', () => {
  assert.equal(localDateKey(new Date('invalid')), '');
});

/* ============ genUUID ============ */
test('genUUID: genera un UUID v4 válido', () => {
  const uuid = genUUID();
  assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('genUUID: genera valores únicos', () => {
  const a = genUUID(), b = genUUID();
  assert.notEqual(a, b);
});

/* Los session_id van a Supabase (upsert onConflict), así que genUUID debe
   seguir generando v4 válidos y únicos incluso sin crypto.randomUUID
   (p. ej. en contextos no seguros): usa crypto.getRandomValues (CSPRNG). */
test('genUUID: fallback con crypto.getRandomValues sigue siendo v4 válido y único', () => {
  const original = crypto.randomUUID;
  try {
    crypto.randomUUID = undefined; /* fuerza la ruta getRandomValues */
    const seen = new Set();
    for (let i = 0; i < 50; i++) {
      const u = genUUID();
      assert.match(u, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      seen.add(u);
    }
    assert.equal(seen.size, 50);
  } finally {
    crypto.randomUUID = original;
  }
});

/* ============ clampNum ============ */
test('clampNum: limita dentro del rango', () => {
  assert.equal(clampNum(250, 0, 200, 0), 200);
  assert.equal(clampNum(-5, 0, 200, 0), 0);
  assert.equal(clampNum(42.5, 0, 200, 0), 42.5);
});

test('clampNum: no numérico → fallback', () => {
  assert.equal(clampNum('abc', 0, 200, 10), 10);
  assert.equal(clampNum(NaN, 0, 200, 10), 10);
});

/* ============ isValidDay ============ */
test('isValidDay: acepta días válidos y rechaza otros', () => {
  assert.equal(isValidDay('Lunes'), true);
  assert.equal(isValidDay('VIERNES'), true);
  assert.equal(isValidDay('Sabado'), false);
  assert.equal(isValidDay(''), false);
  assert.equal(isValidDay(null), false);
});
