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
  await expect(opening.locator('.sparky-loading-face')).toBeVisible();
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
