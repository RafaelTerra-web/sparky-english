import type { MusicLine } from './music';

/** Follow corrected media time, including backward seeks. Never show future
 * lyrics: they could reveal answers. Hold the last line in instrumental gaps. */
export function ambientLyricIndex(lines: Pick<MusicLine, 'start'>[], clock: number) {
  if (!Number.isFinite(clock)) return -1;
  let index = -1;
  for (let i = 0; i < lines.length && lines[i].start <= clock; i++) index = i;
  return index;
}
