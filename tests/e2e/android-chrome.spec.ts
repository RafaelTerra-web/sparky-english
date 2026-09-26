import { expect, test } from '@playwright/test';

test('mobile navigation meets the system bar in every appearance', async ({ page }, info) => {
  test.skip(info.project.name !== 'android');
  await page.route('**/api/session', route => route.fulfill({ json: {
    authenticated: true, user: { id: 'android-chrome-test', email: 'ana@example.test', name: 'Ana' },
  } }));
  await page.route('**/api/rewards', route => route.fulfill({ json: {
    storage: 'account', coins: 0, completed: {}, reviews: {}, owned: [], mascot: 'sparky',
    equipped: { sparky: {}, pinky: {} },
  } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', route => route.fulfill({ json: { preference: null, storage: 'local' } }));
  await page.goto('/');
  const mobileNav = page.locator('.mobile-nav');
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole('button')).toHaveCount(5);

  for (const palette of ['sparky', 'beatrice', 'ocean', 'sunset', 'graphite']) {
    for (const mode of ['light', 'dark']) {
      await page.evaluate(({ palette, mode }) => {
        localStorage.setItem('sparky-appearance-v1', JSON.stringify({ palette, mode, pending: false }));
        dispatchEvent(new StorageEvent('storage', { key: 'sparky-appearance-v1' }));
      }, { palette, mode });
      await expect(page.locator('html')).toHaveAttribute('data-palette', palette);
      await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
      const chrome = await mobileNav.evaluate(element => {
        const navStyle = getComputedStyle(element);
        const htmlStyle = getComputedStyle(document.documentElement);
        return {
          navColor: navStyle.backgroundColor,
          expectedColor: htmlStyle.getPropertyValue('--chrome').trim(),
          themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
          bottom: element.getBoundingClientRect().bottom,
          viewportBottom: innerHeight,
          bottomPadding: parseFloat(navStyle.paddingBottom),
        };
      });
      expect(chrome.themeColor).toBe(chrome.expectedColor);
      expect(chrome.navColor).toBe(await page.evaluate(color => {
        const element = document.createElement('div');
        element.style.backgroundColor = color;
        document.body.append(element);
        const result = getComputedStyle(element).backgroundColor;
        element.remove();
        return result;
      }, chrome.expectedColor));
      expect(chrome.bottom).toBeCloseTo(chrome.viewportBottom, 0);
      expect(chrome.bottomPadding).toBeGreaterThanOrEqual(5);
    }
  }
  await page.screenshot({ path: info.outputPath('android-chrome.png') });
});
