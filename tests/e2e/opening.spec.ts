import { expect, test } from '@playwright/test';

test('first opening completes once and later visits enter directly', async ({ page }) => {
  await page.route('**/api/session', async route => {
    await new Promise(resolve => setTimeout(resolve, 1300));
    await route.fulfill({ json: { authenticated: false } });
  });
  await page.goto('/');
  const opening = page.locator('.opening-scene');
  await expect(opening).toBeVisible();
  await expect(opening.locator('.sparky-loading-face--sparky')).toBeVisible();
  await expect(opening).toContainText('Sparky');
  await expect(opening.locator('video')).toHaveCount(0);
  await expect(opening.locator('audio')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-scroll-locked', 'true');
  await expect(opening).toHaveCount(0, { timeout: 4000 });
  await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', 'true');
  expect(await page.evaluate(() => localStorage.getItem('sparky-opening-seen-v4'))).toBe('1');
  await page.reload();
  await expect(opening).toHaveCount(0);
});

test('reduced motion skips the opening', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: false } }));
  await page.goto('/');
  await expect(page.locator('.opening-scene')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sparky-opening-seen-v4'))).toBe('1');
});

test('Pinky selection and appearance are visible during loading', async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('sparky-opening-mascot-v1', 'pinky');
    localStorage.setItem('sparky-appearance-v1', JSON.stringify({ palette: 'beatrice', mode: 'dark' }));
  });
  await page.route('**/api/session', async route => {
    await new Promise(resolve => setTimeout(resolve, 1300));
    await route.fulfill({ json: { authenticated: true, user: { id: 'pinky-opening-test', email: 'pinky@example.test', name: 'Ana' } } });
  });
  await page.route('**/api/rewards', route => route.fulfill({ json: {
    storage: 'account', coins: 0, completed: {}, reviews: {}, owned: [], mascot: 'pinky',
    equipped: { sparky: {}, pinky: {} },
  } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.goto('/');
  const opening = page.locator('.opening-scene');
  await expect(opening.locator('.sparky-loading-face--pinky')).toBeVisible();
  await expect(opening.locator('.sparky-loading-face--sparky')).toBeHidden();
  await expect(opening.locator('.sparky-loading-name--pinky')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'beatrice');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#09080a');
  await opening.screenshot({ path: info.outputPath('loading-pinky-dark.png') });
  await expect(opening).toHaveCount(0, { timeout: 4000 });
  expect(await page.evaluate(() => localStorage.getItem('sparky-opening-mascot-v1'))).toBe('pinky');
});

test('saved mascot from the account updates the next opening', async ({ page }) => {
  await page.route('**/api/session', route => route.fulfill({ json: {
    authenticated: true, user: { id: 'pinky-account-test', email: 'pinky@example.test', name: 'Ana' },
  } }));
  await page.route('**/api/rewards', route => route.fulfill({ json: {
    storage: 'account', coins: 0, completed: {}, reviews: {}, owned: [], mascot: 'pinky',
    equipped: { sparky: {}, pinky: {} },
  } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-opening-mascot', 'pinky');
  expect(await page.evaluate(() => localStorage.getItem('sparky-opening-mascot-v1'))).toBe('pinky');
});

test('returning loader fits 320px, translates and stays still with reduced motion', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('sparky-opening-seen-v4', '1');
    localStorage.setItem('sparky-interface-language', 'en');
    localStorage.setItem('sparky-support-language', 'en');
  });
  let resume!: () => void;
  await page.route('**/api/session', async route => {
    await new Promise<void>(resolve => { resume = resolve; });
    await route.fulfill({ json: { authenticated: false } });
  });
  await page.goto('/');
  const loading = page.locator('.loading-page--brand');
  await expect(loading).toBeVisible();
  await expect(loading).toContainText('Getting your practice ready…');
  await expect(loading.locator('.sparky-loading-emblem')).toHaveCSS('animation-name', 'none');
  await expect(loading.locator('.sparky-loading-track > span')).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const box = await loading.locator('.sparky-loading-art').boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(568);
  await loading.screenshot({ path: info.outputPath('loading-320.png') });
  resume();
  await expect(loading).toHaveCount(0);
});

test('a stalled session offers retry instead of loading forever', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sparky-opening-seen-v4', '1'));
  await page.clock.install();
  await page.route('**/api/session', () => {});
  const sessionStarted = page.waitForRequest('**/api/session');
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await sessionStarted;
  await expect(page.locator('.loading-page--brand')).toBeVisible();
  await page.clock.fastForward(16000);
  await page.clock.runFor(300);
  await expect(page.getByRole('heading', { name: 'Sem conexão no momento' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', 'true');
});
