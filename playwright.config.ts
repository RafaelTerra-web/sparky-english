import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: { baseURL: "http://localhost:3211", trace: "retain-on-failure", serviceWorkers: 'block' },
  webServer: {
    command: "npm run dev -- --port 3211",
    url: "http://localhost:3211",
    reuseExistingServer: false,
    env: { ...process.env, NEXT_PUBLIC_SPARKY_CALL_ENABLED: "true" },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "iphone", use: { ...devices["iPhone 13"] } },
    { name: "android", use: { ...devices["Pixel 7"] } },
  ],
});
