import { lessons, type Lesson, type Step } from "./curriculum.ts";
import { contentVersion } from "./content/build.ts";
import { personalizeLesson } from "./personalized-lesson.ts";

export const evaluationVersion = "closed-exact-2";
export function studyExercises(lesson: Lesson, review: boolean) { const all = lesson.steps.filter(isExercise); return review ? all.slice(0, 1) : all; }
export const isExercise = (step: Step) =>
  ["choice", "listening_detail", "listening_inference", "complete_sentence", "order_words"].includes(step.kind);
// Each published lesson has one exercise of each kind; editorial tests enforce it.
export const exerciseId = (lesson: Lesson, step: Step) => `${lesson.id}:${step.kind}`;
export type StudyReceipt = {
  lessonId: string; review: boolean; contentVersion: string;
  passed: number; failed: number; assisted: number; startedAt: number;
};
export function gradeAttempt(input: {
  lessonId: string; review: boolean; stepId: string; answer: string;
  assisted: boolean; learnerName?: string; previous?: StudyReceipt | null;
}, now = Date.now()) {
  const original = lessons.find((item) => item.id === input.lessonId);
  const lesson = original ? personalizeLesson(original, input.learnerName) : undefined;
  if (!lesson) throw new Error("lesson-not-found");
  const exercises = studyExercises(lesson, input.review);
  const index = exercises.findIndex((step) => exerciseId(lesson, step) === input.stepId);
  if (index < 0 || input.answer.length > 4000) throw new Error("invalid-attempt");
  const old = input.previous;
  if (old && (old.lessonId !== input.lessonId || old.review !== input.review ||
    old.contentVersion !== contentVersion || now - old.startedAt > 8 * 3600000))
    throw new Error("study-expired");
  const receipt: StudyReceipt = old ? { ...old } : {
    lessonId: lesson.id, review: input.review, contentVersion,
    passed: 0, failed: 0, assisted: 0, startedAt: now,
  };
  const preceding = (1 << index) - 1;
  if ((receipt.passed & preceding) !== preceding) throw new Error("study-out-of-order");
  const correct = input.answer === exercises[index].answer;
  if (correct) receipt.passed |= 1 << index;
  else receipt.failed |= 1 << index;
  if (input.assisted) receipt.assisted |= 1 << index;
  return { receipt, correct, explanation: exercises[index].explanation, evaluationVersion };
}
export function verifyCompletion(receipt: StudyReceipt | null, lessonId: string, review: boolean, now = Date.now()) {
  const lesson = lessons.find((item) => item.id === lessonId);
  const studyDay = (time: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(time);
  if (!receipt || !lesson || receipt.lessonId !== lessonId || receipt.review !== review ||
    receipt.contentVersion !== contentVersion || now - receipt.startedAt > 8 * 3600000 ||
    receipt.startedAt > now || (review && studyDay(receipt.startedAt) !== studyDay(now)) ||
    receipt.passed !== (1 << studyExercises(lesson, review).length) - 1)
    throw new Error("study-incomplete");
  return { independent: receipt.failed === 0 && receipt.assisted === 0 };
}
