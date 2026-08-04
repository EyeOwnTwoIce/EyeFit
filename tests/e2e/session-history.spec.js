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

test('T2: iniciar sesión, completar sets y ver la entrada en Historial', async ({ page }) => {
  await closeOverlays(page);

  await page.locator('[data-start-session="Lunes"]').last().click({ force: true });

  // Marcar TODAS las series pendientes. El selector excluye las ya marcadas
  // (.done) porque la app NO las deshabilita tras completarse.
  for (let guard = 0; guard < 40; guard++) {
    const clicked = await page.evaluate(() => {
      const btn = document.querySelector('.set-done:not([disabled]):not(.done)');
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (!clicked) break;
    await page.waitForTimeout(350);
    if (await page.locator('#summaryOverlay.show').isVisible().catch(() => false)) break;
  }

  await expect(page.locator('#summaryOverlay.show')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.sum-title')).toContainText('completado');

  await page.locator('#sumAgain').click();
  await page.locator('[data-tab="historial"]').last().click({ force: true });
  await expect(page.locator('.hist-day').first()).toBeVisible({ timeout: 6000 });
});