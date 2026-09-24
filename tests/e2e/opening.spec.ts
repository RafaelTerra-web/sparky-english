import { expect, test } from '@playwright/test';

test('first opening completes once and later visits enter directly', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone');
  await page.route('**/api/session', async route => {
    await new Promise(resolve => setTimeout(resolve, 1300));
    await route.fulfill({ json: { authenticated: false } });
  });
  await page.goto('/');
  const opening = page.locator('.opening-scene');
  await expect(opening).toBeVisible();
  await expect(opening.locator('.sparky-loading-face--sparky')).toBeVisible();
  await expect(opening).toContainText('sparky');
  await expect(opening.locator('video')).toHaveCount(0);
  await expect(opening).toHaveCount(0, { timeout: 4000 });
  expect(await page.evaluate(() => localStorage.getItem('sparky-opening-seen-v4'))).toBe('1');
  await page.reload();
  await expect(opening).toHaveCount(0);
});

test('reduced motion skips the opening', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: false } }));
  await page.goto('/');
  await expect(page.locator('.opening-scene')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sparky-opening-seen-v4'))).toBe('1');
});

test('Pinky selection and appearance are visible during loading', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone');
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
  await expect(opening).toHaveCount(0, { timeout: 4000 });
  expect(await page.evaluate(() => localStorage.getItem('sparky-opening-mascot-v1'))).toBe('pinky');
});

test('saved mascot from the account updates the next opening', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone');
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
