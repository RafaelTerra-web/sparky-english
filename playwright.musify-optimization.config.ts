import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'musify-optimization.spec.ts',
  outputDir: './test-results/musify-optimization',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3201',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
    reducedMotion: 'no-preference',
  },
  webServer: {
    command: 'node scripts/preview-fixture.mjs',
    url: 'http://localhost:3201/api/release',
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    { name: 'samsung-a55-393', use: { ...devices['Pixel 7'], viewport: { width: 393, height: 780 } } },
    { name: 'samsung-print-360', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 706 } } },
    { name: 'small-android-320', use: { ...devices['Pixel 7'], viewport: { width: 320, height: 720 } } },
  ],
});
