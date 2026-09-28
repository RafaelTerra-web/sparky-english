import { validateName, validateAge, onboardingLevels, namePronunciationVersion, pronunciationConfirmed, type LearnerProfile } from "./onboarding-shared.ts";

type Draft = Partial<LearnerProfile> & { step?: string };
export function quickOnboardingStage(draft: Draft | null | undefined): 0 | 1 | 2 {
  try {
    validateName(draft?.name);
    const age = validateAge(draft?.age);
    if (age.age < 13 && !draft?.guardianConsent) return 0;
  } catch { return 0; }
  if (draft?.step === "welcome" || draft?.step === "name" || draft?.step === "age") return 0;
  if (!["self-assessment", "placement"].includes(draft?.levelMethod ?? "") || !draft?.level || !onboardingLevels.includes(draft.level) || ["level", "test"].includes(draft.step ?? "")) return 1;
  return 2;
}
export function quickProfile(draft: Draft, input: { name?: unknown; age?: unknown; guardianConsent?: unknown }) {
  const valid = validateName(input.name);
  const age = validateAge(input.age);
  if (age.age < 13 && input.guardianConsent !== true) throw new Error("Um responsável precisa confirmar para continuar.");
  const sameName = valid.name === draft.name;
  return {
    ...valid, ...age, guardianConsent: input.guardianConsent === true,
    mascot: draft.mascot ?? "sparky", step: "level" as const,
    namePronunciation: sameName ? draft.namePronunciation ?? valid.name : valid.name,
    namePronunciationStatus: sameName && pronunciationConfirmed(draft) ? "confirmed" as const : "text-only" as const,
    namePronunciationVersion,
    namePronunciationRevision: sameName ? draft.namePronunciationRevision ?? 1 : (draft.namePronunciationRevision ?? 0) + 1,
  };
}
