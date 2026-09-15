import test from 'node:test';
import assert from 'node:assert/strict';
import { claimAudioPlayback, releaseAudioPlayback, claimAudioSession, releaseAudioSession } from '../src/lib/audio-playback.ts';

test('a new audio source stops the previous source and stale releases are harmless', () => {
  const first = { pauses: 0, pause() { this.pauses += 1; } };
  const second = { pauses: 0, pause() { this.pauses += 1; } };
  const third = { pauses: 0, pause() { this.pauses += 1; } };
  claimAudioPlayback(first);
  claimAudioPlayback(second);
  assert.equal(first.pauses, 1);
  releaseAudioPlayback(first);
  claimAudioPlayback(third);
  assert.equal(second.pauses, 1);
  releaseAudioPlayback(third);
});

test('non-media narration sessions use the same exclusive channel', () => {
  const owner = {};
  let stopped = 0;
  claimAudioSession(owner, () => { stopped += 1; });
  claimAudioSession({}, () => {});
  assert.equal(stopped, 1);
  releaseAudioSession(owner);
});
