# Changelog

## [3.0.0] - 2026-04-08
### Cambios (Roadmap Fases A–F)

- **Build**: pipeline esbuild (`tools/build.js`) con `dist/` content-hashed (`app.[hash].js`, `styles.[hash].css`), CSP estricta (`script-src 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`); fuente única en `src/` (index.html, styles.css, app.js, sw.js, db.js, utils.js); Service Worker generado con cache versionada.
- **Rendimiento**: SheetJS fuera del bundle inicial → carga bajo demanda (`loadXLSX()`) solo al importar/exportar; dataset local `slim-dataset.json` (~0.66 MB) servido offline con stale-while-revalidate (antes localStorage ~5MB límite iOS).
- **Persistencia**: historial en IndexedDB (`src/db.js`) con caché síncrona en memoria y schema versioning (`eyefit_meta.data_version` v2) + migración one-time desde localStorage; exportar/importar backup JSON (rutina + historial).
- **Accesibilidad**: focus trap con retorno de foco en los 4 overlays (auth, numPad, variantes, resumen) + Esc-to-close; `aria-label`/`aria-pressed`/`role=button` en week-cells, steppers, set-value, set-done, del/add-set; navegación por teclado (Enter/Space); touch targets 44×44px.
- **Onboarding**: guía de 4 pasos en-app al primer uso y reabrible desde Ajustes (❓ Ayuda).
- **Calidad**: tests RLS estáticos (4) + suite unitaria (49) → `npm test` (53 total); Playwright E2E (offline, sesión→historial, import/export XLSX) que corren en local y contra GitHub Pages; Lighthouse CI (`.lighthouserc.js`) con budgets y auditorías de accesibilidad; GitHub Actions ahora hace build+test+e2e y despliega `dist/` a GitHub Pages.

## [2.0.0] - 2026-04-08
### Cambios (QA Roadmap 6.2 → 10)

- **Fiabilidad**: sesión guardada no "resucita" en reload (bandera `saved` + `clearSessionState()` en `autoSaveSession`); duración ya no se infla al restaurar sesión (`rebaseElapsed`); estado del temporizador de descanso se persiste y restaura.
- **Sync idempotente**: `session_id` (UUID de cliente) + `UNIQUE(user_id, session_id)` en Supabase; upsert en vez de insert; mutex con `scheduleSync()` que coalesce interval/online/pageshow/init; merge LWW por `updated_at` (sesiones por session_id, rutina por `K.routineUpdated`).
- **Seguridad**: XSS en atributos `data-*` corregido (`escapeHtmlAttr`); `onerror` inline eliminados → handler delegado `data-img-fallback`; `user-select` scoped; `parseRoutineSheet` valida días contra `DAY_ORDER` y clampa numéricos.
- **PWA**: `manifest.json` estático e instalable (antes Blob URL que devolvía 404); SW v5 con offline shell, Background Sync, `updatefound`/`controllerchange` con prompt de recarga; "Continuar sin conexión" también cuando `getSession()` lanza (`authBlocked`).
- **Funcionalidad**: `input.max` alineado con el slider (200 kg / 30 reps); variantes preservan `varianteBase` (imagen/lookups siguen funcionando); historial muestra 50 sesiones; mensaje "no se completó ninguna serie".
- **A11y**: `prefers-reduced-motion`; `role="dialog"`/`aria-modal`/`aria-live` en overlays, toast, summary y comic; Esc-to-close general; `user-select` solo en controles.
- **SEO**: meta description, OpenGraph, Twitter, JSON-LD WebApplication, `robots.txt`, `sitemap.xml`.
- **Calidad**: `.eslintrc.json` + `.prettierrc`; GitHub Actions CI (test + lint); `utils.js` fuente única de constantes (APODOS, DAY_ORDER, DAY_COLORS, DAY_SHORT, INSTRUCCIONES, ALTERNATIVAS, DEFAULT_ROUTINE, EMBEDDED_IMAGES); `setVolume` eliminado (código muerto); tests unitarios ampliados de 28 a 49.