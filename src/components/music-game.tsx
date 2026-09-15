"use client";

import { useEffect, useMemo, useReducer, useRef, useState, type RefObject, type CSSProperties } from 'react';
import MusicScene from './music-scene';
import { ArrowRight, Check, Headphones, Pause, Play, RotateCcw, Zap } from 'lucide-react';
import type { MusicLesson } from '@/lib/music';
import { buildMusicRounds, initialGame, musicGameReducer, type GameDifficulty } from '@/lib/music-game';
import { createMusicFeedback } from '@/lib/music-feedback';
import { ambientLyricIndex } from '@/lib/music-ambience';
import MusicAmbience from './music-ambience';
import { musicEnergy } from '@/lib/music-energy';
import { musicIntroCountdown, musicEnergyAt, musicSectionAt, musicVisualMoment } from '@/lib/music-visuals';
import { t } from '@/lib/interface-language';

type Props = { lesson: MusicLesson; media: RefObject<HTMLAudioElement | null>; clock: number; playing: boolean; speed: number; onSpeed: (speed: number) => void; onSeek: (time: number) => void; onPlay: () => void; onPause: () => void; onExplore: (line: number, word?: string) => void };
const levels = [
  { id: 'guided', title: 'Guiado', hint: '2 alternativas · uma palavra por trecho', bars: 1 },
  { id: 'challenge', title: 'Desafio', hint: '4 alternativas · atenção aos sons', bars: 2 },
  { id: 'typing', title: 'Sem pistas', hint: 'Digite a palavra que você ouviu', bars: 3 },
] as const;

export default function MusicGame({ lesson, media, clock, playing, speed, onSpeed, onSeek, onPlay, onPause, onExplore }: Props) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>('challenge');
  const [seed, setSeed] = useState(1);
  const [state, dispatch] = useReducer(musicGameReducer, initialGame);
  const [draft, setDraft] = useState({ index: -1, value: '' });
  const [errorFlash, setErrorFlash] = useState<number | null>(null);
  const submitted = useRef<number | null>(null);
  const game = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const sound = useRef<ReturnType<typeof createMusicFeedback> | null>(null);
  const typed = draft.index === state.index ? draft.value : '';
  const rounds = useMemo(() => buildMusicRounds(lesson, difficulty, seed), [lesson, difficulty, seed]);
  const round = rounds[state.index];
  const heard = state.phase === 'round' && clock >= round.opens && clock < round.closes;
  const showingError = errorFlash === state.index;
  const revealed = state.phase === 'round' && clock >= round.revealAt;
  const countdown = musicIntroCountdown(clock, state.phase === 'round' && state.index === 0 && !state.answered);
  const counting = countdown > 0;
  const answersVisible = revealed && (!state.answered || showingError);
  const remaining = Math.max(0, round.closes - clock) / speed;
  const windowProgress = Math.max(0, Math.min(1, (round.closes - clock) / (round.closes - round.opens)));
  const deadlines = useMemo(() => rounds.map(r => r.closes), [rounds]);
  const pauseRef = useRef(onPause);
  useEffect(() => { pauseRef.current = onPause; }, [onPause]);
  useEffect(() => () => pauseRef.current(), []);
  useEffect(() => () => sound.current?.dispose(), []);
  useEffect(() => {
    if (errorFlash === null) return;
    const timer = setTimeout(() => setErrorFlash(null), 420);
    return () => clearTimeout(timer);
  }, [errorFlash]);
  // The corrected media clock received from the session is the only game clock.
  useEffect(() => {
    if (state.phase !== 'round' && state.phase !== 'outro') return;
    const ended = media.current?.ended || (media.current?.currentTime ?? 0) >= lesson.duration - .02;
    dispatch({ type: 'tick', time: ended ? lesson.duration : Math.min(clock, lesson.duration - .021), deadlines, finishAt: lesson.duration });
  }, [state.phase, clock, deadlines, lesson.duration, media]);
  function start() { sound.current ??= createMusicFeedback(); sound.current.prepare(); setSeed(crypto.getRandomValues(new Uint32Array(1))[0]); submitted.current = null; setErrorFlash(null); onSeek(0); dispatch({ type: 'start' }); setDraft({ index: -1, value: '' }); onPlay(); }
  function answer(value: string, source?: HTMLElement | null) {
    const audio = media.current;
    if (!audio || audio.paused || submitted.current === state.index) return;
    const scroller = game.current?.closest<HTMLElement>('.listen-content');
    const scrollTop = scroller?.scrollTop ?? 0;
    const pageTop = window.scrollY;
    const keyboard = source?.matches(':focus-visible') ?? false;
    source?.blur();
    const action = { type: 'answer' as const, index: state.index, value, expected: round.answer, time: clock, opens: round.opens, closes: round.closes };
    const next = musicGameReducer(state, action);
    if (next === state) return;
    // Lock this occurrence only; the same word in a later round is independent.
    submitted.current = state.index;
    dispatch(action);
    requestAnimationFrame(() => {
      if (scroller) scroller.scrollTop = scrollTop;
      if (window.scrollY !== pageTop) window.scrollTo({ top: pageTop, behavior: 'auto' });
      if (keyboard) status.current?.focus({ preventScroll: true });
    });
    if (!next.solved) {
      setErrorFlash(state.index);
      sound.current ??= createMusicFeedback();
      sound.current.scratch(audio.muted ? 0 : audio.volume);
    }
  }
  const completed = state.outcomes.length;
  const ambientIndex = ambientLyricIndex(lesson.lines, clock);
  const ambientWaiting = !revealed || state.answered;
  const energy = musicEnergyAt(musicEnergy[lesson.id], clock);
  const section = musicSectionAt(lesson.id, clock);
  const moment = musicVisualMoment(lesson.lines, ambientIndex, clock, energy);
  const tone = lesson.id === 'heartless-local' ? 'violet' : 'emerald';
  return <section className="clip-game" aria-label="Jogo de escuta" data-session-seed={seed} data-phase={state.phase} data-playing={playing} data-difficulty={difficulty} data-tone={tone} data-section={section.kind} data-moment={moment} style={{ '--music-energy': energy } as CSSProperties}>
    <div className="clip-scorebar"><span><Headphones size={15} /> {state.phase === 'ready' ? 'ESCUTA ATIVA' : `${state.correct} / ${rounds.length} ACERTOS`}</span><span><Zap size={15} /> {state.streak} seguidas</span></div>
    <div className="clip-speed-control" role="group" aria-label="Velocidade do jogo"><span>Velocidade</span>{[1, .75, .5].map(value => <button key={value} aria-pressed={speed === value} onClick={() => onSpeed(value)}>{value === 1 ? '1×' : value === .75 ? '0,75×' : '0,5×'}</button>)}</div>
    <div className={'clip-media ' + (playing ? 'is-playing' : '')}>
      <MusicScene playing={playing} clock={clock} tone={tone} energy={energy} chorus={section.kind === 'chorus'} />
      <div className="clip-media-top"><span>SPARKY SESSIONS</span><span>NO SEU RITMO</span></div>
      <div className="clip-album-title" aria-hidden="true">{lesson.title}<span>{lesson.artist}</span></div>
      <div className="clip-wave" aria-hidden="true">{Array.from({ length: 35 }, (_, i) => <i key={i} style={{ height: `${10 + ((i * 17 + 7) % 34)}px`, animationDelay: `${i * -.09}s` }} />)}</div>
      <div className="clip-media-bottom"><span>{playing ? 'REPRODUZINDO' : 'PRONTO PARA O PLAY'}</span><span>{lesson.level} · {Math.floor(lesson.duration / 60)}:{String(Math.floor(lesson.duration % 60)).padStart(2, '0')} · música completa</span></div>
      <div className="clip-track-progress" aria-hidden="true"><i style={{ transform: `scaleX(${Math.max(0, Math.min(1, clock / lesson.duration))})` }} /></div>
    </div>
    {state.phase === 'ready' ? <div className="clip-setup">
      <span className="clip-eyebrow">ESCOLHA SEU RITMO</span><h2>Entre no ritmo com Sparky.</h2><p>Novas palavras a cada partida.<br />Ouça e responda: 3 segundos por palavra em 1×.</p>
      <div className="clip-levels" role="group" aria-label="Dificuldade">{levels.map(level => <button key={level.id} aria-pressed={difficulty === level.id} onClick={() => setDifficulty(level.id)}><span className="clip-bars" aria-hidden="true">{[1,2,3].map(n => <i key={n} className={n <= level.bars ? 'filled' : ''} />)}</span><span><strong>{level.title}</strong><small>{level.hint}</small></span>{difficulty === level.id ? <Check size={18} /> : <span className="clip-radio" />}</button>)}</div>
      <button className="clip-primary" onClick={start}>Começar a jogar <Play size={18} fill="currentColor" /></button><p className="clip-fine">{rounds.length} palavras · música contínua · áudio suave</p>
    </div> : state.phase === 'result' ? <div className="clip-result" aria-live="polite">
      <div className="clip-result-icon"><Check size={30} /></div><span className="clip-eyebrow">MÚSICA CONCLUÍDA</span><h2>Deu ouvido ao inglês.</h2><p>Agora leve uma dessas frases para a sua voz.</p>
      <div className="clip-results"><div><strong>{state.correct}/{rounds.length}</strong><span>acertos</span></div><div><strong>{state.bestStreak}</strong><span>melhor sequência</span></div><div><strong>{state.missed}</strong><span>para revisar</span></div></div>
      {state.missed > 0 && <div className="clip-review"><h3>Vamos ouvir essas de novo?</h3>{state.outcomes.map((outcome, i) => outcome === 'missed' && <button key={rounds[i].line.id} onClick={() => onExplore(rounds[i].lineIndex, rounds[i].line.words[rounds[i].target].vocabularyId)}><span>{rounds[i].answer}</span><ArrowRight size={16} /></button>)}</div>}
      <button className="clip-primary" onClick={() => onExplore(round.lineIndex, round.line.words[round.target].vocabularyId)}>Explorar o último trecho <ArrowRight size={18} /></button><button className="clip-text" onClick={start}><RotateCcw size={16} /> Jogar novamente</button>
    </div> : <div ref={game} className="clip-round" data-round={state.index} data-state={showingError ? 'incorrect' : state.answered ? 'answered' : counting ? 'countdown' : !revealed ? 'waiting' : heard ? 'answering' : 'listening'}>
      <div className="clip-round-top"><span className="clip-eyebrow">{t(section.label)} · {!playing ? 'PAUSADO' : heard && !state.answered ? 'RESPONDA' : 'AO VIVO'}</span><span>{String(state.index + 1).padStart(2, '0')} / {String(rounds.length).padStart(2, '0')}</span></div>
      <div className="clip-prompt-slot">
        <MusicAmbience lines={lesson.lines} index={ambientIndex} clock={clock} visible={ambientWaiting} />
        <div className={'clip-countdown ' + (counting ? 'is-visible' : '')} aria-hidden={!counting}><strong key={countdown}>{countdown || 3}</strong><span>Prepare-se</span></div>
        <div className={'clip-phrase ' + (!state.answered && revealed ? 'is-visible' : '')} lang="en" aria-hidden={state.answered || !revealed}>{round.line.words.map((w, i) => i === round.target ? <span key={i} className="clip-gap"><span aria-label="palavra oculta">•••</span></span> : <span key={i} className={clock >= w.start && clock < w.end ? 'spoken' : ''}>{w.text} </span>)}</div>
      </div>
      <div className={'clip-time-window ' + (!state.answered && revealed ? 'is-visible' : '')}><span>{clock < round.opens ? 'Ouça a palavra até o fim' : 'Toque na palavra que ouviu'}</span><span>{heard ? Math.ceil(remaining) + 's' : 'Escutando…'}</span><div role="progressbar" aria-label="Tempo da resposta" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(windowProgress * 100)}><i style={{ transform: 'scaleX(' + windowProgress + ')' }} /></div></div>
      <div className="clip-dots" aria-label={completed + ' de ' + rounds.length + ' trechos percorridos'}>{rounds.map((r,i) => <span key={r.line.id} className={state.outcomes[i] === 'missed' ? 'missed' : state.outcomes[i] ? 'done' : i === state.index ? 'active' : ''} />)}</div>
      <div ref={status} className={'clip-feedback ' + (state.solved ? 'success' : state.roundMistakes ? 'retry' : '')} role="status" tabIndex={-1}>{state.feedback || (!playing ? 'Toque em continuar para voltar ao ritmo.' : heard ? 'Qual palavra você ouviu?' : revealed ? 'Acompanhe a voz…' : t(section.story))}</div>
      <div className="clip-response-stage">
      <div className={'clip-section-art ' + (!answersVisible && (!state.answered || state.phase === 'outro') ? 'is-visible' : '')} aria-hidden="true"><div className="clip-energy-ribbon">{Array.from({ length: 25 }, (_, i) => <i key={i} style={{ '--bar-shape': .3 + .7 * Math.sin((i + 1) / 26 * Math.PI) ** 2 } as CSSProperties} />)}</div><span>{t(section.label)}</span></div>
      <div className={'clip-answer-receipt ' + (state.answered && !showingError && state.phase !== 'outro' ? 'is-visible ' : '') + (state.solved ? 'success' : '')} aria-hidden={!state.answered || showingError || state.phase === 'outro'}>{state.answered && <><span>{state.solved ? 'Acertou!' : 'A palavra era'}</span><strong lang="en">{round.answer}{state.solved && <Check size={20} />}</strong></>}</div>
      <div className={'clip-response-slot ' + (answersVisible ? 'is-visible' : '')} aria-hidden={!answersVisible}>{difficulty === 'typing' ? <form className={'clip-type ' + (showingError ? 'incorrect' : '')} onSubmit={e => { e.preventDefault(); answer(typed, document.activeElement as HTMLElement); }}><input aria-label="Palavra que você ouviu" placeholder="Digite em inglês" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} tabIndex={answersVisible ? 0 : -1} disabled={!playing || !heard || state.answered} value={typed} onChange={e => setDraft({ index: state.index, value: e.target.value })} /><button aria-label="Enviar palavra" tabIndex={answersVisible ? 0 : -1} disabled={!playing || !heard || state.answered || !typed.trim()}><ArrowRight size={20} /></button></form> : <div className="clip-options">{round.options.map((option, i) => <button key={option} tabIndex={answersVisible ? 0 : -1} className={showingError && state.rejected.includes(option) ? 'incorrect' : ''} disabled={!playing || !heard || state.answered} onClick={e => answer(option, e.currentTarget)}><span className="clip-option-key">{i + 1}</span>{option}</button>)}</div>}</div>
      </div>
      <div className="clip-live-footer"><span>{state.index > 0 && state.outcomes[state.index - 1] === 'missed' ? 'Anterior: ' + rounds[state.index - 1].answer + ' · guardada para revisar' : 'A música segue. Você segue junto.'}</span><button className="clip-mini-play" aria-label={playing ? 'Pausar jogo' : 'Continuar jogo'} onClick={() => playing ? onPause() : onPlay()}>{playing ? <Pause size={18} /> : <Play size={18} />}</button></div>
    </div>}
  </section>;
}
