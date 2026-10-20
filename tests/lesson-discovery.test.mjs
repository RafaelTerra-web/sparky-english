import test from 'node:test';
import assert from 'node:assert/strict';
import { filterCourse, emptyFilters } from '../src/lib/course-guide.ts';
import { grammarTopics } from '../src/lib/grammar-topics.ts';
import { lessons } from '../src/lib/curriculum.ts';

const find = (query, extra = {}) => filterCourse({...emptyFilters, query, ...extra}, {}, new Set(), new Set()).flatMap(module => module.lessons);

test('all five conditional families are searchable in English and Portuguese', () => {
  for (const [english, portuguese] of [['zero conditional','condicional zero'], ['first conditional','primeira condicional'], ['second conditional','segunda condicional'], ['third conditional','terceira condicional'], ['mixed conditionals','condicionais mistas']]) {
    const results = find(english);
    assert.ok(results.length, english);
    assert.deepEqual(find(portuguese).map(l => l.id), results.map(l => l.id), portuguese);
  }
  assert.ok(find('firt conditional').some(l => l.id === 'a2-planos-05'));
  assert.ok(find('conditional second').some(l => l.id === 'b1-hipoteses-03'));
  assert.ok(find('Second   Conditional!').some(l => l.id === 'b1-hipoteses-03'));
  assert.deepEqual(find('first conditional').map(l=>l.id), ['a2-planos-05','b1-hipoteses-04']);
  assert.deepEqual(find('past perfect simple').map(l=>l.id), ['b1-narrativas-02']);
  assert.ok(find('if clauses').some(l=>l.id === 'b2-condicionais-01'));
});

test('grammar topic selection returns only linked real lessons and honors level and status', () => {
  for (const topic of grammarTopics) {
    assert.ok(topic.lessonIds.length, topic.id);
    assert.ok(topic.lessonIds.every(id => lessons.some(l => l.id === id)), topic.id);
    assert.deepEqual(new Set(find('', {topic: topic.id}).map(l => l.id)), new Set(topic.lessonIds), topic.id);
  }
  assert.equal(find('second conditional', {level: 'A1'}).length, 0);
  assert.equal(find('', {topic: 'nonexistent'}).length, 0);
});

test('search indexes practice and support material without discarding explicit filters', () => {
  assert.ok(find('condicionais').length > find('second conditional').length);
  assert.equal(find('notarealgrammartopic').length, 0);
  assert.ok(find('second conditional', {status: 'new'}).length);
  assert.equal(find('second conditional', {status: 'done'}).length, 0);
});
