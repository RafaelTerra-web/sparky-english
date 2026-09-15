import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { buildMusicRounds } from '../src/lib/music-game.ts';
import { musicBrowserOptions, musicBaseURL, musicSessionOptions } from './music-smoke-browser.mjs';

const browser = await chromium.launch(musicBrowserOptions);
const screenshots = '.music-lab/observatory-review';
await mkdir(screenshots, { recursive: true });
try {
  const page = await browser.newPage({ ...musicSessionOptions, viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  await page.addInitScript(() => {
    window.__musicDraws = 0;
    for (const name of ['drawElements', 'drawArrays']) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function (...args) {
        window.__musicDraws++;
        return original.apply(this, args);
      };
    }
  });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(musicBaseURL);
  await page.getByRole('button', { name: 'Músicas', exact: true }).click();
  await page.locator('.music-card[data-track-id="heartless-local"]').waitFor();
  const catalog = await page.evaluate(async () => (await (await fetch('/api/music')).json()).catalog);
  assert.equal(catalog.length, 2);
  for (const [id, version, lines, words, vocabulary] of [
    ['perfect-local', 'full-song-timing-2', 49, 285, 127],
    ['heartless-local', 'heartless-timing-1', 84, 435, 196],
  ]) {
    const lesson = catalog.find(track => track.id === id);
    assert.equal(lesson.version, version); assert.equal(lesson.lines.length, lines);
    assert.equal(lesson.vocabulary.length, vocabulary);
    assert.equal(lesson.lines.flatMap(line => line.words).length, words);
    const range = await page.request.get(new URL(lesson.source, musicBaseURL).href, { headers: { Range: 'bytes=0-127' } });
    assert.equal(range.status(), 206); assert.equal((await range.body()).length, 128);
    for (let seed = 0; seed < 100; seed++) for (const difficulty of ['guided', 'challenge', 'typing']) {
      const rounds = buildMusicRounds(lesson, difficulty, seed);
      assert.equal(rounds.length, 24);
      assert.ok(rounds.at(-1).closes <= lesson.duration);
      for (let i = 1; i < rounds.length; i++) assert.ok(rounds[i].countdownStart >= rounds[i - 1].closes - 1e-8);
    }
  }
  const status = await page.request.get(new URL('/api/music/audio?trackId=unknown', musicBaseURL).href);
  assert.equal(status.status(), 404);
  const progress = id => new URL(`/api/media-progress?trackId=${id}`, musicBaseURL).href;
  const original = await (await page.request.get(progress('perfect-local'))).json();
  const before = await (await page.request.get(progress('heartless-local'))).json();
  const saved = await page.request.patch(new URL('/api/media-progress', musicBaseURL).href, { headers: { Origin: new URL(musicBaseURL).origin }, data: { trackId: 'heartless-local', baseRevision: before.revision, state: before } });
  assert.equal(saved.status(), 200);
  const after = await saved.json(); assert.equal(after.revision, before.revision + 1);
  assert.deepEqual(await (await page.request.get(progress('heartless-local'))).json(), after);
  assert.deepEqual(await (await page.request.get(progress('perfect-local'))).json(), original);

  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${screenshots}/library-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${screenshots}/library-mobile.png`, fullPage: true });
  await page.locator('.music-card[data-track-id="heartless-local"]').click();
  const lesson = catalog.find(track => track.id === 'heartless-local');
  const audio = page.locator('.listen-dock audio');
  await page.waitForFunction(() => document.querySelector('.listen-dock audio')?.readyState >= 1);
  assert.ok(Math.abs(await audio.evaluate(a => a.duration) - lesson.duration) < .1);
  assert.equal(await audio.evaluate(a => a.volume), .6);
  await page.screenshot({ path: `${screenshots}/heartless-setup.png` });
  await page.getByRole('button', { name: 'Começar a jogar' }).click();
  const rounds = buildMusicRounds(lesson, 'challenge', Number(await page.locator('.clip-game').getAttribute('data-session-seed')));
  const round = rounds[1];
  await audio.evaluate((a, time) => { a.currentTime = time; a.pause(); }, round.countdownStart + .5);
  await page.locator('.clip-round[data-state=waiting]').waitFor();
  await page.locator('.clip-prompt-slot .clip-ambient[data-visible=true]').waitFor();
  assert.equal(await page.locator('.clip-countdown.is-visible').count(), 0);
  assert.ok(await page.locator('.clip-prompt-slot .clip-ambient p').count() > 0);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${screenshots}/heartless-countdown.png` });
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    assert.ok(await page.locator('.listen-content').evaluate(el => el.scrollHeight <= el.clientHeight + 2), `Gameplay overflow at ${width}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${screenshots}/countdown-${width}.png` });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.clip-countdown strong').evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.locator('.clip-media .music-scene[data-renderer=webgl]').waitFor();
  await audio.evaluate(a => a.play());
  await page.waitForTimeout(300);
  const staticDraws = await page.evaluate(() => window.__musicDraws);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => window.__musicDraws), staticDraws, 'Reduced motion must stop GPU drawing even as the media clock advances');
  await audio.evaluate(a => a.pause());
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await audio.evaluate((a, time) => { a.currentTime = time; }, round.opens + .05);
  await page.locator('.clip-round[data-state=answering]').waitFor();
  assert.equal(await page.locator('.clip-ambient[data-visible=true]').count(), 0, 'Active answer must not expose the hidden word');
  await page.locator('.clip-media canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.locator('.clip-media .music-scene[data-renderer=static]').waitFor();
  const fallbackTime = await audio.evaluate(a => { void a.play(); return a.currentTime; });
  await page.waitForTimeout(300);
  assert.ok(await audio.evaluate(a => a.currentTime) > fallbackTime, 'Playback must survive loss of the decorative WebGL context');
  assert.deepEqual(errors, []);
  console.log('PASS: two independent tracks, both Range 206, distinct saved progress, 24 rounds at all levels, Heartless full audio, no recurring countdown, continuous lyrics, three mobile sizes, reduced-motion GPU idle, WebGL fallback without audio interruption.');
} finally { await browser.close(); }
