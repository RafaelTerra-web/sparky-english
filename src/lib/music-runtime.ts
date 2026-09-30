import type { MusicLesson, MusicLine } from './music';
import { buildMusicRounds, LYRIC_PREVIEW_SECONDS, type GameDifficulty, type GameState, type MusicRound } from './music-game.ts';
import { musicTranslationParts, type MusicTranslationPart } from './music-translation.ts';
import { musifyIdentity, type MusifyEffect } from './musify-identity.ts';

/** Counts are independent of seeded scores: scheduling always maximizes count first. */
export function createMusicRoundCache(lesson: MusicLesson) {
  const initial = new Map<GameDifficulty, MusicRound[]>();
  let currentSeed = 1;
  let current = initial;
  return (difficulty: GameDifficulty, seed = 1) => {
    if (seed !== 1 && seed !== currentSeed) { currentSeed = seed; current = new Map(); }
    const cache = seed === 1 ? initial : current;
    let rounds = cache.get(difficulty);
    if (!rounds) { rounds = buildMusicRounds(lesson, difficulty, seed); cache.set(difficulty, rounds); }
    return rounds;
  };
}

export type MusicLyricFocus = { lineIndex: number; targets: number[]; hidden: boolean };
export type MusicLyricRow = {
  line: MusicLine; lineIndex: number; hiddenTargets: ReadonlySet<number>; plannedTargets: ReadonlySet<number>;
  translation: MusicTranslationPart[] | null; animationStart: number; animationEnd: number;
};

/** Index once per schedule, then parse only a visible row whose answer mask changed. */
export function createMusicLyricPlan(lines: MusicLine[], rounds: MusicRound[]) {
  const byLine = new Map<number, MusicRound[]>();
  const cached = new Map<number, { key: string; row: MusicLyricRow }>();
  for (const round of rounds) {
    const planned = byLine.get(round.lineIndex) ?? [];
    planned.push(round); byLine.set(round.lineIndex, planned);
  }
  return (lineIndex: number, completed: number, focus?: MusicLyricFocus, translationEnabled = true): MusicLyricRow => {
    const line = lines[lineIndex];
    const planned = byLine.get(lineIndex) ?? [];
    const hiddenTargets = new Set(planned.filter(round => round.index >= completed).flatMap(round => round.targets));
    if (focus?.lineIndex === lineIndex && focus.hidden) for (const target of focus.targets) hiddenTargets.add(target);
    const key = `${translationEnabled}:${[...hiddenTargets].sort((left, right) => left - right).join(':')}`;
    const previous = cached.get(lineIndex);
    if (previous?.key === key) return previous.row;
    const row = {
      line, lineIndex, hiddenTargets, plannedTargets: new Set(planned.flatMap(round => round.targets)),
      translation: translationEnabled ? musicTranslationParts(line, [...hiddenTargets]) : null,
      animationStart: Math.min(line.start - LYRIC_PREVIEW_SECONDS, ...line.words.map(word => word.start)),
      animationEnd: Math.max(line.start - LYRIC_PREVIEW_SECONDS + .35 + .45, ...line.words.map(word => word.end)),
    };
    cached.set(lineIndex, { key, row });
    return row;
  };
}

/** Once a row's entrance and word fills finish, its React props stop changing. */
export function musicLyricAnimationClock(row: MusicLyricRow, clock: number) {
  return Math.max(row.animationStart, Math.min(row.animationEnd, clock));
}

/** Avoid reducer dispatches that cannot change state, while retaining seek catch-up. */
export function musicGameTickDue(state: Pick<GameState, 'phase' | 'index'>, time: number, deadlines: number[], finishAt: number) {
  return state.phase === 'round' ? time >= deadlines[state.index] : state.phase === 'outro' && time >= finishAt;
}

export const MUSIC_VIDEO_DRIFT_SECONDS = .45;
export const MUSIC_VIDEO_SEEK_COOLDOWN_MS = 1200;
export function musicVideoNeedsSeek(clock: number, videoTime: number, now: number, lastSeek: number, force = false) {
  if (!Number.isFinite(clock) || !Number.isFinite(videoTime)) return false;
  const drift = Math.abs(videoTime - Math.max(0, clock));
  return force ? drift > .02 : drift > MUSIC_VIDEO_DRIFT_SECONDS && now - lastSeek >= MUSIC_VIDEO_SEEK_COOLDOWN_MS;
}

/** Lyric normalization scans once; frames only compare the heard media time. */
export function createMusifyEffectLookup(id: string, lines: Pick<MusicLine, 'words'>[]) {
  const identity = musifyIdentity(id);
  const windows = identity?.effect === 'butterflies' ? lines.flatMap(line => line.words
    .filter(word => word.text.toLowerCase().replace(/[^a-z]/g, '') === 'butterflies')
    .map(word => ({ start: word.start, end: word.end + 7 }))) : [];
  return (clock: number): MusifyEffect | null => {
    if (!identity || !Number.isFinite(clock) || clock < 0) return null;
    return identity.effect !== 'butterflies' || windows.some(window => clock >= window.start && clock < window.end) ? identity.effect : null;
  };
}
