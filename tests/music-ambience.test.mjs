import test from 'node:test';
import assert from 'node:assert/strict';
import { ambientLyricIndex, lyricRowIndexes } from '../src/lib/music-ambience.ts';
import { buildMusicRounds, musicAnswerOpens } from '../src/lib/music-game.ts';

const lines = [{start: 3, end: 6}, {start: 10, end: 14}, {start: 19, end: 23}];
test('background lyrics never preview an unheard line and clear during instrumental gaps', () => {
  for (const [time, expected] of [[-1,-1],[0,-1],[2.999,-1],[3,0],[6,0],[7.2,0],[7.21,-1],[9.999,-1],[10,1],[15.2,1],[18.999,-1],[19,2],[24.2,2],[30,-1]]) {
    assert.equal(ambientLyricIndex(lines, time), expected);
  }
  assert.equal(ambientLyricIndex([], 5), -1);
  assert.equal(ambientLyricIndex(lines, NaN), -1);
});
test('a pending question remains visible through an instrumental gap until its deadline', () => {
  const lesson = { duration: 20, lines: [{ id: 'line-1', start: 4, end: 5,
    words: [{ text: 'hello', start: 4, end: 5 }] }] };
  const round = buildMusicRounds(lesson, 'level1', 1)[0];
  const time = 7;
  assert.ok(time >= musicAnswerOpens(round) && time < round.closes);
  const ambientIndex = ambientLyricIndex(lesson.lines, time + .7);
  assert.equal(ambientIndex, -1);
  assert.deepEqual(lyricRowIndexes(ambientIndex, round.lineIndex), [round.lineIndex]);
  assert.deepEqual(lyricRowIndexes(ambientIndex), []);
  assert.deepEqual(lyricRowIndexes(3, 1), [1, 3]);
});
test('background lyrics follow corrected media time after seeks, pauses and speed changes', () => {
  // Wall-clock playback speed cannot alter the cue selected at a media time.
  for (const speed of [1, .75, .5]) {
    const mediaTime = 12 * speed;
    assert.equal(ambientLyricIndex(lines, mediaTime), speed === 1 ? 1 : speed === .75 ? -1 : 0);
    assert.equal(ambientLyricIndex(lines, 20), 2);
    assert.equal(ambientLyricIndex(lines, 4), 0); // backward seek
    assert.equal(ambientLyricIndex(lines, 4), 0); // paused
    assert.equal(ambientLyricIndex(lines, 0), -1); // replay
  }
  assert.equal(ambientLyricIndex(lines, 9.9 + .2), 1); // device latency
  assert.equal(ambientLyricIndex(lines, 10.1 - .2), -1);
});
