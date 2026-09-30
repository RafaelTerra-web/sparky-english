import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { accessoryCatalog, outfitCatalog, wardrobeBaseAssets, isCompatibleCosmetic } from "../src/lib/rewards-shared.ts";
import { wardrobeAssetRevisions, wardrobeAssetUrl } from "../src/lib/wardrobe-assets.ts";

test("the modular wardrobe has twelve outfits and sixteen two-mascot accessories", () => {
  assert.equal(outfitCatalog.length, 12);
  assert.equal(accessoryCatalog.length, 16);
  for (const item of accessoryCatalog) {
    assert.deepEqual(item.mascots, ["sparky", "pinky"]);
    for (const variant of Object.values(item.assets)) assert.ok(variant.front || variant.back);
  }
});

test("every sprite URL has its current content revision and bypasses stale art", async () => {
  const manifest = JSON.parse(await readFile("docs/wardrobe-assets.json", "utf8"));
  assert.equal(Object.keys(wardrobeAssetRevisions).length, manifest.length);
  for (const record of manifest) {
    const bytes = await readFile(`public${record.path}`);
    const revision = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    assert.equal(wardrobeAssetUrl(record.path), `${record.path}?v=${revision}`);
    assert.equal(wardrobeAssetUrl(`${record.path}?v=20260929`), `${record.path}?v=${revision}`);
  }
});

test("every wardrobe sprite is a verified transparent 640px PNG", async () => {
  const manifest = JSON.parse(await readFile("docs/wardrobe-assets.json", "utf8"));
  assert.equal(manifest.length, 48); // 46 purchased sprite layers and two accessory-free bases
  for (const record of manifest) {
    const bytes = await readFile(`public${record.path}`);
    const metadata = await sharp(bytes).metadata();
    const stats = await sharp(bytes).stats();
    assert.equal(metadata.format, "png", record.path);
    assert.equal(metadata.width, 640, record.path);
    assert.equal(metadata.height, 640, record.path);
    assert.equal(metadata.hasAlpha, true, record.path);
    assert.equal(stats.isOpaque, false, record.path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256, record.path);
    if (record.slot === "back") assert.ok(["front", "back"].includes(record.layer), record.path);
  }
});

test("every accessory remains visible on both bases and all compatible outfits", async () => {
  const pixels = new Map();
  async function alpha(path) {
    if (!pixels.has(path)) pixels.set(path, await sharp(`public${path}`).ensureAlpha().raw().toBuffer());
    return pixels.get(path);
  }
  let combinations = 0;
  for (const mascot of ["sparky", "pinky"]) {
    const bases = [{ id: null, assetPath: wardrobeBaseAssets[mascot] }, ...outfitCatalog.filter(item => item.mascots.includes(mascot))];
    for (const base of bases) {
      const body = await alpha(base.assetPath);
      for (const item of accessoryCatalog) {
        assert.equal(isCompatibleCosmetic(item, mascot, base.id), true);
        let total = 0, visible = 0;
        for (const [layer, path] of Object.entries(item.assets[mascot])) {
          if (!path) continue;
          const accessory = await alpha(path);
          for (let index = 3; index < accessory.length; index += 4) {
            if (accessory[index] > 20) {
              total++;
              if (layer === "front" || body[index] < 200) visible++;
            }
          }
        }
        assert.ok(total > 100, `${mascot}/${item.id} has empty art`);
        assert.ok(visible / total > .1, `${mascot}/${base.id ?? "base"}/${item.id} is hidden behind the body`);
        combinations++;
      }
    }
  }
  assert.equal(combinations, 224);
});

test("all four slots remain visible together across every mascot and outfit", async () => {
  const masks = new Map();
  async function mask(path) {
    if (!masks.has(path)) {
      const rgba = await sharp(`public${path}`).ensureAlpha().raw().toBuffer();
      masks.set(path, Uint8Array.from({ length: 640 * 640 }, (_, index) => rgba[index * 4 + 3]));
    }
    return masks.get(path);
  }
  let combinations = 0;
  for (const mascot of ["sparky", "pinky"]) {
    const bases = [wardrobeBaseAssets[mascot], ...outfitCatalog.filter(item => item.mascots.includes(mascot)).map(item => item.assetPath)];
    for (const base of bases) {
      for (let variant = 0; variant < 4; variant++) {
        const selected = ["back", "neck", "face", "head"].map(slot => accessoryCatalog.filter(item => item.slot === slot)[variant]);
        const layers = [];
        for (const item of selected) if (item.assets[mascot].back) layers.push({ id: item.id, alpha: await mask(item.assets[mascot].back) });
        layers.push({ id: "body", alpha: await mask(base) });
        for (const item of selected) if (item.assets[mascot].front) layers.push({ id: item.id, alpha: await mask(item.assets[mascot].front) });
        const visible = new Map(selected.map(item => [item.id, 0]));
        for (let index = 0; index < 640 * 640; index++) {
          let uncovered = 1;
          for (let layer = layers.length - 1; layer >= 0; layer--) {
            const opacity = layers[layer].alpha[index] / 255;
            if (layers[layer].id !== "body") visible.set(layers[layer].id, visible.get(layers[layer].id) + opacity * uncovered);
            uncovered *= 1 - opacity;
            if (uncovered === 0) break;
          }
        }
        for (const [id, count] of visible) assert.ok(count > 100, `${mascot}/${base}/${id} disappears under another equipped item`);
        combinations++;
      }
    }
  }
  assert.equal(combinations, 56);
});
