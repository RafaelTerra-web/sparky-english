import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { lessons } from '../src/lib/curriculum.ts';
import { voiceProfiles } from '../src/lib/voice-config.ts';

test('every published lesson has both current, nonempty mascot audio files', async () => {
  const manifest = JSON.parse(await readFile(new URL('../src/lib/content/voice-manifest.json',import.meta.url),'utf8'));
  assert.deepEqual(new Set(Object.keys(manifest)),new Set(lessons.map(lesson => lesson.id)));
  for (const lesson of lessons) {
    const text = lesson.steps.find(step => step.kind === 'example').english;
    assert.equal(manifest[lesson.id].text,text);
    for (const [mascot,profile] of Object.entries(voiceProfiles)) {
      const hash = createHash('sha256').update(JSON.stringify({model:profile.model,text,voice:profile.voice,...('instructions' in profile ? {instructions:profile.instructions} : {})})).digest('hex').slice(0,32);
      const path = '/audio/mascots/' + hash + '.mp3';
      assert.equal(manifest[lesson.id][mascot],path,lesson.id + ' / ' + mascot);
      const bytes = await readFile(new URL('../public' + path,import.meta.url));
      assert.ok(bytes.length >= 256 && bytes.length < 4 * 1024 * 1024);
      assert.ok(bytes.subarray(0,3).toString() === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224),'MP3 header');
    }
  }
});

test('Pinky uses the high-definition model while Sparky keeps his expressive profile', () => {
  assert.equal(voiceProfiles.pinky.model, 'tts-1-hd');
  assert.equal(voiceProfiles.pinky.voice, 'nova');
  assert.equal('instructions' in voiceProfiles.pinky, false);
  assert.equal(voiceProfiles.sparky.model, 'gpt-4o-mini-tts-2025-12-15');
});
