export const levels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof levels)[number];
export const levelDescriptions: Record<Level, string> = {
  A1: "Fundamentos", A2: "Situações cotidianas", B1: "Ideias e autonomia",
  B2: "Argumentação e interação", C1: "Precisão e síntese", C2: "Nuance e domínio discursivo",
};
