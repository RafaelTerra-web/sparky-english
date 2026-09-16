import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { musicBrowserOptions, musicBaseURL, musicSessionOptions } from './music-smoke-browser.mjs';
import { buildMusicRounds } from '../src/lib/music-game.ts';
import { ambientLyricIndex } from '../src/lib/music-ambience.ts';

const browser = await chromium.launch(musicBrowserOptions);
const screenshots = '.music-lab/remaster-review';
await mkdir(screenshots, {recursive:true});
try {
  const page = await browser.newPage({...musicSessionOptions,viewport:{width:390,height:844},serviceWorkers:'block'});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(musicBaseURL);
  await page.getByRole('button',{name:'Músicas',exact:true}).click();
  await page.screenshot({path:`${screenshots}/library.png`});
  await page.locator('.music-card[data-track-id="perfect-local"]').click();
  const audio=page.locator('.listen-dock audio');
  await page.waitForFunction(()=>document.querySelector('.listen-dock audio')?.readyState>=1);
  const lesson=await page.evaluate(async()=>(await(await fetch('/api/music')).json()).catalog[0]);
  await page.screenshot({path:`${screenshots}/setup.png`});
  await page.getByRole('button',{name:'Começar a jogar'}).click();
  const rounds=buildMusicRounds(lesson,'challenge',Number(await page.locator('.clip-game').getAttribute('data-session-seed')));
  const first=rounds[0];
  await audio.evaluate((a,t)=>{a.currentTime=t;},first.opens+.05);
  await page.locator('.clip-round[data-state=answering]').waitFor();
  assert.equal(await page.locator('.clip-ambient [data-masked=true]').count(),1,'only the target is masked');
  await page.waitForTimeout(350);
  await page.screenshot({path:`${screenshots}/challenge.png`});
  await page.locator('.clip-options button').nth(first.options.indexOf(first.answer)).click();
  await page.locator('.clip-round[data-state=answered]').waitFor();
  await page.locator('.clip-prompt-slot .clip-ambient[data-visible=true]').waitFor();
  await page.getByRole('button',{name:'Pausar jogo'}).click();
  await page.screenshot({path:`${screenshots}/answer.png`});
  const pausedIndex=await page.locator('.clip-prompt-slot .clip-ambient').getAttribute('data-line');
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.clip-prompt-slot .clip-ambient').getAttribute('data-line'),pausedIndex);

  // The outro is always free of challenges. Seek there, then rewind into a
  // completed line to check background continuity independently of round state.
  await audio.evaluate((a,t)=>{a.currentTime=t;},rounds.at(-1).closes+.1);
  await page.locator('.clip-game[data-phase=outro]').waitFor();
  const ambient=page.locator('.clip-prompt-slot .clip-ambient');
  for (const speed of [1,.75,.5]) {
    await page.getByRole('button',{name:speed===1?'1×':speed===.75?'0,75×':'0,5×',exact:true}).click();
    assert.equal(await audio.evaluate(a=>a.playbackRate),speed);
    for (const index of [20,5,30]) {
      const time=lesson.lines[index].start+.05;
      await audio.evaluate((a,t)=>{a.currentTime=t;},time);
      await page.waitForFunction(i=>document.querySelector('.clip-prompt-slot .clip-ambient')?.getAttribute('data-line')===String(i),ambientLyricIndex(lesson.lines,time));
      assert.equal(await ambient.getAttribute('aria-label'),'Letra sincronizada');
      assert.equal(await ambient.locator('.spoken,.current-word,button').count(),0);
      assert.equal((await ambient.locator('p').allTextContents()).at(-1),lesson.lines[index].text);
      await page.waitForTimeout(400);
      assert.ok(Number(await ambient.evaluate(el=>getComputedStyle(el).opacity))<=.83);
    }
  }
  await page.waitForTimeout(800);
  await page.screenshot({path:`${screenshots}/ambient.png`});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await ambient.locator('p').first().evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await page.locator('.clip-media .music-scene').evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const [width,height] of [[320,568],[390,844],[430,932],[1440,900]]) {
    await page.setViewportSize({width,height});
    await page.waitForTimeout(800);
    assert.ok(await page.locator('.listen-content').evaluate(el=>el.scrollHeight<=el.clientHeight+1));
    assert.equal(await page.locator('.listen-content').evaluate(el=>el.scrollTop),0);
    await page.screenshot({path:`${screenshots}/ambient-${width}.png`});
  }
  // Fresh typing game, then a viewport sized like the area above a keyboard.
  await page.keyboard.press('Escape');
  await page.locator('.music-card[data-track-id="perfect-local"]').click();
  await page.getByRole('button',{name:/Sem pistas/}).click();
  await page.getByRole('button',{name:'Começar a jogar'}).click();
  const typedRounds=buildMusicRounds(lesson,'typing',Number(await page.locator('.clip-game').getAttribute('data-session-seed')));
  await audio.evaluate((a,t)=>{a.currentTime=t;},typedRounds[0].opens+.05);
  await page.locator('.clip-round[data-state=answering]').waitFor();
  await page.getByRole('textbox',{name:'Palavra que você ouviu'}).focus();
  await page.setViewportSize({width:390,height:390});
  await page.waitForTimeout(350);
  const input=await page.getByRole('textbox',{name:'Palavra que você ouviu'}).boundingBox();
  const dock=await page.locator('.listen-dock').boundingBox();
  assert.ok(input.y>=0&&input.y+input.height<=dock.y,'typing field must stay above the dock');
  await page.screenshot({path:`${screenshots}/typing-compact.png`});
  // Simulate the keyboard model used by browsers that keep layout height at
  // 844px but report just 390px through visualViewport (not a real OS keyboard).
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{
    Object.defineProperty(window.visualViewport,'height',{configurable:true,value:390});
    window.visualViewport.dispatchEvent(new Event('resize'));
  });
  const compactInput=await page.getByRole('textbox',{name:'Palavra que você ouviu'}).boundingBox();
  const compactDock=await page.locator('.listen-dock').boundingBox();
  assert.ok(compactInput.y+compactInput.height<=compactDock.y&&compactDock.y+compactDock.height<=391,'visual viewport keeps the input and navigation visible');
  assert.deepEqual(errors,[]);
  console.log(`PASS: ambient lyrics, no hints during challenges, seek at all speeds, paused clock, reduced motion, responsive layout, compact typing. Track: ${lesson.id}`);
} finally {await browser.close();}
