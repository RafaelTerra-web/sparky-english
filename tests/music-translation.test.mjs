import test from 'node:test';
import assert from 'node:assert/strict';
import { validMusicTranslationSpans, musicTranslationParts } from '../src/lib/music-translation.ts';

test('translation alignment accepts only nonempty, bounded UTF-16 spans on grapheme boundaries', () => {
  for (const spans of [undefined, null, [], [null], ['word'], [{ start: -1, end: 2 }], [{ start: 0, end: 0 }], [{ start: 0, end: 20 }], [{ start: 0.5, end: 2 }]]) {
    assert.equal(validMusicTranslationSpans('uma frase', spans), false);
  }
  assert.equal(validMusicTranslationSpans('a b', [{ start: 1, end: 2 }]), false, 'whitespace is not an equivalent');
  assert.equal(validMusicTranslationSpans('🙂 café', [{ start: 0, end: 2 }]), true);
  assert.equal(validMusicTranslationSpans('🙂 café', [{ start: 0, end: 1 }]), false, 'UTF-16 surrogate cannot be split');
  assert.equal(validMusicTranslationSpans('cafe\u0301', [{ start: 3, end: 5 }]), true);
  assert.equal(validMusicTranslationSpans('cafe\u0301', [{ start: 3, end: 4 }]), false, 'combining accent stays attached');
  assert.equal(validMusicTranslationSpans('👩‍🎤 canta', [{ start: 0, end: 5 }]), true);
  assert.equal(validMusicTranslationSpans('👩‍🎤 canta', [{ start: 0, end: 2 }]), false, 'joined emoji stays attached');
});

test('multi-span equivalents, reordered translations and overlapping targets are unioned without answer text', () => {
  const line = { translation: 'Ela não sabe, não mesmo.', words: [
    { translationSpans: [{ start: 4, end: 7 }, { start: 14, end: 17 }] },
    { translationSpans: [{ start: 8, end: 12 }] },
    { translationSpans: [{ start: 4, end: 12 }] },
  ] };
  const before = JSON.stringify(line);
  const parts = musicTranslationParts(line, [0, 1, 2, 0]);
  assert.deepEqual(parts, [
    { start: 0, end: 4, masked: false, text: 'Ela ' }, { start: 4, end: 12, masked: true },
    { start: 12, end: 14, masked: false, text: ', ' }, { start: 14, end: 17, masked: true },
    { start: 17, end: 24, masked: false, text: ' mesmo.' },
  ]);
  assert.ok(!JSON.stringify(parts).includes('não') && !JSON.stringify(parts).includes('sabe'));
  assert.equal(JSON.stringify(line), before, 'rendering does not mutate translations or alignment');
});

test('missing or invalid alignment fails closed while answered lines are restored exactly', () => {
  const line = { translation: 'Não desista.', words: [{}, { translationSpans: [{ start: 4, end: 11 }] }] };
  assert.equal(musicTranslationParts(line, [0]), null);
  assert.equal(musicTranslationParts(line, [1, 2]), null);
  assert.equal(musicTranslationParts(line, [-1]), null);
  assert.deepEqual(musicTranslationParts(line, []), [{ start: 0, end: 12, masked: false, text: 'Não desista.' }]);
});
