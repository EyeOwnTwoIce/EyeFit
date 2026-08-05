/* EyeFit — Tests unitarios de db.js (capa de persistencia IndexedDB)
   Usa fake-indexeddb para emular IndexedDB en Node y un mock de
   localStorage para las funciones de meta. */
'use strict';
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { indexedDB } = require('fake-indexeddb');

/* ── Setup de globals antes de cargar db.js ─────────────────── */
global.indexedDB = indexedDB;

/* Mock localStorage (Node 26 no lo expone sin --localstorage-file) */
const __localStorage = new Map();
global.localStorage = {
  getItem: (k) => __localStorage.has(k) ? __localStorage.get(k) : null,
  setItem: (k, v) => __localStorage.set(k, String(v)),
  removeItem: (k) => __localStorage.delete(k),
  clear: () => __localStorage.clear(),
  key: (i) => Array.from(__localStorage.keys())[i] || null,
  get length() { return __localStorage.size; }
};

/* db.js es un IIFE sin module.exports — expone su API en global.EyeFitDB.
   Al importarlo por efecto lateral ya define global.EyeFitDB. */
require('../src/db.js');
const DB = global.EyeFitDB;

if (!DB) {
  throw new Error('EyeFitDB no se cargó — global.EyeFitDB es undefined');
}

/* Helper: registro de sesión válido para pruebas */
function makeRecord(name, date) {
  return {
    session_id: name,
    date: date || '2026-01-01T10:00:00Z',
    day: 'Lunes',
    duration: 3600,
    updated_at: '2026-01-01T12:00:00Z',
    exercises: [{ nombre_es: 'Press', series: [1, 2, 3] }]
  };
}

/* Reset state entre tests: limpia localStorage y la base IndexedDB */
beforeEach(async () => {
  __localStorage.clear();
  await DB.clearHistoryDB();
});

/* ============== API básica guardar/leer ============== */
test('db: saveHistoryDB + getHistoryDB round-trip almacena y recupera registros', async () => {
  const rec = makeRecord('s1');
  await DB.saveHistoryDB([rec]);
  const rows = await DB.getHistoryDB();
  assert.ok(Array.isArray(rows), 'getHistoryDB debe devolver un array');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].session_id, 's1');
  assert.equal(rows[0].date, '2026-01-01T10:00:00Z');
  assert.equal(rows[0].day, 'Lunes');
  assert.ok(Array.isArray(rows[0].exercises));
  /* El registro completo debe estar anidado en .record para compat
     con app.js (historyCache = rows.map(r => r.record)) */
  assert.equal(rows[0].record.session_id, 's1');
  assert.deepEqual(rows[0].record.exercises, rec.exercises);
});

test('db: saveHistoryDB con registros sin session_id los omite', async () => {
  await DB.saveHistoryDB([{ garbage: true }]);
  const rows = await DB.getHistoryDB();
  assert.equal(rows.length, 0);
});

test('db: getHistoryDB sin datos devuelve array vacío', async () => {
  const rows = await DB.getHistoryDB();
  assert.ok(Array.isArray(rows));
  assert.equal(rows.length, 0);
});

/* ============== Estrategia atómica (sin clear destructivo) ============== */
test('db: saveHistoryDB elimina registros que ya no están en la lista', async () => {
  const a = makeRecord('a');
  const b = makeRecord('b', '2026-01-02T10:00:00Z');
  const c = makeRecord('c', '2026-01-03T10:00:00Z');

  await DB.saveHistoryDB([a, b, c]);
  let rows = await DB.getHistoryDB();
  assert.equal(rows.length, 3);

  /* Guardar solo b y c → a se elimina */
  await DB.saveHistoryDB([b, c]);
  rows = await DB.getHistoryDB();
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(r => r.session_id).sort(), ['b', 'c']);

  /* Guardar sin 'a' de nuevo → se elimina 'b' */
  await DB.saveHistoryDB([a, c]);
  rows = await DB.getHistoryDB();
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(r => r.session_id).sort(), ['a', 'c']);
});

test('db: saveHistoryDB con array vacío equivale a clear', async () => {
  await DB.saveHistoryDB([makeRecord('x')]);
  await DB.saveHistoryDB([]);
  const rows = await DB.getHistoryDB();
  assert.equal(rows.length, 0);
});

test('db: saveHistoryDB con null/undefined no crashea', async () => {
  await DB.saveHistoryDB(null);
  await DB.saveHistoryDB(undefined);
  const rows = await DB.getHistoryDB();
  assert.equal(rows.length, 0);
});

/* ============== clearHistoryDB ============== */
test('db: clearHistoryDB limpia todos los registros', async () => {
  await DB.saveHistoryDB([makeRecord('x'), makeRecord('y', '2026-01-02')]);
  await DB.clearHistoryDB();
  const rows = await DB.getHistoryDB();
  assert.equal(rows.length, 0);
});

/* ============== deleteSessionDB ============== */
test('db: deleteSessionDB elimina solo la sesión indicada', async () => {
  await DB.saveHistoryDB([makeRecord('a'), makeRecord('b', '2026-01-02')]);
  await DB.deleteSessionDB('a');
  const rows = await DB.getHistoryDB();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].session_id, 'b');
});

test('db: deleteSessionDB con id inexistente no afecta los demás', async () => {
  await DB.saveHistoryDB([makeRecord('a')]);
  await DB.deleteSessionDB('no-existe');
  const rows = await DB.getHistoryDB();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].session_id, 'a');
});

/* ============== Meta / schema versioning ============== */
test('db: getMeta en vacío devuelve objeto vacío', () => {
  assert.deepEqual(DB.getMeta(), {});
});

test('db: setMeta + getMeta round-trip', () => {
  DB.setMeta({ data_version: 2, extra: 'value' });
  assert.deepEqual(DB.getMeta(), { data_version: 2, extra: 'value' });
});

test('db: currentDataVersion sin versión = 0', () => {
  assert.equal(DB.currentDataVersion(), 0);
});

test('db: setDataVersion + currentDataVersion round-trip', () => {
  DB.setDataVersion(2);
  assert.equal(DB.currentDataVersion(), 2);
  DB.setDataVersion(3);
  assert.equal(DB.currentDataVersion(), 3);
});

test('db: setMeta no rompe setDataVersion (mergea data_version)', () => {
  DB.setMeta({ extra: 'x' });
  DB.setDataVersion(5);
  assert.equal(DB.currentDataVersion(), 5);
  assert.equal(DB.getMeta().extra, 'x');
});

/* ============== migrateHistoryFromLocalStorage (v1 → v2) ============== */
test('db: migrateHistoryFromLocalStorage migra datos válidos y limpia localStorage', async () => {
  global.localStorage.setItem('legacy_hist', JSON.stringify([
    makeRecord('legacy-1'),
    makeRecord('legacy-2', '2026-01-02')
  ]));
  const migrated = await DB.migrateHistoryFromLocalStorage('legacy_hist', () => true);
  assert.equal(migrated.length, 2);
  /* Los datos están en la DB */
  const rows = await DB.getHistoryDB();
  assert.equal(rows.length, 2);
  /* localStorage quedó limpio */
  assert.equal(global.localStorage.getItem('legacy_hist'), null);
});

test('db: migrateHistoryFromLocalStorage con datos inválidos no los migra', async () => {
  global.localStorage.setItem('legacy_hist2', JSON.stringify([
    { garbage: true },
    makeRecord('ok-1')
  ]));
  const migrated = await DB.migrateHistoryFromLocalStorage('legacy_hist2',
    r => r && r.session_id && r.date && r.day && Array.isArray(r.exercises));
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].session_id, 'ok-1');
  const rows = await DB.getHistoryDB();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].session_id, 'ok-1');
  assert.equal(global.localStorage.getItem('legacy_hist2'), null);
});

test('db: migrateHistoryFromLocalStorage con validator que rechaza todo devuelve []', async () => {
  global.localStorage.setItem('legacy_hist3', JSON.stringify([makeRecord('z')]));
  const migrated = await DB.migrateHistoryFromLocalStorage('legacy_hist3', () => false);
  assert.equal(migrated.length, 0);
  const rows = await DB.getHistoryDB();
  assert.equal(rows.length, 0);
  assert.equal(global.localStorage.getItem('legacy_hist3'), null);
});

test('db: migrateHistoryFromLocalStorage con localStorage vacío devuelve []', async () => {
  const migrated = await DB.migrateHistoryFromLocalStorage('no-existe', () => true);
  assert.deepEqual(migrated, []);
});
