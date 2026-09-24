import { test, expect, type Page } from "@playwright/test";

async function openAccount(page: Page) {
  await page.route("**/api/session", route => route.fulfill({ json: { authenticated: true, user: { id: "mobile-performance", email: "mobile@example.com", name: "Rafa" } } }));
  await page.route("**/api/rewards", route => route.fulfill({ json: { storage: "account", coins: 40, completed: {}, reviews: {}, owned: [], notebookTheme: null, mascot: "sparky", equipped: { sparky: {}, pinky: {} } } }));
  await page.route("**/api/onboarding", route => route.fulfill({ json: { enabled: false } }));
  await page.route("**/api/appearance", route => route.fulfill({ json: { preference: { palette: "sparky", mode: "light" }, storage: "account" } }));
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Começar lição|Continuar de onde parei|Revisar agora/, exact: true })).toBeVisible();
}

test("mobile navigation stays on one row and closed course modules are mounted on demand", async ({ page }, info) => {
  test.skip(info.project.name === "desktop", "Mobile resource behavior");
  await openAccount(page);

  const nav = page.getByRole("navigation", { name: "Navegação no celular" });
  const positions = await nav.getByRole("button").evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().top));
  expect(new Set(positions).size).toBe(1);

  await nav.getByRole("button", { name: "Curso", exact: true }).click();
  await expect(page.locator(".course-trail")).toBeVisible();
  await expect(page.locator(".trail-module-body")).toHaveCount(1);

  const nextModule = page.locator(".course-trail > li").nth(1);
  const toggle = nextModule.getByRole("button", { name: /Pessoas e objetos/ });
  await toggle.evaluate(element => { const r=element.getBoundingClientRect(); window.scrollTo(0, window.scrollY+r.top-innerHeight/2); });
  await expect.poll(() => toggle.evaluate(element => { const r = element.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })).toBe(true);
  await toggle.click();
  await expect(nextModule.locator(".trail-module-body")).toHaveCount(1);
  await expect(page.locator(".trail-module-body")).toHaveCount(2);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
