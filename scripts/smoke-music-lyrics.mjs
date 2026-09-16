import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { buildMusicRounds } from '../src/lib/music-game.ts';
import { ambientLyricIndex } from '../src/lib/music-ambience.ts';
import { musicSectionAt } from '../src/lib/music-visuals.ts';
import { musicBrowserOptions, musicBaseURL, musicSessionOptions } from './music-smoke-browser.mjs';

const browser = await chromium.launch(musicBrowserOptions);
const folder = '.music-lab/lyric-sections-review';
await mkdir(folder, { recursive: true });
try {
  const page = await browser.newPage({ ...musicSessionOptions, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(musicBaseURL);
  await page.getByRole('button', { name: 'Músicas', exact: true }).click();
  const catalog = await page.evaluate(async () => (await (await fetch('/api/music')).json()).catalog);
  for (const lesson of catalog) {
    await page.locator(`.music-card[data-track-id="${lesson.id}"]`).click();
    const audio = page.locator('.listen-dock audio');
    await page.waitForFunction(() => document.querySelector('.listen-dock audio')?.readyState >= 1);
    await page.getByRole('button', { name: 'Começar a jogar' }).click();
    await audio.evaluate(a => a.pause());
    const rounds = buildMusicRounds(lesson, 'challenge', Number(await page.locator('.clip-game').getAttribute('data-session-seed')));
    for (const [time, digit] of [[.2,'3'],[1.2,'2'],[2.2,'1']]) {
      await audio.evaluate((a,t) => { a.currentTime=t; }, time);
      await page.waitForFunction(n => document.querySelector('.clip-countdown.is-visible strong')?.textContent === n, digit);
    }
    await page.screenshot({ path: `${folder}/${lesson.id}-intro.png` });
    await audio.evaluate(a => { a.currentTime=3.1; });
    await page.waitForFunction(() => !document.querySelector('.clip-countdown.is-visible'));
    const round = rounds[1];
    await audio.evaluate((a,t) => { a.currentTime=t; }, round.opens+.05);
    await page.locator('.clip-round[data-state=answering]').waitFor();
    assert.equal(await page.locator('.clip-ambient[data-visible=true]').count(),1);
    assert.equal(await page.locator('[data-masked=true] .clip-word-body').evaluate(el=>getComputedStyle(el).visibility),'hidden','A fade must not reveal the target');
    assert.equal(await page.locator('.clip-word-mask').innerText(),'•••');
    await audio.evaluate(a => a.play());
    await page.locator('.clip-options button').nth(round.options.indexOf(round.answer)).click();
    await page.locator('.clip-prompt-slot .clip-ambient[data-visible=true]').waitFor();
    await page.locator('.clip-response-stage .clip-answer-receipt.is-visible').waitFor();
    await audio.evaluate(a => a.pause());
    await page.screenshot({ path: `${folder}/${lesson.id}-answered.png` });

    // Completed challenges let us review every narrative section without
    // exposing a future answer. Seeking back must not restart the count-in.
    await audio.evaluate((a,t) => { a.currentTime=t; }, rounds.at(-1).closes+.1);
    await page.locator('.clip-game[data-phase=outro]').waitFor();
    const points = lesson.id === 'heartless-local' ? [6.5,31.5,85,100,127.2,166,181,217] : lesson.id === 'stay-at-your-house-local' ? [5,33,65,101,132,166,181,212,244] : [5,33,63,101,162,198,210,251];
    for (const time of points) {
      await audio.evaluate((a,t) => { a.currentTime=t; }, time);
      const index = ambientLyricIndex(lesson.lines,time);
      const section = musicSectionAt(lesson.id,time);
      await page.locator(`.clip-game[data-section="${section.kind}"] .clip-ambient[data-line="${index}"][data-visible=true]`).waitFor();
      assert.equal(await page.locator('.clip-countdown.is-visible').count(),0);
      const lyric = page.locator('.clip-ambient p[data-current=true]');
      assert.equal(await lyric.innerText(),lesson.lines[index].words.map(w=>w.text).join(' '));
      assert.ok(await lyric.evaluate(el => Number(getComputedStyle(el).opacity)>0));
      await page.waitForTimeout(450);
      const opacity = Number(await page.locator('.clip-ambient').evaluate(el=>getComputedStyle(el).opacity));
      if(section.kind === 'chorus') assert.ok(opacity>.75,'Chorus receives more emphasis');
      assert.doesNotMatch(await lyric.evaluate(el=>getComputedStyle(el).fontFamily),/Georgia|Times/);
      if(section.kind === 'narrative') assert.match(await lyric.evaluate(el=>getComputedStyle(el).fontFamily),/Space Grotesk/);
      const word = lesson.lines[index].words.find(w=>time>=w.start&&time<w.end);
      if(word) assert.ok((await lyric.locator('[data-singing=true]').innerText()).includes(word.text));
      if(section.kind==='chorus'||section.kind==='narrative') await page.screenshot({path:`${folder}/${lesson.id}-${time}.png`});
    }
    for (const speed of [1,.75,.5]) {
      await page.getByRole('button',{name:speed===1?'1×':speed===.75?'0,75×':'0,5×',exact:true}).click();
      await audio.evaluate(a=>{a.currentTime=63;});
      await page.waitForFunction(i=>document.querySelector('.clip-ambient')?.getAttribute('data-line')===String(i),ambientLyricIndex(lesson.lines,63));
      assert.equal(await audio.evaluate(a=>a.playbackRate),speed);
    }
    for (const [width,height] of [[320,568],[390,844],[430,932]]) {
      await page.setViewportSize({width,height});
      await page.waitForTimeout(300);
      assert.ok(await page.locator('.listen-content').evaluate(el=>el.scrollHeight<=el.clientHeight+1));
      await page.screenshot({path:`${folder}/${lesson.id}-${width}.png`});
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.clip-ambient p').first().evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: opening-only count-in, uninterrupted lyric stage after answers and between challenges, narrative/dialogue/chorus sections, word sweep, backward seeks, speeds, reduced motion and compact mobile.');
} finally { await browser.close(); }
