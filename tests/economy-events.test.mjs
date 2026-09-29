import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { economyEventPath, prepareEconomyEvent } from "../src/lib/economy-event-schema.ts";
import { economyPilotReport } from "../src/lib/economy-report.ts";

const account = "a".repeat(64);
const date = (minute = 0) => new Date(Date.UTC(2026, 8, 1, 12, minute));

test("pilot events store only allowlisted counters and hashed session references", () => {
  const eventId = randomUUID();
  const sessionId = randomUUID();
  const original = {
    eventId, kind: "recall", episodeId: "case-signal-ep1-v1", family: "A1-A2",
    sessionId, correct: true, confirmed: false, answer: "do not record", name: "do not record",
  };
  const event = prepareEconomyEvent(account, "production", original, date());
  const json = JSON.stringify(event);
  assert.equal(event.kind, "recall");
  assert.equal(event.offerId, "case-signal");
  assert.match(event.sessionKey, /^[a-f0-9]{64}$/);
  assert.equal(json.includes(sessionId), false);
  assert.equal(json.includes("do not record"), false);
  assert.equal(economyEventPath(event), `economy-v1/production/2026-09/${account}/${event.eventKey}.json`);
  assert.equal(prepareEconomyEvent(account, "production", original, date(3)).eventKey, event.eventKey);
});

test("pilot events reject malformed content, amounts and identifiers", () => {
  const id = randomUUID();
  assert.throws(() => prepareEconomyEvent(account, "production", { eventId: id, kind: "preview", offerId: "free text" }, date()));
  assert.throws(() => prepareEconomyEvent(account, "production", { eventId: id, kind: "purchase", offerId: "case-signal", offerVersion: "economy-pilot-v1", pricePaid: -1, coinsAfter: 2 }, date()));
  assert.throws(() => prepareEconomyEvent(account, "production", { eventId: id, kind: "episode_start", episodeId: "case-signal-ep1-v1", family: "unknown", sessionId: randomUUID() }, date()));
  assert.throws(() => prepareEconomyEvent(account, "production", { eventId: "not-a-uuid", kind: "preview", offerId: "case-signal" }, date()));
});

test("report aggregates the journey, deduplicates events and suppresses small cells", () => {
  const events = [];
  for (let index = 1; index <= 5; index++) {
    const actor = String(index).repeat(64);
    const sessionId = randomUUID();
    const add = (minute, fields) => events.push(prepareEconomyEvent(actor, "production", { eventId: randomUUID(), ...fields }, date(minute)));
    add(0, { kind: "preview", offerId: "case-signal" });
    add(1, { kind: "goal", offerId: "case-signal", coins: 10 });
    add(2, { kind: "purchase", offerId: "case-signal", offerVersion: "economy-pilot-v1", pricePaid: 30, coinsAfter: 0 });
    add(3, { kind: "episode_start", episodeId: "case-signal-ep1-v1", family: "A1-A2", sessionId });
    add(4, { kind: "episode_finish", episodeId: "case-signal-ep1-v1", family: "A1-A2", sessionId, independent: true });
    add(5, { kind: "recall", episodeId: "case-signal-ep1-v1", family: "A1-A2", sessionId, correct: true, confirmed: true });
    add(6, { kind: "satisfaction", episodeId: "case-signal-ep1-v1", family: "A1-A2", sessionId, value: index === 5 ? "no" : "yes" });
  }
  events.push(events[0]);
  events.push(prepareEconomyEvent(account, "production", { eventId: randomUUID(), kind: "preview", offerId: "expedition-london" }, date(7)));
  const report = economyPilotReport(events, date(), new Date(Date.UTC(2026, 8, 2)));
  assert.equal(report.validEvents, 36);
  assert.equal(report.ignoredEvents, 1);
  assert.equal(report.overall.participants, 6);
  assert.equal(report.byOffer["case-signal"].participants, 5);
  assert.equal(report.byOffer["case-signal"].purchases, 5);
  assert.equal(report.byOffer["case-signal"].coinsSpent, 150);
  assert.equal(report.byOffer["case-signal"].observedStartToFinishRate, 1);
  assert.equal(report.byOffer["case-signal"].recallCorrectRate, 1);
  assert.equal(report.byOffer["case-signal"].satisfactionPositiveRate, 0.8);
  assert.equal(report.byOffer["expedition-london"].suppressed, true);
  assert.equal(JSON.stringify(report).includes(events[0].account), false);
});

test("event pruning refuses a cutoff inside the 90-day retention window", () => {
  const before = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
  const script = fileURLToPath(new URL("../scripts/prune-economy-events.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script, `--before=${before}`, "--environment=local", "--execute"], {
    env: { ...process.env, BLOB_READ_WRITE_TOKEN: "test-token" }, encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /keep at least 90 days/);
});
