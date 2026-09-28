import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/lib/curriculum.ts';
import { lessonSteps, migrateLessonCheckpoint, lessonFlowVersion } from '../src/lib/lesson-flow.ts';
import { isExercise, studyExercises } from '../src/lib/study.ts';
import { lessonDelivery, lessonVoiceIdentity, preservedDelivery } from '../src/lib/lesson-voice-config.ts';
import { mascotSpeechPrompt } from '../src/lib/gemini-voice.ts';
import { contentVersion } from '../src/lib/content/build.ts';

test('six-question flow separates mandatory practice from optional reference material', () => {
  for (const lesson of lessons) for (const review of [false,true]) {
    const steps=lessonSteps(lesson,review);
    assert.equal(steps.length,review?3:6);
    assert.ok(steps.every(isExercise));
    assert.deepEqual(steps,studyExercises(lesson,review));
    assert.ok(lesson.support.some(s=>s.kind==='production'));
  }
});
test('old flow restarts while new checkpoints retain the authorized exercise selection', () => {
  const lesson=lessons[0];
  assert.equal(migrateLessonCheckpoint({review:false,index:2,receipt:'old',contentVersion,flowVersion:2},lesson),undefined);
  for(const review of [false,true]) {
    const steps=studyExercises(lesson,review);
    const ids=steps.map(s=>lesson.id+':'+s.id);
    const current={review,index:1,receipt:'signed',answer:'partial',tokens:[0],contentVersion,flowVersion:lessonFlowVersion,reviewFormat:3,exerciseIds:ids,exerciseId:ids[1]};
    assert.deepEqual(migrateLessonCheckpoint(current,lesson),current);
    assert.equal(migrateLessonCheckpoint({...current,exerciseId:ids[0]},lesson),undefined);
    assert.equal(migrateLessonCheckpoint({...current,exerciseIds:['bad']},lesson),undefined);
  }
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
