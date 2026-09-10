import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons, modules } from '../src/lib/curriculum.ts';
import { a1Modules } from '../src/lib/content/a1.ts';
import { buildLesson, contentVersion } from '../src/lib/content/build.ts';
import { lessonLedger, moduleLedger } from '../src/lib/content/ledger.ts';
import { gradeAttempt, verifyCompletion, exerciseId, isExercise, studyExercises } from '../src/lib/study.ts';
import { normalizeWorkspace, blankWorkspace, writingLimit } from '../src/lib/learning-local.ts';
import { normalizeRewardState, publicRewardState, emptyRewardState, completeStudy } from '../src/lib/rewards.ts';
import { seal } from '../src/lib/auth-session.ts';
import { cosmeticCatalog, cosmeticSlots, storeCatalog } from '../src/lib/rewards-shared.ts';

test('published identities survive editorial reordering; ledger covers all lessons and modules', () => {
  const courseModule = a1Modules[0], draft = courseModule.lessons[0];
  assert.equal(buildLesson(draft, courseModule, 0).id, buildLesson(draft, courseModule, 5).id);
  assert.equal(new Set(lessonLedger).size, lessons.length);
  assert.deepEqual(new Set(lessonLedger), new Set(lessons.map(l => l.id)));
  assert.deepEqual(new Set(moduleLedger), new Set(modules.map(m => m.id)));
  for (const lesson of lessons) {
    const ids = lesson.steps.filter(isExercise).map(s => exerciseId(lesson, s));
    assert.equal(new Set(ids).size, ids.length);
  }
});
test('legacy cookie bit zero keeps the original lesson identity after catalog order changes', () => {
  const original = [...lessons];
  try {
    lessons.reverse();
    const bits = Buffer.alloc(15); bits[0] = 1;
    const state = normalizeRewardState({ version: 1, completedBits: bits.toString('base64url'), coins: 10, dueDays: [20702] });
    assert.deepEqual(Object.keys(publicRewardState(state).completed), ['a1-1-1']);
    assert.equal(completeStudy(state, 'a1-1-1', false).earned, 0);
  } finally { lessons.splice(0, lessons.length, ...original); }
});
test('server grading rejects skipped exercises and incomplete, wrong-lesson or expired evidence', () => {
  const lesson = lessons[0], steps = lesson.steps.filter(isExercise), now = Date.now();
  const input = s => ({ lessonId: lesson.id, review: false, stepId: exerciseId(lesson,s), answer: s.answer, assisted: false });
  assert.throws(() => gradeAttempt(input(steps[1]),now), /out-of-order/);
  assert.throws(() => verifyCompletion(null,lesson.id,false), /incomplete/);
  let receipt;
  for (const step of steps) receipt = gradeAttempt({ ...input(step), previous: receipt },now).receipt;
  assert.deepEqual(verifyCompletion(receipt,lesson.id,false,now), { independent: true });
  assert.throws(() => verifyCompletion(receipt,lessons[1].id,false,now), /incomplete/);
  assert.throws(() => verifyCompletion(receipt,lesson.id,true,now), /incomplete/);
  assert.throws(() => verifyCompletion(receipt,lesson.id,false,now + 9*3600000), /incomplete/);
});
test('retry and help remain in completion evidence after a later correct answer', () => {
  const lesson = lessons[0], steps = studyExercises(lesson, true);
  let receipt = gradeAttempt({ lessonId: lesson.id, review: true, stepId: exerciseId(lesson,steps[0]), answer:'wrong', assisted:false }).receipt;
  for (const step of steps) receipt = gradeAttempt({ lessonId: lesson.id, review: true, stepId: exerciseId(lesson,step), answer:step.answer, assisted:true, previous:receipt }).receipt;
  assert.equal(verifyCompletion(receipt,lesson.id,true).independent,false);
});
test('independent delayed reviews expand spacing; assisted review resets spacing without removing coins', () => {
  const id=lessons[0].id;
  let state=completeStudy(emptyRewardState(),id,false,new Date('2026-09-01T12:00Z')).state;
  state=completeStudy(state,id,true,new Date('2026-09-04T12:00Z'),true).state;
  assert.equal(publicRewardState(state).reviews[id],'2026-09-11T03:00:00.000Z');
  state=completeStudy(state,id,true,new Date('2026-09-11T12:00Z'),true).state;
  assert.equal(publicRewardState(state).reviews[id],'2026-09-25T03:00:00.000Z');
  const coins=state.coins;
  state=completeStudy(state,id,true,new Date('2026-09-25T12:00Z'),false).state;
  assert.equal(publicRewardState(state).reviews[id],'2026-09-28T03:00:00.000Z');
  assert.equal(state.coins,coins+2);
});
test('corrupt storage cannot crash notebook and obsolete checkpoints cannot resume', () => {
  assert.deepEqual(normalizeWorkspace(null), blankWorkspace());
  const state=normalizeWorkspace({version:1, checkpoints:{bad:{contentVersion:'old'}}, writings:[null,{}], attempts:[null,{}], vocabulary:[null],minutes:99});
  assert.deepEqual(state.checkpoints,{}); assert.equal(state.writings.length,0); assert.equal(state.attempts.length,0); assert.equal(state.minutes,10);
});
test('lesson checkpoint preserves bounded state for backward navigation', () => {
  const step = {answer:'A',tokens:[],checked:true,correct:true,translation:false,assisted:false,contextVisible:false,revealed:true,listened:true};
  const checkpoint = {lessonId:'a1-identidade-01',review:false,index:2,answer:'',tokens:[],checked:false,correct:false,
    translation:false,assisted:false,contextVisible:false,revealed:false,listened:false,receipt:'receipt',draft:'',updatedAt:'2026-09-07T12:00:00Z',contentVersion,
    furthestIndex:4,history:{'1':step,'99':step,'2':{...step,tokens:[999]}}};
  const normalized=normalizeWorkspace({...blankWorkspace(),checkpoints:{lesson:checkpoint}}).checkpoints.lesson;
  assert.equal(normalized.furthestIndex,4);
  assert.deepEqual(Object.keys(normalized.history),['1']);
  assert.equal(normalized.history['1'].correct,true);
});
test('maximum published progress fits comfortably within a browser cookie', async () => {
  process.env.SPARKY_SESSION_SECRET='test-only-secret-with-at-least-32-characters';
  let state=emptyRewardState();
  for(const lesson of lessons) state=completeStudy(state,lesson.id,false).state;
  state = normalizeRewardState({ ...state, version: 1, owned: storeCatalog.map(item => item.id) });
  for (const mascot of ['sparky', 'pinky']) {
    for (const slot of cosmeticSlots) {
      const item = cosmeticCatalog.find(item => item.slot === slot && item.mascots.includes(mascot));
      if (item) state.equipped[mascot][slot] = item.id;
    }
  }
  state.coins = 999999;
  state.reviewStages.fill(4);
  state.reviewCount = 10;
  state.reviewDay = 30000;
  const token=await seal({state},'rewards:fixture',365*86400);
  assert.ok(token.length + 160 < 4096, `cookie envelope: ${token.length}`);
});
test('a curriculum update archives an unfinished draft instead of silently losing it', () => {
  const value=normalizeWorkspace({ ...blankWorkspace(), checkpoints:{old:{lessonId:'a1-1-1',draft:'My unfinished text.',contentVersion:'old',updatedAt:'2026-09-05T12:00:00Z'}} });
  assert.equal(Object.keys(value.checkpoints).length,0);
  assert.equal(value.writings[0].text,'My unfinished text.');
  assert.equal(normalizeWorkspace(value).writings.length,1);
});
test('advanced essays survive notebook normalization beyond the old 4000 character limit', () => {
  const text = 'Precise argument and supporting evidence. '.repeat(150);
  const writing = { id:'essay', lessonId:'c2-producao-06', text, createdAt:'2026-09-06T12:00:00Z', contentVersion:'current' };
  assert.ok(text.length > 4000 && text.length < writingLimit);
  assert.equal(normalizeWorkspace({ ...blankWorkspace(), writings:[writing] }).writings[0].text, text);
  assert.equal(normalizeWorkspace({ ...blankWorkspace(), writings:[{ ...writing, text:'x'.repeat(writingLimit + 1) }] }).writings.length, 0);
});
