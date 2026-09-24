export const MUSIC_POINTS_PER_HIT = 100;
export const musicDifficulties = ['level1', 'level2', 'level3', 'level4'] as const;
export const musicRecordLimits = { level1: 12, level2: 20, level3: 28, level4: 32, quick: 256, guided: 24, challenge: 24, typing: 24 } as const;
const storedDifficulties = ['guided', 'challenge', 'typing', 'quick', ...musicDifficulties] as const;
export type MusicDifficulty = typeof storedDifficulties[number];
export type MusicRecord = { correct: number; streak: number; completedCorrect: number };
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
    return [mode, { correct, streak: Math.min(correct, bounded(value?.streak, 0)), completedCorrect }];
  })) as MusicPerformance;
}
export function mergeMusicPerformance(left: unknown, right: unknown): MusicPerformance {
  const a = normalizeMusicPerformance(left), b = normalizeMusicPerformance(right);
  return Object.fromEntries(storedDifficulties.map(mode => [mode, {
    correct: Math.max(a[mode].correct, b[mode].correct),
    streak: Math.max(a[mode].streak, b[mode].streak),
    completedCorrect: Math.max(a[mode].completedCorrect, b[mode].completedCorrect),
  }])) as MusicPerformance;
}
export function recordMusicPerformance(previous: unknown, mode: MusicDifficulty, correct: number, streak: number, finished: boolean) {
  return mergeMusicPerformance(previous, { [mode]: { correct, streak, completedCorrect: finished ? correct : -1 } });
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
    finish: records.some(r => r.completedCorrect >= 0), 'rank-a': storedDifficulties.some(mode => performance[mode].completedCorrect / musicRecordLimits[mode] >= 16 / 24),
    perfect: storedDifficulties.some(mode => performance[mode].completedCorrect === musicRecordLimits[mode]), level3: performance.level3.completedCorrect >= 24 || performance.typing.completedCorrect >= 12,
  };
  return musicAchievements.filter(achievement => rules[achievement.id]);
}
