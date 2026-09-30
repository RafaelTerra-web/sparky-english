import { memo, type CSSProperties } from 'react';
import type { MusicLine } from '@/lib/music';
import { musicWordFill } from '@/lib/music-visuals';
import { lyricRowIndexes, lyricWordOpacity } from '@/lib/music-ambience';
import { musicTranslationParts } from '@/lib/music-translation';
import type { MusicRound } from '@/lib/music-game';
import { useCurrentInterfaceLanguage, useSupportLanguage, localizeAttribute, t } from '@/lib/interface-language';

// One keyed lyric layer for listening and questions. A mask covers only the
// target; its original metrics stay in place, so answering never reflows text.
export default memo(function MusicAmbience({ lines, index, clock, focus, rounds = [], completed = 0 }: { lines: MusicLine[]; index: number; clock: number; focus?: { lineIndex: number; targets: number[]; hidden: boolean }; rounds?: MusicRound[]; completed?: number }) {
  const supportLanguage = useSupportLanguage();
  const interfaceLanguage = useCurrentInterfaceLanguage();
  const rows = lyricRowIndexes(index, focus?.lineIndex);
  return <div className="clip-ambient clip-unified-lyrics" data-visible={index >= 0 || !!focus} data-focus={!!focus} data-line={index} lang="en" aria-label={localizeAttribute('Letra sincronizada')}>
    {rows.map((lineIndex, i) => {
      const line = lines[lineIndex], focused = lineIndex === focus?.lineIndex;
      const planned = rounds.filter(round => round.lineIndex === lineIndex);
      const hiddenTargets = [...new Set([
        ...planned.filter(round => round.index >= completed).flatMap(round => round.targets),
        ...(focused && focus?.hidden ? focus.targets : []),
      ])];
      const translation = musicTranslationParts(line, hiddenTargets);
      const hideTranslation = hiddenTargets.length > 0;
      return <p key={line.id} data-lyric-id={line.id} data-current={lineIndex === index} data-question={focused} aria-hidden={lineIndex !== index && !focused} style={{ transform: `translateY(${(i - rows.length + 1) * 100}%)` }}><span className="clip-lyric-row">{line.words.map((word, w) => {
        const masked = hiddenTargets.includes(w);
        return <span key={w} className="clip-lyric-word" data-word={w} data-target={planned.some(round => round.targets.includes(w))} data-masked={masked} data-singing={clock >= word.start && clock < word.end} style={{ '--word-fill': `${musicWordFill(word.start, word.end, clock) * 100}%`, '--word-entrance': lyricWordOpacity(line.start, w, clock) } as CSSProperties}><span className="clip-word-body" aria-hidden={masked}>{word.text}</span>{masked && <span className="clip-word-mask" lang={interfaceLanguage} aria-label={localizeAttribute('palavra oculta')}>•••</span>}{w < line.words.length - 1 ? ' ' : ''}</span>;
      })}</span>{supportLanguage === 'pt-BR' && <small className="clip-phrase-translation" lang="pt-BR" data-hidden={hideTranslation} data-alignment={translation ? 'reviewed' : 'unavailable'} style={{ opacity: lyricWordOpacity(line.start, 0, clock) }}>{translation ? translation.map(part => part.masked ? <span key={part.start} className="clip-translation-mask" data-masked="true" lang={interfaceLanguage} aria-label={localizeAttribute('trecho traduzido oculto')}>•••</span> : part.text) : t('Tradução após a resposta')}</small>}</p>;
    })}
  </div>;
});
