import { test, expect } from "@playwright/test";
test("complete and resume onboarding with a voice failure, preserving the account", async ({
  page,
}, testInfo) => {
  const state = {
    enabled: true,
    profile: null as Record<string, unknown> | null,
    revision: 0,
    draft: {
      step: "welcome",
      name: "",
      age: 0,
      mascot: "sparky",
      level: "A1",
      guardianConsent: false,
    } as Record<string, unknown>,
    placement: null,
  };
  await page.route("**/api/session", (r) =>
    r.fulfill({
      json: {
        authenticated: true,
        user: {
          id: "test-user",
          email: "test@example.com",
          name: "Google Name",
        },
      },
    }),
  );
  await page.route("**/api/rewards", (r) =>
    r.fulfill({
      json: {
        storage: "account",
        coins: 123,
        completed: {},
        reviews: {},
        owned: [],
        notebookTheme: null,
        mascot: "sparky",
        equipped: { sparky: {}, pinky: {} },
      },
    }),
  );
  await page.route("**/api/onboarding/audio", (r) =>
    r.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await page.route('**/audio/onboarding/**', r=>r.fulfill({status:503,body:''}));
  await page.route("**/api/onboarding", async (r) => {
    if (r.request().method() === "POST") {
      const b = r.request().postDataJSON();
      state.revision++;
      if (b.action === "next") state.draft.step = "name";
      if (b.action === "name")
        Object.assign(state.draft, { name: b.name, step: "age" });
      if (b.action === "age")
        Object.assign(state.draft, {
          age: b.age,
          guardianConsent: b.guardianConsent,
          step: "mascot",
        });
      if (b.action === "mascot")
        Object.assign(state.draft, { mascot: b.mascot, step: "level" });
      if (b.action === "level")
        Object.assign(state.draft, {
          level: b.level,
          levelMethod: "self-assessment",
          step: "finish",
        });
      if (b.action === "finish")
        state.profile = { ...state.draft, onboardingCompleted: true };
    }
    await r.fulfill({ json: state });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Vamos começar" }).click();
  await page.getByLabel("Meu nome ou apelido").fill("Ana_123");
  await page.getByRole("button", { name: "Confirmar nome" }).click();
  await expect(
    page.getByText("Use até 50 letras;", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Meu nome ou apelido").fill("Ana Maria");
  await page.getByRole("button", { name: "Confirmar nome" }).click();
  await expect(page.getByLabel("Sua idade")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Sua idade")).toBeVisible();
  await page.getByLabel("Sua idade").fill("12");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Pinky", exact: true }).click();
  await page
    .getByRole("button", { name: "B2 Intermediário avançado", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pronto, Ana Maria!" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBeFalsy();
  await page.screenshot({path:testInfo.outputPath('onboarding-finish.png'),fullPage:true});
  await page.getByRole("button", { name: "Entrar no meu espaço" }).click();
  await expect(
    page.getByRole("button", { name: "Perfil", exact: true }).first(),
  ).toBeVisible();
  expect(state.profile?.level).toBe("B2");
  expect(state.profile?.mascot).toBe("pinky");
});
