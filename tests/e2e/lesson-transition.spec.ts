import { test, expect } from '@playwright/test';

test('lesson keeps its frame stable while illustration is delayed', async ({ page }) => {
  await page.route('**/api/session', r => r.fulfill({ json: { authenticated: true, user: { id: 'transition-test', name: 'Ana', email: 'test@example.com' } } }));
  await page.route('**/api/onboarding', r => r.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', r => r.fulfill({ json: { storage: 'account', preference: null } }));
  await page.route('**/api/rewards', r => r.fulfill({ json: { storage: 'account', coins: 0, completed: {}, reviews: {}, owned: [], mascot: 'sparky', equipped: { sparky: {}, pinky: {} } } }));
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/lesson-images/**', async route => { await gate; await route.continue(); });
  const motionRequests: string[] = [];
  page.on('request', request => { if (/sparky-(transition|loader)\.(webm|webp)/.test(request.url())) motionRequests.push(request.url()); });
  await page.goto('/');
  await page.locator('.next-lesson .cream-button').click();
  const dialog = page.locator('.lesson-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('.section-loading')).toHaveCount(0);
  const measure = () => dialog.evaluate(node => {
    const box = node.getBoundingClientRect();
    const footer = node.querySelector('footer')!.getBoundingClientRect();
    return [box.width, box.height, footer.height];
  });
  const before = await measure();
  release();
  await expect.poll(() => dialog.locator('.lesson-illustration img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(await measure()).toEqual(before);
  await expect(dialog.locator('.lesson-forward-button')).toBeVisible();
  expect(motionRequests).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await dialog.evaluate(node => getComputedStyle(node).animationName)).toBe('none');
});
