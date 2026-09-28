import test from "node:test";
import assert from "node:assert/strict";
import { lessons } from "../src/lib/curriculum.ts";
import { startStudy, studyExercises, exerciseId, gradeAttempt, verifyCompletion, evaluationVersion } from "../src/lib/study.ts";
import { challengeLimit, challengeScore, savePersonalRecord } from "../src/lib/quick-practice.ts";
import { quickOnboardingStage, quickProfile } from "../src/lib/quick-onboarding.ts";
import { contentVersion } from "../src/lib/content/build.ts";
import { completeStudy, emptyRewardState } from "../src/lib/rewards.ts";
import { safeReleaseRefresh } from "../src/lib/release-policy.ts";

test("each level's representative sessions require all six correct answers and preserve IDs", () => {
 for(const level of ["A1","A2","B1","B2","C1","C2"]) for(const lesson of lessons.filter(l=>l.level===level).slice(0,2)){
  const now=Date.now(); let previous=startStudy(lesson.id,false,now);
  const steps=studyExercises(lesson,false,previous.exerciseIds);
  assert.equal(new Set(previous.exerciseIds).size,6);
  assert.equal(previous.evaluationVersion,evaluationVersion);
  for(let i=0;i<steps.length;i++){
   const input={lessonId:lesson.id,review:false,stepId:exerciseId(lesson,steps[i]),answer:steps[i].answer,assisted:false,previous};
   if(i<5) assert.throws(()=>verifyCompletion(previous,lesson.id,false,now),/incomplete/);
   if(i===2){
    previous=gradeAttempt({...input,answer:"wrong"},now).receipt;
    assert.throws(()=>gradeAttempt({...input,previous,stepId:exerciseId(lesson,steps[3])},now),/out-of-order/);
   }
   previous=gradeAttempt({...input,previous},now).receipt;
  }
  assert.equal(verifyCompletion(previous,lesson.id,false,now).independent,false);
  assert.equal(challengeScore(previous.passed,previous.failed,previous.assisted),550);
  assert.throws(()=>gradeAttempt({lessonId:lesson.id,review:false,stepId:previous.exerciseIds[0],answer:steps[0].answer,assisted:false,previous},now+9*3600000),/expired/);
  assert.throws(()=>verifyCompletion({...previous,contentVersion:"old"},lesson.id,false,now),/incomplete/);
  const paid=completeStudy(emptyRewardState(),lesson.id,false);
  assert.ok(paid.earned>0);assert.equal(completeStudy(paid.state,lesson.id,false).earned,0);
 }
});
test("daily review rotates, keeps session IDs fixed, and expires across the review day",()=>{
 const lesson=lessons[0],days=[1,2,3].map(day=>Date.parse("2026-09-0"+day+"T12:00:00Z"));
 const sessions=days.map(now=>startStudy(lesson.id,true,now));
 assert.equal(new Set(sessions.map(s=>s.exerciseIds.join("|"))).size,3);
 for(const session of sessions){
  const steps=studyExercises(lesson,true,session.exerciseIds);
  assert.equal(steps.filter(s=>s.kind==="choice").length,2);
  assert.equal(steps.filter(s=>s.kind==="order_words").length,1);
  assert.deepEqual(studyExercises(lesson,true,session.exerciseIds,days[2]),steps);
 }
 const late=Date.parse("2026-09-03T02:50:00Z");let receipt=startStudy(lesson.id,true,late);
 for(const step of studyExercises(lesson,true,receipt.exerciseIds))receipt=gradeAttempt({lessonId:lesson.id,review:true,stepId:exerciseId(lesson,step),answer:step.answer,assisted:false,previous:receipt},late).receipt;
 assert.throws(()=>verifyCompletion(receipt,lesson.id,true,late+20*60000),/incomplete/);
});
test("repeated words are independent tokens and reviewed equivalent orders are accepted",()=>{
 const repeated=lessons.flatMap(l=>l.exercises.filter(s=>s.kind==="order_words").map(s=>({l,s}))).filter(({s})=>new Set(s.options).size<s.options.length);
 assert.ok(repeated.length>20);
 for(const {l,s} of repeated){
  assert.deepEqual([...s.options].sort(),s.answer.split(" ").sort());
  let receipt=startStudy(l.id,false);
  for(const step of l.exercises.slice(0,l.exercises.indexOf(s)))receipt=gradeAttempt({lessonId:l.id,review:false,stepId:exerciseId(l,step),answer:step.answer,assisted:false,previous:receipt}).receipt;
  assert.equal(gradeAttempt({lessonId:l.id,review:false,stepId:exerciseId(l,s),answer:s.answer,assisted:false,previous:receipt}).correct,true);
 }
 for(const l of lessons)for(const s of l.exercises.filter(s=>s.acceptedAnswers?.length)){
  let receipt=startStudy(l.id,false);
  for(const step of l.exercises.slice(0,l.exercises.indexOf(s)))receipt=gradeAttempt({lessonId:l.id,review:false,stepId:exerciseId(l,step),answer:step.answer,assisted:false,previous:receipt}).receipt;
  for(const answer of s.acceptedAnswers)assert.equal(gradeAttempt({lessonId:l.id,review:false,stepId:exerciseId(l,s),answer,assisted:false,previous:receipt}).correct,true);
  assert.equal(gradeAttempt({lessonId:l.id,review:false,stepId:exerciseId(l,s),answer:s.answer+" extra",assisted:false,previous:receipt}).correct,false);
 }
});
test("challenge scores once per question, retains failures and uses level limits",()=>{
 for(const level of ["A1","A2"])assert.equal(challengeLimit(level),120000);
 for(const level of ["B1","B2"])assert.equal(challengeLimit(level),180000);
 for(const level of ["C1","C2"])assert.equal(challengeLimit(level),240000);
 assert.equal(challengeScore(63,0,0),600);assert.equal(challengeScore(63,1,1),550);
 assert.equal(challengeScore(1,0,0),100);assert.equal(challengeScore(1,1,1),50);
});
test("personal records use score then time and are separate by account and content",()=>{
 const old=globalThis.localStorage;const values=new Map();
 globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 try{
  const r=(score,activeMs)=>({score,activeMs,completedAt:new Date().toISOString()});
  assert.equal(savePersonalRecord("a","a1-1-1",r(600,60000)).best,true);
  assert.equal(savePersonalRecord("a","a1-1-1",r(600,70000)).best,false);
  assert.equal(savePersonalRecord("a","a1-1-1",r(600,50000)).best,true);
  assert.equal(savePersonalRecord("a","a1-1-1",r(550,10000)).best,false);
  assert.equal(savePersonalRecord("b","a1-1-1",r(550,10000)).best,true);
  assert.ok([...values.keys()].every(key=>key.includes(contentVersion)));
 }finally{globalThis.localStorage=old;}
});
test("three-stage onboarding migrates unfinished drafts and enforces guardian consent",()=>{
 assert.equal(quickOnboardingStage({step:"welcome"}),0);
 assert.equal(quickOnboardingStage({step:"age",name:"Ana",age:12,guardianConsent:false}),0);
 const saved=quickProfile({}, {name:"Ana Maria",age:12,guardianConsent:true});
 assert.equal(saved.namePronunciationStatus,"text-only");
 assert.equal(saved.mascot,"sparky");assert.equal(quickOnboardingStage(saved),1);
 for(const step of ["pronunciation","mascot","level","test"])assert.equal(quickOnboardingStage({...saved,step}),1);
 assert.equal(quickOnboardingStage({...saved,level:"B2",levelMethod:"self-assessment",step:"finish"}),2);
 assert.throws(()=>quickProfile({}, {name:"Ana",age:12,guardianConsent:false}),/responsável/);
 assert.throws(()=>quickProfile({}, {name:"<script>",age:20}),/letras/);
 const confirmed={name:"Ana",namePronunciation:"Aná",namePronunciationStatus:"confirmed",namePronunciationVersion:2};
 assert.equal(quickProfile(confirmed,{name:"Ana",age:20}).namePronunciationStatus,"confirmed");
 assert.equal(quickProfile(confirmed,{name:"Lia",age:20}).namePronunciationStatus,"text-only");
});
test("automatic release refresh waits for study, dialogs, media and visible pages",()=>{
 const old=globalThis.document;
 const doc={hidden:false,documentElement:{dataset:{}},querySelector:()=>null,querySelectorAll:()=>[]};
 globalThis.document=doc;
 try{
  assert.equal(safeReleaseRefresh(),true);
  doc.documentElement.dataset.sparkyBusy="lesson";assert.equal(safeReleaseRefresh(),false);delete doc.documentElement.dataset.sparkyBusy;
  doc.hidden=true;assert.equal(safeReleaseRefresh(),false);doc.hidden=false;
  doc.querySelector=()=>({open:true});assert.equal(safeReleaseRefresh(),false);doc.querySelector=()=>null;
  doc.querySelectorAll=()=>[{paused:false}];assert.equal(safeReleaseRefresh(),false);
 }finally{globalThis.document=old;}
});

test("engagement cohorts exclude live sessions and preserve versions and return days",async()=>{
 const {engagementReport}=await import("../src/lib/engagement-report.ts");
 const now=Date.parse("2026-09-20T12:00:00Z");
 const event=(session,day,kind,sequence,version="new")=>({account:"a",sessionId:session,contentVersion:version,sequence,kind,questionId:"lesson:mc-1",activeMs:60000,mode:"normal",review:false,createdAt:"2026-09-"+day+"T12:00:00Z"});
 const rows=[event("s1","01","start",1,"old"),event("s1","01","complete",2,"old"),event("s2","02","start",1),event("s2","02","complete",2),event("s3","08","start",1),event("s3","08","abandon",2),event("live","20","start",1)];
 const report=engagementReport(rows,now);
 assert.equal(report.starts,4);assert.equal(report.completions,2);assert.equal(report.completionRate,.5);
 assert.equal(report.medianActiveSeconds,60);
 assert.equal(report.returnD1.returned,1);assert.equal(report.returnD7.returned,1);
 assert.deepEqual(report.abandonmentByQuestion,{"lesson:mc-1":1});
 assert.equal(report.byContentVersion.old.starts,1);
 assert.equal(report.byContentVersion.new.starts,3);
 assert.ok(!JSON.stringify(report).includes('"account"'));
});
