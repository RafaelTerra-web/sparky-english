import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const pack = JSON.parse(readFileSync('public/offline/practice.json', 'utf8'));
const cacheName = 'sparky-public-v16-musify-1-2';

async function install(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  expect(await page.evaluate(async name => (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname), cacheName))
    .toEqual(expect.arrayContaining(['/offline.html', '/offline/practice.json', '/offline/practice.mjs', '/visuals/musify-offline.webp']));
}

test.afterEach(async ({ request }) => { await request.post('/test-outage?enabled=false'); });

test('installed worker offers real practice offline, resumes scratch work, and reconnects on request', async ({ page, context }, testInfo) => {
  await install(page);
  await page.evaluate(() => localStorage.setItem('sparky-learning:private-account', JSON.stringify({ receipt: 'private-test-receipt', draft: 'private draft' })));
  await context.setOffline(true);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Uma pausa na conexão.' })).toBeVisible();
  await expect(page.locator('.mascot-art img')).toHaveJSProperty('naturalWidth', 640);
  await expect(page.locator('body')).not.toContainText('private draft');
  await page.screenshot({ path: testInfo.outputPath('musify-offline.png'), fullPage: true });
  await page.getByRole('button', { name: 'Praticar offline' }).click();
  await page.getByRole('button', { name: /Apresentar-se/ }).click();
  const lesson = pack.lessons.find((item: { id: string }) => item.id === 'a1-1-1');
  await page.getByRole('button', { name: lesson.exercises[0].answer, exact: true }).click();
  await page.getByRole('button', { name: 'Verificar', exact: true }).click();
  await expect(page.getByText('Muito bem!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Próxima questão →' }).click();
  const token = lesson.exercises[1].options[0];
  await page.locator('.word-bank button').first().click();
  await expect(page.locator('.assembled')).toContainText(token);
  const before = await page.evaluate(() => localStorage.getItem('sparky-learning:private-account'));
  await page.reload();
  await page.getByRole('button', { name: 'Praticar offline' }).click();
  await page.getByRole('button', { name: 'Continuar prática salva' }).click();
  await expect(page.locator('.assembled')).toContainText(token);
  await expect(page.locator('.exercise-position')).toHaveText('A1 · 2/6');
  await page.getByRole('link', { name: /Tentar novamente/ }).click();
  await expect(page.getByText('Ainda não conseguimos nos conectar. Sua prática continua disponível aqui.')).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText('A conexão pode ter voltado.', { exact: false })).toBeVisible();
  await expect(page.locator('.assembled')).toContainText(token); // Never auto-reload an ongoing drill.
  const keys = await page.evaluate(async name => (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname), cacheName);
  expect(keys).not.toContain('/'); expect(keys.every(path => !path.startsWith('/api/') && !path.startsWith('/_next/'))).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('sparky-learning:private-account'))).toBe(before);
  await page.getByRole('link', { name: /Tentar novamente/ }).click();
  await expect(page.getByRole('heading', { name: 'Conexão restabelecida' })).toBeVisible();
});

test('server 503 uses cached branded navigation, scripts, stylesheet, artwork and practice pack', async ({ page, request }, testInfo) => {
  await install(page);
  await request.post('/test-outage?enabled=true');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Uma pausa na conexão.' })).toBeVisible();
  await expect(page.locator('.mascot-art img')).toHaveJSProperty('naturalWidth', 640);
  await page.getByRole('button', { name: 'Praticar offline' }).click();
  await page.getByRole('button', { name: 'C2', exact: true }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(2);
  await page.locator('.lesson-card').first().click();
  await expect(page.locator('.options button')).toHaveCount(3);
  await expect(page.locator('.practice-note')).toContainText('não altera sua trilha, meta diária ou moedas');
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.screenshot({ path: testInfo.outputPath('musify-offline-dark.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('link', { name: /Tentar novamente/ }).click();
  await expect(page.getByText('Ainda não conseguimos nos conectar.', { exact: false })).toBeVisible();
  await request.post('/test-outage?enabled=false');
  await page.getByRole('link', { name: /Tentar novamente/ }).click();
  await expect(page.getByRole('heading', { name: 'Conexão restabelecida' })).toBeVisible();
});

test('first offline visit has no installed worker or cached fallback', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  await context.setOffline(true);
  const page = await context.newPage();
  await expect(page.goto('http://localhost:3225/')).rejects.toThrow();
  expect(context.serviceWorkers()).toHaveLength(0);
  await context.close();
});

test('all offline exercises finish locally without study receipts or reward writes', async ({ page, context }) => {
  const accountRequests: string[] = [];
  page.on('request', request => { if (/\/api\/(study|rewards|learning-events)/.test(request.url())) accountRequests.push(request.url()); });
  await install(page);
  await context.setOffline(true);
  await page.goto('/offline.html#practice');
  await page.getByRole('button', { name: /Apresentar-se/ }).click();
  const lesson = pack.lessons.find((item: { id: string }) => item.id === 'a1-1-1');
  for (const [position, step] of lesson.exercises.entries()) {
    if (step.kind === 'order_words') {
      const remaining = step.options.map((word: string, index: number) => ({ word, index }));
      for (const word of step.answer.split(' ')) {
        const index = remaining.findIndex((item: { word: string }) => item.word === word);
        const token = remaining.splice(index, 1)[0].index;
        await page.locator(`.word-bank button[data-token="${token}"]`).click();
      }
    } else await page.getByRole('button', { name: step.answer, exact: true }).click();
    await page.getByRole('button', { name: 'Verificar', exact: true }).click();
    await expect(page.getByText('Muito bem!', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: position === lesson.exercises.length - 1 ? 'Terminar prática' : 'Próxima questão →' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Prática terminada!' })).toBeVisible();
  expect(accountRequests).toHaveLength(0);
  const scratch = await page.evaluate(() => JSON.parse(localStorage.getItem('sparky-offline-practice-v1') || 'null'));
  expect(scratch.index).toBe(6);
  expect(Object.keys(scratch).sort()).toEqual(['checked', 'choice', 'contentVersion', 'index', 'lessonId', 'tokens']);
});

test('offline honors every public PT/EN interface/support combination and keeps target phrases unchanged', async ({ page, context }, testInfo) => {
  await install(page);
  await context.setOffline(true);
  const lesson = pack.lessons.find((item: { id: string }) => item.id === 'a1-1-1');
  for (const ui of ['pt-BR', 'en']) for (const support of ['pt-BR', 'en']) {
    await page.evaluate(({ ui, support }) => { localStorage.setItem('sparky-interface-language', ui); localStorage.setItem('sparky-support-language', support); }, { ui, support });
    await page.goto(`/offline.html?language-case=${ui}-${support}#practice`);
    await expect(page.locator('html')).toHaveAttribute('lang', ui);
    await expect(page.locator('#offline-interface-language')).toHaveValue(ui);
    await expect(page.locator('#offline-support-language')).toHaveValue(support);
    await expect(page.getByRole('heading', { name: ui === 'en' ? 'A pause in the connection.' : 'Uma pausa na conexão.' })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(ui === 'en' ? lesson.titleEnglish : lesson.title) }).click();
    await expect(page.locator('.exercise-prompt')).toHaveText(support === 'en' ? lesson.exercises[0].bodyEnglish : lesson.exercises[0].body);
    expect(await page.locator('.options button').allTextContents()).toEqual(lesson.exercises[0].options);
    await page.getByRole('button', { name: lesson.exercises[0].answer, exact: true }).click();
    await page.getByRole('button', { name: ui === 'en' ? 'Check' : 'Verificar', exact: true }).click();
    await expect(page.locator('.feedback p')).toHaveText(support === 'en' ? lesson.exercises[0].explanationEnglish : lesson.exercises[0].explanation);
    await page.getByRole('button', { name: ui === 'en' ? 'Next question →' : 'Próxima questão →' }).click();
    expect(await page.locator('.word-bank button').allTextContents()).toEqual(lesson.exercises[1].options);
    await expect(page.locator('.meaning')).not.toHaveAttribute('open', '');
    await expect(page.locator('.meaning p')).not.toBeVisible();
    await page.locator('.meaning summary').click();
    await expect(page.locator('.meaning p')).toHaveText(lesson.exercises[1].cue);
    await page.locator('.meaning summary').click();
    await page.locator('.support > summary').click();
    await expect(page.locator('.support > p').first()).toHaveText(support === 'en' ? lesson.support[0].bodyEnglish : lesson.support[0].body);
    await expect(page.locator('.translation p').first()).not.toBeVisible();
    if (ui === 'en' && support === 'en') await page.screenshot({ path: testInfo.outputPath('musify-offline-english.png'), fullPage: true });
    await page.locator('#offline-interface-language').selectOption(ui === 'en' ? 'pt-BR' : 'en');
    await expect(page.locator('.exercise-position')).toHaveText('A1 · 2/6'); // Switching language never resets practice.
  }
});
