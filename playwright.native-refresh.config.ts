import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'native-refresh.spec.ts',
  outputDir: './test-results/native-refresh',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3201',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'node scripts/preview-fixture.mjs',
    url: 'http://localhost:3201/api/release',
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    { name: 'android-393', use: { ...devices['Pixel 7'], viewport: { width: 393, height: 851 } } },
    { name: 'android-320', use: { ...devices['Pixel 7'], viewport: { width: 320, height: 640 } } },
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
  ],
});
