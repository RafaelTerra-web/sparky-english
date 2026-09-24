import test from 'node:test';
import assert from 'node:assert/strict';
import { musicRelease, musicAudioSource } from '../src/lib/music-release.ts';

test('multiple tracks keep the original audio URL and use distinct explicit assets', () => {
  assert.equal(musicAudioSource('perfect-local'), '/api/music/audio');
  assert.equal(musicRelease(null)?.audio, 'audio.mp3');
  assert.equal(musicRelease('perfect-local')?.version, 'full-song-timing-2');
  assert.equal(musicAudioSource('heartless-local'), '/api/music/audio?trackId=heartless-local');
  assert.equal(musicRelease('heartless-local')?.audio, 'heartless/audio.mp3');
  assert.equal(musicRelease('stay-at-your-house-local')?.video, 'stay-at-your-house/background.mp4');
  assert.equal(musicRelease('stay-at-your-house-local')?.version, 'stay-at-your-house-timing-1');
  assert.equal(musicRelease('buttercup-local')?.audio, 'buttercup-local/audio.mp3');
  assert.equal(musicRelease('buttercup-local')?.video, 'buttercup-local/video.mp4');
  assert.equal(musicRelease('buttercup-local')?.version, 'buttercup-timing-2');
  for (const invalid of ['', '../audio', 'manifest.json', 'heartless/audio.mp3', 'unknown']) assert.equal(musicRelease(invalid), undefined);
});
