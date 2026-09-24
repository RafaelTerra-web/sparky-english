import { test, expect, type Page } from '@playwright/test';

const lesson = {
  id: 'stay-at-your-house-local', version: 'test-1', title: 'Test Song', artist: 'Sparky', level: 'A1', topic: 'Listening', duration: 12,
  source: '/api/music/audio?trackId=stay-at-your-house-local', visualSource: '/api/music/video?trackId=stay-at-your-house-local', rights: 'user-provided', published: true,
  lines: [{ id: 'line-1', start: 1, end: 4, text: 'Hello world', translation: 'Olá mundo', tip: 'Listen for the first sound.', words: [{ text: 'Hello', start: 1, end: 2 }, { text: 'world', start: 2, end: 3 }] }],
  vocabulary: [{ id: 'hello', word: 'hello', meaning: 'olá', ipa: '/həˈloʊ/', usage: 'Greeting', example: 'Hello, Sparky.' }],
  questions: [{ id: 'q1', prompt: 'What did you hear?', options: ['Hello', 'Goodbye'], answer: 0, explanation: 'Hello is a greeting.' }],
};

async function account(page: Page) {
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: true, user: { id: 'mobile-music-test', email: 'test@example.test', name: 'Ana' } } }));
  await page.route('**/api/rewards', route => route.fulfill({ json: { storage: 'account', coins: 0, completed: {}, reviews: {}, owned: [], notebookTheme: null, mascot: 'sparky', equipped: { sparky: {}, pinky: {} } } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', route => route.fulfill({ json: { preference: { palette: 'sparky', mode: 'light' }, storage: 'account' } }));
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
  const card = page.getByRole('region', { name: 'Faça do inglês um hábito leve.' });
  await expect(card).toBeVisible();
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
  const card = page.getByRole('region', { name: 'Faça do inglês um hábito leve.' });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Agora não' }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(card).toHaveCount(0);
  expect(await page.evaluate(() => (window as typeof window & { pushPrompted?: boolean }).pushPrompted)).toBeUndefined();
});
