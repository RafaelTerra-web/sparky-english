import { lessonVoiceIdentity } from "../src/lib/lesson-voice-config.ts";
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
    for (const mascot of Object.keys(voiceProfiles)) {
      const hash = createHash('sha256').update(JSON.stringify(lessonVoiceIdentity(text,mascot,lesson.level))).digest('hex').slice(0,32);
      const path = '/audio/mascots/' + hash + '.wav';
      assert.equal(manifest[lesson.id][mascot],path,lesson.id + ' / ' + mascot);
      const bytes = await readFile(new URL('../public' + path,import.meta.url));
      assert.ok(bytes.length >= 256 && bytes.length < 4 * 1024 * 1024);
      assert.equal(bytes.subarray(0,4).toString(), 'RIFF', 'WAV header');
    }
  }
});

test('both mascots use Gemini 3.1 with their fixed voices', () => {
  assert.equal(voiceProfiles.pinky.model, 'gemini-3.1-flash-tts-preview');
  assert.equal(voiceProfiles.pinky.voice, 'Zephyr');
  assert.equal(voiceProfiles.sparky.model, 'gemini-3.1-flash-tts-preview');
  assert.equal(voiceProfiles.sparky.voice, 'Achird');
});
