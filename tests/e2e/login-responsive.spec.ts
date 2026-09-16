import { expect, test } from '@playwright/test';

test('Google sign-in fits its card after resize without restarting authentication', async ({ page }) => {
  let preparations = 0;
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: false } }));
  await page.route('**/api/auth/google', route => {
    preparations++;
    return route.fulfill({ json: { clientId: 'local-test', nonce: 'local-test' } });
  });
  await page.route('https://accounts.google.com/gsi/client*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.google = { accounts: { id: {
      initialize() {},
      renderButton(container, options) {
        const button = document.createElement('button');
        button.textContent = 'Google test button';
        button.style.width = options.width + 'px';
        container.append(button);
      }
    } } };`,
  }));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Google test button' });
  await button.focus();
  for (const width of [320, 390, 1440, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await expect.poll(() => button.evaluate(element => {
      if (!element.parentElement) return false;
      const parent = element.parentElement.getBoundingClientRect();
      const bounds = element.getBoundingClientRect();
      return bounds.left >= parent.left && bounds.right <= parent.right + 1;
    })).toBe(true);
    await expect(button).toBeFocused();
  }
  expect(preparations).toBe(1);
  expect(errors).toEqual([]);
});
