import type { Lesson } from "./curriculum.ts";
import type { Checkpoint } from "./learning-local.ts";
import { contentVersion } from "./content/build.ts";
import { studyExercises } from "./study.ts";

export const lessonFlowVersion = 3;
export function lessonSteps(lesson: Lesson, review: boolean, ids?: readonly string[]) {
  return studyExercises(lesson, review, ids);
}
/** Old unfinished sessions restart; completed rewards and writing are independent. */
export function migrateLessonCheckpoint(checkpoint: Checkpoint | undefined, lesson: Lesson): Checkpoint | undefined {
  if (!checkpoint || checkpoint.contentVersion !== contentVersion || checkpoint.flowVersion !== lessonFlowVersion ||
    checkpoint.reviewFormat !== 3 || !checkpoint.exerciseIds?.length) return undefined;
  try {
    const steps = lessonSteps(lesson, checkpoint.review, checkpoint.exerciseIds);
    if (checkpoint.index >= steps.length || checkpoint.exerciseId !== lesson.id + ":" + steps[checkpoint.index].id) return undefined;
    return checkpoint;
  } catch { return undefined; }
}
