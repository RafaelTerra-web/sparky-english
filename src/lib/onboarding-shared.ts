export const onboardingLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type LearnerLevel = (typeof onboardingLevels)[number];
export const onboardingSteps = [
  "welcome",
  "name",
  "age",
  "pronunciation",
  "mascot",
  "level",
  "test",
  "finish",
] as const;
export type OnboardingStep = (typeof onboardingSteps)[number];
export type LearnerProfile = {
  name: string;
  normalizedName: string;
  age: number;
  ageBand: string;
  mascot: "sparky" | "pinky";
  level: LearnerLevel;
  levelMethod: "self-assessment" | "placement";
  score: number | null;
  confidence: string | null;
  onboardingCompleted: boolean;
  guardianConsent: boolean;
  namePronunciation?: string;
  namePronunciationStatus?: "confirmed" | "text-only";
  namePronunciationVersion?: number;
  namePronunciationRevision?: number;
};
export const namePronunciationVersion = 2;
export function pronunciationConfirmed(profile: Partial<LearnerProfile> | null | undefined) {
  return profile?.namePronunciationStatus === "confirmed" && profile.namePronunciationVersion === namePronunciationVersion;
}
export function validateName(input: unknown) {
  if (
    typeof input !== "string" ||
    input.length > 200 ||
    /[\p{Cc}\p{Cf}]/u.test(input)
  )
    throw new Error("Use um nome válido, sem números ou símbolos.");
  const name = input.normalize("NFKC").trim().replace(/ +/g, " ");
  const count = [
    ...new Intl.Segmenter("pt", { granularity: "grapheme" }).segment(name),
  ].length;
  if (
    count < 1 ||
    count > 50 ||
    !/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(name)
  )
    throw new Error(
      "Use até 50 letras; acentos, espaços, hífen e apóstrofo são aceitos.",
    );
  const normalizedName = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  const prohibited = new Set([
    "fuck",
    "fucker",
    "shit",
    "bitch",
    "nigger",
    "nigga",
    "cunt",
    "porra",
    "caralho",
    "merda",
    "puta",
    "puto",
    "buceta",
    "cu",
    "viado",
    "nazista",
    "hitler",
  ]);
  if (normalizedName.split(/[ '\u2019-]/).some((part) => prohibited.has(part)))
    throw new Error("Escolha outro nome ou apelido para estudar.");
  return { name, normalizedName };
}
export function validateAge(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 4 ||
    value > 120
  )
    throw new Error("Informe uma idade inteira entre 4 e 120 anos.");
  return {
    age: value,
    ageBand: value < 13 ? "child" : value < 18 ? "teen" : "adult",
  };
}
