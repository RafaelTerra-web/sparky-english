"use client";

import { useEffect, useMemo, useReducer, useRef, useState, type RefObject, type CSSProperties } from 'react';
import Image from 'next/image';
import MusicScene from './music-scene';
import MusicVideo from './music-video';
import MusicChorusFx from './music-chorus-fx';
import { ArrowRight, Check, Pause, Play, RotateCcw, Zap, Trophy } from 'lucide-react';
import type { MusicLesson } from '@/lib/music';
import { buildMusicRounds, initialGame, musicGameReducer, musicAnswerOpens, musicSpeeds, musicSpeedLabel, LYRIC_PREVIEW_SECONDS, type GameDifficulty } from '@/lib/music-game';
import { createMusicFeedback, vibrateMusicSuccess } from '@/lib/music-feedback';
import { ambientLyricIndex } from '@/lib/music-ambience';
import MusicAmbience from './music-ambience';
import { musicEnergy } from '@/lib/music-energy';
import { musicIntroCountdown, musicBeatAt, musicEnergyAt, musicSectionAt, musicVisualMoment } from '@/lib/music-visuals';
import { t } from '@/lib/interface-language';
import { MUSIC_POINTS_PER_HIT, musicRank, musicRanks, recordMusicPerformance, unlockedMusicAchievements, type MusicPerformance, type MusicDifficulty } from '@/lib/music-performance';
import { musicArtwork } from '@/lib/music-art';

type Props = { lesson: MusicLesson; performance: MusicPerformance; onPerformance: (mode: MusicDifficulty, correct: number, streak: number, finished: boolean) => void; onAchievements: () => void; onLyrics: () => void; media: RefObject<HTMLAudioElement | null>; clock: number; playing: boolean; speed: number; onSpeed: (speed: number) => void; onSeek: (time: number) => void; onPlay: () => void; onPause: () => void; onExplore: (line: number, word?: string) => void };
const levels = [
  { id: 'level1', title: 'Nível 1', hint: '12 trechos · 4 alternativas', bars: 1 },
  { id: 'level2', title: 'Nível 2', hint: '20 trechos · 4 alternativas', bars: 2 },
  { id: 'level3', title: 'Nível 3', hint: '28 trechos · 4 alternativas', bars: 3 },
  { id: 'level4', title: 'Nível 4', hint: '32 trechos · até 2 palavras', bars: 4 },
  { id: 'quick', title: 'Todas as palavras', hint: 'Frase inteira · resposta rápida', bars: 4 },
] as const;

export default function MusicGame({ lesson, performance, onPerformance, onAchievements, onLyrics, media, clock, playing, speed, onSpeed, onSeek, onPlay, onPause, onExplore }: Props) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>('level1');
  const [seed, setSeed] = useState(1);
  const [state, dispatch] = useReducer(musicGameReducer, initialGame);
  const [rankBurst, setRankBurst] = useState<{ name: string; key: number } | null>(null);
  const [errorFlash, setErrorFlash] = useState<number | null>(null);
  const [achievementFlash, setAchievementFlash] = useState<string | null>(null);
  const submitted = useRef<number | null>(null);
  const game = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const sound = useRef<ReturnType<typeof createMusicFeedback> | null>(null);
  const rounds = useMemo(() => buildMusicRounds(lesson, difficulty, seed), [lesson, difficulty, seed]);
  const round = rounds[state.index];
  const opens = musicAnswerOpens(round, speed);
  const heard = state.phase === 'round' && clock >= opens && clock < round.closes;
  const showingError = errorFlash === state.index;
  const revealed = state.phase === 'round' && clock >= round.revealAt;
  const countdown = musicIntroCountdown(clock, state.phase === 'round' && state.index === 0 && !state.answered);
  const counting = countdown > 0;
  const answersVisible = revealed && (!state.answered || showingError);
  const remaining = Math.max(0, round.closes - clock) / speed;
  const windowProgress = Math.max(0, Math.min(1, (round.closes - clock) / (round.closes - opens)));
  const deadlines = useMemo(() => rounds.map(r => r.closes), [rounds]);
  const pauseRef = useRef(onPause);
  const saveRef = useRef(onPerformance);
  useEffect(() => { saveRef.current = onPerformance; }, [onPerformance]);
  useEffect(() => {
    if (state.phase !== 'ready') saveRef.current(difficulty, state.correct, state.bestStreak, state.phase === 'result');
  }, [difficulty, state.correct, state.bestStreak, state.phase]);
  useEffect(() => {
    if (!achievementFlash) return;
    const timer = setTimeout(() => setAchievementFlash(null), 2400);
    return () => clearTimeout(timer);
  }, [achievementFlash]);
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
  function start() { sound.current ??= createMusicFeedback(); sound.current.prepare(); setSeed(crypto.getRandomValues(new Uint32Array(1))[0]); submitted.current = null; setErrorFlash(null); setAchievementFlash(null); setRankBurst(null); onSeek(0); dispatch({ type: 'start' }); onPlay(); }
  function answer(value: string, source?: HTMLElement | null) {
    const audio = media.current;
    if (!audio || audio.paused || submitted.current === state.index) return;
    const scroller = game.current?.closest<HTMLElement>('.listen-content');
    const scrollTop = scroller?.scrollTop ?? 0;
    const pageTop = window.scrollY;
    const keyboard = source?.matches(':focus-visible') ?? false;
    source?.blur();
    const action = { type: 'answer' as const, index: state.index, value, expected: round.answer, time: clock, opens, closes: round.closes };
    const next = musicGameReducer(state, action);
    if (next === state) return;
    const earned = new Set(unlockedMusicAchievements(performance).map(a => a.id));
    const achievement = unlockedMusicAchievements(recordMusicPerformance(performance, difficulty, next.correct, next.bestStreak, false)).find(a => !earned.has(a.id));
    if (achievement) setAchievementFlash(achievement.title);
    // Lock this occurrence only; the same word in a later round is independent.
    submitted.current = state.index;
    dispatch(action);
    requestAnimationFrame(() => {
      if (scroller) scroller.scrollTop = scrollTop;
      if (window.scrollY !== pageTop) window.scrollTo({ top: pageTop, behavior: 'auto' });
      if (keyboard) status.current?.focus({ preventScroll: true });
    });
    if (next.solved && next.correct > state.correct) {
      const promoted = musicRank(next.correct / rounds.length * 2400);
      if (promoted.name !== musicRank(state.correct / rounds.length * 2400).name) setRankBurst({ name: promoted.name, key: next.correct });
      vibrateMusicSuccess();
    } else if (!next.solved) {
      setErrorFlash(state.index);
      sound.current ??= createMusicFeedback();
      sound.current.scratch(audio.muted ? 0 : audio.volume);
    }
  }
  const completed = state.outcomes.length;
  const ambientIndex = ambientLyricIndex(lesson.lines, clock + LYRIC_PREVIEW_SECONDS);
  const score = state.correct * MUSIC_POINTS_PER_HIT;
  const rank = musicRank(state.correct / rounds.length * 2400);
  const nextRank = musicRanks.find(r => r.points > rank.points);
  const rankProgress = nextRank ? Math.max(0, Math.min(1, (state.correct / rounds.length * 2400 - rank.points) / (nextRank.points - rank.points))) : 1;
  const energy = musicEnergyAt(musicEnergy[lesson.id], clock);
  const beat = musicBeatAt(musicEnergy[lesson.id], clock);
  const section = musicSectionAt(lesson.id, clock);
  const moment = musicVisualMoment(lesson.lines, ambientIndex, clock, energy);
  const tone = lesson.id === 'stay-at-your-house-local' ? 'cyberpunk' : lesson.id === 'heartless-local' ? 'violet' : lesson.id === 'buttercup-local' ? 'buttercup' : 'emerald';
  const artwork = musicArtwork(lesson.id);
  const live = playing && (state.phase === 'round' || state.phase === 'outro');
  const glow = live ? section.kind === 'chorus' ? .2 + energy * .28 + beat * .52 : Math.max(0, beat - .2) * .18 : 0;
  return <section className="clip-game" aria-label="Jogo de escuta" data-session-seed={seed} data-phase={state.phase} data-playing={playing} data-difficulty={difficulty} data-tone={tone} data-section={section.kind} data-moment={moment} style={{ '--music-energy': energy } as CSSProperties}>
    <div className="clip-energy-highlight" aria-hidden="true" style={{ opacity: glow, transform: `scale(${1 + beat * .035})` }} />
    {rankBurst && <div key={rankBurst.key} className="clip-rank-burst" aria-hidden="true" onAnimationEnd={() => setRankBurst(null)}>{rankBurst.name}</div>}
    <MusicChorusFx active={live && section.kind === 'chorus'} clock={clock} energy={energy} />
    {lesson.visualSource && <MusicVideo media={media} source={lesson.visualSource} clock={clock} playing={playing} speed={speed} active={live && ['chorus', 'instrumental', 'outro'].includes(section.kind)} />}
    {tone === 'cyberpunk' && <div className="clip-city-scene"><MusicScene playing={playing} clock={clock} tone={tone} energy={energy} chorus={section.kind === 'chorus'} /></div>}
    <div className="clip-scorebar"><div className="clip-score-points"><b className="music-rank" data-rank={rank.name} aria-label={`Rank ${rank.name}`}>{rank.name}</b><span><strong data-score={score}>{score.toLocaleString('pt-BR')} pts</strong><small>{state.correct}/{rounds.length} acertos</small></span></div><span><Zap size={15} /> {state.streak} seguidas</span></div>
    <div className="clip-speed-control" role="group" aria-label="Velocidade do jogo"><span>Velocidade</span>{musicSpeeds.map(value => <button key={value} aria-pressed={speed === value} onClick={() => onSpeed(value)}>{musicSpeedLabel(value)}</button>)}</div>
    {state.phase !== 'ready' && <div className="clip-rank-progress"><span>{nextRank ? `${Math.ceil(nextRank.points / 2400 * rounds.length) - state.correct} acertos para ${nextRank.name}` : 'Rank S conquistado'}</span><progress aria-label="Progresso para o próximo rank" max={1} value={rankProgress} /></div>}
    <div className={'clip-media ' + (playing ? 'is-playing' : '')}>
      {artwork && <Image className="clip-cover-image" src={artwork.src} alt="" fill sizes="(max-width: 900px) 100vw, 430px" style={{ objectFit: 'cover', objectPosition: artwork.position }} />}
      <div className="clip-media-top"><span>SPARKY SESSIONS</span><span>NO SEU RITMO</span></div>
      <div className="clip-album-title" aria-hidden="true">{lesson.title}<span>{lesson.artist}</span></div>
      <div className="clip-media-bottom"><span>{playing ? 'REPRODUZINDO' : 'PRONTO PARA O PLAY'}</span><span>{lesson.level} · {Math.floor(lesson.duration / 60)}:{String(Math.floor(lesson.duration % 60)).padStart(2, '0')} · música completa</span></div>
      <div className="clip-track-progress" aria-hidden="true"><i style={{ transform: `scaleX(${Math.max(0, Math.min(1, clock / lesson.duration))})` }} /></div>
    </div>
    {state.phase === 'ready' ? <div className="clip-setup">
      <span className="clip-eyebrow">ESCOLHA SEU NÍVEL</span><h2>Mais trechos. Mais desafio.</h2><p>As frases chegam antes da voz. Você pode responder 0,25 s antes da palavra, em quatro níveis de desafio.</p>
      <div className="clip-levels" role="group" aria-label="Dificuldade">{levels.map(level => <button key={level.id} data-mode={level.id} aria-pressed={difficulty === level.id} onClick={() => setDifficulty(level.id)}><span className="clip-bars" aria-hidden="true">{[1,2,3,4].map(n => <i key={n} className={n <= level.bars ? 'filled' : ''} />)}</span><span><strong>{level.title}</strong><small>{level.hint}</small></span>{difficulty === level.id ? <Check size={18} /> : <span className="clip-radio" />}</button>)}</div>
      <button className="clip-primary" onClick={start}>Começar a jogar <Play size={18} fill="currentColor" /></button><p className="clip-fine">100 pts por acerto · Recorde: {performance[difficulty].correct * MUSIC_POINTS_PER_HIT} pts</p>
    </div> : state.phase === 'result' ? <div className="clip-result" aria-live="polite">
      <div className="clip-result-rank music-rank" data-rank={rank.name}>{rank.name}</div><span className="clip-eyebrow">MÚSICA CONCLUÍDA</span><h2>Deu ouvido ao inglês.</h2><p className="clip-final-score">{score.toLocaleString('pt-BR')} <span>pontos</span></p>
      <div className="clip-results"><div><strong>{state.correct}/{rounds.length}</strong><span>acertos</span></div><div><strong>{state.bestStreak}</strong><span>melhor sequência</span></div><div><strong>{state.missed}</strong><span>para revisar</span></div></div>
      {state.missed > 0 && <details className="clip-review"><summary>{state.missed} respostas para revisar quando quiser</summary>{state.outcomes.map((outcome, i) => outcome === 'missed' && <button key={`${rounds[i].line.id}:${i}`} onClick={() => onExplore(rounds[i].lineIndex, rounds[i].line.words[rounds[i].target].vocabularyId)}><span>{rounds[i].answer}</span><ArrowRight size={16} /></button>)}</details>}
      <button className="clip-primary" onClick={onAchievements}><Trophy size={18} /> Ver conquistas e recordes</button><div className="clip-result-links"><button className="clip-text" onClick={onLyrics}>Revisar letra</button><button className="clip-text" onClick={() => onExplore(0)}>Explorar palavras</button></div><button className="clip-text" onClick={start}><RotateCcw size={16} /> Jogar novamente</button>
    </div> : <div ref={game} className="clip-round" data-round={state.index} data-state={showingError ? 'incorrect' : state.answered ? 'answered' : counting ? 'countdown' : !revealed ? 'waiting' : heard ? 'answering' : 'listening'}>
      <div className="clip-round-top"><span className="clip-eyebrow">{t(section.label)}{!playing ? ' · PAUSADO' : heard && !state.answered ? ' · RESPONDA' : ''}</span><span>{String(state.index + 1).padStart(2, '0')} / {String(rounds.length).padStart(2, '0')}</span></div>
      <div className="clip-prompt-slot">
        <MusicAmbience lines={lesson.lines} index={ambientIndex} clock={clock} rounds={rounds} completed={state.outcomes.length} focus={revealed ? { lineIndex: round.lineIndex, targets: round.targets, hidden: !state.answered } : undefined} />
        <div className={'clip-countdown ' + (counting ? 'is-visible' : '')} aria-hidden={!counting}><strong key={countdown}>{countdown || 3}</strong><span>Prepare-se</span></div>
      </div>
      <div className={'clip-time-window ' + (!state.answered && revealed ? 'is-visible' : '')}><span>{clock < opens ? 'Prepare sua resposta' : round.targets.length > 1 ? 'Complete todas as lacunas' : 'Escolha a palavra que completa a frase'}</span><span>{heard ? Math.ceil(remaining) + 's' : 'Escutando…'}</span><div role="progressbar" aria-label="Tempo da resposta" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(windowProgress * 100)}><i style={{ transform: 'scaleX(' + windowProgress + ')' }} /></div></div>
      <div className="clip-dots" aria-label={completed + ' de ' + rounds.length + ' trechos percorridos'}>{rounds.map((r,i) => <span key={r.line.id} className={state.outcomes[i] === 'missed' ? 'missed' : state.outcomes[i] ? 'done' : i === state.index ? 'active' : ''} />)}</div>
      <div ref={status} className={'clip-feedback ' + (state.solved ? 'success' : state.roundMistakes ? 'retry' : '')} role="status" tabIndex={-1}>{achievementFlash ? `Conquista: ${t(achievementFlash)}` : <span className="sr-only">{state.phase === 'round' && state.answered ? state.solved ? '+100 pontos' : 'Palavra adicionada à revisão' : ''}</span>}</div>
      <div className="clip-response-stage">
      <div className={'clip-section-art ' + (!answersVisible && (!state.answered || state.phase === 'outro') ? 'is-visible' : '')} aria-hidden="true"><div className="clip-energy-ribbon">{Array.from({ length: 25 }, (_, i) => <i key={i} style={{ '--bar-shape': .3 + .7 * Math.sin((i + 1) / 26 * Math.PI) ** 2 } as CSSProperties} />)}</div></div>
      <div className={'clip-answer-receipt ' + (state.answered && !showingError && state.phase !== 'outro' ? 'is-visible ' : '') + (state.solved ? 'success' : '')} aria-hidden={!state.answered || showingError || state.phase === 'outro'}>{state.answered && <><span>{state.solved ? 'Acertou! +100 pontos' : round.targets.length > 1 ? 'A resposta era' : 'A palavra era'}</span><strong lang="en">{round.answer}{state.solved && <Check size={20} />}</strong>{state.solved && <b key={state.index} className="clip-points-pop" aria-hidden="true">+100</b>}</>}</div>
      <div className={'clip-response-slot ' + (answersVisible ? 'is-visible' : '')} aria-hidden={!answersVisible}><div className="clip-options" data-multi={round.targets.length > 1}>{round.options.map((option, i) => <button key={option} tabIndex={answersVisible ? 0 : -1} className={showingError && state.rejected.includes(option) ? 'incorrect' : ''} disabled={!playing || !heard || state.answered} onClick={e => answer(option, e.currentTarget)}><span className="clip-option-key">{i + 1}</span>{option}</button>)}</div></div>
      </div>
      <div className="clip-live-footer"><button className="clip-mini-play" aria-label={playing ? 'Pausar jogo' : 'Continuar jogo'} onClick={() => playing ? onPause() : onPlay()}>{playing ? <Pause size={18} /> : <Play size={18} />}</button></div>
    </div>}
  </section>;
}
