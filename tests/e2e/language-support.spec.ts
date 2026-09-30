import { test, expect, type Page } from '@playwright/test';
import { lessons, type Lesson } from '../../src/lib/curriculum';
import { exerciseId } from '../../src/lib/study';
import dictionary from '../../public/locales/en.json' with { type: 'json' };

const userId = 'locale-test';
const dialog = (page: Page) => page.locator('dialog[aria-labelledby="quick-title"]');
async function account(page: Page, interfaceLocale: string, supportLocale: string, onboarding = false) {
  await page.addInitScript(({ userId, interfaceLocale, supportLocale }) => {
    if (localStorage.getItem('locale-fixture')) return;
    localStorage.setItem('locale-fixture', '1');
    localStorage.setItem('sparky-opening-seen-v4', '1');
    localStorage.setItem('sparky-language:' + userId, interfaceLocale);
    localStorage.setItem('sparky-interface-language', interfaceLocale);
    localStorage.setItem('sparky-support-language:' + userId, supportLocale);
    localStorage.setItem('sparky-support-language', supportLocale);
  }, { userId, interfaceLocale, supportLocale });
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: true, user: { id: userId, name: 'Ana', email: 'test@example.com' } } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: onboarding
    ? { enabled: true, profile: null, draft: { step: 'name' }, revision: 1, placement: null }
    : { enabled: false } }));
  await page.route('**/api/appearance', route => route.fulfill({ json: { storage: 'account', preference: { palette: 'sparky', mode: 'light' } } }));
  await page.route('**/api/rewards', route => route.fulfill({ json: { storage: 'account', coins: 40, completed: {}, reviews: {}, owned: [], mascot: 'sparky', equipped: { sparky: {}, pinky: {} } } }));
  await page.route('**/locales/en.json**', route => route.fulfill({ json: { ...dictionary,
    'What is your name?': 'BROKEN TARGET', 'Ana': 'BROKEN NAME',
    'Read the notice.': 'BROKEN EXAM', 'The club meets on Friday.': 'BROKEN PASSAGE', 'Friday': 'BROKEN OPTION',
  } }));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', interfaceLocale);
  await expect(page.locator('html')).toHaveAttribute('data-support-language', supportLocale);
}
async function openLesson(page: Page, lesson: Lesson) {
  let answered = 0;
  await page.route('**/api/study', route => {
    const body = route.request().postDataJSON();
    if (body.action === 'start') return route.fulfill({ json: {
      exerciseIds: lesson.exercises!.map(step => exerciseId(lesson, step)), receipt: 'locale-receipt',
      sessionId: 'locale-session', startedAt: Date.now(),
    } });
    if (body.action === 'activity') return route.fulfill({ json: {} });
    answered++;
    return route.fulfill({ json: { receipt: 'locale-receipt', correct: true,
      evidence: { passed: (1 << answered) - 1, failed: 0, assisted: body.assisted ? 1 : 0 } } });
  });
  await page.locator('.quick-home-links button').first().click();
  await page.getByRole('button', { name: /Treinar por disciplina|Practice by subject|Practice by discipline|Train by subject/ }).click();
  await page.locator('.quick-filter-details summary').click();
  await page.getByLabel(/Nível|Level/, { exact: true }).selectOption('all');
  await page.getByRole('textbox', { name: /Buscar assunto ou expressão|Search for a topic or expression/ }).fill(lesson.title);
  const title = (dictionary as Record<string, string>)[lesson.title];
  await page.locator('.guided-lesson').filter({ hasText: lesson.title }).or(page.locator('.guided-lesson').filter({ hasText: title })).first().click();
  await dialog(page).getByRole('button', { name: /^(Começar|Start)$/ }).click();
  await expect(dialog(page).getByText('1/6', { exact: true })).toBeVisible();
}
async function answerAndContinue(page: Page, lesson: Lesson, index: number) {
  const area = dialog(page), step = lesson.exercises![index];
  if (step.kind === 'choice') {
    const escaped = step.answer!.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
    await area.getByRole('button', { name: new RegExp('^[A-C] ' + escaped + '$') }).click();
  } else {
    const bank = area.getByRole('group', { name: /Banco de palavras|Word bank/ });
    for (const word of step.answer!.split(' ')) {
      for (const candidate of await bank.getByRole('button', { name: word, exact: true }).all()) {
        if (await candidate.isEnabled()) { await candidate.click(); break; }
      }
    }
  }
  await area.getByRole('button', { name: /^(Verificar|Check)$/ }).click();
  await expect(area.locator('[data-answer-feedback]')).toContainText(/Boa!|Nice!/);
  await area.getByRole('button', { name: /^(Continuar|Continue)$/ }).click();
}

for (const mode of [
  { name: 'guided', ui: 'pt-BR', support: 'pt-BR' },
  { name: 'bridge', ui: 'en', support: 'pt-BR' },
  { name: 'immersion', ui: 'en', support: 'en' },
]) test(mode.name + ' separates UI, guidance, target English and optional Portuguese help', async ({ page }, info) => {
  await account(page, mode.ui, mode.support);
  const lesson = lessons.find(lesson => lesson.id === 'a1-identidade-01')!;
  await openLesson(page, lesson);
  const area = dialog(page), step = lesson.exercises![0];
  await expect(area.getByRole('heading')).toHaveText(mode.support === 'en' ? step.bodyEnglish! : step.body);
  await expect(area.getByRole('heading')).toHaveAttribute('lang', mode.support);
  await area.getByText(mode.ui === 'en' ? 'Learn more' : 'Entender melhor', { exact: true }).click();
  const support = area.locator('[data-lesson-support]');
  const rule = lesson.support!.find(step => step.kind === 'teach')!.body;
  await expect(support.locator('section > p').first()).toHaveText(mode.support === 'en' ? (dictionary as Record<string, string>)[rule] : rule);
  await expect(support.locator('section > p').first()).toHaveAttribute('lang', mode.support);
  await support.getByText(mode.ui === 'en' ? 'Listen and practice pronunciation' : 'Ouvir e praticar a pronúncia', { exact: true }).click();
  await expect(support.locator('p[lang="en"]').filter({ hasText: /^What is your name\?$/ }).first()).toBeVisible();
  const translation = support.locator('[data-language-role="translation"]').first();
  await expect(translation).not.toBeVisible();
  await support.getByText(mode.ui === 'en' ? 'Show Portuguese translation' : 'Ver tradução em português', { exact: true }).first().click();
  await expect(translation).toHaveText('Qual é o seu nome?');
  await expect(translation).toHaveAttribute('lang', 'pt-BR');
  await support.getByText(mode.ui === 'en' ? 'Practice in your own words' : 'Praticar com suas palavras', { exact: true }).click();
  await expect(support).not.toContainText(/BROKEN TARGET|BROKEN NAME/);
  if (mode.support === 'en') {
    await expect(support.getByText('Show Portuguese meanings', { exact: true })).toBeVisible();
    await expect(support.getByText('sobrenome', { exact: true })).not.toBeVisible();
  } else await expect(support.getByText('sobrenome', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath(mode.name + '-lesson-languages.png') });
});

test('immersion keeps order cues in Portuguese and gap context in English without leaking answers', async ({ page }) => {
  await account(page, 'en', 'en');
  const lesson = lessons.find(lesson => lesson.id === 'a1-identidade-01')!;
  await openLesson(page, lesson);
  await answerAndContinue(page, lesson, 0);
  await expect(dialog(page).getByRole('heading')).toHaveText('Build the sentence in English.');
  await expect(dialog(page).locator('[data-language-role="stimulus"]')).toHaveText(lesson.exercises![1].cue!);
  await expect(dialog(page).locator('[data-language-role="stimulus"]')).toHaveAttribute('lang', 'pt-BR');
  await expect(dialog(page).getByRole('group', { name: (dictionary as Record<string, string>)['Frase montada'] })).not.toContainText(lesson.exercises![1].answer!);
  await answerAndContinue(page, lesson, 1);
  await expect(dialog(page).locator('[data-language-role="context-hint"]')).toHaveText('the name of the person you are asking');
  await expect(dialog(page).locator('[data-language-role="context-hint"]')).toHaveAttribute('lang', 'en');
  await expect(dialog(page)).not.toContainText('(seu nome)');
  await expect(dialog(page).getByText('What is ___ name?', { exact: true })).toHaveAttribute('lang', 'en');
});

test('English menus with Portuguese support retain Portuguese onboarding guidance', async ({ page }) => {
  await account(page, 'en', 'pt-BR', true);
  await expect(page.getByRole('heading', { name: 'Your profile', exact: true })).toBeVisible();
  await expect(page.getByText('Usamos nome e idade para adaptar seu estudo.', { exact: true })).toHaveAttribute('lang', 'pt-BR');
  await page.getByLabel('Age', { exact: true }).fill('12');
  await expect(page.getByText('Sou responsável e autorizo esta personalização.', { exact: true })).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
});

test('language modes persist through reload without changing study data', async ({ page }) => {
  await account(page, 'en', 'pt-BR');
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  const select = page.locator('#learning-language-mode');
  await expect(select).toHaveValue('bridge');
  const study = await page.evaluate(userId => localStorage.getItem('sparky-learning:' + userId), userId);
  await select.selectOption('immersion');
  await expect(page.locator('html')).toHaveAttribute('data-support-language', 'en');
  await expect(page.locator('.language-preference-note')).toContainText('Examples and exercises stay in English');
  await page.reload();
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await expect(select).toHaveValue('immersion');
  await select.selectOption('guided');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('.language-preference-note')).toContainText('As frases e os exercícios continuam em inglês');
  expect(await page.evaluate(userId => localStorage.getItem('sparky-learning:' + userId), userId)).toBe(study);
});

test('ELTiS keeps bridge guidance in Portuguese and all English items immutable', async ({ page }) => {
  await account(page, 'en', 'pt-BR');
  await page.route('**/api/mock-tests/eltis', route => route.fulfill({ json: { token: 'locale-exam', index: 0, total: 24,
    question: { id: 'reading-test', section: 'Reading', skill: 'reading', passage: 'The club meets on Friday.', prompt: 'Read the notice.', options: ['Friday', 'Monday', 'Tuesday', 'Sunday'] } } }));
  await page.locator('.quick-home-links button').last().click();
  await page.locator('.quick-practice-card').filter({ hasText: 'ELTiS' }).click();
  await expect(page.locator('.mock-guidance')).toContainText('Use fones de ouvido.');
  await page.getByRole('button', { name: (dictionary as Record<string, string>)['Começar simulado'], exact: true }).click();
  await expect(page.locator('.mock-passage')).toHaveText('The club meets on Friday.');
  await expect(page.locator('#mock-question-heading')).toHaveText('Read the notice.');
  await expect(page.getByRole('radio', { name: /Friday/ })).toBeVisible();
  await expect(page.getByText(/BROKEN EXAM|BROKEN PASSAGE|BROKEN OPTION/)).toHaveCount(0);
});

for (const mode of [{ ui: 'pt-BR', support: 'pt-BR' }, { ui: 'en', support: 'pt-BR' }, { ui: 'en', support: 'en' }]) {
  test('narrated class keeps target English with ' + mode.ui + '/' + mode.support + ' controls and support', async ({ page }) => {
    await account(page, mode.ui, mode.support);
    await page.locator('.quick-home-links button').last().click();
    await page.getByRole('button', { name: /Aulas em inglês|English classes/ }).click();
    await expect(page.locator('.english-classroom h1')).toHaveText(mode.ui === 'en' ? 'Your English classroom' : 'Sua sala de inglês');
    await expect(page.locator('.english-classroom fieldset')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('radio', { name: "What's your name?", exact: true })).toBeVisible();
    await expect(page.locator('.review-guidance > p').first()).toHaveText(mode.support === 'en' ? 'Say a greeting, your name, and one question.' : 'Diga um cumprimento, seu nome e uma pergunta.');
    await expect(page.locator('.review-guidance > p').first()).toHaveAttribute('lang', mode.support);
  });
}
