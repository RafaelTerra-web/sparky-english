import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { emptyRewardState, normalizeRewardState } from '../src/lib/rewards.ts';

let row, conflicts, writes, unavailable;
globalThis.__rewardDatabaseFixture = {
  from() {
    let update, expected;
    return {
      select() { return this; },
      eq(key, value) { if (key === 'revision') expected = value; return this; },
      update(value) { update = structuredClone(value); return this; },
      async insert(value) { if (row) return { error: { code: '23505' } }; row = { ...value, revision: 0 }; return { error: null }; },
      async maybeSingle() {
        if (unavailable) return { error: { message: 'unavailable' } };
        if (update) {
          writes++;
          if (conflicts-- > 0) { row = { ...row, state: { ...row.state, coins: row.state.coins + 10 }, revision: row.revision + 1 }; return { data: null }; }
          if (expected !== row.revision) return { data: null };
          row = { ...row, ...update };
          return { data: { revision: row.revision } };
        }
        return { data: structuredClone(row) };
      },
    };
  },
};
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL?.endsWith('/reward-store.ts')) {
    if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
    if (specifier === '@supabase/supabase-js') return { url: 'data:text/javascript,export const createClient=()=>globalThis.__rewardDatabaseFixture', shortCircuit: true };
    if (specifier === './rewards') return nextResolve('./rewards.ts', context);
  }
  return nextResolve(specifier, context);
} });
const { loadRewards, persistRewards } = await import('../src/lib/reward-store.ts');
process.env.SPARKY_DURABLE_PROGRESS = 'true';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-only';
function reset() {
  const bits = Buffer.alloc(3); bits[0] = 1 << 4; // historical garden scene
  row = { state: { ...emptyRewardState(), version: 3, wardrobeVersion: 2, coins: 100, ownedBits: bits.toString('base64url') }, revision: 4 };
  conflicts = 0; writes = 0; unavailable = false;
}
test('loading persists migration once and never repeats the scene credit', async () => {
  reset();
  const first = await loadRewards('fixture', emptyRewardState());
  assert.equal(first.revision, 5); assert.equal(first.state.coins, 130);
  assert.deepEqual(row.state, first.state);
  const again = await loadRewards('fixture', emptyRewardState());
  assert.deepEqual(again, first); assert.equal(writes, 1);
});
test('migration reloads after a conflict and preserves concurrent credits', async () => {
  reset(); conflicts = 1;
  const result = await loadRewards('fixture', emptyRewardState());
  assert.equal(result.state.coins, 140);
  assert.equal(result.state.sceneRefund, 30);
  assert.equal(result.revision, 6); assert.equal(writes, 2);
  assert.deepEqual(row.state, normalizeRewardState(row.state));
});
test('repeated conflict and database failure never pretend to save', async () => {
  reset(); conflicts = 2;
  await assert.rejects(loadRewards('fixture', emptyRewardState()), /progress-conflict/);
  assert.equal(row.state.version, 3); assert.equal(row.state.coins, 120);
  reset(); unavailable = true;
  await assert.rejects(loadRewards('fixture', emptyRewardState()), /progress-unavailable/);
});
test('stale writes cannot overwrite a newer purchase or progress', async () => {
  reset();
  const loaded = await loadRewards('fixture', emptyRewardState());
  await persistRewards('fixture', { ...loaded.state, coins: 80 }, loaded.revision);
  await assert.rejects(persistRewards('fixture', { ...loaded.state, coins: 90 }, loaded.revision), /progress-conflict/);
  assert.equal(row.state.coins, 80);
});
