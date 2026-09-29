import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "economy.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  use: { baseURL: "http://localhost:3201", trace: "retain-on-failure", serviceWorkers: "block" },
  webServer: {
    command: "node scripts/preview-fixture.mjs",
    url: "http://localhost:3201/api/release",
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "android-compact", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 800 } } },
  ],
});
