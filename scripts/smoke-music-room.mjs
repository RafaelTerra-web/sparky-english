import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { musicBrowserOptions, musicBaseURL, musicSessionOptions } from './music-smoke-browser.mjs';

const browser = await chromium.launch(musicBrowserOptions);
try {
  const page = await browser.newPage({ ...musicSessionOptions, viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(musicBaseURL);
  await page.getByRole('button', { name: 'Músicas', exact: true }).click();
  await page.locator('.music-card[data-track-id="perfect-local"]').click();
  const room = page.locator('dialog.listen-room');
  await room.waitFor({ state: 'visible' });
  assert.equal(await room.evaluate(el => el.matches(':modal')), true);
  await page.waitForFunction(() => document.querySelector('.listen-dock audio')?.readyState >= 1);
  assert.ok(Math.abs(await page.locator('.listen-dock audio').evaluate(a => a.volume) - .6) < .001);
  await page.getByRole('button', { name: 'Ajustes de reprodução' }).click();
  await page.getByRole('slider', { name: 'Volume da música' }).fill('100');
  assert.equal(await page.locator('.listen-dock audio').evaluate(a => a.volume), 1);
  await page.getByRole('button', { name: 'Ajustes de reprodução' }).click();
  const catalog = await page.evaluate(async () => (await (await fetch('/api/music')).json()).catalog);
  const lesson = catalog[0];
  await page.getByRole('button', { name: 'Letra', exact: true }).click();
  for (const [index, line] of lesson.lines.entries()) {
    const word = line.words[Math.min(1, line.words.length - 1)];
    const at = (word.start + word.end) / 2;
    await page.locator('.listen-dock audio').evaluate((a, time) => { a.currentTime = time; }, at);
    await page.waitForFunction(i => document.querySelector('.music-line.current')?.getAttribute('data-line') === String(i), index);
    assert.equal(await page.locator('.current-word').innerText(), word.text);
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await room.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `room overflow at ${width}`);
    assert.equal(await room.evaluate(el => Math.round(el.getBoundingClientRect().width)), width);
  }
  assert.equal(await page.getByRole('button', { name: 'Minha voz', exact: true }).count(),0);
  await page.getByRole('button', { name: 'Conquistas', exact: true }).click();
  await page.getByRole('heading', { name: 'Recordes e conquistas' }).waitFor();
  await page.getByRole('button', { name: 'Letra', exact: true }).click();
  // The old excerpt endpoint must no longer stop the full song.
  await page.locator('.listen-dock audio').evaluate(async a => { a.currentTime = 47.5; await a.play(); });
  await page.waitForFunction(() => document.querySelector('.listen-dock audio')?.currentTime > 48);
  assert.equal(await page.locator('.listen-dock audio').evaluate(a => a.paused), false);
  const end = lesson.duration;
  await page.locator('.listen-dock audio').evaluate(async (a, end) => { a.currentTime = end - .2; await a.play(); }, end);
  await page.waitForFunction(() => document.querySelector('.listen-dock audio')?.paused);
  assert.ok(Math.abs(await page.locator('.listen-dock audio').evaluate(a => a.currentTime) - end) < .1);
  await page.keyboard.press('Escape');
  await room.waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  assert.deepEqual(errors, []);
  console.log(`PASS: modal isolation, safe gain, all ${lesson.lines.length} line/word cues, responsive widths, achievements replace voice tab, playback beyond 48s through full track, Escape cleanup`);
} finally { await browser.close(); }
