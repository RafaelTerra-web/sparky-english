import { memo, type CSSProperties } from 'react';
import type { MusicLine } from '@/lib/music';
import { musicWordFill } from '@/lib/music-visuals';

// Decorative transcript; accessible full lyrics remain in the Letra tab.
// Stable keyed rows move inside a clipped stage, never by scrolling the page.
export default memo(function MusicAmbience({ lines, index, visible, clock }: { lines: MusicLine[]; index: number; visible: boolean; clock: number }) {
  return <div className="clip-ambient" aria-hidden="true" data-visible={visible && index >= 0} data-line={index} lang="en">
    {lines.slice(Math.max(0, index - 2), index + 1).map((line, i, recent) =>
      <p key={line.id} data-current={i === recent.length - 1} style={{ transform: `translateY(${(i - recent.length + 1) * 100}%)` }}><span className="clip-lyric-row">{line.words.map((word, w) => <span key={w} className="clip-lyric-word" data-singing={clock >= word.start && clock < word.end} style={{ '--word-fill': `${musicWordFill(word.start, word.end, clock) * 100}%` } as CSSProperties}>{word.text}{w < line.words.length - 1 ? ' ' : ''}</span>)}</span></p>,
    )}
  </div>;
});
