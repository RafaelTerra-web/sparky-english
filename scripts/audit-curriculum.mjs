import assert from "node:assert/strict";
import { lessons, modules } from "../src/lib/curriculum.ts";
import { exerciseId, studyExercises, gradeAttempt, startStudy, verifyCompletion } from "../src/lib/study.ts";
import { lessonLedger, moduleLedger } from "../src/lib/content/ledger.ts";
import { normalizeOrderAnswer } from "../src/lib/content/order-variants.ts";
const words = text => text?.trim().split(/\s+/).length ?? 0;
let choice = 0, order = 0;
const allIds = new Set();
assert.equal(lessons.length,176);
assert.deepEqual(new Set(lessonLedger),new Set(lessons.map(l=>l.id)));
assert.deepEqual(new Set(moduleLedger),new Set(modules.map(m=>m.id)));
for (const lesson of lessons) {
  const steps = studyExercises(lesson,false);
  assert.deepEqual(steps.map(s=>s.kind),["choice","order_words","choice","order_words","choice","order_words"],lesson.id);
  assert.ok(lesson.support?.some(s=>s.kind==="teach"),lesson.id);
  assert.ok(lesson.support?.some(s=>s.kind==="production"),lesson.id);
  const beginner = ["A1","A2"].includes(lesson.level), intermediate=["B1","B2"].includes(lesson.level);
  let proof = startStudy(lesson.id,false);
  for (const step of steps) {
    const id=exerciseId(lesson,step);
    assert.ok(!allIds.has(id),id);allIds.add(id);
    assert.ok(words(step.body)<=12 && words(step.bodyEnglish)<=12,id+": instruction");
    assert.ok(words(step.english)<=(beginner?25:45),id+": context");
    assert.ok(step.explanation && step.explanationEnglish,id+": feedback in both languages");
    assert.ok(words(step.explanation)<=35 && words(step.explanationEnglish)<=35,id+": short feedback");
    if(step.kind==="choice"){
      choice++;assert.equal(step.options.length,3,id);assert.equal(new Set(step.options).size,3,id);
      assert.equal(step.options.filter(o=>o===step.answer).length,1,id);
      for(const answer of step.options.filter(o=>o!==step.answer)) assert.equal(gradeAttempt({lessonId:lesson.id,review:false,stepId:id,answer,assisted:false,previous:proof}).correct,false,id);
    }else{
      order++;const length=words(step.answer);
      assert.ok(length>=(beginner?3:intermediate?6:8)&&length<=(beginner?8:intermediate?12:16),id+": word count");
      const bag=value=>normalizeOrderAnswer(value).split(" ").sort();
      assert.deepEqual(bag(step.options.join(" ")),bag(step.answer),id);
      for(const answer of step.acceptedAnswers??[]) assert.deepEqual(bag(answer),bag(step.answer),id+": equivalent token set");
    }
    proof=gradeAttempt({lessonId:lesson.id,review:false,stepId:id,answer:step.answer,assisted:false,previous:proof}).receipt;
  }
  assert.deepEqual(verifyCompletion(proof,lesson.id,false),{independent:true});
  assert.equal(new Set(steps.filter(s=>s.kind==="order_words").map(s=>s.answer)).size,3,lesson.id);
}
assert.equal(choice,528);assert.equal(order,528);
console.log(JSON.stringify({lessons:lessons.length,modules:modules.length,choice,order,exercises:allIds.size,errors:0}));
