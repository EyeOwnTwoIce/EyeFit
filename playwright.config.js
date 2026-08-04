/* EyeFit — Config Playwright E2E */
'use strict';
const { defineConfig, devices } = require('@playwright/test');
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173';
const isRemote = !!process.env.PLAYWRIGHT_BASE_URL;
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    headless: process.env.CI ? true : false,
    trace: 'on-first-retry',
    viewport: { width: 393, height: 852 }
  },
  webServer: isRemote ? undefined : {
    command: 'npx http-server dist -p 4173 -c-1',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], headless: process.env.CI ? true : false } }
  ]
});