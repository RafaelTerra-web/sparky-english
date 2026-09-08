import type { MascotVoice } from "./speech";
import manifest from "./content/voice-manifest.json";
export type VoiceAsset = { text: string; sparky?: string; pinky?: string };
export function lessonAudio(lessonId: string, text: string, mascot: MascotVoice): string | null {
  const item = (manifest as Record<string, VoiceAsset>)[lessonId];
  if (!item || item.text !== text) return null;
  const url = item[mascot];
  return url && /^\/audio\/mascots\/[a-f0-9]{32}\.wav$/.test(url) ? url : null;
}
