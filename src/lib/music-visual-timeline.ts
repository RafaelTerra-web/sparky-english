import { musicVisualData } from './music-visual-data.ts';

/** Independent from lyric/game versions: changing visual timing cannot change a score. */
export const MUSIC_VISUAL_VERSION = 1 as const;
export type MusicVisualSectionKind = 'intro' | 'verse' | 'build' | 'chorus' | 'narrative' | 'instrumental' | 'outro';
export type MusicVisualSection = Readonly<{
  start: number; end: number; kind: MusicVisualSectionKind; label: string; intensity: number;
}>;
export type MusicVisualBeat = Readonly<{ time: number; strength: number; accent: boolean }>;
export type MusicVisualCue = Readonly<{
  start: number; end: number; kind: string; concepts: readonly string[];
}>;
export type MusicVisualTimeline = Readonly<{
  version: typeof MUSIC_VISUAL_VERSION;
  audioSha256: string;
  duration: number;
  sections: readonly MusicVisualSection[];
  beats: readonly MusicVisualBeat[];
  cues: readonly MusicVisualCue[];
}>;

/** Find the final entry beginning at or before media time, including backwards seeks. */
function atOrBefore<T>(values: readonly T[], time: number, start: (value: T) => number) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (start(values[middle]) <= time) low = middle + 1;
    else high = middle;
  }
  return low - 1;
}

export function musicVisualTimeline(trackId: string): MusicVisualTimeline | null {
  return Object.hasOwn(musicVisualData, trackId) ? musicVisualData[trackId] : null;
}

export function musicTimelineSectionAt(trackId: string, mediaTime: number): MusicVisualSection | null {
  const track = musicVisualTimeline(trackId);
  if (!track || !Number.isFinite(mediaTime) || mediaTime < 0 || mediaTime >= track.duration) return null;
  const section = track.sections[atOrBefore(track.sections, mediaTime, entry => entry.start)];
  return section && mediaTime < section.end ? section : null;
}

/** A finite media-time impulse, never a BPM oscillator or an accumulated event queue. */
export function musicTimelineBeatAt(trackId: string, mediaTime: number): number {
  const track = musicVisualTimeline(trackId);
  if (!track || !Number.isFinite(mediaTime) || mediaTime < 0 || mediaTime >= track.duration) return 0;
  const index = atOrBefore(track.beats, mediaTime, entry => entry.time);
  let pulse = 0;
  // Taking the maximum preserves a stronger accent without adding flashes together.
  for (let cursor = index; cursor >= 0; cursor--) {
    const beat = track.beats[cursor];
    const age = mediaTime - beat.time;
    if (age >= .32) break;
    pulse = Math.max(pulse, beat.strength * (1 - age / .32) ** 2);
  }
  return Math.min(1, Math.max(0, pulse));
}

const normalizeConcept = (concept: string) => concept.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Vocabulary-linked art is withheld while its concept is an unanswered challenge. */
export function musicTimelineCueAt(trackId: string, mediaTime: number, hiddenConcepts: readonly string[] = []): string | null {
  const track = musicVisualTimeline(trackId);
  if (!track || !Number.isFinite(mediaTime) || mediaTime < 0 || mediaTime >= track.duration) return null;
  const hidden = new Set(hiddenConcepts.map(normalizeConcept));
  const index = atOrBefore(track.cues, mediaTime, entry => entry.start);
  // Cue collections are tiny and the upper bound avoids scanning future narrative events.
  for (let cursor = index; cursor >= 0; cursor--) {
    const cue = track.cues[cursor];
    if (mediaTime >= cue.end || cue.concepts.some(concept => hidden.has(normalizeConcept(concept)))) continue;
    return cue.kind;
  }
  return null;
}
