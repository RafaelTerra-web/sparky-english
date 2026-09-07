import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { practiceCatalog, cosmeticCatalog } from "../src/lib/rewards-shared.ts";
import { storeMissions } from "../src/lib/content/store-missions.ts";

test("every permanent practice pack has two usable original missions with explanation and production", () => {
  const ids = new Set();
  for (const pack of practiceCatalog) {
    assert.equal(storeMissions[pack.id].length, 2);
    for (const mission of storeMissions[pack.id]) {
      assert.ok(!ids.has(mission.id)); ids.add(mission.id);
      assert.equal(mission.decisions.length, 2);
      for (const decision of mission.decisions) {
        assert.equal(new Set(decision.options).size, 3);
        assert.ok(Number.isInteger(decision.answer) && decision.answer >= 0 && decision.answer < 3);
        assert.ok(decision.explanation.length > 70);
      }
      assert.ok(mission.scene.trim() && mission.model.trim() && mission.writing.trim(), mission.id);
      assert.equal(mission.checklist.length, 3);
    }
  }
});

test("all fitted outfits are real alpha sprites; scenes and looks occupy separate slots", async () => {
  for (const item of cosmeticCatalog) {
    if (item.category === "looks") {
      assert.equal(item.slot, "style");
      const picture = sharp(`public${item.assetPath}`);
      assert.ok((await picture.metadata()).hasAlpha, item.id);
      assert.equal((await picture.stats()).channels.at(-1).min, 0, item.id);
    } else assert.equal(item.slot, "scene");
  }
});
