import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'musify-visuals.spec.ts',
  outputDir: './test-results/musify-visuals',
  workers: 1,
  fullyParallel: false,
  timeout: 90000,
  expect: { timeout: 10000 },
  use: {
    baseURL: process.env.SPARKY_E2E_BASE_URL || 'http://localhost:3201',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
    reducedMotion: 'no-preference',
  },
  ...(process.env.SPARKY_E2E_BASE_URL ? {} : {
    webServer: { command: 'node scripts/preview-fixture.mjs', url: 'http://localhost:3201/api/release', reuseExistingServer: false, timeout: 30000 },
  }),
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'android-393', use: { ...devices['Pixel 7'], viewport: { width: 393, height: 780 } } },
    { name: 'android-360', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 706 } } },
    { name: 'android-320', use: { ...devices['Pixel 7'], viewport: { width: 320, height: 720 } } },
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
  ],
});
