import assert from "node:assert/strict";
import test from "node:test";
import { lessons, modules } from "../src/lib/curriculum.ts";
import {
  buyCosmetic,
  checkIn,
  completeStudy,
  emptyRewardState,
  equipCosmetic,
  normalizeRewardState,
  publicRewardState,
  selectMascot,
} from "../src/lib/rewards.ts";

test("daily check-in advances once per Sao Paulo day and rewards weekly milestones", () => {
  let state = emptyRewardState();
  for (let day = 5; day <= 11; day++) {
    const result = checkIn(state, new Date(`2026-09-${String(day).padStart(2, "0")}T12:00:00Z`));
    state = result.state;
    assert.equal(result.advanced, true);
    assert.equal(result.earned, day === 11 ? 5 : 0);
  }
  assert.deepEqual(publicRewardState(state).streak, { count: 7, longest: 7, lastDay: "2026-09-11" });
  const duplicate = checkIn(state, new Date("2026-09-11T22:00:00Z"));
  assert.equal(duplicate.advanced, false);
  assert.equal(duplicate.state.coins, 5);
  const reset = checkIn(state, new Date("2026-09-14T12:00:00Z"));
  assert.equal(reset.state.streakCount, 1);
  assert.equal(reset.state.longestStreak, 7);
});

test("v4 progress migrates to streak storage without changing learning or currency", () => {
  const legacy = completeStudy(emptyRewardState(), lessons[0].id, false, new Date("2026-09-10T12:00:00Z")).state;
  legacy.version = 4;
  delete legacy.streakDay;
  delete legacy.streakCount;
  delete legacy.longestStreak;
  const migrated = normalizeRewardState(legacy);
  assert.equal(migrated.version, 5);
  assert.equal(migrated.coins, 10);
  assert.ok(publicRewardState(migrated).completed[lessons[0].id]);
  assert.deepEqual(publicRewardState(migrated).streak, { count: 0, longest: 0, lastDay: null });
});

test("first completion rewards once and schedules a server-side review", () => {
  const first = completeStudy(emptyRewardState(), lessons[0].id, false, new Date("2026-09-05T12:00:00Z"));
  assert.equal(first.earned, 10);
  assert.equal(first.state.coins, 10);
  assert.ok(publicRewardState(first.state).completed[lessons[0].id]);
  assert.equal(publicRewardState(first.state).reviews[lessons[0].id], "2026-09-08T03:00:00.000Z");
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

test("due reviews reward at most once per lesson and three times per day", () => {
  let state = emptyRewardState();
  for (const lesson of lessons.slice(0, 11))
    state = completeStudy(state, lesson.id, false, new Date("2026-09-01T12:00:00Z")).state;
  const balance = state.coins;
  for (const lesson of lessons.slice(0, 11))
    state = completeStudy(state, lesson.id, true, new Date("2026-09-05T12:00:00Z")).state;
  assert.equal(state.coins, balance + 6);
  const duplicate = completeStudy(state, lessons[0].id, true, new Date("2026-09-05T14:00:00Z"));
  assert.equal(duplicate.earned, 0);
});

test("purchase and equipment validate balance, ownership, slot and mascot", () => {
  let state = emptyRewardState();
  assert.throws(() => buyCosmetic(state, "sparky-explorer-look"), /insufficient-coins/);
  for (const lesson of lessons.slice(0, 8)) state = completeStudy(state, lesson.id, false).state;
  const purchase = buyCosmetic(state, "sparky-explorer-look");
  assert.equal(purchase.spent, 60);
  state = purchase.state;
  state = equipCosmetic(state, "sparky", "outfit", "sparky-explorer-look");
  assert.equal(state.equipped.sparky.outfit, "sparky-explorer-look");
  assert.throws(() => equipCosmetic(state, "sparky", "body", "sparky-explorer-look"), /compatible/);
  assert.equal(buyCosmetic(state, "sparky-explorer-look").spent, 0);
  assert.equal(selectMascot(state, "pinky").mascot, "pinky");
});

test("an outfit and independent accessory coexist and survive normalization", () => {
  let state = emptyRewardState();
  state.coins = 500;
  state = buyCosmetic(state, "sparky-academy-look").state;
  state = buyCosmetic(state, "accessory-amber-readers-v4").state;
  state = equipCosmetic(state, "sparky", "outfit", "sparky-academy-look");
  state = equipCosmetic(state, "sparky", "face", "accessory-amber-readers-v4");

  assert.equal(state.equipped.sparky.outfit, "sparky-academy-look");
  assert.equal(state.equipped.sparky.face, "accessory-amber-readers-v4");
  assert.deepEqual(
    normalizeRewardState(state).equipped.sparky,
    { outfit: "sparky-academy-look", face: "accessory-amber-readers-v4" },
  );
  assert.throws(
    () => equipCosmetic(state, "pinky", "outfit", "sparky-academy-look"),
    /compatible/,
  );
});

test("retired accessories are refunded once while original complete looks and progress survive", () => {
  const old = completeStudy(emptyRewardState(), lessons[0].id, false).state;
  old.version = 1;
  delete old.wardrobeVersion;
  delete old.wardrobeRefund;
  old.coins = 25;
  old.owned = ["campus-cap", "campus-cap", "quiet-hoodie", "pinky-atelier-look", "not-real"];
  old.equipped = { sparky: { head: "campus-cap" }, pinky: { body: "quiet-hoodie", style: "pinky-atelier-look" } };
  const migrated = normalizeRewardState(old);
  assert.equal(migrated.coins, 255);
  assert.equal(migrated.wardrobeRefund, 230);
  assert.deepEqual(publicRewardState(migrated).owned, ["pinky-atelier-look", "accessory-lavender-beret-v4", "accessory-book-tote-v4"]);
  assert.deepEqual(migrated.equipped, { sparky: {}, pinky: { outfit: "pinky-atelier-look", head: "accessory-lavender-beret-v4", back: "accessory-book-tote-v4" } });
  assert.equal(migrated.completedBits, old.completedBits);
  assert.deepEqual(normalizeRewardState(migrated), migrated);
  const purchased = buyCosmetic(migrated, "practice-travel").state;
  assert.equal(normalizeRewardState(purchased).coins, 215);
  assert.ok(publicRewardState(purchased).owned.includes("practice-travel"));
  assert.equal(buyCosmetic(purchased, "practice-travel").spent, 0);
  assert.throws(() => equipCosmetic(purchased, "pinky", "outfit", "practice-travel"), /compatible/);
  assert.throws(() => buyCosmetic(purchased, "campus-cap"), /item-not-found/);
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
  assert.deepEqual(publicRewardState(state).owned, []);
  assert.deepEqual(state.equipped.sparky, {});
  assert.equal(state.mascot, "sparky");
});
