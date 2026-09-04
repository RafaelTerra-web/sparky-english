export type LessonDraft = {
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
};
export type ModuleDraft = {
  id: string;
  title: string;
  level: "A1" | "A2" | "B1";
  description: string;
  legacyId?: string;
  lessons: LessonDraft[];
};
