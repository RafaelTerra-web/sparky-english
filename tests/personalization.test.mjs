import test from 'node:test';
import assert from 'node:assert/strict';
import { speechBounds } from '../src/lib/audio-timeline.ts';
import { personalizeLesson } from '../src/lib/personalized-lesson.ts';
import { lessons } from '../src/lib/curriculum.ts';
import { gradeAttempt, isExercise, exerciseId } from '../src/lib/study.ts';
test('speech edges are trimmed with padding while internal silence remains', () => {
 const data = new Float32Array(1000); data[300] = 0.5; data[600] = 0.5;
 assert.deepEqual(speechBounds([data], 1000), { offset: 0.275, duration: 0.351 });
});
test('personalization preserves IDs and grades the same personalized exercises', () => {
 const original = lessons.find(l => l.id === 'a1-1-1');
 const lesson = personalizeLesson(original, 'Rafael');
 assert.equal(lesson.id, original.id);
 assert.ok(lesson.steps.some(s => s.english === "Hi, I'm Rafael."));
 assert.ok(JSON.stringify(original).includes('Ana'));
 assert.ok(!JSON.stringify(lesson).includes('Ana'));
 let previous;
 for (const step of lesson.steps.filter(isExercise)) {
  const result = gradeAttempt({lessonId: lesson.id, review: false, stepId: exerciseId(lesson, step), answer: step.answer, assisted: false, learnerName: 'Rafael', previous});
  assert.equal(result.correct, true); previous = result.receipt;
 }
 assert.strictEqual(personalizeLesson(original, '<script>'), original);
 assert.ok(JSON.stringify(personalizeLesson(original, 'João Pedro')).includes('João Pedro'));
});
test('timeline remains active across pauses and schedules all clips before completion', async () => {
 const { playTimeline } = await import('../src/lib/audio-timeline.ts');
 const oldContext = globalThis.AudioContext, oldFetch = globalThis.fetch;
 const starts = [], states = [];
 class Context {
  state = 'running'; currentTime = 0; sampleRate = 1000; destination = {};
  async resume() {} async close() { this.state = 'closed'; }
  async decodeAudioData() { return {numberOfChannels: 1, sampleRate: 1000, getChannelData: () => new Float32Array(100).fill(0.5)}; }
  createGain() { return {connect(){}, gain: {setValueAtTime(){}, linearRampToValueAtTime(){}}}; }
  createBuffer() { return {}; }
  createBufferSource() { return {connect(){}, start(time){ starts.push(time); queueMicrotask(() => this.onended?.()); }}; }
 }
 globalThis.AudioContext = Context;
 globalThis.fetch = async () => ({ok: true, arrayBuffer: async () => new ArrayBuffer(1)});
 try {
  await playTimeline([{type:'audio',source:'/a'}, {type:'pause',durationMs:80}, {type:'audio',source:'/b'}], new AbortController().signal, value => states.push(value));
  assert.deepEqual(states,[true,false]);
  assert.equal(starts.length,3);
  assert.ok(Math.abs(starts[1] - 0.2) < 0.0001);
 } finally { globalThis.AudioContext = oldContext; globalThis.fetch = oldFetch; }
});
