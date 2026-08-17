/* EyeFit — Tests unitarios edge cases de utils.js (node:test, sin dependencias)
   Validación/sincronización + constantes. Separado de utils.test.js (refactor #6). */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

/* Funciones edge de utils.js */
const {
  isValidSessionRecord, computeRemainingSessions,
  sanitizeRoutineRow, rebaseElapsed, mergeHistoryBySessionId,
  weekdayNameOf, isSuspectShortSession, dayMismatchLabel
} = require('../src/utils.js');

/* Constantes desde constants.js (fuente única, refactor #1) */
const {
  APODOS, DAY_ORDER, DAY_SHORT, WEEKDAY_NAMES,
  DEFAULT_ROUTINE, INSTRUCCIONES, ALTERNATIVAS, EMBEDDED_IMAGES
} = require('../src/constants.js');

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

/* ============ Cooperación cross-constantes (fuente única de verdad) ============ */
test('constantes: WEEKDAY_NAMES tiene 7 días en orden correcto', () => {
  assert.deepEqual(WEEKDAY_NAMES, ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']);
});

test('constantes: INSTRUCCIONES cubre todos los datasets de DEFAULT_ROUTINE', () => {
  for (const ex of DEFAULT_ROUTINE) {
    assert.ok(INSTRUCCIONES[ex.dataset], `INSTRUCCIONES contiene instrucciones para ${ex.dataset}`);
  }
});

test('constantes: EMBEDDED_IMAGES cubre todos los datasets de DEFAULT_ROUTINE', () => {
  for (const ex of DEFAULT_ROUTINE) {
    assert.ok(EMBEDDED_IMAGES[ex.dataset], `EMBEDDED_IMAGES contiene imagen para ${ex.dataset}`);
    /* El formato esperado es "NNNN-XXXXXXXX" (ID de imagen del dataset) */
    assert.match(EMBEDDED_IMAGES[ex.dataset], /^\d{4}-[A-Za-z0-9]{7}$/, `formato válido para ${ex.dataset}`);
  }
});


test('constantes: APODOS cubre todos los datasets de DEFAULT_ROUTINE', () => {
  for (const ex of DEFAULT_ROUTINE) {
    assert.ok(APODOS[ex.dataset], `APODOS contiene apodo para ${ex.dataset}`);
  }
});

test('constantes: todas las claves de DEFAULT_ROUTINE son únicas por (dia, orden)', () => {
  const seen = new Set();
  for (const ex of DEFAULT_ROUTINE) {
    const key = `${ex.dia}|${ex.orden}`;
    assert.ok(!seen.has(key), `no hay duplicados de (${ex.dia}, orden ${ex.orden})`);
    seen.add(key);
  }
});

test('constantes: DEFAULT_ROUTINE tiene campos numéricos finitos y > 0', () => {
  for (const ex of DEFAULT_ROUTINE) {
    assert.ok(Number.isFinite(ex.series) && ex.series > 0, `${ex.nombre_es}: series válido`);
    assert.ok(Number.isFinite(ex.reps) && ex.reps > 0, `${ex.nombre_es}: reps válido`);
    assert.ok(Number.isFinite(ex.peso_kg) && ex.peso_kg >= 0, `${ex.nombre_es}: peso_kg >= 0`);
    assert.ok(Number.isFinite(ex.descanso_s) && ex.descanso_s > 0, `${ex.nombre_es}: descanso_s > 0`);
  }
});

test('constantes: INSTRUCCIONES ordenadas por dataset coinciden con las claves de EMBEDDED_IMAGES', () => {
  const instrKeys = Object.keys(INSTRUCCIONES).sort();
  const imgKeys = Object.keys(EMBEDDED_IMAGES).sort();
  const altKeys = Object.keys(ALTERNATIVAS).sort();
  assert.deepEqual(instrKeys, altKeys, 'INSTRUCCIONES y ALTERNATIVAS tienen las mismas claves');
  /* EMBEDDED_IMAGES es un SUPERSET (ampliado Módulo 5: 120 imágenes de slim-dataset.json).
     Cubre al menos todas las claves curadas de INSTRUCCIONES/ALTERNATIVAS. */
  for (const k of instrKeys) {
    assert.ok(imgKeys.includes(k), `EMBEDDED_IMAGES cubre la clave ${k}`);
  }
  assert.ok(imgKeys.length >= instrKeys.length, 'EMBEDDED_IMAGES tiene >= claves que INSTRUCCIONES');
});

/* ============ weekdayNameOf / isSuspectShortSession / dayMismatchLabel
   (BUG-2 historial: sesión accidental de 30s con día de rutina distinto) ============ */
test('weekdayNameOf: día real de una fecha ISO (BUG-2: 8/8/2026 es sábado)', () => {
  assert.equal(weekdayNameOf('2026-08-07T08:43:30.596Z'), 'Viernes');
  assert.equal(weekdayNameOf('2026-08-08T14:57:42.307Z'), 'Sábado');
});

test('weekdayNameOf: fecha inválida → cadena vacía', () => {
  assert.equal(weekdayNameOf(''), '');
  assert.equal(weekdayNameOf('fecha-rota'), '');
});

test('isSuspectShortSession: sesión accidental (30s, 1 serie) → true', () => {
  assert.equal(isSuspectShortSession(30, 1), true);
});

test('isSuspectShortSession: sesión corta pero con suficientes series → false', () => {
  assert.equal(isSuspectShortSession(50, 2), false);
  assert.equal(isSuspectShortSession(59, 3), false);
});

test('isSuspectShortSession: sesión larga → false', () => {
  assert.equal(isSuspectShortSession(3221, 1), false);
});

test('isSuspectShortSession: sin series completadas (elapsed>0) → false', () => {
  assert.equal(isSuspectShortSession(30, 0), false);
});

test('isSuspectShortSession: elapsed 0 (reloj fijado en tests E2E) → false', () => {
  assert.equal(isSuspectShortSession(0, 20), false);
});

test('isSuspectShortSession: umbrales configurables por opts', () => {
  assert.equal(isSuspectShortSession(90, 1, { minElapsed: 120, minSets: 2 }), true);
  assert.equal(isSuspectShortSession(90, 2, { minElapsed: 120, minSets: 2 }), false);
});

test('dayMismatchLabel: rutina Viernes entrenada en sábado → etiqueta real', () => {
  const label = dayMismatchLabel('Viernes', '2026-08-08T14:57:42.307Z');
  assert.ok(label && label.startsWith('Sábado'), `debe indicar el día real, obtuve: ${label}`);
});

test('dayMismatchLabel: día de rutina coincide con la fecha → null', () => {
  assert.equal(dayMismatchLabel('Viernes', '2026-08-07T08:43:30.596Z'), null);
  assert.equal(dayMismatchLabel('Lunes', '2026-08-03T10:00:00.000Z'), null);
});

test('dayMismatchLabel: fecha inválida → null', () => {
  assert.equal(dayMismatchLabel('Viernes', 'fecha-rota'), null);
});

/* ============ mergeHistoryBySessionId: edge cases adicionales ============ */
test('mergeHistoryBySessionId: null/undefined/local y server no-arrays no crashean', () => {
  assert.deepEqual(mergeHistoryBySessionId(null, null), []);
  assert.deepEqual(mergeHistoryBySessionId(undefined, []), []);
  assert.deepEqual(mergeHistoryBySessionId([], 'no-array'), []);
  assert.deepEqual(mergeHistoryBySessionId({}, {}), []);
});

test('mergeHistoryBySessionId: dos registros legacy con date+day distinto se mantienen', () => {
  const local = [{ date: '2026-01-01', day: 'Lunes', exercises: [] }];
  const server = [{ date: '2026-01-02', day: 'Martes', exercises: [] }];
  const merged = mergeHistoryBySessionId(local, server);
  assert.equal(merged.length, 2);
});

test('mergeHistoryBySessionId: el servidor gana cuando no hay timestamps', () => {
  const local = [{ session_id: 'a', date: '2026-01-01', day: 'Lunes', exercises: [{ nombre_es: 'LOCAL' }] }];
  const server = [{ session_id: 'a', date: '2026-01-01', day: 'Lunes', exercises: [{ nombre_es: 'SERVER' }] }];
  const merged = mergeHistoryBySessionId(local, server);
  assert.equal(merged[0].exercises[0].nombre_es, 'SERVER');
});

