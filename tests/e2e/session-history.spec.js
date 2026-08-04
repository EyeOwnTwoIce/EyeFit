/* EyeFit E2E — Flujo sesión → historial (offline-first) */
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

test('T2: iniciar sesión, completar sets y ver la entrada en Historial', async ({ page }) => {
  await closeOverlays(page);

  await page.locator('[data-start-session="Lunes"]').first().click();
  await page.waitForSelector('.set-done', { timeout: 5000 });

  for (let guard = 0; guard < 30; guard++) {
    const done = page.locator('.set-done:not([disabled])').first();
    if (!(await done.isVisible().catch(() => false))) break;
    await done.click();
    await page.waitForTimeout(250);
    if (await page.locator('#summaryOverlay.show').isVisible({ timeout: 800 }).catch(() => false)) break;
  }

  await expect(page.locator('#summaryOverlay.show')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.sum-title')).toContainText('completado');

  await page.locator('#sumAgain').click();
  await page.locator('[data-tab="historial"]').click();
  await expect(page.locator('.hist-day').first()).toBeVisible({ timeout: 4000 });
});