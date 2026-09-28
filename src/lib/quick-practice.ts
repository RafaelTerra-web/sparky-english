import type { Level } from "./levels.ts";
import { contentVersion } from "./content/build.ts";

export type PracticeMode = "normal" | "challenge";
export type ChallengeState = { mode: PracticeMode; activeMs: number; failed: number; helped: number; expired: boolean };
/** Read only from input handlers and effects, never from render. */
export const activeClockNow = () => performance.now();
export const challengeLimit = (level: Level) => ["A1", "A2"].includes(level) ? 120000 : ["B1", "B2"].includes(level) ? 180000 : 240000;
export function challengeScore(passed: number, failed: number, helped: number, count = 6) {
  let score = 0;
  for (let i = 0; i < count; i++) if (passed & (1 << i)) score += ((failed | helped) & (1 << i)) ? 50 : 100;
  return score;
}
export type PersonalRecord = { score: number; activeMs: number; completedAt: string };
export function readPersonalRecord(userId: string, lessonId: string): PersonalRecord | null {
  try {
    const raw = JSON.parse(localStorage.getItem("sparky-record:" + userId + ":" + contentVersion + ":" + lessonId) || "null");
    return raw && Number.isSafeInteger(raw.score) && raw.score >= 0 && raw.score <= 600 && Number.isFinite(raw.activeMs) && raw.activeMs >= 0 && typeof raw.completedAt === "string" && Number.isFinite(Date.parse(raw.completedAt)) ? raw : null;
  } catch { return null; }
}
export function savePersonalRecord(userId: string, lessonId: string, record: PersonalRecord) {
  const key = "sparky-record:" + userId + ":" + contentVersion + ":" + lessonId;
  try {
    const old = readPersonalRecord(userId, lessonId);
    const best = !old || record.score > old.score || (record.score === old.score && record.activeMs < old.activeMs);
    if (best) localStorage.setItem(key, JSON.stringify(record));
    return { best, record: best ? record : old };
  } catch { return { best: false, record }; }
}

export type PracticeResult = { mode: PracticeMode; score: number; activeMs: number; recordEligible: boolean; sessionId: string };
