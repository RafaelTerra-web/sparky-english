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
test('migration preserves purchases and equipment, then ignores legacy arrays in v3', () => {
  const legacy = { ...emptyRewardState(), version: 1, coins: 47, owned: ['scene-garden','pinky-focus-look','scene-garden'], equipped: { sparky: { scene: 'scene-garden' }, pinky: { style: 'pinky-focus-look' } } };
  const migrated = normalizeRewardState(legacy);
  assert.equal(migrated.version, 3); assert.equal(migrated.coins, 47);
  assert.deepEqual(publicRewardState(migrated).owned, ['pinky-focus-look','scene-garden']);
  assert.deepEqual(migrated.equipped, legacy.equipped);
  assert.equal('owned' in migrated, false);
  assert.deepEqual(normalizeRewardState(migrated), migrated);
  assert.deepEqual(normalizeRewardState({ ...migrated, owned: ['scene-aurora'] }), migrated);
  const shortOldBits = normalizeRewardState({ ...migrated, ownedBits: Buffer.from([16]).toString('base64url') });
  assert.deepEqual(publicRewardState(shortOldBits).owned, ['scene-garden']);
});
test('retired notebook themes cannot be bought and old purchase bits survive', () => {
  const raw = { ...emptyRewardState(), coins: 99, ownedBits: Buffer.from([0,128,0]).toString('base64url') };
  const next = normalizeRewardState(raw);
  assert.equal(next.coins,99);
  assert.equal(next.ownedBits,raw.ownedBits);
  assert.equal('notebookTheme' in publicRewardState(next),false);
  assert.throws(()=>buyCosmetic(next,'notebook-mint'), /item-not-found/);
});
