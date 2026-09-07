// Only the isolated local account from preview-fixture.mjs is used.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { lessons } from '../src/lib/curriculum.ts';
import { cosmeticCatalog } from '../src/lib/rewards-shared.ts';
import { isExercise, exerciseId } from '../src/lib/study.ts';
const { chromium, devices } = await import(process.env.PLAYWRIGHT_MODULE_PATH ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : 'playwright');
const output = resolve(process.env.SCENE_QA_OUTPUT || '.next/scene-checks');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const scenes = cosmeticCatalog.filter(item => item.category === 'scenes');
try {
  for (const [name, device] of [['desktop', { viewport: { width: 1360, height: 1000 } }], ['iphone', devices['iPhone 13']], ['android', devices['Pixel 7']]]) {
    const context = await browser.newContext({ ...device, serviceWorkers: 'block' });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const shop = async () => {
      await page.locator('.app-frame').waitFor();
      await page.locator(`${name === 'desktop' ? '.sidebar' : '.mobile-nav'} button`).filter({ hasText: /^Loja$/ }).click();
      await page.getByRole('heading', { name: 'Loja de descobertas' }).waitFor();
    };
    const reward = () => page.evaluate(async () => (await fetch('/api/rewards')).json());
    await page.goto('http://localhost:3201'); await shop();
    if (name !== 'desktop') await page.getByRole('button', { name: 'Fechar convite de instalação' }).click();
    // Exercise the normal, signed grading/completion API to fund this test account.
    await page.evaluate(async rows => {
      for (const row of rows) {
        let receipt = '';
        for (const step of row.steps) {
          const response = await fetch('/api/study', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lessonId: row.id, review: false, assisted: false, receipt, ...step }) });
          if (!response.ok) throw Error('Fixture grade failed'); receipt = (await response.json()).receipt;
        }
        const response = await fetch('/api/rewards', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'complete', lessonId: row.id, review: false, receipt }) });
        if (!response.ok) throw Error('Fixture completion failed');
      }
    }, lessons.slice(0, 8).map(l => ({ id: l.id, steps: l.steps.filter(isExercise).map(s => ({ stepId: exerciseId(l, s), answer: s.answer })) })));
    await page.reload(); await shop();
    if (name !== 'desktop') assert.equal(await page.locator('.install-prompt').count(), 0, 'a dismissed install invitation stays dismissed during this session');
    assert.equal((await reward()).coins, 100);
    for (const mascot of ['Sparky', 'Pinky']) {
      await page.locator('.mascot-selector button').filter({ hasText: mascot }).click();
      await page.waitForFunction(m => [...document.querySelectorAll('.mascot-selector button')].some(b => b.textContent.includes(m) && b.getAttribute('aria-pressed') === 'true'), mascot);
      await page.getByRole('button', { name: 'Cenários', exact: true }).click();
      assert.equal(await page.locator('.shop-card').count(), 8);
      for (const scene of scenes) {
        await page.locator(`[data-item="${scene.id}"]`).getByRole('button', { name: 'Experimentar' }).click();
        await page.getByRole('heading', { name: `Experimentando: ${scene.name}`, exact: true }).waitFor();
        assert.ok((await page.locator('.mascot-preview .mascot-scenery').evaluate(el => getComputedStyle(el).backgroundImage)).includes(scene.id));
        assert.equal((await reward()).coins, 100, 'preview must never debit');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        for (const asset of Object.values(scene.sceneAssets)) assert.equal((await context.request.get(`http://localhost:3201${asset}`)).status(), 200);
        await page.locator('.mascot-preview img').evaluate(img => img.decode());
        await page.locator('.mascot-preview').screenshot({ path: resolve(output, `${name}-${mascot.toLowerCase()}-${scene.id}.png`) });
        await page.getByRole('button', { name: 'Sair da prévia' }).click();
      }
    }
    const card = page.locator('[data-item="scene-train"]');
    await card.getByRole('button', { name: 'Adquirir', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click();
    await card.getByRole('button', { name: 'Usar', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.mascot-preview .scene-train'));
    assert.equal((await reward()).coins, 5);
    const duplicate = await page.evaluate(async () => (await fetch('/api/rewards', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'buy', itemId: 'scene-train' }) })).json());
    assert.equal(duplicate.spent, 0); assert.equal(duplicate.coins, 5);
    await page.locator('.mascot-selector button').filter({ hasText: 'Sparky' }).click();
    await page.getByRole('button', { name: 'Meus itens', exact: true }).click();
    await card.getByRole('button', { name: 'Usar', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.mascot-preview .mascot-sparky.scene-train'));
    await page.reload(); await shop();
    const final = await reward();
    assert.equal(final.equipped.sparky.scene, 'scene-train');
    assert.equal(final.equipped.pinky.scene, 'scene-train');
    assert.equal(final.coins, 5);
    await page.getByRole('button', { name: 'Cenários', exact: true }).click();
    await page.screenshot({ path: resolve(output, `${name}-scene-store.png`), fullPage: true });
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}: eight scenes, both mascots, preview, purchase, duplicate protection, equipment and persistence.`);
    await context.close();
  }
} finally { await browser.close(); }
