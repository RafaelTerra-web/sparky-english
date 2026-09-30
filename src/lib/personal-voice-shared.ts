import { validateName } from "./onboarding-shared.ts";

export const personalVoiceOccasions = ["name", "confirmation", "welcome", "practice"] as const;
export type PersonalVoiceOccasion = typeof personalVoiceOccasions[number];
export function personalVoiceTemplate(occasion: PersonalVoiceOccasion) {
  if (occasion === "confirmation") return "Que bom conhecer você, {0}! Me conta: falei seu nome do jeito certo?";
  if (occasion === "welcome") return "{0}, que bom ter você por aqui! Vamos reservar um momento para o inglês? Escolha uma lição e venha comigo.";
  if (occasion === "practice") return "{0}, agora é a sua vez. Pense em uma situação do seu dia e tente contar em inglês. Pode começar com uma frase curta. Estou aqui para praticar com você!";
  return "{0}";
}
export function personalVoiceText(name: string, occasion: PersonalVoiceOccasion) {
  const safe = validateName(name).name;
  return personalVoiceTemplate(occasion).replace("{0}", safe);
}
