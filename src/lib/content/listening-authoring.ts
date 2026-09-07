import type { LessonDraft } from "./types";
import type { ListeningConversation, ListeningQuestion } from "../listening-types";

export type AuthoredQuestion = [question: string, answer: string, distractor: string, distractor: string, explanation: string];
export const listeningQuestion = ([question, answer, distractor1, distractor2, explanation]: AuthoredQuestion): ListeningQuestion => ({ question, choices: [answer, distractor1, distractor2], explanation });
export function conversation(data: Omit<ListeningConversation, "turns" | "gist" | "detail" | "inference"> & {
  turns: [speaker: "sparky" | "pinky", text: string, translation: string][];
  gist: AuthoredQuestion; detail: AuthoredQuestion; inference: AuthoredQuestion;
}): ListeningConversation {
  return { ...data, turns: data.turns.map(([speaker, text, translation]) => ({ speaker, text, translation })),
    gist: listeningQuestion(data.gist), detail: listeningQuestion(data.detail), inference: listeningQuestion(data.inference) };
}
export function listeningLesson(data: Omit<LessonDraft, "dialogue" | "dialogueTranslation" | "question" | "choices" | "explanation"> & { listening: ListeningConversation }): LessonDraft {
  return { ...data, dialogue: data.listening.turns.map(turn => `${turn.speaker === "sparky" ? "Sparky" : "Pinky"}: ${turn.text}`).join("\n"),
    dialogueTranslation: data.listening.turns.map(turn => `${turn.speaker === "sparky" ? "Sparky" : "Pinky"}: ${turn.translation}`).join("\n"),
    question: data.listening.gist.question, choices: data.listening.gist.choices, explanation: data.listening.gist.explanation };
}
export const b2ListeningDirection = "Natural clear conversational English, 135–150 words per minute. Brief purposeful pauses; no music, background noise or simultaneous speech. Sparky/Achird is warm and confident; Pinky/Zephyr is curious and clear. Both are young adults, never caricatures. Read the scripted words exactly, without directions or speaker labels.";
