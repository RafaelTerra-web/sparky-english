import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMusicRounds, musicGameReducer, initialGame, MUSIC_LIVES } from '../src/lib/music-game.ts';

const lesson = { duration: 80, lines: Array.from({ length: 8 }, (_, i) => ({
  id: `line-${i}`, start: 4 + i * 9, end: 7 + i * 9, words: [
    { text: 'know', start: 4 + i * 9, end: 5 + i * 9 },
    { text: 'no', start: 5 + i * 9, end: 6 + i * 9 },
    { text: 'unclear', start: 6 + i * 9, end: 7 + i * 9, challengeEligible: false },
  ],
})) };
test('all Musify modes have a single target, unique choices and no indistinguishable homophone distractor', () => {
  for (const mode of ['level1', 'level2', 'level3', 'level4', 'quick', 'guided', 'challenge', 'typing']) {
    for (let seed = 0; seed < 50; seed++) for (const round of buildMusicRounds(lesson, mode, seed)) {
      assert.equal(round.targets.length, 1);
      assert.equal(round.answers.length, 1);
      assert.equal(round.options.filter(option => option === round.answer).length, 1);
      assert.equal(new Set(round.options).size, round.options.length);
      assert.equal(round.options.includes(round.answer === 'know' ? 'no' : 'know'), false);
      assert.equal(round.targets.includes(2), false);
    }
  }
});
test('three committed misses end the game once; success preserves lives; replay restores them', () => {
  let state = musicGameReducer(initialGame, { type: 'start' });
  assert.equal(state.lives, MUSIC_LIVES);
  const deadlines = [7, 17, 27, 37, 47];
  const action = index => ({ type: 'answer', index, value: 'wrong', expected: 'hello', time: deadlines[index] - 1, opens: deadlines[index] - 2, closes: deadlines[index] });
  const correct = { ...action(0), value: 'hello' };
  state = musicGameReducer(state, correct);
  assert.equal(state.lives, 3);
  state = musicGameReducer(state, { type: 'tick', time: 7, deadlines, finishAt: 60 });
  for (let index = 1; index <= 3; index++) {
    const next = musicGameReducer(state, action(index));
    assert.equal(next.lives, 3 - index);
    assert.equal(musicGameReducer(next, action(index)), next);
    state = musicGameReducer(next, { type: 'tick', time: deadlines[index], deadlines, finishAt: 60 });
  }
  assert.equal(state.phase, 'failed');
  assert.equal(state.correct, 1);
  assert.equal(state.missed, 3);
  assert.equal(musicGameReducer(state, { type: 'tick', time: 99, deadlines, finishAt: 60 }), state);
  assert.equal(musicGameReducer(state, { type: 'start' }).lives, 3);
});
test('clock expiration charges one life per missed prompt and stops at zero', () => {
  const started = musicGameReducer(initialGame, { type: 'start' });
  const state = musicGameReducer(started, { type: 'tick', time: 60, deadlines: [5, 15, 25, 35, 45], finishAt: 60 });
  assert.equal(state.lives, 0);
  assert.equal(state.phase, 'failed');
  assert.equal(state.missed, 3);
  assert.equal(state.outcomes.length, 3);
});
