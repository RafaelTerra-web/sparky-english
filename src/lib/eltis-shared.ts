export type EltisSkill = "listening" | "reading" | "vocabulary" | "grammar";
export type PublicEltisItem = {
  id: string;
  section: "Listening" | "Reading";
  skill: EltisSkill;
  prompt: string;
  options: string[];
  passage?: string;
  audioId?: string;
  maxPlays?: number;
};
export type EltisReport = {
  total: number;
  correct: number;
  percent: number;
  band: string;
  skills: Record<EltisSkill, { correct: number; total: number; percent: number }>;
  recommendations: string[];
  completedAt: string;
};

