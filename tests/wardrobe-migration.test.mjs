import assert from 'node:assert/strict';
import test from 'node:test';
import { storeLedger } from '../src/lib/store-ledger.ts';
import { accessoryCatalog, retiredScenePrices, legacyLookGrants, isCompatibleCosmetic } from '../src/lib/rewards-shared.ts';
import { emptyRewardState, normalizeRewardState, publicRewardState, buyCosmetic, equipCosmetic, resetLook, completeStudy } from '../src/lib/rewards.ts';
import { lessons } from '../src/lib/curriculum.ts';

function oldState(ids) {
  const state = completeStudy(emptyRewardState(), lessons[0].id, false).state;
  const bits = Buffer.alloc(Math.ceil(19 / 8));
  for (const id of ids) { const index = storeLedger.indexOf(id); bits[index >> 3] |= 1 << (index % 8); }
  return { ...state, version: 3, wardrobeVersion: 2, coins: 123, ownedBits: bits.toString('base64url'), equipped: { sparky: { style: 'sparky-explorer-look', scene: 'scene-aurora' }, pinky: { style: 'pinky-focus-look' } } };
}

test('v3 migration preserves progress, grants all old outfit pieces and refunds all scenes once', () => {
  const old = oldState([...Object.keys(retiredScenePrices), ...Object.keys(legacyLookGrants)]);
  const state = normalizeRewardState(old);
  assert.equal(state.coins, 773);
  assert.equal(state.sceneRefund, 650);
  for (const field of ['completedBits', 'moduleBits', 'dueDays', 'reviewStages', 'reviewDay', 'reviewBits', 'reviewCount']) assert.deepEqual(state[field], old[field]);
  for (const id of Object.values(legacyLookGrants).flat()) assert.ok(publicRewardState(state).owned.includes(id));
  assert.equal(state.equipped.sparky.head, 'accessory-urban-cap-v4');
  assert.equal(state.equipped.pinky.head, 'accessory-focus-headphones-v4');
  assert.ok(!JSON.stringify(publicRewardState(state).equipped).includes('scene-'));
  assert.ok(!publicRewardState(state).owned.some(id => id.startsWith('scene-')));
  assert.deepEqual(normalizeRewardState(state), state);
  const spent = buyCosmetic(state, 'accessory-round-readers-v4').state;
  assert.equal(normalizeRewardState(spent).coins, 718);
  assert.deepEqual(normalizeRewardState(resetLook(spent, 'sparky')).equipped.sparky, {});
  assert.equal(resetLook(spent, 'sparky').equipped.pinky.head, 'accessory-focus-headphones-v4');
});

test('one accessory purchase is shared while equipment stays independent', () => {
  const purchased = buyCosmetic({ ...emptyRewardState(), coins: 100 }, 'accessory-round-readers-v4').state;
  const first = equipCosmetic(purchased, 'sparky', 'face', 'accessory-round-readers-v4');
  const both = equipCosmetic(first, 'pinky', 'face', 'accessory-round-readers-v4');
  assert.equal(both.coins, 45);
  assert.equal(buyCosmetic(both, 'accessory-round-readers-v4').spent, 0);
  const removed = equipCosmetic(both, 'pinky', 'face', null);
  assert.equal(removed.equipped.pinky.face, undefined);
  assert.equal(removed.equipped.sparky.face, 'accessory-round-readers-v4');
});

test('missing art, wrong pose and incompatible outfits fail closed', () => {
  const item = accessoryCatalog[0];
  assert.equal(isCompatibleCosmetic({ ...item, assets: { ...item.assets, pinky: {} } }, 'pinky'), false);
  assert.equal(isCompatibleCosmetic({ ...item, poseVersion: 'other' }, 'sparky'), false);
  assert.equal(isCompatibleCosmetic(item, 'sparky', 'pinky-campus'), false);
  assert.equal(isCompatibleCosmetic(item, 'sparky', 'unknown'), false);
  assert.equal(isCompatibleCosmetic({ ...item, incompatibleOutfits: ['sparky-cozy-reader'] }, 'sparky', 'sparky-cozy-reader'), false);
});
