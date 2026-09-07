import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { cosmeticCatalog } from '../src/lib/rewards-shared.ts';
import { emptyRewardState, buyCosmetic, equipCosmetic, normalizeRewardState, publicRewardState } from '../src/lib/rewards.ts';

test('eight scenes have real responsive files matching their generation manifest', async () => {
  const manifest = JSON.parse(await readFile('docs/advanced-scene-generation.json','utf8'));
  const scenes=cosmeticCatalog.filter(item=>item.slot==='scene');
  assert.equal(scenes.length,8);
  for(const scene of scenes) {
    assert.deepEqual(scene.mascots,['sparky','pinky']);
    const entry=manifest.find(item=>item.id===scene.id);
    assert.ok(entry?.prompt && entry.model && entry.generatedAt,scene.id);
    for(const [variant,width] of [['small',480],['large',960]]) {
      const path=scene.sceneAssets[variant];
      const record=entry.variants.find(v=>v.path===path);
      const bytes=await readFile(`public${path}`);
      const meta=await sharp(bytes).metadata();
      assert.equal(meta.format,'webp');
      assert.equal(meta.width,width);
      assert.equal(meta.height,record.height);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
      assert.ok(bytes.length<160000,`${scene.id} ${variant} should stay lightweight`);
    }
  }
});
test('existing scene ownership survives new art, and new scenes equip on both mascots without a second debit', () => {
  const old={...emptyRewardState(),version:1,coins:200,owned:['scene-garden','scene-sunset','scene-night'],equipped:{sparky:{scene:'scene-garden'},pinky:{scene:'scene-night'}}};
  const migrated=normalizeRewardState(old);
  assert.deepEqual(publicRewardState(migrated).owned,old.owned);
  assert.deepEqual(migrated.equipped,old.equipped);
  const purchase=buyCosmetic(migrated,'scene-train');
  assert.equal(purchase.spent,95);
  const duplicate=buyCosmetic(purchase.state,'scene-train');
  assert.equal(duplicate.spent,0);
  let state=duplicate.state;
  for(const mascot of ['sparky','pinky']) state=equipCosmetic(state,mascot,'scene','scene-train');
  assert.equal(state.coins,105);
  assert.equal(state.equipped.sparky.scene,'scene-train');
  assert.equal(state.equipped.pinky.scene,'scene-train');
});
