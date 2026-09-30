import { orderVariants } from "./order-variants.ts";
import type { Lesson, Step } from "../curriculum.ts";
import editorial from "./quick-lessons.json" with { type: "json" };

type QuickEditorial = {
  vocabulary?: string;
  intent: string[];
  sentences: string[][];
  scene: string;
  replies: string[];
  note: string[];
};
const entries = editorial as Record<string, QuickEditorial>;
// These hints explain the context without supplying the word missing from the gap.
const gapHints: Record<string, string> = {
  "a1-identidade-01": "the name of the person you are asking",
  "a1-pessoas-04": "keys belonging to the speaker",
  "a1-rotina-04": "every time",
  "a1-interacao-02": "the speaker",
  "a2-experiencias-02": "not at any time",
  "a2-servicos-05": "proof of purchase",
  "a2-servicos-06": "able to meet",
  "a2-textos-04": "kind and welcoming",
  "a2-textos-06": "a requirement",
  "b1-argumentos-04": "a negative point",
  "b1-colaboracao-05": "a completed arrival",
  "b1-leitura-01": "became higher",
  "b1-leitura-03": "continuing to be the case",
  "b1-leitura-06": "a deadline",
};
function rotate<T>(items: T[], id: string): T[] {
  const hash = [...id].reduce((value, c) => (value * 31 + c.charCodeAt(0)) >>> 0, 0);
  const offset = hash % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}
/** Published identities and the full reference material remain unchanged. */
export function quickLesson(original: Lesson): Lesson {
  const entry = entries[original.id];
  if (!entry) throw new Error("Missing quick editorial: " + original.id);
  const gap = original.steps.find(step => step.kind === "complete_sentence")!;
  const feedback = { explanation: entry.note[0], explanationEnglish: entry.note[1] };
  const choice = (id: string, body: string, bodyEnglish: string, options: string[], answer: string, english?: string): Step => ({
    id, kind: "choice", title: "Escolha a resposta", body, bodyEnglish, english,
    options: rotate(options, original.id + ":" + id), answer, ...feedback,
  });
  const order = (position: number): Step => {
    const [answer, cue] = entry.sentences[position];
    const words = answer.split(" ");
    let options = rotate(words, original.id + ":order-" + (position + 1));
    if (options.join(" ") === answer) options = [...words.slice(1), words[0]];
    return { id: "order-" + (position + 1), kind: "order_words", title: "Monte a frase",
      body: "Monte a frase em inglês.", bodyEnglish: "Build the sentence in English.", cue,
      options, answer, acceptedAnswers: orderVariants(answer), ...feedback };
  };
  const gapOptions = [gap.answer!, ...gap.options!.filter(option => option !== gap.answer).slice(0, 2)];
  const gapHint = gapHints[original.id] && gap.english?.match(/\s+\(([^)]+)\)$/);
  const gapExercise = choice("mc-2", "Complete a frase.", "Complete the sentence.", gapOptions, gap.answer!,
    gapHint ? gap.english!.slice(0, gapHint.index) : gap.english);
  if (gapHint) gapExercise.contextHint = { portuguese: gapHint[1], english: gapHints[original.id] };
  const exercises = [
    choice("mc-1", entry.intent[0], entry.intent[1], entry.sentences.map(s => s[0]), entry.sentences[0][0]),
    order(0),
    gapExercise,
    order(1),
    choice("mc-3", "Qual é a melhor resposta?", "Which is the best response?", entry.replies, entry.replies[0], entry.scene),
    order(2),
  ];
  const support = original.steps.filter(step => !["choice", "complete_sentence", "order_words", "summary", "hook", "discovery"].includes(step.kind)).map(step => {
    if (!gapHint || !step.contrasts) return step;
    return { ...step, contrasts: step.contrasts.map(item => ({ ...item,
      text: item.text.endsWith(gapHint[0]) ? item.text.slice(0, -gapHint[0].length) : item.text,
    })) };
  });
  if (entry.vocabulary) support.push({ kind: "vocabulary", title: "Vocabulário", body: entry.vocabulary });
  return { ...original, minutes: ["A1", "A2"].includes(original.level) ? 2 : ["B1", "B2"].includes(original.level) ? 3 : 4,
    exercises, support };
}
