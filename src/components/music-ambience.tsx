import { memo, type CSSProperties } from 'react';
import type { MusicLine } from '@/lib/music';
import { musicWordFill } from '@/lib/music-visuals';
import { lyricRowIndexes } from '@/lib/music-ambience';

// One keyed lyric layer for listening and questions. A mask covers only the
// target; its original metrics stay in place, so answering never reflows text.
export default memo(function MusicAmbience({ lines, index, clock, focus }: { lines: MusicLine[]; index: number; clock: number; focus?: { lineIndex: number; target: number; hidden: boolean } }) {
  const rows = lyricRowIndexes(index, focus?.lineIndex);
  return <div className="clip-ambient clip-unified-lyrics" data-visible={index >= 0} data-focus={!!focus?.hidden} data-line={index} lang="en" aria-label="Letra sincronizada">
    {rows.map((lineIndex, i) => {
      const line = lines[lineIndex], focused = lineIndex === focus?.lineIndex && focus.hidden;
      return <p key={line.id} data-lyric-id={line.id} data-current={lineIndex === index} data-question={focused} aria-hidden={lineIndex !== index && !focused} style={{ transform: `translateY(${(i - rows.length + 1) * 100}%)` }}><span className="clip-lyric-row">{line.words.map((word, w) => {
        const masked = focused && w === focus.target;
        return <span key={w} className="clip-lyric-word" data-word={w} data-masked={masked} data-singing={clock >= word.start && clock < word.end} style={{ '--word-fill': `${musicWordFill(word.start, word.end, clock) * 100}%` } as CSSProperties}><span className="clip-word-body" aria-hidden={masked}>{word.text}</span>{masked && <span className="clip-word-mask" aria-label="palavra oculta">•••</span>}{w < line.words.length - 1 ? ' ' : ''}</span>;
      })}</span></p>;
    })}
  </div>;
});
