import { lessonIllustrationId } from "../src/lib/lesson-illustrations.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { lessons } from "../src/lib/curriculum.ts";

const manifestUrl = new URL("../public/lesson-images/manifest.json", import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

test("every lesson resolves to an existing optimized PNG illustration", async () => {
  assert.equal(manifest.lessons.length, lessons.length);
  assert.equal(new Set(manifest.lessons.map((item) => item.lessonId)).size, lessons.length);
  assert.deepEqual(new Set(manifest.lessons.map((item) => item.lessonId)), new Set(lessons.map((lesson) => lesson.id)));
  assert.equal(manifest.assets.length, new Set(lessons.map(lessonIllustrationId)).size);

  for (const lesson of lessons) assert.equal(manifest.lessons.find(item => item.lessonId === lesson.id).assetId, lessonIllustrationId(lesson));
  const assets = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  for (const item of manifest.lessons) assert.ok(assets.has(item.assetId), `missing illustration for ${item.lessonId}`);

  for (const asset of manifest.assets) {
    const bytes = await readFile(new URL(`../public${asset.path}`, import.meta.url));
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(bytes.readUInt32BE(16), 960);
    assert.equal(bytes.readUInt32BE(20), 640);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
  }
});
