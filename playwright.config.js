const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8124',
    headless: true,
    viewport: { width: 393, height: 852 }, // iPhone 15
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 8124',
    url: 'http://localhost:8124',
    reuseExistingServer: true,
    timeout: 10000,
  },
});