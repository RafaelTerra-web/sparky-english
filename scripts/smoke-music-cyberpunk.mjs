import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { buildMusicRounds } from '../src/lib/music-game.ts';
import { musicBrowserOptions, musicBaseURL, musicSessionOptions } from './music-smoke-browser.mjs';

const browser = await chromium.launch(musicBrowserOptions);
const folder = '.music-lab/cyberpunk-review'; await mkdir(folder, { recursive: true });
try {
  const page = await browser.newPage({ ...musicSessionOptions, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(musicBaseURL);
  await page.getByRole('button', { name: 'Músicas', exact: true }).click();
  const catalog = await page.evaluate(async () => (await (await fetch('/api/music')).json()).catalog);
  assert.equal(catalog.length, 3);
  const lesson = catalog.find(track => track.id === 'stay-at-your-house-local');
  assert.equal(lesson.version, 'stay-at-your-house-timing-1');
  const progressURL = `/api/media-progress?trackId=${lesson.id}`;
  const previous = await page.request.get(new URL(progressURL, musicBaseURL).href);
  assert.equal(previous.status(), 200);
  const state = await previous.json();
  const saved = await page.request.patch(new URL('/api/media-progress', musicBaseURL).href, {
    headers: { Origin: new URL(musicBaseURL).origin }, data: { trackId: lesson.id, baseRevision: state.revision, state },
  });
  assert.equal(saved.status(), 200);
  const recovered = await (await page.request.get(new URL(progressURL, musicBaseURL).href)).json();
  assert.equal(recovered.revision, state.revision + 1);
  assert.deepEqual({ ...recovered, revision: state.revision }, state);
  for (const source of [lesson.source, lesson.visualSource]) {
    const range = await page.request.get(new URL(source, musicBaseURL).href, { headers: { Range: 'bytes=0-127' } });
    assert.equal(range.status(), 206); assert.equal((await range.body()).length, 128);
    const suffix = await page.request.get(new URL(source, musicBaseURL).href, { headers: { Range: 'bytes=-32' } });
    assert.equal(suffix.status(), 206); assert.equal((await suffix.body()).length, 32);
  }
  for (const query of ['unknown', '../stay-at-your-house/video.mp4', 'perfect-local']) {
    assert.equal((await page.request.get(new URL(`/api/music/video?trackId=${encodeURIComponent(query)}`, musicBaseURL).href)).status(), 404);
  }
  for (const range of ['bytes=999999999-', 'bytes=4-1', 'bytes=-0', 'bytes=0-1,4-6']) {
    assert.equal((await page.request.get(new URL(lesson.visualSource, musicBaseURL).href, { headers: { Range: range } })).status(), 416);
  }
  for (let seed = 0; seed < 200; seed++) for (const difficulty of ['guided', 'challenge', 'typing']) {
    const rounds = buildMusicRounds(lesson, difficulty, seed);
    assert.equal(rounds.length, 24); assert.ok(rounds.at(-1).closes < lesson.duration);
    assert.deepEqual(rounds, buildMusicRounds(lesson, difficulty, seed));
    for (let i = 1; i < rounds.length; i++) assert.ok(rounds[i].countdownStart >= rounds[i-1].closes - 1e-8);
  }
  await page.locator('.music-card[data-track-id="stay-at-your-house-local"]').click();
  assert.equal(await page.locator('.listen-tabs').count(), 0);
  const audio = page.locator('.listen-dock audio'), video = page.locator('.music-video video');
  await page.waitForFunction(() => document.querySelector('.listen-dock audio')?.readyState >= 1);
  await page.getByRole('button', { name: 'Começar a jogar' }).click();
  await audio.evaluate(a => { a.currentTime = 65; a.pause(); });
  await page.locator('.music-video[data-active=true]').waitFor();
  await page.waitForFunction(() => Math.abs(document.querySelector('.music-video video')?.currentTime - 65) < .2);
  assert.equal(await video.evaluate(v => v.muted && v.paused && v.playsInline), true);
  await page.waitForTimeout(1700);
  await page.screenshot({ path: `${folder}/chorus.png` });
  for (const speed of [1, .75, .5]) {
    await page.getByRole('button', { name: speed === 1 ? '1×' : speed === .75 ? '0,75×' : '0,5×', exact: true }).click();
    await audio.evaluate(a => a.play()); await page.waitForTimeout(450);
    assert.equal(await video.evaluate(v => v.playbackRate), speed);
    const drift = await page.evaluate(() => Math.abs(document.querySelector('.music-video video').currentTime - document.querySelector('.listen-dock audio').currentTime));
    assert.ok(drift < .35, `video drift: ${drift}`);
    await audio.evaluate(a => { a.dispatchEvent(new Event('waiting')); });
    await page.waitForFunction(() => document.querySelector('.music-video video').paused);
    await audio.evaluate(a => a.dispatchEvent(new Event('playing')));
    await page.waitForFunction(() => !document.querySelector('.music-video video').paused);
    await audio.evaluate(a => a.pause());
  }
  await audio.evaluate(a => { a.currentTime = 18; });
  await page.locator('.music-video[data-active=false]').waitFor();
  assert.equal(await video.evaluate(v => v.paused), true);
  await page.getByRole('button', { name: 'Ajustes de reprodução' }).click();
  await page.getByRole('slider', { name: 'Ajuste fino da letra e do jogo' }).fill('500');
  await page.getByRole('button', { name: 'Ajustes de reprodução' }).click();
  await audio.evaluate(a => { a.currentTime = 150; });
  await page.waitForFunction(() => Math.abs(document.querySelector('.music-video video').currentTime - 150.5) < .2);
  await page.getByRole('button', { name: 'Ajustes de reprodução' }).click();
  await page.getByRole('slider', { name: 'Ajuste fino da letra e do jogo' }).fill('0');
  await page.getByRole('button', { name: 'Ajustes de reprodução' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => !document.querySelector('.music-video video'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await audio.evaluate(a => a.play());
  const beforeLoss = await audio.evaluate(a => a.currentTime);
  await page.locator('.clip-city-scene canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.locator('.clip-city-scene .music-scene[data-renderer=static]').waitFor();
  await page.waitForTimeout(300); assert.ok(await audio.evaluate(a => a.currentTime) > beforeLoss);
  await audio.evaluate(a => a.pause());
  // Reopen to test an early question without advancing past its round.
  await page.keyboard.press('Escape'); await page.locator('.music-card[data-track-id="stay-at-your-house-local"]').click();
  await page.getByRole('button', { name: 'Começar a jogar' }).click();
  const fresh = buildMusicRounds(lesson, 'challenge', Number(await page.locator('.clip-game').getAttribute('data-session-seed')));
  await audio.evaluate((a,t) => { a.currentTime = t; a.pause(); }, fresh[0].opens + .05);
  await page.locator('.clip-options').waitFor();
  for (const [width,height] of [[320,568],[360,800],[390,844],[430,932],[844,390]]) {
    await page.setViewportSize({width,height}); await page.waitForTimeout(100);
    const box = await page.locator('.clip-options').boundingBox();
    assert.ok(box.y >= 0 && box.y + box.height <= height, `answers clipped ${width}x${height}`);
    assert.ok(await page.locator('.listen-content').evaluate(e => e.scrollHeight <= e.clientHeight + 1));
    assert.equal(await page.locator('.clip-unified-lyrics p').last().evaluate(e => getComputedStyle(e).fontFamily.includes('Chakra Petch')), true);
    await page.screenshot({path:`${folder}/question-${width}.png`});
  }
  await audio.evaluate(async(a,end) => { a.currentTime=end-.1; await a.play(); },lesson.duration);
  await page.getByRole('button',{name:'Revisar letra'}).click();
  await page.getByRole('button',{name:'Voltar ao resultado'}).click();
  await page.getByRole('button',{name:'Explorar palavras'}).click();
  await page.getByRole('button',{name:'Voltar ao resultado'}).click();
  await page.getByRole('button',{name:'Ver conquistas e recordes'}).click();
  await page.getByRole('heading',{name:'Recordes e conquistas'}).waitFor();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.music-card[data-track-id="stay-at-your-house-local"]').click();
  await page.getByRole('button', { name: /Sem pistas/ }).click();
  await page.getByRole('button', { name: 'Começar a jogar' }).click();
  const typed = buildMusicRounds(lesson, 'typing', Number(await page.locator('.clip-game').getAttribute('data-session-seed')));
  await audio.evaluate((a, time) => { a.currentTime = time; a.pause(); }, typed[0].opens + .05);
  await page.getByRole('textbox', { name: 'Palavra que você ouviu' }).focus();
  await page.evaluate(() => {
    Object.defineProperty(window.visualViewport, 'height', { configurable: true, value: 390 });
    window.visualViewport.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(200);
  const input = await page.getByRole('textbox', { name: 'Palavra que você ouviu' }).boundingBox();
  assert.ok(input.y >= 0 && input.y + input.height <= 390);
  await page.screenshot({ path: `${folder}/typing-keyboard.png` });
  assert.deepEqual(errors, []);
  console.log(`PASS: Cyberpunk ${lesson.lines.length} lines, 24 deterministic rounds, audio/video Range, private allowlist, corrected sync/speeds/buffering, reduced motion, WebGL fallback, mobile answers and result-only navigation.`);
} finally { await browser.close(); }
