import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { buildMusicRounds } from '../src/lib/music-game.ts';
import { musicBrowserOptions, musicBaseURL, musicSessionOptions } from './music-smoke-browser.mjs';

// This smoke deliberately earns achievements: use only the isolated lab.
assert.ok(['localhost','127.0.0.1'].includes(new URL(musicBaseURL).hostname));
const browser=await chromium.launch(musicBrowserOptions);
const folder='.music-lab/ranks-review';await mkdir(folder,{recursive:true});
try {
  const page=await browser.newPage({...musicSessionOptions,viewport:{width:390,height:844},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(musicBaseURL);await page.getByRole('button',{name:'Músicas',exact:true}).click();
  const catalog=await page.evaluate(async()=>(await(await fetch('/api/music')).json()).catalog);
  const lesson=catalog.find(l=>l.id==='heartless-local');
  await page.locator('.music-card[data-track-id="heartless-local"]').click();
  assert.equal(await page.getByRole('button',{name:'Minha voz',exact:true}).count(),0);
  await page.getByRole('button',{name:'Começar a jogar'}).click();
  const audio=page.locator('.listen-dock audio');
  await page.waitForFunction(()=>document.querySelector('.listen-dock audio')?.paused===false);
  const rounds=buildMusicRounds(lesson,'challenge',Number(await page.locator('.clip-game').getAttribute('data-session-seed')));
  for(const [i,round] of rounds.entries()) {
    await audio.evaluate((a,t)=>{a.currentTime=t;a.pause();},round.opens+.08);
    await page.locator(`.clip-round[data-round="${i}"][data-state=answering]`).waitFor();
    const target=page.locator(`[data-lyric-id="${round.line.id}"] [data-word="${round.target}"]`);
    await page.waitForTimeout(100);
    const body=target.locator('.clip-word-body');
    assert.equal(await body.evaluate(el=>getComputedStyle(el).visibility),'hidden');
    await target.evaluate(el=>{window.__targetNode=el;window.__targetBox=el.getBoundingClientRect().toJSON();});
    if(i===2) await page.screenshot({path:`${folder}/question.png`});
    await audio.evaluate(a=>a.play());
    const button=page.locator('.clip-options button').nth(round.options.indexOf(round.answer));
    await button.click();await audio.evaluate((a,t)=>{a.pause();a.currentTime=t;},round.opens+.08);
    await page.locator('.clip-round[data-state=answered]').waitFor();
    await page.waitForTimeout(100);
    assert.equal(await target.evaluate(el=>window.__targetNode===el),true,'Question and lyric must keep the same word node');
    assert.ok(await target.evaluate(el=>Math.abs(window.__targetBox.width-el.getBoundingClientRect().width)<.5),'Unmasking must preserve word width');
    assert.equal(await body.evaluate(el=>getComputedStyle(el).visibility),'visible');
    assert.equal(await page.locator('[data-score]').getAttribute('data-score'),String((i+1)*100));
    await button.dispatchEvent('click');
    assert.equal(await page.locator('[data-score]').getAttribute('data-score'),String((i+1)*100),'Duplicate answer must not award twice');
    if(i===2) await page.screenshot({path:`${folder}/answer.png`});
  }
  assert.equal(await page.locator('.clip-scorebar [data-rank]').getAttribute('data-rank'),'S');
  await audio.evaluate(async(a,t)=>{a.currentTime=t-.15;await a.play();},lesson.duration);
  await page.locator('.clip-game[data-phase=result]').waitFor();
  await page.screenshot({path:`${folder}/result.png`});
  assert.match(await page.locator('.clip-final-score').innerText(),/2.400/);
  const url='/api/media-progress?trackId=heartless-local';
  await page.waitForFunction(async url=>{const p=await(await fetch(url,{cache:'no-store'})).json();return p.performance?.challenge.completedCorrect===24&&p.performance.challenge.streak===24&&p.completed;},url,{timeout:20000,polling:500});
  const saved=await page.evaluate(async url=>(await(await fetch(url)).json()),url);
  assert.equal(saved.performance.challenge.streak,24);
  const bad=structuredClone(saved);bad.performance.challenge.correct=250;
  const rejected=await page.request.patch(new URL('/api/media-progress',musicBaseURL).href,{headers:{Origin:new URL(musicBaseURL).origin},data:{trackId:lesson.id,baseRevision:saved.revision,state:bad}});
  assert.equal(rejected.status(),400);
  await page.getByRole('button',{name:'Ver conquistas e recordes'}).click();
  await page.locator('[data-achievement=perfect][data-unlocked=true]').waitFor();
  assert.equal(await page.locator('[data-achievement][data-unlocked=true]').count(),6);
  await page.screenshot({path:`${folder}/achievements.png`,fullPage:true});
  await page.keyboard.press('Escape');await page.reload();
  await page.getByRole('button',{name:'Músicas',exact:true}).click();
  await page.locator('.music-card[data-track-id="heartless-local"]').click();
  await page.getByRole('button',{name:'Começar a jogar'}).click();
  await audio.evaluate(async(a,end)=>{a.currentTime=end-.1;await a.play();},lesson.duration);
  await page.getByRole('button',{name:'Ver conquistas e recordes'}).click();
  await page.locator('[data-achievement=perfect][data-unlocked=true]').waitFor();
  assert.equal(await page.locator('.music-records [data-rank=S]').count(),1);
  for(const [width,height] of [[320,568],[390,844],[430,932]]) {
    await page.setViewportSize({width,height});
    assert.ok(await page.locator('.listen-shell').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  }
  await page.getByRole('button',{name:'Voltar ao resultado',exact:true}).click();
  await page.getByRole('button',{name:'Jogar novamente'}).click();
  await audio.evaluate(a=>{a.currentTime=181;a.pause();});
  await page.locator('.clip-chorus-fx[data-active=true]').waitFor();
  assert.equal(await page.locator('.clip-chorus-fx i').count(),18);
  const transforms=await page.locator('.clip-chorus-fx i').evaluateAll(els=>els.map(el=>el.style.cssText));
  await page.waitForTimeout(200);
  assert.deepEqual(await page.locator('.clip-chorus-fx i').evaluateAll(els=>els.map(el=>el.style.cssText)),transforms,'Paused particles follow paused media');
  await page.screenshot({path:`${folder}/chorus.png`});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.clip-chorus-fx i').first().evaluate(el=>getComputedStyle(el).display),'none');
  assert.deepEqual(errors,[]);
  console.log('PASS: one lyric DOM, stable target width, 100 points once per hit, S at 2400, persisted records and six achievements, invalid scores rejected, no voice step, chorus particles, pause and reduced motion.');
} finally {await browser.close();}
