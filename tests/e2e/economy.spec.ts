import { test, expect } from '@playwright/test';

test('retired Expeditions and Stories are absent from practice and shop', async ({ page }) => {
  await page.route('**/api/session', route => route.fulfill({ json: {
    authenticated: true, user: { id: 'retired-experiences-test', email: 'ana@example.test', name: 'Ana' },
  } }));
  await page.route('**/api/rewards', route => route.fulfill({ json: {
    storage: 'account', coins: 85, completed: {}, reviews: {}, owned: [], mascot: 'sparky',
    expeditionRefund: 85, equipped: { sparky: {}, pinky: {} },
  } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', route => route.fulfill({ json: { preference: null, storage: 'local' } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Praticar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Praticar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Histórias' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Expedições' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Perfil', exact: true }).click();
  await page.getByRole('button', { name: '85 Loja e mascotes' }).click();
  await expect(page.getByText('85 moedas devolvidas pelas Expedições encerradas')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Expedições Sparky' })).toHaveCount(0);
  expect((await page.request.get('/api/expeditions')).status()).toBe(404);
  expect((await page.request.get('/api/story-audio?scene=0&mascot=sparky')).status()).toBe(404);
});
