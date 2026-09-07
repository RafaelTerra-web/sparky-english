export const voiceProfiles = {
  sparky: { model: "gpt-4o-mini-tts-2025-12-15", voice: "cedar", instructions: "Speak as Sparky, a calm, friendly adult English tutor. Natural conversational American English, clear articulation and warm confidence. No cartoon pitch or exaggerated acting. Read exactly the input, without commentary." },
  // tts-1-hd does not support style instructions. Nova is fixed so Pinky stays consistent.
  pinky: { model: "tts-1-hd", voice: "nova" },
} as const;
