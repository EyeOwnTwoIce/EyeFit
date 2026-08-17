/* EyeFit — Módulo temporizador de descanso + motivación (refactor #11 → issue #15)
   - Barra de descanso superior con timestamp absoluto (resistente a background)
   - Pausa/reanuda, ±15s, restauración desde sesión guardada
   - Bocadillo cómic motivador ("ÚLTIMO ESFUERZO")
   Exposición global: window.EyeFit.RestTimer */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};

  /* ================================================================
     DESCANSO — barra superior (se vacía hacia la izquierda)
     ================================================================ */
  let restTimer = null;
  let restRemaining = 0;
  let restTotal = 0;
  let restPaused = false;
  let restActive = false;
  let restEndTime = 0;      /* Timestamp (ms) cuando termina el descanso */
  let restPausedRemaining = 0; /* Segundos restantes congelados cuando se pausa */

  function vibrate(pattern){ if(global.navigator && global.navigator.vibrate) global.navigator.vibrate(pattern); }

  function clearRestTimer(){
    if(restTimer){ clearInterval(restTimer); restTimer = null; }
  }

  /* Fix cronómetro: se usa un timestamp absoluto (restEndTime) en lugar de
     decrementar un contador con setInterval. Así, si la app pasa a segundo
     plano o se bloquea el dispositivo, al volver el descanso refleja el
     tiempo REAL transcurrido. */
  function recomputeRestRemaining(){
    if(!restActive || restPaused) return;
    if(restEndTime <= 0){
      restRemaining = 0;
      return;
    }
    restRemaining = Math.max(0, Math.round((restEndTime - Date.now())/1000));
  }

  function getRestState(){
    if(!restActive) return null;
    if(restPaused){
      return { remaining: restPausedRemaining, total: restTotal, paused: true, endTime: 0 };
    }
    return { remaining: restRemaining, total: restTotal, paused: false, endTime: restEndTime };
  }

  function startRest(seconds){
    clearRestTimer();
    restRemaining = seconds;
    restTotal = seconds;
    restPaused = false;
    restPausedRemaining = seconds;
    restEndTime = Date.now() + seconds*1000;
    restActive = true;
    const bar = document.getElementById("restBar");
    if(bar){
      bar.style.display = "flex";
      const btn = document.getElementById("restPauseBtn");
      if(btn) btn.textContent = "⏸";
      renderRestTime();
    }
    restTimer = setInterval(()=>{
      if(restPaused) return;
      recomputeRestRemaining();
      if(restRemaining <= 0){
        restFinished();
        return;
      }
      renderRestTime();
      if(restRemaining <= 3 && restRemaining > 0) vibrate(60);
      if(restRemaining === 0) vibrate([100,80,100]);
    }, 500);
  }

  function stopRest(){
    clearRestTimer();
    restActive = false;
    restEndTime = 0;
    restPausedRemaining = 0;
    const bar = document.getElementById("restBar");
    if(bar) bar.style.display = "none";
  }

  function restFinished(){
    clearRestTimer();
    restActive = false;
    restEndTime = 0;
    const bar = document.getElementById("restBar");
    if(bar) bar.style.display = "none";
    vibrate([150,100,150]);
    showMotivation();
    /* Auto-navegar a la pantalla del ejercicio si el usuario está en otra pestaña */
    if(EyeFit.Session && EyeFit.Session.session && EyeFit.Router && EyeFit.Router.currentTab !== "sesion"){
      EyeFit.Router.setTab("sesion");
    }
  }

  function renderRestTime(){
    const m = Math.floor(restRemaining/60), s = restRemaining%60;
    const timeEl = document.getElementById("restBarTime");
    if(timeEl) timeEl.textContent = `${m}:${String(s).padStart(2,"0")}`;
    const fill = document.getElementById("restBarFill");
    if(fill && restTotal > 0){
      fill.style.transform = `scaleX(${restRemaining/restTotal})`;
    }
    const btn = document.getElementById("restPauseBtn");
    if(btn) btn.textContent = restPaused ? "▶" : "⏸";
  }

  /* Pausar/reanudar el descanso (botón ⏸/▶ de la barra). Al reanudar se
     recalcula endTime; se mantiene la sincronía con el reloj real. */
  function toggleRestPause(){
    if(restActive && !restPaused){
      /* Pausar: congelar remaining y anular endTime */
      recomputeRestRemaining();
      restPausedRemaining = restRemaining;
      restPaused = true;
      restEndTime = 0;
    } else if(restActive && restPaused){
      /* Reanudar: relanzar endTime desde remaining congelado */
      restPaused = false;
      restEndTime = Date.now() + Math.max(0, restPausedRemaining)*1000;
    }
    renderRestTime();
  }

  /* Sumar/restar 15s al descanso (botones ±15 de la barra). Desplaza endTime
     para mantener sincronía con el reloj real. */
  function adjustRest(delta){
    recomputeRestRemaining();
    restRemaining = Math.max(0, restRemaining + delta);
    if(restRemaining <= 0){ restFinished(); return; }
    restTotal = restRemaining;
    restPausedRemaining = restRemaining;
    if(!restPaused) restEndTime = Date.now() + restRemaining*1000;
    renderRestTime();
  }

  /* Restaura el estado del descanso desde una sesión guardada */
  function restoreRestState(st){
    if(!st) return;
    restTotal = st.total || 0;
    restPaused = !!st.paused;
    if(st.paused){
      /* Descanso pausado: congelado en remaining segundos */
      restPausedRemaining = st.remaining || 0;
      restRemaining = restPausedRemaining;
      restEndTime = 0;
      restActive = restRemaining > 0;
    } else if(st.endTime && st.endTime > 0){
      /* Descanso activo: recalcular el tiempo REAL transcurrido */
      restActive = true;
      restEndTime = st.endTime;
      restPausedRemaining = st.remaining || 0;
      recomputeRestRemaining();
      if(restRemaining <= 0){
        /* El descanso ya terminó mientras la app estaba cerrada */
        restActive = false;
        restEndTime = 0;
        restPausedRemaining = 0;
        return;
      }
    } else {
      /* Fallback legacy (formatos antiguos guardados sin endTime) */
      restRemaining = st.remaining || 0;
      restActive = restRemaining > 0;
      restEndTime = restActive ? Date.now() + restRemaining*1000 : 0;
      restPausedRemaining = restRemaining;
    }
    if(restActive){
      const bar = document.getElementById("restBar");
      if(bar){
        bar.style.display = "flex";
        renderRestTime();
      }
    }
  }

  /* Bocadillo cómic motivador — "ÚLTIMO ESFUERZO" solo al empezar la última serie del último ejercicio */
  const MOTIVACIONES = [
    "¡A POR ELLO!","¡TÚ PUEDES!","¡FUERZA!","¡ROMPE MARCAS!",
    "¡DALE CAÑA!","¡MUÉVETE!","¡A DEJARLO TODO!",
    "¡SIN EXCUSAS!","¡VAMOS, CAMPEÓN!","¡POWER!","¡UN SET MÁS!"
  ];
  const LAST_EFFORT_MSG = "¡ÚLTIMO ESFUERZO!";
  let comicTimeout = null;

  function isLastEffort(){
    const session = EyeFit.Session && EyeFit.Session.session;
    if(!session) return false;
    const ex = session.exercises[session.currentIdx];
    return session.currentIdx === session.exercises.length-1 && ex && ex.currentSet >= ex.sets.length;
  }

  function showComicBubble(text){
    const overlay = document.getElementById("comicOverlay");
    const bubble = document.getElementById("comicBubble");
    bubble.textContent = text;
    overlay.classList.add("show");
    bubble.classList.add("comic-shake");
    clearTimeout(comicTimeout);
    comicTimeout = setTimeout(()=>{
      overlay.classList.remove("show");
      bubble.classList.remove("comic-shake");
    }, 2600);
  }

  function showMotivation(){
    showComicBubble(isLastEffort() ? LAST_EFFORT_MSG : MOTIVACIONES[Math.floor(Math.random()*MOTIVACIONES.length)]);
  }

  const comicOverlay = document.getElementById("comicOverlay");
  if(comicOverlay){
    comicOverlay.addEventListener("click", ()=>{
      clearTimeout(comicTimeout);
      comicOverlay.classList.remove("show");
      const bubble = document.getElementById("comicBubble");
      if(bubble) bubble.classList.remove("comic-shake");
    });
  }

  EyeFit.RestTimer = {
    get restTimer(){ return restTimer; },
    get restRemaining(){ return restRemaining; },
    get restTotal(){ return restTotal; },
    get restPaused(){ return restPaused; },
    get restActive(){ return restActive; },
    get restEndTime(){ return restEndTime; },
    get restPausedRemaining(){ return restPausedRemaining; },
    clearRestTimer, recomputeRestRemaining, getRestState,
    startRest, stopRest, restFinished, renderRestTime,
    toggleRestPause, adjustRest, restoreRestState,
    showMotivation, isLastEffort, showComicBubble,
    MOTIVACIONES, LAST_EFFORT_MSG
  };
})(typeof window !== "undefined" ? window : globalThis);
