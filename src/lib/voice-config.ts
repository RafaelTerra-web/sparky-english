export const voiceProfiles = {
  sparky: {
    model: "gemini-3.1-flash-tts-preview",
    voice: "Achird",
    instructions: "Warm, calm adult English tutor with a friendly medium-low register. Natural American English, clear articulation and quiet confidence. No cartoon pitch, theatrical acting, music or commentary.",
  },
  pinky: {
    model: "gemini-3.1-flash-tts-preview",
    voice: "Zephyr",
    instructions: "Clear, warm adult English tutor with a curious medium-high register. Natural American English, lively but measured. No childish exaggeration, theatrical acting, music or commentary.",
  },
} as const;
