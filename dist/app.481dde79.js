"use strict";(()=>{const A=window.EyeFitUtils||null;if(!A)throw document.getElementById("main").innerHTML='<div class="section active"><div class="empty-state">\u26A0\uFE0F Error cr\xEDtico: utils.js no carg\xF3.<br>Recarga la p\xE1gina o borra la cach\xE9.</div></div>',new Error("EyeFitUtils missing");window.addEventListener("error",a=>{console.error("[EyeFit]",a.message||a.error),k("\u26A0\uFE0F Error inesperado: "+(a.message||"desconocido"))});window.addEventListener("unhandledrejection",a=>{const n=a&&a.reason?a.reason.message||a.reason:"desconocido";console.error("[EyeFit] unhandledrejection",n),k("\u26A0\uFE0F Error inesperado: "+n)});const rs=A.APODOS,Ye=A.DAY_ORDER,K=A.DAY_COLORS,Ke=A.DAY_SHORT,ds=A.WEEKDAY_NAMES,cs=A.DEFAULT_ROUTINE,Ce=A.INSTRUCCIONES,ut=A.ALTERNATIVAS,ls=A.EMBEDDED_IMAGES,D=A.getApodo,us=A.epley1RM,mt=A.formatRest,be=A.normalizeName,pt=A.buildExerciseSets,ms=A.isValidSessionRecord,ps=A.sortRoutine,$=A.escapeHtmlAttr,vs=A.genUUID,ie=A.localDateKey,ce=A.clampNum,gs=A.isValidDay,fs=A.sanitizeRoutineRow,ys=A.rebaseElapsed,hs=A.mergeHistoryBySessionId,U=window.EyeFit,k=U.Ui.showToast,vt=U.Ui.vibrate,B=U.Ui.setFocusTrap,p=U.Ui.escapeHtml,Oe=U.Ui.setHtml,H=U.Ui.formatKg,Ve=U.Ui.formatInstructions,We=U.Ui.getInstrucciones,we=U.Ui.getTodayName,gt=U.Ui.getExerciseBodyPart,_=window.EyeFit.Config,ft=_.loadTrainingDays,yt=_.saveTrainingDays,ht=_.loadTrainingConfig,Me=_.saveTrainingConfig,bt=_.scheduleRoutineSync,bs=_.isCompoundExercise,Es=_.getRepRange,xs=_.getIncrementFor,$s=_.computeProgressionDecision,Et=_.progressionBadgeHtml,Ss=_.pendingDoneKg,ks=_.round1,Ge=_.getHistoricalBest,xt=_.getExerciseProgression,$t=_.svgSparkline,St=_.getStreak,M=window.EyeFit.Persistence,Je=M.K,ws=M.VAPID_PUBLIC_KEY,Is=M.DATA_VERSION,kt=M.lsGet,Ls=M.lsSet,C=M.getRoutine,Z=M.setRoutine,wt=M.loadHistoryFromDB,_s=M.persistHistory,z=M.getHistory,Ee=M.saveHistory,It=M.runMigrations,W=M.getPending,ue=M.setPending,Lt=window.EyeFitDB||null,I=window.EyeFit.Dataset,_t=I.IMG_BASE,At=I.loadExerciseDataset,Dt=I.loadExerciseMeta,Ze=I.getExerciseMeta,me=I.findExerciseInDataset,pe=I.getExerciseImage,Bt=I.getExerciseImageForName,y=window.EyeFit.Supabase,Rt=y.SUPABASE_URL,As=y.SUPABASE_ANON_KEY,Ds=y.loadSupabaseSDK,Qe=y.ensureSupabaseClient,oe=y.pullServerData,xe=y.pushRoutineToServer,Ct=y.pushSessionToServer,Y=y.scheduleSync,Bs=y.syncPending,R=window.EyeFit.Auth,Rs=R.showAuthOverlay,Cs=R.updateAuthTabs,Os=R.isEmailVerified,Ms=R.handleAuthSubmit,Ps=window.EyeFit.Push.K_NEWS_KEYS,Ts=window.EyeFit.Push.vapidKey,Ot=window.EyeFit.Push.ensurePushSubscription,Mt=window.EyeFit.Push.persistPushSubscription,Pt=window.EyeFit.Push.enablePushNotifications,Tt=window.EyeFit.Push.disablePushNotifications,Pe=window.EyeFit.Push.isPushEnabled,Ns=window.EyeFit.Push.isIOS,Fs=window.EyeFit.Push.isStandalonePWA,f=window.EyeFit.Session,js=f.sessionProgress,Nt=f.autoSaveSession,q=f.saveSessionState,Ft=f.clearSessionState,jt=f.restoreSession,qs=f.getLastExercisePerformance,Te=f.startSession,Hs=f.getSessionElapsed,Us=f.fmtDuration,et=f.updateSessionHeader,Xs=f.renderSessionProgressBar,qt=f.checkPR,zs=window.EyeFit.XlsxIO.loadXLSX,Ht=window.EyeFit.XlsxIO.parseRoutineSheet,Ut=window.EyeFit.XlsxIO.exportRoutineXlsx;let O="rutina",T=null;function ee(a){O=a,document.querySelectorAll(".tabbtn").forEach(n=>n.classList.toggle("active",n.dataset.tab===a)),Ie(),a==="historial"&&y.authUser&&y.sbClient&&navigator.onLine&&oe().then(()=>{O==="historial"&&x()}),x()}function Ie(){const a=document.getElementById("stopSessionBtn");a&&(a.style.display=O==="sesion"&&f.session?"block":"none")}let fe=!1,ge="";function x(){const a=document.getElementById("main");if(et(),fe&&O==="rutina"){const i=Xt();ge!==i&&(Oe(a,i),ge=i,qe());return}const n={rutina:Ne,sesion:Kt,historial:ts,ajustes:os},d=n[O]?n[O]():Ne();ge!==d&&(Oe(a,d),ge=d,qe())}function Ne(){const a=C(),n=["Lunes","Martes","Mi\xE9rcoles","Jueves","Viernes","S\xE1bado","Domingo"],d=we(),i=T||(n.includes(d)?d:"Lunes"),c=n.includes(i)?i:"Lunes";if(T=c,a.length===0)return`<div class="section active">
    <h2 class="title">\u{1F4C5} Rutina Semanal</h2>
    <div class="empty-state">No hay rutina cargada.<br>Importa un .xlsx en Ajustes.</div>
  </div>`;const e=new Date,t=["Domingo","Lunes","Martes","Mi\xE9rcoles","Jueves","Viernes","S\xE1bado"];function s(v){const g=new Date(e);return g.setDate(g.getDate()+v),{name:t[g.getDay()],date:g}}const r=t.indexOf(d),m=new Date(e);m.setDate(e.getDate()-(r+6)%7);const u=[0,1,2,3,4,5,6].map(v=>{const g=new Date(m);return g.setDate(m.getDate()+v),{name:Ye[v]||t[g.getDay()],date:g}}),l=a.filter(v=>v.dia===c).sort((v,g)=>(v.orden||0)-(g.orden||0)),h=l.length===0?`<div class="empty-state">${p(c)} es d\xEDa de descanso.<br>Pulsa \xABEditar\xBB para a\xF1adir ejercicios si lo deseas.</div>`:l.map((v,g)=>{const b=pe(v,I.datasetCache),E=We(v),w=String(v.datasetOriginal||v.dataset||v.nombre_es||"").trim().toLowerCase(),L=Ge(w),F=L&&L.rm?`${p(H(Math.round(L.rm)))}kg`:"",X=L&&L.rm?` title="1RM = ${p(H(L.kg))} \xD7 (1 + ${p(L.reps)}/30) = ${p(H(Math.round(L.rm)))} kg (Epley)" data-has-rm="1"`:' data-has-rm="0"',G=g===0?'fetchpriority="high" decoding="async"':'loading="lazy" decoding="async"';return`<div class="rt-ex-card">
          ${b?`<div class="rtc-img-wrap" data-img-zoom data-ex-name="${$(v.nombre_es)}" data-ex-dataset="${$(v.dataset||"")}" data-ex-dataset-original="${$(v.datasetOriginal||"")}" data-img-instr="${$(E)}" role="button" tabindex="0" aria-label="Ampliar GIF de ${$(D(v))}">
            <img class="rtc-img" src="${$(b)}" alt="${p(D(v))}" ${G} data-img-fallback="hide">
            <div class="rtc-zoom-hint">\u26F6</div>
          </div>`:""}
          <div class="rtc-info">
            <div class="rtc-name">${p(D(v))}</div>
            <div class="rtc-stats">
              <div class="rtc-stat" data-rt-edit="series" data-rt-name="${$(v.nombre_es)}" data-rt-day="${$(c)}" role="button" tabindex="0"><span class="rtc-stat-val">${p(v.series)}</span><span class="rtc-stat-lbl">series</span></div>
              <div class="rtc-stat" data-rt-edit="reps" data-rt-name="${$(v.nombre_es)}" data-rt-day="${$(c)}" role="button" tabindex="0"><span class="rtc-stat-val">${p(v.reps)}</span><span class="rtc-stat-lbl">reps</span></div>
              <div class="rtc-stat" data-rt-edit="kg" data-rt-name="${$(v.nombre_es)}" data-rt-day="${$(c)}" role="button" tabindex="0"><span class="rtc-stat-val">${p(H(v.peso_kg))}</span><span class="rtc-stat-lbl">kg</span></div>
              ${F?`<div class="rtc-stat rm-tappable" ${X}><span class="rtc-stat-val">${F}</span><span class="rtc-stat-lbl">1RM</span></div>`:""}
            </div>
          </div>
        </div>`}).join("");return`<div class="section active">
    <h2 class="title">\u{1F4C5} Rutina Semanal</h2>
    <div class="routine-carousel" id="routineCarousel" data-routine-carousel>
      ${u.map(({name:v,date:g},b)=>{const E=a.filter(j=>j.dia===v).sort((j,ve)=>(j.orden||0)-(ve.orden||0)),w=v===d,L=v===c,F=K[v]||"#888",X=g.toLocaleDateString("es-ES",{day:"numeric",month:"short"}),G=E.length===0?'<div class="rc-rest">\u{1F634}</div>':`<div class="rc-list">${E.map(j=>`<div class="rc-item">${p(D(j))}</div>`).join("")}</div>`;return`<div class="rc-cell ${w?"rc-today":""} ${L?"rc-active":""}" data-day="${$(v)}" role="button" tabindex="0" aria-pressed="${L}">
          <div class="rc-top">
            <span class="rc-day" style="color:${p(F)}">${p(Ke[v]||v.slice(0,3))}</span>
            <span class="rc-date">${X}</span>
          </div>
          ${G}
        </div>`}).join("")}
    </div>
    <div class="rt-day-nav">
      <span style="font-weight:800;font-size:13px;color:${p(K[c]||"#fff")};">${p(c)}</span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-outline" data-edit-routine data-edit-routine-day="${$(c)}" style="min-height:36px;">\u270F\uFE0F Editar</button>
        ${l.length>0?`<button class="btn" style="min-height:36px;" data-start-session="${$(c)}">\u{1F3CB}\uFE0F Entrenar</button>`:""}
      </div>
    </div>
    <div class="rt-day-view">${h}</div>
  </div>`}let P=null;function te(a){const n=C(),d=a(n),i={};for(const c of d)i[c.dia]=(i[c.dia]||0)+1,c.orden=i[c.dia];Z(d),bt()}function Xt(){const a=C(),n=Ye.filter(t=>a.some(s=>s.dia===t)),d=we(),i=P||(n.includes(d)?d:n[0])||"Lunes",c=a.filter(t=>t.dia===i).sort((t,s)=>(t.orden||0)-(s.orden||0)),o=n.map(t=>{const s=t===i,r=K[t]||"#888";return`<div class="week-cell ${s?"active":""}" data-edit-day="${$(t)}" role="button" tabindex="0" aria-pressed="${s}" aria-label="Editar d\xEDa ${$(t)}" style="${s?"":`border-color:${r}44;`}">
      <div class="d">${Ke[t]||t.slice(0,3)}</div>
      <div class="l" style="${s?"":`color:${p(r)}`}">${p(t)}</div>
    </div>`}).join(""),e=c.map((t,s)=>{const m=pt(t,null).map((u,l)=>{const h=t[`_edit_kg${l+1}`]!==void 0?t[`_edit_kg${l+1}`]:u.kg,v=t[`_edit_reps${l+1}`]!==void 0?t[`_edit_reps${l+1}`]:u.reps;return{kg:h,reps:v}});return`<div class="edit-ex-row">
      <div class="edit-ex-top">
        <span class="edit-ex-idx">${p(t.orden)}</span>
        <span class="edit-ex-name">${p(D(t))}</span>
        <div class="edit-ex-actions">
          <button class="edit-mini" data-edit-ex-toggle="${s}" aria-label="Editar series de ${$(D(t))}">\u270F\uFE0F</button>
          <button class="edit-mini" data-edit-ex-up="${s}" ${s===0?"disabled":""} aria-label="Subir ${$(D(t))}">\u2191</button>
          <button class="edit-mini" data-edit-ex-down="${s}" ${s===c.length-1?"disabled":""} aria-label="Bajar ${$(D(t))}">\u2193</button>
          <button class="edit-mini danger" data-edit-ex-del="${s}" aria-label="Eliminar ${$(D(t))}">\u2715</button>
        </div>
      </div>
      <div class="edit-ex-summary">${p(m.length)} series \xB7 ${p(t.reps)} reps \xB7 ${p(t.peso_kg)} kg \xB7 \u23F1 ${p(mt(t.descanso_s))}</div>
      <div class="edit-ex-body" data-edit-ex-body="${s}">
        ${m.map((u,l)=>`
          <div class="edit-set-row">
            <span class="es-num">${l+1}</span>
            <input type="number" class="es-input" data-edit-set-kg="${s}|${l}" value="${p(u.kg)}" step="0.5" min="0" inputmode="decimal" aria-label="Peso serie ${l+1}">
            <span class="es-label">kg</span>
            <input type="number" class="es-input" data-edit-set-reps="${s}|${l}" value="${p(u.reps)}" step="1" min="1" inputmode="numeric" aria-label="Reps serie ${l+1}">
            <span class="es-label">reps</span>
            <button class="edit-set-del" data-edit-set-del="${s}|${l}" aria-label="Eliminar serie ${l+1}">\u{1F5D1}</button>
          </div>`).join("")}
        <button class="edit-add-set" data-edit-add-set="${s}">\uFF0B A\xF1adir serie</button>
      </div>
    </div>`}).join("");return`<div class="section active">
    <div class="routine-edit-top">
      <h2 class="title" style="flex:1;">\u270F\uFE0F Editar Rutina</h2>
      <button class="btn btn-outline" data-edit-cancel>\u2715 Cancelar</button>
      <button class="btn" data-edit-done>\u2713 Guardar</button>
    </div>
    ${n.length?`<div class="week-grid">${o}</div>`:""}
    ${c.length===0?'<div class="empty-state">Este d\xEDa no tiene ejercicios.</div>':e}
    <button class="edit-add-ex" data-edit-add-ex>\u2795 A\xF1adir ejercicio</button>
  </div>`}let $e=null;function zt(a){$e=a,document.getElementById("pickerDayLabel").textContent="A\xF1adir a: "+(a||""),Le(""),document.getElementById("exPickerOverlay").classList.add("show"),B("exPickerOverlay",document.getElementById("exPickerOverlay")),setTimeout(()=>document.getElementById("pickerSearch").focus(),100)}function Le(a){const n=document.getElementById("pickerList"),d=be(a);let i=I.datasetCache||[];if(d){const o=d.split(" ").filter(e=>e.length>=2);i=i.filter(e=>{const t=be(e.name);return t.includes(d)?!0:o.some(s=>t.includes(s))})}const c=i.slice(0,60);n.innerHTML=c.length?c.map((o,e)=>{let t=findEmbeddedImage(o.name);!t&&o.image&&(t=String(o.image).replace("images/","").replace(".jpg","").replace(".png",""));const s=t?_t+"videos/"+t+".gif":null,r=Ze(o.name),m=p(r&&r.muscle?r.muscle:o.part||""),u=r&&r.equip?p(r.equip):"";return`<div class="picker-item" data-pick-ex="${$(e)}" data-pick-name="${$(o.name)}" data-pick-image="${$(o.image||"")}" data-pick-part="${$(o.part||"")}">
          ${s?`<img class="rt-ex-img" style="width:34px;height:34px;border-radius:6px;" src="${$(s)}" alt="" loading="lazy" decoding="async" data-img-fallback="hide">`:""}
          <div style="flex:1;min-width:0;">
            <div class="pi-name">${p(o.name)}</div>
            <div class="pi-sub">${m}${u?` \xB7 ${u}`:""}</div>
          </div>
        </div>`}).join(""):'<div class="empty-state" style="padding:20px;">Sin resultados</div>'}function ye(){B("exPickerOverlay",null),document.getElementById("exPickerOverlay").classList.remove("show"),le=-1,$e=null}let le=-1;function Yt(a){const n=a.getAttribute("data-pick-name")||"",d=a.getAttribute("data-pick-image")||"";if(n){if(le>=0&&S){const i=S.exercises[le];if(i){const c=i.sets||[],o=i.series||c.length||3,e=i.reps||c[0]&&c[0].reps||10,t=i.peso_kg!=null?i.peso_kg:c[0]&&c[0].kg||0,s=I.datasetCache?me(I.datasetCache,n):null;i.nombre_es=n,s?(i.dataset=s.name,i.datasetOriginal=s.name,s.instructions&&(i.notas=s.instructions)):(i.dataset=n,i.datasetOriginal=n),c.length||(i.series=o,i.reps=e,i.peso_kg=t)}se(S),ye(),le=-1,k("\u2194\uFE0F Ejercicio sustituido");return}if(!$e){ye();return}te(i=>{const c={dia:$e,orden:99,nombre_es:n,dataset:n,series:3,reps:10,peso_kg:0,descanso_s:90,notas:""},o=I.datasetCache?me(I.datasetCache,n):null;return o&&(o.instructions&&(c.notas=o.instructions),c.dataset=o.name),i.push(c),i}),ye(),x(),k("\u2795 Ejercicio a\xF1adido: "+n)}}function Fe(a){const n=a.dataset;if(n.editExToggle!==void 0){const d=document.querySelector(`[data-edit-ex-body="${n.editExToggle}"]`);d&&d.classList.toggle("open");return}if(n.editExUp!==void 0){const i=C().filter(t=>t.dia===P).sort((t,s)=>(t.orden||0)-(s.orden||0)),c=parseInt(n.editExUp);if(c<=0)return;const o=i[c],e=i[c-1];te(t=>{const s=o.dia+"|"+o.nombre_es,r=e.dia+"|"+e.nombre_es,m=t.findIndex(l=>l.dia+"|"+l.nombre_es===s),u=t.findIndex(l=>l.dia+"|"+l.nombre_es===r);if(m>=0&&u>=0){const l=t[m];t[m]=t[u],t[u]=l}return t}),x();return}if(n.editExDown!==void 0){const i=C().filter(t=>t.dia===P).sort((t,s)=>(t.orden||0)-(s.orden||0)),c=parseInt(n.editExDown);if(c>=i.length-1)return;const o=i[c],e=i[c+1];te(t=>{const s=o.dia+"|"+o.nombre_es,r=e.dia+"|"+e.nombre_es,m=t.findIndex(l=>l.dia+"|"+l.nombre_es===s),u=t.findIndex(l=>l.dia+"|"+l.nombre_es===r);if(m>=0&&u>=0){const l=t[m];t[m]=t[u],t[u]=l}return t}),x();return}if(n.editExDel!==void 0){const i=C().filter(e=>e.dia===P).sort((e,t)=>(e.orden||0)-(t.orden||0)),c=parseInt(n.editExDel),o=i[c];if(!o)return;confirm(`\xBFEliminar "${D(o)}" de ${P}?`)&&(te(e=>e.filter(t=>!(t.dia===o.dia&&t.nombre_es===o.nombre_es))),x(),k("\u{1F5D1}\uFE0F Ejercicio eliminado"));return}if(n.editSetKg!==void 0||n.editSetReps!==void 0){const[d,i]=(n.editSetKg??n.editSetReps).split("|").map(Number),e=C().filter(r=>r.dia===P).sort((r,m)=>(r.orden||0)-(m.orden||0))[d];if(!e)return;const t=n.editSetKg?"kg":"reps",s=parseFloat(a.value);if(isNaN(s))return;e[`_edit_${t}${i+1}`]=s,e._edit_dirty_set=!0;return}if(n.editSetDel!==void 0){const[d,i]=n.editSetDel.split("|").map(Number),c=C(),e=c.filter(s=>s.dia===P).sort((s,r)=>(s.orden||0)-(r.orden||0))[d];if(!e)return;const t=[];for(let s=1;s<=20;s++)(e["kg"+s]!==void 0||e["reps"+s]!==void 0||e[`_edit_kg${s}`]!==void 0||e[`_edit_reps${s}`]!==void 0)&&t.push({kg:e[`_edit_kg${s}`]!==void 0?e[`_edit_kg${s}`]:e["kg"+s]!==void 0?e["kg"+s]:parseFloat(e.peso_kg)||0,reps:e[`_edit_reps${s}`]!==void 0?e[`_edit_reps${s}`]:e["reps"+s]!==void 0?e["reps"+s]:parseInt(e.reps)||8});if(t.length<=0)for(let s=1;s<=e.series;s++)t.push({kg:e[`_edit_kg${s}`]??e["kg"+s]??(parseFloat(e.peso_kg)||0),reps:e[`_edit_reps${s}`]??e["reps"+s]??(parseInt(e.reps)||8)});if(t.length<=1){k("\u26A0\uFE0F No puedes eliminar la \xFAnica serie");return}t.splice(i,1);for(let s=1;s<=20;s++)delete e["kg"+s],delete e["reps"+s],delete e[`_edit_kg${s}`],delete e[`_edit_reps${s}`];for(let s=0;s<t.length;s++)e["kg"+(s+1)]=t[s].kg,e["reps"+(s+1)]=t[s].reps;e.series=t.length,e.peso_kg=t[0]?t[0].kg:parseFloat(e.peso_kg)||0,e.reps=t[0]?t[0].reps:parseInt(e.reps)||8,delete e._edit_dirty_set,Z(c),y.sbClient&&y.authUser&&xe(),x(),k("\u{1F5D1}\uFE0F Serie eliminada");return}if(n.editAddSet!==void 0){const d=parseInt(n.editAddSet),i=C(),o=i.filter(r=>r.dia===P).sort((r,m)=>(r.orden||0)-(m.orden||0))[d];if(!o)return;let e=1;for(let r=1;r<=20;r++)(o["kg"+r]!==void 0||o["reps"+r]!==void 0||o[`_edit_kg${r}`]!==void 0||o[`_edit_reps${r}`]!==void 0)&&(e=r+1);o.series=Math.max((o.series||3)+1,e);const t=parseFloat(o.peso_kg)||0,s=parseInt(o.reps)||10;o["kg"+e]=t,o["reps"+e]=s,Z(i),y.sbClient&&y.authUser&&xe(),x();return}}function Kt(){if(!f.session){const u=C(),l=we(),h=u.filter(E=>E.dia===l).sort((E,w)=>(E.orden||0)-(w.orden||0));if(h.length===0)return`<div class="section active">
        <h2 class="title">\u{1F3CB}\uFE0F Entrenar</h2>
        <div class="empty-state">Hoy no hay rutina asignada (${l}).<br>Ve a <b>Ajustes</b> para configurar tus d\xEDas.</div>
      </div>`;const v=K[l]||"#fff",g=h.reduce((E,w)=>E+parseInt(w.series||3,10),0),b=h.map((E,w)=>{const L=pe(E,I.datasetCache);return`<div class="sess-preview-ex">
        ${L?`<div class="spe-img"><img src="${$(L)}" alt="" loading="lazy" decoding="async" data-img-fallback="hide"></div>`:'<div class="spe-img spe-emoji">\u{1F3CB}\uFE0F</div>'}
        <div class="spe-info">
          <div class="spe-name">${p(D(E))}</div>
          <div class="spe-meta">${p(E.series)}\xD7${p(E.reps)} \xB7 ${p(H(E.peso_kg))}kg</div>
        </div>
      </div>`}).join("");return`<div class="section active">
      <h2 class="title">\u{1F3CB}\uFE0F Entrenar</h2>
      <div class="sess-preview-card">
        <div class="spc-head">
          <span class="spc-day" style="color:${p(v)}">Entrenamiento del ${p(l)}</span>
          <span class="spc-sub">${p(h.length)} ejercicios \xB7 ${p(g)} series</span>
        </div>
        <div class="spc-list">${b}</div>
        <button class="btn spc-start" data-start-session="${$(l)}">\u25B6\uFE0F Entrenar</button>
      </div>
    </div>`}const a=f.session.day,n=f.session.exercises[f.session.currentIdx],d=f.session.exercises.length,i=pe(n,I.datasetCache),c=D(n),o=_e(n).length>0,e=n.sets.map((u,l)=>{const h=n.currentSet===l+1,v=u.done;return`<div class="set-row ${v?"done-row":""}" data-swipe-set="${l}" style="${h?"border:1px solid var(--accent);":""}">
      <div class="set-swipe-bg"><span>\u{1F5D1} Eliminar</span></div>
      <div class="set-row-content">
        <span class="set-num">${l+1}</span>
        <div class="set-control">
          <button class="stepper" data-kg-minus="${l}" aria-label="Reducir peso de la serie ${l+1}">\u2212</button>
          <div style="text-align:center;min-width:36px;">
            <div class="set-value" data-edit="${l}" data-field="kg" role="button" tabindex="0" aria-label="Editar peso de la serie ${l+1} (${p(u.kg)} kg)">${p(u.kg)}</div>
            <div class="set-label">kg</div>
          </div>
          <button class="stepper" data-kg-plus="${l}" aria-label="Aumentar peso de la serie ${l+1}">+</button>
          <div style="width:6px;"></div>
          <button class="stepper" data-reps-minus="${l}" aria-label="Reducir repeticiones de la serie ${l+1}">\u2212</button>
          <div style="text-align:center;min-width:30px;">
            <div class="set-value" data-edit="${l}" data-field="reps" role="button" tabindex="0" aria-label="Editar repeticiones de la serie ${l+1} (${p(u.reps)} reps)">${p(u.reps)}</div>
            <div class="set-label">reps</div>
          </div>
          <button class="stepper" data-reps-plus="${l}" aria-label="Aumentar repeticiones de la serie ${l+1}">+</button>
        </div>
        <button class="set-done ${v?"done":""}" data-set-done="${l}" ${h&&!v||v?"":"disabled"} aria-label="${v?`Serie ${l+1} completada`:`Marcar serie ${l+1} como completada`}" aria-pressed="${v}">\u2713</button>
      </div>
    </div>`}).join(""),t=f.session.exercises.filter(u=>u.completed).length,s=f.session.currentIdx+1<f.session.exercises.length?f.session.exercises[f.session.currentIdx+1]:null,r=Ve(We(n)),m=f.session.exercises.slice(f.session.currentIdx+1).map((u,l)=>{const h=f.session.currentIdx+1+l,v=K[a]||"#fff";return`<div class="up-row">
      <div class="up-arrows">
        <button class="up-arrow" data-move-up="${h}" ${l===0?"disabled":""} aria-label="Mover ${$(D(u))} hacia arriba">\u2191</button>
        <button class="up-arrow" data-move-down="${h}" ${h===f.session.exercises.length-1?"disabled":""} aria-label="Mover ${$(D(u))} hacia abajo">\u2193</button>
      </div>
      <span class="up-num" style="color:${p(v)}">${p(u.orden)}</span>
      <span class="up-name">${p(D(u))}</span>
      <span class="up-sets">${p(u.sets.filter(g=>g.done).length)}/${p(u.sets.length)}</span>
    </div>`}).join("");return`<div class="section active Session.session-view">
    <div class="ex-active-card">
      <div class="ex-active-header">
        <span class="ex-active-count">${p(f.session.currentIdx+1)} / ${p(d)}</span>
      </div>
      <div class="ex-active-body">
        ${i?`<div class="ex-img-wrap" data-img-zoom aria-label="Ampliar GIF de ${$(c)}" role="button" tabindex="0">
          <img class="ex-active-img" src="${$(i)}" alt="${p(c)}" loading="lazy" decoding="async" data-img-fallback="hide">
          <div class="ex-img-zoom-hint">\u26F6</div>
        </div>`:""}
        ${Et(n,z())}
        ${o?'<button class="variant-btn" data-open-variants>\u2194\uFE0F Sustituir</button>':""}
      </div>
      ${r?`<button class="ex-instr-btn" data-instr-session-toggle>\u{1F4D6} Instrucciones</button>
      <div class="ex-instr-session" data-instr-session-body>${r}</div>`:""}
    </div>

    <div class="sets-grid">
      ${e}
      <button class="add-set-btn" data-add-set aria-label="A\xF1adir una serie extra">\uFF0B A\xF1adir serie</button>
      ${s?`<div class="sess-next-hint">Siguiente: <b style="color:${p(K[a]||"#fff")}">${p(D(s))}</b></div>`:""}
    </div>

    ${m?`<div class="up-list">
      <div class="up-title">\u23ED Pendientes (toca flechas para reordenar)</div>
      ${m}
    </div>`:""}
  </div>`}function tt(){if(!f.session)return;f.session.exercises[f.session.currentIdx].sets.forEach((n,d)=>{const i=document.querySelector(`.set-value[data-edit="${d}"][data-field="kg"]`),c=document.querySelector(`.set-value[data-edit="${d}"][data-field="reps"]`);i&&(i.textContent=n.kg),c&&(c.textContent=n.reps)}),et()}let je=null;function Vt(){const a=f.session.exercises.reduce((o,e)=>o+e.sets.filter(t=>t.done).length,0),n=f.session.exercises.reduce((o,e)=>o+e.sets.filter(t=>t.done).reduce((t,s)=>t+s.reps,0),0),d=f.session.exercises.reduce((o,e)=>o+e.sets.filter(t=>t.done).reduce((t,s)=>t+s.kg*s.reps,0),0),i=Math.floor((Date.now()-session.startTime)/1e3)+f.session.baseElapsed,c=f.session.exercises.filter(o=>o.completed).length;return{completedSets:a,totalReps:n,totalWeight:d,elapsed:i,completedEx:c,totalEx:f.session.exercises.length,exList:f.session.exercises}}function st(){if(!f.session)return;EyeFit.RestTimer.stopRest(),je=Vt(),Nt();const a=je;if(a.completedSets===0){const i=document.getElementById("sumSavedMsg");i&&(i.textContent="\u26A0\uFE0F No se complet\xF3 ninguna serie \u2014 no se guard\xF3 nada")}const n=Math.floor(a.elapsed/60),d=a.elapsed%60;document.getElementById("sumSub").textContent=`${f.session.day} \xB7 ${n}m ${String(d).padStart(2,"0")}s`,document.getElementById("sumGrid").innerHTML=`
    <div class="sum-stat"><div class="sv">${p(a.completedSets)}</div><div class="sl">Series</div></div>
    <div class="sum-stat"><div class="sv">${p(a.totalReps)}</div><div class="sl">Reps</div></div>
    <div class="sum-stat"><div class="sv">${p(a.completedEx)}/${p(a.totalEx)}</div><div class="sl">Ejercicios</div></div>
    <div class="sum-stat"><div class="sv">${p(Math.round(a.totalWeight))}<span style="font-size:12px;"> kg</span></div><div class="sl">Peso total</div></div>`,document.getElementById("sumExList").innerHTML=a.exList.filter(i=>i.sets.some(c=>c.done)).slice(0,10).map(i=>{const c=i.sets.filter(o=>o.done);return`<div class="sum-ex">
      <div class="sum-ex-top"><span style="color:${p(K[f.session.day]||"#fff")}">${p(D(i))}</span><span>${p(c.length)}\xD7${p(c[0]?.reps||0)} reps</span></div>
      <div class="sum-ex-sub">${c.map(o=>`${p(o.kg)}kg`).join(" \xB7 ")}</div>
    </div>`}).join(""),document.getElementById("summaryOverlay").classList.add("show"),B("summaryOverlay",document.getElementById("summaryOverlay")),document.getElementById("stopSessionBtn").style.display="none"}document.getElementById("stopSessionBtn").addEventListener("click",()=>{f.session&&st()});document.getElementById("sumDoneToday").addEventListener("click",()=>{B("summaryOverlay",null),document.getElementById("summaryOverlay").classList.remove("show"),f.session=null,Ft(),ee("rutina"),k("\u{1F44D} \xA1Buen entrenamiento!")});function _e(a){const n=[],d=ut[a.varianteBase||a.dataset]||[];for(const i of d)n.push({nombre:i,part:gt(a,I.datasetCache)||"musculatura similar"});if(n.length<3&&I.datasetCache){const i=me(I.datasetCache,a.dataset)||me(I.datasetCache,a.nombre_es);if(i&&i.part){const c=I.datasetCache.filter(o=>o.part===i.part&&be(o.name)!==be(i.name)).slice(0,3-n.length);for(const o of c)n.push({nombre:o.name,part:o.part})}}return n.slice(0,4)}function Wt(){const a=f.session.exercises[f.session.currentIdx],n=_e(a);document.getElementById("varCurrentEx").textContent="Ejercicio actual: "+D(a);const d=[{nombre:"Mantener: "+D(a),img:pe(a,I.datasetCache)},...n.map(c=>({nombre:c.nombre,img:Bt(c.nombre,I.datasetCache)}))],i=document.getElementById("varList");i.innerHTML=`<div class="var-grid">${d.map((c,o)=>`
    <div class="var-item" data-variant-idx="${$(o)}">
      ${c.img?`<img src="${$(c.img)}" alt="${p(c.nombre)}" loading="lazy" decoding="async" data-img-fallback="hide">`:'<div class="var-noimg">\u{1F3CB}\uFE0F</div>'}
      <div class="vi-name">${p(c.nombre)}</div>
    </div>`).join("")}</div>`,document.getElementById("varOverlay").classList.add("show"),B("varOverlay",document.getElementById("varOverlay"))}function Gt(a){const n=f.session.exercises[f.session.currentIdx];if(a===0){B("varOverlay",null),document.getElementById("varOverlay").classList.remove("show");return}const d=_e(n)[a-1];d&&(n.varianteBase||(n.varianteBase=n.datasetOriginal||n.dataset),n.datasetOriginal||(n.datasetOriginal=n.dataset),n.dataset=d.nombre,n.nombre_es=d.nombre,B("varOverlay",null),document.getElementById("varOverlay").classList.remove("show"),q(),x(),k("\u2194\uFE0F Variante: "+d.nombre))}let he=null,J=ie(new Date),S=null;function Jt(a,n,d){const i={};for(const c of a)try{const o=new Date(c.date);if(o.getFullYear()===n&&o.getMonth()===d){const e=ie(o);i[e]||(i[e]=[]),i[e].push(c)}}catch{}return i}function Zt(a,n){const d=new Date(a,n-1,1),i=new Date(a,n+1,1),c=new Date(a,n,1).toLocaleDateString("es-ES",{month:"long",year:"numeric"});return`<div class="hist-cal-nav">
    <button class="hist-cal-prev" data-hist-month-change="${d.getFullYear()},${d.getMonth()}" aria-label="Mes anterior">\u2039</button>
    <span class="hist-cal-label">${c.charAt(0).toUpperCase()+c.slice(1)}</span>
    <button class="hist-cal-next" data-hist-month-change="${i.getFullYear()},${i.getMonth()}" aria-label="Mes siguiente">\u203A</button>
  </div>`}function Qt(a){const n=he?{y:he[0],m:he[1]}:(()=>{const u=new Date;return{y:u.getFullYear(),m:u.getMonth()}})(),{y:d,m:i}=n,c=Jt(a,d,i),o=new Date(d,i,1),e=new Date(d,i+1,0).getDate(),t=(o.getDay()+6)%7,s=ie(new Date),r=[],m=["L","M","X","J","V","S","D"];for(const u of m)r.push(`<div class="hist-cal-dow">${u}</div>`);for(let u=0;u<t;u++)r.push('<div class="hist-cal-cell empty"></div>');for(let u=1;u<=e;u++){const l=`${d}-${String(i+1).padStart(2,"0")}-${String(u).padStart(2,"0")}`,h=c[l]&&c[l].length>0,v=l===s,g=J===l;r.push(`<div class="hist-cal-cell ${h?"has-sess":""} ${v?"today":""} ${g?"active":""}" data-hist-day="${l}" role="button" tabindex="0" aria-label="${l}${h?` \xB7 ${c[l].length} sesi\xF3n${c[l].length>1?"es":""}`:""}">
      <span class="hist-cal-num">${u}</span>
      ${h?'<span class="hist-cal-dot"></span>':""}
    </div>`)}return`<div class="hist-cal-wrap">
    ${Zt(d,i)}
    <div class="hist-cal-grid">${r.join("")}</div>
  </div>`}function es(a,n){const d=a.filter(o=>{try{return ie(new Date(o.date))===n}catch{return!1}});return d.length?`<div class="hist-days-mult">
    ${[...d].sort((o,e)=>new Date(o.date)-new Date(e.date)).map(o=>{const e=K[o.day]||"#fff",t=o.exercises.filter(l=>l.sets.some(h=>h.done)==!0),s=t.slice(0,10).map(l=>{const h=String(l.datasetOriginal||l.dataset||l.nombre_es||"").trim().toLowerCase(),v=xt(h),g=Ge(h),b=$t(v),E=g&&g.rm?`${p(H(Math.round(g.rm)))}`:"",w=g&&g.rm?` title="1RM = ${p(H(g.kg))} \xD7 (1 + ${p(g.reps)}/30) = ${p(H(Math.round(g.rm)))} kg (Epley)" data-has-rm="1"`:"";return`<div class="hist-ex-line">
        <div class="hist-ex">
          <span class="hist-ex-name">${p(D(l))}</span>
          <span class="hist-ex-set">${l.sets.filter(L=>L.done).map(L=>`${p(L.reps)}\xD7${p(H(L.kg))}`).join(" \xB7 ")}</span>
        </div>
        ${b?`<div class="hist-ex-prog"><span class="lbl rm-tappable" ${w}>1RM ${E}</span>${b}</div>`:""}
      </div>`}).join(""),r=Math.floor((o.duration||0)/60),m=(o.duration||0)%60,u=new Date(o.date).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});return`<div class="hist-day open" data-hist-date="${$(n)}">
      <div class="hist-content">
        <div class="hist-day-top">
          <div class="hist-tri open"></div>
          <span class="hist-day-name" style="color:${p(e)}">${p(o.day)}</span>
          <span class="hist-day-date">${p(u)} \xB7 ${p(r)}m ${p(m)}s</span>
          <button class="hist-edit-btn" data-edit-hist-date="${$(n)}" data-edit-hist-sessid="${$(o.session_id||"")}" aria-label="Editar sesi\xF3n">\u270F\uFE0F</button>
          <button class="hist-del-btn" data-del-session="${$(n)}" data-del-sessid="${$(o.session_id||"")}" aria-label="Eliminar sesi\xF3n">\u{1F5D1}\uFE0F</button>
        </div>
        <div class="hist-day-body open">
          <div class="hist-day-stats">${p(t.length)} ejercicios \xB7 ${p(o.exercises.reduce((l,h)=>l+h.sets.filter(v=>v.done).length,0))} series</div>
          ${s}
        </div>
      </div>
    </div>`}).join("")}
  </div>`:`<div class="empty-state">No hay sesi\xF3n registrada en ${n}.</div>`}function ts(){const a=z();if(!a||a.length===0)return`<div class="section active">
      <h2 class="title">\u{1F4C8} Historial</h2>
      <div class="empty-state">A\xFAn no hay sesiones.<br>Termina tu primer entrenamiento.</div>
    </div>`;const n=a.length,d=a.reduce((s,r)=>s+(r.duration||0),0),i=a.reduce((s,r)=>s+r.exercises.reduce((m,u)=>m+u.sets.filter(l=>l.done).length,0),0),c=St(),o=c>0?`<div class="streak-banner">\u{1F525} Racha: ${p(c)} d\xEDa${Number(c)>1?"s":""}</div>`:"",e=Qt(a),t=J?es(a,J):"";return`<div class="section active">
    <h2 class="title">\u{1F4C8} Historial</h2>
    ${o}
    <div class="hist-summary">
      <div class="hist-stat"><div class="v">${p(n)}</div><div class="l">Sesiones</div></div>
      <div class="hist-stat"><div class="v">${p(Math.floor(d/60))}m</div><div class="l">Tiempo total</div></div>
      <div class="hist-stat"><div class="v">${p(i)}</div><div class="l">Series</div></div>
    </div>
    ${e}
    ${t}
  </div>`}function se(a){if(!a)return;const n=document.getElementById("editHistDate");n&&(n.textContent=`${a.day} \xB7 ${new Date(a.date).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}`);const d=document.getElementById("editHistStart");if(d){const e=new Date(a.date);isNaN(e.getTime())||(d.value=`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`)}const i=document.getElementById("editHistDur");i&&(i.value=Math.round((a.duration||0)/60)||"");const c=document.getElementById("editHistList");c&&(c.innerHTML=(a.exercises||[]).map((e,t)=>{const s=e.sets||[],r=s.length?s.map((m,u)=>`
        <div class="edit-hist-set">
          <span class="ehs-num">${u+1}</span>
          <input type="number" class="ehs-input" data-eh-kg="${t}|${u}" value="${p(m.kg)}" step="0.5" min="0" inputmode="decimal" aria-label="Peso">
          <span class="ehs-label">kg</span>
          <input type="number" class="ehs-input" data-eh-reps="${t}|${u}" value="${p(m.reps)}" step="1" min="1" inputmode="numeric" aria-label="Reps">
          <span class="ehs-label">reps</span>
          <button class="ehs-del-set" data-eh-del="${t}|${u}" aria-label="Eliminar serie ${u+1}">\u{1F5D1}</button>
        </div>`).join(""):'<div style="color:var(--muted);font-size:11px;">Sin series</div>';return`<div class="edit-hist-ex">
        <div class="eh-name-row">
          <span class="eh-name">${p(D(e))}</span>
          <span style="display:flex;gap:4px;">
            <button class="ehs-swap-ex" data-eh-swap="${t}" aria-label="Sustituir ejercicio ${$(D(e))}">\u2194\uFE0F</button>
            <button class="ehs-del-ex" data-eh-del-ex="${t}" aria-label="Eliminar ejercicio">\u2715</button>
          </span>
        </div>
        ${r}
        <button class="ehs-add-set" data-eh-add-set="${t}">\uFF0B A\xF1adir serie</button>
      </div>`}).join(""));const o=document.getElementById("editHistOverlay");o&&o.classList.add("show"),B("editHistOverlay",o),S=a}function Se(){const a=document.getElementById("editHistOverlay");a&&a.classList.remove("show"),B("editHistOverlay",null),S=null}async function ss(){if(!S)return;const a=document.getElementById("editHistStart");if(a&&a.value){const[t,s]=a.value.split(":").map(Number);if(!isNaN(t)&&!isNaN(s)){const r=new Date(S.date);isNaN(r.getTime())||(r.setHours(t,s),S.date=r.toISOString())}}const n=document.getElementById("editHistDur");if(n){const t=parseFloat(n.value);!isNaN(t)&&t>=0&&(S.duration=Math.round(t*60))}const d=document.getElementById("editHistList");d&&d.querySelectorAll("[data-eh-kg],[data-eh-reps]").forEach(t=>{const[s,r]=t.getAttribute(t.hasAttribute("data-eh-kg")?"data-eh-kg":"data-eh-reps").split("|").map(Number),m=S.exercises[s];if(!m||!m.sets)return;const u=m.sets[r];if(!u)return;const l=parseFloat(t.value);t.hasAttribute("data-eh-kg")?isNaN(l)||(u.kg=l):isNaN(l)||(u.reps=Math.max(1,Math.round(l)))});const i=z(),c=i.findIndex(t=>t.session_id===S.session_id);if(c===-1){const t=i.findIndex(s=>s.date===S.date&&s.day===S.day);t!==-1?i[t]=S:i.push(S)}else i[c]=S;const o=new Date().toISOString();S.updated_at=o;const e=i.map(t=>t===S?{...t,updated_at:o}:t);if(Ee(e),y.sbClient&&y.authUser){if(!await Ct(S)){const s=W();s.sessions.push(S),ue(s)}await Y(),await oe()}Se(),x(),k("\u{1F4BE} Sesi\xF3n editada y guardada")}function as(){document.querySelectorAll("[data-hist-month-change]").forEach(a=>{a.addEventListener("click",()=>{const[n,d]=a.dataset.histMonthChange.split(",").map(Number);he=[n,d],x()})}),document.querySelectorAll("[data-hist-day]").forEach(a=>{a.addEventListener("click",()=>{const n=a.dataset.histDay;J=J===n?null:n,x()}),a.addEventListener("keydown",n=>{if(n.key==="Enter"||n.key===" "){n.preventDefault();const d=a.dataset.histDay;J=J===d?null:d,x()}})}),document.querySelectorAll("[data-edit-hist-date]").forEach(a=>{a.addEventListener("click",n=>{n.stopPropagation();const d=a.dataset.editHistDate,i=a.dataset.editHistSessid,c=z();let o;i&&(o=c.find(e=>e.session_id===i)),o||(o=c.find(e=>{try{return ie(new Date(e.date))===d}catch{return!1}})),o&&se(o)})}),document.querySelectorAll("[data-del-session]").forEach(a=>{a.addEventListener("click",n=>{n.stopPropagation();const d=a.dataset.delSession,i=a.dataset.delSessid,c=z();let o;i&&(o=c.find(e=>e.session_id===i)),o||(o=c.find(e=>{try{return ie(new Date(e.date))===d}catch{return!1}})),o&&deleteHistorySession(o.date,o.day)})})}function ns(){const a=document.getElementById("editHistOverlay");if(!a)return;const n=document.getElementById("editHistClose");n&&n.addEventListener("click",Se);const d=document.getElementById("editHistCancel");d&&d.addEventListener("click",Se);const i=document.getElementById("editHistSave");i&&i.addEventListener("click",ss),a.querySelectorAll(".ehs-input").forEach(c=>{c.addEventListener("focus",()=>{setTimeout(()=>{c.select()},0)})}),a.addEventListener("click",c=>{const o=c.target.closest("[data-eh-add-set]"),e=c.target.closest("[data-eh-del]"),t=c.target.closest("[data-eh-del-ex]"),s=c.target.closest("[data-eh-swap]");if(o){const r=parseInt(o.dataset.ehAddSet),m=S&&S.exercises&&S.exercises[r];if(!m)return;const u=m.sets&&m.sets[m.sets.length-1];m.sets||(m.sets=[]),m.sets.push({kg:u&&u.kg!=null?u.kg:parseFloat(m.peso_kg)||0,reps:u&&u.reps!=null?u.reps:parseInt(m.reps)||8,done:!0}),se(S)}if(e){const[r,m]=e.dataset.ehDel.split("|").map(Number),u=S&&S.exercises&&S.exercises[r];if(!u||!u.sets)return;u.sets.splice(m,1),se(S)}if(t){const r=parseInt(t.dataset.ehDelEx);if(!S||!Array.isArray(S.exercises))return;S.exercises.splice(r,1),se(S)}if(s){const r=parseInt(s.dataset.ehSwap);if(!S||!Array.isArray(S.exercises))return;le=r,is()}})}function is(){document.getElementById("pickerDayLabel").textContent="Sustituir ejercicio del historial",Le(""),document.getElementById("exPickerOverlay").classList.add("show"),B("exPickerOverlay",document.getElementById("exPickerOverlay")),setTimeout(()=>document.getElementById("pickerSearch").focus(),100)}function os(){const a=kt(Je.routine,null)?"Archivo importado":"Rutina integrada",n=C(),i=W().sessions.length,c=Number(i)>0?`${p(i)} sesi\xF3n${Number(i)>1?"es":""} pendiente${Number(i)>1?"s":""} de subir`:y.authUser?"Todo sincronizado":"Sin conexi\xF3n a la nube",o=i>0?"pending":y.authUser?"":"off",e=_.trainingConfig;return`<div class="section active">
    <h2 class="title">Ajustes</h2>
    <div class="set-group">
      <div class="set-group-title">Cuenta</div>
      <div class="set-row-item">
        <div>
          <div class="label">${y.authUser?p(y.authUser.email):"Sin sesi\xF3n"}</div>
          <div class="desc"><span class="sync-status ${o}"><span class="dot"></span> ${c}</span></div>
        </div>
        ${y.authUser?`<button class="btn btn-outline" data-logout>\u{1F6AA} Salir</button>${i>0?'<button class="btn" data-sync-now>\u{1F504} Subir</button>':""}`:'<button class="btn" data-open-auth>\u{1F511} Acceder</button>'}
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">\u{1F3CB}\uFE0F Entrenamiento</div>
      <div class="set-row-item">
        <div><div class="label">Peso corporal</div><div class="desc">Para m\xE9tricas relativas a tu masa</div></div>
        <input type="number" class="set-input" value="${p(e.peso_corporal)}" data-train-input="peso_corporal" data-float="1" step="0.5" min="30">
      </div>
      <div class="set-row-item">
        <div><div class="label">Tipo de progresi\xF3n</div><div class="desc">Doble progresi\xF3n (recomendada) o lineal</div></div>
        <select class="set-select" data-train-select="tipo_progresion">
          <option value="doble" ${e.tipo_progresion==="doble"?"selected":""}>Doble progresi\xF3n</option>
          <option value="lineal" ${e.tipo_progresion==="lineal"?"selected":""}>Lineal</option>
        </select>
      </div>
      <div class="prog-info">
        <details>
          <summary>\u2139\uFE0F \xBFQu\xE9 tipo de progresi\xF3n elegir?</summary>
          <div class="prog-body">
            <b style="color:var(--accent)">Doble progresi\xF3n</b>: dentro de un rango de reps (p. ej. 6-10), primero subes repeticiones. Cuando llegas al tope del rango, subes el peso y vuelves a empezar desde el m\xEDnimo. Es el est\xE1ndar de hipertrofia.
            <br><br>
            <b style="color:var(--accent)">Lineal</b>: subes peso cada sesi\xF3n en cuanto alcanzas el tope del rango, sin variar reps. M\xE1s simple, pero el progreso se estanca antes.
          </div>
        </details>
      </div>
      <div class="set-row-item" style="flex-wrap:wrap;">
        <div style="width:100%;"><div class="label">D\xEDas de entrenamiento</div><div class="desc">L M X J V S D</div></div>
        <div class="train-days" style="width:100%;">
          ${[["L","Lunes"],["M","Martes"],["X","Mi\xE9rcoles"],["J","Jueves"],["V","Viernes"],["S","S\xE1bado"],["D","Domingo"]].map(([t,s])=>`
            <button class="train-day-chip ${_.trainingDays.includes(s)?"on":""}" data-train-day="${s}" aria-label="${s}">${t}</button>
          `).join("")}
        </div>
      </div>
      <div class="set-row-item">
        <div><div class="label">Rango reps compuestos</div><div class="desc">Sentadilla, press banca, remo\u2026</div></div>
        <div style="display:flex;gap:4px;align-items:center;">
          <input type="number" class="set-input" style="width:56px;" value="${p(e.rango_compuesto_min)}" data-train-input="rango_compuesto_min" min="1" max="20">
          <span style="color:var(--muted);font-size:10px;">\u2013</span>
          <input type="number" class="set-input" style="width:56px;" value="${p(e.rango_compuesto_max)}" data-train-input="rango_compuesto_max" min="1" max="30">
        </div>
      </div>
      <div class="set-row-item">
        <div><div class="label">Rango reps aislamiento</div><div class="desc">Curls, elevaciones, extensiones\u2026</div></div>
        <div style="display:flex;gap:4px;align-items:center;">
          <input type="number" class="set-input" style="width:56px;" value="${p(e.rango_aislamiento_min)}" data-train-input="rango_aislamiento_min" min="1" max="20">
          <span style="color:var(--muted);font-size:10px;">\u2013</span>
          <input type="number" class="set-input" style="width:56px;" value="${p(e.rango_aislamiento_max)}" data-train-input="rango_aislamiento_max" min="1" max="30">
        </div>
      </div>
      <div class="set-row-item">
        <div><div class="label">RIR objetivo</div><div class="desc">Reps en reserva al terminar cada serie (2 = casi al fallo)</div></div>
        <input type="number" class="set-input" value="${p(e.rir_objetivo)}" data-train-input="rir_objetivo" min="0" max="5">
      </div>
      <div class="set-row-item">
        <div><div class="label">Incremento barra</div><div class="desc">Kilos a subir en ejercicios con barra</div></div>
        <input type="number" class="set-input" value="${p(e.incremento_barra)}" data-train-input="incremento_barra" data-float="1" step="0.5" min="0.5">
      </div>
      <div class="set-row-item">
        <div><div class="label">Incremento mancuerna</div><div class="desc">Kilos a subir en ejercicios con mancuernas</div></div>
        <input type="number" class="set-input" value="${p(e.incremento_mancuerna)}" data-train-input="incremento_mancuerna" data-float="1" step="0.5" min="0.5">
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Rutina</div>
      <div class="set-row-item">
        <div>
          <div class="label">Rutina actual: <b class="accent">${p(a)}</b></div>
          <div class="desc">${p(n.length)} ejercicios \xB7 Lunes-Viernes</div>
        </div>
      </div>
      <div class="prog-info">
        <details>
          <summary>\u{1F4AA} M\xFAsculo y equipamiento de los ejercicios</summary>
          <div class="prog-body">
            ${n.length?n.slice(0,40).map(t=>{const s=Ze(t.dataset||t.nombre_es);if(!s)return"";const r=s.muscle||t.nombre_es,m=s.equip||"",u=Array.isArray(s.secondary)&&s.secondary.length?" \xB7 Sec.: "+s.secondary.join(", "):"";return`<div class="meta-ex-row">
                  <b>${p(D(t))}</b>
                  <span class="meta-ex-tags">${p(r)}${m?" \xB7 "+p(m):""}${p(u)}</span>
                </div>`}).join(""):'<div class="empty-state">Sin ejercicios</div>'}
          </div>
        </details>
      </div>
      <div class="set-row-item">
        <div><div class="label">Rutina (.xlsx)</div><div class="desc">Importa o descarga tu hoja de c\xE1lculo</div></div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn" data-import-xlsx>\u{1F4E5} Importar</button>
          <button class="btn btn-outline" data-export-xlsx>\u{1F4E4} Exportar</button>
        </div>
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Ayuda</div>
      <div class="set-row-item">
        <div><div class="label">Ver gu\xEDa de inicio</div><div class="desc">Repasa c\xF3mo usar EyeFit</div></div>
        <button class="btn btn-outline" data-open-help>\u2753</button>
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">\u{1F514} Notificaciones</div>
      <div class="set-row-item">
        <div>
          <div class="label">Actualizaciones de la app</div>
          <div class="desc">${Pe()?"Activas: te avisamos cuando hay una versi\xF3n nueva":"No activas. Recibir\xE1s avisos de nuevas versiones."}</div>
        </div>
        ${Pe()?'<button class="btn btn-outline" data-disable-push>\u{1F515} Desactivar</button>':'<button class="btn" data-enable-push>\u{1F514} Activar</button>'}
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Datos</div>
      <div class="set-row-item">
        <div><div class="label">Exportar backup (.json)</div><div class="desc">Rutina + historial</div></div>
        <button class="btn btn-outline" data-export-backup>\u{1F4E4} Exportar</button>
        &nbsp;
        <button class="btn" data-import-backup>\u{1F4E5} Importar</button>
      </div>
    </div>
    <div class="set-group danger-zone">
      <div class="set-group-title danger-zone-title">\u26A0\uFE0F Danger Zone</div>
      <div class="set-row-item">
        <div><div class="label">Datos</div><div class="desc">Borrar historial o restablecer la rutina</div></div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-danger" data-clear-history>\u{1F5D1}\uFE0F Borrar historial</button>
          <button class="btn btn-outline" data-reset-routine>\u21BA Restablecer</button>
        </div>
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Acerca de</div>
      <div class="about-block">
        <details class="about-details">
          <summary>\u{1F4D8} Sobre EyeFit</summary>
          <div class="about-sub">
            <details>
              <summary>Descripci\xF3n</summary>
              <div class="about-body">
                Web app de entrenamiento privada (PWA) con progresi\xF3n autom\xE1tica basada en doble progresi\xF3n + RIR (Reps In Reserve), el est\xE1ndar avalado por la literatura cient\xEDfica de hipertrofia.
              </div>
            </details>
            <details>
              <summary>Versi\xF3n</summary>
              <div class="about-body">v2.1.0 \xB7 PWA sincronizada en la nube</div>
            </details>
            <details>
              <summary>Referencias</summary>
              <div class="about-body">
                \u2022 Dataset de ejercicios: <a href="https://github.com/hasaneyldrm/exercises-dataset" target="_blank" rel="noopener">hasaneyldrm/exercises-dataset</a><br>
                \u2022 F\xF3rmula 1RM de Epley<br>
                \u2022 Criterios de doble progresi\xF3n para hipertrofia
              </div>
            </details>
          </div>
        </details>
      </div>
    </div>
  </div>`}function qe(){document.querySelectorAll("[data-edit-routine]").forEach(e=>{e.addEventListener("click",()=>{fe=!0,P=e.dataset.editRoutineDay||T||null,x()})}),document.querySelectorAll("[data-edit-day]").forEach(e=>{e.addEventListener("click",()=>{P=e.dataset.editDay,x()})}),document.querySelectorAll("[data-edit-cancel]").forEach(e=>{e.addEventListener("click",()=>{const t=C();for(const s of t)for(const r of Object.keys(s))r.startsWith("_edit_")&&delete s[r];Z(t),fe=!1,P=null,x(),k("\u2715 Edici\xF3n cancelada")})}),document.querySelectorAll("[data-edit-done]").forEach(e=>{e.addEventListener("click",()=>{const t=C();for(const s of t){for(let r=1;r<=20;r++)s[`_edit_kg${r}`]!==void 0&&(s["kg"+r]=s[`_edit_kg${r}`],delete s[`_edit_kg${r}`]),s[`_edit_reps${r}`]!==void 0&&(s["reps"+r]=s[`_edit_reps${r}`],delete s[`_edit_reps${r}`]),delete s[`_edit_kg${r}`],delete s[`_edit_reps${r}`];s._edit_dirty_set&&delete s._edit_dirty_set,s.kg1!==void 0&&(s.peso_kg=s.kg1),s.reps1!==void 0&&(s.reps=s.reps1)}Z(t),y.sbClient&&y.authUser&&xe(),fe=!1,P=null,x(),k("\u{1F4BE} Rutina guardada")})}),document.querySelectorAll("[data-edit-ex-add],[data-edit-add-ex]").forEach(e=>{e.addEventListener("click",()=>{const t=P||T;t&&zt(t)})}),document.querySelectorAll("[data-edit-ex-toggle],[data-edit-ex-up],[data-edit-ex-down],[data-edit-ex-del],[data-edit-set-kg],[data-edit-set-reps],[data-edit-set-del],[data-edit-add-set]").forEach(e=>{e.dataset.editSetKg!==void 0||e.dataset.editSetReps!==void 0?(e.addEventListener("change",()=>{Fe(e)}),e.addEventListener("focus",()=>{setTimeout(()=>{e.select()},0)})):e.addEventListener("click",()=>{Fe(e)})}),document.querySelectorAll("[data-day]").forEach(e=>{e.addEventListener("click",()=>{T=e.dataset.day,x()}),e.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),T=e.dataset.day,x())})});const a=document.getElementById("routineCarousel");if(a){const e=a.querySelector(".rc-active");if(e){const s=e.parentElement,r=e.offsetLeft-(s.clientWidth-e.offsetWidth)/2;requestAnimationFrame(()=>{s.scrollLeft=Math.max(0,r)})}let t=!1;a.addEventListener("scroll",()=>{t||(t=!0,clearTimeout(a._scrollTimer),a._scrollTimer=setTimeout(()=>{const s=a.querySelectorAll(".rc-cell"),r=a.scrollLeft+a.clientWidth/2;let m=null,u=1/0;s.forEach(l=>{const v=l.offsetLeft+l.offsetWidth/2,g=Math.abs(v-r);g<u&&(u=g,m=l)}),t=!1,m&&m.dataset.day&&m.dataset.day!==T&&(T=m.dataset.day,x())},90),t=!1)},{passive:!0})}document.querySelectorAll("[data-rt-edit]").forEach(e=>{e.addEventListener("click",()=>{Ue(e)}),e.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),Ue(e))})}),document.querySelectorAll("[data-has-rm='1']").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation();const s=e.getAttribute("title")||"1RM estimado";k("\u{1F4A1} "+s)})}),document.querySelectorAll("img[data-img-fallback]").forEach(e=>{e.addEventListener("error",()=>{if(e.dataset.imgFallback==="emoji"){const s=e.parentElement;s&&(s.innerHTML="\u{1F3CB}\uFE0F")}else e.remove()},{once:!0})}),document.querySelectorAll("[data-instr-toggle]").forEach(e=>{e.addEventListener("click",()=>{const t=document.querySelector(`[data-instr-body="${e.dataset.instrToggle}"]`);t&&(t.classList.toggle("show"),e.textContent=t.classList.contains("show")?"\u{1F4D6} Ocultar":"\u{1F4D6} Instrucciones")})}),document.querySelectorAll("[data-start-session]").forEach(e=>{e.addEventListener("click",()=>{Te(e.dataset.startSession)})}),document.querySelectorAll("[data-start-session-confirm]").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.startSessionConfirm,r=C().filter(v=>v.dia===t).sort((v,g)=>(v.orden||0)-(g.orden||0));if(!r.length)return;const m=r.map((v,g)=>{const b=pe(v,I.datasetCache);return`<div class="confirm-ex-row">
          ${b?`<img src="${$(b)}" alt="" class="confirm-ex-img" data-img-fallback="hide">`:""}
          <span class="confirm-ex-name">${p(D(v))}</span>
          <span class="confirm-ex-meta">${p(v.series)}\xD7${p(v.reps)} <b>${p(H(v.peso_kg))}</b>kg</span>
        </div>`}).join(""),u=r.reduce((v,g)=>v+Number(g.series||3),0),l=document.createElement("div");l.className="Session.session-confirm-overlay",l.innerHTML=`
        <div class="Session.session-confirm-card">
          <div class="sc-title">Entrenamiento del ${p(t)}</div>
          <div class="sc-sub">${p(r.length)} ejercicios \xB7 ${p(u)} series</div>
          <div class="sc-list">${m}</div>
          <button class="btn sc-start" data-sc-start>\u25B6\uFE0F Entrenar</button>
          <button class="btn btn-outline sc-cancel" data-sc-cancel>Cancelar</button>
        </div>`,document.getElementById("main").appendChild(l),l.querySelector("[data-sc-start]").addEventListener("click",()=>{l.remove(),Te(t)}),l.querySelector("[data-sc-cancel]").addEventListener("click",()=>{l.remove()})})}),document.querySelectorAll("[data-kg-plus],[data-kg-minus],[data-reps-plus],[data-reps-minus]").forEach(e=>{e.addEventListener("click",()=>{if(!f.session)return;const t=f.session.exercises[f.session.currentIdx],s=parseInt(e.dataset.kgPlus??e.dataset.kgMinus??e.dataset.repsPlus??e.dataset.repsMinus),r=t.sets[s];e.dataset.kgPlus&&(r.kg=+(r.kg+.5).toFixed(1)),e.dataset.kgMinus&&(r.kg=Math.max(0,+(r.kg-.5).toFixed(1))),e.dataset.repsPlus&&(r.reps=r.reps+1),e.dataset.repsMinus&&(r.reps=Math.max(1,r.reps-1));for(let m=s+1;m<t.sets.length;m++)(e.dataset.kgPlus||e.dataset.kgMinus)&&(t.sets[m].kg=r.kg),(e.dataset.repsPlus||e.dataset.repsMinus)&&(t.sets[m].reps=r.reps);q(),tt()})}),document.querySelectorAll("[data-edit]").forEach(e=>{e.addEventListener("click",()=>He(parseInt(e.dataset.edit),e.dataset.field)),e.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),He(parseInt(e.dataset.edit),e.dataset.field))})}),document.querySelectorAll("[data-set-done]").forEach(e=>{e.addEventListener("click",()=>{if(!f.session)return;const t=f.session.exercises[f.session.currentIdx],s=parseInt(e.dataset.setDone),r=t.sets[s];r.done||(r.done=!0,qt(t,r),vt(30),q(),t.currentSet<t.sets.length?(t.currentSet++,EyeFit.RestTimer.startRest(t.descanso_s),x()):(t.completed=!0,f.session.currentIdx+1<f.session.exercises.length?(f.session.currentIdx++,EyeFit.RestTimer.startRest(t.descanso_s),x()):(EyeFit.RestTimer.stopRest(),st())))})});let n=null;function d(e,t){if(!f.session)return;n=e;const s=document.getElementById("swipeConfirmOverlay");if(s){const m=f.session.exercises[f.session.currentIdx].sets[e];document.getElementById("swipeConfirmText").textContent=`\xBFEliminar la serie ${e+1} (${m.kg}kg \xD7 ${m.reps})?`,s.classList.add("show"),B("swipeConfirmOverlay",s)}}function i(e){if(!e||e._swipeAttached)return;e._swipeAttached=!0;let t=0,s=0,r=0,m=!1,u=!1;const l=e.querySelector(".set-row-content"),h=90;function v(g){r=Math.max(-h,Math.min(0,g)),l&&(l.style.transform=`translateX(${r}px)`)}e.addEventListener("touchstart",g=>{if(e.classList.contains("swiped"))return;const b=g.touches[0];t=b.clientX,s=b.clientY,m=!0,u=!1},{passive:!0}),e.addEventListener("touchmove",g=>{if(!m)return;const b=g.touches[0],E=b.clientX-t,w=b.clientY-s;if(!u){if(Math.abs(w)>Math.abs(E)){m=!1;return}u=!0}u&&v(E)},{passive:!0}),e.addEventListener("touchend",()=>{if(m)if(m=!1,r<=-h/2){e.classList.add("swiped"),v(-h);const g=parseInt(e.dataset.swipeSet);d(g,e)}else v(0)},{passive:!0}),e.addEventListener("mousedown",g=>{e.classList.contains("swiped")||(t=g.clientX,s=g.clientY,m=!0,u=!1)}),window.addEventListener("mousemove",g=>{if(!m)return;const b=g.clientX-t,E=g.clientY-s;if(!u){if(Math.abs(E)>Math.abs(b)){m=!1;return}u=!0}u&&v(b)}),window.addEventListener("mouseup",()=>{if(m)if(m=!1,r<=-h/2){e.classList.add("swiped"),v(-h);const g=parseInt(e.dataset.swipeSet);d(g,e)}else v(0)}),e.addEventListener("click",()=>{e.classList.contains("swiped")||document.querySelectorAll(".set-row.swiped").forEach(g=>{if(g!==e){g.classList.remove("swiped");const b=g.querySelector(".set-row-content");b&&(b.style.transform="translateX(0)")}})})}document.querySelectorAll(".set-row[data-swipe-set]").forEach(i),document.getElementById("swipeConfirmOk").addEventListener("click",()=>{if(document.getElementById("swipeConfirmOverlay").classList.remove("show"),B("swipeConfirmOverlay",null),!f.session||n===null)return;const t=f.session.exercises[f.session.currentIdx];if(t.sets.length<=1){k("\u26A0\uFE0F No puedes eliminar la \xFAnica serie"),document.querySelectorAll(".set-row.swiped").forEach(s=>{s.classList.remove("swiped");const r=s.querySelector(".set-row-content");r&&(r.style.transform="translateX(0)")}),n=null;return}t.sets.splice(n,1),t.currentSet>n+1&&t.currentSet--,t.currentSet>t.sets.length&&(t.currentSet=t.sets.length),t.currentSet<1&&(t.currentSet=1),t.sets.every(s=>s.done)?t.completed=!0:t.completed=!1,q(),x(),k("\u{1F5D1}\uFE0F Serie eliminada"),n=null}),document.getElementById("swipeConfirmCancel").addEventListener("click",()=>{document.getElementById("swipeConfirmOverlay").classList.remove("show"),B("swipeConfirmOverlay",null),document.querySelectorAll(".set-row.swiped").forEach(e=>{e.classList.remove("swiped");const t=e.querySelector(".set-row-content");t&&(t.style.transform="translateX(0)")}),n=null}),document.querySelectorAll("[data-img-zoom]").forEach(e=>{e.addEventListener("click",()=>{const t=e.querySelector("img");if(!t||!t.src)return;const s=document.getElementById("zoomImg");s.src=t.src,s.alt=t.alt||"";const r=document.getElementById("zoomInstr");if(r){let m=e.getAttribute("data-img-instr")||"";if(!m){const u=e.getAttribute("data-ex-dataset-original")||e.getAttribute("data-ex-dataset")||"",l=e.getAttribute("data-ex-name")||"";if(u&&Ce[u])m=Ce[u];else if(l){const h=I.datasetCache?me(I.datasetCache,u||l):null;m=h&&h.instructions?h.instructions:""}}m?r.innerHTML='<div class="zi-title">\u{1F4D6} Instrucciones</div>'+Ve(m):r.innerHTML=""}document.getElementById("imgZoomOverlay").classList.add("show"),B("imgZoomOverlay",document.getElementById("imgZoomOverlay"))}),e.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),e.click())})}),document.querySelectorAll("[data-instr-session-toggle]").forEach(e=>{e.addEventListener("click",()=>{const t=document.querySelector("[data-instr-session-body]");t&&(t.classList.toggle("show"),e.textContent=t.classList.contains("show")?"\u{1F4D6} Ocultar":"\u{1F4D6} Instrucciones")})}),document.querySelectorAll("[data-move-up],[data-move-down]").forEach(e=>{e.addEventListener("click",()=>{if(!f.session)return;const t=parseInt(e.dataset.moveUp??e.dataset.moveDown),s=e.dataset.moveUp?-1:1,r=t+s;if(r<0||r>=f.session.exercises.length)return;const m=f.session.exercises;[m[t],m[r]]=[m[r],m[t]],m.forEach((u,l)=>{u.orden=l+1}),q(),x()})}),document.querySelectorAll("[data-add-set]").forEach(e=>{e.addEventListener("click",()=>{if(!f.session)return;const t=f.session.exercises[f.session.currentIdx],s=t.sets[t.sets.length-1]||{kg:parseFloat(t.peso_kg)||0,reps:parseInt(t.reps)||8};t.sets.push({kg:s.kg,reps:s.reps,done:!1}),t.completed=!1,q(),x()})}),document.querySelectorAll("[data-open-variants]").forEach(e=>{e.addEventListener("click",Wt)}),document.querySelectorAll("[data-import-xlsx]").forEach(e=>{e.addEventListener("click",()=>document.getElementById("fileInput").click())}),document.querySelectorAll("[data-export-xlsx]").forEach(e=>{e.addEventListener("click",async()=>{await Ut(),k("\u{1F4E4} rutina.xlsx descargado")})}),document.querySelectorAll("[data-export-backup]").forEach(e=>{e.addEventListener("click",()=>{const t={app:"eyefit",version:2,exportedAt:new Date().toISOString(),routine:C(),history:z()},s=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),r=URL.createObjectURL(s),m=document.createElement("a");m.href=r,m.download="eyefit-backup.json",document.body.appendChild(m),m.click(),m.remove(),setTimeout(()=>URL.revokeObjectURL(r),2e3),k("\u{1F4E6} Backup exportado")})}),document.querySelectorAll("[data-import-backup]").forEach(e=>{e.addEventListener("click",()=>document.getElementById("jsonFileInput").click())}),document.querySelectorAll("[data-clear-history]").forEach(e=>{e.addEventListener("click",async()=>{if(confirm("\xBFBorrar todo el historial?")){await Ee([]);const t=W();if(t.sessions=[],ue(t),y.sbClient&&y.authUser)try{await y.sbClient.from("sesiones").delete().eq("user_id",y.authUser.id)}catch{}x(),k("\u{1F5D1}\uFE0F Historial borrado")}})}),document.querySelectorAll("[data-reset-routine]").forEach(e=>{e.addEventListener("click",async()=>{if(localStorage.removeItem(Je.routine),T=null,y.sbClient&&y.authUser)try{await y.sbClient.from("rutinas").delete().eq("user_id",y.authUser.id)}catch{}k("\u21BA Rutina restaurada"),ee("rutina")})}),document.querySelectorAll("[data-logout]").forEach(e=>{e.addEventListener("click",async()=>{confirm("\xBFCerrar sesi\xF3n?")&&(y.sbClient&&await y.sbClient.auth.signOut().catch(()=>{}),y.authUser=null,k("\u{1F6AA} Sesi\xF3n cerrada"),R.showAuthOverlay(!0),O==="ajustes"&&x())})}),document.querySelectorAll("[data-open-auth]").forEach(e=>{e.addEventListener("click",()=>{R.authMode="login",R.updateAuthTabs(),document.getElementById("authPass").value="",document.getElementById("authError").textContent="",R.showAuthOverlay(!0)})}),document.querySelectorAll("[data-sync-now]").forEach(e=>{e.addEventListener("click",async()=>{await Y(),x()})}),document.querySelectorAll("[data-open-help]").forEach(e=>{e.addEventListener("click",()=>De(!0))}),document.querySelectorAll("[data-enable-push]").forEach(e=>{e.addEventListener("click",()=>{Pt()})}),document.querySelectorAll("[data-disable-push]").forEach(e=>{e.addEventListener("click",()=>{Tt()})}),document.querySelectorAll("[data-hist]").forEach(e=>{e.addEventListener("click",t=>{t.target.closest("[data-swipable-hist]")&&t.target.closest(".hist-swipe-bg")||e.classList.toggle("open")})});async function c(e,t){if(confirm("\xBFBorrar esta sesi\xF3n?")){const s=z(),r=s.findIndex(l=>l.date===e&&l.day===t),m=r!==-1&&s[r].session_id?s[r].session_id:null;r!==-1&&s.splice(r,1),Ee(s);const u=W();if(u.sessions=u.sessions.filter(l=>!(l.date===e&&l.day===t)),ue(u),y.sbClient&&y.authUser)try{const{data:l}=await y.sbClient.from("sesiones").select("id, data").eq("user_id",y.authUser.id);if(Array.isArray(l)){const h=l.filter(v=>v.data&&(v.data.session_id&&m&&v.data.session_id===m||v.data.date===e&&v.data.day===t));for(const v of h)v.data.session_id?await y.sbClient.from("sesiones").delete().eq("session_id",v.data.session_id).eq("user_id",y.authUser.id).catch(()=>{}):await y.sbClient.from("sesiones").delete().eq("id",v.id).catch(()=>{})}}catch{}y.sbClient&&y.authUser&&Y(),x(),k("\u{1F5D1}\uFE0F Sesi\xF3n eliminada"+(y.sbClient&&y.authUser?" \xB7 sincronizada":""))}}document.querySelectorAll("[data-swipable-hist]").forEach(e=>{if(e._histSwipeAttached)return;e._histSwipeAttached=!0;const t=e.querySelector(".hist-content"),s=100;let r=0,m=0,u=!1,l=!1;e.addEventListener("touchstart",h=>{const v=h.touches[0];r=v.clientX,m=v.clientY,u=!0,l=!1},{passive:!0}),e.addEventListener("touchmove",h=>{if(!u)return;const v=h.touches[0],g=v.clientX-r,b=v.clientY-m;if(!l){if(Math.abs(b)>Math.abs(g)){u=!1;return}l=!0}if(l&&t){const E=Math.max(-s,Math.min(0,g));t.style.transform=`translateX(${E}px)`}},{passive:!0}),e.addEventListener("touchend",()=>{u&&(u=!1,t&&((parseFloat(t.style.transform.replace(/[^0-9\-.]/g,""))||0)<=-s/2?(t.style.transform=`translateX(-${s}px)`,e.classList.add("swiped"),c(e.dataset.delDate,e.dataset.delDay).then(()=>{document.body.contains(e)&&(e.classList.remove("swiped"),t.style.transform="translateX(0)")})):t.style.transform="translateX(0)"))},{passive:!0}),e.addEventListener("mousedown",h=>{r=h.clientX,m=h.clientY,u=!0,l=!1}),window.addEventListener("mousemove",h=>{if(!u)return;const v=h.clientX-r,g=h.clientY-m;if(!l){if(Math.abs(g)>Math.abs(v)){u=!1;return}l=!0}if(l&&t){const b=Math.max(-s,Math.min(0,v));t.style.transform=`translateX(${b}px)`}}),window.addEventListener("mouseup",()=>{u&&(u=!1,t&&((parseFloat(t.style.transform.replace(/[^0-9\-.]/g,""))||0)<=-s/2?(t.style.transform=`translateX(-${s}px)`,e.classList.add("swiped"),c(e.dataset.delDate,e.dataset.delDay).then(()=>{document.body.contains(e)&&(e.classList.remove("swiped"),t.style.transform="translateX(0)")})):t.style.transform="translateX(0)"))})}),document.querySelectorAll("input[type='number'],input[type='time'],input[inputmode]").forEach(e=>{e.addEventListener("focus",()=>{setTimeout(()=>{e.select()},0)})}),document.querySelectorAll("[data-train-day]").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.trainDay;_.trainingDays.includes(t)?_.trainingDays=_.trainingDays.filter(s=>s!==t):_.trainingDays.push(t),yt(),x(),k("\u{1F4C5} D\xEDas de entrenamiento actualizados")})}),document.querySelectorAll("[data-edit-hist]").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation();const s=parseInt(e.dataset.editHist),u=[...z()].sort((l,h)=>new Date(h.date)-new Date(l.date))[s];u&&se(u)})}),as(),document.querySelectorAll("[data-train-input]").forEach(e=>{e.addEventListener("change",()=>{const t=e.dataset.trainInput;let s;e.type==="checkbox"?s=e.checked:(e.dataset.float,s=parseFloat(e.value)),(Number.isFinite(s)||e.type==="checkbox")&&(_.trainingConfig[t]=s),Me(),k("\u2699\uFE0F Ajuste de entrenamiento guardado")})}),document.querySelectorAll("[data-train-select]").forEach(e=>{e.addEventListener("change",()=>{_.trainingConfig[e.dataset.trainSelect]=e.value,Me(),k("\u2699\uFE0F Progresi\xF3n actualizada")})});const o=document.getElementById("main");if(o){let u=function(g){const b=g.parentElement;return g.classList.contains("edit-ex-row")?[b.querySelectorAll(".edit-ex-row"),"edit-routine"]:g.classList.contains("up-row")?[b.querySelectorAll(".up-row"),"Session.session-up"]:[[],null]},l=function(g,b){return!(g.classList.contains("edit-ex-row")||g.classList.contains("up-row"))||b&&b.target.closest("button,input,select,textarea,.edit-mini,.up-arrow,.ehs-input,.es-input,.edit-ex-body,.edit-ex-actions,.edit-set-row")?!1:(e=g,g.classList.add("dragging"),document.body.classList.add("dragging-active"),b&&b.cancelable&&b.preventDefault(),!0)},h=function(){if(e){if(t&&t!==e){const[g,b]=u(e),E=Array.prototype.indexOf.call(g,e),w=Array.prototype.indexOf.call(g,t);E>=0&&w>=0&&E!==w&&v(b,E,w)}e.classList.remove("dragging"),t&&(t.classList.remove("drag-over"),t=null),document.body.classList.remove("dragging-active"),e=null}},v=function(g,b,E){if(g==="edit-routine"){const w=C(),L=w.filter(N=>N.dia===P).sort((N,Q)=>(N.orden||0)-(Q.orden||0)),F=L[b],X=L[E];if(!F||!X)return;const G=F.dia+"|"+F.nombre_es,j=X.dia+"|"+X.nombre_es,ve=w.findIndex(N=>N.dia+"|"+N.nombre_es===G),dt=w.findIndex(N=>N.dia+"|"+N.nombre_es===j);if(ve<0||dt<0)return;te(N=>{const Q=N.slice(),[ct]=Q.splice(ve,1),Be=Q.findIndex(Re=>Re.dia+"|"+Re.nombre_es===j),lt=b<E?Be+1:Be;return Q.splice(lt,0,ct),Q}),x()}else if(g==="Session.session-up"&&f.session){const w=f.session.exercises.slice(),L=f.session.currentIdx+1+b,F=f.session.currentIdx+1+E,[X]=w.splice(L,1);w.splice(F,0,X),f.session.exercises=w,f.session.exercises.forEach((G,j)=>{G.orden=j+1}),q(),x()}},e=null,t=null,s=null,r=0,m=0;o.addEventListener("touchstart",g=>{const b=g.target.closest(".edit-ex-row, .up-row");if(b&&l(b,g)){const E=g.touches[0];s={x:E.clientX,y:E.clientY}}},{passive:!0}),o.addEventListener("touchmove",g=>{if(!e)return;const b=g.touches[0];if(s){const L=b.clientY-s.y;if(Math.abs(L)<3)return}const E=document.elementFromPoint(b.clientX,b.clientY),w=E?E.closest(".edit-ex-row, .up-row"):null;w&&w!==t&&(t&&t.classList.remove("drag-over"),t=w,w.classList.add("drag-over"))},{passive:!0}),o.addEventListener("touchend",()=>{e&&h(),s=null},{passive:!0}),o.addEventListener("mousedown",g=>{const b=g.target.closest(".edit-ex-row, .up-row");b&&l(b,g)&&(r=g.clientX,m=g.clientY)}),window.addEventListener("mousemove",g=>{if(!e)return;const b=document.elementFromPoint(g.clientX,g.clientY),E=b?b.closest(".edit-ex-row, .up-row"):null;E&&E!==t&&(t&&t.classList.remove("drag-over"),t=E,E.classList.add("drag-over"))}),window.addEventListener("mouseup",()=>{e&&h()})}}let re={idx:0,field:"kg"};function He(a,n){re={idx:a,field:n};const i=f.session.exercises[f.session.currentIdx].sets[a];document.getElementById("numLabel").textContent=n==="kg"?"Peso (kg)":"Repeticiones";const c=document.getElementById("numInput");c.value=n==="kg"?i.kg:i.reps,c.step=n==="kg"?"0.5":"1",c.min=n==="kg"?"0":"1",c.max=n==="kg"?"200":"30";const o=document.getElementById("numSlider");o.min=n==="kg"?"0":"1",o.max=n==="kg"?"200":"30",o.step=n==="kg"?"0.5":"1",o.value=c.value,document.getElementById("numOverlay").classList.add("show"),B("numOverlay",document.getElementById("numOverlay")),setTimeout(()=>{c.focus(),c.select()},100)}function V(){document.getElementById("numOverlay").classList.remove("show"),B("numOverlay",null)}function Ae(){if(!f.session){V();return}const a=parseFloat(document.getElementById("numInput").value);if(isNaN(a)){V();return}const n=f.session.exercises[f.session.currentIdx],d=n.sets[re.idx];if(re.field==="kg"){d.kg=ce(a,0,500,0);for(let i=re.idx+1;i<n.sets.length;i++)n.sets[i].kg=d.kg}else{d.reps=ce(Math.round(a),1,100,1);for(let i=re.idx+1;i<n.sets.length;i++)n.sets[i].reps=d.reps}q(),V(),tt()}let ae=null;function Ue(a){const n=a.dataset.rtEdit,d=a.dataset.rtName,i=a.dataset.rtDay;if(!d)return;const o=C().find(m=>m.dia===i&&m.nombre_es===d);if(!o)return;const e=parseFloat(n==="series"?o.series||0:n==="reps"?o.reps||0:o.peso_kg||0);ae={name:d,day:i,field:n};const t={series:"Series",reps:"Reps por serie",kg:"Peso inicial (kg)"};document.getElementById("numLabel").textContent=t[n]||n;const s=document.getElementById("numInput");s.value=isNaN(e)?0:e,s.step=n==="series"||n==="reps"?"1":"0.5",s.min=n==="kg"?"0":"1",s.max=n==="series"?"20":n==="reps"?"100":"500";const r=document.getElementById("numSlider");r.min=s.min,r.max=s.max,r.step=s.step,r.value=s.value,document.getElementById("numOverlay").classList.add("show"),B("numOverlay",document.getElementById("numOverlay")),setTimeout(()=>{s.focus(),s.select()},100)}function at(){if(!ae){V();return}const a=parseFloat(document.getElementById("numInput").value);if(isNaN(a)){V();return}const{name:n,day:d,field:i}=ae;te(c=>{const o=c.find(e=>e.dia===d&&e.nombre_es===n);return o&&(i==="series"?o.series=ce(Math.round(a),1,20,3):i==="reps"?o.reps=ce(Math.round(a),1,100,8):i==="kg"&&(o.peso_kg=ce(a,0,500,0))),c}),V(),ae=null,x(),k("\u{1F4BE} Rutina actualizada")}document.getElementById("numOk").addEventListener("click",()=>{ae?at():Ae()});document.getElementById("numCancel").addEventListener("click",V);document.getElementById("numInput").addEventListener("keydown",a=>{a.key==="Enter"&&Ae(),a.key==="Escape"&&V()});document.getElementById("numSlider").addEventListener("input",a=>{document.getElementById("numInput").value=a.target.value});document.getElementById("numSlider").addEventListener("change",a=>{document.getElementById("numInput").value=a.target.value,ae?at():Ae()});document.getElementById("varList").addEventListener("click",a=>{const n=a.target.closest("[data-variant-idx]");n&&Gt(parseInt(n.dataset.variantIdx))});document.getElementById("varClose").addEventListener("click",()=>{B("varOverlay",null),document.getElementById("varOverlay").classList.remove("show")});document.getElementById("zoomClose").addEventListener("click",a=>{a.stopPropagation(),B("imgZoomOverlay",null),document.getElementById("imgZoomOverlay").classList.remove("show")});document.getElementById("imgZoomOverlay").addEventListener("click",a=>{a.target===document.getElementById("imgZoomOverlay")&&(B("imgZoomOverlay",null),document.getElementById("imgZoomOverlay").classList.remove("show"))});document.querySelectorAll("[data-auth-tab]").forEach(a=>{a.addEventListener("click",()=>{R.authMode=a.dataset.authTab,document.getElementById("authError").textContent="",R.updateAuthTabs(),!y.sbClient&&!R.authBlocked&&Qe().then(()=>{const n=document.getElementById("authSkip");n&&(n.style.display="none")}).catch(()=>{})})});const Xe=document.getElementById("authForm");Xe&&Xe.addEventListener("submit",a=>{a.preventDefault(),R.handleAuthSubmit()});document.getElementById("authSkip").addEventListener("click",()=>{y.authUser=null,R.showAuthOverlay(!1),x()});const ze=document.getElementById("pickerSearch");ze&&ze.addEventListener("input",a=>{Le(a.target.value)});document.getElementById("pickerList").addEventListener("click",a=>{const n=a.target.closest("[data-pick-name]");n&&Yt(n)});document.getElementById("pickerClose").addEventListener("click",ye);(function(){document.querySelectorAll(".tabbtn").forEach(i=>{i.addEventListener("click",()=>ee(i.dataset.tab))}),document.querySelectorAll("[data-rest]").forEach(i=>{i.addEventListener("click",()=>{i.dataset.rest==="skip"?EyeFit.RestTimer.stopRest():i.dataset.rest==="toggle"?EyeFit.RestTimer.toggleRestPause():i.dataset.rest==="minus15"?EyeFit.RestTimer.adjustRest(-15):i.dataset.rest==="plus15"&&EyeFit.RestTimer.adjustRest(15),q()})});const n=document.getElementById("fileInput");n&&(n.onchange=i=>{const c=i.target.files[0];if(!c)return;const o=new FileReader;o.onload=async e=>{try{const t=await Ht(new Uint8Array(e.target.result));if(t.length===0){k("\u26A0\uFE0F Archivo sin ejercicios v\xE1lidos");return}if(Z(t),T=null,y.sbClient&&y.authUser&&!await xe()){const r=W();r.routine=t,ue(r)}k("\u2705 Rutina importada: "+t.length+" ejercicios"),ee("rutina")}catch{k("\u274C No se pudo leer el archivo")}},o.readAsArrayBuffer(c),i.target.value=""});const d=document.getElementById("jsonFileInput");d&&(d.onchange=async i=>{const c=i.target.files[0];if(c){try{const o=JSON.parse(await c.text());if(!o||o.app!=="eyefit"){k("\u274C Archivo de backup no v\xE1lido");return}if(!confirm("\xBFSustituir la rutina y el historial actuales por los del backup?"))return;if(Array.isArray(o.routine)&&(Z(o.routine),T=null),Array.isArray(o.history)){await Ee(o.history);const e=W();o.history.length&&(e.sessions=[...o.history]),ue(e)}k("\u2705 Backup restaurado"),ee("rutina")}catch{k("\u274C No se pudo leer el backup")}i.target.value=""}})})();(async function(){const n=document.getElementById("fullCssLink");n&&n.media==="print"&&(n.media="all"),ht(),ft(),ns(),await It(),Lt&&!M.historyLoaded&&await wt();let d=!1;const c=`sb-${(()=>{try{return new URL(Rt).hostname.split(".")[0]}catch{return"vkaxxphminfinufitcyp"}})()}-auth-token`;if((()=>{try{return!!localStorage.getItem(c)}catch{return!1}})())try{await Qe();const{data:s}=await y.sbClient.auth.getSession();y.authUser=s.session?s.session.user:null,y.authUser&&R.isEmailVerified(y.authUser)?d=!0:(y.authUser&&await y.sbClient.auth.signOut().catch(()=>{}),y.authUser=null,R.showAuthOverlay(!0))}catch{R.authBlocked=!0,R.showAuthOverlay(!0)}else R.showAuthOverlay(!0);const e=At(),t=Dt();z(),jt(),x(),I.datasetCache=await e,I.exerciseMetaCache=await t.catch(()=>null),x(),Ie(),De(),d&&(await Y(),await new Promise(s=>setTimeout(s,800)),await oe(),x())})();setInterval(()=>{if(y.authUser&&y.sbClient){const a=W();(a.sessions.length>0||a.routine)&&Y().then(()=>{(O==="ajustes"||O==="historial")&&x()})}},3e4);if("serviceWorker"in navigator){let n=function(){if(!("sync"in navigator))return;const d=W();(d.sessions.length>0||d.routine)&&y.authUser&&navigator.sync.register("eyefit-sync").catch(()=>{})};window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").then(d=>{window.__swReg=d,Notification&&Notification.permission==="granted"&&Ot(d).then(i=>{i&&i.endpoint&&Mt(i)}),d.addEventListener("updatefound",()=>{const i=d.installing;i&&i.addEventListener("statechange",()=>{i.state==="installed"&&navigator.serviceWorker.controller&&(k("\u{1F504} Nueva versi\xF3n disponible"),f.session||setTimeout(()=>{d.waiting&&d.waiting.postMessage({type:"SKIP_WAITING"})},500))})})}).catch(()=>{})}),navigator.serviceWorker.addEventListener("controllerchange",()=>{window.location.reload()}),navigator.serviceWorker.addEventListener("message",d=>{d.data&&d.data.type==="EYEFIT_SYNC"?y.authUser&&Y():d.data&&d.data.type==="EYEFIT_RELOAD"&&window.location.reload()});let a=null;window.addEventListener("beforeinstallprompt",d=>{d.preventDefault(),a=d,k("\u{1F4F2} Puedes instalar EyeFit en tu pantalla de inicio")}),window.showInstallBanner||(window.showInstallBanner=()=>a),setInterval(n,6e4)}window.addEventListener("online",async()=>{k("\u{1F310} Conexi\xF3n restablecida"),y.authUser&&(await Y(),await new Promise(a=>setTimeout(a,800)),await oe(),x())});function nt(){f.session&&f.session.exercises&&!f.session.saved&&(f.session.elapsed=Math.floor((Date.now()-session.startTime)/1e3)+f.session.baseElapsed,q())}window.addEventListener("pagehide",nt);document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"?nt():document.visibilityState==="visible"&&(EyeFit.RestTimer.restActive&&!EyeFit.RestTimer.restPaused&&(EyeFit.RestTimer.recomputeRestRemaining(),EyeFit.RestTimer.restRemaining<=0?EyeFit.RestTimer.restFinished():EyeFit.RestTimer.renderRestTime()),y.authUser&&y.sbClient&&navigator.onLine&&(Y().then(()=>{(O==="ajustes"||O==="historial")&&x()}),O==="historial"&&oe().then(()=>{O==="historial"&&x()})))});document.addEventListener("keydown",a=>{if(a.key==="Escape")for(const n of["numOverlay","varOverlay","authOverlay","summaryOverlay","imgZoomOverlay","swipeConfirmOverlay"]){const d=document.getElementById(n);if(d&&d.classList.contains("show")){B(n,null),d.classList.remove("show"),n==="authOverlay"&&(y.authUser=null);break}}});document.addEventListener("pageshow",async()=>{y.authUser&&y.sbClient&&navigator.onLine&&(await Y(),await new Promise(a=>setTimeout(a,800)),await oe(),O==="historial"&&x())});const de=[{title:"\u{1F44B} \xA1Bienvenido a EyeFit!",body:"Tu gimnasio de bolsillo. Gestiona tu rutina, controla tus series y sigue tu progreso sin conexi\xF3n."},{title:"\u{1F4C5} Rutina semanal",body:"Toca un d\xEDa de la semana para ver los ejercicios. Pulsa \xABEntrenar\xBB para empezar la sesi\xF3n de ese d\xEDa."},{title:"\u{1F3CB}\uFE0F Durante la sesi\xF3n",body:"Marca cada serie completada con \u2713. Ajusta peso y repeticiones con los botones +/\u2212 o tocando el valor. El descanso se controla solo."},{title:"\u2601\uFE0F Guardado y nube",body:"Todo se guarda en tu dispositivo autom\xE1ticamente. Con cuenta podr\xE1s sincronizar tu historial entre dispositivos."}];let ne=0;function it(){const a=de[ne]||de[0];document.getElementById("onbTitle").textContent=a.title,document.getElementById("onbBody").textContent=a.body,document.getElementById("onbDots").innerHTML=de.map((n,d)=>`<span class="onb-dot${d===ne?" active":""}"></span>`).join(""),document.getElementById("onbNext").textContent=ne===de.length-1?"\xA1Empezar!":"Siguiente"}const ke="eyefit_onboarding_seen_v2";function ot(){try{const a=navigator.userAgent+"|"+(screen.width||"")+"x"+(screen.height||"")+"|"+(navigator.language||"");let n=0;for(let d=0;d<a.length;d++)n=(n<<5)-n+a.charCodeAt(d),n|=0;return String(Math.abs(n))}catch{return"unknown"}}function De(a){const n=ot();if(!a)try{const i=JSON.parse(localStorage.getItem(ke)||"[]");if(Array.isArray(i)&&i.includes(n))return}catch{}const d=document.getElementById("onboardOverlay");d&&(ne=0,it(),d.classList.add("show"),B("onboardOverlay",d))}function rt(){const a=document.getElementById("onboardOverlay");a&&a.classList.remove("show"),B("onboardOverlay",null);const n=ot();try{const d=JSON.parse(localStorage.getItem(ke)||"[]");Array.isArray(d)||(d=[]),d.includes(n)||d.push(n),localStorage.setItem(ke,JSON.stringify(d))}catch{}}document.getElementById("onbNext").addEventListener("click",()=>{ne<de.length-1?(ne++,it()):rt()});document.getElementById("onbSkip").addEventListener("click",rt);window.EyeFitShowOnboarding=()=>De(!0);window.EyeFit.Router={get currentTab(){return O},set currentTab(a){O=a},get selectedDay(){return T},set selectedDay(a){T=a},setTab:ee,updateStopBtn:Ie,renderMain:x};})();
