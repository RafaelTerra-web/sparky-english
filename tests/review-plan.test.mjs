import test from 'node:test';
import assert from 'node:assert/strict';
import { planReviews, studyDay } from '../src/lib/review-plan.ts';
import { lessons } from '../src/lib/curriculum.ts';
import { completeStudy, emptyRewardState, publicRewardState } from '../src/lib/rewards.ts';
import { studyExercises, gradeAttempt, verifyCompletion, exerciseId } from '../src/lib/study.ts';
test('a prior-level backlog never produces more than three daily reviews',()=>{
 const studied=lessons.filter(l=>l.level==='A1').slice(0,20),reviews=Object.fromEntries(studied.map(l=>[l.id,'2026-09-01T03:00:00Z']));
 assert.equal(planReviews(studied,reviews,'A2',0,new Date('2026-09-09T12:00Z')).due.length,3);
 assert.equal(planReviews(studied,reviews,'A2',2,new Date('2026-09-09T12:00Z')).due.length,1);
 assert.equal(planReviews(studied,reviews,'A2',3,new Date('2026-09-09T12:00Z')).due.length,0);
});
test('server cap survives state round-trips and resets at Sao Paulo midnight',()=>{
 let state=emptyRewardState();for(const l of lessons.slice(0,5))state=completeStudy(state,l.id,false,new Date('2026-09-01T12:00Z')).state;
 for(const l of lessons.slice(0,3))state=completeStudy(state,l.id,true,new Date('2026-09-09T12:00Z')).state;
 const blocked=completeStudy(state,lessons[3].id,true,new Date('2026-09-10T02:59Z'));assert.equal(blocked.earned,0);
 assert.deepEqual(publicRewardState(blocked.state).dailyReviews,{day:'2026-09-09',count:3});
 const tomorrow=completeStudy(blocked.state,lessons[3].id,true,new Date('2026-09-10T03:00Z'));assert.equal(tomorrow.earned,2);assert.equal(tomorrow.state.reviewCount,1);
 assert.equal(studyDay(new Date('2026-09-10T02:59Z')),'2026-09-09');
});
test('a short review requires one validated answer and cannot complete a full lesson',()=>{
 const lesson=lessons[0],steps=studyExercises(lesson,true);assert.equal(steps.length,1);
 const {receipt}=gradeAttempt({lessonId:lesson.id,review:true,stepId:exerciseId(lesson,steps[0]),answer:steps[0].answer,assisted:false});
 assert.equal(verifyCompletion(receipt,lesson.id,true).independent,true);assert.throws(()=>verifyCompletion(receipt,lesson.id,false),/incomplete/);
 assert.equal(studyExercises(lesson,false).length,3);
});
