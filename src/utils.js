/* EyeFit — utilidades puras testables (Común a Node y navegador).
   Lógica de negocio extraída de index.html para testear con node:test.

   IMPORTANTE: vive dentro de un IIFE para no colisionar las constantes
   top-level con el scope global del navegador (scripts clásicos).

   v2: constantes en constants.js (fuente única) + funciones puras. */

(function (global) {
  'use strict';

  /* ---------- Constantes compartidas (constants.js, sin duplicar) ----------
     Fuente única de verdad: APODOS, DAY_ORDER, DAY_COLORS, DAY_SHORT,
     WEEKDAY_NAMES, DEFAULT_ROUTINE, INSTRUCCIONES, ALTERNATIVAS, EMBEDDED_IMAGES.
     En Node se importan con require('./constants.js'); en el navegador el
     script constants.js se carga ANTES y las expone en window.EyeFitConstants.
     Si el archivo no cargó, abortamos con un mensaje claro. */
  const C = (typeof require !== "undefined") ? require('./constants.js') : (global.EyeFitConstants || null);
  if(!C){
    if (global && global.document) {
      document.getElementById("main").innerHTML =
        '<div class="section active"><div class="empty-state">⚠️ Error crítico: constants.js no cargó.<br>Recarga la página o borra la caché.</div></div>';
    }
    throw new Error("EyeFitConstants missing");
  }
  const APODOS = C.APODOS;
  const DAY_ORDER = C.DAY_ORDER;
  const DAY_COLORS = C.DAY_COLORS;
  const DAY_SHORT = C.DAY_SHORT;
  const WEEKDAY_NAMES = C.WEEKDAY_NAMES;
  const DEFAULT_ROUTINE = C.DEFAULT_ROUTINE;
  const INSTRUCCIONES = C.INSTRUCCIONES;
  const ALTERNATIVAS = C.ALTERNATIVAS;
  const EMBEDDED_IMAGES = C.EMBEDDED_IMAGES;
  /* ---------- Funciones ---------- */

  function getApodo(ex) {
    return APODOS[ex.dataset] || (String(ex.nombre_es || "").split(" ").slice(0, 3).join(" "));
  }

  /* 1RM estimado con fórmula de Epley: peso × (1 + reps/30).
     Si reps <= 0 no hay set completado → 1RM = 0. */
  function epley1RM(kg, reps) {
    const w = parseFloat(kg) || 0, r = parseInt(reps, 10) || 0;
    if (w <= 0 || r <= 0) return 0;
    if (r === 1) return w;
    return +(w * (1 + r / 30)).toFixed(1);
  }

  /* Nota: setVolume eliminado (código muerto) */

  function formatRest(s) {
    if (!s) return "—";
    const m = Math.floor(s / 60), r = s % 60;
    return m > 0 ? (r > 0 ? `${m}m ${r}s` : `${m}min`) : `${r}s`;
  }

  /* Normaliza un nombre para comparaciones (sin acentos, minúsculas, sin símbolos) */
  function normalizeName(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\sà-ú]/g, "")
      .replace(/\s+/g, " ");
  }

  /**
   * Genera los sets de un ejercicio evitando NaN.
   * Si el historial tiene datos corruptos (undefined, "", NaN), cae al fallback.
   */
  function buildExerciseSets(ex, lastPerf) {
    const nSets = parseInt(ex.series, 10) || 3;
    const fallbackKg = parseFloat(ex.peso_kg) || 0;
    const fallbackReps = parseInt(ex.reps, 10) || 8;

    if (!lastPerf || lastPerf.length === 0) {
      return Array.from({ length: nSets }, () => ({ kg: fallbackKg, reps: fallbackReps, done: false }));
    }

    return Array.from({ length: nSets }, (_, i) => {
      const p = lastPerf[i] || lastPerf[lastPerf.length - 1] || {};
      const kg = parseFloat(p.kg);
      const reps = parseInt(p.reps, 10);
      return {
        kg: Number.isFinite(kg) ? kg : fallbackKg,
        reps: Number.isFinite(reps) ? reps : fallbackReps,
        done: false
      };
    });
  }

  /**
   * Valida que un registro de sesión del historial tenga el schema mínimo.
   * Protege contra datos corruptos en localStorage/nube (F2-A2).
   */
  function isValidSessionRecord(h) {
    return !!(h && typeof h === "object" && !Array.isArray(h) &&
      typeof h.date === "string" && h.date.length > 0 &&
      typeof h.day === "string" && h.day.length > 0 &&
      Array.isArray(h.exercises));
  }

  /**
   * Procesa una cola de sesiones pendientes devolviendo las que NO se pudieron subir.
   * Sin pérdida de datos: si una falla, las siguientes permanecen en la cola.
   */
  function computeRemainingSessions(sessions, pushFn) {
    const remaining = [];
    for (let i = 0; i < sessions.length; i++) {
      const ok = pushFn(sessions[i]);
      if (!ok) {
        remaining.push(...sessions.slice(i));
        break;
      }
    }
    return remaining;
  }

  /**
   * Ordena una rutina por día de la semana y orden interno.
   * Los días fuera de DAY_ORDER quedan al final.
   */
  function dayIndex(dia) {
    const idx = DAY_ORDER.indexOf(dia);
    return idx < 0 ? Number.MAX_SAFE_INTEGER : idx;
  }
  function sortRoutine(routine) {
    return [...routine].sort((a, b) => {
      const di = dayIndex(a.dia) - dayIndex(b.dia);
      if (di !== 0) return di;
      return (a.orden || 0) - (b.orden || 0);
    });
  }

  /* ---------- Funciones nuevas (QA 2.x) ---------- */

  /** Escapa un valor para interpolarlo dentro de un atributo HTML (data-*, etc.) */
  function escapeHtmlAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "\u0026amp;")
      .replace(/"/g, "\u0026quot;")
      .replace(/'/g, "\u0026#39;")
      .replace(/</g, "\u0026lt;")
      .replace(/>/g, "\u0026gt;");
  }

  /** Devuelve la clave de fecha local YYYY-MM-DD (independiente de UTC). Fix streak TZ. */
  function localDateKey(d) {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  let _uuidSeq = 0; /* contador para el último recurso sin Web Crypto */

  /** Genera un UUID v4 con Web Crypto (randomUUID o getRandomValues).
      El último recurso (sin Web Crypto) usa timestamp+contador: único dentro
      del runtime y sin randomness predecible. */
  function genUUID() {
    const c = (typeof globalThis !== "undefined" && globalThis.crypto) ||
              (typeof crypto !== "undefined" ? crypto : undefined);
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
    if (c && typeof c.getRandomValues === "function") {
      const b = c.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40; /* versión 4 */
      b[8] = (b[8] & 0x3f) | 0x80; /* variante RFC 4122 */
      const h = Array.from(b, x => x.toString(16).padStart(2, "0"));
      return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
    }
    /* Sin Web Crypto (entornos legacy): UUID v4 determinista timestamp+contador. */
    const t = Date.now();
    const seq = (_uuidSeq = (_uuidSeq + 1) & 0xffff);
    const hex = (n, len) => n.toString(16).padStart(len, "0");
    const raw = hex(t, 16) + hex(seq, 8) + hex(seq ^ (t & 0xffff), 8);
    const arr = [];
    for (let i = 0; i < raw.length; i += 2) arr.push(parseInt(raw.slice(i, i + 2), 16));
    arr[6] = (arr[6] & 0x0f) | 0x40;
    arr[8] = (arr[8] & 0x3f) | 0x80;
    const h = arr.map(x => x.toString(16).padStart(2, "0"));
    return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
  }

  /** Limita un número a un rango; si no es finito, usa fallback. */
  function clampNum(val, min, max, fallback) {
    const n = parseFloat(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  /** Valida que un día pertenezca a DAY_ORDER (case-insensitive). */
  function isValidDay(dia) {
    const d = String(dia || "").trim().toLowerCase();
    return DAY_ORDER.some(x => x.toLowerCase() === d);
  }

  /**
   * Sanitiza una fila de la rutina importada desde .xlsx.
   * - Valida dia contra DAY_ORDER (case-insensitive)
   * - Clampa series/reps/peso_kg/descanso_s a rangos sensatos
   * - Rechaza filas sin nombre o con dataset vacío llevando a fallback de imagen
   */
  function sanitizeRoutineRow(row) {
    if (!row || typeof row !== "object") return null;
    const diaRaw = String(row.dia || "").trim();
    const diaKey = DAY_ORDER.find(d => d.toLowerCase() === diaRaw.toLowerCase());
    const nombre = String(row.nombre_es || "").trim();
    if (!diaKey || !nombre) return null;
    const series = parseInt(row.series, 10);
    const reps = parseInt(row.reps, 10);
    const peso = parseFloat(row.peso_kg);
    const desc = parseInt(row.descanso_s, 10);
    return {
      dia: diaKey,
      orden: clampNum(parseInt(row.orden, 10), 0, 99, 0),
      nombre_es: nombre,
      dataset: String(row.dataset || "").trim(),
      series: Number.isInteger(series) ? clampNum(series, 1, 20, 3) : 3,
      reps: Number.isInteger(reps) ? clampNum(reps, 1, 100, 8) : 8,
      peso_kg: Number.isFinite(peso) ? clampNum(peso, 0, 500, 0) : 0,
      descanso_s: Number.isInteger(desc) ? clampNum(desc, 0, 3600, 90) : 90,
      notas: String(row.notas || "").trim()
    };
  }

  /**
   * Recalcula el elapsed acumulado al restaurar una sesión guardada.
   * Evita que los gaps de wall-clock (cierre de pestaña) inflen la duración.
   * Devuelve un nuevo objeto de sesión con baseElapsed ajustado y startTime = ahora.
   */
  function rebaseElapsed(saved, now) {
    if (!saved || typeof saved !== "object") return saved;
    const t = Number.isFinite(now) ? now : Date.now();
    const started = Number.isFinite(saved.startTime) ? saved.startTime : t;
    const gap = Math.max(0, Math.floor((t - started) / 1000));
    return {
      ...saved,
      baseElapsed: (parseFloat(saved.baseElapsed) || 0) + gap,
      startTime: t
    };
  }

  /**
   * Fusiona el historial local con el del servidor.
   * - Deduplica por session_id cuando existe (fallback date+day para registros legacy).
   * - Last-write-wins por updated_at (ISO string) cuando ambos existen.
   * Devuelve el historial fusionado ordenado por fecha desc.
   */
  function mergeHistoryBySessionId(local, server) {
    const l = Array.isArray(local) ? local : [];
    const s = Array.isArray(server) ? server : [];
    const map = new Map();

    const keyOf = h => {
      if (h && h.session_id) return "sid:" + h.session_id;
      return "legacy:" + (h && h.date) + "|" + (h && h.day);
    };

    for (const h of [...s, ...l]) {
      if (!isValidSessionRecord(h)) continue;
      const k = keyOf(h);
      const existing = map.get(k);
      if (!existing) { map.set(k, h); continue; }
      const a = h.updated_at, b = existing.updated_at;
      if (a && b) {
        if (new Date(a) > new Date(b)) map.set(k, h);
      } else if (a && !b) {
        map.set(k, h); // el que tiene updated_at gana sobre legacy
      } else if (!a && b) {
        /* se queda el existing */
      } else {
        // Sin timestamps: el servidor gana (autoritativo) salvo que el local
        // sea más reciente por orden de llegada (el servidor va primero)
        map.set(k, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /* ---------- API pública ---------- */
  const EyeFitUtils = {
    APODOS, DAY_ORDER, DAY_COLORS, DAY_SHORT, WEEKDAY_NAMES,
    DEFAULT_ROUTINE, INSTRUCCIONES, ALTERNATIVAS, EMBEDDED_IMAGES,
    getApodo, epley1RM, formatRest, normalizeName,
    buildExerciseSets, isValidSessionRecord, computeRemainingSessions, sortRoutine,
    escapeHtmlAttr, localDateKey, genUUID, clampNum, isValidDay, sanitizeRoutineRow,
    rebaseElapsed, mergeHistoryBySessionId
  };

  /* Export para Node (tests) */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = EyeFitUtils;
  }

  /* Export para navegador (compartido con index.html) */
  if (global) {
    if (!global.EyeFitUtils) global.EyeFitUtils = EyeFitUtils;
    // Constantes globales: fuente única de verdad para el script inline de index.html
    global.APODOS = global.APODOS || APODOS;
    global.DAY_ORDER = global.DAY_ORDER || DAY_ORDER;
    global.DAY_COLORS = global.DAY_COLORS || DAY_COLORS;
    global.DAY_SHORT = global.DAY_SHORT || DAY_SHORT;
    global.INSTRUCCIONES = global.INSTRUCCIONES || INSTRUCCIONES;
    global.ALTERNATIVAS = global.ALTERNATIVAS || ALTERNATIVAS;
    global.DEFAULT_ROUTINE = global.DEFAULT_ROUTINE || DEFAULT_ROUTINE;
    global.EMBEDDED_IMAGES = global.EMBEDDED_IMAGES || EMBEDDED_IMAGES;
  }

})(typeof window !== "undefined" ? window :
   typeof globalThis !== "undefined" ? globalThis :
   typeof global !== "undefined" ? global : this);