import { MUSIC_MAX_CORRECT_POINTS, MUSIC_NORMALIZED_MAX_POINTS, MUSIC_TIMING_VERSION, musicTimingNormalizedPoints } from './music-score.ts';

export const MUSIC_POINTS_PER_HIT = 100;
export const musicDifficulties = ['level1', 'level2', 'level3', 'level4'] as const;
export const musicRecordLimits = { level1: 12, level2: 20, level3: 28, level4: 32, quick: 256, guided: 24, challenge: 24, typing: 24 } as const;
const storedDifficulties = ['guided', 'challenge', 'typing', 'quick', ...musicDifficulties] as const;
export type MusicDifficulty = typeof storedDifficulties[number];
export type MusicTimingRecord = { version: typeof MUSIC_TIMING_VERSION; points: number; rankPoints: number; completedRankPoints: number; perfect: boolean; legacyRankA: boolean; legacyPerfect: boolean };
export type MusicTimingAttempt = { points: number; totalRounds: number };
export type MusicRecord = { correct: number; streak: number; completedCorrect: number; speedScore?: MusicTimingRecord };
export type MusicPerformance = Record<MusicDifficulty, MusicRecord>;
export const musicRanks = [
  { name: 'E', points: 0 }, { name: 'D', points: 200 }, { name: 'C', points: 500 },
  { name: 'B', points: 1000 }, { name: 'A', points: 1600 }, { name: 'A+', points: 2100 }, { name: 'S', points: 2400 },
] as const;
export function musicRank(points: number) {
  let rank: typeof musicRanks[number] = musicRanks[0];
  for (const next of musicRanks) if (Number.isFinite(points) && points >= next.points) rank = next;
  return rank;
}
export function normalizeMusicPerformance(raw: unknown): MusicPerformance {
  const source = raw && typeof raw === 'object' ? raw as Partial<MusicPerformance> : {};
  return Object.fromEntries(storedDifficulties.map(mode => {
    const limit = musicRecordLimits[mode];
    const bounded = (n: unknown, fallback: number) => Number.isInteger(n) && Number(n) >= fallback && Number(n) <= limit ? Number(n) : fallback;
    const value = source[mode];
    const completedCorrect = bounded(value?.completedCorrect, -1);
    const correct = Math.max(bounded(value?.correct, 0), completedCorrect);
    const timing = value?.speedScore;
    const validNumber = (n: unknown, min: number, max: number) => Number.isInteger(n) && Number(n) >= min && Number(n) <= max;
    const speedScore: MusicTimingRecord | undefined = timing?.version === MUSIC_TIMING_VERSION
      && validNumber(timing.points, 0, limit * MUSIC_MAX_CORRECT_POINTS)
      && validNumber(timing.rankPoints, 0, MUSIC_NORMALIZED_MAX_POINTS)
      && validNumber(timing.completedRankPoints, -1, MUSIC_NORMALIZED_MAX_POINTS)
      ? { version: MUSIC_TIMING_VERSION, points: timing.points, rankPoints: Math.max(timing.rankPoints, timing.completedRankPoints), completedRankPoints: timing.completedRankPoints,
        perfect: timing.perfect === true && timing.completedRankPoints >= 2160, legacyRankA: timing.legacyRankA === true, legacyPerfect: timing.legacyPerfect === true }
      : undefined;
    return [mode, { correct, streak: Math.min(correct, bounded(value?.streak, 0)), completedCorrect, ...(speedScore ? { speedScore } : {}) }];
  })) as MusicPerformance;
}
export function mergeMusicPerformance(left: unknown, right: unknown): MusicPerformance {
  const a = normalizeMusicPerformance(left), b = normalizeMusicPerformance(right);
  return Object.fromEntries(storedDifficulties.map(mode => {
    const aa = a[mode], bb = b[mode];
    const timing = [aa.speedScore, bb.speedScore].filter((record): record is MusicTimingRecord => !!record);
    const legacy = [aa, bb].filter(record => !record.speedScore);
    const speedScore: MusicTimingRecord | undefined = timing.length ? {
      version: MUSIC_TIMING_VERSION,
      points: Math.max(...timing.map(record => record.points)),
      rankPoints: Math.max(...timing.map(record => record.rankPoints)),
      completedRankPoints: Math.max(...timing.map(record => record.completedRankPoints)),
      perfect: timing.some(record => record.perfect),
      legacyRankA: timing.some(record => record.legacyRankA) || legacy.some(record => record.completedCorrect / musicRecordLimits[mode] >= 16 / 24),
      legacyPerfect: timing.some(record => record.legacyPerfect) || legacy.some(record => record.completedCorrect === musicRecordLimits[mode]),
    } : undefined;
    return [mode, {
      correct: Math.max(aa.correct, bb.correct),
      streak: Math.max(aa.streak, bb.streak),
      completedCorrect: Math.max(aa.completedCorrect, bb.completedCorrect),
      ...(speedScore ? { speedScore } : {}),
    }];
  })) as MusicPerformance;
}
export function recordMusicPerformance(previous: unknown, mode: MusicDifficulty, correct: number, streak: number, finished: boolean, timing?: MusicTimingAttempt) {
  const limit = musicRecordLimits[mode];
  const validTiming = timing && Number.isInteger(timing.totalRounds) && timing.totalRounds > 0 && timing.totalRounds <= limit
    && Number.isInteger(timing.points) && timing.points >= 0 && timing.points <= timing.totalRounds * MUSIC_MAX_CORRECT_POINTS
    && Number.isInteger(correct) && correct >= 0 && correct <= timing.totalRounds;
  const rankPoints = validTiming ? musicTimingNormalizedPoints(timing.points, timing.totalRounds) : 0;
  const speedScore: MusicTimingRecord | undefined = validTiming ? {
    version: MUSIC_TIMING_VERSION, points: timing.points, rankPoints, completedRankPoints: finished ? rankPoints : -1,
    perfect: finished && correct === timing.totalRounds && rankPoints >= 2160, legacyRankA: false, legacyPerfect: false,
  } : undefined;
  return mergeMusicPerformance(previous, { [mode]: { correct, streak, completedCorrect: finished ? correct : -1, ...(speedScore ? { speedScore } : {}) } });
}
export const musicAchievements = [
  { id: 'first', title: 'Primeiro acorde', detail: 'Acerte sua primeira palavra.', icon: '♪' },
  { id: 'five', title: 'No ritmo', detail: 'Faça 5 acertos seguidos.', icon: '5' },
  { id: 'ten', title: 'Sem perder o compasso', detail: 'Faça 10 acertos seguidos.', icon: '10' },
  { id: 'finish', title: 'Até a última nota', detail: 'Termine uma partida.', icon: '✓' },
  { id: 'rank-a', title: 'Destaque do palco', detail: 'Termine com rank A ou superior.', icon: 'A' },
  { id: 'perfect', title: 'Performance perfeita', detail: 'Acerte todos os trechos de um nível e termine com S.', icon: 'S' },
  { id: 'level3', title: 'De ouvido', detail: 'Termine o nível 3 com pelo menos 24 acertos.', icon: '✦' },
] as const;
export function unlockedMusicAchievements(raw: unknown) {
  const performance = normalizeMusicPerformance(raw), records = Object.values(performance);
  const rules: Record<string, boolean> = {
    first: records.some(r => r.correct > 0), five: records.some(r => r.streak >= 5), ten: records.some(r => r.streak >= 10),
    finish: records.some(r => r.completedCorrect >= 0), 'rank-a': storedDifficulties.some(mode => {
      const record = performance[mode];
      return record.speedScore ? record.speedScore.legacyRankA || record.speedScore.completedRankPoints >= 1800 : record.completedCorrect / musicRecordLimits[mode] >= 16 / 24;
    }),
    perfect: storedDifficulties.some(mode => {
      const record = performance[mode];
      return record.speedScore ? record.speedScore.legacyPerfect || record.speedScore.perfect : record.completedCorrect === musicRecordLimits[mode];
    }), level3: performance.level3.completedCorrect >= 24 || performance.typing.completedCorrect >= 12,
  };
  return musicAchievements.filter(achievement => rules[achievement.id]);
}
