import { contentVersion } from "./content/build.ts";
export const writingLimit = 10000;

export type Attempt = {
  id: string; lessonId: string; stepId: string; answer: string;
  correct: boolean; assisted: boolean; review: boolean;
  createdAt: string; contentVersion: string; evaluationVersion: string;
};
export type CheckpointStepState = {
  answer: string; tokens: number[]; checked: boolean; correct: boolean;
  translation: boolean; assisted: boolean; contextVisible: boolean;
};
export type Checkpoint = {
  lessonId: string; review: boolean; index: number; answer: string; tokens: number[];
  checked: boolean; correct: boolean; translation: boolean; assisted: boolean;
  contextVisible: boolean;
  receipt: string; draft: string; updatedAt: string; contentVersion: string;
  furthestIndex?: number; history?: Record<string, CheckpointStepState>;
};
export type Writing = { id: string; lessonId: string; text: string; createdAt: string; contentVersion: string };
export type Notebook = { id: string; english: string; translation: string; lessonId: string };
export type LearningWorkspace = {
  version: 1; checkpoints: Record<string, Checkpoint>; attempts: Attempt[];
  writings: Writing[]; vocabulary: Notebook[]; goal: string; minutes: number;
};
export const blankWorkspace = (): LearningWorkspace => ({ version: 1, checkpoints: {}, attempts: [], writings: [], vocabulary: [], goal: "Comunicar no dia a dia", minutes: 10 });
export const workspaceKey = (userId: string) => `sparky-learning:${userId}`;
export const checkpointKey = (lessonId: string, review: boolean) => `${lessonId}:${review ? "review" : "lesson"}`;
export function normalizeWorkspace(raw: unknown): LearningWorkspace {
  const blank = blankWorkspace();
  if (!raw || typeof raw !== "object" || (raw as LearningWorkspace).version !== 1) return blank;
  const value = raw as LearningWorkspace;
  // Local data is untrusted: filter corrupted entries before rendering or resuming.
  const string = (v: unknown) => typeof v === "string";
  const date = (v: unknown) => string(v) && Number.isFinite(Date.parse(v as string));
  const checkpoints = Object.fromEntries(Object.entries(value.checkpoints || {})
    .filter(([, p]) =>
      p && string(p.lessonId) && typeof p.review === "boolean" && p.contentVersion === contentVersion &&
      Number.isSafeInteger(p.index) && p.index >= 0 && p.index < 30 && string(p.answer) &&
      Array.isArray(p.tokens) && p.tokens.length <= 100 && p.tokens.every(t => Number.isSafeInteger(t) && t >= 0 && t < 100) &&
      typeof p.checked === "boolean" && typeof p.correct === "boolean" && typeof p.translation === "boolean" && typeof p.assisted === "boolean" &&
      string(p.receipt) && string(p.draft) && p.draft.length <= writingLimit && date(p.updatedAt))
    .map(([key, p]) => [key, {
      ...p,
      // The disclosure state is independent of the question's visible context.
      contextVisible: typeof p.contextVisible === "boolean" ? p.contextVisible : false,
      furthestIndex: Number.isSafeInteger(p.furthestIndex) && p.furthestIndex! >= p.index && p.furthestIndex! < 30 ? p.furthestIndex : p.index,
      history: p.history && typeof p.history === "object" ? Object.fromEntries(Object.entries(p.history).filter(([index, state]) => {
        const position = Number(index);
        return Number.isSafeInteger(position) && position >= 0 && position < 30 && state &&
          typeof state.answer === "string" && Array.isArray(state.tokens) && state.tokens.length <= 100 && state.tokens.every(t => Number.isSafeInteger(t) && t >= 0 && t < 100) &&
          typeof state.checked === "boolean" && typeof state.correct === "boolean" && typeof state.translation === "boolean" &&
          typeof state.assisted === "boolean" && typeof state.contextVisible === "boolean";
      })) : {},
    }]));
  const writings = Array.isArray(value.writings) ? value.writings.filter(w => w && string(w.id) && string(w.lessonId) && string(w.text) && w.text.length <= writingLimit && date(w.createdAt)) : [];
  for (const p of Object.values(value.checkpoints || {})) {
    if (p && p.contentVersion !== contentVersion && string(p.lessonId) && string(p.draft) && p.draft.trim() && p.draft.length <= writingLimit && date(p.updatedAt) &&
      !writings.some(w => w.lessonId === p.lessonId && w.text === p.draft)) {
      writings.push({ id: `recovered:${p.lessonId}:${p.updatedAt}`, lessonId: p.lessonId, text: p.draft, createdAt: p.updatedAt, contentVersion: p.contentVersion });
    }
  }
  return { ...blank, checkpoints,
    attempts: Array.isArray(value.attempts) ? value.attempts.filter(a => a && string(a.id) && string(a.lessonId) && string(a.stepId) && string(a.answer) && typeof a.correct === "boolean" && date(a.createdAt)).slice(-600) : [],
    writings: writings.slice(-100),
    vocabulary: Array.isArray(value.vocabulary) ? value.vocabulary.filter(w => w && string(w.id) && string(w.lessonId) && string(w.english) && string(w.translation)).slice(-200) : [],
    goal: string(value.goal) ? value.goal.slice(0, 120) : blank.goal,
    minutes: [5, 10, 15, 20].includes(value.minutes) ? value.minutes : 10,
  };
}
export function readWorkspace(userId: string): LearningWorkspace {
  try { return normalizeWorkspace(JSON.parse(localStorage.getItem(workspaceKey(userId)) || "null")); }
  catch { return blankWorkspace(); }
}
export function updateWorkspace(userId: string, update: (current: LearningWorkspace) => LearningWorkspace) {
  try {
    const value = normalizeWorkspace(update(readWorkspace(userId)));
    localStorage.setItem(workspaceKey(userId), JSON.stringify(value));
    window.dispatchEvent(new Event("sparky-workspace"));
    return true;
  } catch { return false; }
}
export function saveCheckpoint(userId: string, checkpoint: Checkpoint) {
  return updateWorkspace(userId, current => ({ ...current, checkpoints: {
    ...current.checkpoints, [checkpointKey(checkpoint.lessonId, checkpoint.review)]: checkpoint,
  } }));
}
