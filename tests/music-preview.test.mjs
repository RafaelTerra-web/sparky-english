import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMusicRounds, musicAnswerOpens, musicSpeeds, musicGameReducer, initialGame, LYRIC_PREVIEW_SECONDS } from '../src/lib/music-game.ts';
import { lyricWordOpacity } from '../src/lib/music-ambience.ts';
import { normalizeMusicPerformance, mergeMusicPerformance, unlockedMusicAchievements } from '../src/lib/music-performance.ts';

const lesson = { duration: 400, lines: Array.from({ length: 40 }, (_, i) => ({ id: `line-${i}`, start: 4 + i * 9, end: 7 + i * 9, words: [{ text: 'hello', start: 4 + i * 9, end: 5 + i * 9 }, { text: 'again', start: 6 + i * 9, end: 7 + i * 9 }] })) };
test('four levels reserve previews and keep answer windows apart', () => {
  for (const [mode, count] of [['level1',12], ['level2',20], ['level3',28], ['level4',32]]) {
    const rounds = buildMusicRounds(lesson, mode);
    assert.equal(rounds.length, count);
    for (const [i, round] of rounds.entries()) {
      assert.equal(round.revealAt, round.line.start - LYRIC_PREVIEW_SECONDS);
      assert.equal(round.opens, round.line.words[round.target].start - .25);
      if (i) assert.ok(rounds[i - 1].closes <= round.revealAt);
    }
  }
  const level3 = buildMusicRounds(lesson, 'level3');
  const level4 = buildMusicRounds(lesson, 'level4');
  assert.ok(level3.some(round => round.targets.length === 2));
  assert.ok(level3.some(round => round.targets.length === 1));
  assert.ok(level4.some(round => round.targets.length === 2));
  assert.ok(level4.some(round => round.targets.length === 1));
});
test('quick mode masks and quizzes every word in each selected phrase', () => {
  const rounds = buildMusicRounds(lesson, 'quick', 9);
  assert.ok(rounds.length > 0);
  for (const round of rounds) {
    assert.deepEqual(round.targets, round.line.words.map((_, index) => index));
    assert.equal(round.answers.length, round.line.words.length);
    assert.ok(round.options.includes(round.answer));
    assert.equal(round.options.length, 4);
    assert.equal(new Set(round.options).size, round.options.length);
  }
});
test('answer opens a quarter second early at every speed, never before that', () => {
  const round = buildMusicRounds(lesson, 'level4')[0];
  for (const speed of musicSpeeds) {
    const opens = musicAnswerOpens(round, speed);
    assert.ok(Math.abs((round.line.words[round.target].start - opens) / speed - .25) < 1e-8);
    const state = musicGameReducer(initialGame, { type: 'start' });
    const action = { type: 'answer', index: 0, value: round.answer, expected: round.answer, opens, closes: round.closes };
    assert.equal(musicGameReducer(state, { ...action, time: opens - .001 }), state);
    assert.equal(musicGameReducer(state, { ...action, time: opens }).correct, 1);
  }
});
test('word entrance is gradual, staggered, deterministic and finished before the voice', () => {
  assert.equal(lyricWordOpacity(10, 0, 8.75), 0);
  const middle = lyricWordOpacity(10, 0, 9.45);
  assert.ok(middle > 0 && middle < 1);
  assert.ok(lyricWordOpacity(10, 3, 9.45) < middle);
  assert.equal(lyricWordOpacity(10, 20, 10.1), 1);
  assert.equal(lyricWordOpacity(10, 0, 9.45), middle);
});
test('old saves gain an empty level four, and its full score persists and unlocks perfect', () => {
  const old = { level3: { correct: 28, streak: 28, completedCorrect: 28 } };
  const state = mergeMusicPerformance(old, { level4: { correct: 32, streak: 32, completedCorrect: 32 } });
  assert.equal(state.level3.correct, 28);
  assert.equal(state.level4.correct, 32);
  assert.equal(normalizeMusicPerformance(old).level4.completedCorrect, -1);
  assert.ok(unlockedMusicAchievements({ level4: state.level4 }).some(a => a.id === 'perfect'));
  assert.equal(normalizeMusicPerformance({ level4: { correct: 33 } }).level4.correct, 0);
});
