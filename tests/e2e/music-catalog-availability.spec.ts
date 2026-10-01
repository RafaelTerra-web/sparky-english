import { test, expect, type Page } from '@playwright/test';
import english from '../../public/locales/en.json' with { type: 'json' };
import type { MusicLesson } from '../../src/lib/music';

const temporary = 'As músicas estão temporariamente indisponíveis.';
const network = 'Não foi possível carregar as músicas.';
const empty = 'Não há músicas disponíveis agora.';
const noMatch = 'Nenhuma música disponível neste filtro.';
const partial = 'Algumas músicas estão indisponíveis agora.';
const copy = (value: string, locale = 'pt-BR') => locale === 'en' ? (english as Record<string, string>)[value] : value;
const library = (page: Page) => page.locator('[aria-labelledby="music-heading"]');
const cards = (page: Page) => library(page).locator('[data-track-id]');

const catalog: MusicLesson[] = [
  { id: 'perfect-local', title: 'First Song', level: 'A1' },
  { id: 'heartless-local', title: 'Bright Song', level: 'B2' },
].map(entry => ({
  ...entry, artist: 'Test Artist', version: 'catalog-test', topic: 'Listening', duration: 12,
  source: `/api/music/audio?trackId=${entry.id}`, rights: 'user-provided', published: true,
  lines: [{ id: 'line-1', start: 1, end: 2, text: 'Hello', translation: 'Olá',
    tip: 'Listen carefully.', words: [{ text: 'Hello', start: 1, end: 2 }] }],
  vocabulary: [{ id: 'hello', word: 'hello', meaning: 'olá', ipa: '/həˈloʊ/', usage: 'Greeting', example: 'Hello.' }],
  questions: [{ id: 'question-1', prompt: 'Which greeting?', options: ['Hello', 'Goodbye'], answer: 0, explanation: 'Hello is a greeting.' }],
}));

type Reply = { status?: number; json?: unknown; abort?: boolean; wait?: Promise<void> };
const ready = (tracks = catalog, unavailable = 0): Reply => ({ json: { catalog: tracks, storage: 'account', unavailable } });
const blocked = (): Reply => ({ status: 503, json: { error: 'music-unavailable' } });

function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

async function open(page: Page, reply: Reply, locale = 'pt-BR') {
  const control = { reply, calls: 0 };
  await page.addInitScript(locale => {
    localStorage.setItem('sparky-opening-seen-v4', '1');
    localStorage.setItem('sparky-interface-language', locale);
    localStorage.setItem('sparky-language:catalog-test', locale);
    localStorage.setItem('sparky-support-language:catalog-test', locale);
  }, locale);
  await page.route('**/api/session', route => route.fulfill({ json: {
    authenticated: true, user: { id: 'catalog-test', name: 'Ana', email: 'catalog@example.test' },
  } }));
  await page.route('**/api/rewards', route => route.fulfill({ json: {
    storage: 'account', coins: 0, completed: {}, reviews: {}, owned: [], notebookTheme: null,
    mascot: 'sparky', equipped: { sparky: {}, pinky: {} },
  } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', route => route.fulfill({ json: {
    storage: 'account', preference: { palette: 'sparky', mode: 'light' },
  } }));
  await page.route('**/api/notifications', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/push', route => route.fulfill({ json: { available: false } }));
  await page.route('**/api/release?**', route => route.fulfill({ json: { version: '' } }));
  await page.route('**/api/music', async route => {
    control.calls++;
    const response = control.reply;
    await response.wait;
    if (response.abort) { await route.abort('internetdisconnected'); return; }
    await route.fulfill({ status: response.status ?? 200, json: response.json });
  });
  await page.goto('/');
  await expect(page.locator('.quick-today h1')).toBeVisible();
  await page.getByRole('button', { name: locale === 'en' ? 'Practice' : 'Praticar', exact: true }).click();
  await page.getByRole('button', { name: locale === 'en' ? /^Music / : /^Músicas / }).click();
  await expect(page.getByRole('heading', { name: 'Musify', exact: true })).toBeVisible();
  await expect.poll(() => control.calls).toBe(1);
  return control;
}

async function retry(page: Page, locale = 'pt-BR') {
  await library(page).getByRole('button', { name: locale === 'en' ? 'Try again' : 'Tentar novamente', exact: true }).click();
}

test('a blocked catalog shows temporary unavailability and retries instead of claiming an empty filter', async ({ page }) => {
  const control = await open(page, blocked());
  await expect(library(page).getByRole('alert')).toContainText(temporary);
  await expect(library(page).getByText(noMatch, { exact: true })).toHaveCount(0);
  await expect(library(page).getByText(empty, { exact: true })).toHaveCount(0);
  await expect(cards(page)).toHaveCount(0);
  control.reply = ready();
  await retry(page);
  await expect(cards(page)).toHaveCount(2);
  await expect(library(page).getByRole('alert')).toHaveCount(0);
  expect(control.calls).toBe(2);
});

test('a failed network request shows its loading error and can recover without reloading the app', async ({ page }) => {
  const control = await open(page, { abort: true });
  await expect(library(page).getByRole('alert')).toContainText(network);
  await expect(library(page).getByText(temporary, { exact: true })).toHaveCount(0);
  await expect(library(page).getByText(noMatch, { exact: true })).toHaveCount(0);
  control.reply = ready();
  await retry(page);
  await expect(cards(page)).toHaveCount(2);
  await expect(library(page).getByRole('alert')).toHaveCount(0);
  expect(control.calls).toBe(2);
});

test('a genuinely empty catalog explains current availability and offers a new fetch', async ({ page }) => {
  const control = await open(page, ready([]));
  await expect(library(page).getByText(empty, { exact: true })).toBeVisible();
  await expect(library(page).getByText(noMatch, { exact: true })).toHaveCount(0);
  await expect(library(page).getByRole('alert')).toHaveCount(0);
  await expect(cards(page)).toHaveCount(0);
  control.reply = ready();
  await retry(page);
  await expect(cards(page)).toHaveCount(2);
  await expect(library(page).getByText(empty, { exact: true })).toHaveCount(0);
  expect(control.calls).toBe(2);
});

test('unmatched search or level uses the filter message and clearing filters restores the loaded tracks', async ({ page }) => {
  const control = await open(page, ready());
  await expect(cards(page)).toHaveCount(2);
  const search = library(page).getByLabel('Buscar música', { exact: true });
  const level = library(page).getByRole('combobox', { name: 'Nível de inglês', exact: true });
  await search.fill('Nothing matches this title');
  await expect(library(page).getByText(noMatch, { exact: true })).toBeVisible();
  await expect(library(page).getByRole('alert')).toHaveCount(0);
  await expect(library(page).getByText(empty, { exact: true })).toHaveCount(0);
  await library(page).getByRole('button', { name: 'Limpar filtros', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(level).toHaveValue('all');
  await expect(cards(page)).toHaveCount(2);
  await level.selectOption('C2');
  await expect(library(page).getByText(noMatch, { exact: true })).toBeVisible();
  await library(page).getByRole('button', { name: 'Limpar filtros', exact: true }).click();
  await expect(level).toHaveValue('all');
  await expect(cards(page)).toHaveCount(2);
  expect(control.calls).toBe(1);
});

test('a failed refresh preserves cards and filters, and successful retry updates them and clears its warning', async ({ page }) => {
  const control = await open(page, ready());
  await expect(cards(page)).toHaveCount(2);
  const search = library(page).getByLabel('Buscar música', { exact: true });
  const level = library(page).getByRole('combobox', { name: 'Nível de inglês', exact: true });
  await search.fill('First');
  await level.selectOption('A1');
  const first = library(page).locator('[data-track-id="perfect-local"]');
  await expect(first).toBeVisible();
  const delayed = gate();
  control.reply = { ...blocked(), wait: delayed.promise };
  await page.evaluate(() => window.dispatchEvent(new Event('sparky:refresh')));
  await expect.poll(() => control.calls).toBe(2);
  await expect(first).toBeVisible();
  delayed.resolve();
  await expect(library(page).getByRole('alert')).toContainText(temporary);
  await expect(first).toBeVisible();
  await expect(cards(page)).toHaveCount(1);
  await expect(search).toHaveValue('First');
  await expect(level).toHaveValue('A1');
  await expect(library(page).getByText(noMatch, { exact: true })).toHaveCount(0);

  control.reply = ready([{ ...catalog[0], title: 'First Song Remastered' }, catalog[1]]);
  await retry(page);
  await expect(first).toContainText('First Song Remastered');
  await expect(library(page).getByRole('alert')).toHaveCount(0);
  await expect(search).toHaveValue('First');
  await expect(level).toHaveValue('A1');
  expect(control.calls).toBe(3);
});

test('partial availability keeps playable cards alongside a warning and retry restores the full catalog', async ({ page }) => {
  const control = await open(page, ready([catalog[0]], 1));
  await expect(library(page).getByText(partial, { exact: true })).toBeVisible();
  await expect(cards(page)).toHaveCount(1);
  await expect(library(page).locator('[data-track-id="perfect-local"]')).toBeVisible();
  await expect(library(page).getByText(noMatch, { exact: true })).toHaveCount(0);
  control.reply = ready();
  await retry(page);
  await expect(cards(page)).toHaveCount(2);
  await expect(library(page).getByText(partial, { exact: true })).toHaveCount(0);
  expect(control.calls).toBe(2);
});

test('English distinguishes unavailable storage, an empty catalog and partial availability', async ({ page }) => {
  for (const message of [temporary, empty, partial]) {
    expect(copy(message, 'en')).toBeTruthy();
    expect(copy(message, 'en')).not.toBe(message);
  }
  const control = await open(page, blocked(), 'en');
  await expect(library(page).getByRole('alert')).toContainText(copy(temporary, 'en'));
  await expect(library(page).getByText(temporary, { exact: true })).toHaveCount(0);
  control.reply = ready([]);
  await retry(page, 'en');
  await expect(library(page).getByText(copy(empty, 'en'), { exact: true })).toBeVisible();
  control.reply = ready([catalog[0]], 1);
  await retry(page, 'en');
  await expect(library(page).getByText(copy(partial, 'en'), { exact: true })).toBeVisible();
  await expect(cards(page)).toHaveCount(1);
});
