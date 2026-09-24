import { expect, test } from '@playwright/test';

test('first opening completes once and later visits enter directly', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone');
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: false } }));
  await page.goto('/');
  const opening = page.locator('.opening-scene');
  await expect(opening).toBeVisible();
  await expect(opening.locator('video')).toHaveAttribute('src', '/visuals/intro/sparky-opening.mp4');
  await expect(opening).not.toContainText('Uma palavra abre caminhos');
  await expect(opening).toHaveCount(0, { timeout: 6000 });
  expect(await page.evaluate(() => localStorage.getItem('sparky-opening-seen-v3'))).toBe('1');
  await page.reload();
  await expect(opening).toHaveCount(0);
});

test('reduced motion skips the opening', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: false } }));
  await page.goto('/');
  await expect(page.locator('.opening-scene')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sparky-opening-seen-v3'))).toBe('1');
});
