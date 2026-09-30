import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createOfflinePack } from '../src/lib/offline-pack.ts';
import { offlineCacheName, clearObsoleteAppCaches } from '../src/lib/offline-cache.ts';
import { freshPractice, restorePractice, selectedAnswer, answerCorrect } from '../public/offline/practice-state.mjs';
import { readOfflineLanguages, offlineText } from '../public/offline/language.mjs';

const pack = JSON.parse(readFileSync(new URL('../public/offline/practice.json', import.meta.url), 'utf8'));

test('offline pack matches real course content and has exercises and support for every level', () => {
  assert.deepEqual(pack, JSON.parse(JSON.stringify(createOfflinePack())));
  assert.equal(pack.lessons.length, 12);
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    const lessons = pack.lessons.filter(lesson => lesson.level === level);
    assert.equal(lessons.length, 2);
    for (const lesson of lessons) {
      assert.equal(lesson.exercises.length, 6);
      assert.ok(lesson.support.length >= 2);
      assert.ok(lesson.exercises.every(step => step.options.length >= 3 && typeof step.answer === 'string'));
      assert.ok(lesson.exercises.every(step => step.bodyEnglish && step.explanationEnglish));
      assert.ok(lesson.support.every(step => step.bodyEnglish && step.titleEnglish));
    }
  }
  assert.doesNotMatch(JSON.stringify(pack), /"(?:receipt|sessionId|userId|coins|completed|reviews|email)":/);
});

test('offline languages only read public preferences and preserve independent interface/support modes', () => {
  for (const ui of ['en', 'pt-BR']) for (const support of ['en', 'pt-BR']) {
    const readKeys = [];
    const result = readOfflineLanguages({ getItem: key => { readKeys.push(key); return key === 'sparky-interface-language' ? ui : support; } });
    assert.deepEqual(result, { ui, support });
    assert.deepEqual(readKeys, ['sparky-interface-language', 'sparky-support-language']);
    assert.equal(offlineText('Praticar offline', ui), ui === 'en' ? 'Practice offline' : 'Praticar offline');
  }
  assert.deepEqual(readOfflineLanguages({ getItem: () => { throw Error('blocked'); } }), { ui: 'pt-BR', support: 'pt-BR' });
  assert.equal(offlineText("Hi, I'm Ana.", 'en'), "Hi, I'm Ana.");
});

test('public scratch checkpoint validates choices, repeated word positions and content changes', () => {
  for (const lesson of pack.lessons) {
    const state = freshPractice(pack, lesson.id);
    state.choice = lesson.exercises[0].options.indexOf(lesson.exercises[0].answer);
    assert.equal(answerCorrect(lesson, state), true);
    const restored = restorePractice(pack, { ...state, checked: true, userId: 'someone-else', receipt: 'forged', coins: 999 });
    assert.equal(restored.checked, true);
    assert.equal(answerCorrect(lesson, restored), true);
    assert.ok(!('receipt' in restored));
    assert.ok(!('userId' in restored));
    assert.equal(restorePractice(pack, { ...state, contentVersion: 'old' }), null);
    assert.equal(restorePractice(pack, { ...state, index: -1 }), null);
    assert.equal(restorePractice(pack, { ...state, choice: 500 }), null);
    assert.equal(restorePractice(pack, { ...state, tokens: [0, 0] }), null);
    assert.equal(restorePractice(pack, { ...state, checked: true, choice: null }).checked, false);
    const order = lesson.exercises.findIndex(step => step.kind === 'order_words');
    state.index = order; state.choice = null;
    const remaining = lesson.exercises[order].options.map((word, index) => ({ word, index }));
    state.tokens = lesson.exercises[order].answer.split(' ').map(word => {
      const index = remaining.findIndex(item => item.word === word);
      return remaining.splice(index, 1)[0].index;
    });
    assert.equal(selectedAnswer(lesson, state), lesson.exercises[order].answer);
    assert.equal(answerCorrect(lesson, state), true);
    assert.equal(answerCorrect(lesson, restorePractice(pack, state)), true);
  }
});

test('account/release cleanup preserves only the current anonymous shell and leaves unrelated caches', async () => {
  const previousWindow = globalThis.window, previousCaches = globalThis.caches;
  const removed = [];
  globalThis.window = { caches: true };
  globalThis.caches = { keys: async () => [offlineCacheName, 'sparky-public-v14', 'sparky-private-old', 'unrelated'], delete: async key => removed.push(key) };
  try {
    await clearObsoleteAppCaches();
    assert.deepEqual(removed, ['sparky-public-v14', 'sparky-private-old']);
    assert.ok(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8').includes(`"${offlineCacheName}"`));
  } finally { globalThis.window = previousWindow; globalThis.caches = previousCaches; }
});
