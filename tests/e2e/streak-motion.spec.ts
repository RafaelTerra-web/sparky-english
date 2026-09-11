import { expect, test, type Page } from "@playwright/test";

async function openAccount(page: Page, reducedMotion = false, count = 7) {
  if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/session", route => route.fulfill({ json: { authenticated: true, user: { id: "streak-test", name: "Ana", email: "test@example.com" } } }));
  await page.route("**/api/onboarding", route => route.fulfill({ json: { enabled: false } }));
  await page.route("**/api/appearance", route => route.fulfill({ json: { storage: "account", preference: { palette: "sparky", mode: "dark" } } }));
  await page.route("**/api/rewards", route => {
    const base = { storage: "account", coins: 45, completed: {}, reviews: {}, owned: [], notebookTheme: null, mascot: "sparky", equipped: { sparky: {}, pinky: {} } };
    if (route.request().method() === "POST") return route.fulfill({ json: { ...base, streak: { count, longest: count, lastDay: "2026-09-11" }, streakAdvanced: true, streakMilestone: count % 7 === 0, earned: count % 7 === 0 ? 5 : 0 } });
    return route.fulfill({ json: { ...base, streak: { count: 6, longest: 6, lastDay: "2026-09-10" } } });
  });
  await page.goto("/");
  await page.addStyleTag({ content: "nextjs-portal{display:none}" });
}

test("daily check-in presents the streak and animated navigation feedback", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 720 });
  await openAccount(page);
  await expect(page.locator(".streak-badge")).toHaveAttribute("aria-label", /Sequência atual: 7 dias/);
  await expect(page.locator(".streak-celebration")).toContainText("7 dias seguidos");
  await expect(page.locator(".streak-celebration")).toContainText("+5 moedas");
  await expect.poll(() => page.evaluate(() => {
    const flame = document.querySelector<HTMLImageElement>(".streak-animation-flame");
    return Boolean(flame?.complete && flame.naturalWidth > 0 && flame.src.includes("streak-flame-192.png"));
  })).toBe(true);
  await page.getByRole("button", { name: "Curso", exact: true }).filter({ visible: true }).click();
  await expect(page.locator(".motion-transition")).toBeVisible();
  await expect(page.locator(".course-trail")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("streak-motion.png") });
});

test("streak roadmap explores milestones and restores keyboard focus", async ({ page }, info) => {
  await openAccount(page, false, 30);
  await expect(page.locator('.streak-special')).toHaveAttribute('data-milestone', '30');
  await expect(page.locator('.streak-special')).not.toContainText('+0');
  await page.getByRole('button', { name: 'Fechar celebração da sequência' }).click();
  await page.locator('.streak-badge').click();
  const dialog = page.getByRole('dialog', { name: 'Seu foguinho' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('progressbar')).toHaveAttribute('max', '50');
  await dialog.getByRole('button', { name: '100 dias', exact: false }).click();
  await expect(dialog).toContainText('Faltam 70 dias');
  await dialog.getByRole('button', { name: '10 dias', exact: true }).click();
  await expect(dialog).toContainText('Marco conquistado!');
  await expect.poll(() => dialog.getByRole('progressbar').evaluate(element => (element as HTMLProgressElement).position)).toBe(1);
  await page.screenshot({ path: info.outputPath('streak-roadmap.png'), animations: 'disabled' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.screenshot({ path: info.outputPath('streak-roadmap-light.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.streak-badge')).toBeFocused();
});

test("reduced motion removes decorative motion but keeps the streak readable", async ({ page }) => {
  await openAccount(page, true);
  await page.getByRole("button", { name: "Curso", exact: true }).filter({ visible: true }).click();
  await expect(page.locator(".course-trail")).toBeVisible();
  await expect(page.locator(".motion-transition")).toHaveCount(0);
  await expect(page.locator(".streak-badge")).toContainText("7");
});
