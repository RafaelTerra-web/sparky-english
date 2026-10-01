import test from 'node:test';
import assert from 'node:assert/strict';
import {
  drawMusifyScene, musifyDrawingIntensity, musifyProtectedRect,
  musifySceneDefinition, musifySceneDefinitions, musifySemanticSuppressed,
} from '../src/lib/musify-drawing.ts';

const base = {
  time: 80, duration: 220, transformationAt: 180, width: 393, height: 700,
  beat: .7, section: { kind: 'chorus', intensity: .9 }, cue: null,
  answering: false, quality: 'normal', reduced: false, hiddenConcepts: [],
};

function draw(frame) {
  const calls = [];
  const context = new Proxy({}, {
    get(_target, key) { return (...args) => calls.push([key, ...args]); },
    set(_target, key, value) { calls.push(['set', key, value]); return true; },
  });
  drawMusifyScene(context, frame);
  return calls;
}

test('all eleven tracks have different choreography and deterministic replay after a seek', () => {
  const identities = Object.entries(musifySceneDefinitions);
  assert.equal(identities.length, 11);
  assert.equal(new Set(identities.map(([, value]) => value.scene)).size, 11);
  const scenes = new Set();
  for (const [id] of identities) {
    const first = draw({ ...base, id });
    draw({ ...base, id, time: 190 });
    assert.deepEqual(draw({ ...base, id }), first, id);
    assert.ok(first.length > 20, id);
    assert.equal(first[0][0], 'save');
    assert.equal(first.at(-1)[0], 'restore');
    scenes.add(JSON.stringify(first));
  }
  assert.equal(scenes.size, 11);
  assert.equal(musifySceneDefinition('unknown').scene, 'quiet-orbits');
});

test('a pending English or Portuguese target suppresses semantic wings and petals', () => {
  const id = 'still-into-you';
  const butterflies = draw({ ...base, id, cue: 'butterflies' });
  assert.ok(butterflies.some(call => call[0] === 'bezierCurveTo'));
  for (const target of ['butterflies,', 'BUTTERFLY', 'borboletas']) {
    assert.equal(musifySemanticSuppressed(id, [target]), true);
    const pending = draw({ ...base, id, cue: 'butterflies', hiddenConcepts: [target] });
    assert.ok(!pending.some(call => call[0] === 'bezierCurveTo'));
  }
  assert.ok(!draw({ ...base, id, cue: 'ribbons' }).some(call => call[0] === 'bezierCurveTo'));
  assert.equal(musifySemanticSuppressed('buttercup-local', ['flowers']), true);
  assert.equal(musifySemanticSuppressed('buttercup-local', ['flor']), true);
  assert.equal(musifySemanticSuppressed('buttercup-local', ['buttercup']), true);
  const flower = draw({ ...base, id: 'buttercup-local', cue: 'flowers' });
  const pendingFlower = draw({ ...base, id: 'buttercup-local', cue: 'flowers', hiddenConcepts: ['buttercup'] });
  assert.notDeepEqual(pendingFlower, flower);
});

test('protected text and controls stay within the backing surface after reflow', () => {
  const stage = { left: 20, top: 40, width: 320, height: 600 };
  assert.deepEqual(musifyProtectedRect({ left: 30, top: 60, width: 100, height: 44 }, stage), { x: 2, y: 12, width: 116, height: 60 });
  assert.deepEqual(musifyProtectedRect({ left: 10, top: 30, width: 350, height: 100 }, stage), { x: 0, y: 0, width: 320, height: 98 });
  assert.equal(musifyProtectedRect({ left: 600, top: 60, width: 44, height: 44 }, stage), null);
  assert.equal(musifyProtectedRect({ left: 40, top: 60, width: 0, height: 44 }, stage), null);
});

test('answering halves authored intensity and static motion remains deterministic', () => {
  assert.equal(musifyDrawingIntensity(base), .9);
  assert.equal(musifyDrawingIntensity({ ...base, answering: true }), .45);
  for (const id of Object.keys(musifySceneDefinitions).filter(id => id !== 'heartless-local')) {
    assert.deepEqual(draw({ ...base, id, time: 3, reduced: true, static: true }), draw({ ...base, id, time: 100, reduced: true, static: true }));
  }
});

test('Heartless keeps its final-chorus transformation when motion is reduced', () => {
  const warm = draw({ ...base, id: 'heartless-local', time: 179.9, reduced: true, static: true });
  const cold = draw({ ...base, id: 'heartless-local', time: 180, reduced: true, static: true });
  assert.notDeepEqual(warm, cold);
  assert.ok(warm.some(call => call[0] === 'set' && call[1] === 'strokeStyle' && call[2] === '#edbbad'));
  assert.ok(cold.some(call => call[0] === 'set' && call[1] === 'strokeStyle' && call[2] === '#839cdf'));
});

test('invalid media clocks and zero geometry cannot produce nonfinite coordinates', () => {
  for (const id of Object.keys(musifySceneDefinitions)) {
    const calls = draw({ ...base, id, time: NaN, beat: NaN, section: { kind: 'verse', intensity: NaN } });
    assert.ok(calls.every(call => call.every(value => typeof value !== 'number' || Number.isFinite(value))), id);
  }
  assert.deepEqual(draw({ ...base, id: 'savage', width: 0 }), []);
});
