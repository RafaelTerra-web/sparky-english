import type { Lesson } from "./curriculum";
import type { Checkpoint } from "./learning-local";
import { isExercise } from "./study.ts";

export const lessonFlowVersion = 2;
export function lessonSteps(lesson: Lesson, review: boolean) {
  return lesson.steps.filter(step => review
    ? isExercise(step) || step.kind === "summary"
    : step.kind !== "production");
}

/** Keep receipts, answers and drafts when removing a non-assessed screen. */
export function migrateLessonCheckpoint(checkpoint: Checkpoint | undefined, lesson: Lesson): Checkpoint | undefined {
  if (!checkpoint || checkpoint.flowVersion === lessonFlowVersion) return checkpoint;
  if (checkpoint.review) return { ...checkpoint, flowVersion: lessonFlowVersion };
  const visible = lesson.steps.map((step, index) => step.kind === "production" ? -1 : index).filter(index => index >= 0);
  const position = (old: number) => {
    const next = visible.findIndex(index => index >= old);
    return next < 0 ? visible.length - 1 : next;
  };
  const index = position(checkpoint.index);
  const removed = lesson.steps[checkpoint.index]?.kind === "production";
  return {
    ...checkpoint, flowVersion: lessonFlowVersion, index,
    ...(removed ? { answer: "", tokens: [], checked: false, correct: false, revealed: false, listened: false, translation: false, assisted: false, contextVisible: false } : {}),
    furthestIndex: position(checkpoint.furthestIndex ?? checkpoint.index),
    history: Object.fromEntries(Object.entries(checkpoint.history ?? {}).filter(([key]) => visible.includes(Number(key))).map(([key, value]) => [position(Number(key)), value])),
  };
}
