import { test, expect, type Page } from '@playwright/test';

const lesson = {
  id: 'stay-at-your-house-local', version: 'test-1', title: 'Test Song', artist: 'Sparky', level: 'A1', topic: 'Listening', duration: 12,
  source: '/api/music/audio?trackId=stay-at-your-house-local', visualSource: '/api/music/video?trackId=stay-at-your-house-local', rights: 'user-provided', published: true,
  lines: [{ id: 'line-1', start: 1, end: 4, text: 'Hello world', translation: 'Olá mundo', tip: 'Listen for the first sound.', words: [{ text: 'Hello', start: 1, end: 2 }, { text: 'world', start: 2, end: 3 }] }],
  vocabulary: [{ id: 'hello', word: 'hello', meaning: 'olá', ipa: '/həˈloʊ/', usage: 'Greeting', example: 'Hello, Sparky.' }],
  questions: [{ id: 'q1', prompt: 'What did you hear?', options: ['Hello', 'Goodbye'], answer: 0, explanation: 'Hello is a greeting.' }],
};

async function account(page: Page, appearance = { palette: 'sparky', mode: 'light' }) {
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: true, user: { id: 'mobile-music-test', email: 'test@example.test', name: 'Ana' } } }));
  await page.route('**/api/rewards', route => route.fulfill({ json: { storage: 'account', coins: 0, completed: {}, reviews: {}, owned: [], notebookTheme: null, mascot: 'sparky', equipped: { sparky: {}, pinky: {} } } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', route => route.fulfill({ json: { preference: appearance, storage: 'account' } }));
  await page.route('**/api/music', route => route.fulfill({ json: { catalog: [lesson], storage: 'account' } }));
  await page.route('**/api/media-progress?*', route => route.fulfill({ json: { version: 'test-1', revision: 0, position: 2, positionAt: 1 } }));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Abrir perfil de Ana' })).toBeVisible();
}

test('iPhone restores the music room after reload and keeps mobile visuals lightweight', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone');
  await account(page);
  await page.getByRole('navigation', { name: 'Navegação no celular' }).getByRole('button', { name: 'Músicas' }).click();
  await page.getByRole('button', { name: /Praticar com Test Song/ }).click();
  const room = page.getByRole('dialog', { name: 'Test Song' });
  await expect(room).toBeVisible();
  await expect(room.locator('.music-scene')).toHaveAttribute('data-renderer', 'static');
  await expect(room.locator('video')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('music-iphone.png') });
  await page.reload();
  await expect(room).toBeVisible();
  await room.getByRole('button', { name: 'Todas as músicas' }).click();
  await page.reload();
  await expect(room).toHaveCount(0);
});

test('Android pull gesture refreshes data with Sparky animation and keeps the page', async ({ page }, info) => {
  test.skip(info.project.name !== 'android');
  await account(page);
  await page.screenshot({ path: info.outputPath('home-android.png') });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY)).toBe('none');
  await page.evaluate(() => {
    const target = document.body;
    const touch = (y: number) => new Touch({ identifier: 1, target, clientX: 100, clientY: y });
    target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [touch(10)], changedTouches: [touch(10)] }));
    target.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, touches: [touch(125)], changedTouches: [touch(125)] }));
    target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [touch(125)] }));
  });
  await expect(page.locator('.native-refresh')).toHaveAttribute('data-refreshing', 'true');
  await expect(page.locator('.native-refresh')).toHaveAttribute('data-refreshing', 'false');
  await expect(page.getByRole('button', { name: 'Abrir perfil de Ana' })).toBeVisible();
});

test('entry card explains notifications before requesting system permission', async ({ page }, info) => {
  test.skip(info.project.name !== 'android');
  await page.addInitScript(() => {
    const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: 'A'.repeat(65), auth: 'B'.repeat(22) } };
    Object.defineProperty(window, 'Notification', { configurable: true, value: {
      permission: 'default', requestPermission: async () => { (window as typeof window & { pushPrompted?: boolean }).pushPrompted = true; return 'granted'; },
    } });
    Object.defineProperty(window, 'PushManager', { configurable: true, value: class PushManager {} });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {
      register: async () => undefined,
      ready: Promise.resolve({ pushManager: { getSubscription: async () => null, subscribe: async () => ({ toJSON: () => subscription }) } }),
    } });
  });
  await page.route('**/api/push', route => route.fulfill({ json: route.request().method() === 'GET' ? { available: true, publicKey: 'A'.repeat(87) } : { subscribed: true } }));
  await account(page);
  const card = page.getByRole('dialog', { name: 'Faça do inglês um hábito leve.' });
  await expect(card).toBeVisible();
  await expect(card.getByRole('button', { name: 'Continuar' })).toBeFocused();
  const layout = await card.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return { centered: Math.abs(bounds.x + bounds.width / 2 - innerWidth / 2) < 2 && Math.abs(bounds.y + bounds.height / 2 - innerHeight / 2) < 2, safe: bounds.x >= 0 && bounds.y >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight, modal: element.matches(':modal'), backdrop: getComputedStyle(element, '::backdrop').backgroundColor };
  });
  expect(layout.centered).toBe(true);
  expect(layout.safe).toBe(true);
  expect(layout.modal).toBe(true);
  expect(layout.backdrop).toMatch(/rgba?\(7, 21, 29/);
  await page.screenshot({ path: info.outputPath('push-android.png') });
  await page.setViewportSize({ width: 320, height: 568 });
  expect(await card.evaluate(element => { const bounds = element.getBoundingClientRect(); return bounds.left >= 0 && bounds.top >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight && (element.scrollHeight <= element.clientHeight || getComputedStyle(element).overflowY === 'auto'); })).toBe(true);
  await page.screenshot({ path: info.outputPath('push-android-small.png') });
  expect(await page.evaluate(() => (window as typeof window & { pushPrompted?: boolean }).pushPrompted)).toBeUndefined();
  await card.getByRole('button', { name: 'Continuar' }).click();
  await expect(card).toHaveCount(0);
  expect(await page.evaluate(() => (window as typeof window & { pushPrompted?: boolean }).pushPrompted)).toBe(true);
});

test('notification card can be deferred without opening system permission', async ({ page }, info) => {
  test.skip(info.project.name !== 'android');
  await page.addInitScript(() => {
    Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'default', requestPermission: async () => { (window as typeof window & { pushPrompted?: boolean }).pushPrompted = true; return 'granted'; } } });
    Object.defineProperty(window, 'PushManager', { configurable: true, value: class PushManager {} });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { register: async () => undefined, ready: Promise.resolve({ pushManager: { getSubscription: async () => null } }) } });
  });
  await page.route('**/api/push', route => route.fulfill({ json: { available: true, publicKey: 'A'.repeat(87) } }));
  await account(page);
  const card = page.getByRole('dialog', { name: 'Faça do inglês um hábito leve.' });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Agora não' }).click();
  await expect(card).toHaveCount(0);
  expect(await page.evaluate(() => Number(localStorage.getItem('sparky-push:snooze:mobile-music-test')) - Date.now())).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
  await page.reload();
  await expect(card).toHaveCount(0);
  expect(await page.evaluate(() => (window as typeof window & { pushPrompted?: boolean }).pushPrompted)).toBeUndefined();
});

test('renewed panels and illustrations fit the supported palettes on desktop', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  const appearance = { palette: 'sparky', mode: 'light' };
  await account(page, appearance);
  for (const palette of ['sparky', 'beatrice', 'ocean', 'sunset', 'graphite']) {
    for (const theme of ['light', 'dark']) {
      appearance.palette = palette;
      appearance.mode = theme;
      await page.reload();
      await expect.poll(() => page.evaluate(() => `${document.documentElement.dataset.palette}:${document.documentElement.dataset.theme}`)).toBe(`${palette}:${theme}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  appearance.palette = 'ocean';
  appearance.mode = 'dark';
  await page.reload();
  await expect.poll(() => page.evaluate(() => `${document.documentElement.dataset.palette}:${document.documentElement.dataset.theme}`)).toBe('ocean:dark');
  await page.screenshot({ path: info.outputPath('home-desktop-dark.png') });
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  await nav.getByRole('button', { name: 'Curso' }).click();
  const courseArt = page.locator('.trail-current-art');
  await expect(courseArt).toBeVisible();
  expect(await courseArt.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: info.outputPath('course-desktop-dark.png') });
  await nav.getByRole('button', { name: 'Músicas' }).click();
  await expect(page.locator('img[src*="sparky-listen"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('music-desktop-dark.png') });
  await nav.getByRole('button', { name: 'Revisão' }).click();
  await expect(page.locator('.review-mascot')).toBeVisible();
  await expect.poll(() => page.locator('.review-mascot').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: info.outputPath('review-desktop-dark.png') });
  await nav.getByRole('button', { name: 'Simulados' }).click();
  await expect(page.getByRole('heading', { name: 'Simulado ELTiS' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('exam-desktop-dark.png') });
  await nav.getByRole('button', { name: 'Loja' }).click();
  await expect(page.locator('.mascot-preview .mascot-figure')).toBeVisible();
  await page.screenshot({ path: info.outputPath('shop-desktop-dark.png') });
  await nav.getByRole('button', { name: 'Perfil' }).click();
  await expect(page.locator('.profile-mascot')).toBeVisible();
  await page.screenshot({ path: info.outputPath('profile-desktop-dark.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('renewed mobile views respect narrow screens and reduced motion', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await account(page, { palette: 'graphite', mode: 'dark' });
  await expect.poll(() => page.evaluate(() => `${document.documentElement.dataset.palette}:${document.documentElement.dataset.theme}`)).toBe('graphite:dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('home-iphone-small-dark.png') });
  const nav = page.getByRole('navigation', { name: 'Navegação no celular' });
  await nav.getByRole('button', { name: 'Curso' }).click();
  await expect(page.locator('.trail-current-art')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await nav.getByRole('button', { name: 'Músicas' }).click();
  await expect(page.locator('img[src*="sparky-listen"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('music-iphone-small-dark.png') });
  expect(Number.parseFloat(await page.locator('.native-refresh').evaluate(element => getComputedStyle(element).transitionDuration))).toBeLessThan(0.01);
});

test('entry illustration stays visible without an account', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: false } }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Entre para estudar' })).toBeVisible();
  const artwork = page.locator('.sample-scene img');
  await expect.poll(() => artwork.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: info.outputPath('entry-desktop.png') });
});

test('onboarding invite illustration fits the glass panel', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone');
  await account(page);
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: true, profile: null, revision: 1, draft: { step: 'welcome' }, placement: null } }));
  await page.reload();
  await expect(page.locator('.onboarding-expression')).toBeVisible();
  await expect.poll(() => page.locator('.onboarding-expression').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('onboarding-iphone.png') });
});
