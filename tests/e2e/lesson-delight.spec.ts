import { test, expect, type Page } from '@playwright/test';
import { lessons } from '../../src/lib/curriculum';
import { contentVersion } from '../../src/lib/content/build';

const lesson = lessons.find(item => item.id === 'a1-1-1')!;

async function visit(page: Page, options: { checkpoint?: number; dueReview?: boolean; mascot?: 'sparky' | 'pinky'; complete?: (respond: (earned: number, independent: boolean) => Promise<void>) => Promise<void> } = {}) {
  const userId = options.checkpoint === undefined ? 'lesson-delight-start' : 'lesson-delight-resume';
  if (options.checkpoint !== undefined) await page.addInitScript(({ checkpoint, userId, contentVersion }) => {
    const state = { lessonId: 'a1-1-1', review: false, index: checkpoint, furthestIndex: checkpoint, answer: '', tokens: [], checked: false, correct: false, translation: false, assisted: false, contextVisible: false, receipt: 'existing-receipt', draft: '', updatedAt: new Date().toISOString(), contentVersion, revealed: false, listened: false };
    localStorage.setItem(`sparky-learning:${userId}`, JSON.stringify({ version: 1, checkpoints: { 'a1-1-1:lesson': state }, writings: [], attempts: [], vocabulary: [] }));
  }, { checkpoint: options.checkpoint, userId, contentVersion });
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: true, user: { id: userId, email: 'test@example.com', name: 'Ana' } } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', route => route.fulfill({ json: { preference: null, storage: 'account' } }));
  const base = { storage: 'account', coins: 0, completed: options.dueReview ? { [lesson.id]: new Date(Date.now() - 7 * 86_400_000).toISOString() } : {}, reviews: options.dueReview ? { [lesson.id]: new Date(Date.now() - 86_400_000).toISOString() } : {}, owned: [], mascot: options.mascot ?? 'sparky', equipped: { sparky: {}, pinky: {} }, streak: { count: 0, longest: 0, lastDay: null } };
  await page.route('**/api/rewards', async route => {
    if (route.request().method() === 'POST') {
      const action = JSON.parse(route.request().postData() ?? '{}').action;
      if (action === 'complete' && options.complete) {
        await options.complete(async (earned, independent) => {
          await route.fulfill({ json: { ...base, completed: { [lesson.id]: new Date().toISOString() }, reviews: { [lesson.id]: new Date(Date.now() + 86_400_000).toISOString() }, earned, independent, reason: earned ? 'lesson' : 'already-completed' } });
        });
        return;
      }
    }
    await route.fulfill({ json: base });
  });
  await page.goto('/');
  await page.addStyleTag({ content: 'nextjs-portal{display:none}' });
}

test('the start control opens immediately and the local sound choice persists', async ({ page }) => {
  await visit(page);
  const start = page.getByRole('button', { name: 'Começar lição', exact: true });
  await expect(start).toBeVisible();
  expect(await start.evaluate(node => Math.round(node.getBoundingClientRect().height))).toBeGreaterThanOrEqual(48);
  await start.click();
  await expect(page.locator('.lesson-dialog')).toBeVisible();
  await expect(page.locator('.lesson-progress-track > span')).toBeVisible();
  await expect(page.locator('progress[aria-label="Etapas da lição"]')).toHaveAttribute('value', '1');
  await page.getByRole('button', { name: 'Fechar lição' }).click();
  const openProfile = async () => {
    if (await page.getByRole('checkbox', { name: /Sons de interface/ }).isVisible()) return;
    if ((page.viewportSize()?.width ?? 1000) < 720) await page.getByRole('button', { name: 'Abrir perfil de Ana' }).click();
    else await page.getByRole('button', { name: 'Perfil', exact: true }).first().click();
  };
  await openProfile();
  const sounds = page.getByRole('checkbox', { name: /Sons de interface/ });
  await expect(sounds).toBeChecked();
  await sounds.uncheck();
  await page.reload();
  await openProfile();
  await expect(page.getByRole('checkbox', { name: /Sons de interface/ })).not.toBeChecked();
});

test('a due review opens from the review list', async ({ page }) => {
  await visit(page, { dueReview: true });
  await page.getByRole('button', { name: 'Abrir revisão' }).click();
  await page.getByRole('button', { name: /Praticar revisão de Apresentar-se/ }).click();
  await expect(page.locator('.lesson-dialog')).toBeVisible();
  await expect(page.locator('.lesson-dialog header')).toContainText('Revisão');
});

test('the full-screen celebration appears only after the server confirms the actual reward', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let requests = 0;
  await visit(page, { checkpoint: lesson.steps.length - 1, complete: async respond => { requests += 1; await gate; await respond(10, true); } });
  await page.getByRole('button', { name: 'Continuar de onde parei', exact: true }).click();
  await expect(page.locator('.lesson-body')).toHaveAttribute('data-step-kind', 'summary');
  await page.getByRole('button', { name: 'Concluir', exact: true }).dblclick({ delay: 40 });
  await expect(page.locator('.lesson-completion-moment')).toHaveCount(0);
  release();
  await expect(page.locator('.lesson-completion-moment')).toBeVisible();
  await expect(page.locator('.lesson-completion-moment')).toContainText('Você conseguiu sem ajuda.');
  await expect(page.locator('.lesson-completion-moment')).toContainText('+10 moedas');
  await expect(page.locator('.lesson-completion-mascot')).toHaveAttribute('data-mascot', 'sparky');
  await expect(page.locator('.lesson-completion-mascot img')).toHaveAttribute('src', /lesson-complete-sparky\.png/);
  await expect(page.locator('#lesson-completion-title')).toBeFocused();
  const bounds = await page.locator('.lesson-completion-moment').boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual((page.viewportSize()?.width ?? 0) - 1);
  expect(bounds?.height).toBeGreaterThanOrEqual((page.viewportSize()?.height ?? 0) - 1);
  if (test.info().project.name === 'iphone') {
    await page.setViewportSize({ width: 320, height: 568 });
    await expect(page.getByRole('button', { name: 'OK', exact: true })).toBeInViewport();
  }
  expect(requests).toBe(1);
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.lesson-completion-moment')).toHaveCount(0);
});

test('Pinky has original completion art and reduced motion stops the entrance animation', async ({ page }) => {
  await visit(page, { checkpoint: lesson.steps.length - 1, mascot: 'pinky', complete: async respond => respond(10, true) });
  await page.getByRole('button', { name: 'Continuar de onde parei', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir', exact: true }).click();
  const mascot = page.locator('.lesson-completion-mascot');
  await expect(mascot).toHaveAttribute('data-mascot', 'pinky');
  await expect(mascot.locator('img')).toHaveAttribute('src', /lesson-complete-pinky\.png/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(mascot.locator('video')).toHaveCount(0);
  expect(await mascot.locator('img').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
});

test('a confirmed repeat remains positive and shows no extra coins', async ({ page }) => {
  await visit(page, { checkpoint: lesson.steps.length - 1, complete: async respond => respond(0, false) });
  await page.getByRole('button', { name: 'Continuar de onde parei', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir', exact: true }).click();
  const card = page.locator('.lesson-completion-moment');
  await expect(card).toContainText('Você praticou, corrigiu e avançou.');
  await expect(card).not.toContainText('moedas');
});

test('an incorrect answer keeps its explanation, then a corrected answer gets one fresh highlight', async ({ page }) => {
  const choiceIndex = lesson.steps.findIndex(step => step.kind === 'choice');
  const choice = lesson.steps[choiceIndex];
  let correct = false;
  await visit(page, { checkpoint: choiceIndex });
  await page.route('**/api/study', route => route.fulfill({ json: { correct, receipt: 'verified-receipt', evaluationVersion: 1 } }));
  await page.getByRole('button', { name: 'Continuar de onde parei', exact: true }).click();
  const options = page.locator('.answer-options > button');
  await options.filter({ hasText: choice.options!.find(option => option !== choice.answer)! }).click();
  await page.getByRole('button', { name: 'Verificar', exact: true }).click();
  await expect(page.locator('.answer-feedback.retry')).toContainText('Vamos rever essa resposta.');
  await expect(page.locator('.answer-feedback.is-fresh')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  correct = true;
  await options.filter({ hasText: choice.answer! }).click();
  await page.getByRole('button', { name: 'Verificar', exact: true }).click();
  await expect(page.locator('.answer-feedback.correct.is-fresh')).toContainText('Resposta correta.');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar etapa', exact: true }).click();
  await expect(page.locator('.answer-feedback.correct')).toBeVisible();
  await expect(page.locator('.answer-feedback.is-fresh')).toHaveCount(0);
});

test('a failed completion keeps the lesson and never shows the celebration', async ({ page }) => {
  await visit(page, { checkpoint: lesson.steps.length - 1 });
  await page.route('**/api/rewards', async route => {
    if (route.request().method() === 'POST' && JSON.parse(route.request().postData() ?? '{}').action === 'complete')
      await route.fulfill({ status: 503, json: { error: 'progress-unavailable' } });
    else await route.fallback();
  });
  await page.getByRole('button', { name: 'Continuar de onde parei', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir', exact: true }).click();
  await expect(page.locator('.lesson-dialog')).toBeVisible();
  await expect(page.locator('.lesson-dialog')).toContainText('Não foi possível salvar a conclusão.');
  await expect(page.locator('.lesson-completion-moment')).toHaveCount(0);
});

test('the main action retains contrast and reduced-motion feedback in every palette', async ({ page }) => {
  await visit(page);
  const button = page.locator('.lesson-start-button');
  await expect(button).toBeVisible({ timeout: 15_000 });
  const results = await page.evaluate(() => {
    const root = document.documentElement;
    const button = document.querySelector('.lesson-start-button')!;
    const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(channel => {
      const linear = channel / 255;
      return linear <= .04045 ? linear / 12.92 : ((linear + .055) / 1.055) ** 2.4;
    });
    const luminance = (value: string) => rgb(value).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
    const contrasts: { palette: string; mode: string; ratio: number; color: string; background: string }[] = [];
    for (const palette of ['sparky', 'beatrice', 'ocean', 'sunset', 'graphite']) for (const mode of ['light', 'dark']) {
      root.dataset.palette = palette;
      root.dataset.theme = mode;
      const style = getComputedStyle(button);
      const light = luminance(style.color);
      const dark = luminance(style.backgroundColor);
      contrasts.push({ palette, mode, ratio: (Math.max(light, dark) + .05) / (Math.min(light, dark) + .05), color: style.color, background: style.backgroundColor });
    }
    return contrasts;
  });
  expect(results.filter(result => result.ratio < 4.5)).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(Number.parseFloat(await button.evaluate(node => getComputedStyle(node).transitionDuration))).toBeLessThanOrEqual(.001);
});
