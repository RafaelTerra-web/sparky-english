import test from "node:test";
import assert from "node:assert/strict";
import { expeditionEpisodes } from "../src/lib/expeditions-content.ts";
import { publicExpeditionEpisode, publicExpeditionQuestion } from "../src/lib/expeditions-public.ts";

test("unowned assessment keys and unrevealed outcomes never enter the episode payload", () => {
  for (const episode of expeditionEpisodes) {
    const visible = publicExpeditionEpisode(episode);
    assert.equal("recall" in visible, false);
    assert.equal("reveal" in visible, false);
    assert.equal("consequence" in visible, false);
    assert.equal("answerId" in visible.application, false);
    assert.equal("answerTokenIds" in visible.transfer, false);
    assert.ok(visible.decision.options.every(option => !("consequence" in option)));
    assert.ok(visible.transfer.tokens.every(token => /^[a-f0-9]{24}$/.test(token.id)));
    assert.equal("answerId" in publicExpeditionQuestion(episode.recall), false);
  }
});
