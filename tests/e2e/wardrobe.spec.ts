import { test, expect, type Page } from "@playwright/test";
import { cosmeticCatalog, outfitCatalog, type MascotId, type CosmeticSlot } from "../../src/lib/rewards-shared";
import { emptyRewardState, buyCosmetic, equipCosmetic, selectMascot, publicRewardState } from "../../src/lib/rewards";

async function prepare(page: Page, mascot: MascotId) {
  let state = { ...emptyRewardState(), coins: 10000 };
  for (const item of cosmeticCatalog) state = buyCosmetic(state, item.id).state;
  state = selectMascot(state, mascot);
  for (const [slot, id] of Object.entries({
    head: "accessory-urban-cap-v4", face: "accessory-round-readers-v4",
    neck: "accessory-study-scarf-v4", back: "accessory-compact-backpack-v4",
  })) state = equipCosmetic(state, mascot, slot as CosmeticSlot, id);
  await page.addInitScript(() => {
    localStorage.setItem("sparky-opening-seen-v4", "1");
    localStorage.setItem("sparky-interface-language", "pt-BR");
  });
  await page.route("**/api/session", route => route.fulfill({ json: {
    authenticated: true, user: { id: "wardrobe-test", email: "wardrobe@example.test", name: "Estudante" },
  } }));
  await page.route("**/api/rewards", route => {
    if (route.request().method() === "POST") {
      const action = route.request().postDataJSON() as { action: string; mascot: MascotId; slot: CosmeticSlot; itemId: string | null };
      if (action.action === "equip") state = equipCosmetic(state, action.mascot, action.slot, action.itemId);
      if (action.action === "select-mascot") state = selectMascot(state, action.mascot);
    }
    return route.fulfill({ json: { ...publicRewardState(state), storage: "account" } });
  });
  await page.route("**/api/onboarding", route => route.fulfill({ json: { enabled: false } }));
  await page.route("**/api/appearance", route => route.fulfill({ json: { preference: { palette: "sparky", mode: "light" }, storage: "device" } }));
  await page.goto("/");
  await page.getByRole("button", { name: /^(Abrir configurações|Configurações|Perfil)$/ }).filter({ visible: true }).first().click();
  await page.locator(".settings-shop").click();
  await expect(page.getByRole("heading", { name: "Loja de descobertas" })).toBeVisible();
}

async function assertLayers(page: Page, mascot: MascotId, outfit: string) {
  const figure = page.locator(".mascot-preview > .mascot-figure");
  await expect(figure).toHaveAttribute("data-mascot", mascot);
  await expect(figure).toHaveAttribute("data-outfit", outfit);
  await expect(figure.locator("[data-cosmetic]" )).toHaveCount(mascot === "sparky" ? 5 : 4);
  await expect.poll(() => figure.locator("img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth === 640))).toBe(true);
  const rendered = await figure.locator("img").evaluateAll(images => images.map(image => {
    const element = image as HTMLImageElement;
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    return { source: element.currentSrc, x: rect.x, y: rect.y, width: rect.width, height: rect.height, z: Number(style.zIndex), layer: element.dataset.layer, slot: element.className, fit: style.objectFit };
  }));
  const base = rendered.find(layer => layer.slot === "mascot-base")!;
  for (const layer of rendered) {
    expect(layer.source).toMatch(/\/visuals\/wardrobe\/.+\.png\?v=[a-f0-9]{16}$/);
    expect(layer.source).not.toContain("/_next/image");
    expect(Math.abs(layer.x - base.x)).toBeLessThan(1);
    expect(Math.abs(layer.y - base.y)).toBeLessThan(1);
    expect(Math.abs(layer.width - base.width)).toBeLessThan(1);
    expect(Math.abs(layer.height - base.height)).toBeLessThan(1);
    expect(layer.fit).toBe("contain");
    if (layer.layer === "back") expect(layer.z).toBeLessThan(base.z);
    if (layer.layer === "front") expect(layer.z).toBeGreaterThan(base.z);
  }
  const frontBag = rendered.find(layer => layer.slot.includes("wardrobe-front"));
  const scarf = rendered.find(layer => layer.slot.includes("wardrobe-neck"))!;
  if (frontBag) expect(frontBag.z).toBeLessThan(scarf.z);
}

for (const mascot of ["sparky", "pinky"] as const) {
  test(`${mascot} loads all four slots on the base and every outfit without optimizer requests`, async ({ page }, info) => {
    const failedSprites: string[] = [];
    page.on("response", response => {
      if (response.url().includes("/visuals/wardrobe/") && !response.ok()) failedSprites.push(`${response.status()} ${response.url()}`);
    });
    await prepare(page, mascot);
    await assertLayers(page, mascot, "base");
    for (const outfit of outfitCatalog.filter(item => item.mascots.includes(mascot))) {
      await page.locator(`.shop-card[data-item="${outfit.id}"]`).getByRole("button", { name: "Usar", exact: true }).click();
      await assertLayers(page, mascot, outfit.id);
    }
    // Exercise all repaired bag variants through the same production component.
    await page.getByRole("button", { name: "Acessórios", exact: true }).click();
    for (const itemId of ["accessory-explorer-satchel-v4", "accessory-book-tote-v4", "accessory-rocket-pack-v4", "accessory-compact-backpack-v4"]) {
      await page.locator(`.shop-card[data-item="${itemId}"]`).getByRole("button", { name: "Usar", exact: true }).click();
      await expect.poll(() => page.locator(".mascot-preview img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth === 640))).toBe(true);
    }
    await assertLayers(page, mascot, outfitCatalog.filter(item => item.mascots.includes(mascot)).at(-1)!.id);
    await page.locator(".mascot-preview").screenshot({ path: info.outputPath(`${mascot}-four-slots.png`), animations: "disabled" });
    expect(failedSprites).toEqual([]);
  });
}
