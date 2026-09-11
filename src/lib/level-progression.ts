import { lessons } from "./curriculum.ts";
import { levels, type Level } from "./levels.ts";

export const LEVEL_CELEBRATION_STORAGE_VERSION = 1;

export function levelCelebrationStorageKey(userId: string) {
  return `sparky-level-celebration-v${LEVEL_CELEBRATION_STORAGE_VERSION}:${userId}`;
}

/**
 * Returns the level reached through the published course sequence. The selected
 * level is the starting point, so a learner placed at B2 is not required to
 * complete A1–B1 before progressing to C1.
 */
export function reachedCourseLevel(
  selectedLevel: Level,
  completed: Record<string, string>,
): Level {
  let levelIndex = levels.indexOf(selectedLevel);

  while (levelIndex < levels.length - 1) {
    const lessonsAtLevel = lessons.filter(
      (lesson) => lesson.level === levels[levelIndex],
    );
    if (
      lessonsAtLevel.length === 0 ||
      lessonsAtLevel.some((lesson) => !completed[lesson.id])
    )
      break;
    levelIndex += 1;
  }

  return levels[levelIndex];
}

export function promotedLevel(
  acknowledgedLevel: string | null,
  reachedLevel: Level,
): { from: Level; to: Level } | null {
  if (!acknowledgedLevel || !levels.includes(acknowledgedLevel as Level))
    return null;

  const from = acknowledgedLevel as Level;
  return levels.indexOf(reachedLevel) > levels.indexOf(from)
    ? { from, to: reachedLevel }
    : null;
}

/** Rejects profile-level jumps: every crossed level must have been completed. */
export function earnedLevelPromotion(
  acknowledgedLevel: string | null,
  reachedLevel: Level,
  completed: Record<string, string>,
) {
  const promotion = promotedLevel(acknowledgedLevel, reachedLevel);
  if (!promotion) return null;
  const from = levels.indexOf(promotion.from);
  const to = levels.indexOf(promotion.to);
  const crossedLevels = new Set(levels.slice(from, to));
  const crossedLessons = lessons.filter((lesson) => crossedLevels.has(lesson.level));
  return crossedLessons.length > 0 && crossedLessons.every((lesson) => completed[lesson.id])
    ? promotion
    : null;
}
