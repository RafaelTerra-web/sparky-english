import test from 'node:test';
import assert from 'node:assert/strict';
import { musifyIdentities, musifyEffectAt } from '../src/lib/musify-identity.ts';

test('every released song has a distinct coherent Musify identity', () => {
  assert.equal(Object.keys(musifyIdentities).length, 11);
  assert.equal(new Set(Object.values(musifyIdentities).map(identity => identity.background)).size, 11);
  for (const identity of Object.values(musifyIdentities)) {
    assert.match(identity.accent, /^#[0-9a-f]{6}$/);
    assert.ok(identity.effect && identity.mood);
  }
});
test('butterflies appear when sung for seven seconds and follow seeks and replay', () => {
  const lines = [{ words: [{text:'butterflies,',start:46,end:48}, {text:'butterflies',start:114,end:116}] }];
  for (const [clock, expected] of [[45.99,null],[46,'butterflies'],[54.99,'butterflies'],[55,null],[114,'butterflies'],[123,null],[46,'butterflies'],[0,null],[NaN,null]])
    assert.equal(musifyEffectAt('still-into-you', lines, clock), expected);
  assert.equal(musifyEffectAt('unknown', lines, 47), null);
  assert.equal(musifyEffectAt('savage', lines, 47), 'crown');
});
