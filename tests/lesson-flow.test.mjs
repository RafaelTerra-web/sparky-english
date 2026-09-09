import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/lib/curriculum.ts';
import { lessonSteps, migrateLessonCheckpoint, lessonFlowVersion } from '../src/lib/lesson-flow.ts';
import { isExercise } from '../src/lib/study.ts';
import { lessonDelivery, lessonVoiceIdentity, preservedDelivery } from '../src/lib/lesson-voice-config.ts';
import { mascotSpeechPrompt } from '../src/lib/gemini-voice.ts';
import { contentVersion } from '../src/lib/content/build.ts';

test('shorter lesson flow retains every assessed item in its original order', () => {
  for (const lesson of lessons) for (const review of [false, true]) {
    const steps = lessonSteps(lesson, review);
    assert.ok(!steps.some(step => step.kind === 'production'));
    assert.equal(steps.at(-1).kind, 'summary');
    assert.deepEqual(steps.filter(isExercise), lesson.steps.filter(isExercise));
  }
});

test('old checkpoints migrate before, on and after removed writing, without losing receipts or drafts', () => {
  const state = { answer:'saved answer', tokens:[], checked:true, correct:true, translation:true, assisted:true, contextVisible:true, revealed:true, listened:true };
  for (const lesson of lessons) for (const index of lesson.steps.keys()) {
    const checkpoint = { ...state, lessonId:lesson.id, review:false, index, furthestIndex:lesson.steps.length-1, history:Object.fromEntries(lesson.steps.map((_,i)=>[i,state])), draft:'My existing draft', receipt:'signed evidence', updatedAt:new Date().toISOString(), contentVersion };
    const migrated = migrateLessonCheckpoint(checkpoint, lesson);
    assert.equal(migrated.receipt, checkpoint.receipt);
    assert.equal(migrated.draft, checkpoint.draft);
    assert.equal(migrated.flowVersion, lessonFlowVersion);
    assert.deepEqual(migrateLessonCheckpoint(migrated, lesson), migrated);
    const visible = lessonSteps(lesson,false);
    assert.equal(visible[migrated.index].kind, lesson.steps[index].kind === 'production' ? 'summary' : lesson.steps[index].kind);
    assert.equal(migrated.furthestIndex, visible.length-1);
    if (lesson.steps[index].kind !== 'production') assert.equal(migrated.answer, state.answer);
    assert.equal(Object.keys(migrated.history).length, visible.length);
  }
});

test('review checkpoints keep their independent question indexes', () => {
  const old = { review:true, index:2, history:{2:{answer:'yes'}}, receipt:'signed' };
  assert.deepEqual(migrateLessonCheckpoint(old,lessons[0]), {...old,flowVersion:lessonFlowVersion});
});

test('natural delivery changes only intermediate/advanced English, never personal names', () => {
  for (const mascot of ['sparky','pinky']) for (const level of ['B1','B2','C1','C2']) {
    const prompt = mascotSpeechPrompt('The next train is late.',mascot,'en-US',false,undefined,lessonDelivery[level]);
    assert.ok(prompt.includes(lessonDelivery[level]));
    assert.ok(!prompt.includes('consistent medium pace'));
    assert.equal(lessonVoiceIdentity('Hello.',mascot,level).version,2);
    assert.ok(!mascotSpeechPrompt('Anselmot',mascot,'pt-BR',true,undefined,lessonDelivery[level]).includes(lessonDelivery[level]));
  }
  assert.equal(lessonVoiceIdentity('Hello.','sparky','A1').version,undefined);
});

test('provider-blocked benign sentence retains its existing Gemini voice explicitly', () => {
  const profile=lessonVoiceIdentity(preservedDelivery.text,'pinky','B1');
  assert.equal(profile.model,'gemini-3.1-flash-tts-preview');
  assert.equal(profile.voice,'Zephyr');
  assert.equal(profile.version,undefined);
  assert.equal(lessonVoiceIdentity(preservedDelivery.text,'sparky','B1').version,2);
});
