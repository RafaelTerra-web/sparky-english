import assert from "node:assert/strict";
import test from "node:test";
import { lessons } from "../src/lib/curriculum.ts";
import {
  earnedLevelPromotion,
  levelCelebrationStorageKey,
  promotedLevel,
  reachedCourseLevel,
} from "../src/lib/level-progression.ts";

const completedAt = "2026-09-11T12:00:00.000Z";
const complete = (...levels) => Object.fromEntries(
  lessons.filter((lesson) => levels.includes(lesson.level)).map((lesson) => [lesson.id, completedAt]),
);

test("course level advances only after every lesson in the current level", () => {
  const almostA1 = complete("A1");
  delete almostA1[lessons.find((lesson) => lesson.level === "A1").id];
  assert.equal(reachedCourseLevel("A1", almostA1), "A1");
  assert.equal(reachedCourseLevel("A1", complete("A1")), "A2");
});

test("placement level is the start of the progression", () => {
  assert.equal(reachedCourseLevel("B2", complete("A1", "A2", "B1")), "B2");
  assert.equal(reachedCourseLevel("B2", complete("B2", "C1")), "C2");
});

test("promotion is emitted only for an upward persisted change", () => {
  assert.deepEqual(promotedLevel("A2", "B1"), { from: "A2", to: "B1" });
  assert.equal(promotedLevel("B1", "B1"), null);
  assert.equal(promotedLevel("C1", "B2"), null);
  assert.equal(promotedLevel(null, "C2"), null);
  assert.equal(promotedLevel("invalid", "B2"), null);
});

test("manual level selection is not mistaken for an earned promotion", () => {
  assert.equal(earnedLevelPromotion("A1", "B2", {}), null);
  assert.deepEqual(
    earnedLevelPromotion("A1", "A2", complete("A1")),
    { from: "A1", to: "A2" },
  );
  assert.equal(earnedLevelPromotion("A1", "B1", complete("A1")), null);
  assert.deepEqual(
    earnedLevelPromotion("A1", "B1", complete("A1", "A2")),
    { from: "A1", to: "B1" },
  );
});

test("celebration receipt is scoped by account and version", () => {
  assert.equal(levelCelebrationStorageKey("learner-7"), "sparky-level-celebration-v1:learner-7");
});
