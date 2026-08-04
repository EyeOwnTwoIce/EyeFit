/* EyeFit E2E — Importar/Exportar rutina (.xlsx) — offline-first */
'use strict';
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('eyefit_onboarding_seen', '1');
  });
  await page.route('**/supabase.js', route => route.abort());
});

/* Cierra los overlays (auth/onboarding) por evaluación directa del DOM */
async function closeOverlays(page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    ['authOverlay', 'onboardOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('show');
    });
  });
}

test('T3: exportar rutina XLSX y reimportarla cambia la rutina', async ({ page }) => {
  await closeOverlays(page);

  // Ajustes → Exportar (SPA, sin recargar)
  await page.locator('[data-tab="ajustes"]').click();
  await page.locator('[data-export-xlsx]').click();
  const download = await page.waitForEvent('download', { timeout: 15000 });
  expect(download.suggestedFilename().split('.').pop()).toBe('xlsx');

  // Generar un xlsx modificado con SheetJS en Node
  const { writeFile, book_new, book_append_sheet, aoa_to_sheet } = require('xlsx');
  const ws = aoa_to_sheet([
    ['dia','orden','nombre_es','dataset','series','reps','peso_kg','descanso_s','notas'],
    ['Lunes',1,'Press banca E2E','barbell bench press',1,1,1,60,'test']
  ]);
  const wb = book_new();
  book_append_sheet(wb, ws, 'Rutina');
  const tmp = 'tests/e2e/tmp-rutina-e2e.xlsx';
  writeFile(wb, tmp);

  // Importar en la misma sesión (SPA)
  await page.setInputFiles('#fileInput', tmp);
  await expect(page.locator('.toast')).toContainText('Rutina importada', { timeout: 15000 });
  await expect(page.locator('.ex-name').first()).toContainText('Press banca E2E');

  require('fs').unlinkSync(tmp);
});