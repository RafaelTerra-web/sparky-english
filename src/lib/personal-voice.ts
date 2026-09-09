import { createHash } from "node:crypto";
import { namePronunciationVersion, validateName, type LearnerProfile } from "./onboarding-shared.ts";
import { personalVoiceText, type PersonalVoiceOccasion } from "./personal-voice-shared.ts";
export { personalVoiceOccasions, type PersonalVoiceOccasion } from "./personal-voice-shared.ts";
export function personalVoiceIdentity(profile: Partial<LearnerProfile>, occasion: PersonalVoiceOccasion = "name") {
  const name = validateName(profile.name).name;
  const pronunciation = validateName(profile.namePronunciation || name).name;
  const revision = profile.namePronunciationRevision ?? 0;
  const hash = createHash("sha256").update(JSON.stringify({ model: "gemini-3.1-flash-tts-preview", voice: "Achird", version: namePronunciationVersion, revision, locale: "pt-BR", name, pronunciation, occasion })).digest("hex");
  return { name, pronunciation, hash, text: personalVoiceText(name, occasion) };
}
