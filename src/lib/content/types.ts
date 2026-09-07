import type { Level } from "../levels";
export type LessonDraft = {
  /** Published identity: independent of display order. Never reuse. */
  id: string;
  title: string;
  rule: string;
  example: string;
  translation: string;
  vocabulary: string;
  pitfall: string;
  dialogue: string;
  dialogueTranslation: string;
  question: string;
  // The first option is the editorial key; the builder rotates displayed options.
  choices: [string, string, string];
  explanation: string;
  gap: string;
  fills: [string, string, string];
  gapExplanation: string;
  production: string;
  productionChecklist?: string[];
  speakingTask?: string;
};
export type LessonExperience = {
  personality: string;
  mechanic: string;
  mission: string;
  discovery: string;
  challenge: string;
  application: string;
  memoryCue?: string;
};
export type PronunciationGuide = {
  focus: string;
  ipa?: string;
  mouth: string;
  careful: string;
  natural: string;
  change: string;
  drill: [string, string, string];
  contrast?: [string, string];
};
export type UsageContrast = {
  label: "MUITO NATURAL" | "ARMADILHA" | "CORREÇÃO";
  text: string;
  tone: "good" | "warning" | "fixed";
};
export type ModuleDraft = {
  id: string;
  title: string;
  level: Level;
  description: string;
  legacyId?: string;
  /** Override the visual prerequisite when an optional extension precedes another level. */
  prerequisiteId?: string | null;
  lessons: LessonDraft[];
};
