/* EyeFit — Capa de persistencia IndexedDB (historial)
   v2: schema versioning con eyefit_meta {data_version}
   - getHistoryDB, saveHistoryDB, clearHistoryDB, deleteSessionDB
   - migración one-time desde localStorage (eyefit_history_v1)
   Exposición global: window.EyeFitDB */
(function (global) {
  'use strict';

  const DB_NAME = 'eyefit-db';
  const DB_VERSION = 1;
  const STORE = 'history';
  const META_KEY = 'eyefit_meta';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!global.indexedDB) { reject(new Error('IndexedDB no disponible')); return; }
      const req = global.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'session_id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(db, mode, fn) {
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      const out = fn(store);
      t.oncomplete = () => resolve(out);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  function getHistoryDB() {
    return openDB()
      .then(db => tx(db, 'readonly', store => store.getAll()))
      .catch(() => null);
  }

  function saveHistoryDB(records) {
    const list = Array.isArray(records) ? records : [];
    const sidSet = new Set(list.map(r => r && r.session_id).filter(Boolean));
    return openDB()
      .then(db => new Promise((resolve, reject) => {
        const t = db.transaction(STORE, 'readwrite');
        const store = t.objectStore(STORE);

        /* Estrategia atómica sin clear():
           1. getAllKeys() para conocer los IDs existentes
           2. delete() los que ya NO están en la nueva lista
           3. put() los nuevos/actualizados
           Todo dentro de la MISMA transacción → o se aplica todo o nada. */
        const keysReq = store.getAllKeys();
        keysReq.onsuccess = () => {
          try {
            const existingIds = keysReq.result || [];
            for (const id of existingIds) {
              if (!sidSet.has(id)) store.delete(id);
            }
            for (const r of list) {
              if (r && r.session_id) {
                store.put({
                  session_id: r.session_id,
                  date: r.date,
                  day: r.day,
                  duration: r.duration,
                  updated_at: r.updated_at,
                  exercises: r.exercises,
                  record: r
                });
              }
            }
          } catch (e) { reject(e); }
        };
        keysReq.onerror = () => reject(keysReq.error);

        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }))
      .catch(() => {});
  }

  function clearHistoryDB() {
    return openDB()
      .then(db => tx(db, 'readwrite', store => store.clear()))
      .catch(() => {});
  }

  function deleteSessionDB(sessionId) {
    return openDB()
      .then(db => tx(db, 'readwrite', store => store.delete(sessionId)))
      .catch(() => {});
  }

  /* ---------- Meta / schema versioning ---------- */
  function getMeta() {
    try {
      const m = JSON.parse(global.localStorage.getItem(META_KEY) || '{}');
      return m && typeof m === 'object' ? m : {};
    } catch (e) { return {}; }
  }
  function setMeta(m) {
    try { global.localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {}
  }

  function currentDataVersion() { return getMeta().data_version || 0; }
  function setDataVersion(v) { setMeta({ ...getMeta(), data_version: v }); }

  /* v1 → v2: migra el historial de localStorage (eyefit_history_v1) a IndexedDB.
     Sanea con isValidSessionRecord. Devuelve la lista migrada (o []). */
  function migrateHistoryFromLocalStorage(legacyKey, isValidFn) {
    return new Promise(resolve => {
      try {
        const raw = JSON.parse(global.localStorage.getItem(legacyKey) || '[]');
        const arr = Array.isArray(raw) ? raw : [];
        const valid = arr.filter(isValidFn || (() => true));
        if (valid.length) {
          saveHistoryDB(valid).then(() => {
            try { global.localStorage.removeItem(legacyKey); } catch (e) {}
            resolve(valid);
          }).catch(() => resolve(valid));
        } else {
          try { global.localStorage.removeItem(legacyKey); } catch (e) {}
          resolve([]);
        }
      } catch (e) { resolve([]); }
    });
  }

  global.EyeFitDB = {
    getHistoryDB, saveHistoryDB, clearHistoryDB, deleteSessionDB,
    getMeta, setMeta, currentDataVersion, setDataVersion,
    migrateHistoryFromLocalStorage
  };
})(typeof window !== 'undefined' ? window : globalThis);