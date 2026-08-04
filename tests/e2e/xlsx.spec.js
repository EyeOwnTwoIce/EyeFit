/* EyeFit E2E — Exportar e importar rutina (.xlsx) — offline-first */
'use strict';
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('eyefit_onboarding_seen', '1');
  });
  await page.route('**/supabase.js', route => route.abort());
});

async function closeOverlays(page) {
  await page.goto('./');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    ['authOverlay', 'onboardOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('show');
    });
  });
}

test('T3: exportar rutina XLSX y reimportarla la restaura', async ({ page }) => {
  await closeOverlays(page);

  await page.locator('[data-tab="ajustes"]').click({ force: true });
  await page.locator('[data-export-xlsx]').click({ force: true });
  const download = await page.waitForEvent('download', { timeout: 15000 });
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);

  // Reimportar el archivo descargado: el ciclo exportar→importar debe funcionar
  await page.setInputFiles('#fileInput', await download.path());
  await expect(page.locator('.toast')).toContainText('importada', { timeout: 15000 });
  await expect(page.locator('[data-tab="rutina"]')).toBeVisible({ timeout: 5000 });
});