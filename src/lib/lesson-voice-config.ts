import { voiceProfiles } from "./voice-config.ts";
import type { Level } from "./levels";

/** Prompt targets, not guaranteed measured words/minute or a CEFR scoring rule. */
export const lessonDelivery: Partial<Record<Level, string>> = {
  B1: "Speak at a flowing everyday pace, roughly 145–160 words per minute. Use short natural thought groups and common contractions, without classroom pauses between words. Keep important consonants and sentence stress clear.",
  B2: "Speak at a confident conversational pace, roughly 160–175 words per minute. Link words naturally, reduce unstressed function words and vary sentence stress with meaning. Do not over-enunciate or pause after every phrase.",
  C1: "Speak like an engaged native speaker talking to an adult peer, roughly 170–185 words per minute. Use connected speech, natural weak forms, expressive emphasis and short thought-group pauses. Preserve meaningful contrast and negation; never rush mechanically.",
  C2: "Speak with fluent, spontaneous native conversational delivery, roughly 175–195 words per minute. Use subtle pragmatic emphasis, connected speech and natural reductions, varying pace where the meaning calls for it. Preserve intelligibility; avoid exaggerated acting, artificial hesitations or a newsreader cadence.",
};

// Gemini returned PROHIBITED_CONTENT for this benign sentence with Pinky.
// Retain its existing Gemini 3.1 / Zephyr recording; do not bypass the filter.
export const preservedDelivery = {
  lessonId: "b1-argumentos-03", mascot: "pinky",
  text: "I enjoy outdoor activities such as hiking.",
  reason: "provider-content-filter", model: "gemini-3.1-flash-tts-preview",
} as const;

export function lessonSpeechDelivery(text: string, mascot: keyof typeof voiceProfiles, level: Level) {
  if (text === preservedDelivery.text && mascot === preservedDelivery.mascot) return undefined;
  if (level === "C2" && mascot === "sparky" && text === "A defensible conclusion must accommodate uncertainty without surrendering judgement.")
    return `${lessonDelivery.C2} This short line should take about four seconds. Keep the words tightly connected, with minimal pauses and no deliberate emphasis on each abstract noun.`;
  return lessonDelivery[level];
}

export function lessonVoiceIdentity(text: string, mascot: keyof typeof voiceProfiles, level: Level) {
  const profile = voiceProfiles[mascot];
  return { model: profile.model, text, voice: profile.voice, instructions: profile.instructions,
    ...(lessonSpeechDelivery(text, mascot, level) ? { delivery: lessonSpeechDelivery(text, mascot, level), version: 2 } : {}) };
}
