import "server-only";
import { onboardingSpeech } from "./gemini-voice";
import { placementBank } from "./placement-bank";
export const onboardingAssets: Record<string, string> = {
  'qa-name-ana': 'Ana',
  'qa-name-joao': 'João Pedro',
  'qa-name-jean': 'Jean-Luc',
  ...onboardingSpeech,
  ...Object.fromEntries(
    placementBank.filter((i) => i.transcript).map((i) => [i.id, i.transcript!]),
  ),
};
