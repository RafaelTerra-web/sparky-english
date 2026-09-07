/** Shared display contract. Decisions must receive evidence loaded by the server. */
export const assessmentVersion = "sparky-advanced-beta-2026-09-v1";
export const certificateTitle = "Certificado interno de conclusão e desempenho — Sparky English";
export const certificateDisclaimer = "Certificado interno do Sparky English. Não é emitido nem acreditado por Cambridge, IELTS, ALTE ou Conselho da Europa. Não equivale a resultado oficial de exame.";
export const writingDimensions = ["task", "organisation", "vocabulary", "grammar", "register"] as const;
export const speakingDimensions = ["task", "intelligibility", "fluency", "coherence", "range", "accuracy", "interaction"] as const;
export type ProductiveSkill = "writing" | "speaking";
export type AdvancedLevel = "B2" | "C1" | "C2";
export type Rating = { scores: Record<string, number>; evidence: Record<string, string>; feedback: string; sufficientEvidence: boolean };
export type ProductiveResult =
  | { status: "unavailable" | "human-review"; reason: string }
  | { status: "scored"; scores: Record<string, number>; passed: boolean; feedback: string[] };
export const dimensionsFor = (skill: ProductiveSkill) => skill === "writing" ? writingDimensions : speakingDimensions;

/** Reject omissions, extra dimensions, fabricated scales and ungrounded ratings. */
export function validRating(value: unknown, skill: ProductiveSkill): value is Rating {
  if (!value || typeof value !== "object") return false;
  const rating = value as Rating;
  const dimensions = dimensionsFor(skill);
  return typeof rating.sufficientEvidence === "boolean" && typeof rating.feedback === "string" &&
    rating.feedback.length > 0 && rating.feedback.length <= 4000 && !!rating.scores && !!rating.evidence &&
    Object.keys(rating.scores).length === dimensions.length && Object.keys(rating.evidence).length === dimensions.length &&
    dimensions.every(dimension => Number.isInteger(rating.scores[dimension]) && rating.scores[dimension] >= 0 && rating.scores[dimension] <= 5 &&
      typeof rating.evidence[dimension] === "string" && rating.evidence[dimension].trim().length > 0 && rating.evidence[dimension].length <= 2000);
}

/** Each independent rater is judged before averaging, including borderline passes. */
export function reconcileRatings(first: unknown, second: unknown, skill: ProductiveSkill): ProductiveResult {
  if (!validRating(first, skill) || !validRating(second, skill)) return { status: "unavailable", reason: "invalid-or-missing-rating" };
  if (!first.sufficientEvidence || !second.sufficientEvidence) return { status: "human-review", reason: "insufficient-evidence" };
  const dimensions = dimensionsFor(skill);
  const passed = (rating: Rating) => dimensions.every(d => rating.scores[d] >= 3);
  if (passed(first) !== passed(second) || dimensions.some(d => Math.abs(first.scores[d] - second.scores[d]) > 1)) {
    return { status: "human-review", reason: "rater-disagreement" };
  }
  const scores = Object.fromEntries(dimensions.map(d => [d, (first.scores[d] + second.scores[d]) / 2]));
  return { status: "scored", scores, passed: passed(first) && passed(second), feedback: [first.feedback, second.feedback] };
}

export type CertificateEvidence = {
  level: AdvancedLevel;
  version: string;
  completedModuleIds: string[];
  requiredModuleIds: string[];
  reading: number | null;
  listening: number | null;
  writing: ProductiveResult | null;
  speaking: ProductiveResult | null;
  mediationComplete: boolean;
  reviewPending: boolean;
};

/** Equal weighting of reception and production; no skill can mask a failed floor. */
export function certificateEligibility(evidence: CertificateEvidence) {
  const reasons: string[] = [];
  if (evidence.version !== assessmentVersion) reasons.push("assessment-version");
  if (evidence.reviewPending) reasons.push("human-review");
  if (!evidence.requiredModuleIds.length || evidence.requiredModuleIds.some(id => !evidence.completedModuleIds.includes(id))) reasons.push("modules-incomplete");
  const percentage = (value: number | null) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
  for (const skill of ["reading", "listening"] as const) {
    if (!percentage(evidence[skill]) || evidence[skill]! < 60) reasons.push(`${skill}-minimum`);
  }
  const productivePercent = (skill: ProductiveSkill) => {
    const result = evidence[skill];
    if (result?.status !== "scored") { reasons.push(`${skill}-pending`); return null; }
    const dimensions = dimensionsFor(skill);
    const values = dimensions.map(d => result.scores[d]);
    if (Object.keys(result.scores).length !== dimensions.length || values.some(v => !Number.isFinite(v) || v < 0 || v > 5)) {
      reasons.push(`${skill}-invalid`); return null;
    }
    // Never trust a caller's passed flag without checking every dimension.
    if (!result.passed || values.some(v => v < 3)) reasons.push(`${skill}-minimum`);
    return values.reduce((a, b) => a + b, 0) / values.length * 20;
  };
  const writing = productivePercent("writing"), speaking = productivePercent("speaking");
  const global = percentage(evidence.reading) && percentage(evidence.listening) && writing !== null && speaking !== null
    ? (evidence.reading! + evidence.listening! + writing + speaking) / 4 : null;
  if (global === null || global < 70) reasons.push("global-minimum");
  if (!evidence.mediationComplete) reasons.push("mediation-incomplete");
  return { eligible: reasons.length === 0, reasons, global };
}
