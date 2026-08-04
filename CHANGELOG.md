# Changelog

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