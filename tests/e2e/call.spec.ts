import { expect, test, type Page } from "@playwright/test";

const sessionId = "123e4567-e89b-42d3-a456-426614174000";

async function openLearner(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("sparky-interface-language", "pt-BR");
  });
  await page.route("**/api/session", route => route.fulfill({ json: { authenticated: true, user: { id: "call-test", name: "Ana", email: "test@example.com" } } }));
  await page.route("**/api/onboarding", route => route.fulfill({ json: { enabled: false } }));
  await page.route("**/api/appearance", route => route.fulfill({ json: { storage: "account", preference: { palette: "sparky", mode: "dark" } } }));
  await page.route("**/api/rewards", route => route.fulfill({ json: {
    storage: "account", coins: 45, completed: {}, reviews: {}, owned: [], notebookTheme: null,
    mascot: "sparky", equipped: { sparky: {}, pinky: {} }, streak: { count: 3, longest: 3, lastDay: "2026-09-11" },
  } }));
  await page.route("**/api/call", async route => {
    expect(route.request().headers()["idempotency-key"]).toBeTruthy();
    await route.fulfill({ json: {
      sessionId,
      objectives: [
        { id: "suggest", label: "Fazer uma sugestão", status: "pending" },
        { id: "reason", label: "Explicar uma preferência", status: "pending" },
      ],
      openingTurn: { text: "Hi, Ana! What would you like to do this weekend?", language: "en", mascot: "sparky", audio: null },
      revision: 0,
    } });
  });
  await page.goto("/");
  await page.addStyleTag({ content: "nextjs-portal{display:none}" });
}

test("Call opens from Today without adding a bottom-bar item", async ({ page }, info) => {
  await openLearner(page);
  await expect(page.locator("nav.mobile-nav button")).toHaveCount(5);
  await expect(page.getByText("CALL DE CONVERSAÇÃO · 10 MIN")).toBeVisible();
  await page.getByRole("button", { name: "Praticar conversação" }).click();
  await expect(page.locator("nav.mobile-nav")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Call com Sparky" })).toBeVisible();
  await page.getByRole("button", { name: "Iniciar Call" }).click();
  await expect(page.getByText("Hi, Ana! What would you like to do this weekend?")).toBeVisible();
  await expect(page.getByText("Fazer uma sugestão")).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("sparky-call-session:call-test") || "null")?.sessionId)).toBe(sessionId);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("call-started.png"), fullPage: true });
});
