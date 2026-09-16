import type { MusicLine } from './music';

/** Follow corrected media time, including backward seeks. Never show future
 * lyrics: they could reveal answers. Hold the last line in instrumental gaps. */
export function ambientLyricIndex(lines: Pick<MusicLine, 'start'>[], clock: number) {
  if (!Number.isFinite(clock)) return -1;
  let index = -1;
  for (let i = 0; i < lines.length && lines[i].start <= clock; i++) index = i;
  return index;
}

/** Keep a pending question in the preceding row while the live lyric advances. */
export function lyricRowIndexes(index: number, focusedIndex?: number) {
  if (index < 0) return [];
  const previous = focusedIndex !== undefined && focusedIndex >= 0 && focusedIndex < index ? focusedIndex : index - 1;
  return previous >= 0 ? [previous, index] : [index];
}
