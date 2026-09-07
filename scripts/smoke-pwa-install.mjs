// Mobile PWA regression test: exclusively the isolated localhost fixture.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const output = new URL("../.next/ui-checks/", import.meta.url);
await mkdir(output, { recursive: true });

const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const android = "Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

async function mobilePage(userAgent, installed = false) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent, hasTouch: true, serviceWorkers: "block" });
  if (installed) await context.addInitScript(() => Object.defineProperty(navigator, "standalone", { configurable: true, value: true }));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://localhost:3201");
  await page.locator(".app-frame").waitFor();
  return { context, page, errors };
}

try {
  const ios = await mobilePage(iphone);
  const iosPrompt = ios.page.locator(".install-prompt");
  await iosPrompt.getByRole("heading", { name: "Instale no iPhone" }).waitFor();
  await iosPrompt.getByRole("button", { name: "Ver como instalar" }).click();
  await iosPrompt.getByText("Adicionar à Tela de Início", { exact: false }).waitFor();
  await iosPrompt.getByText("Abrir como App da Web", { exact: false }).waitFor();
  assert.equal(await iosPrompt.getByText("Primeiro:", { exact: false }).count(), 0, "Safari should not receive the open-in-Safari warning");
  assert.ok((await ios.page.locator('link[rel="apple-touch-icon"]').getAttribute("href"))?.includes("apple-touch-icon-v2.png"));
  assert.ok((await ios.page.locator('meta[name="viewport"]').getAttribute("content"))?.includes("viewport-fit=cover"));
  await iosPrompt.screenshot({ path: new URL("install-iphone.png", output).pathname.replace(/^\/([A-Z]:)/, "$1") });
  await iosPrompt.getByRole("button", { name: "Fechar convite de instalação" }).click();
  await iosPrompt.waitFor({ state: "detached" });
  assert.deepEqual(ios.errors, []);
  await ios.context.close();

  const installedIos = await mobilePage(iphone, true);
  assert.equal(await installedIos.page.locator(".install-prompt").count(), 0, "installed iOS app must not promote installation");
  await installedIos.context.close();

  const droid = await mobilePage(android);
  const androidPrompt = droid.page.locator(".install-prompt");
  await androidPrompt.getByRole("heading", { name: "Instale no Android" }).waitFor();
  await androidPrompt.getByRole("button", { name: "Ver como instalar" }).click();
  await androidPrompt.getByText("Instalar app", { exact: false }).waitFor();
  await androidPrompt.getByRole("button", { name: "Ocultar instruções" }).click();
  await droid.page.evaluate(() => {
    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: async () => { window.__sparkyInstallPromptCalls = (window.__sparkyInstallPromptCalls || 0) + 1; },
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });
    window.dispatchEvent(event);
  });
  const installButton = androidPrompt.getByRole("button", { name: "Instalar app", exact: true });
  await installButton.waitFor();
  await androidPrompt.screenshot({ path: new URL("install-android.png", output).pathname.replace(/^\/([A-Z]:)/, "$1") });
  await installButton.click();
  await droid.page.waitForFunction(() => window.__sparkyInstallPromptCalls === 1);
  await androidPrompt.waitFor({ state: "detached" });
  assert.deepEqual(droid.errors, []);

  const manifestResponse = await droid.page.request.get("http://localhost:3201/manifest.webmanifest");
  assert.equal(manifestResponse.ok(), true);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.id, "/");
  assert.ok(manifest.icons.some(icon => icon.sizes === "192x192" && icon.purpose === "any"));
  assert.ok(manifest.icons.some(icon => icon.sizes === "512x512" && icon.purpose === "any"));
  assert.ok(manifest.icons.some(icon => icon.sizes === "512x512" && icon.purpose === "maskable"));
  for (const icon of manifest.icons) assert.equal((await droid.page.request.get(new URL(icon.src, "http://localhost:3201").href)).ok(), true);
  const worker = await droid.page.request.get("http://localhost:3201/sw.js");
  assert.equal(worker.headers()["service-worker-allowed"], "/");
  assert.match(worker.headers()["cache-control"], /max-age=0/);
  await droid.context.close();

  const cancelled = await mobilePage(android);
  await cancelled.page.locator('.install-prompt').waitFor();
  await cancelled.page.evaluate(() => {
    const event = new Event('beforeinstallprompt', {cancelable:true});
    Object.assign(event, {prompt:async () => {}, userChoice:Promise.resolve({outcome:'dismissed',platform:'web'})});
    window.dispatchEvent(event);
  });
  await cancelled.page.getByRole('button',{name:'Instalar app',exact:true}).click();
  await cancelled.page.locator('.install-instructions').waitFor();
  assert.equal(await cancelled.page.getByRole('button',{name:'Instalar app',exact:true}).count(),0,'consumed event cannot be reused');
  await cancelled.page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await cancelled.page.locator('.install-prompt').waitFor({state:'detached'});
  await cancelled.context.close();

  // Exercise the real worker, including its offline fallback, instead of mocking registration.
  const workerContext = await browser.newContext({serviceWorkers:'allow'});
  const workerPage = await workerContext.newPage();
  await workerPage.goto('http://localhost:3201');
  await workerPage.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  await workerPage.request.get('http://localhost:3201/api/session');
  const cachedPaths = await workerPage.evaluate(async () => {
    const paths = [];
    for (const key of await caches.keys()) for (const request of await (await caches.open(key)).keys()) paths.push(new URL(request.url).pathname);
    return paths;
  });
  assert.ok(cachedPaths.includes('/offline.html'));
  assert.ok(cachedPaths.includes('/icons/sparky-192-v2.png'));
  assert.ok(!cachedPaths.some(path => path.startsWith('/api/')),'private endpoints must stay outside offline cache');
  await workerContext.setOffline(true);
  await workerPage.goto('http://localhost:3201/');
  await workerPage.getByRole('heading',{name:'Você está sem conexão.'}).waitFor();
  await workerContext.close();

  console.log("PASS: iPhone instructions, installed-mode suppression, Android accept/cancel, standalone manifest, icons, worker scope and real offline fallback without private API caching.");
} finally {
  await browser.close();
}
