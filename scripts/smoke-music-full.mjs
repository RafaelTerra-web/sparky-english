import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildMusicRounds } from '../src/lib/music-game.ts';
import { musicBrowserOptions, musicBaseURL, musicSessionOptions } from './music-smoke-browser.mjs';
const browser = await chromium.launch(musicBrowserOptions);
try {
  const page=await browser.newPage({...musicSessionOptions,viewport:{width:390,height:844},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.scratches=0;const start=AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start=function(...args){window.scratches++;return start.apply(this,args);};
  });
  await page.goto(musicBaseURL);
  await page.getByRole('button',{name:'Músicas',exact:true}).click();
  await page.locator('.music-card[data-track-id="perfect-local"]').click();
  const audio=page.locator('.listen-dock audio');
  await page.waitForFunction(()=>document.querySelector('.listen-dock audio')?.readyState>=1);
  const lesson=await page.evaluate(async()=>(await(await fetch('/api/music')).json()).catalog[0]);
  assert.ok(lesson.duration>260);assert.ok(lesson.lines.length>40);
  for(const l of lesson.lines)for(const w of l.words)assert.ok(lesson.vocabulary.some(v=>v.id===w.vocabularyId&&v.meaning&&v.ipa));
  for(let seed=0;seed<1000;seed++){
    const rounds=buildMusicRounds(lesson,'challenge',seed);
    assert.equal(rounds.length,24);
    for(const [i,r] of rounds.entries()){
      assert.ok(Math.abs(r.revealAt-r.countdownStart-3)<1e-9);
      assert.ok(Math.abs(r.closes-r.opens-3)<1e-9);
      assert.equal(r.revealAt,r.line.start);
      assert.equal(r.opens,r.line.words[r.target].end);
      if(i)assert.ok(r.countdownStart>=rounds[i-1].closes);
    }
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
    await audio.evaluate((a,t)=>{a.currentTime=t;},r.countdownStart+.05);
    const opening = i === 0 && r.countdownStart + .05 < 3;
    await page.locator(`.clip-round[data-round="${i}"][data-state="${opening ? 'countdown' : 'waiting'}"]`).waitFor();
    assert.equal(await page.locator('.clip-countdown.is-visible').count(), opening ? 1 : 0);
    await audio.evaluate((a,t)=>{a.currentTime=t;},r.revealAt+.02);
    await page.locator(`.clip-round[data-round="${i}"] .clip-ambient [data-question=true]`).waitFor();
    assert.equal(await page.locator('.clip-options button').first().isDisabled(),true);
    await audio.evaluate((a,t)=>{a.currentTime=t;},r.opens+.05);
    await page.locator(`.clip-round[data-round="${i}"][data-state="answering"]`).waitFor();
    const before=await page.evaluate(()=>{const c=document.querySelector('.listen-content'),b=document.querySelector('.clip-options button');return{top:c?.scrollTop,page:scrollY,button:b?.getBoundingClientRect().top};});
    const value=i===1?r.options.find(w=>w!==r.answer):r.answer;
    await page.locator('.clip-options button').nth(r.options.indexOf(value)).click();
    await page.locator(`.clip-round[data-state="${i===1?'incorrect':'answered'}"]`).waitFor();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const after=await page.evaluate(()=>{const c=document.querySelector('.listen-content'),b=document.querySelector('.clip-options button');return{top:c?.scrollTop,page:scrollY,button:b?.getBoundingClientRect().top};});
    assert.equal(after.top,before.top,'answering must not move the game scroller');
    assert.equal(after.page,before.page,'answering must not move the page');
    assert.ok(Math.abs(after.button-before.button)<1,'answer slot must remain fixed apart from its tap animation');
    if(i===1)assert.equal(await page.evaluate(()=>window.scratches),1);
    assert.equal(await audio.evaluate(a=>a.paused),false);
  }
  assert.equal(await page.evaluate(()=>window.pauses),0);
  await audio.evaluate((a,t)=>{a.currentTime=t;},rounds.at(-1).closes+.1);
  await page.locator('.clip-game[data-phase="outro"]').waitFor();
  assert.equal(await page.getByRole('heading',{name:'Deu ouvido ao inglês.'}).count(),0);
  await audio.evaluate((a,t)=>{a.currentTime=t-.15;},lesson.duration);
  await page.getByRole('heading',{name:'Deu ouvido ao inglês.'}).waitFor();
  assert.ok((await page.locator('.clip-results').innerText()).includes(`${rounds.length-1}/${rounds.length}`));
  assert.equal(await page.locator('.clip-review button').count(),1);
  await page.getByRole('button',{name:'Jogar novamente'}).click();
  const nextSeed=Number(await page.locator('.clip-game').getAttribute('data-session-seed'));
  assert.notEqual(nextSeed,seed);
  const rerolled=buildMusicRounds(lesson,'challenge',nextSeed);
  assert.notDeepEqual(rerolled.map(r=>`${r.lineIndex}:${r.target}`),rounds.map(r=>`${r.lineIndex}:${r.target}`));
  await audio.evaluate((a,t)=>{a.currentTime=t;},rerolled[0].opens+.05);
  await page.locator('.clip-round[data-state="answering"]').waitFor();
  await page.getByRole('button',{name:'Pausar jogo'}).click();
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewportSize({width,height});
    assert.ok(await page.locator('.listen-shell').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    assert.ok(await page.locator('.listen-content').evaluate(el=>el.scrollTop===0&&el.scrollHeight<=el.clientHeight+1));
    const answers=await page.locator('.clip-options').boundingBox();
    const dock=await page.locator('.listen-dock').boundingBox();assert.ok(dock.y+dock.height<=height+1);
    assert.ok(answers.y+answers.height<=dock.y+1,'answers stay above the dock');
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
