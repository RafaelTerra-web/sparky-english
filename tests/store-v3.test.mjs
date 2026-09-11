import test from 'node:test';
import assert from 'node:assert/strict';
import { storeLedger } from '../src/lib/store-ledger.ts';
import { storeCatalog, notebookThemeCatalog } from '../src/lib/rewards-shared.ts';
import { emptyRewardState, normalizeRewardState, publicRewardState, buyCosmetic, equipNotebookTheme } from '../src/lib/rewards.ts';

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
test('themes require ownership, never debit twice and can return to the free original', () => {
  let state = { ...emptyRewardState(), coins: 500 };
  assert.throws(() => equipNotebookTheme(state, 'notebook-midnight'), /not-owned/);
  assert.throws(() => equipNotebookTheme(state, 'scene-garden'), /not-owned/);
  for (const theme of notebookThemeCatalog) {
    const balance = state.coins;
    state = buyCosmetic(state, theme.id).state;
    assert.equal(state.coins, balance - theme.price);
    assert.equal(buyCosmetic(state, theme.id).spent, 0);
    state = equipNotebookTheme(state, theme.id);
    assert.equal(publicRewardState(normalizeRewardState(state)).notebookTheme, theme.id);
  }
  const balance = state.coins;
  state = equipNotebookTheme(state, null);
  assert.equal(state.notebookTheme, null); assert.equal(state.coins, balance);
});
