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

/* goto tolerante: la app hace reload() por controllerchange (SW claim),
   que puede interrumpir la navegación de Playwright → reintentamos. */
async function gotoApp(page) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto('./', { waitUntil: 'domcontentloaded', timeout: 10000 });
      return;
    } catch (e) {
      await page.waitForTimeout(1000);
    }
  }
  await page.goto('./', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
}

test('T4: la app funciona offline tras la primera visita', async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.setItem('eyefit_onboarding_seen', '1');
  });
  await page.route('**/supabase.js', route => route.abort());

  // Primera visita: el SW instala y claims la página (provoca un reload interno).
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await closeOverlays(page);
  try { await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.ready, null, { timeout: 10000 }); } catch (e) {}
  // Dejar que el reload por controllerchange se asiente
  await page.waitForTimeout(2000);
  await closeOverlays(page);

  // Segunda visita online: el SW (claim) sirve el shell cacheado.
  await gotoApp(page);
  await closeOverlays(page);
  await page.waitForTimeout(500);

  // Desconectar y navegar: el SW debe servir la app desde caché offline.
  await context.setOffline(true);
  await gotoApp(page);
  await closeOverlays(page);

  await expect(page.locator('.tabbar')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.routine-table')).toBeVisible({ timeout: 5000 });

  await context.setOffline(false);
});