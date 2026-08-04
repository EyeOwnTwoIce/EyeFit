/* EyeFit E2E — Offline (SW cachea shell + slim-dataset) — offline-first */
'use strict';
const { test, expect } = require('@playwright/test');

async function closeOverlays(page) {
  await page.evaluate(() => {
    ['authOverlay', 'onboardOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('show');
    });
  });
}

test('T4: la app funciona offline tras la primera visita', async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.setItem('eyefit_onboarding_seen', '1');
  });
  await page.route('**/supabase.js', route => route.abort());
  await page.goto('/');
  await closeOverlays(page);
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.ready, null, { timeout: 10000 });

  // Recarga online: clients.claim() controla la página y cachea el shell
  await page.reload({ waitUntil: 'domcontentloaded' });
  await closeOverlays(page);
  await page.waitForTimeout(500);

  // Desconectar y recargar: el SW debe servir la app desde caché
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await closeOverlays(page);

  await expect(page.locator('.tabbar')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.week-grid')).toBeVisible({ timeout: 5000 });

  await context.setOffline(false);
});