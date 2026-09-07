import type { Lesson, Level, Step } from "../curriculum";
import type { LessonDraft, ModuleDraft } from "./types";
import { authoredStepOrders, createLessonExperience, createPronunciationGuide, firstSentence, usageContrasts } from "./pedagogy.ts";

export const contentVersion = "2026-09-07.2";
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
  previousTitle?: string,
): Lesson {
  const words = data.example.split(" ");
  const experience = createLessonExperience(data, module, position, previousTitle);
  const base: Record<string, Step> = {
    hook: { kind: "hook", title: experience.mechanic, body: experience.mission },
    error_preview: { kind: "discovery", title: "Tem algo para descobrir", body: `${experience.discovery} Ainda não procure a regra: formule uma hipótese e teste-a nas próximas etapas.` },
    teach: { kind: "teach", title: "Organize a descoberta", body: data.rule },
    example: {
      kind: "example",
      title: "Ouça antes de revelar",
      body: "Primeiro procure as palavras fortes e a intenção. Depois revele o texto e confira sua hipótese.",
      english: data.example,
      translation: data.translation,
    },
    vocabulary: {
      kind: "vocabulary",
      title: "Três peças que valem guardar",
      body: data.vocabulary,
    },
    pronunciation: {
      kind: "pronunciation",
      title: "Pronúncia que destrava a frase",
      body: "Faça o movimento devagar, suba pela escada de repetição e termine copiando o ritmo do áudio natural.",
      pronunciation: createPronunciationGuide(data, module.level, position),
    },
    dialogue: {
      kind: "dialogue",
      title: "A cena completa",
      body: "Entre na situação e acompanhe a intenção de cada fala. A próxima decisão depende de uma pista do contexto.",
      english: data.dialogue,
      translation: data.dialogueTranslation,
      translationSummary: ["B2", "C1", "C2"].includes(module.level),
    },
    choice: {
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
    complete_sentence: {
      kind: "complete_sentence",
      title: "Pratique a estrutura",
      body: "Escolha a opção que completa a frase no contexto indicado.",
      english: data.gap,
      options: rotate(data.fills, position + 2),
      answer: data.fills[0],
      explanation: data.gapExplanation,
    },
    error_analysis: {
      kind: "error_analysis",
      title: "Por que a armadilha engana",
      body: data.pitfall,
      contrasts: usageContrasts(data),
    },
    order_words: {
      kind: "order_words",
      title: "Reconstrua a frase",
      body: data.translation,
      options: rotate(words, Math.max(1, Math.floor(words.length / 2))),
      answer: data.example,
      explanation: data.rule,
    },
    production: {
      kind: "production",
      title: "Produza com suas palavras",
      body: data.production,
      checklist: data.productionChecklist,
      speakingTask: data.speakingTask ?? `Crie uma versão pessoal de “${data.example}”. Diga-a uma vez com cuidado e outra copiando o ritmo natural do áudio.`,
    },
    summary: {
      kind: "summary",
      title: "O que ficou mais fácil agora",
      body: `Agora você consegue ${experience.application}. Ideia central: ${firstSentence(data.rule)}${experience.memoryCue ? ` Conexão recuperada: ${experience.memoryCue}` : ""}`,
      english: data.example,
      translation: data.translation,
    },
  };
  const steps = authoredStepOrders[position % authoredStepOrders.length].map(key => base[key]);
  return {
    id: data.id,
    title: data.title,
    englishTitle: data.example,
    level: module.level,
    minutes: ["C1", "C2"].includes(module.level) ? 20 : module.level === "B2" ? 15 : module.level === "B1" ? 9 : 7,
    moduleId: module.id,
    sourceIds: sourceIdsForLevel(module.level),
    steps,
    experience,
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
