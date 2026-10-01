import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMusicEffectsMode } from '../src/lib/music-effects.ts';

test('unknown or absent device preferences preserve the automatic default', () => {
  for (const value of [null, undefined, 'auto', '', 'loud', {}, false]) {
    assert.equal(normalizeMusicEffectsMode(value), 'auto');
  }
  assert.equal(normalizeMusicEffectsMode('reduced'), 'reduced');
  assert.equal(normalizeMusicEffectsMode('off'), 'off');
});
