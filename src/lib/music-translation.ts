import type { MusicLine, MusicTranslationSpan } from './music';

const graphemes = new Intl.Segmenter('pt-BR', { granularity: 'grapheme' });

/** Structural validation cannot prove semantic equivalence; that comes from reviewed alignment. */
export function validMusicTranslationSpans(translation: string, spans: unknown): spans is MusicTranslationSpan[] {
  if (!Array.isArray(spans) || !spans.length) return false;
  const boundaries = new Set([0, translation.length, ...Array.from(graphemes.segment(translation), part => part.index)]);
  return spans.every(span => span && typeof span === 'object' && Number.isSafeInteger(span.start) && Number.isSafeInteger(span.end)
    && span.start >= 0 && span.start < span.end && span.end <= translation.length
    && boundaries.has(span.start) && boundaries.has(span.end) && translation.slice(span.start, span.end).trim().length > 0);
}

export type MusicTranslationPart = { start: number; end: number } & ({ masked: true } | { masked: false; text: string });

/** Union all unresolved equivalents. Masked parts contain no answer text to accidentally render. */
export function musicTranslationParts(line: Pick<MusicLine, 'translation' | 'words'>, hiddenTargets: readonly number[]): MusicTranslationPart[] | null {
  const spans: MusicTranslationSpan[] = [];
  for (const index of new Set(hiddenTargets)) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= line.words.length) return null;
    const wordSpans = line.words[index].translationSpans;
    if (!validMusicTranslationSpans(line.translation, wordSpans)) return null;
    spans.push(...wordSpans);
  }
  if (!spans.length) return [{ start: 0, end: line.translation.length, masked: false, text: line.translation }];
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: MusicTranslationSpan[] = [];
  for (const span of spans) {
    const previous = merged.at(-1);
    if (previous && span.start <= previous.end) previous.end = Math.max(previous.end, span.end);
    else merged.push({ ...span });
  }
  const parts: MusicTranslationPart[] = [];
  let position = 0;
  for (const span of merged) {
    if (position < span.start) parts.push({ start: position, end: span.start, masked: false, text: line.translation.slice(position, span.start) });
    parts.push({ ...span, masked: true });
    position = span.end;
  }
  if (position < line.translation.length) parts.push({ start: position, end: line.translation.length, masked: false, text: line.translation.slice(position) });
  return parts;
}
