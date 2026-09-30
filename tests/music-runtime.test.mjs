import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMusicRounds, initialGame, musicAnswerOpens, musicGameReducer } from '../src/lib/music-game.ts';
import { lyricWordOpacity } from '../src/lib/music-ambience.ts';
import { musicWordFill } from '../src/lib/music-visuals.ts';
import { musifyEffectAt } from '../src/lib/musify-identity.ts';
import { createMusicRoundCache, createMusicLyricPlan, musicLyricAnimationClock, musicGameTickDue,
  musicVideoNeedsSeek, createMusifyEffectLookup } from '../src/lib/music-runtime.ts';

const lesson = { duration: 80, lines: Array.from({ length: 8 }, (_, index) => ({
  id: 'line-' + index, start: 4 + index * 9, end: 7 + index * 9,
  translation: 'Mantenha seu ritmo', words: ['Keep', 'your', 'rhythm'].map((text, word) => ({
    text, start: 4 + index * 9 + word, end: 5 + index * 9 + word,
    translationSpans: [[{ start: 0, end: 8 }], [{ start: 9, end: 12 }], [{ start: 13, end: 18 }]][word],
  })),
})) };

test('precomputed rounds are reused for render and switching levels without changing seed outcomes', () => {
  const getRounds = createMusicRoundCache(lesson);
  const prepared = getRounds('level1', 123);
  assert.equal(getRounds('level1', 123), prepared);
  getRounds('level2', 123);
  assert.equal(getRounds('level1', 123), prepared);
  assert.deepEqual(prepared, buildMusicRounds(lesson, 'level1', 123));
  const initial = getRounds('level1');
  getRounds('level1', 456);
  assert.equal(getRounds('level1'), initial, 'setup counts stay cached after a new game seed');
  for (const mode of ['level1', 'level2', 'level3', 'level4', 'quick']) {
    const count = getRounds(mode).length;
    for (let seed = 0; seed < 25; seed++) assert.equal(buildMusicRounds(lesson, mode, seed).length, count);
  }
});

test('ten thousand lyric frames reuse one parsed mask and keep partial Portuguese context visible', () => {
  const line = structuredClone(lesson.lines[0]);
  let alignmentReads = 0;
  const spans = line.words[2].translationSpans;
  Object.defineProperty(line.words[2], 'translationSpans', { get: () => { alignmentReads++; return spans; } });
  const rounds = [{ index: 0, lineIndex: 0, targets: [2] }];
  const plan = createMusicLyricPlan([line], rounds);
  const masked = plan(0, 0);
  for (let frame = 0; frame < 10000; frame++) assert.equal(plan(0, 0), masked);
  assert.equal(alignmentReads, 1, 'alignment/grapheme parsing is independent of frame count');
  assert.deepEqual(masked.translation, [{ start: 0, end: 13, masked: false, text: 'Mantenha seu ' }, { start: 13, end: 18, masked: true }]);
  assert.ok(!JSON.stringify(masked.translation).includes('ritmo'));
  const revealed = plan(0, 1);
  assert.equal(revealed.hiddenTargets.size, 0);
  assert.equal(revealed.translation[0].text, line.translation);
  assert.equal(plan(0, 1), revealed);
});

test('mask plans union remaining equivalents, preserve a pending focus and fail closed on invalid alignment', () => {
  const line = lesson.lines[0];
  const plan = createMusicLyricPlan([line], [
    { index: 0, lineIndex: 0, targets: [0] }, { index: 1, lineIndex: 0, targets: [2] },
  ]);
  assert.deepEqual([...plan(0, 0).hiddenTargets], [0, 2]);
  assert.deepEqual([...plan(0, 1).hiddenTargets], [2]);
  assert.deepEqual([...plan(0, 2, { lineIndex: 0, targets: [2], hidden: true }).hiddenTargets], [2]);
  assert.equal(plan(0, 2, { lineIndex: 0, targets: [2], hidden: false }).hiddenTargets.size, 0);
  const unreviewed = structuredClone(line);
  delete unreviewed.words[2].translationSpans;
  const invalid = createMusicLyricPlan([unreviewed], [{ index: 0, lineIndex: 0, targets: [2] }]);
  assert.equal(invalid(0, 0).translation, null);
  assert.equal(invalid(0, 1).translation[0].text, line.translation);
  assert.equal(plan(0, 0, undefined, false).translation, null, 'immersion avoids Portuguese parsing entirely');
});

test('completed lyric rows freeze React clock props while reproducing fills and entrance opacity exactly', () => {
  const line = lesson.lines[0], row = createMusicLyricPlan([line], [])(0, 0);
  assert.equal(musicLyricAnimationClock(row, 20), musicLyricAnimationClock(row, 30));
  for (const clock of [-10, 0, 3.3, 4, 4.7, 5, 6.5, 7, 30]) {
    const sampled = musicLyricAnimationClock(row, clock);
    line.words.forEach((word, index) => {
      assert.equal(musicWordFill(word.start, word.end, sampled), musicWordFill(word.start, word.end, clock));
      assert.equal(lyricWordOpacity(line.start, index, sampled), lyricWordOpacity(line.start, index, clock));
      assert.equal(sampled >= word.start && sampled < word.end, clock >= word.start && clock < word.end);
    });
  }
});

test('deadline-only ticks preserve outcomes and lives with under one dispatch per 90 media-clock samples', () => {
  const rounds = buildMusicRounds(lesson, 'level1'), deadlines = rounds.map(round => round.closes);
  let baseline = musicGameReducer(initialGame, { type: 'start' });
  let optimized = baseline, dispatches = 0, samples = 0;
  for (let sample = 0; sample <= 900; sample++) {
    const time = Math.min(80, sample * .09);
    const round = rounds[baseline.index];
    if (baseline.phase === 'round' && !baseline.answered && time >= musicAnswerOpens(round) && time < round.closes) {
      const answer = { type: 'answer', index: round.index, value: round.answer, expected: round.answer, time, opens: musicAnswerOpens(round), closes: round.closes };
      baseline = musicGameReducer(baseline, answer); optimized = musicGameReducer(optimized, answer);
    }
    const tick = { type: 'tick', time, deadlines, finishAt: lesson.duration };
    baseline = musicGameReducer(baseline, tick);
    if (musicGameTickDue(optimized, time, deadlines, lesson.duration)) { optimized = musicGameReducer(optimized, tick); dispatches++; }
    assert.deepEqual(optimized, baseline);
    samples++;
  }
  assert.equal(optimized.phase, 'result'); assert.equal(optimized.lives, 3); assert.equal(optimized.correct, rounds.length);
  assert.equal(dispatches, rounds.length + 1); assert.ok(samples / dispatches > 90);
  const catchup = musicGameReducer(initialGame, { type: 'start' });
  assert.ok(musicGameTickDue(catchup, lesson.duration, deadlines, lesson.duration));
  assert.equal(musicGameReducer(catchup, { type: 'tick', time: lesson.duration, deadlines, finishAt: lesson.duration }).phase, 'failed');
});

test('decorative video tolerates small frame drift and throttles correction seeks, with immediate explicit seek alignment', () => {
  assert.equal(musicVideoNeedsSeek(10, 9.8, 2000, 0), false);
  assert.equal(musicVideoNeedsSeek(10, 9.6, 2000, 0), false);
  assert.equal(musicVideoNeedsSeek(10, 9.5, 2000, 0), true);
  assert.equal(musicVideoNeedsSeek(10, 9, 500, 0), false, 'decoder catches up before another normal correction');
  assert.equal(musicVideoNeedsSeek(40, 9, 500, 0, true), true, 'audio seek bypasses the drift cooldown');
  assert.equal(musicVideoNeedsSeek(10, 10.01, 500, 0, true), false);
  assert.equal(musicVideoNeedsSeek(NaN, 10, 2000, 0), false);
});

test('cached lyric effects follow every boundary, backward seek and replay without renormalizing lyrics per frame', () => {
  const lines = [{ words: [{ text: 'butterflies,', start: 46, end: 48 }, { text: 'butterflies', start: 114, end: 116 }] }];
  for (const id of ['still-into-you', 'savage', 'unknown']) {
    const lookup = createMusifyEffectLookup(id, lines);
    for (const clock of [0, 45.99, 46, 54.99, 55, 114, 122.99, 123, 46, 0, -1, NaN]) assert.equal(lookup(clock), musifyEffectAt(id, lines, clock));
  }
});
