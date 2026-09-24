import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { musicBrowserOptions, musicBaseURL } from './music-smoke-browser.mjs';
import { buildMusicRounds, musicAnswerOpens } from '../src/lib/music-game.ts';

assert.ok(['127.0.0.1', 'localhost'].includes(new URL(musicBaseURL).hostname));
await mkdir('.music-lab/interface-review', { recursive: true });
const browser = await chromium.launch(musicBrowserOptions);
const errors = [];
try {
  for (const [width, height] of [[1440, 1000], [390, 844], [320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height }, serviceWorkers: 'block' });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('sparky-appearance-v1', JSON.stringify({ palette: 'sparky', mode: 'light' }));
      window.__vibrations = [];
      Object.defineProperty(navigator, 'vibrate', { value: duration => { window.__vibrations.push(duration); return true; } });
    });
    await page.goto(musicBaseURL);
    await page.locator('.today-overview').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const toast = page.getByRole('button', { name: 'Fechar celebração da sequência' });
    if (await toast.isVisible()) await toast.click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Home must not overflow horizontally');
    if (width > 1000) assert.ok(await page.locator('.today-overview').evaluate(el => el.clientWidth > 850), 'Desktop uses available space');
    await page.screenshot({ path: `.music-lab/interface-review/home-${width}.png`, fullPage: true });
    if (width < 700) {
      await page.locator('.lesson-card').last().scrollIntoViewIfNeeded();
      const last = await page.locator('.lesson-card').last().boundingBox();
      const nav = await page.locator('.mobile-nav').boundingBox();
      assert.ok(last.y + last.height <= nav.y, 'Last home action clears mobile navigation');
    }
    await page.getByRole('button', { name: 'Músicas', exact: true }).click();
    await page.locator('button[data-track-id]').first().waitFor();
    assert.equal(await page.locator('button[data-track-id]').count(), 4);
    await page.screenshot({ path: `.music-lab/interface-review/music-${width}.png`, fullPage: true });
    for (const id of ['perfect-local', 'heartless-local', 'stay-at-your-house-local', 'buttercup-local']) {
      await page.locator(`button[data-track-id="${id}"]`).click();
      const start = page.getByRole('button', { name: 'Começar a jogar', exact: true });
      await start.waitFor();
      assert.equal(await page.locator('.clip-levels button').count(), 5);
      assert.equal(await page.locator('.clip-chorus-fx').count(), 1);
      assert.equal(await page.locator('.clip-city-scene').count(), id === 'stay-at-your-house-local' ? 1 : 0);
      assert.ok(await page.locator('.listen-shell').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      await page.screenshot({ path: `.music-lab/interface-review/${id}-${width}.png` });
      if (id === 'perfect-local') {
        await page.getByRole('button', { name: 'Nível 4', exact: false }).click();
        await page.getByRole('button', { name: '2×', exact: true }).click();
        await start.click();
        await page.waitForFunction(() => document.querySelector('.listen-dock audio')?.paused === false);
        const catalog = await page.evaluate(async () => (await (await fetch('/api/music')).json()).catalog);
        const lesson = catalog.find(track => track.id === id);
        const rounds = buildMusicRounds(lesson, 'level4', Number(await page.locator('.clip-game').getAttribute('data-session-seed')));
        assert.equal(rounds.length, 32);
        assert.equal(await page.locator('audio').evaluate(audio => audio.playbackRate), 2);
        await page.getByRole('button', { name: '1,5×', exact: true }).click();
        assert.equal(await page.locator('audio').evaluate(audio => audio.playbackRate), 1.5);
        const round = rounds[0];
        await page.locator('audio').evaluate((audio, time) => { audio.pause(); audio.currentTime = time; }, round.revealAt + .3);
        await page.waitForTimeout(150);
        const target = page.locator(`[data-lyric-id="${round.line.id}"] [data-word="${round.target}"]`);
        assert.equal(await target.getAttribute('data-masked'), 'true', 'Preview must never reveal target');
        const entrance = await target.evaluate(el => getComputedStyle(el).getPropertyValue('--word-entrance'));
        await page.waitForTimeout(100);
        assert.equal(await target.evaluate(el => getComputedStyle(el).getPropertyValue('--word-entrance')), entrance, 'Paused reveal freezes');
        await page.locator('audio').evaluate(async (audio, time) => { audio.currentTime = time; await audio.play(); }, musicAnswerOpens(round, 1.5) + .04);
        await page.locator('.clip-options button:enabled').first().waitFor();
        await page.waitForTimeout(650);
        const lyric = page.locator('.clip-unified-lyrics [data-question=true]');
        assert.equal(await lyric.count(), 1);
        assert.ok(await lyric.evaluate(el => Number(getComputedStyle(el).opacity) > .9), 'Question remains legible');
        const options = await page.locator('.clip-options').boundingBox();
        assert.ok(options.y >= 0 && options.y + options.height <= height, 'Answers fit in viewport');
        const speedBox = await page.locator('.clip-speed-control').boundingBox();
        const rankBox = await page.locator('.clip-rank-progress').boundingBox();
        assert.ok(speedBox.y + speedBox.height <= rankBox.y + 1, 'Speed controls do not overlap rank');
        const wordBox = await target.boundingBox();
        await page.screenshot({ path: `.music-lab/interface-review/question-${width}.png` });
        await page.locator('.clip-options').evaluateAll((groups, expected) => {
          const active = groups.find(group => [...group.querySelectorAll(':scope > button')].some(button => !button.disabled));
          const buttons = [...(active?.querySelectorAll(':scope > button') ?? [])];
          buttons.find(button => button.textContent?.includes(expected))?.click();
        }, round.answer);
        await page.locator('[data-score="100"]').waitFor();
        assert.ok(Math.abs((await target.boundingBox()).width - wordBox.width) < 1, 'Answer reveal preserves word width');
        assert.deepEqual(await page.evaluate(() => window.__vibrations), [12]);
        await page.getByRole('button', { name: 'Pausar jogo' }).click();
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal(await page.locator('.clip-energy-highlight').evaluate(el => getComputedStyle(el).display), 'none');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      }
      if (id === 'buttercup-local') {
        await page.getByRole('button', { name: 'Todas as palavras', exact: false }).click();
        await start.click();
        const catalog = await page.evaluate(async () => (await (await fetch('/api/music')).json()).catalog);
        const lesson = catalog.find(track => track.id === id);
        const rounds = buildMusicRounds(lesson, 'quick', Number(await page.locator('.clip-game').getAttribute('data-session-seed')));
        assert.ok(rounds.every(round => round.targets.length === round.line.words.length));
        const round = rounds[0];
        await page.locator('audio').evaluate((audio, time) => { audio.pause(); audio.currentTime = time; }, round.revealAt + .1);
        await page.locator('.clip-unified-lyrics [data-question=true]').waitFor();
        assert.equal(await page.locator('.clip-unified-lyrics [data-question=true] [data-masked=true]').count(), round.line.words.length);
        const optionCounts = await page.locator('.clip-options[data-multi=true]').evaluateAll(groups => groups.map(group => group.querySelectorAll(':scope > button').length));
        assert.ok(optionCounts.length > 0 && optionCounts.every(count => count === 4));
        await page.screenshot({ path: `.music-lab/interface-review/buttercup-quick-${width}.png` });
      }
      await page.keyboard.press('Escape');
    }
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `.music-lab/interface-review/music-dark-${width}.png`, fullPage: true });
    await page.close();
  }
  const login = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  await login.goto('http://127.0.0.1:3220');
  await login.locator('.login-intro').waitFor();
  await login.evaluate(() => document.fonts.ready);
  await login.screenshot({ path: '.music-lab/interface-review/login-desktop.png', fullPage: true });
  await login.setViewportSize({ width: 390, height: 844 });
  await login.screenshot({ path: '.music-lab/interface-review/login-mobile.png', fullPage: true });
  await login.close();
  assert.deepEqual(errors, []);
  console.log('PASS: desktop/mobile, restored track visuals, four levels, 1.5x and 2x, masked previews, paused fades, answer viewport, score, haptic, reduced motion and no runtime errors.');
} finally { await browser.close(); }
