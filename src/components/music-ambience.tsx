import { memo, useMemo, type CSSProperties } from 'react';
import type { MusicLine } from '@/lib/music';
import { musicWordFill } from '@/lib/music-visuals';
import { lyricRowIndexes, lyricWordOpacity } from '@/lib/music-ambience';
import { createMusicLyricPlan, musicLyricAnimationClock, type MusicLyricFocus, type MusicLyricRow } from '@/lib/music-runtime';
import type { MusicRound } from '@/lib/music-game';
import { useCurrentInterfaceLanguage, useSupportLanguage, localizeAttribute, t } from '@/lib/interface-language';

// One keyed lyric layer for listening and questions. A mask covers only the
// target; its original metrics stay in place, so answering never reflows text.
const noRounds: MusicRound[] = [];

export default memo(function MusicAmbience({ lines, index, clock, focus, rounds = noRounds, completed = 0 }: { lines: MusicLine[]; index: number; clock: number; focus?: MusicLyricFocus; rounds?: MusicRound[]; completed?: number }) {
  const supportLanguage = useSupportLanguage();
  const rows = useMemo(() => lyricRowIndexes(index, focus?.lineIndex), [index, focus?.lineIndex]);
  const plan = useMemo(() => createMusicLyricPlan(lines, rounds), [lines, rounds]);
  const prepared = useMemo(() => rows.map(lineIndex => plan(lineIndex, completed, focus, supportLanguage === 'pt-BR')), [rows, plan, completed, focus, supportLanguage]);
  return <div className="clip-ambient clip-unified-lyrics" data-visible={index >= 0 || !!focus} data-focus={!!focus} data-line={index} lang="en" aria-label={localizeAttribute('Letra sincronizada')}>
    {prepared.map((row, i) => <MusicAmbientRow key={row.line.id} row={row} clock={musicLyricAnimationClock(row, clock)} current={row.lineIndex === index} focused={row.lineIndex === focus?.lineIndex} position={(i - rows.length + 1) * 100} />)}
  </div>;
});

const MusicAmbientRow = memo(function MusicAmbientRow({ row, clock, current, focused, position }: { row: MusicLyricRow; clock: number; current: boolean; focused: boolean; position: number }) {
  const supportLanguage = useSupportLanguage();
  const interfaceLanguage = useCurrentInterfaceLanguage();
  const { line, hiddenTargets, plannedTargets, translation } = row;
  return <p data-lyric-id={line.id} data-current={current} data-question={focused} aria-hidden={!current && !focused} style={{ transform: `translateY(${position}%)` }}><span className="clip-lyric-row">{line.words.map((word, w) => {
    const masked = hiddenTargets.has(w);
    return <span key={w} className="clip-lyric-word" data-word={w} data-target={plannedTargets.has(w)} data-masked={masked} data-singing={clock >= word.start && clock < word.end} style={{ '--word-fill': `${musicWordFill(word.start, word.end, clock) * 100}%`, '--word-entrance': lyricWordOpacity(line.start, w, clock) } as CSSProperties}><span className="clip-word-body" aria-hidden={masked}>{word.text}</span>{masked && <span className="clip-word-mask" lang={interfaceLanguage} aria-label={localizeAttribute('palavra oculta')}>•••</span>}{w < line.words.length - 1 ? ' ' : ''}</span>;
  })}</span>{supportLanguage === 'pt-BR' && <small className="clip-phrase-translation" lang="pt-BR" data-hidden={hiddenTargets.size > 0} data-alignment={translation ? 'reviewed' : 'unavailable'} style={{ opacity: lyricWordOpacity(line.start, 0, clock) }}>{translation ? translation.map(part => part.masked ? <span key={part.start} className="clip-translation-mask" data-masked="true" lang={interfaceLanguage} aria-label={localizeAttribute('trecho traduzido oculto')}>•••</span> : part.text) : t('Tradução após a resposta')}</small>}</p>;
});
