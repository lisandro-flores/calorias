import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  webServer: {
    command: 'npm run e2e:build && npm run e2e:serve',
    url: 'http://127.0.0.1:8100',
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
    timeout: 120_000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:8100',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROME_PATH || '/usr/bin/google-chrome',
        },
      },
    },
  ],
});
