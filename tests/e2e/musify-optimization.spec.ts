import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildMusicRounds } from '../../src/lib/music-game';
import type { MusicLesson } from '../../src/lib/music';

// The isolated account, catalog, silent WAV, and byte-range media routes follow
// musify.spec.ts. These regressions target the user's Samsung A55 viewport.
const names = [
  ['still-into-you', 'Still Into You'], ['do-i-wanna-know', 'Do I Wanna Know?'], ['she-knows', 'She Knows'],
  ['made-for-loving-you', 'I Was Made for Lovin’ You'], ['savage', 'Savage'], ['out-of-order', 'Out of Order'], ['king-for-a-day', 'King for a Day'],
];
const catalog: MusicLesson[] = names.map(([id, title]) => ({
  id, title, artist: 'Test Artist', version: 'musify-test', level: 'B1', topic: 'Listening', duration: 80,
  source: `/api/music/audio?trackId=${id}`,
  ...(['out-of-order', 'made-for-loving-you'].includes(id) ? {} : { visualSource: `/api/music/video?trackId=${id}` }),
  rights: 'user-provided', published: true, translationAlignmentVersion: 'editorial-1',
  lines: Array.from({ length: 8 }, (_, i) => ({
    id: `line-${i}`, start: 4 + i * 9, end: 7 + i * 9,
    text: 'I see butterflies tonight', translation: 'Vejo borboletas esta noite', tip: 'Listen carefully.',
    words: [
      { text: 'I', start: 4 + i * 9, end: 4.5 + i * 9, challengeEligible: false },
      { text: 'see', start: 4.5 + i * 9, end: 5 + i * 9, translationSpans: [{ start: 0, end: 4 }] },
      { text: 'butterflies', start: 5 + i * 9, end: 6 + i * 9, translationSpans: [{ start: 5, end: 15 }] },
      { text: 'tonight', start: 6 + i * 9, end: 7 + i * 9, translationSpans: [{ start: 16, end: 26 }] },
    ],
  })),
  vocabulary: [{ id: 'butterflies', word: 'butterflies', meaning: 'borboletas', ipa: '/ˈbʌtərflaɪz/', usage: 'Feeling', example: 'I saw butterflies.' }],
  questions: [{ id: 'q1', prompt: 'What did you hear?', options: ['butterflies', 'flowers', 'lights'], answer: 0, explanation: 'Listen for the word.' }],
}));
const longPhrase = 'I keep remembering all those beautiful butterflies tonight';
const longTranslation = 'Eu continuo lembrando de todas aquelas lindas borboletas esta noite';
const longCatalog = catalog.map(lesson => lesson.id !== 'still-into-you' ? lesson : {
  ...lesson,
  lines: lesson.lines.map((line, i) => ({
    ...line, text: longPhrase, translation: longTranslation,
    words: longPhrase.split(' ').map((text, index) => ({
      text, start: index < 6 ? 4 + i * 9 + index / 6 : index === 6 ? 5 + i * 9 : 6 + i * 9,
      end: index < 6 ? 4 + i * 9 + (index + 1) / 6 : index === 6 ? 6 + i * 9 : 7 + i * 9,
      challengeEligible: index >= 6,
      ...(index >= 6 ? { translationSpans: [{
        start: longTranslation.indexOf(index === 6 ? 'borboletas' : 'esta noite'),
        end: longTranslation.indexOf(index === 6 ? 'borboletas' : 'esta noite') + (index === 6 ? 'borboletas' : 'esta noite').length,
      }] } : {}),
    })),
  })),
});
const wav = Buffer.alloc(44 + 80 * 8000 * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);

function serveMedia(route: Route, bytes: Buffer, contentType: string) {
  const range = /^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range || '');
  const start = range ? Number(range[1]) : 0;
  if (start >= bytes.length) return route.fulfill({ status: 416, headers: { 'content-range': `bytes */${bytes.length}` } });
  const requestedEnd = range && range[2] ? Number(range[2]) : bytes.length - 1;
  // Chrome asks for bytes=0- when opening MP4s. Keep each intercepted response
  // bounded so a full HD song is never serialized through the CDP bridge.
  const end = Math.min(requestedEnd, bytes.length - 1, range ? start + 2 * 1024 * 1024 - 1 : bytes.length - 1);
  return route.fulfill({
    status: range ? 206 : 200, contentType, body: bytes.subarray(start, end + 1),
    headers: { 'accept-ranges': 'bytes', 'content-length': String(end - start + 1), ...(range ? { 'content-range': `bytes ${start}-${end}/${bytes.length}` } : {}) },
  });
}

async function open(page: Page, english = false, lessons = catalog) {
  await page.addInitScript(({ english }) => {
    localStorage.setItem('sparky-opening-seen-v4', '1');
    localStorage.setItem('sparky-interface-language', english ? 'en' : 'pt-BR');
    localStorage.setItem('sparky-support-language', english ? 'en' : 'pt-BR');
    localStorage.setItem('sparky-language:musify-test', english ? 'en' : 'pt-BR');
    localStorage.setItem('sparky-support-language:musify-test', english ? 'en' : 'pt-BR');
  }, { english });
  await page.route('**/api/session', route => route.fulfill({ json: { authenticated: true, user: { id: 'musify-test', name: 'Ana', email: 'musify@example.test' } } }));
  await page.route('**/api/rewards', route => route.fulfill({ json: { storage: 'account', coins: 0, completed: {}, reviews: {}, owned: [], mascot: 'sparky', equipped: { sparky: {}, pinky: {} } } }));
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/music', route => route.fulfill({ json: { catalog: lessons, storage: 'account' } }));
  await page.route('**/api/media-progress*', route => route.fulfill({ json: { version: 'musify-test', revision: 0, position: 0, positionAt: 0 } }));
  await page.route('**/api/music/audio*', route => serveMedia(route, wav, 'audio/wav'));
  await page.route('**/api/music/video*', route => route.fulfill({ status: 503 }));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', english ? 'en' : 'pt-BR');
  await page.getByRole('button', { name: english ? 'Practice' : 'Praticar', exact: true }).click();
  await page.getByRole('button', { name: english ? /^Music / : /^Músicas / }).click();
  await expect(page.getByRole('heading', { name: 'Musify', exact: true })).toBeVisible();
}

async function seek(page: Page, time: number) {
  await page.locator('audio').evaluate((audio: HTMLAudioElement, time) => new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Media seek did not finish')), 4000);
    audio.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true });
    audio.currentTime = time;
  }), time);
}

async function visibleBox(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function expectScoreBelowHeader(room: Locator) {
  const [header, score, lives] = await Promise.all([
    visibleBox(room.locator('.listen-header')),
    visibleBox(room.locator('.clip-scorebar')),
    visibleBox(room.locator('.clip-lives')),
  ]);
  expect(score.y, 'score row must clear the header').toBeGreaterThanOrEqual(header.y + header.height - 1);
  expect(lives.y, 'all three lives must clear the header').toBeGreaterThanOrEqual(header.y + header.height - 1);
  await expect(room.locator('.clip-scorebar')).toBeInViewport({ ratio: 1 });
  await expect(room.locator('.clip-lives')).toBeInViewport({ ratio: 1 });
}

async function expectNoRoundCounters(room: Locator) {
  await expect(room.locator('.clip-round-top > span:nth-child(2),.clip-scorebar small,.clip-dots')).toHaveCount(0);
}

async function expectRoundFits(room: Locator) {
  await expectScoreBelowHeader(room);
  await expectNoRoundCounters(room);
  const phrase = room.locator('[data-question=true]');
  await expect(phrase).toBeInViewport({ ratio: 1 });
  const options = room.locator('.clip-options button');
  await expect(options).toHaveCount(4);
  for (const option of await options.all()) {
    await expect(option).toBeEnabled();
    await expect(option).toBeInViewport({ ratio: 1 });
  }
  const geometry = await room.evaluate(element => {
    const view = window.visualViewport;
    const viewport = { left: view?.offsetLeft ?? 0, top: view?.offsetTop ?? 0, width: view?.width ?? innerWidth, height: view?.height ?? innerHeight };
    const selectors = ['.clip-scorebar', '.clip-lives', '[data-question=true] .clip-lyric-row', '[data-question=true] .clip-phrase-translation', '.clip-options button'];
    return {
      viewport,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1,
      boxes: selectors.flatMap(selector => [...element.querySelectorAll<HTMLElement>(selector)].map(node => {
        const box = node.getBoundingClientRect();
        return { selector, left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      })),
    };
  });
  expect(geometry.horizontalOverflow, 'the game must not overflow horizontally').toBe(false);
  for (const box of geometry.boxes) {
    expect(box.left, `${box.selector} left edge`).toBeGreaterThanOrEqual(geometry.viewport.left - 1);
    expect(box.right, `${box.selector} right edge`).toBeLessThanOrEqual(geometry.viewport.left + geometry.viewport.width + 1);
    expect(box.top, `${box.selector} top edge`).toBeGreaterThanOrEqual(geometry.viewport.top - 1);
    expect(box.bottom, `${box.selector} bottom edge`).toBeLessThanOrEqual(geometry.viewport.top + geometry.viewport.height + 1);
  }
}

const slogans = /Uma palavra\. Seu ritmo\.|One word\. Your rhythm\.|NO SEU RITMO|AT YOUR PACE|SPARKY SESSIONS/;

for (const english of [false, true]) {
  test(`setup and active game omit slogans and playback controls (${english ? 'English' : 'Português'})`, async ({ page }) => {
    await open(page, english);
    await expect(page.locator('body')).not.toContainText(slogans);
    await page.locator('[data-track-id="still-into-you"]').click();
    const room = page.getByRole('dialog', { name: 'Still Into You' });
    const game = room.locator('.clip-game');
    await expect(room).not.toContainText(slogans);
    await expectScoreBelowHeader(room);
    await expect(game.getByRole('group', { name: english ? 'Game speed' : 'Velocidade do jogo' })).toBeVisible();
    await room.getByRole('button', { name: english ? 'Start playing' : 'Começar a jogar', exact: true }).click();
    await expect(game).toHaveAttribute('data-playing', 'true');
    await expect(room).not.toContainText(slogans);
    await expect(room.locator('.clip-speed-control,.listen-transport,.listen-timeline,.clip-mini-play,.listen-settings')).toHaveCount(0);
    await expect(room.getByRole('button', { name: /Pausar jogo|Continuar jogo|Pausar música|Pause game|Resume game|Pause music/ })).toHaveCount(0);
    await expect(room.getByRole('button', { name: english ? 'Playback settings' : 'Ajustes de reprodução' })).toHaveCount(0);
    await expectScoreBelowHeader(room);
    await expectNoRoundCounters(room);
  });
}

test('mobile round keeps the score, three lives, masked phrase and four choices visible without scrolling', async ({ page }, info) => {
  await open(page, false, longCatalog);
  await page.locator('[data-track-id="still-into-you"]').click();
  const room = page.getByRole('dialog', { name: 'Still Into You' });
  const game = room.locator('.clip-game');
  // A slower supported speed leaves enough real media time to inspect and tap.
  await game.getByRole('button', { name: '0,5×', exact: true }).click();
  await room.getByRole('button', { name: 'Começar a jogar', exact: true }).click();
  await expect(game).toHaveAttribute('data-playing', 'true');
  const seed = Number(await game.getAttribute('data-session-seed'));
  const round = buildMusicRounds(longCatalog[0], 'level1', seed)[0];
  await seek(page, round.opens + .15);
  await expect(game.locator('.clip-round')).toHaveAttribute('data-state', 'answering');
  await expect(game.locator('[data-question=true] .clip-word-mask')).toHaveCount(1);
  await expect(game.locator('[data-question=true] .clip-translation-mask')).toHaveCount(1);
  await expectRoundFits(room);
  await page.screenshot({ path: info.outputPath('musify-mobile-answering.png') });
  const before = await room.locator('.listen-content').evaluate(element => element.scrollTop);
  const pageBefore = await page.evaluate(() => scrollY);
  await game.locator('.clip-options button').filter({ hasText: round.answer }).click();
  await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
  await expect(game.locator('.clip-round')).toHaveAttribute('data-state', 'answered');
  const points = Number(await game.locator('[data-score]').getAttribute('data-score'));
  expect(points).toBeGreaterThanOrEqual(25);
  expect(points).toBeLessThanOrEqual(100);
  expect(await room.locator('.listen-content').evaluate(element => element.scrollTop)).toBe(before);
  expect(await page.evaluate(() => scrollY)).toBe(pageBefore);
  await expectScoreBelowHeader(room);
});

test('late correct answers finish with grade D while preserving all three lives', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.locator('[data-track-id="still-into-you"]').click();
  const room = page.getByRole('dialog', { name: 'Still Into You' });
  const game = room.locator('.clip-game');
  await game.getByRole('button', { name: '0,5×', exact: true }).click();
  await room.getByRole('button', { name: 'Começar a jogar', exact: true }).click();
  await expect(game).toHaveAttribute('data-playing', 'true');
  const rounds = buildMusicRounds(catalog[0], 'level1', Number(await game.getAttribute('data-session-seed')));
  expect(rounds).toHaveLength(8);
  let previousScore = 0;
  for (const round of rounds) {
    // Half speed gives a real second to tap, while the remaining media window
    // earns a low, valid score rather than consuming a life for a timeout.
    await seek(page, round.closes - .5);
    await expect(game.locator('.clip-round')).toHaveAttribute('data-round', String(round.index));
    await game.locator('.clip-options button').filter({ hasText: round.answer }).click({ timeout: 1000 });
    await expect(game.locator('.clip-round')).toHaveAttribute('data-state', 'answered');
    await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
    const score = Number(await game.locator('[data-score]').getAttribute('data-score'));
    expect(score - previousScore).toBeGreaterThanOrEqual(25);
    expect(score - previousScore).toBeLessThanOrEqual(100);
    previousScore = score;
    await expectNoRoundCounters(room);
    await seek(page, round.closes + .03);
  }
  expect(previousScore).toBeLessThan(rounds.length * 100 * .4);
  await seek(page, catalog[0].duration);
  await expect(game).toHaveAttribute('data-phase', 'result');
  await expect(game).toHaveAttribute('data-playing', 'false');
  await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
  await expect(game.locator('.clip-result-rank')).toHaveAttribute('data-rank', 'D');
  await expect(game.locator('.clip-result-rank')).toHaveText('D');
  await expect(game.locator('[data-score]')).toHaveAttribute('data-score', String(previousScore));
  await page.screenshot({ path: info.outputPath('musify-mobile-late-grade-d.png') });
});

test('preparation waits for real audio data, preserves three lives and starts once even while video is buffering', async ({ page }, info) => {
  await open(page);
  let releaseAudio = () => {};
  let releaseVideo = () => {};
  const audioGate = new Promise<void>(resolve => { releaseAudio = resolve; });
  const videoGate = new Promise<void>(resolve => { releaseVideo = resolve; });
  await page.route('**/api/music/audio*', async route => { await audioGate; return serveMedia(route, wav, 'audio/wav'); });
  await page.route('**/api/music/video*', async route => { await videoGate; return route.fulfill({ status: 503 }); });
  try {
    await page.locator('[data-track-id="still-into-you"]').click();
    const room = page.getByRole('dialog', { name: 'Still Into You' });
    const game = room.locator('.clip-game');
    const start = game.locator('.clip-setup .clip-primary');
    await start.click();
    await expect(start).toHaveAttribute('aria-busy', 'true');
    await expect(start).toBeDisabled();
    await expect(start).toBeVisible();
    await expect(start).toContainText('Preparando música…');
    await expect(start.locator('.clip-prepare-spinner')).toBeVisible();
    await expect(game).toHaveAttribute('data-preparing', 'true');
    await expect(game).toHaveAttribute('data-phase', 'ready');
    await expect(game).toHaveAttribute('data-playing', 'false');
    await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
    await expect(game.locator('.clip-round')).toHaveCount(0);
    const preparationSeed = await game.getAttribute('data-session-seed');
    // A second native click on the disabled control must not queue a new game.
    await start.evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
    await page.waitForTimeout(600);
    await expect(start).toHaveAttribute('aria-busy', 'true');
    await expect(game).toHaveAttribute('data-preparing', 'true');
    await expect(game).toHaveAttribute('data-phase', 'ready');
    await expect(game).toHaveAttribute('data-playing', 'false');
    await expect(game).toHaveAttribute('data-session-seed', preparationSeed!);
    await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
    const warmup = await page.locator('audio').evaluate((audio: HTMLAudioElement) => ({ time: audio.currentTime, muted: audio.muted, ready: audio.readyState }));
    expect(warmup.time).toBe(0);
    expect(warmup.muted).toBe(true);
    expect(warmup.ready, 'the test must hold actual audio data, not just a cosmetic loading delay').toBe(0);
    await page.screenshot({ path: info.outputPath('musify-mobile-preparing.png') });
    releaseAudio();
    // The video response stays held: its preparation budget must never hold the game indefinitely.
    await expect(game).toHaveAttribute('data-phase', 'round', { timeout: 5000 });
    await expect(game).toHaveAttribute('data-playing', 'true');
    await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives', '3');
    await expect(game.locator('.clip-round')).toHaveAttribute('data-round', '0');
    await expect(game.locator('[data-score]')).toHaveAttribute('data-score', '0');
    expect(await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.muted)).toBe(false);
    const seed = await game.getAttribute('data-session-seed');
    await page.waitForTimeout(180);
    await expect(game).toHaveAttribute('data-session-seed', seed!);
    await expect(game.locator('.clip-round')).toHaveAttribute('data-round', '0');
    await expectScoreBelowHeader(room);
  } finally {
    releaseAudio();
    releaseVideo();
  }
});

test('the prepared 900p video decodes, follows an audio seek and leaves the full mobile game usable', async ({ page }, info) => {
  await open(page);
  const bytes = await readFile(resolve('.music-assets/musify-video-900p-1/still-into-you.mp4'));
  await page.route('**/api/music/video*', route => serveMedia(route, bytes, 'video/mp4'));
  await page.locator('[data-track-id="still-into-you"]').click();
  const room = page.getByRole('dialog', { name: 'Still Into You' });
  const game = room.locator('.clip-game');
  await game.getByRole('button', { name: '0,5×', exact: true }).click();
  await room.getByRole('button', { name: 'Começar a jogar', exact: true }).click();
  const video = game.locator('video');
  await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.readyState)).toBeGreaterThanOrEqual(2);
  const media = await video.evaluate((element: HTMLVideoElement) => ({
    width: element.videoWidth, height: element.videoHeight, muted: element.muted,
    inline: element.playsInline, controls: element.controls, pictureInPictureDisabled: element.disablePictureInPicture,
  }));
  expect(Math.min(media.width, media.height), 'video must have at least 900p native dimensions').toBeGreaterThanOrEqual(900);
  expect(media).toMatchObject({ muted: true, inline: true, controls: false, pictureInPictureDisabled: true });
  await expect(game.locator('.music-video')).toHaveAttribute('aria-hidden', 'true');
  await expect(game.locator('.music-video')).toHaveAttribute('data-active', 'true');
  const round = buildMusicRounds(catalog[0], 'level1', Number(await game.getAttribute('data-session-seed')))[0];
  await seek(page, round.opens + .15);
  await expect.poll(() => page.evaluate(() => {
    const video = document.querySelector('video')!;
    const audio = document.querySelector('audio')!;
    return Math.abs(video.currentTime - audio.currentTime);
  })).toBeLessThan(.5);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await expect(game).toHaveAttribute('data-playing', 'true');
  await expect(game.locator('.clip-round')).toHaveAttribute('data-state', 'answering');
  await expectRoundFits(room);
  await page.screenshot({ path: info.outputPath('musify-mobile-900p.png') });
});

test('reduced motion keeps the mobile phrase and choices playable without the decorative video', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.locator('[data-track-id="still-into-you"]').click();
  const room = page.getByRole('dialog', { name: 'Still Into You' });
  const game = room.locator('.clip-game');
  await expect(game.locator('video')).toHaveCount(0);
  await game.getByRole('button', { name: '0,5×', exact: true }).click();
  await room.getByRole('button', { name: 'Começar a jogar', exact: true }).click();
  const round = buildMusicRounds(catalog[0], 'level1', Number(await game.getAttribute('data-session-seed')))[0];
  await seek(page, round.opens + .15);
  await expect(game).toHaveAttribute('data-playing', 'true');
  await expect(game.locator('.musify-stage')).toHaveAttribute('data-mode', 'reduced');
  await expect(game.locator('.musify-stage')).toHaveAttribute('data-running', 'false');
  await expectRoundFits(room);
});
