import assert from "node:assert/strict";
import test from "node:test";
import { lessons, modules } from "../src/lib/curriculum.ts";
import {
  buyCosmetic,
  completeStudy,
  emptyRewardState,
  equipCosmetic,
  normalizeRewardState,
  publicRewardState,
  selectMascot,
} from "../src/lib/rewards.ts";

test("first completion rewards once and schedules a server-side review", () => {
  const first = completeStudy(emptyRewardState(), lessons[0].id, false, new Date("2026-09-05T12:00:00Z"));
  assert.equal(first.earned, 10);
  assert.equal(first.state.coins, 10);
  assert.ok(publicRewardState(first.state).completed[lessons[0].id]);
  assert.equal(publicRewardState(first.state).reviews[lessons[0].id], "2026-09-06T03:00:00.000Z");
  const repeated = completeStudy(first.state, lessons[0].id, false, new Date("2026-09-05T13:00:00Z"));
  assert.equal(repeated.earned, 0);
  assert.equal(repeated.state.coins, 10);
});

test("completing every lesson in a module awards its bonus exactly once", () => {
  let state = emptyRewardState();
  const courseModule = modules[0];
  for (const lesson of courseModule.lessons)
    state = completeStudy(state, lesson.id, false, new Date("2026-09-05T12:00:00Z")).state;
  assert.equal(state.coins, courseModule.lessons.length * 10 + 20);
  const repeated = completeStudy(state, courseModule.lessons.at(-1).id, false).state;
  assert.equal(repeated.coins, state.coins);
});

test("due reviews reward at most once per lesson and ten times per day", () => {
  let state = emptyRewardState();
  for (const lesson of lessons.slice(0, 11))
    state = completeStudy(state, lesson.id, false, new Date("2026-09-01T12:00:00Z")).state;
  const balance = state.coins;
  for (const lesson of lessons.slice(0, 11))
    state = completeStudy(state, lesson.id, true, new Date("2026-09-05T12:00:00Z")).state;
  assert.equal(state.coins, balance + 20);
  const duplicate = completeStudy(state, lessons[0].id, true, new Date("2026-09-05T14:00:00Z"));
  assert.equal(duplicate.earned, 0);
});

test("purchase and equipment validate balance, ownership, slot and mascot", () => {
  let state = emptyRewardState();
  assert.throws(() => buyCosmetic(state, "campus-cap"), /insufficient-coins/);
  for (const lesson of lessons.slice(0, 8)) state = completeStudy(state, lesson.id, false).state;
  const purchase = buyCosmetic(state, "campus-cap");
  assert.equal(purchase.spent, 80);
  state = purchase.state;
  state = equipCosmetic(state, "sparky", "head", "campus-cap");
  assert.equal(state.equipped.sparky.head, "campus-cap");
  assert.throws(() => equipCosmetic(state, "sparky", "body", "campus-cap"), /compatible/);
  assert.equal(buyCosmetic(state, "campus-cap").spent, 0);
  assert.equal(selectMascot(state, "pinky").mascot, "pinky");
});

test("malformed stored values cannot mint currency or equip unowned items", () => {
  const state = normalizeRewardState({
    version: 1,
    coins: 999999999,
    owned: ["not-real"],
    mascot: "unknown",
    equipped: { sparky: { head: "campus-cap" } },
  });
  assert.equal(state.coins, 0);
  assert.deepEqual(state.owned, []);
  assert.deepEqual(state.equipped.sparky, {});
  assert.equal(state.mascot, "sparky");
});
