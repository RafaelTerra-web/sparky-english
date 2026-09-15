import { test, expect, type Page } from '@playwright/test';
import { lessons } from '../../src/lib/curriculum';
import { contentVersion } from '../../src/lib/content/build';
import { lessonSteps, lessonFlowVersion } from '../../src/lib/lesson-flow';

async function account(page: Page, kind = 'example', support = 'pt-BR') {
  const lesson = lessons[0], steps = lessonSteps(lesson, false);
  const index = steps.findIndex(step => step.kind === kind);
  await page.addInitScript(({ lessonId, index, contentVersion, lessonFlowVersion, support }) => {
    if (localStorage.getItem('locale-fixture')) return;
    localStorage.setItem('locale-fixture', '1');
    localStorage.setItem('sparky-language:locale-test', 'en');
    localStorage.setItem('sparky-interface-language', 'en');
    localStorage.setItem('sparky-support-language:locale-test', support);
    localStorage.setItem('sparky-learning:locale-test', JSON.stringify({ version: 1, writings: [], attempts: [], vocabulary: [],
      checkpoints: { [lessonId + ':lesson']: { lessonId, review: false, index, furthestIndex: index, flowVersion: lessonFlowVersion,
        answer: '', tokens: [], checked: false, correct: false, translation: false, assisted: false, contextVisible: false,
        revealed: false, listened: false, receipt: '', draft: '', updatedAt: new Date().toISOString(), contentVersion } } }));
  }, { lessonId: lesson.id, index, contentVersion, lessonFlowVersion, support });
  await page.route('**/api/session', r => r.fulfill({ json: { authenticated: true, user: { id: 'locale-test', name: 'Ana', email: 'test@example.com' } } }));
  await page.route('**/api/onboarding', r => r.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', r => r.fulfill({ json: { storage: 'account', preference: { palette: 'beatrice', mode: 'dark' } } }));
  await page.route('**/api/rewards', r => r.fulfill({ json: { storage: 'account', coins: 40, completed: {}, reviews: {}, owned: [], mascot: 'sparky', equipped: { sparky: {}, pinky: {} } } }));
  // A hostile dictionary entry proves that English content does not enter localization.
  await page.route('**/locales/en.json', async route => {
    const response = await route.fetch(); const dict = await response.json();
    await route.fulfill({ json: { ...dict, 'What is your name?': 'BROKEN TARGET', 'Read the notice.': 'BROKEN EXAM', 'The club meets on Friday.': 'BROKEN PASSAGE', 'Friday': 'BROKEN OPTION' } });
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.addStyleTag({ content: 'nextjs-portal{display:none}' });
  return { lesson, step: steps[index] };
}

test('English interface preserves Portuguese explanations, translation and resumption', async ({ page }, info) => {
  const { step } = await account(page);
  await page.locator('.next-lesson .cream-button').click();
  const dialog = page.locator('.lesson-dialog');
  await expect(dialog.locator('.step-explanation')).toHaveText(step.body);
  await dialog.getByRole('button', { name: 'Reveal phrase', exact: true }).click();
  await expect(dialog.locator('.english-example')).toHaveText(step.english!);
  await dialog.getByRole('button', { name: 'Show Portuguese translation', exact: true }).click();
  await expect(dialog.locator('[data-language-role="translation"]')).toHaveText(step.translation!);
  await expect(dialog.locator('[data-language-role="translation"]')).toHaveAttribute('lang', 'pt-BR');
  await page.reload();
  await page.locator('.next-lesson .cream-button').click();
  await expect(dialog.locator('[data-language-role="translation"]')).toHaveText(step.translation!);
  await expect(page.locator(".motion-transition")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('english-with-portuguese-help.png') });
});

test('language modes persist without changing study progress and fit mobile', async ({ page }, info) => {
  await account(page, 'hook');
  await page.getByRole('button', { name: 'Open profile of Ana' }).click();
  const select = page.locator('#learning-language-mode');
  await expect(select).toHaveValue('bridge');
  const progress = await page.evaluate(() => localStorage.getItem('sparky-learning:locale-test'));
  await select.selectOption('immersion');
  await expect(page.locator('html')).toHaveAttribute('data-support-language', 'en');
  await expect(page.locator('.language-preference-note')).toContainText('Examples and exercises stay in English');
  await page.reload();
  await page.getByRole('button', { name: 'Open profile of Ana' }).click();
  await expect(select).toHaveValue('immersion');
  await select.selectOption('guided');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('.language-preference-note')).toContainText('As frases e os exercícios continuam em inglês');
  expect(await page.evaluate(() => localStorage.getItem('sparky-learning:locale-test'))).toBe(progress);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator(".motion-transition")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('language-preferences.png') });
});

test('immersion never turns the word-order cue into the complete English answer', async ({ page }) => {
  const { step } = await account(page, 'order_words', 'en');
  await page.locator('.next-lesson .cream-button').click();
  await expect(page.locator('.step-explanation')).toHaveText(step.body);
  await expect(page.locator('.step-explanation')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('.word-bank')).not.toContainText('BROKEN TARGET');
});

test('ELTiS keeps rules in Portuguese and English stimuli unchanged', async ({ page }) => {
  await account(page);
  await page.route('**/api/mock-tests/eltis', r => r.fulfill({ json: { token: 'test', index: 0, total: 24,
    question: { id: 'reading-test', section: 'Reading', skill: 'reading', passage: 'The club meets on Friday.', prompt: 'Read the notice.', options: ['Friday', 'Monday', 'Tuesday', 'Sunday'] } } }));
  await page.getByRole('button', { name: 'Open profile of Ana' }).click();
  await page.getByRole('button', { name: 'Course', exact: true }).filter({ visible: true }).click();
  await page.locator('.page-heading').getByRole('button', { name: 'Practice tests', exact: true }).click();
  await expect(page.locator('.mock-guidance')).toContainText('Use fones de ouvido.');
  await page.getByRole('button', { name: 'Start simulation' }).click();
  await expect(page.locator('.mock-passage')).toHaveText('The club meets on Friday.');
  await expect(page.locator('#mock-question-heading')).toHaveText('Read the notice.');
  await expect(page.getByRole('radio', { name: /Friday/ })).toBeVisible();
  await expect(page.getByText(/BROKEN EXAM|BROKEN PASSAGE|BROKEN OPTION/)).toHaveCount(0);
});
