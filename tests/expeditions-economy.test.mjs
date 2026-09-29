import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { storeLedger } from "../src/lib/store-ledger.ts";
import { buyExpedition, emptyRewardState, normalizeRewardState, ownsExpedition, rewardStateNeedsMigration, setExpeditionGoal } from "../src/lib/rewards.ts";
import {
  answerExpeditionQuestion, chooseExpeditionRoute, expeditionCompetence,
  finishExpeditionSession, reviewExpeditionQuestion, startExpeditionSession,
} from "../src/lib/expeditions-progress.ts";

const offerVersion = "economy-pilot-v1";
const episode = {
  id: "case-signal-ep1-v1", offerId: "case-signal", family: "A1-A2",
  decision: { id: "route", options: [
    { id: "look", consequence: { pt: "Pista A", en: "Clue A" } },
    { id: "listen", consequence: { pt: "Pista B", en: "Clue B" } },
  ] },
  application: { id: "apply", kind: "choice", options: [{ id: "wrong" }, { id: "right" }], answerId: "right",
    feedback: { correct: { pt: "Certo", en: "Correct" }, incorrect: { pt: "Tente de novo", en: "Try again" } } },
  transfer: { id: "transfer", kind: "order", tokens: [{ id: "t2", text: "is" }, { id: "t1", text: "It" }, { id: "t3", text: "is" }],
    answerTokenIds: ["t1", "t2", "t3"], feedback: { correct: { pt: "Certo", en: "Correct" }, incorrect: { pt: "Tente de novo", en: "Try again" } } },
  recall: { id: "recall", kind: "choice", options: [{ id: "later-wrong" }, { id: "later-right" }], answerId: "later-right",
    feedback: { correct: { pt: "Certo", en: "Correct" }, incorrect: { pt: "Tente de novo", en: "Try again" } } },
};

function purchased() {
  const state = emptyRewardState();
  state.coins = 100;
  return buyExpedition(state, "case-signal", offerVersion, randomUUID(), new Date("2026-09-28T12:00:00Z")).state;
}

test("economy ledger only appends new offers and migrates old state without spending coins", () => {
  assert.deepEqual(storeLedger.slice(-3), ["expedition-suitcase", "expedition-london", "case-signal"]);
  const old = emptyRewardState();
  old.version = 5;
  old.coins = 85;
  const next = normalizeRewardState(old);
  assert.equal(next.version, 6);
  assert.equal(next.coins, 85);
  assert.deepEqual(next.expeditionReceipts, []);
  assert.deepEqual(next.expeditionSessions, []);
  assert.deepEqual(normalizeRewardState(next), next);
});

test("account-state migration ignores JSON object key order but detects a real version change", () => {
  const state = purchased();
  const reordered = Object.fromEntries(Object.entries(state).reverse());
  reordered.equipped = { pinky: {}, sparky: {} };
  assert.equal(rewardStateNeedsMigration(reordered, normalizeRewardState(reordered)), false);
  reordered.version = 5;
  assert.equal(rewardStateNeedsMigration(reordered, normalizeRewardState(reordered)), true);
});

test("normalization retains valid purchase and session history past earlier invalid entries", () => {
  const started = startExpeditionSession(purchased(), episode.id, episode.family, randomUUID()).state;
  const validReceipt = started.expeditionReceipts[0];
  const validSession = started.expeditionSessions[0];
  const input = {
    ...started,
    expeditionReceipts: [...Array.from({ length: 16 }, () => ({ itemId: "invalid" })), validReceipt],
    expeditionSessions: [...Array.from({ length: 32 }, () => ({ episodeId: "invalid" })), validSession],
  };
  const normalized = normalizeRewardState(input);
  assert.deepEqual(normalized.expeditionReceipts, [validReceipt]);
  assert.deepEqual(normalized.expeditionSessions, [validSession]);
});

test("permanent purchases save paid price and version once, and goal progress survives normalization", () => {
  let state = emptyRewardState();
  state.coins = 100;
  state = setExpeditionGoal(state, "case-signal");
  assert.equal(normalizeRewardState(state).expeditionGoalId, "case-signal");
  assert.throws(() => buyExpedition(state, "case-signal", "stale", randomUUID()), /offer-changed/);
  const receiptId = randomUUID();
  const first = buyExpedition(state, "case-signal", offerVersion, receiptId, new Date("2026-09-28T12:00:00Z"));
  assert.equal(first.spent, 30);
  assert.equal(first.state.coins, 70);
  assert.equal(first.state.expeditionGoalId, null);
  assert.equal(ownsExpedition(first.state, "case-signal"), true);
  assert.deepEqual(first.receipt, { itemId: "case-signal", price: 30, offerVersion,
    purchasedAt: "2026-09-28T12:00:00.000Z", receiptId });
  const repeat = buyExpedition(first.state, "case-signal", offerVersion, randomUUID());
  assert.equal(repeat.spent, 0);
  assert.equal(repeat.state.coins, 70);
  assert.deepEqual(repeat.receipt, first.receipt);
  assert.deepEqual(normalizeRewardState(repeat.state), repeat.state);
  assert.throws(() => setExpeditionGoal(first.state, "case-signal"), /already-owned-goal/);
});

test("unowned episodes cannot start, and a resumed session keeps its id and validated answers", () => {
  assert.throws(() => startExpeditionSession(emptyRewardState(), episode.id, episode.family, randomUUID()), /expedition-not-owned/);
  const initial = startExpeditionSession(purchased(), episode.id, episode.family, randomUUID());
  assert.equal(initial.created, true);
  const resumed = startExpeditionSession(initial.state, episode.id, episode.family, randomUUID());
  assert.equal(resumed.created, false);
  assert.equal(resumed.session.sessionId, initial.session.sessionId);
});

test("every narrative route is valid; errors require correction and duplicate words can swap IDs", () => {
  let { state, session } = startExpeditionSession(purchased(), episode.id, episode.family, randomUUID());
  assert.throws(() => answerExpeditionQuestion(state, session.sessionId, episode, "apply", "right"), /decision-required/);
  const route = chooseExpeditionRoute(state, session.sessionId, episode, "listen");
  state = route.state;
  assert.equal(route.option.id, "listen");
  assert.equal(route.session.independent, true);
  assert.throws(() => finishExpeditionSession(state, session.sessionId, episode), /episode-incomplete/);
  const wrong = answerExpeditionQuestion(state, session.sessionId, episode, "apply", "wrong");
  state = wrong.state;
  assert.equal(wrong.correct, false);
  assert.equal(wrong.expected, "right");
  assert.equal(wrong.session.independent, false);
  assert.equal(wrong.session.applicationCorrect, false);
  state = answerExpeditionQuestion(state, session.sessionId, episode, "apply", "right").state;
  assert.throws(() => answerExpeditionQuestion(state, session.sessionId, episode, "transfer", ["t1", "t2", "t2"]), /invalid-answer/);
  const reordered = answerExpeditionQuestion(state, session.sessionId, episode, "transfer", ["t1", "t3", "t2"]);
  assert.equal(reordered.correct, true);
  assert.equal(reordered.session.transferCorrect, true);
  const finished = finishExpeditionSession(reordered.state, session.sessionId, episode, new Date("2026-09-28T12:00:00Z"));
  assert.equal(finished.session.reviewDueAt, "2026-10-01T12:00:00.000Z");
  assert.equal(expeditionCompetence(finished.session), "practicing");
  assert.equal(finishExpeditionSession(finished.state, session.sessionId, episode).changed, false);
});

test("independent transfer and later recall confirm a narrow skill without paying extra", () => {
  let { state, session } = startExpeditionSession(purchased(), episode.id, episode.family, randomUUID());
  state = chooseExpeditionRoute(state, session.sessionId, episode, "look").state;
  state = answerExpeditionQuestion(state, session.sessionId, episode, "apply", "right").state;
  state = answerExpeditionQuestion(state, session.sessionId, episode, "transfer", ["t1", "t2", "t3"]).state;
  const finished = finishExpeditionSession(state, session.sessionId, episode, new Date("2026-09-28T12:00:00Z"));
  assert.equal(expeditionCompetence(finished.session), "demonstrated");
  assert.throws(() => reviewExpeditionQuestion(finished.state, episode, "later-right", new Date("2026-09-29T12:00:00Z")), /review-not-due/);
  const recalled = reviewExpeditionQuestion(finished.state, episode, "later-right", new Date("2026-10-01T12:00:00Z"));
  assert.equal(recalled.confirmed, true);
  assert.equal(expeditionCompetence(recalled.session), "confirmed");
  assert.equal(recalled.state.coins, 70);
  const anotherRoute = chooseExpeditionRoute(recalled.state, session.sessionId, episode, "listen");
  assert.equal(anotherRoute.option.id, "listen");
  assert.equal(anotherRoute.changed, false);
  const replayAnswer = answerExpeditionQuestion(anotherRoute.state, session.sessionId, episode, "apply", "wrong");
  assert.equal(replayAnswer.correct, false);
  assert.equal(replayAnswer.changed, false);
  assert.equal(expeditionCompetence(replayAnswer.session), "confirmed");
  assert.equal(replayAnswer.state.coins, 70);
});
