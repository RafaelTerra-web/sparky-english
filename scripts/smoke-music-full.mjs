import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildMusicRounds } from '../src/lib/music-game.ts';
const browser = await chromium.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true });
try {
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.scratches=0;const start=AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start=function(...args){window.scratches++;return start.apply(this,args);};
  });
  await page.goto('http://127.0.0.1:3221');
  await page.getByRole('button',{name:'Músicas',exact:true}).click();
  await page.getByRole('button',{name:/Abrir sessão/}).click();
  const audio=page.locator('.listen-dock audio');
  await page.waitForFunction(()=>document.querySelector('.listen-dock audio')?.readyState>=1);
  const lesson=await page.evaluate(async()=>(await(await fetch('/api/music')).json()).catalog[0]);
  assert.ok(lesson.duration>260);assert.ok(lesson.lines.length>40);
  for(const l of lesson.lines)for(const w of l.words)assert.ok(lesson.vocabulary.some(v=>v.id===w.vocabularyId&&v.meaning&&v.ipa));
  for(let seed=0;seed<1000;seed++){
    const rounds=buildMusicRounds(lesson,'challenge',seed);
    for(const r of rounds){assert.ok(Math.abs(r.closes-r.opens-3)<1e-9);assert.ok(r.opens>=r.line.words[r.target].end);}
    assert.ok(rounds.at(-1).closes<lesson.duration,'all targets must finish before the instrumental outro ends');
  }
  await page.getByRole('button',{name:'0,5×',exact:true}).click();
  assert.equal(await audio.evaluate(a=>a.playbackRate),.5);
  assert.equal(await audio.evaluate(a=>a.preservesPitch),true);
  await page.getByRole('button',{name:'1×',exact:true}).click();
  await page.getByRole('button',{name:'Começar a jogar'}).click();
  const seed=Number(await page.locator('.clip-game').getAttribute('data-session-seed'));
  const rounds=buildMusicRounds(lesson,'challenge',seed);
  await audio.evaluate(a=>{window.pauses=0;a.addEventListener('pause',()=>window.pauses++);});
  for(const [i,r] of rounds.entries()){
    await audio.evaluate((a,t)=>{a.currentTime=t;},r.opens+.05);
    await page.locator(`.clip-round[data-round="${i}"][data-state="answering"]`).waitFor();
    const value=i===1?r.options.find(w=>w!==r.answer):r.answer;
    await page.locator('.clip-options button').nth(r.options.indexOf(value)).click();
    if(i===1){await page.locator('.clip-options button.incorrect').waitFor();assert.equal(await page.evaluate(()=>window.scratches),1);}
    await page.locator('.clip-round[data-state="waiting"]').waitFor();
    assert.equal(await audio.evaluate(a=>a.paused),false);
  }
  assert.equal(await page.evaluate(()=>window.pauses),0);
  await audio.evaluate((a,t)=>{a.currentTime=t;},rounds.at(-1).closes+.1);
  assert.equal(await page.getByRole('heading',{name:'Deu ouvido ao inglês.'}).count(),0);
  await audio.evaluate((a,t)=>{a.currentTime=t-.15;},lesson.duration);
  await page.getByRole('heading',{name:'Deu ouvido ao inglês.'}).waitFor();
  assert.ok((await page.locator('.clip-results').innerText()).includes(`${rounds.length-1}/${rounds.length}`));
  assert.equal(await page.locator('.clip-review button').count(),1);
  await page.getByRole('button',{name:'Jogar novamente'}).click();
  const nextSeed=Number(await page.locator('.clip-game').getAttribute('data-session-seed'));
  assert.notEqual(nextSeed,seed);
  const rerolled=buildMusicRounds(lesson,'challenge',nextSeed);
  assert.notDeepEqual(rerolled.map(r=>r.target),rounds.map(r=>r.target));
  await page.getByRole('button',{name:'Pausar jogo'}).click();
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewportSize({width,height});
    assert.ok(await page.locator('.listen-shell').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    const dock=await page.locator('.listen-dock').boundingBox();assert.ok(dock.y+dock.height<=height+1);
  }
  await page.getByRole('button',{name:'Palavras',exact:true}).click();
  await page.getByPlaceholder('Palavra ou significado').fill('angel');
  assert.equal(await page.locator('.music-vocabulary button').count(),1);
  await page.locator('.music-vocabulary button').click();
  assert.match(await page.locator('.music-definition').innerText(),/anjo/);
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);
  console.log(`PASS: full ${lesson.duration}s song, ${rounds.length} random rounds, all ${lesson.vocabulary.length} vocabulary entries, 1000 fair schedules, new seed on replay, scratch, continuous outro, mobile widths.`);
} finally {await browser.close();}
