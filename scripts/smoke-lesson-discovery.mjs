// Uses only the isolated localhost fixture from scripts/preview-fixture.mjs.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
const page = await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await mkdir('.next/ui-checks',{recursive:true});
try {
  await page.goto('http://localhost:3201');
  await page.locator('.app-frame').waitFor();
  await page.locator('.mobile-nav button').filter({hasText:/Trilha/}).click();
  await page.getByRole('button',{name:'Buscar lições',exact:true}).click();
  const search=page.getByRole('textbox',{name:'Buscar assunto ou expressão'});
  assert.equal(await page.getByRole('group',{name:'Nível das lições'}).getByRole('button',{name:'Todos os níveis',exact:true}).getAttribute('aria-pressed'),'true');
  for(const query of ['zero conditional','first conditional','second conditional','third conditional','mixed conditionals','firt conditional','segunda condicional']) {
    await search.fill(query);
    await page.locator('.practice-module .guided-lesson').first().waitFor();
    assert.ok(await page.locator('.practice-module .guided-lesson').count(),query);
  }
  await search.fill('second conditional');
  await page.getByRole('group',{name:'Nível das lições'}).getByRole('button',{name:'A1',exact:true}).click();
  await page.getByText('Encontramos esse conteúdo em outros níveis.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Buscar em todos os níveis',exact:true}).click();
  assert.equal(await page.locator('.practice-module .guided-lesson').count(),2);
  await page.locator('.grammar-browser summary').click();
  await page.getByRole('group',{name:'Nível dos tópicos'}).getByRole('button',{name:'B2',exact:true}).click();
  await page.locator('.grammar-topic-list button').filter({hasText:'Mixed Conditionals'}).click();
  assert.equal(await page.locator('.practice-module .guided-lesson').count(),2);
  await page.screenshot({path:'.next/ui-checks/lesson-discovery-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile overflow');
  await page.locator('.practice-module .guided-lesson').first().click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({path:'.next/ui-checks/mixed-conditional-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('Lesson discovery: bilingual search, all conditional families, level recovery, topic links and mobile lesson opening passed.');
} finally {await browser.close();}
