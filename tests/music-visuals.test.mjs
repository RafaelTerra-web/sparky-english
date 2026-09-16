import test from 'node:test';
import assert from 'node:assert/strict';
import { musicIntroCountdown, musicEnergyAt, musicSectionAt, musicVisualMoment, musicWordFill } from '../src/lib/music-visuals.ts';
import { musicEnergy } from '../src/lib/music-energy.ts';

test('count-in belongs only to the opening three media seconds, never a later round', () => {
  for (const [clock, expected] of [[-.1,3],[0,3],[1,2],[2,1],[2.999,1],[3,0],[30,0],[NaN,0]]) {
    assert.equal(musicIntroCountdown(clock, true), expected);
    assert.equal(musicIntroCountdown(clock, false), 0);
  }
});

test('narrative, dialogue, chorus and instrumental boundaries follow each song independently', () => {
  assert.equal(musicSectionAt('heartless-local', 5.42).kind, 'narrative');
  assert.equal(musicSectionAt('heartless-local', 30.55).kind, 'narrative');
  assert.equal(musicSectionAt('heartless-local', 30.56).kind, 'chorus');
  assert.equal(musicSectionAt('heartless-local', 126.32).label, 'Diálogo');
  assert.equal(musicSectionAt('heartless-local', 163.68).kind, 'instrumental');
  assert.equal(musicSectionAt('heartless-local', 180.36).label, 'Refrão final');
  assert.equal(musicSectionAt('perfect-local', 61.66).kind, 'chorus');
  assert.equal(musicSectionAt('perfect-local', 31.84).kind, 'build'); // backwards seek
  assert.equal(musicSectionAt('perfect-local', 246.48).kind, 'outro');
  assert.equal(musicSectionAt('perfect-local', NaN).kind, 'intro');
  assert.equal(musicSectionAt('unknown', 40).kind, 'verse');
  assert.equal(musicSectionAt('unknown', 40).label, 'Música');
  assert.equal(musicSectionAt('stay-at-your-house-local', 59.9).kind, 'build');
  assert.equal(musicSectionAt('stay-at-your-house-local', 60).kind, 'chorus');
  assert.equal(musicSectionAt('stay-at-your-house-local', 162).label, 'Ponte');
  assert.equal(musicSectionAt('stay-at-your-house-local', 210).label, 'Refrão final');
  assert.equal(musicSectionAt('stay-at-your-house-local', 18).kind, 'verse');
});

test('visual energy is bounded, follows seeks and never uses wall time or playback speed', () => {
  const envelope = { step: .25, values: [0,100,50] };
  assert.equal(musicEnergyAt(envelope, .125), .5);
  assert.equal(musicEnergyAt(envelope, .5), .5);
  assert.equal(musicEnergyAt(envelope, 0), 0);
  for (const clock of [-1, NaN, 50]) assert.equal(musicEnergyAt(envelope, clock), 0);
  assert.equal(musicEnergyAt(undefined, .2), 0);
  for (const [id, duration] of [['perfect-local',263.407],['heartless-local',223.237],['stay-at-your-house-local',247.989]]) {
    const data = musicEnergy[id];
    assert.ok(Math.abs(data.values.length * data.step - duration) <= data.step);
    assert.ok(data.values.every(n => Number.isInteger(n) && n >= 0 && n <= 100));
    assert.ok(new Set(data.values).size > 20, 'Envelope reflects actual varying intensity');
  }
});

test('word sweep clamps timing and instrumental moments retain the last lyric', () => {
  assert.equal(musicWordFill(3,5,2),0);
  assert.equal(musicWordFill(3,5,4),.5);
  assert.equal(musicWordFill(3,5,9),1);
  assert.equal(musicWordFill(3,3,3),1);
  assert.equal(musicWordFill(3,5,NaN),0);
  const lines = [{start:3,end:6},{start:10,end:12}];
  assert.equal(musicVisualMoment(lines,-1,0,.1),'intro');
  assert.equal(musicVisualMoment(lines,0,5,.9),'lift');
  assert.equal(musicVisualMoment(lines,0,5,.5),'flow');
  assert.equal(musicVisualMoment(lines,0,8,.9),'instrumental');
  assert.equal(musicVisualMoment(lines,1,14,.9),'outro');
});
