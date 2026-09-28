import assert from "node:assert/strict";
import { lessons } from "../src/lib/curriculum.ts";
import { lessonSteps } from "../src/lib/lesson-flow.ts";
import { startStudy, studyExercises, exerciseId } from "../src/lib/study.ts";
import { challengeLimit } from "../src/lib/quick-practice.ts";
const focus=new Set();
for(const lesson of lessons){
  assert.equal(lessonSteps(lesson,false).length,6,lesson.id);
  assert.equal(lessonSteps(lesson,false)[0].kind,"choice",lesson.id);
  const review=startStudy(lesson.id,true);
  const steps=studyExercises(lesson,true,review.exerciseIds);
  assert.equal(steps.filter(s=>s.kind==="choice").length,2,lesson.id);
  assert.equal(steps.filter(s=>s.kind==="order_words").length,1,lesson.id);
  assert.deepEqual(studyExercises(lesson,true,review.exerciseIds).map(s=>exerciseId(lesson,s)),review.exerciseIds);
  assert.equal(lesson.minutes,challengeLimit(lesson.level)/60000,lesson.id);
  for(const kind of ["example","pronunciation","vocabulary","production","dialogue"]) assert.ok(lesson.support.some(s=>s.kind===kind),lesson.id+": "+kind);
  focus.add(lesson.support.find(s=>s.kind==="pronunciation").pronunciation.focus);
}
assert.ok(focus.size>=8);
console.log(JSON.stringify({lessons:lessons.length,mandatoryPerLesson:6,mandatoryPerReview:3,optionalPronunciationSkills:focus.size}));
