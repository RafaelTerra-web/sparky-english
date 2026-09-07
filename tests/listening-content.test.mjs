import test from 'node:test';
import assert from 'node:assert/strict';
import { advancedExpansionModules } from '../src/lib/content/advanced-expansion.ts';
import { modules, lessons } from '../src/lib/curriculum.ts';
import { buildLesson } from '../src/lib/content/build.ts';
import { isExercise } from '../src/lib/study.ts';

test('reserved expansion has 36 unique lessons, six modules and twelve lessons per level', () => {
  assert.equal(advancedExpansionModules.length, 6);
  const drafts = advancedExpansionModules.flatMap(m => m.lessons);
  assert.equal(drafts.length, 36);
  assert.equal(new Set(drafts.map(l => l.id)).size, 36);
  assert.equal(new Set(drafts.map(l => l.listening.id)).size, 36);
  const allModules = [...modules, ...advancedExpansionModules];
  assert.equal(new Set(allModules.map(m => m.id)).size, allModules.length);
  assert.equal(new Set([...lessons, ...drafts].map(l => l.id)).size, lessons.length + 36);
  for (const level of ['B2','C1','C2']) assert.equal(advancedExpansionModules.filter(m => m.level === level).flatMap(m => m.lessons).length, 12);
  for (const courseModule of advancedExpansionModules) assert.ok(allModules.some(m => m.id === courseModule.prerequisiteId), courseModule.id);
});

for (const courseModule of advancedExpansionModules) {
test(`${courseModule.id} contains six distinct authored conversation lessons`, () => {
  assert.equal(courseModule.lessons.length, 6);
  assert.equal(new Set(courseModule.lessons.map(l => l.listening.id)).size, 6);
  for (const [index, draft] of courseModule.lessons.entries()) {
    const scene = draft.listening;
    assert.ok(scene.turns.length >= 6);
    assert.deepEqual(new Set(scene.turns.map(t => t.speaker)), new Set(['sparky', 'pinky']));
    const wordCount = scene.turns.map(t => t.text).join(' ').split(/\s+/).length;
    const [minimum, maximum] = courseModule.level === 'B2' ? [175, 300] : courseModule.level === 'C1' ? [280, 450] : [380, 580];
    assert.ok(wordCount >= minimum && wordCount <= maximum, `${draft.id}: ${wordCount} words`);
    for (const turn of scene.turns) { assert.ok(turn.text.length > 40); assert.ok(turn.translation.length > 40); }
    for (const question of [scene.gist, scene.detail, scene.inference]) {
      assert.equal(question.choices.length, 3);
      assert.equal(new Set(question.choices).size, 3);
      assert.ok(question.explanation.length > 30);
    }
    assert.ok(scene.mediation.length > 80);
    assert.ok(draft.speakingTask.length > 80);
    const lesson = buildLesson(draft, courseModule, index);
    assert.equal(lesson.steps.filter(isExercise).length, 5);
    const firstQuestion = lesson.steps.find(s => isExercise(s));
    assert.equal(firstQuestion.kind, 'choice');
    assert.equal(firstQuestion.english, undefined, 'transcript must not leak through generic rendering');
    assert.equal(firstQuestion.translation, undefined);
    assert.ok(lesson.steps.findIndex(s => s.kind === 'teach') > lesson.steps.indexOf(firstQuestion));
    assert.equal(lesson.steps.find(s => s.kind === 'production').mediation, scene.mediation);
  }
});
}
