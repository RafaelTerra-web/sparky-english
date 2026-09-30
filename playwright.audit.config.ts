import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["opening.spec.ts", "economy.spec.ts"],
  workers: 1,
  timeout: 30000,
  use: { baseURL: "http://localhost:3201", trace: "retain-on-failure", serviceWorkers: "block" },
  webServer: { command: "node scripts/preview-fixture.mjs", url: "http://localhost:3201/api/release", reuseExistingServer: false, timeout: 30000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "android", use: { ...devices["Pixel 7"], viewport: { width: 393, height: 851 } } },
    { name: "iphone", use: { ...devices["iPhone 13"] } },
  ],
});
