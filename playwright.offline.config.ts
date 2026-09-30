import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'offline.spec.ts',
  outputDir: './tmp/offline-playwright',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:3225', serviceWorkers: 'allow', trace: 'retain-on-failure' },
  webServer: { command: 'node tests/fixtures/offline-server.mjs', url: 'http://localhost:3225', reuseExistingServer: false },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
  ],
});
