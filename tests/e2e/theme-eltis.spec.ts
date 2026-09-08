import { expect, test, type Page } from "@playwright/test";

async function mockAccount(page: Page) {
  await page.route("**/api/session", (route) =>
    route.fulfill({ json: { authenticated: true, user: { id: "eltis-test", email: "student@example.com", name: "Rafael" } } }),
  );
  await page.route("**/api/rewards", (route) =>
    route.fulfill({ json: { storage: "account", coins: 40, completed: {}, reviews: {}, owned: [], notebookTheme: null, mascot: "sparky", equipped: { sparky: {}, pinky: {} } } }),
  );
  await page.route("**/api/onboarding", (route) => route.fulfill({ json: { enabled: false } }));
}

test("dark theme applies before the app renders and persists", async ({ page }, testInfo) => {
  await mockAccount(page);
  await page.addInitScript(() => localStorage.setItem("sparky-color-theme", "dark"));
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Usar tema claro" })).toBeVisible();
  const colors = await page.locator("body").evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, foreground: style.color };
  });
  expect(colors.background).toBe("rgb(11, 16, 14)");
  expect(colors.foreground).toBe("rgb(243, 246, 244)");
  await page.screenshot({ path: testInfo.outputPath("dark-dashboard.png"), fullPage: true });

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("ELTiS practice starts, keeps answers private and resumes", async ({ page }, testInfo) => {
  await mockAccount(page);
  let answerSubmitted = false;
  await page.route("**/api/mock-tests/eltis", async (route) => {
    const body = route.request().postDataJSON() as { action: string; token?: string };
    if (body.action === "start") {
      return route.fulfill({ json: { token: "sealed-attempt", index: 0, total: 24, question: { id: "el-l01", section: "Listening", skill: "listening", prompt: "What should students do first?", options: ["Write two sentences", "Open their textbooks", "Move into groups", "Underline the textbook"], audioId: "bell-work", maxPlays: 1 } } });
    }
    if (body.action === "answer") {
      answerSubmitted = true;
      return route.fulfill({ json: { token: "sealed-attempt-2", index: 1, total: 24, question: { id: "el-r01", section: "Reading", skill: "reading", prompt: "What happened first?", passage: "Maya had reviewed the chapter before the study group met.", options: ["Maya reviewed", "The group met", "Both happened together", "Neither happened"] } } });
    }
    return route.fulfill({ json: { token: "sealed-attempt-2", index: 1, total: 24, question: { id: "el-r01", section: "Reading", skill: "reading", prompt: "What happened first?", passage: "Maya had reviewed the chapter before the study group met.", options: ["Maya reviewed", "The group met", "Both happened together", "Neither happened"] } } });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Curso", exact: true }).click();
  await page.getByRole("button", { name: /Simulados ·/ }).click();
  const installDismiss = page.getByRole("button", { name: "Fechar convite de instalação" });
  if (await installDismiss.isVisible()) await installDismiss.click();
  await expect(page.getByRole("heading", { name: "Simulado ELTiS" })).toBeVisible();
  await expect(page.getByText(/não produz pontuação ELTiS de 500/)).toBeVisible();
  await page.getByRole("button", { name: "Começar simulado" }).click();
  await expect(page.getByText("Questão 1 de 24")).toBeVisible();
  await expect(page.getByText(/answer|transcript/i)).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("eltis-question.png"), fullPage: true });
  await page.getByLabel("Write two sentences").check();
  await page.getByRole("button", { name: "Confirmar e continuar" }).click();
  await expect(page.getByText("Questão 2 de 24")).toBeVisible();
  expect(answerSubmitted).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("sparky-mock-eltis:eltis-test"))).toBe("sealed-attempt-2");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
