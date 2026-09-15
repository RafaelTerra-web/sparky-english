import test from 'node:test';
import assert from 'node:assert/strict';
import { storeLedger } from '../src/lib/store-ledger.ts';
import { storeCatalog } from '../src/lib/rewards-shared.ts';
import { emptyRewardState, normalizeRewardState, publicRewardState, buyCosmetic } from '../src/lib/rewards.ts';

test('store bit identities are permanent, unique and cover every purchasable item', () => {
  assert.deepEqual(storeLedger.slice(0, 19), [
    'pinky-focus-look','sparky-explorer-look','sparky-academy-look','pinky-atelier-look',
    'scene-garden','scene-sunset','scene-night','practice-travel','practice-team','practice-nuance',
    'scene-study','scene-cafe','scene-train','scene-library','scene-aurora',
    'notebook-mint','notebook-midnight','notebook-classic','notebook-berry',
  ]);
  assert.equal(new Set(storeLedger).size, storeLedger.length);
  for (const item of storeCatalog) assert.ok(storeLedger.includes(item.id), item.id);
});
test('migration retires scenes, refunds once and grants modular legacy pieces', () => {
  const legacy = { ...emptyRewardState(), version: 1, coins: 47, owned: ['scene-garden','pinky-focus-look','scene-garden'], equipped: { sparky: { scene: 'scene-garden' }, pinky: { style: 'pinky-focus-look' } } };
  const migrated = normalizeRewardState(legacy);
  assert.equal(migrated.version, 5); assert.equal(migrated.coins, 77);
  assert.equal(migrated.sceneRefund, 30);
  assert.deepEqual(publicRewardState(migrated).owned, ['pinky-focus-look','accessory-focus-headphones-v4']);
  assert.deepEqual(migrated.equipped, { sparky: {}, pinky: { outfit: 'pinky-focus-look', head: 'accessory-focus-headphones-v4' } });
  assert.equal('owned' in migrated, false);
  assert.deepEqual(normalizeRewardState(migrated), migrated);
  assert.deepEqual(normalizeRewardState({ ...migrated, owned: ['scene-aurora'] }), migrated);
  const repeated = normalizeRewardState(migrated);
  assert.equal(repeated.coins, 77); assert.equal(repeated.sceneRefund, 30);
});
test('retired notebook themes cannot be bought and old purchase bits survive', () => {
  const raw = { ...emptyRewardState(), coins: 99, ownedBits: Buffer.from([0,128,0]).toString('base64url') };
  const next = normalizeRewardState(raw);
  assert.equal(next.coins,99);
  const expanded = Buffer.from(next.ownedBits, 'base64url');
  const original = Buffer.from(raw.ownedBits, 'base64url');
  assert.deepEqual(expanded.subarray(0, original.length), original);
  assert.ok(expanded.subarray(original.length).every(byte => byte === 0));
  assert.deepEqual(normalizeRewardState(next), next);
  assert.equal('notebookTheme' in publicRewardState(next),false);
  assert.throws(()=>buyCosmetic(next,'notebook-mint'), /item-not-found/);
});
