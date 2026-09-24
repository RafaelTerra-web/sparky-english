import type { MusicLine } from './music';
import { LYRIC_PREVIEW_SECONDS } from './music-game.ts';

/** Media-clock fade: pauses freeze it and seeking reproduces the same frame. */
export function lyricWordOpacity(start: number, wordIndex: number, clock: number) {
  const elapsed = clock - (start - LYRIC_PREVIEW_SECONDS) - Math.min(wordIndex * .045, .35);
  const amount = Math.max(0, Math.min(1, elapsed / .45));
  return amount * amount * (3 - 2 * amount);
}

/** Follow corrected media time, including backward seeks. Instrumental gaps
 * intentionally clear the lyric instead of repeating the previous phrase. */
export function ambientLyricIndex(lines: Pick<MusicLine, 'start' | 'end'>[], clock: number) {
  if (!Number.isFinite(clock)) return -1;
  let index = -1;
  for (let i = 0; i < lines.length && lines[i].start <= clock; i++) index = i;
  return index >= 0 && clock <= lines[index].end + 1.2 ? index : -1;
}

/** Keep a pending question in the preceding row while the live lyric advances. */
export function lyricRowIndexes(index: number, focusedIndex?: number) {
  if (index < 0) return [];
  const previous = focusedIndex !== undefined && focusedIndex >= 0 && focusedIndex < index ? focusedIndex : index - 1;
  return previous >= 0 ? [previous, index] : [index];
}
