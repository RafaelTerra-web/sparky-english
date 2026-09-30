// Timing records are separate from legacy accuracy-only scores.
export const MUSIC_TIMING_VERSION = 1 as const;
export const MUSIC_MIN_CORRECT_POINTS = 25;
export const MUSIC_MAX_CORRECT_POINTS = 100;
export const MUSIC_NORMALIZED_MAX_POINTS = 2400;
export const musicTimingRanks = [
  { name: 'D', points: 0 }, { name: 'C', points: 960 },
  { name: 'B', points: 1440 }, { name: 'A', points: 1800 }, { name: 'S', points: 2160 },
] as const;

/** The media window, rather than wall time, keeps playback speeds comparable. */
export function musicTimingPoints(time: number, opens: number, closes: number) {
  if (![time, opens, closes].every(Number.isFinite) || closes <= opens || time < opens || time >= closes) return 0;
  const remaining = (closes - time) / (closes - opens);
  return Math.round(MUSIC_MIN_CORRECT_POINTS + (MUSIC_MAX_CORRECT_POINTS - MUSIC_MIN_CORRECT_POINTS) * remaining);
}

export function musicTimingNormalizedPoints(points: number, totalRounds: number) {
  if (!Number.isFinite(points) || !Number.isInteger(totalRounds) || totalRounds <= 0) return 0;
  return Math.round(Math.max(0, Math.min(1, points / (totalRounds * MUSIC_MAX_CORRECT_POINTS))) * MUSIC_NORMALIZED_MAX_POINTS);
}

export function musicTimingRank(points: number, totalRounds: number) {
  return musicTimingRankFromNormalized(musicTimingNormalizedPoints(points, totalRounds));
}

export function musicTimingRankFromNormalized(points: number) {
  let rank: typeof musicTimingRanks[number] = musicTimingRanks[0];
  for (const next of musicTimingRanks) if (Number.isFinite(points) && points >= next.points) rank = next;
  return rank;
}

export function musicTimingProgress(points: number, totalRounds: number) {
  const normalized = musicTimingNormalizedPoints(points, totalRounds);
  const rank = musicTimingRankFromNormalized(normalized);
  const nextRank = musicTimingRanks.find(next => next.points > rank.points) ?? null;
  const maximum = Number.isInteger(totalRounds) && totalRounds > 0 ? totalRounds * MUSIC_MAX_CORRECT_POINTS : 0;
  return {
    rank,
    nextRank,
    progress: nextRank ? Math.max(0, Math.min(1, (normalized - rank.points) / (nextRank.points - rank.points))) : 1,
    pointsToNext: nextRank ? Math.max(0, Math.ceil(nextRank.points / MUSIC_NORMALIZED_MAX_POINTS * maximum - Math.max(0, Number.isFinite(points) ? points : 0))) : 0,
  };
}
