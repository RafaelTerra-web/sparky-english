import { expect, test } from "@playwright/test";
import { missingPostcardScenes } from "../../src/lib/story-content";

test("postcard story plays its trailer and completes all four scenes on Android", async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.route("**/api/session", route => route.fulfill({ json: { authenticated: true, user: { id: "story-flow", email: "story@example.com", name: "Ana" } } }));
  await page.route("**/api/rewards", route => route.fulfill({ json: { storage: "account", coins: 0, completed: {}, reviews: {}, owned: [], mascot: "pinky", equipped: { sparky: {}, pinky: {} } } }));
  await page.route("**/api/onboarding", route => route.fulfill({ json: { enabled: false } }));
  await page.route("**/api/appearance", route => route.fulfill({ json: { preference: { palette: "beatrice", mode: "dark" }, storage: "account" } }));
  await page.goto("/");
  await page.addStyleTag({ content: "nextjs-portal{display:none}" });
  await page.getByRole("button", { name: "Abrir história" }).click();
  const trailer = page.getByLabel("Trailer silencioso da história O cartão-postal perdido");
  await expect(trailer).toBeVisible();
  await trailer.evaluate((node: HTMLVideoElement) => node.load());
  await expect.poll(() => trailer.evaluate((node: HTMLVideoElement) => node.readyState)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Começar história" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("story-trailer-android.png"), fullPage: true });
  await page.getByRole("button", { name: "Começar história" }).click();

  for (const [index, scene] of missingPostcardScenes.entries()) {
    await expect(page.getByRole("heading", { name: scene.title })).toBeVisible();
    await expect(page.getByRole("group", { name: scene.question })).toBeVisible();
    const options = page.getByRole("group", { name: scene.question }).getByRole("button");
    await expect(options).toHaveCount(4);
    if (index === 0) {
      const wrong = (scene.answer + 1) % 4;
      await options.nth(wrong).click();
      await page.getByRole("button", { name: "Conferir resposta" }).click();
      await expect(page.getByRole("status")).toContainText("Ainda não");
    }
    await options.nth(scene.answer).click();
    await page.getByRole("button", { name: "Conferir resposta" }).click();
    await expect(page.getByRole("status")).toContainText(scene.feedbackPt);
    await page.getByRole("button", { name: index === 3 ? "Terminar história" : "Próxima cena" }).click();
  }

  await expect(page.getByRole("heading", { name: "A carta voltou para casa" })).toBeVisible();
  await expect(page.getByText("Excuse me, where is the blue door?")).toBeVisible();
  expect(await page.locator("body").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("story-complete-android.png"), fullPage: true });
  const back = page.getByRole("button", { name: "Voltar para Hoje" }).last();
  await back.scrollIntoViewIfNeeded();
  const backBottom = await back.evaluate(element => element.getBoundingClientRect().bottom);
  const navTop = await page.locator(".mobile-nav").evaluate(element => element.getBoundingClientRect().top);
  expect(backBottom).toBeLessThan(navTop);
  await page.screenshot({ path: info.outputPath("story-complete-viewport.png") });
  await back.click();
  await expect(page.getByRole("button", { name: "Rever história" })).toBeVisible();
});

test("postcard story artwork and controls fit a light desktop theme", async ({ page }, info) => {
  await page.route("**/api/session", route => route.fulfill({ json: { authenticated: true, user: { id: "story-light", email: "story@example.com", name: "Ana" } } }));
  await page.route("**/api/rewards", route => route.fulfill({ json: { storage: "account", coins: 0, completed: {}, reviews: {}, owned: [], mascot: "sparky", equipped: { sparky: {}, pinky: {} } } }));
  await page.route("**/api/onboarding", route => route.fulfill({ json: { enabled: false } }));
  await page.route("**/api/appearance", route => route.fulfill({ json: { preference: { palette: "beatrice", mode: "light" }, storage: "account" } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir história" }).click();
  await page.getByRole("button", { name: "Começar história" }).click();
  await expect(page.getByRole("heading", { name: missingPostcardScenes[0].title })).toBeVisible();
  const art = page.locator("img[src*='bookshop']").last();
  await expect.poll(() => art.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(await page.locator("body").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("story-light-desktop.png"), fullPage: true });
});
