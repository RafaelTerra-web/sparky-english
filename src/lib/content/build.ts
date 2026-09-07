import type { Lesson, Level, Step } from "../curriculum";
import type { LessonDraft, ModuleDraft } from "./types";

export const contentVersion = "2026-09-06.2";
export const sourceIdsForLevel = (level: Level) => ["B2", "C1", "C2"].includes(level) ? ["cefr", "cefr-global", "cefr-spoken"] : [
  "cefr",
  ["B1", "B2", "C1", "C2"].includes(level) ? "bc-grammar-b1" : "bc-grammar-a1",
  "bc-vocabulary",
  ["B1", "B2", "C1", "C2"].includes(level) ? "bc-reading-b1" : "bc-reading-a1",
];

function rotate(items: string[], shift: number) {
  const offset = shift % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function buildLesson(
  data: LessonDraft,
  module: ModuleDraft,
  position: number,
): Lesson {
  const words = data.example.split(" ");
  const steps: Step[] = [
    { kind: "teach", title: data.title, body: data.rule },
    {
      kind: "example",
      title: "Estrutura em uso",
      body: "Observe a frase e consulte a tradução quando precisar.",
      english: data.example,
      translation: data.translation,
    },
    {
      kind: "vocabulary",
      title: "Vocabulário de apoio",
      body: data.vocabulary,
    },
    { kind: "teach", title: "Atenção ao uso", body: data.pitfall },
    {
      kind: "dialogue",
      title: "Leia em contexto",
      body: "Leia o texto completo. Na próxima etapa, você vai interpretar uma informação dele.",
      english: data.dialogue,
      translation: data.dialogueTranslation,
      translationSummary: ["B2", "C1", "C2"].includes(module.level),
    },
    {
      kind: "choice",
      title: "Interpretação",
      body: data.question,
      english: data.dialogue,
      translation: data.dialogueTranslation,
      translationSummary: ["B2", "C1", "C2"].includes(module.level),
      options: rotate(data.choices, position + 1),
      answer: data.choices[0],
      explanation: data.explanation,
    },
    {
      kind: "complete_sentence",
      title: "Pratique a estrutura",
      body: "Escolha a opção que completa a frase no contexto indicado.",
      english: data.gap,
      options: rotate(data.fills, position + 2),
      answer: data.fills[0],
      explanation: data.gapExplanation,
    },
    {
      kind: "order_words",
      title: "Reconstrua a frase",
      body: data.translation,
      options: rotate(words, Math.max(1, Math.floor(words.length / 2))),
      answer: data.example,
      explanation: data.rule,
    },
    {
      kind: "production",
      title: "Produza com suas palavras",
      body: data.production,
      checklist: data.productionChecklist,
      speakingTask: data.speakingTask,
    },
    {
      kind: "summary",
      title: "Guarde a ideia central",
      body: data.rule,
      english: data.example,
      translation: data.translation,
    },
  ];
  return {
    id: data.id,
    title: data.title,
    englishTitle: data.example,
    level: module.level,
    minutes: ["C1", "C2"].includes(module.level) ? 20 : module.level === "B2" ? 15 : module.level === "B1" ? 9 : 7,
    moduleId: module.id,
    sourceIds: sourceIdsForLevel(module.level),
    steps,
  };
}

export const curriculumSources = [
  {
    id: "cefr-global",
    title: "Conselho da Europa — escala global A1–C2",
    url: "https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale",
    scope: "Objetivos comunicativos dos níveis avançados. As lições são autorais e não constituem cobertura integral ou certificação.",
  },
  {
    id: "cefr-spoken",
    title: "Conselho da Europa — aspectos qualitativos da fala",
    url: "https://www.coe.int/en/web/common-european-framework-reference-languages/table-3-cefr-3.3-common-reference-levels-qualitative-aspects-of-spoken-language-use",
    scope: "Referência para prática de precisão, fluidez, interação e coerência. O app não atribui nível de proficiência pela transcrição.",
  },
  {
    id: "cefr",
    title: "Conselho da Europa — descrições dos níveis CEFR",
    url: "https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions",
    scope:
      "Referência de progressão comunicativa. Os rótulos A1–C2 deste curso são orientativos, não certificação.",
  },
  {
    id: "bc-grammar-a1",
    title: "British Council — gramática A1–A2",
    url: "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2",
    scope:
      "Consulta de tópicos e estruturas fundamentais; explicações e exercícios do Sparky são próprios.",
  },
  {
    id: "bc-grammar-b1",
    title: "British Council — gramática B1–B2",
    url: "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2",
    scope:
      "Consulta de estruturas intermediárias; seleção introdutória, sem alegar cobrir todo o B2.",
  },
  {
    id: "bc-vocabulary",
    title: "British Council — vocabulário por assunto",
    url: "https://learnenglish.britishcouncil.org/free-resources/vocabulary",
    scope: "Referência para organização temática do vocabulário.",
  },
  {
    id: "bc-reading-a1",
    title: "British Council — leitura A1",
    url: "https://learnenglish.britishcouncil.org/free-resources/reading/a1",
    scope: "Referência de gêneros breves, como mensagens, avisos e instruções.",
  },
  {
    id: "bc-reading-b1",
    title: "British Council — leitura B1",
    url: "https://learnenglish.britishcouncil.org/free-resources/reading/b1",
    scope:
      "Referência de objetivos de compreensão. Os textos deste curso foram escritos para o Sparky.",
  },
];
