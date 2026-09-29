import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { storeLedger } from "../src/lib/store-ledger.ts";
import { emptyRewardState, normalizeRewardState, rewardStateNeedsMigration } from "../src/lib/rewards.ts";

function legacyPurchase(itemId, price, state) {
  const bits = Buffer.from(state.ownedBits, "base64url");
  const index = storeLedger.indexOf(itemId);
  assert.ok(index >= 0);
  bits[Math.floor(index / 8)] |= 1 << (index % 8);
  state.ownedBits = bits.toString("base64url");
  state.expeditionReceipts.push({ itemId, price, offerVersion: "economy-pilot-v1",
    purchasedAt: "2026-09-28T12:00:00.000Z", receiptId: randomUUID() });
  return state;
}

test("retired expedition purchases return their paid prices once without moving ledger identities", () => {
  assert.deepEqual(storeLedger.slice(-3), ["expedition-suitcase", "expedition-london", "case-signal"]);
  const old = emptyRewardState();
  old.version = 6;
  old.coins = 70;
  old.expeditionGoalId = "case-signal";
  legacyPurchase("case-signal", 30, old);
  legacyPurchase("expedition-suitcase", 180, old);
  const next = normalizeRewardState(old);
  assert.equal(next.version, 7);
  assert.equal(next.coins, 280);
  assert.equal(next.expeditionRefund, 210);
  assert.equal(next.expeditionGoalId, null);
  assert.deepEqual(next.expeditionReceipts, old.expeditionReceipts);
  assert.equal(rewardStateNeedsMigration(old, next), true);
  assert.deepEqual(normalizeRewardState(next), next);
  assert.equal(rewardStateNeedsMigration(next, normalizeRewardState(next)), false);
});

test("legacy progression survives retirement, while invalid or unowned receipts never mint currency", () => {
  const old = emptyRewardState();
  old.version = 6;
  old.coins = 40;
  old.completedBits = Buffer.from([1, 0]).toString("base64url");
  old.expeditionSessions = [{ sessionId: randomUUID(), episodeId: "case-signal-ep1-v1",
    family: "A1-A2", decisionId: null, applicationCorrect: true, transferCorrect: true,
    independent: true, completedAt: "2026-09-28T12:00:00.000Z", reviewDueAt: null,
    reviewConfirmedAt: null, reviewAttempted: false, reviewStage: 0, satisfaction: null }];
  legacyPurchase("case-signal", 30, old);
  old.expeditionReceipts.push({ ...old.expeditionReceipts[0], itemId: "expedition-london", receiptId: randomUUID() });
  old.expeditionReceipts.push({ ...old.expeditionReceipts[0], itemId: "case-signal", price: 99999, receiptId: randomUUID() });
  const next = normalizeRewardState(old);
  assert.equal(next.coins, 70);
  assert.equal(next.expeditionRefund, 30);
  assert.equal(Buffer.from(next.completedBits, "base64url")[0], 1);
  assert.equal(next.expeditionSessions.length, 1);
  assert.equal(next.expeditionReceipts.length, 1);
});

test("unbought expeditions do not receive refunds", () => {
  const old = emptyRewardState();
  old.version = 6;
  old.coins = 85;
  const next = normalizeRewardState(old);
  assert.equal(next.coins, 85);
  assert.equal(next.expeditionRefund, 0);
  assert.deepEqual(next.expeditionReceipts, []);
});
