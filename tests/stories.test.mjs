import test from "node:test";
import assert from "node:assert/strict";
import { missingPostcardScenes, storyProgressKey } from "../src/lib/story-content.ts";

test("the postcard story has four distinct, answerable scenes", () => {
  assert.equal(missingPostcardScenes.length, 4);
  for (const [index, scene] of missingPostcardScenes.entries()) {
    assert.equal(scene.options.length, 4, `scene ${index + 1}`);
    assert.equal(new Set(scene.options).size, 4, `scene ${index + 1}`);
    assert.ok(scene.answer >= 0 && scene.answer < 4, `scene ${index + 1}`);
    assert.ok(scene.text && scene.translation && scene.question && scene.imageAlt);
  }
  assert.deepEqual(missingPostcardScenes.map(scene => scene.answer), [0, 1, 2, 3]);
});

test("story progress is separate for each learner", () => {
  assert.notEqual(storyProgressKey("learner-a"), storyProgressKey("learner-b"));
});
