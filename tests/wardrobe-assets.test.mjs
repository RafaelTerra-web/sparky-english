import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { accessoryCatalog, outfitCatalog } from "../src/lib/rewards-shared.ts";

test("the modular wardrobe has twelve outfits and sixteen two-mascot accessories", () => {
  assert.equal(outfitCatalog.length, 12);
  assert.equal(accessoryCatalog.length, 16);
  for (const item of accessoryCatalog) {
    assert.deepEqual(item.mascots, ["sparky", "pinky"]);
    for (const variant of Object.values(item.assets)) assert.ok(variant.front || variant.back);
  }
});

test("newly fitted Sparky layers have fresh image optimizer URLs", () => {
  for (const name of ["urban-cap", "explorer-satchel", "book-tote", "compact-backpack", "rocket-pack"]) {
    const item = accessoryCatalog.find(entry => entry.assets.sparky.front?.includes(`/${name}-sparky.png`));
    assert.ok(item, name);
    assert.ok(item.assets.sparky.front.endsWith("?v=20260929"), name);
    if (item.assets.sparky.back) assert.ok(item.assets.sparky.back.endsWith("?v=20260929"), name);
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
