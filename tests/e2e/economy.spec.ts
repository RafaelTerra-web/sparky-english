import { test, expect } from "@playwright/test";
import english from "../../public/locales/en.json" with { type: "json" };
import { expeditionOffers } from "../../src/lib/expeditions-catalog";
import { getExpeditionEpisode } from "../../src/lib/expeditions-content";

const lesson = getExpeditionEpisode("expedition-suitcase-ep1-v1", "A1-A2")!;
const offer = expeditionOffers[0];
type Locale = "pt" | "en";
const localized = (value: { pt: string; en: string }, locale: Locale) => value[locale];
const label = (value: string, locale: Locale) => locale === "en"
  ? (english as Record<string, string>)[value] ?? value : value;
async function expectFitsViewport(page: import("@playwright/test").Page) {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    dialogHeight: document.querySelector("dialog.economy-dialog")?.getBoundingClientRect().height ?? 0,
  }));
  expect(size.scrollWidth).toBeLessThanOrEqual(size.viewportWidth);
  expect(size.dialogHeight).toBeLessThanOrEqual(size.viewportHeight);
}

for (const locale of ["pt", "en"] as const) {
test(`Economy ${locale}: preview, purchase, resume, order, replay and recall`, async ({ page, isMobile }) => {
  let coins = 455;
  let goalId: string | null = null;
  let owned = false;
  let decisionId: string | null = null;
  let applicationCorrect = false;
  let transferCorrect = false;
  let completedAt: string | null = null;
  let satisfaction: "yes" | "no" | null = null;
  let due = false;
  let reviewConfirmedAt: string | null = null;
  const actions: Record<string, unknown>[] = [];
  const sessionId = "3197e295-b8ee-40bf-ace1-f9cae2188f66";
  const progress = () => ({ episodeId: lesson.id, family: lesson.family, title: lesson.title,
    descriptor: completedAt ? lesson.canDo.descriptor : null, decisionId, applicationCorrect,
    transferCorrect, completedAt, reviewDueAt: completedAt ? "2026-09-28T00:00:00.000Z" : null,
    reviewConfirmedAt, competence: reviewConfirmedAt ? "confirmed" : completedAt ? "demonstrated" : "practicing", satisfaction });
  const snapshot = () => ({ enabled: true, storage: "account", coins, goalId, owned: owned ? [offer.id] : [],
    offers: expeditionOffers, receipts: [], progress: decisionId ? [progress()] : [],
    dueReviews: due && !reviewConfirmedAt ? [{ episodeId: lesson.id, family: lesson.family, title: lesson.title }] : [] });
  const withoutAnswer = (question: typeof lesson.application | typeof lesson.transfer | typeof lesson.recall) => {
    if (question.kind === "choice") {
      const { answerId: _, ...visible } = question; void _; return visible;
    }
    const { answerTokenIds: _, ...visible } = question; void _; return visible;
  };
  await page.route("**/api/session", route => route.fulfill({ json: {
    authenticated: true, user: { id: "economy-fixture", name: "Rafael", email: "preview@example.test" },
  } }));
  await page.route("**/api/rewards", route => route.fulfill({ json: {
    coins, completed: {}, reviews: {}, owned: [], mascot: "sparky", equipped: { sparky: {}, pinky: {} },
    streak: { count: 5, longest: 5, lastDay: null }, storage: "account",
  } }));
  await page.route("**/api/onboarding", route => route.fulfill({ json: { enabled: false, profile: null, draft: null } }));
  await page.route("**/api/expeditions", async route => {
    if (route.request().method() === "GET") { await route.fulfill({ json: snapshot() }); return; }
    const body = route.request().postDataJSON() as Record<string, unknown>;
    actions.push(body);
    let result: Record<string, unknown> = {};
    if (body.action === "goal") goalId = body.itemId as string | null;
    if (body.action === "buy") { owned = true; coins -= offer.price; goalId = null; result = { spent: offer.price }; }
    if (body.action === "start") {
      const { recall: _, reveal: __, consequence: ___, application, transfer, decision, ...base } = lesson;
      void _; void __; void ___;
      result = { sessionId, episode: { ...base,
        decision: { id: decision.id, prompt: decision.prompt, options: decision.options.map(option => ({ id: option.id, text: option.text })) },
        application: withoutAnswer(application), transfer: withoutAnswer(transfer) },
        decisionConsequence: lesson.decision.options.find(option => option.id === decisionId)?.consequence ?? null,
        progress: progress() };
    }
    if (body.action === "decision") {
      decisionId = body.optionId as string;
      result = { consequence: lesson.decision.options.find(option => option.id === decisionId)?.consequence, progress: progress() };
    }
    if (body.action === "answer") {
      const question = body.questionId === lesson.application.id ? lesson.application : lesson.transfer;
      const correct = question.kind === "choice" ? body.answer === question.answerId
        : JSON.stringify(body.answer) === JSON.stringify(question.answerTokenIds);
      if (correct && question.kind === "choice") applicationCorrect = true;
      if (correct && question.kind === "order") transferCorrect = true;
      result = { correct, feedback: correct ? question.feedback.correct : question.feedback.incorrect,
        expected: correct ? null : question.kind === "choice" ? question.answerId : question.answerTokenIds, progress: progress() };
    }
    if (body.action === "finish") {
      completedAt = "2026-09-28T12:00:00.000Z";
      result = { reveal: lesson.reveal, consequence: lesson.consequence,
        routePayoff: lesson.decision.options.find(option => option.id === decisionId)?.consequence, progress: progress() };
    }
    if (body.action === "rate") { satisfaction = body.value as "yes" | "no"; result = { rated: satisfaction, progress: progress() }; }
    if (body.action === "review-start") result = { question: withoutAnswer(lesson.recall), progress: progress() };
    if (body.action === "review") {
      const correct = body.answer === lesson.recall.answerId;
      if (correct) reviewConfirmedAt = "2026-10-01T12:00:00.000Z";
      result = { correct, confirmed: correct, feedback: correct ? lesson.recall.feedback.correct : lesson.recall.feedback.incorrect,
        expected: correct ? null : lesson.recall.answerId, progress: progress() };
    }
    await route.fulfill({ json: { ...snapshot(), ...result } });
  });
  await page.addInitScript(language => {
    const setting = language === "en" ? "en" : "pt-BR";
    localStorage.setItem("sparky-opening-seen-v4", "1");
    localStorage.setItem("sparky-language:economy-fixture", setting);
    localStorage.setItem("sparky-interface-language", setting);
    localStorage.setItem("sparky-support-language:economy-fixture", setting);
    localStorage.setItem("sparky-support-language", setting);
    localStorage.setItem("sparky-progress:economy-fixture", JSON.stringify({ level: "A1", completed: {}, reviews: {} }));
  }, locale);

  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", locale === "en" ? "en" : "pt-BR");
  await page.locator(".wallet-chip").click();
  const shelf = page.locator(".economy-shelf");
  await expect(shelf.getByText(label("Moedas abrem descobertas", locale))).toBeVisible();
  const card = shelf.locator(`[data-world="${offer.id}"]`);
  await card.getByRole("button", { name: label("Prévia grátis", locale) }).click();
  const dialog = page.locator("dialog.economy-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(localized(offer.preview.scene, locale))).toBeVisible();
  for (const [index, option] of offer.preview.options.entries()) {
    const choice = dialog.locator(".economy-options button").nth(index);
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByText(localized(option.consequence, locale))).toBeVisible();
  }
  await expectFitsViewport(page);
  await dialog.getByRole("button", { name: label("Escolher objetivo", locale) }).click();
  await expect(shelf.locator(".economy-goal")).toContainText(localized(offer.title, locale));
  await card.locator(".economy-offer-actions .primary-button").click();
  await expect(dialog.getByText(label("Preço confirmado:", locale), { exact: false })).toBeVisible();
  await dialog.getByRole("button", { name: label("Abrir por", locale), exact: false }).click();
  await expect(dialog.getByRole("heading", { name: localized(lesson.title, locale) })).toBeVisible();
  await expect(card).toContainText(label("Na biblioteca", locale));
  await expect(shelf.locator(".economy-balance")).toContainText(String(455 - offer.price));
  expect(actions.filter(action => action.action === "buy")).toEqual([
    { action: "buy", itemId: offer.id, offerVersion: offer.offerVersion },
  ]);
  await dialog.locator(".economy-options button").first().click();
  await expect(dialog.getByText(localized(lesson.decision.options[0].consequence, locale))).toBeVisible();
  await dialog.getByRole("button", { name: label("Descobrir como agir", locale) }).click();
  await expect(dialog.getByText(lesson.newLearning.label)).toBeVisible();
  await dialog.getByRole("button", { name: label("Usar em inglês", locale) }).click();
  const wrong = lesson.application.options.find(option => option.id !== lesson.application.answerId)!;
  const right = lesson.application.options.find(option => option.id === lesson.application.answerId)!;
  await dialog.getByRole("button", { name: wrong.text }).click();
  await dialog.getByRole("button", { name: label("Conferir", locale) }).click();
  await expect(dialog.getByText(label("Resposta:", locale), { exact: false })).toBeVisible();
  await dialog.getByRole("button", { name: right.text }).click();
  await dialog.getByRole("button", { name: label("Conferir", locale) }).click();
  await dialog.getByRole("button", { name: label("Continuar", locale) }).click();
  await expect(dialog.getByRole("heading", { name: label("Agora em outra situação", locale) })).toBeVisible();

  // A correct application is saved: reopening after a reload resumes at transfer.
  await dialog.getByRole("button", { name: label("Fechar expedição", locale) }).click();
  await page.reload();
  await page.locator(".wallet-chip").click();
  await card.getByRole("button", { name: label("Entrar", locale) }).click();
  await expect(dialog.getByRole("heading", { name: label("Agora em outra situação", locale) })).toBeVisible();
  const remaining = [...lesson.transfer.tokens];
  const selected = dialog.locator(".economy-order-selected button");
  const pool = dialog.locator(".economy-order-pool button");
  for (const [position, id] of lesson.transfer.answerTokenIds.entries()) {
    const index = remaining.findIndex(token => token.id === id);
    expect(index).toBeGreaterThanOrEqual(0);
    const token = remaining.splice(index, 1)[0];
    const choice = pool.nth(index);
    if (position === 0) {
      await choice.focus();
      await page.keyboard.press("Enter");
    } else if (isMobile) {
      await choice.tap();
    } else {
      await choice.click();
    }
    await expect(selected).toHaveCount(position + 1);
    await expect(selected.nth(position)).toHaveText(token.text);
  }
  await expectFitsViewport(page);
  await dialog.getByRole("button", { name: label("Conferir", locale) }).click();
  await dialog.getByRole("button", { name: label("Ver descoberta", locale) }).click();
  await expect(dialog.getByText(localized(lesson.decision.options[0].consequence, locale))).toBeVisible();
  await expect(dialog.getByText(localized(lesson.reveal, locale))).toBeVisible();
  await expect(dialog.getByText(localized(lesson.consequence, locale))).toBeVisible();
  await expect(dialog.getByText(localized(lesson.canDo.descriptor, locale))).toBeVisible();
  await expect(dialog.getByText(label("Habilidade demonstrada", locale), { exact: false })).toBeVisible();
  await expectFitsViewport(page);
  expect(actions.filter(action => action.action === "answer" && action.questionId === lesson.transfer.id).at(-1)?.answer)
    .toEqual(lesson.transfer.answerTokenIds);
  await dialog.getByRole("button", { name: label("Sim", locale) }).click();
  await expect(dialog.getByText(label("Obrigado por contar. Sua resposta ajuda a melhorar as próximas histórias.", locale))).toBeVisible();

  await dialog.getByRole("button", { name: label("Fechar expedição", locale) }).click();
  await card.locator("summary").click();
  await expect(card.getByText(localized(lesson.canDo.descriptor, locale))).toBeVisible();
  const episodes = card.locator(".economy-episode-entry");
  await expect(episodes.first().getByRole("button", { name: label("Rever", locale) })).toBeEnabled();
  await expect(episodes.nth(1).getByRole("button", { name: label("Começar", locale) })).toBeEnabled();
  await episodes.first().getByRole("button", { name: label("Rever", locale) }).click();
  await expect(dialog.getByRole("heading", { name: localized(lesson.title, locale) })).toBeVisible();
  await dialog.getByRole("button", { name: localized(lesson.decision.options[1].text, locale) }).click();
  await expect(dialog.getByText(localized(lesson.decision.options[1].consequence, locale))).toBeVisible();
  await dialog.getByRole("button", { name: label("Fechar expedição", locale) }).click();
  expect(actions.filter(action => action.action === "buy")).toHaveLength(1);

  due = true;
  await page.reload();
  await page.locator(".wallet-chip").click();
  await shelf.locator(".economy-review-list").getByRole("button", { name: localized(lesson.title, locale) }).click();
  await expect(dialog.getByText(localized(lesson.recall.context, locale))).toBeVisible();
  const recallRight = lesson.recall.options.find(option => option.id === lesson.recall.answerId)!;
  await dialog.getByRole("button", { name: recallRight.text }).click();
  await dialog.getByRole("button", { name: label("Conferir", locale) }).click();
  await expect(dialog.getByText(localized(lesson.recall.feedback.correct, locale))).toBeVisible();
  await dialog.getByRole("button", { name: label("Concluir", locale) }).click();
  await expect(shelf.locator(".economy-review-list")).toHaveCount(0);
  expect(actions.filter(action => action.action === "buy")).toHaveLength(1);
  expect(coins).toBe(455 - offer.price);
});
}
