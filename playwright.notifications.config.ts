import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e',testMatch:'notifications.spec.ts',workers:1,fullyParallel:false,timeout:45000,
  use:{baseURL:'http://localhost:3201',trace:'retain-on-failure',serviceWorkers:'block'},
  webServer:{command:'node scripts/preview-fixture.mjs',url:'http://localhost:3201/api/release',reuseExistingServer:false,timeout:30000,
    env:{SPARKY_NOTIFICATION_FIXTURE:'true'}},
  projects:[
    {name:'android-320',use:{...devices['Pixel 7'],viewport:{width:320,height:640}}},
    {name:'android-393',use:{...devices['Pixel 7'],viewport:{width:393,height:851}}},
    {name:'iphone-pwa',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}},
    {name:'desktop',use:{...devices['Desktop Chrome']}},
  ],
});
