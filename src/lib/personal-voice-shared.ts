import { validateName } from "./onboarding-shared.ts";

export const personalVoiceOccasions = ["name", "confirmation", "welcome", "practice"] as const;
export type PersonalVoiceOccasion = typeof personalVoiceOccasions[number];
export function personalVoiceText(name: string, occasion: PersonalVoiceOccasion) {
  const safe = validateName(name).name;
  if (occasion === "confirmation") return `Que bom conhecer você, ${safe}! Me conta: falei seu nome do jeito certo?`;
  if (occasion === "welcome") return `${safe}, que bom ter você por aqui! Vamos reservar um momento para o inglês? Escolha uma lição e venha comigo.`;
  if (occasion === "practice") return `${safe}, agora é a sua vez. Pense em uma situação do seu dia e tente contar em inglês. Pode começar com uma frase curta. Estou aqui para praticar com você!`;
  return safe;
}
