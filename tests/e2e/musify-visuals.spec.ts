import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { buildMusicRounds } from '../../src/lib/music-game';
import type { MusicLesson } from '../../src/lib/music';
import { musicVisualTimeline } from '../../src/lib/music-visual-timeline';

// An isolated account and silent media make lifecycle checks deterministic.
// Real song structure remains supplied by the production visual timelines.
const names = [
  ['still-into-you', 'Still Into You', 45.50],
  ['do-i-wanna-know', 'Do I Wanna Know?', 94.98],
  ['she-knows', 'She Knows', 80.92],
  ['made-for-loving-you', 'I Was Made for Lovin’ You', 73.92],
  ['savage', 'Savage', 33.38],
  ['out-of-order', 'Out of Order', 50.04],
  ['king-for-a-day', 'King for a Day', 101.54],
  ['perfect-local', 'Perfect', 61.66],
  ['heartless-local', 'Heartless', 30.56],
  ['stay-at-your-house-local', 'I Really Want to Stay at Your House', 59.80],
  ['buttercup-local', 'Buttercup', 48.18],
] as const;

const phrase = 'I keep remembering all those beautiful butterflies tonight';
const translation = 'Eu continuo lembrando de todas aquelas lindas borboletas esta noite';
const catalog: MusicLesson[] = names.map(([id, title]) => ({
  id, title, artist: 'Visual fixture', version: 'musify-visuals-test', level: 'B1', topic: 'Listening', duration: musicVisualTimeline(id)!.duration,
  source: `/api/music/audio?trackId=${id}`,
  ...(['still-into-you', 'do-i-wanna-know', 'she-knows', 'savage', 'king-for-a-day', 'stay-at-your-house-local', 'buttercup-local'].includes(id)
    ? { visualSource: `/api/music/video?trackId=${id}` } : {}),
  rights: 'user-provided', published: true, translationAlignmentVersion: 'editorial-1',
  lines: [4, musicVisualTimeline(id)!.duration - 40, musicVisualTimeline(id)!.duration - 20].map((start, i) => ({
    id: `visual-line-${i}`, start, end: start + 4, text: phrase, translation, tip: 'Listen carefully.', tipLanguage: 'en',
    words: phrase.split(' ').map((text, index) => ({
      text, start: start + index * .4, end: start + (index + 1) * .4,
      challengeEligible: index === 6,
      ...(index === 6 ? { translationSpans: [{ start: translation.indexOf('borboletas'), end: translation.indexOf('borboletas') + 'borboletas'.length }] } : {}),
    })),
  })),
  vocabulary: [{ id: 'butterflies', word: 'butterflies', meaning: 'borboletas', ipa: '/ˈbʌtərflaɪz/', usage: 'Feeling', example: 'Butterflies fly.' }],
  questions: [{ id: 'visual-q', prompt: 'What did you hear?', options: ['butterflies', 'flowers', 'lights'], answer: 0, explanation: 'Listen for the word.' }],
}));
const wav = Buffer.alloc(44 + 360 * 8000 * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);

function serveAudio(route: Route) {
  const range = /^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range || '');
  const start = range ? Number(range[1]) : 0;
  if (start >= wav.length) return route.fulfill({ status: 416, headers: { 'content-range': `bytes */${wav.length}` } });
  const end = Math.min(range?.[2] ? Number(range[2]) : wav.length - 1, wav.length - 1);
  return route.fulfill({
    status: range ? 206 : 200, contentType: 'audio/wav', body: wav.subarray(start, end + 1),
    headers: { 'accept-ranges': 'bytes', 'content-length': String(end - start + 1), ...(range ? { 'content-range': `bytes ${start}-${end}/${wav.length}` } : {}) },
  });
}

async function open(page: Page, english = false, mode: 'auto' | 'reduced' | 'off' = 'auto') {
  await page.addInitScript(({ english, mode }) => {
    localStorage.setItem('sparky-opening-seen-v4', '1');
    localStorage.setItem('sparky-interface-language', english ? 'en' : 'pt-BR');
    localStorage.setItem('sparky-support-language', english ? 'en' : 'pt-BR');
    localStorage.setItem('sparky-language:musify-visuals', english ? 'en' : 'pt-BR');
    localStorage.setItem('sparky-support-language:musify-visuals', english ? 'en' : 'pt-BR');
    if (localStorage.getItem('sparky-music-effects-v1') === null) localStorage.setItem('sparky-music-effects-v1', mode);
  }, { english, mode });
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: true, user: { id: 'musify-visuals', name: 'Ana', email: 'visuals@example.test' } } }));
  await page.route('**/api/rewards', route => route.fulfill({ json: { storage: 'account', coins: 0, completed: {}, reviews: {}, owned: [], mascot: 'sparky', equipped: { sparky: {}, pinky: {} } } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/music', route => route.fulfill({ json: { catalog, storage: 'account' } }));
  await page.route('**/api/media-progress*', route => route.fulfill({ json: { version: 'musify-visuals-test', revision: 0, position: 0, positionAt: 0 } }));
  await page.route('**/api/music/audio*', serveAudio);
  await page.route('**/api/music/video*', route => route.fulfill({ status: 503 }));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', english ? 'en' : 'pt-BR');
}

async function music(page: Page, english = false) {
  await page.getByRole('button', { name: english ? 'Practice' : 'Praticar', exact: true }).click();
  await page.getByRole('button', { name: english ? /^Music / : /^Músicas / }).click();
  await expect(page.getByRole('heading', { name: 'Musify', exact: true })).toBeVisible();
}

async function start(page: Page, id = 'still-into-you', english = false) {
  await page.locator(`[data-track-id="${id}"]`).click();
  const game = page.locator('.clip-game');
  await game.getByRole('button', { name: '0,5×', exact: true }).click();
  await game.getByRole('button', { name: english ? 'Start playing' : 'Começar a jogar', exact: true }).click();
  await expect(game).toHaveAttribute('data-playing', 'true');
  return { game, stage: game.locator('.musify-stage') };
}

async function seek(page: Page, time: number) {
  await page.locator('audio').evaluate((audio: HTMLAudioElement, time) => new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Media seek did not finish')), 4000);
    audio.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true });
    audio.currentTime = time;
  }), time);
}

async function visibility(page: Page, hidden: boolean) {
  await page.evaluate(hidden => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

async function expectControlsFit(game: Locator) {
  // The header is a sibling of the game, not one of its descendants.
  const actualHeader = await game.page().getByRole('dialog').locator('.listen-header').boundingBox();
  for (const selector of ['.clip-scorebar', '.clip-lives', '[data-question=true]', '.clip-options button']) {
    for (const node of await game.locator(selector).all()) {
      await expect(node).toBeVisible();
      await expect(node).toBeInViewport({ ratio: 1 });
      const box = await node.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual((actualHeader?.y ?? 0) + (actualHeader?.height ?? 0) - 1);
    }
  }
  await expect(game.locator('.clip-options button')).toHaveCount(4);
  await expect(game.locator('.clip-scorebar small,.clip-dots,.clip-round-top > span:nth-child(2)')).toHaveCount(0);
  expect(await game.page().evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

test('all eleven songs render distinct scenes and enter their audited first chorus', async ({ page }, info) => {
  await open(page);
  await music(page);
  const scenes = new Set<string>();
  for (const [id, , firstChorus] of names) {
    const { game, stage } = await start(page, id);
    await expect(stage).toHaveAttribute('data-track-id', id);
    await expect(stage).toHaveAttribute('aria-hidden', 'true');
    await expect(stage).toHaveAttribute('data-mode', 'auto');
    await expect(stage).toHaveAttribute('data-running', 'true');
    const scene = await stage.getAttribute('data-scene');
    expect(scene).toBeTruthy();
    scenes.add(scene!);
    await seek(page, firstChorus - .5);
    await expect(stage).not.toHaveAttribute('data-section', 'chorus');
    await seek(page, firstChorus + .1);
    await expect(stage).toHaveAttribute('data-section', 'chorus');
    await expect.poll(() => stage.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if (!context) return false;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) return true;
      return false;
    })).toBe(true);
    await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '2');
    if (id === 'still-into-you' || id === 'made-for-loving-you' || id === 'heartless-local') {
      await page.screenshot({ path: info.outputPath(`musify-1-2-${id}.png`) });
    }
    await page.getByRole('button', { name: 'Todas as músicas', exact: true }).click();
    await expect(page.locator('.musify-stage')).toHaveCount(0);
  }
  expect(scenes.size, 'each song needs a different choreography, not only a palette').toBe(11);
});

test('butterfly cues stay hidden while the word is pending and effects protect the complete game', async ({ page }, info) => {
  await open(page);
  await music(page);
  const { game, stage } = await start(page);
  const rounds = buildMusicRounds(catalog[0], 'level1', Number(await game.getAttribute('data-session-seed')));
  expect(rounds[0].answer).toBe('butterflies');
  await seek(page, rounds[0].opens + .15);
  await expect(game.locator('.clip-round')).toHaveAttribute('data-state', 'answering');
  await expect(stage).toHaveAttribute('data-semantic-suppressed', 'true');
  await expect(stage).toHaveAttribute('data-cue', '');
  await expect(game.locator('[data-question=true] .clip-word-mask')).toHaveCount(1);
  await expect(game.locator('[data-question=true] .clip-translation-mask')).toHaveCount(1);
  await expectControlsFit(game);
  expect(await stage.locator('canvas').evaluate(canvas => getComputedStyle(canvas).pointerEvents)).toBe('none');
  await expect.poll(async () => Number(await stage.getAttribute('data-protected-count'))).toBeGreaterThanOrEqual(4);
  await expect.poll(() => game.evaluate(host => {
    const canvas = host.querySelector<HTMLCanvasElement>('.musify-stage canvas')!;
    const context = canvas.getContext('2d')!;
    const bounds = canvas.getBoundingClientRect();
    return [...host.querySelectorAll<HTMLElement>('.clip-scorebar,.clip-lives,[data-question=true] .clip-lyric-row,[data-question=true] .clip-phrase-translation,.clip-options button')].every(control => {
      const box = control.getBoundingClientRect();
      const x = Math.round((box.left + box.width / 2 - bounds.left) * canvas.width / bounds.width);
      const y = Math.round((box.top + box.height / 2 - bounds.top) * canvas.height / bounds.height);
      return x >= 0 && y >= 0 && x < canvas.width && y < canvas.height && context.getImageData(x, y, 1, 1).data[3] === 0;
    });
  })).toBe(true);
  await page.screenshot({ path: info.outputPath('musify-1-2-protected-answer.png') });
  await game.locator('.clip-options button').filter({ hasText: 'butterflies' }).click();
  await expect(game.locator('.clip-round')).toHaveAttribute('data-state', 'answered');
  // A later challenge can ask the same word: answering once must not reveal
  // narrative art that would give the next answer away.
  await expect(stage).toHaveAttribute('data-semantic-suppressed', 'true');
  await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
  const points = Number(await game.locator('[data-score]').getAttribute('data-score'));
  expect(points).toBeGreaterThanOrEqual(25);
  expect(points).toBeLessThanOrEqual(100);
  for (const round of rounds.slice(1)) {
    await seek(page, round.opens + .1);
    await expect(game.locator('.clip-round')).toHaveAttribute('data-round', String(round.index));
    await game.locator('.clip-options button').filter({ hasText: round.answer }).click();
    await expect(game.locator('.clip-round')).toHaveAttribute('data-state', 'answered');
  }
  await expect(stage).toHaveAttribute('data-semantic-suppressed', 'false');
  await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
});

test('backgrounding, buffering and seeking freeze or reconstruct the scene without changing a validated answer', async ({ page }) => {
  await open(page);
  await music(page);
  const { game, stage } = await start(page);
  const round = buildMusicRounds(catalog[0], 'level1', Number(await game.getAttribute('data-session-seed')))[0];
  await seek(page, round.opens + .15);
  await game.locator('.clip-options button').filter({ hasText: round.answer }).click();
  const score = await game.locator('[data-score]').getAttribute('data-score');
  const seed = await game.getAttribute('data-session-seed');
  await seek(page, 20);
  await expect(stage).toHaveAttribute('data-running', 'true');
  await visibility(page, true);
  await expect(stage).toHaveAttribute('data-running', 'false');
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
  const stoppedAt = Number(await stage.getAttribute('data-scene-time'));
  await page.waitForTimeout(240);
  expect(Number(await stage.getAttribute('data-scene-time'))).toBeCloseTo(stoppedAt, 2);
  await visibility(page, false);
  await expect(stage).toHaveAttribute('data-running', 'true');
  await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.dispatchEvent(new Event('waiting')));
  await expect(stage).toHaveAttribute('data-running', 'false');
  await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.dispatchEvent(new Event('playing')));
  await expect(stage).toHaveAttribute('data-running', 'true');
  await seek(page, 45.65);
  await expect(stage).toHaveAttribute('data-section', 'chorus');
  await seek(page, 20);
  await expect(stage).not.toHaveAttribute('data-section', 'chorus');
  await expect.poll(async () => Math.abs(Number(await stage.getAttribute('data-scene-time')) - await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime))).toBeLessThan(.15);
  await expect(game).toHaveAttribute('data-session-seed', seed!);
  await expect(game.locator('[data-score]')).toHaveAttribute('data-score', score!);
  await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
});

test('refreshing an expired media link preserves position, speed, validated answer and hearts', async ({ page }) => {
  await open(page);
  await music(page);
  const { game } = await start(page);
  const round = buildMusicRounds(catalog[0], 'level1', Number(await game.getAttribute('data-session-seed')))[0];
  await seek(page, round.opens + .15);
  await game.locator('.clip-options button').filter({ hasText: round.answer }).click();
  const score = await game.locator('[data-score]').getAttribute('data-score');
  const seed = await game.getAttribute('data-session-seed');
  await seek(page, 20);
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThanOrEqual(20);
  await page.locator('audio').evaluate((audio: HTMLAudioElement) => { audio.pause(); audio.dispatchEvent(new Event('error')); });
  await expect(game).toHaveAttribute('data-playing', 'false');
  const previousSource = await page.locator('audio').getAttribute('src');
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(game).toHaveAttribute('data-playing', 'true');
  await expect(page.locator('audio')).toHaveAttribute('src', /\/api\/music\/audio\?.*&retry=\d+$/);
  expect(await page.locator('audio').getAttribute('src')).not.toBe(previousSource);
  const restored = await page.locator('audio').evaluate((audio: HTMLAudioElement) => ({ position: audio.currentTime, speed: audio.playbackRate }));
  expect(restored.position).toBeGreaterThanOrEqual(19.9);
  expect(restored.position).toBeLessThan(22);
  expect(restored.speed).toBe(.5);
  await expect(game).toHaveAttribute('data-session-seed', seed!);
  await expect(game.locator('[data-score]')).toHaveAttribute('data-score', score!);
  await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
});

for (const english of [false, true]) {
  test(`music effect preferences persist through the settings UI (${english ? 'English' : 'Português'})`, async ({ page }) => {
    await open(page, english);
    await page.getByRole('button', { name: english ? 'Open settings' : 'Abrir configurações', exact: true }).click();
    const preference = page.getByRole('combobox', { name: english ? 'Music effects' : 'Efeitos das músicas', exact: true });
    await expect(preference).toHaveValue('auto');
    await preference.selectOption('reduced');
    await page.reload();
    await page.getByRole('button', { name: english ? 'Open settings' : 'Abrir configurações', exact: true }).click();
    await expect(preference).toHaveValue('reduced');
    await music(page, english);
    const reduced = await start(page, 'made-for-loving-you', english);
    await expect(reduced.stage).toHaveAttribute('data-mode', 'reduced');
    await expect(reduced.game).toHaveAttribute('data-playing', 'true');
    await page.getByRole('button', { name: english ? 'All songs' : 'Todas as músicas', exact: true }).click();
    await page.getByRole('button', { name: english ? 'Open settings' : 'Abrir configurações', exact: true }).click();
    await preference.selectOption('off');
    await page.reload();
    await music(page, english);
    const off = await start(page, 'made-for-loving-you', english);
    await expect(off.stage).toHaveAttribute('data-mode', 'off');
    await expect(off.stage).toHaveAttribute('data-running', 'false');
    await expect(off.game).toHaveAttribute('data-playing', 'true');
    const round = buildMusicRounds(catalog[3], 'level1', Number(await off.game.getAttribute('data-session-seed')))[0];
    await seek(page, round.opens + .1);
    await off.game.locator('.clip-options button').filter({ hasText: round.answer }).click();
    await expect(off.game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
    await expect(off.game.locator('.clip-round')).toHaveAttribute('data-state', 'answered');
  });
}

test('system reduced motion overrides automatic effects without blocking gameplay or revealing the answer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, true);
  await music(page, true);
  const { game, stage } = await start(page, 'still-into-you', true);
  await expect(stage).toHaveAttribute('data-running', 'false');
  await expect(stage).toHaveAttribute('data-mode', 'reduced');
  await expect(game.locator('video')).toHaveCount(0);
  const round = buildMusicRounds(catalog[0], 'level1', Number(await game.getAttribute('data-session-seed')))[0];
  await seek(page, round.opens + .1);
  await expect(game.locator('.clip-phrase-translation')).toHaveCount(0);
  await expect(game.locator('.clip-unified-lyrics')).toHaveAttribute('lang', 'en');
  await expectControlsFit(game);
  await game.locator('.clip-options button').filter({ hasText: round.answer }).click();
  await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
});

test('data saver resolves automatic effects to a static scene while the song remains playable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true, addEventListener() {}, removeEventListener() {} },
    });
  });
  await open(page);
  await music(page);
  const { game, stage } = await start(page);
  await expect(stage).toHaveAttribute('data-mode', 'reduced');
  await expect(stage).toHaveAttribute('data-running', 'false');
  await expect(game.locator('video')).toHaveCount(0);
  await expect(game).toHaveAttribute('data-playing', 'true');
  const round = buildMusicRounds(catalog[0], 'level1', Number(await game.getAttribute('data-session-seed')))[0];
  await seek(page, round.opens + .1);
  await game.locator('.clip-options button').filter({ hasText: round.answer }).click();
  await expect(game.locator('.clip-round')).toHaveAttribute('data-state', 'answered');
  await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
});
