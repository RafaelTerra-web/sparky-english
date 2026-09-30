import test from 'node:test';
import assert from 'node:assert/strict';
import { initialGame, musicGameReducer } from '../src/lib/music-game.ts';
import { musicTimingPoints, musicTimingRank, musicTimingNormalizedPoints, musicTimingProgress } from '../src/lib/music-score.ts';
import { normalizeMusicPerformance, recordMusicPerformance, mergeMusicPerformance, unlockedMusicAchievements } from '../src/lib/music-performance.ts';

test('listening timing rewards each correct answer from 25 to 100 inside its real window', () => {
  assert.equal(musicTimingPoints(10, 10, 14), 100);
  assert.equal(musicTimingPoints(12, 10, 14), 63);
  assert.equal(musicTimingPoints(13.999, 10, 14), 25);
  assert.equal(musicTimingPoints(9.999, 10, 14), 0);
  assert.equal(musicTimingPoints(14, 10, 14), 0);
  for (const window of [[NaN, 10, 14], [10, NaN, 14], [10, 10, Infinity], [10, 10, 10], [10, 14, 10]]) {
    assert.equal(musicTimingPoints(...window), 0);
  }
});

test('the same relative response earns the same points at every playback speed', () => {
  for (const speed of [.5, .75, 1, 1.5, 2]) {
    // Converting all media positions to real time must not grant a speed bonus.
    assert.equal(musicTimingPoints(11 / speed, 10 / speed, 14 / speed), 81);
  }
});

test('score is committed once and rejected, invalid or late answers cannot earn points', () => {
  let state = musicGameReducer(initialGame, { type: 'start' });
  const action = { type: 'answer', index: 0, value: 'hello', expected: 'hello', time: 12, opens: 10, closes: 14 };
  assert.strictEqual(musicGameReducer(state, { ...action, time: 9 }), state);
  assert.strictEqual(musicGameReducer(state, { ...action, time: 14 }), state);
  assert.strictEqual(musicGameReducer(state, { ...action, opens: NaN }), state);
  state = musicGameReducer(state, action);
  assert.equal(state.score, 63);
  assert.equal(state.lastPoints, 63);
  assert.strictEqual(musicGameReducer(state, action), state);
  state = musicGameReducer(state, { type: 'tick', time: 14, deadlines: [14, 24, 34], finishAt: 40 });
  assert.equal(state.lastPoints, 0);
  state = musicGameReducer(state, { ...action, index: 1, value: 'wrong', time: 21, opens: 20, closes: 24 });
  assert.equal(state.score, 63);
  assert.equal(state.lastPoints, 0);
  assert.equal(state.lives, 2);
  assert.strictEqual(musicGameReducer(state, { ...action, index: 1, time: 22, opens: 20, closes: 24 }), state);
  state = musicGameReducer(state, { type: 'tick', time: 34, deadlines: [14, 24, 34], finishAt: 40 });
  assert.equal(state.score, 63);
  assert.equal(state.lastPoints, 0);
  assert.equal(state.lives, 1);
  assert.equal(musicGameReducer(state, { type: 'start' }).score, 0);
});

function completedGame(total, responseRatio) {
  const deadlines = Array.from({ length: total }, (_, index) => index * 10 + 9);
  let state = musicGameReducer(initialGame, { type: 'start' });
  for (let index = 0; index < total; index++) {
    const opens = index * 10 + 4, closes = deadlines[index];
    state = musicGameReducer(state, { type: 'answer', index, value: 'hello', expected: 'hello', time: opens + (closes - opens) * responseRatio, opens, closes });
    state = musicGameReducer(state, { type: 'tick', time: closes, deadlines, finishAt: total * 10 });
  }
  return musicGameReducer(state, { type: 'tick', time: total * 10, deadlines, finishAt: total * 10 });
}

test('a player can complete D or S without losing any heart', () => {
  for (const total of [8, 12, 20, 28, 32]) {
    const slow = completedGame(total, .95), fast = completedGame(total, .05);
    for (const state of [slow, fast]) {
      assert.equal(state.phase, 'result');
      assert.equal(state.correct, total);
      assert.equal(state.lives, 3);
    }
    assert.equal(musicTimingRank(slow.score, total).name, 'D');
    assert.equal(musicTimingRank(fast.score, total).name, 'S');
  }
});

test('timing grades use points and the available round count with exact boundaries', () => {
  for (const [ratio, grade] of [[0, 'D'], [.399, 'D'], [.4, 'C'], [.599, 'C'], [.6, 'B'], [.749, 'B'], [.75, 'A'], [.899, 'A'], [.9, 'S'], [1, 'S']]) {
    assert.equal(musicTimingRank(ratio * 1000, 10).name, grade);
  }
  assert.equal(musicTimingNormalizedPoints(800, 8), 2400);
  assert.equal(musicTimingNormalizedPoints(10000, 8), 2400);
  assert.equal(musicTimingNormalizedPoints(100, 0), 0);
  assert.equal(musicTimingNormalizedPoints(NaN, 8), 0);
  const progress = musicTimingProgress(700, 10);
  assert.equal(progress.rank.name, 'B');
  assert.equal(progress.nextRank.name, 'A');
  assert.equal(progress.pointsToNext, 50);
  assert.ok(Math.abs(progress.progress - 2 / 3) < .001);
  assert.equal(musicTimingProgress(950, 10).nextRank, null);
});

test('timing records merge without summing and retain completed scores across failed attempts', () => {
  const a = recordMusicPerformance(null, 'level1', 8, 8, true, { points: 750, totalRounds: 8 });
  const b = recordMusicPerformance(null, 'level1', 10, 6, false, { points: 1000, totalRounds: 12 });
  const both = mergeMusicPerformance(a, b);
  assert.equal(both.level1.speedScore.points, 1000);
  assert.equal(both.level1.speedScore.rankPoints, 2250);
  assert.equal(both.level1.speedScore.completedRankPoints, 2250);
  assert.deepEqual(mergeMusicPerformance(b, a), both);
  assert.deepEqual(mergeMusicPerformance(both, both), both);
  assert.equal(recordMusicPerformance(both, 'level1', 1, 1, false, { points: 25, totalRounds: 12 }).level1.speedScore.completedRankPoints, 2250);
});

test('legacy records preserve their shape, achievements and score after a timing migration or old-client write', () => {
  const legacy = recordMusicPerformance(null, 'level1', 12, 12, true);
  assert.deepEqual(legacy.level1, { correct: 12, streak: 12, completedCorrect: 12 });
  const migrated = recordMusicPerformance(legacy, 'level1', 12, 12, true, { points: 300, totalRounds: 12 });
  assert.ok(migrated.level1.speedScore.legacyRankA && migrated.level1.speedScore.legacyPerfect);
  const achievements = unlockedMusicAchievements(migrated).map(item => item.id);
  assert.ok(achievements.includes('rank-a') && achievements.includes('perfect'));
  assert.deepEqual(mergeMusicPerformance(migrated, legacy), migrated);
  assert.deepEqual(normalizeMusicPerformance({ level1: { correct: 5, streak: 5, completedCorrect: -1, speedScore: { version: 999, points: 300, rankPoints: 600, completedRankPoints: -1 } } }).level1,
    { correct: 5, streak: 5, completedCorrect: -1 });
  assert.equal(normalizeMusicPerformance({ level1: { speedScore: { version: 1, points: 1201, rankPoints: 2400, completedRankPoints: 2400 } } }).level1.speedScore, undefined);
});

test('new perfect and rank-A achievements require timing grades and cannot combine unrelated attempts', () => {
  const slow = recordMusicPerformance(null, 'level1', 12, 12, true, { points: 300, totalRounds: 12 });
  assert.ok(!unlockedMusicAchievements(slow).some(item => ['rank-a', 'perfect'].includes(item.id)));
  const fastImperfect = recordMusicPerformance(null, 'level1', 11, 11, true, { points: 1100, totalRounds: 12 });
  const merged = mergeMusicPerformance(slow, fastImperfect);
  const achievements = unlockedMusicAchievements(merged).map(item => item.id);
  assert.ok(achievements.includes('rank-a'));
  assert.ok(!achievements.includes('perfect'));
  assert.ok(unlockedMusicAchievements(recordMusicPerformance(null, 'level1', 8, 8, true, { points: 760, totalRounds: 8 })).some(item => item.id === 'perfect'));
});
