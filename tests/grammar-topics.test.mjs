import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons, modules } from '../src/lib/curriculum.ts';
import { grammarTopics, grammarTopicsForLesson, grammarSearchTermsForLesson } from '../src/lib/grammar-topics.ts';
import { conditionalModules } from '../src/lib/content/conditionals.ts';
import { lessonLedger, moduleLedger } from '../src/lib/content/ledger.ts';
import { lessonIllustrationId } from '../src/lib/lesson-illustrations.ts';

test('topic lists cover A1 to C2 and link only to real, relevant published lessons', () => {
  const byId = new Map(lessons.map(lesson => [lesson.id, lesson]));
  assert.equal(new Set(grammarTopics.map(topic => topic.id)).size, grammarTopics.length);
  assert.deepEqual(new Set(grammarTopics.map(topic => topic.level)), new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']));
  for (const topic of grammarTopics) {
    assert.ok(topic.title && topic.description && topic.aliases.length && topic.lessonIds.length, topic.id);
    assert.equal(new Set(topic.lessonIds).size, topic.lessonIds.length, topic.id);
    for (const id of topic.lessonIds) {
      assert.ok(byId.has(id), topic.id + ': ' + id);
      assert.ok(grammarTopicsForLesson(id).includes(topic), id);
      assert.ok(grammarSearchTermsForLesson(id).includes(topic.title), id);
    }
  }
  assert.deepEqual(grammarTopicsForLesson('nonexistent'), []);
  assert.equal(grammarSearchTermsForLesson('nonexistent'), '');
  // The reference list includes subjects not yet taught; never invent matching lessons.
  assert.ok(!grammarTopics.some(topic => topic.title === 'Future Perfect Continuous'));
});

test('all five conditional families point to distinct genuine teaching and practice', () => {
  const expected = {
    'zero-conditional': ['A2', 'a2-planos-06', 'presente nas duas partes'],
    'first-conditional': ['A2', 'a2-planos-05', 'if + presente'],
    'second-conditional': ['B1', 'b1-hipoteses-03', 'if + passado'],
    'third-conditional': ['B2', 'b2-autonomia-05', 'if + past perfect'],
    'mixed-conditionals': ['B2', 'b2-condicionais-01', 'condicional mista'],
  };
  for (const [id, [level, lessonId, teaching]] of Object.entries(expected)) {
    const topic = grammarTopics.find(topic => topic.id === id);
    assert.equal(topic.level, level);
    assert.ok(topic.lessonIds.includes(lessonId));
    const lesson = lessons.find(lesson => lesson.id === lessonId);
    assert.ok(lesson.support.some(step => step.kind === 'teach' && step.body.includes(teaching)), lessonId);
    assert.equal(lesson.exercises.length, 6);
    assert.ok(lesson.exercises.some(step => step.kind === 'order_words' && /^If|^When/.test(step.answer)), lessonId);
  }
});

test('mixed lessons teach both time directions and preserve append-only progress identities', () => {
  const [pastPresent, presentPast] = conditionalModules[0].lessons;
  assert.ok(pastPresent.rule.includes('if + past perfect, would + verbo base'));
  assert.ok(presentPast.rule.includes('if + past simple, would have + particípio'));
  assert.deepEqual(lessonLedger.slice(-2), [pastPresent.id, presentPast.id]);
  assert.equal(moduleLedger.at(-1), 'b2-condicionais');
  const course = modules.find(module => module.id === 'b2-condicionais');
  assert.equal(course.prerequisiteId, 'b2-autonomia');
  assert.ok(course.lessons.every(lesson => lessonIllustrationId(lesson) === 'b2-autonomia'));
});
