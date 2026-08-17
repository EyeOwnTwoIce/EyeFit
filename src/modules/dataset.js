/* EyeFit — Módulo dataset de ejercicios (refactor #8 → issue #12)
   - Carga cache-first de slim-dataset.json y exercise-meta.json
   - Búsqueda en dataset con índice Map (buildDatasetIndex/getDatasetIndex)
   - Resolución de imágenes GIF (EMBEDDED_IMAGES + dataset), con imgNorm
     tolerante al carácter corrupto "в" de slim-dataset.json
   Exposición global: window.EyeFit.Dataset */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const normalizeName = U.normalizeName;
  const EMBEDDED_IMAGES = global.EMBEDDED_IMAGES || {};

  const IMG_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
  const DATASET_URL = "./slim-dataset.json";
  const DATASET_CACHE = "eyefit-slim-v1";
  const META_URL = "./exercise-meta.json";
  const META_CACHE = "eyefit-meta-v1";

  let datasetCache = null;
  let exerciseMetaCache = null; /* metadatos de ejercicios (exercise-meta.json) */

  /* F1/M5: normalización robusta de nombres para las claves del dataset.
     El dataset fuente (slim-dataset.json) contiene un carácter corrupto "в"
     en algunos nombres (p. ej. "sled 45в° leg press") que no coincide con el
     nombre canónico ("sled 45° leg press") usado en la rutina/localStorage.
     Eliminamos "в", símbolos y normalizamos espacios para que ambas variantes
     resuelvan al mismo GIF. */
  function imgNorm(s){
    return String(s||"")
      .toLowerCase()
      .replace(/в/g,"")
      .replace(/[^a-z0-9à-ú ]/g," ")
      .replace(/\s+/g," ")
      .trim();
  }
  /* Busca el valor (código GIF) de EMBEDDED_IMAGES para un nombre dado,
     con coincidencia exacta primero y normalizada (tolerante al "в" corrupto). */
  function findEmbeddedImage(name){
    if(!name) return null;
    const exact = EMBEDDED_IMAGES[name];
    if(exact) return exact;
    const n = imgNorm(name);
    for(const [key,val] of Object.entries(EMBEDDED_IMAGES)){
      if(imgNorm(key)===n) return val;
    }
    return null;
  }

  /* Devuelve la imagen con prioridad GIF animado (videos/{base}.gif) */
  function getExerciseImage(ex, dataset){
    let base = null;
    /* F1-C2: si se aplicó una variante, buscar la imagen del ejercicio ORIGINAL */
    const datasetKey = ex.datasetOriginal || ex.dataset;
    if(datasetKey){
      base = findEmbeddedImage(datasetKey) || findEmbeddedImage(ex.nombre_es);
    }
    if(!base && dataset && datasetKey){
      const found = findExerciseInDataset(dataset, datasetKey) || findExerciseInDataset(dataset, ex.nombre_es);
      if(found && found.image){
        base = found.image.replace("images/","").replace(".jpg","").replace(".png","");
      }
    }
    if(base) return IMG_BASE + "videos/" + base + ".gif";
    return null;
  }
  /* Devuelve el GIF de una alternativa por nombre.
     F1-C3: busca el nombre de la alternativa (español) con coincidencia
     flexible en el dataset EN INGLÉS — prioriza palabras clave que
     coincidan (ej. "Flexiones" → "push up", "Press Banca Inclinado" → "incline bench press").
     Primero intenta EXACTA (nombres del dataset en inglés ya normalizados)
     y luego cae a coincidencias por palabra. */
  function getExerciseImageForName(name, dataset){
    if(!name) return null;
    const embedded = findEmbeddedImage(name);
    if(embedded) return IMG_BASE + "videos/" + embedded + ".gif";
    if(dataset){
      const n = normalizeName(name);
      /* Exacta primero */
      let found = dataset.find(d=>d.name && normalizeName(d.name)===n);
      if(found && found.image){
        const base = String(found.image).replace("images/","").replace(".jpg","").replace(".png","");
        return IMG_BASE + "videos/" + base + ".gif";
      }
      /* Fallback por palabras clave: busca coincidencias parciales del nombre
         de la alternativa dentro del dataset. Solo acepta si la palabra es
         suficientemente informativa (>=4 caracteres). */
      const words = n.split(" ").filter(w=>w.length>=4);
      for(const w of words){
        found = dataset.find(d=>d.name && normalizeName(d.name).includes(w));
        if(found && found.image){
          const base = String(found.image).replace("images/","").replace(".jpg","").replace(".png","");
          return IMG_BASE + "videos/" + base + ".gif";
        }
      }
    }
    return null;
  }

  async function loadExerciseDataset(){
    /* Fase B: el dataset empaquetado (slim-dataset.json, ~0.66 MB) viaja
       dentro del build y el Service Worker lo sirve offline (stale-while-revalidate).
       Cache-first: si ya está en Cache API, no se vuelve a fetchear. */
    try{
      const cache = await caches.open(DATASET_CACHE);
      const cachedResp = await cache.match(DATASET_URL);
      if(cachedResp){
        const cached = await cachedResp.json();
        if(cached && cached.length) return cached;
      }
    }catch(e){}
    try{
      const resp = await fetch(DATASET_URL);
      if(!resp.ok) throw new Error("no fetch");
      const data = await resp.json();
      try{
        const cache = await caches.open(DATASET_CACHE);
        await cache.put(DATASET_URL, resp.clone());
      }catch(e){}
      return data;
    }catch(e){ return null; }
  }

  async function loadExerciseMeta(){
    /* Cache-first: los metadatos son estáticos y viajan en el build. */
    try{
      const cache = await caches.open(META_CACHE);
      const cachedResp = await cache.match(META_URL);
      if(cachedResp){
        const cached = await cachedResp.json();
        if(cached && cached.exercises) return cached;
      }
    }catch(e){}
    try{
      const resp = await fetch(META_URL);
      if(!resp.ok) throw new Error("no fetch");
      const data = await resp.json();
      try{
        const cache = await caches.open(META_CACHE);
        await cache.put(META_URL, resp.clone());
      }catch(e){}
      return data;
    }catch(e){ return null; }
  }

  /* Resuelve los metadatos de un ejercicio por nombre, tolerando la
     variante corrupta ("в") de slim-dataset.json. Devuelve null si no hay. */
  function getExerciseMeta(name){
    if(!exerciseMetaCache || !name) return null;
    const exMap = exerciseMetaCache.exercises || {};
    const direct = exMap[name];
    if(direct) return direct;
    const n = imgNorm(name);
    if(!n) return null;
    for(const k of Object.keys(exMap)){
      if(imgNorm(k)===n) return exMap[k];
    }
    /* Fallback por inclusión normalizada: tolera sufijos tipo "(male)" o "(back pov)". */
    for(const k of Object.keys(exMap)){
      const nk = imgNorm(k);
      if(nk && (nk.includes(n) || n.includes(nk))) return exMap[k];
    }
    return null;
  }
  /* Fase 1 (P5): índice del dataset con Maps para evitar pasadas O(n) repetidas.
     Normaliza cada nombre una sola vez y agrupa por grupo muscular. */
  let datasetIndex = null;
  let datasetIndexSource = null;
  function buildDatasetIndex(ds){
    const byName = new Map();
    const byPart = new Map();
    for(const ex of ds){
      const n = normalizeName(ex.name);
      if(!byName.has(n)) byName.set(n, ex);
      const part = ex.part || "";
      if(part){
        if(!byPart.has(part)) byPart.set(part, []);
        byPart.get(part).push(ex);
      }
    }
    return { byName, byPart };
  }
  function getDatasetIndex(ds){
    if(datasetIndexSource !== ds){
      datasetIndex = buildDatasetIndex(ds||[]);
      datasetIndexSource = ds;
    }
    return datasetIndex;
  }
  function findExerciseInDataset(dataset, name){
    if(!dataset || !name || String(name).trim()==="") return null;
    const n = normalizeName(name);
    const idx = getDatasetIndex(dataset);
    let hit = idx.byName.get(n);
    if(hit) return hit;
    /* Fallback (solo si no hay coincidencia exacta): inclusión y palabras */
    hit = dataset.find(d=>normalizeName(d.name).includes(n)||n.includes(normalizeName(d.name)));
    if(hit) return hit;
    const words = n.split(" ");
    for(const w of words){
      if(w.length<3) continue;
      hit = dataset.find(d=>normalizeName(d.name).includes(w));
      if(hit) return hit;
    }
    return null;
  }

  EyeFit.Dataset = {
    IMG_BASE, DATASET_URL, DATASET_CACHE, META_URL, META_CACHE,
    get datasetCache(){ return datasetCache; },
    set datasetCache(v){ datasetCache = v; },
    get exerciseMetaCache(){ return exerciseMetaCache; },
    set exerciseMetaCache(v){ exerciseMetaCache = v; },
    imgNorm, findEmbeddedImage, getExerciseImage, getExerciseImageForName,
    loadExerciseDataset, loadExerciseMeta, getExerciseMeta,
    buildDatasetIndex, getDatasetIndex, findExerciseInDataset
  };
})(typeof window !== "undefined" ? window : globalThis);
