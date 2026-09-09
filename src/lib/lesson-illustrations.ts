const relatedScenes: Record<string, string> = {
  "b1-vida-em-movimento": "b1-colaboracao",
  "b2-acordos-cotidianos": "b2-autonomia",
  "c1-intencoes-e-impacto": "c1-interacao",
  "c2-significado-em-disputa": "c2-nuance",
};
export function lessonIllustrationId(lesson: { id: string; moduleId?: string }) {
  return lesson.id === "a1-1-1" ? lesson.id : relatedScenes[lesson.moduleId ?? ""] ?? lesson.moduleId;
}
