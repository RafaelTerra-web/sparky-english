import { test, expect, type Page } from '@playwright/test';
import { lessons } from '../../src/lib/curriculum';
import { contentVersion } from '../../src/lib/content/build';
import { lessonFlowVersion } from '../../src/lib/lesson-flow';

async function account(page: Page, lessonId: string, review: boolean, language = 'pt-BR', completed?: Record<string, string>) {
  await page.addInitScript(({ lessonId, review, language, contentVersion, lessonFlowVersion }) => {
    const checkpoint = { lessonId, review, reviewFormat: 2, index: 0, furthestIndex: 0, flowVersion: lessonFlowVersion,
      answer: '', tokens: [], checked: false, correct: false, translation: false, assisted: false,
      contextVisible: false, receipt: '', draft: '', updatedAt: new Date().toISOString(), contentVersion,
      revealed: false, listened: false };
    localStorage.setItem('sparky-learning:compact-study', JSON.stringify({ version: 1,
      checkpoints: { [lessonId + (review ? ':review' : ':lesson')]: checkpoint }, writings: [], attempts: [], vocabulary: [] }));
    localStorage.setItem('sparky-language:compact-study', language);
    localStorage.setItem('sparky-interface-language', language);
  }, { lessonId, review, language, contentVersion, lessonFlowVersion });
  await page.route('**/api/session', r => r.fulfill({ json: { authenticated: true,
    user: { id: 'compact-study', name: 'Rafael', email: 'test@example.com' } } }));
  await page.route('**/api/onboarding', r => r.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', r => r.fulfill({ json: { storage: 'account', preference: { palette: 'sparky', mode: 'dark' } } }));
  await page.route('**/api/rewards', r => r.fulfill({ json: { storage: 'account', coins: 40,
    completed: completed ?? (review ? { [lessonId]: '2026-01-01' } : {}), reviews: review ? { [lessonId]: '2026-01-02' } : {},
    owned: [], mascot: 'sparky', equipped: { sparky: {}, pinky: {} } } }));
  await page.goto('/');
  await page.addStyleTag({ content: 'nextjs-portal{display:none}' });
}

for (const language of ['pt-BR', 'en']) test('home action fits the first viewport: ' + language, async ({ page }, info) => {
  const lesson = lessons.filter(l => l.level === 'B2').sort((a, b) => b.title.length - a.title.length)[0];
  await page.setViewportSize({ width: 320, height: 640 });
  await account(page, lesson.id, false, language);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('.today-overview h1')).toHaveText(language === 'en' ? "Today's study" : 'Seu estudo de hoje');
  const card = page.locator('.next-lesson');
  const action = card.getByRole('button');
  await expect(action).toBeVisible();
  await expect(card.locator('details')).not.toHaveAttribute('open');
  const remaining = lessons.filter(l => l.level === 'B2').length;
  await expect(card.getByRole('status')).toHaveText(language === 'en'
    ? `B2 · ${remaining} lessons left before C1` : `B2 · Faltam ${remaining} lições para C1`);
  expect(await card.evaluate(el => getComputedStyle(el, '::before').content)).toBe('none');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 640 });
    const bounds = await action.boundingBox();
    const nav = await page.locator('.mobile-nav').boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThan(nav!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: info.outputPath('compact-home.png') });
  await card.locator('summary').click();
  await expect(card.locator('details')).toHaveAttribute('open');
  await action.click();
  await expect(page.locator('.lesson-dialog')).toBeVisible();
});

for (const level of ['A1', 'C2']) for (const remaining of [0, 1]) {
  test(`level counter handles ${level} with ${remaining} lessons left`, async ({ page }) => {
    const inLevel = lessons.filter(l => l.level === level);
    // Completions in other levels must not reduce this level's count.
    const completed = Object.fromEntries(lessons.filter(l => l.level !== level || inLevel.indexOf(l) >= remaining)
      .map(l => [l.id, '2026-01-01']));
    await account(page, inLevel[0].id, false, 'pt-BR', completed);
    await expect(page.locator('.next-lesson').getByRole('status')).toHaveText(remaining === 0
      ? `Lições de ${level} concluídas`
      : level === 'C2' ? 'Falta 1 lição para concluir o C2' : 'A1 · Falta 1 lição para A2');
  });
}

test('review removes the instruction card while still recording assistance', async ({ page }) => {
  await account(page, 'a1-1-1', true);
  await page.locator('.next-lesson .cream-button').click();
  const lesson = page.locator('.lesson-dialog');
  await expect(lesson).toBeVisible();
  await expect(lesson.getByText('Leia o enunciado e tente responder.')).toHaveCount(0);
  await expect(lesson.locator('.review-retrieval-note')).toHaveCount(0);
  await lesson.locator('.lesson-notes summary').click();
  await expect(lesson.getByText(/Você consultou uma explicação/)).toBeVisible();
  await lesson.locator('.answer-options button').first().click();
  const request = page.waitForRequest('**/api/study');
  await page.route('**/api/study', r => r.fulfill({ json: { correct: false, receipt: 'test-receipt', evaluationVersion: 1 } }));
  await lesson.getByRole('button', { name: 'Verificar', exact: true }).click();
  expect((await request).postDataJSON().assisted).toBe(true);
});
