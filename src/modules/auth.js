/* EyeFit — Módulo de autenticación Supabase (refactor #7 → issue #11)
   - showAuthOverlay / handleAuthSubmit / afterLogin
   - errToString / isEmailVerified
   - updateAuthTabs / autofill automático (maybeAutofillLogin, ensureAutofillListener)
   Estado (authMode/authBlocked) expuesto con getters/setters.
   Exposición global: window.EyeFit.Auth */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const S = () => EyeFit.Supabase || {};
  const Ui = () => EyeFit.Ui || {};
  const Router = () => EyeFit.Router || {};

  let authMode = "login";
  let authBlocked = false; // true cuando getSession() lanza (SDK cargado pero sin red)

  function showAuthOverlay(show){
    document.getElementById("authOverlay").classList.toggle("show", show);
    /* B3: cuando no hay SDK de Supabase o la auth falla por red (SDK cargado,
       pero getSession() lanza), mostrar "Continuar sin conexión" para no
       bloquear el uso local de la app. */
    const skipBtn = document.getElementById("authSkip");
    if(skipBtn) skipBtn.style.display = (!S().sbClient || authBlocked) ? "block" : "none";
    Ui().setFocusTrap("authOverlay", show ? document.getElementById("authOverlay") : null);
  }

  /* Convierte un error de Supabase/red a texto legible.
     Filtra mensajes vacíos o inútiles ({} , "", etc.) para no mostrar
     objetos crudos en pantalla. */
  function errToString(err){
    if(!err) return "Error de conexión";
    if(typeof err === "string") return err.trim() ? err : "Error de conexión";
    const rawMsg = err.message;
    if(typeof rawMsg === "string" && rawMsg.trim() && rawMsg.trim() !== "{}") return rawMsg.trim();
    if(err.name === "AuthRetryableFetchError" || err.status >= 500){
      return "⚠️ Error del servidor de EyeFit. Está caído o en mantenimiento. Inténtalo más tarde.";
    }
    for(const k of ["msg","error_description","error"]){
      const v = err[k];
      if(typeof v === "string" && v.trim() && v.trim() !== "{}") return v.trim();
    }
    try{
      const s = JSON.stringify(err);
      if(s && s !== "{}" && s !== '""' && s !== "null" && s !== '{"message":"{}"}') return s;
    }catch(e){}
    return "Error de conexión";
  }

  function isEmailVerified(user){
    return !!(user && (user.email_confirmed_at || user.email_verified === true));
  }

  async function handleAuthSubmit(){
    const email = document.getElementById("authEmail").value.trim();
    const pass = document.getElementById("authPass").value;
    const errEl = document.getElementById("authError");
    const btn = document.getElementById("authSubmit");
    errEl.textContent = "";
    /* Lazy Supabase: si el SDK no se cargó (no había sesión guardada), se carga
       aquí antes de intentar autenticar. */
    if(!S().sbClient){
      try{
        errEl.textContent = "⏳ Conectando…";
        await S().ensureSupabaseClient();
        errEl.textContent = "";
        const skipBtn = document.getElementById("authSkip");
        if(skipBtn) skipBtn.style.display = "none";
      }catch(e){
        errEl.textContent = "🌐 Sin conexión al servidor. No puedes acceder ahora.";
        return;
      }
    }
    if(!email || !pass){ errEl.textContent = "Introduce email y contraseña"; return; }
    if(pass.length < 6){ errEl.textContent = "La contraseña debe tener al menos 6 caracteres"; return; }
    btn.disabled = true; btn.textContent = "…";
    try{
      let result;
      if(authMode === "register") result = await S().sbClient.auth.signUp({ email, password: pass });
      else result = await S().sbClient.auth.signInWithPassword({ email, password: pass });
      if(result.error) throw result.error;
      const session = result.data.session;
      const user = result.data.user || null;
      if(!session){
        if(authMode === "register"){
          if(user && user.identities && user.identities.length === 0){
            errEl.textContent = "⚠️ Ya existe una cuenta con ese email. Intenta acceder.";
          } else {
            errEl.textContent = "✅ Revisa tu email para confirmar el registro";
          }
        } else {
          errEl.textContent = "⚠️ Email no confirmado o credenciales incorrectas";
        }
        btn.disabled = false; btn.textContent = authMode === "register" ? "Registrarse" : "Acceder";
        return;
      }
      /* Verificar que el email esté confirmado antes de permitir el acceso */
      if(!isEmailVerified(user)){
        await S().sbClient.auth.signOut().catch(()=>{});
        errEl.textContent = "⚠️ Debes confirmar tu email antes de acceder. Revisa tu bandeja de entrada.";
        btn.disabled = false;
        btn.textContent = authMode === "register" ? "Registrarse" : "Acceder";
        return;
      }
      authBlocked = false;
      S().authUser = user;
      await afterLogin();
      btn.disabled = false;
      btn.textContent = authMode === "register" ? "Registrarse" : "Acceder";
    }catch(err){
      errEl.textContent = errToString(err);
      btn.disabled = false;
      btn.textContent = authMode === "register" ? "Registrarse" : "Acceder";
    }
  }
  async function afterLogin(){
    showAuthOverlay(false);
    await S().scheduleSync();
    /* Delay para que el servidor procese los upserts antes de pull */
    await new Promise(r => setTimeout(r, 800));
    await S().pullServerData();
    Router().renderMain();
  }

  function updateAuthTabs(){
    document.querySelectorAll("[data-auth-tab]").forEach(b=>b.classList.toggle("active", b.dataset.authTab===authMode));
    document.getElementById("authSubmit").textContent = authMode==="register" ? "Registrarse" : "Acceder";
    document.getElementById("authPass").autocomplete = authMode==="register" ? "new-password" : "current-password";
  }

  /* ── Auto-login con autorrelleno (autofill) sin tocar el botón ──
     El autofill del navegador puede no disparar eventos input/change.
     1) Detectamos el relleno CSS de Chrome (input:-webkit-autofill via animationstart)
     2) Un pequeño poller comprueba si email+pass están completos y aún no
        se intentó el login, y lo envía automáticamente. */
  let autofillPollTimer = null;
  let autofillLastChecked = "";
  function maybeAutofillLogin(){
    const emailInput = document.getElementById("authEmail");
    const passInput = document.getElementById("authPass");
    const errEl = document.getElementById("authError");
    const overlay = document.getElementById("authOverlay");
    if(!emailInput || !passInput || !overlay) return;
    /* Solo en modo login y con el overlay visible */
    if(authMode !== "login" || !overlay.classList.contains("show")) return;
    /* No reenviar si ya hay un intento en curso (botón disabled) */
    if(document.getElementById("authSubmit").disabled) return;
    const signature = emailInput.value.trim() + "|" + passInput.value;
    if(signature === autofillLastChecked) return; /* sin cambios */
    autofillLastChecked = signature;
    if(emailInput.value.trim() && passInput.value.length >= 6){
      /* Ambos campos rellenos: login automático */
      if(errEl) errEl.textContent = "";
      handleAuthSubmit();
    }
  }
  function ensureAutofillListener(){
    /* Detección vía animationstart (Chrome dispara este evento al autocompletar) */
    const emailInput = document.getElementById("authEmail");
    const passInput = document.getElementById("authPass");
    for(const el of [emailInput, passInput]){
      if(!el || el._autofillWatched) continue;
      el._autofillWatched = true;
      el.addEventListener("animationstart", (e)=>{
        if(e.animationName && e.animationName.startsWith && e.animationName.startsWith("authfill")){
          maybeAutofillLogin();
        }
      });
    }
    /* Poller ligero cada 700ms: cubre Safari/iOS y casos sin animationstart */
    if(!autofillPollTimer){
      autofillPollTimer = setInterval(()=>{
        maybeAutofillLogin();
      }, 700);
    }
  }
  /* Añadir la keyframe authfill al CSS para que Chrome la dispare al autofill */
  (function injectAuthfillKeyframes(){
    try{
      if(document.getElementById("authfill-keyframes")) return;
      const style = document.createElement("style");
      style.id = "authfill-keyframes";
      style.textContent = `
        @keyframes authfill { from {} to {} }
        input:-webkit-autofill { animation-name: authfill; }
      `;
      document.head.appendChild(style);
    }catch(e){}
  })();

  /* Registro UNA sola vez (el overlay de auth vive en index.html, no se re-renderiza) */
  ensureAutofillListener();

  EyeFit.Auth = {
    get authMode(){ return authMode; },
    set authMode(v){ authMode = v; },
    get authBlocked(){ return authBlocked; },
    set authBlocked(v){ authBlocked = v; },
    showAuthOverlay, errToString, isEmailVerified, handleAuthSubmit, afterLogin,
    updateAuthTabs, maybeAutofillLogin, ensureAutofillListener
  };
})(typeof window !== "undefined" ? window : globalThis);
