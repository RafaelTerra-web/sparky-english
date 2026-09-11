import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

const root = new URL("../public/motion/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));

test("the motion pack is complete, immutable and has transparent mobile fallbacks", async () => {
  assert.deepEqual(
    manifest.assets.map((asset) => asset.file).sort(),
    ["sparky-loader.webm", "sparky-loader.webp", "sparky-transition.webm", "sparky-transition.webp", "streak-flame-192.png", "streak-flame-96.png", "streak-flame.png"],
  );
  for (const asset of manifest.assets) {
    const bytes = await readFile(new URL(asset.file, root));
    assert.equal(bytes.length, asset.bytes, asset.file);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, asset.file);
  }
  for (const asset of manifest.assets.filter((item) => item.file.endsWith(".webp"))) {
    const metadata = await sharp(await readFile(new URL(asset.file, root)), { animated: true }).metadata();
    assert.equal(metadata.hasAlpha, true, asset.file);
    assert.ok((metadata.pages ?? 0) > 1, `${asset.file} must remain animated`);
  }
  for (const asset of manifest.assets.filter((item) => item.file.endsWith(".png"))) {
    const metadata = await sharp(await readFile(new URL(asset.file, root))).metadata();
    assert.equal(metadata.hasAlpha, true, asset.file);
  }
});
