// Real UI and normal reward APIs, with a synthetic local-only account.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { lessons } from '../src/lib/curriculum.ts';
import { notebookThemeCatalog } from '../src/lib/rewards-shared.ts';
import { isExercise, exerciseId } from '../src/lib/study.ts';
const { chromium, devices } = await import(process.env.PLAYWRIGHT_MODULE_PATH ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : 'playwright');
const output = resolve(process.env.SCENE_QA_OUTPUT || '.next/theme-checks');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
function luminance(rgb) {
  return rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);
}
try {
  for (const [name, device] of [['desktop', { viewport: { width: 1360, height: 1000 } }], ['iphone', devices['iPhone 13']], ['android', devices['Pixel 7']]]) {
    const context = await browser.newContext({ ...device, serviceWorkers: 'block' });
    const page = await context.newPage(); const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    const nav = label => page.locator(`${name === 'desktop' ? '.sidebar' : '.mobile-nav'} button`).filter({ hasText: new RegExp(`^${label}$`) }).click();
    const reward = () => page.evaluate(async () => (await fetch('/api/rewards')).json());
    await page.goto('http://localhost:3201'); await page.locator('.app-frame').waitFor();
    if (name !== 'desktop') await page.getByRole('button', { name: 'Fechar convite de instalação' }).click();
    await nav('Caderno');
    await page.getByLabel('O que você quer conseguir fazer?').fill('Discuss a project with my team.');
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
    }, lessons.slice(0,18).map(l => ({ id:l.id, steps:l.steps.filter(isExercise).map(s=>({stepId:exerciseId(l,s),answer:s.answer})) })));
    await page.reload(); await page.locator('.app-frame').waitFor(); await nav('Loja');
    let balance=(await reward()).coins; assert.ok(balance >= 190, 'fixture earned enough for all four themes');
    const refused = await page.evaluate(async () => (await fetch('/api/rewards',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'notebook-theme',itemId:'notebook-midnight'})})).status);
    assert.equal(refused,400);
    for (const theme of notebookThemeCatalog) {
      await page.getByRole('button',{name:'Cadernos',exact:true}).click();
      assert.equal(await page.locator('.shop-card').count(),4);
      const card=page.locator(`[data-item="${theme.id}"]`);
      await card.getByRole('button',{name:'Ver prévia do caderno'}).click();
      await page.waitForFunction(()=>document.activeElement?.classList.contains('notebook-theme-preview'));
      assert.equal((await reward()).coins,balance);
      await page.getByRole('button',{name:'Fechar prévia do caderno'}).click();
      await card.getByRole('button',{name:'Adquirir',exact:true}).click();
      await page.getByRole('button',{name:'Confirmar compra',exact:true}).click();
      await card.getByRole('button',{name:'Usar no caderno',exact:true}).click();
      await page.waitForFunction(id=>document.querySelector(`[data-item="${id}"]`)?.textContent.includes('Em uso'),theme.id);
      balance-=theme.price; assert.equal((await reward()).coins,balance);
      await nav('Caderno'); await page.locator(`.learning-notebook.${theme.className}`).waitFor();
      assert.equal(await page.getByLabel('O que você quer conseguir fazer?').inputValue(),'Discuss a project with my team.');
      const colors=await page.locator('.notebook-section').first().evaluate(node=>({paper:getComputedStyle(node).backgroundColor,ink:getComputedStyle(node.querySelector('p')).color}));
      const a=luminance(colors.paper),b=luminance(colors.ink);
      assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${theme.id}: body contrast`);
      const titleColors=await page.locator('.learning-notebook h1').evaluate(node=>{
        let ancestor=node, paper='rgba(0, 0, 0, 0)';
        while(ancestor && paper === 'rgba(0, 0, 0, 0)') { paper=getComputedStyle(ancestor).backgroundColor; ancestor=ancestor.parentElement; }
        return {ink:getComputedStyle(node).color,paper};
      });
      const c=luminance(titleColors.paper),d=luminance(titleColors.ink);
      assert.ok((Math.max(c,d)+.05)/(Math.min(c,d)+.05)>=4.5,`${theme.id}: page title contrast`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.screenshot({path:resolve(output,`${name}-${theme.id}.png`)});
      await nav('Loja');
    }
    await page.getByRole('button',{name:'Meus itens',exact:true}).click();
    await page.locator('[data-item="notebook-berry"]').getByRole('button',{name:'Voltar ao tema original'}).click();
    await page.reload(); await page.locator('.app-frame').waitFor(); await nav('Caderno');
    assert.equal((await reward()).notebookTheme,null); assert.equal((await reward()).coins,balance);
    assert.equal(await page.getByLabel('O que você quer conseguir fazer?').inputValue(),'Discuss a project with my team.');
    assert.deepEqual(errors,[]);
    console.log(`PASS ${name}: four themes, preview, purchase, ownership, notebook application, text preservation, contrast and free reset.`);
    await context.close();
  }
} finally { await browser.close(); }
