import { existsSync } from 'node:fs';

// Use an explicitly selected browser, installed Chrome, or Playwright Chromium.
// This keeps the checks portable across the development machines.
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const musicBrowserOptions = {
  headless: true,
  ...(process.env.MUSIC_BROWSER_PATH ? { executablePath: process.env.MUSIC_BROWSER_PATH }
    : existsSync(chrome) ? { executablePath: chrome } : {}),
};
export const musicBaseURL = process.env.MUSIC_BASE_URL || 'http://127.0.0.1:3221';
export const musicSessionOptions = process.env.MUSIC_STORAGE_STATE
  ? { storageState: process.env.MUSIC_STORAGE_STATE } : {};
