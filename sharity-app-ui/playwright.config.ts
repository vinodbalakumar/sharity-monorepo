import { defineConfig, devices } from '@playwright/test';

const previewPort = Number(process.env.SHARITY_PLAYWRIGHT_PORT || 8097);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Cold Firefox/WebKit startup is expensive on a shared Windows workstation.
  workers: process.env.CI ? 2 : 1,
  timeout: 120000,
  expect: { timeout: 30000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: `http://127.0.0.1:${previewPort}`, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testIgnore: '**/screen-audit.spec.ts', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testIgnore: '**/screen-audit.spec.ts', use: { ...devices['iPhone 13'], defaultBrowserType: 'webkit' } }
  ],
  webServer: {
    command: 'node tests/serve-export.cjs',
    url: `http://127.0.0.1:${previewPort}/app/`,
    reuseExistingServer: !process.env.CI
  }
});
