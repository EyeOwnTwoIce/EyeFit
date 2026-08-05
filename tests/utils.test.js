/* EyeFit — Tests unitarios de utils.js (node:test, sin dependencias) */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  getApodo, epley1RM, formatRest, normalizeName,
  buildExerciseSets, isValidSessionRecord, computeRemainingSessions, sortRoutine,
  escapeHtmlAttr, localDateKey, genUUID, clampNum, isValidDay, sanitizeRoutineRow,
  rebaseElapsed, mergeHistoryBySessionId, DAY_ORDER, DEFAULT_ROUTINE, ALTERNATIVAS
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

/* ============ sanitizeRoutineRow (XLSX sanitize fix) ============ */
test('sanitizeRoutineRow: normaliza día a DAY_ORDER y clamp numéricos', () => {
  const r = sanitizeRoutineRow({
    dia: ' lunes ', orden: 1, nombre_es: 'Press banca',
    series: 99, reps: 999, peso_kg: 99999, descanso_s: -10
  });
  assert.equal(r.dia, 'Lunes');
  assert.equal(r.series, 20);
  assert.equal(r.reps, 100);
  assert.equal(r.peso_kg, 500);
  assert.equal(r.descanso_s, 0);
});

test('sanitizeRoutineRow: rechaza día desconocido o sin nombre', () => {
  assert.equal(sanitizeRoutineRow({ dia: 'Sabado', nombre_es: 'X' }), null);
  assert.equal(sanitizeRoutineRow({ dia: 'Lunes', nombre_es: '   ' }), null);
  assert.equal(sanitizeRoutineRow(null), null);
});

test('sanitizeRoutineRow: no numéricos caen a defaults', () => {
  const r = sanitizeRoutineRow({ dia: 'Lunes', nombre_es: 'X', series: 'abc', reps: 'abc', peso_kg: 'abc', descanso_s: 'abc' });
  assert.equal(r.series, 3);
  assert.equal(r.reps, 8);
  assert.equal(r.peso_kg, 0);
  assert.equal(r.descanso_s, 90);
});

/* ============ rebaseElapsed (fix duración inflada) ============ */
test('rebaseElapsed: suma el gap wall-clock a baseElapsed', () => {
  const saved = { startTime: 1000, baseElapsed: 60 };
  const now = 1000 + 10 * 1000; // 10s después
  const out = rebaseElapsed(saved, now);
  assert.equal(out.baseElapsed, 70);
  assert.equal(out.startTime, now);
  assert.equal(out.saved, undefined);
});

test('rebaseElapsed: gap negativo se trunca a 0', () => {
  const saved = { startTime: 1000, baseElapsed: 5 };
  const out = rebaseElapsed(saved, 500);
  assert.equal(out.baseElapsed, 5);
});

test('rebaseElapsed: sin startTime usa now como base', () => {
  const out = rebaseElapsed({ baseElapsed: 10 }, 5000);
  assert.equal(out.baseElapsed, 10);
  assert.equal(out.startTime, 5000);
});

/* ============ mergeHistoryBySessionId (fix dedup + LWW) ============ */
test('mergeHistoryBySessionId: dedup por session_id', () => {
  const local = [{ session_id: 'a', date: '2026-01-01T10:00:00Z', day: 'Lunes', exercises: [] }];
  const server = [{ session_id: 'a', date: '2026-01-01T10:00:00Z', day: 'Lunes', exercises: [] }];
  const merged = mergeHistoryBySessionId(local, server);
  assert.equal(merged.length, 1);
});

test('mergeHistoryBySessionId: mantiene dos sesiones del mismo día con session_id distinto', () => {
  const local = [{ session_id: 'a', date: '2026-01-01T10:00:00Z', day: 'Lunes', exercises: [] }];
  const server = [{ session_id: 'b', date: '2026-01-01T18:00:00Z', day: 'Lunes', exercises: [] }];
  const merged = mergeHistoryBySessionId(local, server);
  assert.equal(merged.length, 2);
});

test('mergeHistoryBySessionId: LWW por updated_at', () => {
  const local = [{ session_id: 'a', date: '2026-01-01T10:00:00Z', day: 'Lunes', exercises: [{ nombre_es: 'LOCAL' }], updated_at: '2026-02-01T00:00:00Z' }];
  const server = [{ session_id: 'a', date: '2026-01-01T10:00:00Z', day: 'Lunes', exercises: [{ nombre_es: 'SERVER' }], updated_at: '2026-03-01T00:00:00Z' }];
  const merged = mergeHistoryBySessionId(local, server);
  assert.equal(merged[0].exercises[0].nombre_es, 'SERVER');
});

test('mergeHistoryBySessionId: legacy sin session_id usa date+day como clave', () => {
  const local = [{ date: '2026-01-01T10:00:00Z', day: 'Lunes', exercises: [] }];
  const server = [{ date: '2026-01-01T10:00:00Z', day: 'Lunes', exercises: [] }];
  const merged = mergeHistoryBySessionId(local, server);
  assert.equal(merged.length, 1);
});

test('mergeHistoryBySessionId: descarta registros inválidos', () => {
  const merged = mergeHistoryBySessionId([{ garbage: true }], [{ session_id: 'x', date: '2026-01-01T10:00:00Z', day: 'Lunes', exercises: [] }]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].session_id, 'x');
});

/* ============ Constants single-source ============ */
test('constantes: DAY_ORDER tiene 5 días Lunes-Viernes', () => {
  assert.deepEqual(DAY_ORDER, ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
});

test('constantes: DAY_SHORT incluye todos los días de la semana', () => {
  assert.equal(DAY_SHORT.Lunes, 'LUN');
  assert.equal(DAY_SHORT.Martes, 'MAR');
  assert.equal(DAY_SHORT.Miércoles, 'MIÉ');
  assert.equal(DAY_SHORT.Jueves, 'JUE');
  assert.equal(DAY_SHORT.Viernes, 'VIE');
  assert.equal(DAY_SHORT.Sábado, 'SÁB');
  assert.equal(DAY_SHORT.Domingo, 'DOM');
});

test('constantes: DEFAULT_ROUTINE tiene ejercicios en días válidos', () => {
  assert.ok(DEFAULT_ROUTINE.length > 0);
  for (const ex of DEFAULT_ROUTINE) {
    assert.ok(DAY_ORDER.includes(ex.dia), `día ${ex.dia} válido`);
    assert.ok(ex.nombre_es && ex.dataset, `ejercicio ${ex.nombre_es} completo`);
  }
});

test('constantes: ALTERNATIVAS cubre ejercicios de la rutina por defecto', () => {
  for (const ex of DEFAULT_ROUTINE) {
    assert.ok(ALTERNATIVAS[ex.dataset], `ALTERNATIVAS contiene ${ex.dataset}`);
  }
});
