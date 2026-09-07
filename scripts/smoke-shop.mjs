// Authenticated UI/API checks against the isolated localhost fixture only.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { lessons } from '../src/lib/curriculum.ts';
import { isExercise, exerciseId } from '../src/lib/study.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : 'playwright');
const browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
const page = await browser.newPage({viewport:{width:1280,height:950},serviceWorkers:'block'});
const errors=[]; page.on('pageerror',error=>errors.push(error.message));
const output=new URL('../.next/ui-checks/',import.meta.url); await mkdir(output,{recursive:true});
const nav=async name=>page.locator(`${page.viewportSize().width<700?'.mobile-nav':'.sidebar'} button`).filter({hasText:new RegExp('^'+name+'$')}).click();
const reward=()=>page.evaluate(async()=> (await fetch('/api/rewards')).json());
const card=id=>page.locator(`[data-item="${id}"]`);
async function buy(id) {
 await card(id).getByRole('button',{name:'Adquirir',exact:true}).click();
 await page.waitForFunction(()=>document.activeElement?.classList.contains('shop-confirm'));
 await page.getByRole('button',{name:'Confirmar compra',exact:true}).click();
 await page.waitForFunction(id=>!document.querySelector('.shop-confirm') && document.querySelector(`[data-item="${id}"]`),id);
}
try {
 await page.goto('http://localhost:3201'); await page.locator('.app-frame').waitFor(); await nav('Loja');
 await page.getByRole('heading',{name:'Loja de descobertas'}).waitFor();
 await page.locator('.mascot-selector button').filter({hasText:'Pinky'}).click();
 await page.waitForFunction(()=>document.querySelector('.mascot-pinky') && [...document.querySelectorAll('.mascot-selector button')].some(b=>b.textContent.includes('Pinky') && b.getAttribute('aria-pressed')==='true'));
 const before=await reward(); assert.equal(before.coins,0);
 await card('pinky-focus-look').getByRole('button',{name:'Experimentar'}).click();
 assert.ok((await page.locator('.mascot-preview img').getAttribute('src')).includes('pinky-focus-v2'));
 assert.deepEqual((await reward()).equipped,before.equipped,'preview cannot equip or debit');
 await page.getByRole('button',{name:'Sair da prévia'}).click();
 await card('pinky-focus-look').getByRole('button',{name:'Continuar estudando'}).click();
 await page.getByRole('heading',{name:'Seu estudo de hoje'}).waitFor();
 // Earn real signed completion rewards in the fixture; no production account is modified.
 await page.evaluate(async rows=>{
  for(const row of rows){let receipt='';for(const step of row.steps){const response=await fetch('/api/study',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lessonId:row.id,review:false,assisted:false,receipt,...step})});if(!response.ok)throw Error('Fixture grade');receipt=(await response.json()).receipt;}
   const response=await fetch('/api/rewards',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'complete',lessonId:row.id,review:false,receipt})});if(!response.ok)throw Error('Fixture reward');}
 },lessons.slice(0,12).map(l=>({id:l.id,steps:l.steps.filter(isExercise).map(s=>({stepId:exerciseId(l,s),answer:s.answer}))})));
 await page.reload(); await page.locator('.app-frame').waitFor(); await nav('Loja');
 const earned=(await reward()).coins; assert.ok(earned>=110);
 await card('pinky-focus-look').getByRole('button',{name:'Adquirir',exact:true}).click();
 await page.getByRole('button',{name:'Cancelar compra'}).click(); assert.equal((await reward()).coins,earned);
 await buy('pinky-focus-look'); assert.equal((await reward()).coins,earned-40);
 await card('pinky-focus-look').getByRole('button',{name:'Usar',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-item="pinky-focus-look"]')?.textContent.includes('Em uso'));
 await page.getByRole('button',{name:'Cenários',exact:true}).click(); await buy('scene-garden');
 await card('scene-garden').getByRole('button',{name:'Usar',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.mascot-preview .scene-garden'));
 const fitted=await reward(); assert.equal(fitted.equipped.pinky.style,'pinky-focus-look'); assert.equal(fitted.equipped.pinky.scene,'scene-garden');
 assert.equal(await page.locator('.cosmetic-layer').count(),0);
 await page.getByRole('button',{name:'Missões extras',exact:true}).click(); await buy('practice-travel');
 assert.equal((await reward()).coins,earned-110);
 const duplicate=await page.evaluate(async()=> (await fetch('/api/rewards',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'buy',itemId:'practice-travel'})})).json());
 assert.equal(duplicate.spent,0); assert.equal(duplicate.coins,earned-110);
 await card('practice-travel').getByRole('button',{name:'Abrir missões'}).click();
 const dialog=page.locator('.store-practice-dialog'); await dialog.waitFor({state:'visible'});
 const decision=dialog.locator('.mission-decision').first();
 await decision.getByRole('button',{name:'Excuse me, I ordered tea without milk.',exact:true}).click();
 await decision.getByRole('button',{name:'Conferir decisão'}).click();
 await decision.getByText('Essa escolha atende ao contexto.').waitFor();
 await dialog.getByLabel('Seu rascunho da missão').fill('Excuse me, I ordered orange juice. Could I have a refund, please?');
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(await dialog.evaluate(node=>node.scrollWidth<=node.clientWidth),true);
 await dialog.getByLabel('Seu rascunho da missão').scrollIntoViewIfNeeded();
 const closeBounds=await dialog.getByRole('button',{name:'Fechar missões'}).boundingBox();
 assert.ok(closeBounds && closeBounds.y>=0 && closeBounds.y+closeBounds.height<=844,'mission close control stays in the mobile viewport after scrolling');
 await page.screenshot({path:fileURLToPath(new URL('shop-mission-mobile.png',output))});
 await dialog.getByRole('button',{name:'Fechar missões'}).click();
 await card('practice-travel').getByRole('button',{name:'Abrir missões'}).click();
 assert.ok((await dialog.getByLabel('Seu rascunho da missão').inputValue()).includes('orange juice'));
 await dialog.getByRole('button',{name:'Fechar missões'}).click();
 await nav('Caderno'); await page.getByRole('heading',{name:'Missão: Seu pedido veio diferente'}).waitFor();
 await nav('Loja'); await page.getByRole('button',{name:'Meus itens',exact:true}).click();
 await page.locator('.mascot-preview').scrollIntoViewIfNeeded();
 await page.screenshot({path:fileURLToPath(new URL('shop-pinky-mobile.png',output))});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.setViewportSize({width:1280,height:950}); await page.getByRole('button',{name:'Looks',exact:true}).click();
 await page.screenshot({path:fileURLToPath(new URL('shop-desktop.png',output)),fullPage:true});
 await page.reload(); await page.locator('.app-frame').waitFor(); await nav('Loja');
 assert.equal((await reward()).equipped.pinky.style,'pinky-focus-look');
 assert.equal((await reward()).coins,earned-110);
 assert.deepEqual(errors,[]);
 console.log('PASS: free preview, earn CTA, real purchases, cancellation, duplicate protection, fitted look + scene, permanent mission access, feedback, notebook drafts, mobile and reload persistence.');
} finally {await browser.close();}
