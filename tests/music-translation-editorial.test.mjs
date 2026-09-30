import test from 'node:test';
import assert from 'node:assert/strict';
import { auditTranslationSupport, exactEquivalentSpans, translationContentFingerprint } from '../scripts/review-musify-translation-audit.mjs';

function fixture() {
  return {
    id: 'original-fixture', version: 'fixture', title: 'Original fixture', artist: 'Fixture', level: 'A1', topic: 'Coffee', duration: 2,
    source: '/original-fixture.mp3', rights: 'original', published: false,
    lines: [{ id: 'one', start: 0, end: 1.2, text: 'Coffee is warm.', translation: 'O café está quente.', tip: 'Original example.', words: [
      { text: 'Coffee', start: 0, end: .4, challengeEligible: true, translationSpans: [{ start: 2, end: 6 }] },
      { text: 'is', start: .5, end: .7, challengeEligible: false },
      { text: 'warm.', start: .8, end: 1.2, challengeEligible: true, translationSpans: [{ start: 12, end: 18 }] },
    ] }],
    vocabulary: [{ id: 'coffee', word: 'coffee', meaning: 'Café', ipa: '/ˈkɔfi/', usage: 'Drink.', example: 'Coffee is warm.' }],
    questions: [{ id: 'one', prompt: 'A drink?', options: ['coffee', 'table'], answer: 0, explanation: 'Coffee is a drink.' }],
  };
}
const mapping = { lexicon: { coffee: ['café'], warm: ['quente'] } };

test('reviewed exact equivalents preserve all English and acoustic content', () => {
  const lesson = fixture();
  const report = auditTranslationSupport(lesson, mapping, translationContentFingerprint(lesson));
  assert.equal(report.candidates, 2);
  const changed = structuredClone(lesson);
  changed.lines[0].words[0].start = .1;
  assert.throws(() => auditTranslationSupport(changed, mapping, translationContentFingerprint(lesson)), /timing changed/);
});

test('missing correspondence disables a candidate instead of exposing its answer', () => {
  const lesson = fixture();
  delete lesson.lines[0].words[0].translationSpans;
  assert.throws(() => auditTranslationSupport(lesson, mapping, translationContentFingerprint(lesson)), /unsafe candidate/);
  lesson.lines[0].words[0].challengeEligible = false;
  assert.equal(auditTranslationSupport(lesson, mapping, translationContentFingerprint(lesson)).candidates, 1);
});

test('all literal repeats are covered and unrelated translated text remains visible', () => {
  const lesson = fixture();
  lesson.lines[0].translation = 'Café, café está quente.';
  lesson.lines[0].words[0].translationSpans = [{ start: 0, end: 4 }, { start: 6, end: 10 }];
  lesson.lines[0].words[2].translationSpans = [{ start: 16, end: 22 }];
  const fingerprint = translationContentFingerprint(lesson);
  assert.equal(auditTranslationSupport(lesson, mapping, fingerprint).candidates, 2);
  lesson.lines[0].words[0].translationSpans.pop();
  assert.throws(() => auditTranslationSupport(lesson, mapping, fingerprint), /missing repeat/);
});

test('UTF-16 offsets and Unicode token boundaries reject cognate and partial matches', () => {
  assert.deepEqual(exactEquivalentSpans('😊 Café e cafeína.', ['café']), [{ start: 3, end: 7 }]);
  assert.deepEqual(exactEquivalentSpans('cafeína', ['cafe']), []);
  assert.deepEqual(exactEquivalentSpans('cafe\u0301', ['cafe']), []);
});

test('semantic metadata cannot point at a different word merely because offsets are valid', () => {
  const lesson = fixture();
  lesson.lines[0].words[0].translationSpans = [{ start: 12, end: 18 }];
  assert.throws(() => auditTranslationSupport(lesson, mapping, translationContentFingerprint(lesson)), /non-equivalent text masked/);
});

test('punctuation in an equivalent is literal, not an executable regex pattern', () => {
  assert.deepEqual(exactEquivalentSpans('C++ e C++.', ['C++']), [{ start: 0, end: 3 }, { start: 6, end: 9 }]);
});
