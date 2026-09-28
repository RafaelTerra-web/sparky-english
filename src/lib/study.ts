import { normalizeOrderAnswer } from "./content/order-variants.ts";
import { lessons, type Lesson, type Step } from "./curriculum.ts";
import { contentVersion } from "./content/build.ts";
import { personalizeLesson } from "./personalized-lesson.ts";
import { studyDay } from "./review-plan.ts";

export const evaluationVersion = "closed-exact-3";
export const isExercise = (step: Step) =>
  ["choice", "listening_detail", "listening_inference", "complete_sentence", "order_words"].includes(step.kind);
export const exerciseId = (lesson: Lesson, step: Step) => lesson.id + ":" + (step.id ?? step.kind);
export function studyExercises(lesson: Lesson, review: boolean, ids?: readonly string[], now = Date.now()): Step[] {
  const all = lesson.exercises ?? lesson.steps.filter(isExercise);
  if (ids) {
    const selected = ids.map(id => all.find(step => exerciseId(lesson, step) === id));
    if (selected.some(step => !step) || new Set(ids).size !== ids.length) throw new Error("invalid-attempt");
    return selected as Step[];
  }
  if (!review) return all;
  const choices = all.filter(step => step.kind === "choice");
  const orders = all.filter(step => step.kind === "order_words");
  const day = studyDay(new Date(now));
  const shift = [...lesson.id + day].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0, 0) % 3;
  return [choices[shift], orders[shift], choices[(shift + 1) % 3]];
}
export type StudyReceipt = {
  lessonId: string; review: boolean; contentVersion: string; evaluationVersion: string;
  exerciseIds: string[]; sessionId: string;
  passed: number; failed: number; assisted: number; startedAt: number;
};
export function startStudy(lessonId: string, review: boolean, now = Date.now()): StudyReceipt {
  const lesson = lessons.find(item => item.id === lessonId);
  if (!lesson) throw new Error("lesson-not-found");
  return { lessonId, review, contentVersion, evaluationVersion,
    exerciseIds: studyExercises(lesson, review, undefined, now).map(step => exerciseId(lesson, step)),
    sessionId: crypto.randomUUID(), passed: 0, failed: 0, assisted: 0, startedAt: now };
}
function validReceipt(receipt: StudyReceipt, lesson: Lesson, review: boolean, now: number) {
  if (receipt.lessonId !== lesson.id || receipt.review !== review ||
    receipt.contentVersion !== contentVersion || receipt.evaluationVersion !== evaluationVersion ||
    !Number.isFinite(receipt.startedAt) || receipt.startedAt > now || now - receipt.startedAt > 8 * 3600000 ||
    typeof receipt.sessionId !== "string" || !/^[a-f0-9-]{36}$/.test(receipt.sessionId) ||
    !Array.isArray(receipt.exerciseIds)) return false;
  const expected = studyExercises(lesson, review, undefined, receipt.startedAt).map(step => exerciseId(lesson, step));
  const mask = (1 << expected.length) - 1;
  return expected.length === receipt.exerciseIds.length && expected.every((id, i) => id === receipt.exerciseIds[i]) &&
    [receipt.passed, receipt.failed, receipt.assisted].every(value => Number.isSafeInteger(value) && value >= 0 && value <= mask);
}
export function gradeAttempt(input: {
  lessonId: string; review: boolean; stepId: string; answer: string;
  assisted: boolean; learnerName?: string; previous?: StudyReceipt | null;
}, now = Date.now()) {
  const original = lessons.find(item => item.id === input.lessonId);
  const lesson = original ? personalizeLesson(original, input.learnerName) : undefined;
  if (!lesson) throw new Error("lesson-not-found");
  const old = input.previous;
  if (old && !validReceipt(old, lesson, input.review, now)) throw new Error("study-expired");
  const receipt = old ? { ...old } : startStudy(lesson.id, input.review, now);
  const exercises = studyExercises(lesson, input.review, receipt.exerciseIds);
  const index = exercises.findIndex(step => exerciseId(lesson, step) === input.stepId);
  if (index < 0 || input.answer.length > 4000) throw new Error("invalid-attempt");
  const preceding = (1 << index) - 1;
  if ((receipt.passed & preceding) !== preceding) throw new Error("study-out-of-order");
  const step = exercises[index];
  const correct = step.kind === "order_words" ? [step.answer!, ...(step.acceptedAnswers ?? [])].some(answer => normalizeOrderAnswer(answer) === normalizeOrderAnswer(input.answer)) : input.answer === step.answer;
  // Rechecking a passed answer must never create extra points or erase a failure.
  if (correct) receipt.passed |= 1 << index;
  else receipt.failed |= 1 << index;
  if (input.assisted) receipt.assisted |= 1 << index;
  return { receipt, correct, explanation: exercises[index].explanation, evaluationVersion };
}
export function verifyCompletion(receipt: StudyReceipt | null, lessonId: string, review: boolean, now = Date.now()) {
  const lesson = lessons.find(item => item.id === lessonId);
  if (!receipt || !lesson || !validReceipt(receipt, lesson, review, now) ||
    (review && studyDay(new Date(receipt.startedAt)) !== studyDay(new Date(now))) ||
    receipt.passed !== (1 << receipt.exerciseIds.length) - 1) throw new Error("study-incomplete");
  return { independent: receipt.failed === 0 && receipt.assisted === 0 };
}

export function validateStudySession(receipt: StudyReceipt, now = Date.now()) {
  const lesson = lessons.find(item => item.id === receipt.lessonId);
  if (!lesson || !validReceipt(receipt, lesson, receipt.review, now)) throw new Error("study-expired");
  return lesson;
}
