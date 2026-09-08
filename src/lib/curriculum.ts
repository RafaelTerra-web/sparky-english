import { a1Modules } from "./content/a1.ts";
import { a2Modules } from "./content/a2.ts";
import { a2CommunicationModules } from "./content/a2-practice.ts";
import { b1Modules } from "./content/b1.ts";
import { b2Modules } from "./content/b2.ts";
import { c1Modules } from "./content/c1.ts";
import { c1ExtensionModules } from "./content/c1-extension.ts";
import { c2Modules } from "./content/c2.ts";
import { c2ExtensionModules } from "./content/c2-extension.ts";
import { buildLesson, sourceIdsForLevel } from "./content/build.ts";
import { authoredStepOrders, createLessonExperience, createPronunciationGuide, usageContrasts } from "./content/pedagogy.ts";
import type { ModuleDraft, LessonExperience, PronunciationGuide, UsageContrast, ProductionSupport } from "./content/types.ts";

import type { Level } from "./levels";
import type { ListeningConversation } from "./listening-types";
export type { Level } from "./levels";
export type Step = {
  kind:
    | "hook"
    | "discovery"
    | "teach"
    | "example"
    | "dialogue"
    | "choice"
    | "listening_detail"
    | "listening_inference"
    | "complete_sentence"
    | "order_words"
    | "vocabulary"
    | "pronunciation"
    | "error_analysis"
    | "production"
    | "summary";
  title: string;
  body: string;
  english?: string;
  translation?: string;
  translationSummary?: boolean;
  options?: string[];
  answer?: string;
  explanation?: string;
  checklist?: string[];
  speakingTask?: string;
  pronunciation?: PronunciationGuide;
  contrasts?: UsageContrast[];
  productionSupport?: ProductionSupport;
  listening?: ListeningConversation;
  mediation?: string;
};
export type Lesson = {
  id: string;
  title: string;
  englishTitle: string;
  level: Level;
  minutes: number;
  steps: Step[];
  moduleId?: string;
  sourceIds?: string[];
  experience: LessonExperience;
};
type LessonInput = {
  id: string;
  title: string;
  englishTitle: string;
  level: Level;
  rule: string;
  example: string;
  translation: string;
  dialogue: string;
  dialogueTranslation: string;
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  gap: string;
  gapOptions: string[];
  gapAnswer: string;
  gapExplanation: string;
};

function lesson(data: LessonInput): Lesson {
  return {
    id: data.id,
    title: data.title,
    englishTitle: data.englishTitle,
    level: data.level,
    minutes: 4,
    steps: [
      { kind: "teach", title: data.title, body: data.rule },
      {
        kind: "example",
        title: "Veja como usar",
        body: "Leia a frase em inglês. Use a tradução se precisar.",
        english: data.example,
        translation: data.translation,
      },
      {
        kind: "dialogue",
        title: "Em uma conversa",
        body: "Observe como a expressão aparece na resposta.",
        english: data.dialogue,
        translation: data.dialogueTranslation,
      },
      {
        kind: "choice",
        title: "Escolha a resposta",
        body: data.question,
        options: data.choices,
        answer: data.answer,
        explanation: data.explanation,
      },
      {
        kind: "complete_sentence",
        title: "Complete a frase",
        body: "Qual opção preenche a lacuna?",
        english: data.gap,
        options: data.gapOptions,
        answer: data.gapAnswer,
        explanation: data.gapExplanation,
      },
      {
        kind: "order_words",
        title: "Monte a frase",
        body: data.translation,
        options: data.example
          .split(" ")
          .slice(2)
          .concat(data.example.split(" ").slice(0, 2)),
        answer: data.example,
        explanation: data.rule,
      },
      {
        kind: "summary",
        title: "O que você praticou",
        body: data.rule,
        english: data.example,
        translation: data.translation,
      },
    ],
    experience: {
      personality: "Professor particular",
      mechanic: "Construção guiada",
      mission: `Pratique o tema “${data.title}” em uma situação do dia a dia e observe como as expressões são usadas.`,
      discovery: "Que pequena escolha faz a frase soar clara em inglês?",
      challenge: `Pratique o tema “${data.title}”: crie uma resposta curta e adapte pelo menos um detalhe do exemplo à sua realidade.`,
      application: "levar a estrutura para uma conversa curta",
    },
  };
}

function personalizeLegacyLesson(original: Lesson, module: ModuleDraft, position: number): Lesson {
  const teach = original.steps.find(step => step.kind === "teach")!;
  const example = original.steps.find(step => step.kind === "example")!;
  const dialogue = original.steps.find(step => step.kind === "dialogue")!;
  const gap = original.steps.find(step => step.kind === "complete_sentence")!;
  const draft = {
    title: original.title,
    rule: teach.body,
    example: example.english!,
    translation: example.translation!,
    vocabulary: example.english!,
    dialogueTranslation: dialogue.translation!,
    gap: gap.english!,
    fills: [gap.answer!, ...gap.options!.filter(option => option !== gap.answer)] as [string, string, string],
  };
  const experience = createLessonExperience(draft, module, position);
  const base: Record<string, Step> = Object.fromEntries(original.steps.map(step => [step.kind, step]));
  base.hook = { kind: "hook", title: experience.mechanic, body: experience.mission };
  base.pronunciation = { kind: "pronunciation", title: "Pratique a pronúncia", body: "Comece pela palavra, depois repita um trecho e, por fim, acompanhe o ritmo da frase inteira.", pronunciation: createPronunciationGuide(draft, original.level, position) };
  base.error_analysis = { kind: "error_analysis", title: "Entenda o erro e como corrigir", body: teach.body, contrasts: usageContrasts(draft), explanation: gap.explanation };
  base.production = { kind: "production", title: "Agora é com você", body: `Pratique o tema “${original.title}”: crie uma resposta curta e adapte pelo menos um detalhe do exemplo à sua realidade.`, speakingTask: `Diga sua versão em voz alta. Depois, ouça o modelo e repita, observando as palavras mais destacadas e como elas se ligam na fala.` };
  base.summary = { ...base.summary, body: `Você praticou como ${experience.application}. ${teach.body} Tente criar outro exemplo sem olhar.` };
  const order = authoredStepOrders[position % authoredStepOrders.length];
  return { ...original, minutes: 7, experience, steps: order.map(key => base[key]).filter(Boolean) };
}

const introductoryLessons: Lesson[] = [
  lesson({
    id: "a1-1-1",
    title: "Apresentar-se",
    englishTitle: "Meet someone new",
    level: "A1",
    rule: "Para dizer seu nome, use I'm + nome. I'm é a forma curta de I am. Em português, dizemos 'eu sou'; em inglês, I precisa aparecer.",
    example: "Hi, I'm Ana.",
    translation: "Oi, eu sou a Ana.",
    dialogue:
      "Ana: Hi, I'm Ana. Nice to meet you.\nLeo: I'm Leo. Nice to meet you too!",
    dialogueTranslation:
      "Ana: Oi, eu sou a Ana. Prazer em conhecer você.\nLeo: Eu sou o Leo. Prazer em conhecer você também!",
    question: "Alguém diz 'Nice to meet you'. Como você responde?",
    choices: ["Nice to meet you too!", "I'm meet you.", "You nice meet."],
    answer: "Nice to meet you too!",
    explanation:
      "Too significa 'também' e aparece no fim: Nice to meet you too!",
    gap: "Hi, ___ Ana.",
    gapOptions: ["I", "I'm", "am I"],
    gapAnswer: "I'm",
    gapExplanation:
      "I'm reúne o sujeito I e o verbo am. Só I deixa a frase sem verbo.",
  }),
  lesson({
    id: "a1-2-1",
    title: "Falar da rotina",
    englishTitle: "Talk about your day",
    level: "A1",
    rule: "Use o presente simples para hábitos. Com I, diga I work, I study, I start. Para um horário exato, use at: at nine. Não traduza 'às' como in.",
    example: "I start work at nine.",
    translation: "Eu começo a trabalhar às nove.",
    dialogue:
      "Ana: What time do you start work?\nBen: I start work at nine. And you?",
    dialogueTranslation:
      "Ana: A que horas você começa a trabalhar?\nBen: Eu começo às nove. E você?",
    question: "Qual frase informa corretamente um horário de trabalho?",
    choices: [
      "I start work in nine.",
      "I start work at nine.",
      "I am start work nine.",
    ],
    answer: "I start work at nine.",
    explanation:
      "At acompanha horários exatos. I start já contém sujeito e verbo; não coloque am antes de start.",
    gap: "I study English ___ seven.",
    gapOptions: ["on", "in", "at"],
    gapAnswer: "at",
    gapExplanation:
      "Para 'às sete', use at seven. On acompanha dias; in, meses e períodos mais longos.",
  }),
  lesson({
    id: "a2-3-1",
    title: "Combinar um encontro",
    englishTitle: "Make plans with friends",
    level: "A2",
    rule: "Let's + verbo propõe uma atividade em conjunto: Let's meet. Para dias da semana, use on. Let's não precisa de to depois.",
    example: "Let's meet on Saturday.",
    translation: "Vamos nos encontrar no sábado.",
    dialogue:
      "Sam: Are you free this weekend?\nJo: Yes. Let's meet on Saturday.\nSam: Sounds good!",
    dialogueTranslation:
      "Sam: Você está livre neste fim de semana?\nJo: Sim. Vamos nos encontrar no sábado.\nSam: Boa ideia!",
    question: "Você quer sugerir um café para os dois. O que diz?",
    choices: [
      "Let's to have coffee.",
      "Let's having coffee.",
      "Let's have coffee.",
    ],
    answer: "Let's have coffee.",
    explanation:
      "Após let's, use o verbo na forma base: have. Não acrescente to nem -ing.",
    gap: "Let's meet ___ Friday.",
    gapOptions: ["at", "on", "in"],
    gapAnswer: "on",
    gapExplanation: "Use on com dias da semana: on Friday, on Saturday.",
  }),
  lesson({
    id: "a2-4-1",
    title: "Contar o que aconteceu",
    englishTitle: "Talk about past events",
    level: "A2",
    rule: "Para uma ação terminada no passado, use o passado simples. Go muda para went. Em uma pergunta com did, o verbo volta à forma base: Did you go?",
    example: "I went to the park yesterday.",
    translation: "Eu fui ao parque ontem.",
    dialogue:
      "Alex: What did you do yesterday?\nKim: I went to the park.\nAlex: Did you go alone?",
    dialogueTranslation:
      "Alex: O que você fez ontem?\nKim: Eu fui ao parque.\nAlex: Você foi sozinho(a)?",
    question: "Qual pergunta está correta?",
    choices: [
      "Did you went to the park?",
      "Did you go to the park?",
      "Do you went to the park?",
    ],
    answer: "Did you go to the park?",
    explanation: "Did já marca o passado. Depois dele, usamos go, e não went.",
    gap: "Yesterday, I ___ to the park.",
    gapOptions: ["go", "going", "went"],
    gapAnswer: "went",
    gapExplanation:
      "Yesterday situa a ação no passado. Na afirmação, o passado de go é went.",
  }),
  lesson({
    id: "b1-5-1",
    title: "Dar sua opinião",
    englishTitle: "Share an opinion",
    level: "B1",
    rule: "I think introduz uma opinião. Because acrescenta a razão. Diferencie opinião de fato: I think this plan is better mostra que se trata da sua avaliação.",
    example: "I think this plan is better.",
    translation: "Eu acho que este plano é melhor.",
    dialogue:
      "Pat: Which plan do you prefer?\nLee: I think this plan is better because it costs less.\nPat: That makes sense.",
    dialogueTranslation:
      "Pat: Qual plano você prefere?\nLee: Acho que este plano é melhor porque custa menos.\nPat: Faz sentido.",
    question: "Qual resposta apresenta uma opinião e sua razão?",
    choices: [
      "I think it's useful because it saves time.",
      "It useful I think save.",
      "Because I think.",
    ],
    answer: "I think it's useful because it saves time.",
    explanation:
      "I think apresenta a opinião; because it saves time explica por quê.",
    gap: "I prefer this option ___ it costs less.",
    gapOptions: ["but", "because", "although"],
    gapAnswer: "because",
    gapExplanation:
      "Because introduz o motivo. But e although introduzem contraste, que não é a relação pedida aqui.",
  }),
  lesson({
    id: "b1-6-1",
    title: "Pedir esclarecimento",
    englishTitle: "Handle a misunderstanding",
    level: "B1",
    rule: "Could you + verbo é uma maneira educada de fazer um pedido. Para verificar o que entendeu, use Do you mean…? Isso permite manter a conversa sem adivinhar.",
    example: "Could you explain that again?",
    translation: "Você poderia explicar isso de novo?",
    dialogue:
      "Nina: Let's move the meeting forward.\nTom: Do you mean we should meet earlier?\nNina: Yes, at two instead of three.",
    dialogueTranslation:
      "Nina: Vamos antecipar a reunião.\nTom: Você quer dizer que devemos nos reunir mais cedo?\nNina: Sim, às duas em vez de às três.",
    question:
      "Você não entendeu uma explicação. Qual pedido é educado e claro?",
    choices: [
      "Explain again you!",
      "Could you explain that again?",
      "You explain could again?",
    ],
    answer: "Could you explain that again?",
    explanation:
      "Na pergunta, could vem antes do sujeito you; explain fica na forma base.",
    gap: "Do you ___ we should meet earlier?",
    gapOptions: ["mean", "means", "meaning"],
    gapAnswer: "mean",
    gapExplanation:
      "Com o auxiliar do, usamos a forma base mean: 'Você quer dizer…?'",
  }),
];

const drafts = [...a1Modules, ...a2Modules, ...a2CommunicationModules, ...b1Modules, ...b2Modules, ...c1Modules, ...c1ExtensionModules, ...c2Modules, ...c2ExtensionModules];
export const modules = drafts.map((module, index) => {
  const items = module.lessons.map((draft, position) => {
    return buildLesson(draft, module, position, module.lessons[position - 1]);
  });
  const introductory = introductoryLessons.find(
    (item) => item.id === module.legacyId,
  );
  if (introductory) {
    // Keep existing progress IDs; the past-tense introduction follows the foundations.
    const insertion = module.id === "a2-passado" ? 3 : 0;
    items.splice(insertion, 0, {
      ...personalizeLegacyLesson(introductory, module, insertion),
      moduleId: module.id,
      sourceIds: sourceIdsForLevel(module.level),
    });
  }
  return {
    id: module.id,
    title: module.title,
    level: module.level,
    description: module.description,
    order: index + 1,
    prerequisiteId: module.prerequisiteId ?? (index > 0 ? drafts[index - 1].id : null),
    lessons: items,
  };
});
export type CourseModule = (typeof modules)[number];
export const lessons: Lesson[] = modules.flatMap((module) => module.lessons);

export function searchModules(level: Level | "all", query: string) {
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const needle = normalize(query.trim());
  return modules
    .filter((module) => level === "all" || module.level === level)
    .map((module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) =>
        normalize(
          [
            module.title,
            module.description,
            lesson.title,
            lesson.englishTitle,
            ...lesson.steps.map((step) =>
              [step.body, step.english ?? ""].join(" "),
            ),
          ].join(" "),
        ).includes(needle),
      ),
    }))
    .filter((module) => module.lessons.length > 0);
}

export function correctAnswer(step: Step, answer: string) {
  return answer === step.answer;
}
