import type { Lesson, Level, Step } from "../curriculum";
import type { LessonDraft, ModuleDraft } from "./types";
import { authoredStepOrders, createLessonExperience, createPronunciationGuide, firstSentence, usageContrasts } from "./pedagogy.ts";
import { productionSupport } from "./production-support.ts";

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
  previous?: Pick<LessonDraft, "title" | "example" | "translation">,
): Lesson {
  const words = data.example.split(" ");
  const experience = createLessonExperience(data, module, position, previous);
  if (data.exampleFrom) experience.discovery = `Retome o modelo em uma situação diferente: ${data.question} Compare intenção, interpretação e efeito antes de consultar a explicação.`;
  const base: Record<string, Step> = {
    hook: { kind: "hook", title: experience.mechanic, body: experience.mission },
    error_preview: { kind: "discovery", title: "Observe antes de ver a explicação", body: `${experience.discovery} Pense em uma resposta e confira se ela funciona nos próximos exemplos.` },
    teach: { kind: "teach", title: "Entenda como funciona", body: data.rule },
    example: {
      kind: "example",
      title: "Ouça antes de ler",
      body: data.exampleFrom
        ? "Retome um modelo já estudado: que efeito a ironia produz em quem ouve? Nesta lição, você vai além da interpretação e pratica como reparar o mal-entendido. Ouça antes de revelar a frase."
        : "Primeiro, ouça e tente entender a mensagem. Preste atenção às palavras mais destacadas. Depois, revele o texto e confira o que entendeu.",
      english: data.example,
      translation: data.translation,
    },
    vocabulary: {
      kind: "vocabulary",
      title: "Palavras e expressões úteis",
      body: data.vocabulary,
    },
    pronunciation: {
      kind: "pronunciation",
      title: "Pratique a pronúncia",
      body: "Comece devagar. Siga a sequência abaixo: repita a palavra, depois um trecho e, por fim, a frase completa, acompanhando o ritmo do áudio.",
      pronunciation: createPronunciationGuide(data, module.level, position),
    },
    dialogue: {
      kind: "dialogue",
      title: "Acompanhe a conversa",
      body: "Observe o que cada pessoa diz e o que ela quer comunicar. Essas informações ajudam a entender a conversa e a responder às perguntas da lição.",
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
      title: "Entenda o erro e como corrigir",
      body: data.pitfall,
      contrasts: usageContrasts(data),
      explanation: data.gapExplanation,
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
      productionSupport: productionSupport[data.id],
      speakingTask: data.speakingTask ?? `Crie uma versão pessoal de “${data.example}”. Diga-a uma vez com cuidado e outra copiando o ritmo natural do áudio.`,
    },
    summary: {
      kind: "summary",
      title: "O que ficou mais fácil agora",
      body: `Você praticou como ${experience.application}. Lembre-se: ${firstSentence(data.rule)} Tente criar outro exemplo sem consultar o modelo. Se precisar de ajuda, releia a explicação e tente novamente.`,
      english: data.example,
      translation: data.translation,
    },
  };
  let steps = authoredStepOrders[position % authoredStepOrders.length].map(key => base[key]);
  if (data.listening) {
    const conversation = data.listening;
    const listeningStep = (kind: "choice" | "listening_detail" | "listening_inference", question: typeof conversation.gist, title: string): Step => ({
      kind, title, body: question.question, listening: conversation,
      options: rotate(question.choices, position + (kind === "listening_detail" ? 2 : 1)),
      answer: question.choices[0], explanation: question.explanation,
    });
    // The gist task precedes explanations and transcript. No sentence TTS is
    // substituted for a complete conversation, and no transcript is exposed in
    // the generic english/example fields before the listening attempt.
    steps = [base.hook,
      listeningStep("choice", conversation.gist, "Escuta global: qual é a intenção?"),
      listeningStep("listening_detail", conversation.detail, "Ouça de novo: encontre o detalhe"),
      listeningStep("listening_inference", conversation.inference, "Além das palavras: atitude e inferência"),
      base.teach, base.vocabulary, base.complete_sentence, base.error_analysis,
      base.order_words, { ...base.production, mediation: conversation.mediation }, base.summary];
  }
  return {
    id: data.id,
    title: data.title,
    englishTitle: data.example,
    level: module.level,
    minutes: estimateLessonMinutes("", module.level),
    moduleId: module.id,
    sourceIds: sourceIdsForLevel(module.level),
    steps,
    experience,
  };
}

export function estimateLessonMinutes(production: string, level: Level) {
  const base = ["C1", "C2"].includes(level) ? 20 : level === "B2" ? 15 : level === "B1" ? 9 : 7;
  const targets = [...production.matchAll(/(\d+)(?:[–-](\d+))? palavras/g)];
  const words = Math.max(0, ...targets.map(match => Number(match[2] ?? match[1])));
  // Editorial planning allowance for drafting + revision, not a fluency score.
  return base + Math.ceil(words / 60) * 5;
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
