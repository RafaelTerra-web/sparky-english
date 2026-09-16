"use client";
import { useEffect, useRef, useState } from 'react';
import { Volume2, ChevronDown, SkipBack, SkipForward, SlidersHorizontal, Headphones, ArrowRight, Play, Pause, RotateCcw, Bookmark, } from 'lucide-react';
import MusicGame from './music-game';
import MusicScene from './music-scene';
import MusicAchievements from './music-achievements';
import { recordMusicPerformance } from '@/lib/music-performance';
import { t } from '@/lib/interface-language';
import { activeCue, emptyMusicProgress, mergeMusic, normalizeMusic, type MusicLesson, type MusicProgress } from '@/lib/music';

const TIMING_OFFSET_STORAGE = 'sparky-music:timing-offset:v1';

export default function MusicLibrary({ userId, level }: { userId: string; level: string }) {
  const [catalog, setCatalog] = useState<MusicLesson[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(false);
  const [active, setActive] = useState<MusicLesson | null>(null), [filter, setFilter] = useState('all'), [query, setQuery] = useState(''), [lab, setLab] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => { const controller = new AbortController(); fetch('/api/music', { cache: 'no-store', signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json(); }).then(d => { setCatalog(d.catalog); setLab(d.storage === 'lab'); setError(false); }).catch(() => { if (!controller.signal.aborted) setError(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [retry]);
  const visible = catalog.filter(x => (filter === 'all' || x.level === filter) && `${x.title} ${x.artist} ${x.topic}`.toLowerCase().includes(query.toLowerCase()));
  return <><section className="music-library">
    <div className="music-hero music-observatory"><MusicScene playing={!active} /><div className="music-hero-copy"><span className="music-kicker"><Headphones size={16} /> SPARKY · MUSIC LAB</span><h1>{t('Ouça. Sinta.')}<br /><em>{t('Aprenda.')}</em></h1><p>{t('Música inteira, letra viva e pequenas descobertas. Entre no inglês pelo som.')}</p><div className="music-hero-tags"><span>{t('No seu ritmo')}</span><span>{t('Letra sincronizada')}</span><span>{t('24 desafios')}</span></div></div><span className="music-hero-edition" aria-hidden="true">THE LISTENING ROOM · VOL. 01</span></div>
    {lab && <p className="music-lab-label">{t('Laboratório local · conta de teste · sincronia editorial em revisão')}</p>}
    <div className="music-toolbar"><label>{t('Buscar música')}<input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('Música, artista ou tema')} /></label><label>{t('Nível')}<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">{t('Todos os níveis')}</option>{['A1','A2','B1','B2','C1','C2'].map(x => <option key={x}>{x}</option>)}</select></label></div>
    <div className="music-collection-heading"><div><span className="music-kicker">{t('SUA SELEÇÃO')}</span><h2>{t('Escolha o próximo play.')}</h2></div><p className="music-muted">{t('Seu nível sugerido:')} {level}</p></div>
    {loading ? <p role="status">{t('Carregando músicas…')}</p> : error ? <div role="alert"><p>{t('Não foi possível carregar as músicas.')}</p><button className="secondary-button" onClick={() => { setLoading(true); setRetry(x => x + 1); }}>{t('Tentar novamente')}</button></div> : !visible.length ? <p>{t('Nenhuma música disponível neste filtro.')}</p> : <div className="music-grid">{visible.map((lesson, index) => <button key={lesson.id} className="music-card" data-track-id={lesson.id} data-tone={lesson.id === 'heartless-local' ? 'violet' : 'emerald'} onClick={() => setActive(lesson)}><div className="music-cover"><span className="music-cover-number" aria-hidden="true">{String(index + 1).padStart(2, '0')} / SESSIONS</span><div className="music-card-disc" aria-hidden="true"><i /></div><span>{lesson.level}</span><span className="music-cover-play" aria-hidden="true"><Play size={20} fill="currentColor" /></span></div><div className="music-card-copy"><p className="music-muted">{lesson.artist} · {Math.floor(lesson.duration / 60)}:{String(Math.floor(lesson.duration % 60)).padStart(2, '0')}</p><h2>{lesson.title}</h2><p>{t(lesson.topic)}</p><strong>{t('Abrir sessão')} <ArrowRight size={16} /></strong></div></button>)}</div>}
  </section>{active && <MusicSession key={`${userId}:${active.id}`} userId={userId} lesson={active} lab={lab} onClose={() => setActive(null)} />}</>;
}

function MusicSession({ userId, lesson, lab, onClose }: { userId: string; lesson: MusicLesson; lab: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'game' | 'lyrics' | 'learn' | 'awards'>('game');
  const [volume, setVolume] = useState(60);
  const [settings, setSettings] = useState(false);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => { try { const saved = Number(localStorage.getItem(TIMING_OFFSET_STORAGE)); if (Number.isFinite(saved)) setOffset(Math.max(-1000, Math.min(1000, saved))); } catch { /* Device calibration is optional. */ } });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const el = dialog.current; const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; el?.showModal();
    return () => { el?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => {
    const viewport = window.visualViewport;
    const el = dialog.current;
    if (!viewport || !el) return;
    const fit = () => {
      // Mobile keyboards can shrink only the visual viewport, leaving dvh and
      // height media queries unchanged. Fit the fixed room to the visible area.
      el.style.height = `${viewport.height}px`;
      el.style.top = `${viewport.offsetTop}px`;
    };
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    return () => { viewport.removeEventListener('resize', fit); viewport.removeEventListener('scroll', fit); };
  }, []);
  const storageKey = `sparky-music:${userId}:${lesson.id}`;
  const [progress, setProgress] = useState(() => { try { return normalizeMusic(lesson, JSON.parse(localStorage.getItem(storageKey) || 'null')); } catch { return emptyMusicProgress(lesson); } });
  const progressRef = useRef(progress), dirty = useRef(false), inFlight = useRef(false), alive = useRef(true);
  const [sync, setSync] = useState('Carregando progresso…');
  const audio = useRef<HTMLAudioElement>(null), lyrics = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(progress.position), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1), [loop, setLoop] = useState(false), [selected, setSelected] = useState(0), [translation, setTranslation] = useState(false), [follow, setFollow] = useState(true), [audioError, setAudioError] = useState('');
  const [word, setWord] = useState<string | null>(null);
  const [vocabularyQuery, setVocabularyQuery] = useState('');
  const studyEnd = lesson.duration;
  const cueTime = time + offset / 1000;
  const activeLine = activeCue(lesson.lines, cueTime), line = lesson.lines[selected];
  function update(delta: Partial<MusicProgress>) { const next = normalizeMusic(lesson, { ...progressRef.current, ...delta }); progressRef.current = next; setProgress(next); dirty.current = true; setSync('Sincronização pendente'); persist(next); }
  function persist(next: MusicProgress) { try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setSync('O navegador bloqueou o salvamento. Mantenha esta sessão aberta.'); } }
  function rememberPosition(position: number) {
    const next = normalizeMusic(lesson, { ...progressRef.current, position, positionAt: Date.now() });
    progressRef.current = next; dirty.current = true; persist(next);
  }
  function changeOffset(value: number) {
    const next = Math.max(-1000, Math.min(1000, value));
    setOffset(next);
    try { localStorage.setItem(TIMING_OFFSET_STORAGE, String(next)); } catch { /* Device calibration is optional. */ }
  }
  async function synchronize() {
    if (inFlight.current || !alive.current) return;
    inFlight.current = true;
    try {
      const remote = await fetch(`/api/media-progress?trackId=${encodeURIComponent(lesson.id)}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!remote.ok) throw Error();
      const server = normalizeMusic(lesson, await remote.json());
      let merged = mergeMusic(lesson, server, progressRef.current);
      if (dirty.current || JSON.stringify({ ...merged, revision: 0 }) !== JSON.stringify({ ...server, revision: 0 })) {
        const snapshot = progressRef.current;
        const response = await fetch('/api/media-progress', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trackId: lesson.id, baseRevision: server.revision, state: merged }), signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw Error();
        merged = mergeMusic(lesson, await response.json(), progressRef.current);
        dirty.current = progressRef.current !== snapshot;
      }
      if (alive.current) { progressRef.current = merged; setProgress(merged); persist(merged); setSync(dirty.current ? 'Sincronização pendente' : lab ? 'Salvo na conta de teste desta execução' : 'Salvo na sua conta'); }
    } catch { if (alive.current) setSync('Sincronização pendente · tentaremos novamente ao conectar.'); }
    finally { inFlight.current = false; }
  }
  useEffect(() => { alive.current = true; void synchronize(); const timer = setInterval(() => { void synchronize(); }, 5000); const online = () => { void synchronize(); }; window.addEventListener('online', online); return () => { alive.current = false; clearInterval(timer); window.removeEventListener('online', online); }; /* Initial account snapshot; mutations are read from refs. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const element = audio.current;
    const hide = () => { if (document.hidden) { element?.pause(); } };
    document.addEventListener('visibilitychange', hide);
    return () => { element?.pause(); document.removeEventListener('visibilitychange', hide); };
  }, []);
  useEffect(() => {
    if (!playing) return;
    let frame = 0, lastSave = 0, previousTime = audio.current?.currentTime ?? 0;
    const tick = () => {
      const a = audio.current; if (!a) return;
      let current = a.currentTime;
      const justHeard = lesson.lines.find(x => previousTime < x.end && current >= x.end && current - previousTime < 0.5);
      if (justHeard && !progressRef.current.heard.includes(justHeard.id)) update({ heard: [...progressRef.current.heard, justHeard.id] });
      if (loop && (current >= line.end || current < line.start - 0.2)) { a.currentTime = line.start; current = line.start; }
      if (!loop && current >= studyEnd) { a.pause(); a.currentTime = studyEnd; current = studyEnd; }
      setTime(current);
      previousTime = current;
      if (performance.now() - lastSave > 4000) { rememberPosition(current); lastSave = performance.now(); }
      frame = requestAnimationFrame(tick);
    }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, loop, selected]);
  useEffect(() => { if (follow && mode === 'lyrics' && activeLine >= 0) { const element = lyrics.current?.querySelector<HTMLElement>(`[data-line="${activeLine}"]`); if (element && lyrics.current) lyrics.current.scrollTo({ top: element.offsetTop - lyrics.current.clientHeight * 0.3, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); } }, [activeLine, follow, mode]);
  function seek(value: number) { value = Math.max(0, Math.min(studyEnd, value)); if (audio.current) { audio.current.currentTime = value; setTime(value); update({ position: value, positionAt: Date.now() }); } }
  async function play() { setAudioError(''); if (audio.current && audio.current.currentTime >= studyEnd - 0.05) seek(lesson.lines[0].start); try { await audio.current?.play(); } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setAudioError('Toque novamente para iniciar o áudio.'); } }
  function changeSpeed(value: number) { setSpeed(value); if (audio.current) { audio.current.playbackRate = value; audio.current.preservesPitch = true; } }
  function chooseLine(index: number) { setSelected(index); setTranslation(false); setWord(null); seek(lesson.lines[index].start); }
  function changeMode(value: 'game' | 'lyrics' | 'learn' | 'awards') { audio.current?.pause(); setLoop(false); setMode(value); const step = value === 'learn' ? 2 : 1; update({ stage: Math.max(progressRef.current.stage, step) }); }
  function exitRoom() { audio.current?.pause(); onClose(); }
  const vocab = lesson.vocabulary.find(v => v.id === word);
  const visibleVocabulary = lesson.vocabulary.filter(v => `${v.word} ${v.meaning}`.toLocaleLowerCase('pt-BR').includes(vocabularyQuery.toLocaleLowerCase('pt-BR')));
  return <dialog ref={dialog} className="listen-room clip-room" data-mode={mode} aria-labelledby="music-room-title" onCancel={e => { e.preventDefault(); exitRoom(); }}>
    <div className="listen-shell">
      <header className="listen-header">
        <button className="listen-icon" aria-label="Todas as músicas" onClick={exitRoom}><ChevronDown size={24} /></button>
        <span>MÚSICAS {lab && <span className="listen-beta">LAB</span>}</span>
        <button className="listen-icon" aria-label="Ajustes de reprodução" aria-expanded={settings} onClick={() => setSettings(!settings)}><SlidersHorizontal size={20} /></button>
      </header>
      <div className="listen-track"><div className="listen-art" aria-hidden="true">p<span>01</span></div><div><h1 id="music-room-title">{lesson.title}</h1><p>{lesson.artist}</p></div><span className="listen-level">{lesson.level}</span></div>
      {settings && <section className="listen-settings" aria-label="Ajustes de reprodução">
        <label><span><Volume2 size={16} /> Volume <output>{volume}%</output></span><input aria-label="Volume da música" type="range" min="0" max="100" value={volume} onChange={e => { const value = Number(e.target.value); setVolume(value); if (audio.current) audio.current.volume = value / 100; }} /></label>
        <label><span>Ajuste fino da letra e do jogo <output>{offset > 0 ? '+' : ''}{offset} ms</output></span><input aria-label="Ajuste fino da letra e do jogo" type="range" min="-1000" max="1000" step="50" value={offset} onChange={e => changeOffset(Number(e.target.value))} /></label>
        <p>Valor positivo adianta a letra; negativo atrasa. Use para compensar o atraso do fone.</p><p role="status">{lab ? 'Teste local · ' : ''}{t(sync)}</p>
      </section>}
      <main className="listen-content">
        {mode === 'game' && <MusicGame performance={progress.performance} onPerformance={(mode, correct, streak, finished) => { update({ performance: recordMusicPerformance(progressRef.current.performance, mode, correct, streak, finished), completed: progressRef.current.completed || finished }); if (finished) void synchronize(); }} onAchievements={() => changeMode('awards')} lesson={lesson} media={audio} clock={cueTime} playing={playing} speed={speed} onSpeed={changeSpeed} onSeek={seek} onPlay={() => { setLoop(false); void play(); }} onPause={() => audio.current?.pause()} onExplore={(index, vocabularyId) => { setSelected(index); setWord(vocabularyId || null); changeMode('learn'); if (vocabularyId) update({ explored: [...new Set([...progressRef.current.explored, vocabularyId])] }); }} />}
        <section className="listen-lyric-panel" hidden={mode !== 'lyrics'}>
          <div className="listen-caption"><span>{playing ? 'ACOMPANHE A VOZ' : 'OUÇA. DEPOIS, EXPERIMENTE.'}</span><button className="listen-link" aria-pressed={translation} onClick={() => setTranslation(!translation)}>Tradução</button></div>
          <div className="music-lyrics" ref={lyrics} onWheel={() => setFollow(false)} onTouchMove={() => setFollow(false)} onKeyDown={e => { if (['ArrowDown','ArrowUp','PageDown','PageUp'].includes(e.key)) setFollow(false); }} tabIndex={0} aria-label="Letra do trecho de estudo em inglês">
            {lesson.lines.map((cue, i) => <div data-line={i} key={cue.id} className={'music-line ' + (activeLine === i ? 'current ' : '') + (cueTime >= cue.end ? 'past' : '')}>
              <button className="music-line-time" aria-label={'Ouvir trecho ' + (i + 1)} onClick={() => { chooseLine(i); setFollow(true); void play(); }}>{String(i + 1).padStart(2, '0')}</button>
              <div><p lang="en">{cue.words.map((w, j) => <button key={j} className={activeLine === i && cueTime >= w.start && cueTime < w.end ? 'current-word' : ''} onClick={() => { audio.current?.pause(); setSelected(i); setWord(w.vocabularyId || null); changeMode('learn'); if (w.vocabularyId) update({ explored: [...new Set([...progressRef.current.explored, w.vocabularyId])] }); }}>{w.text}</button>)}</p>{translation && <p className="listen-translation" lang="pt-BR">{cue.translation}</p>}</div>
            </div>)}
          </div>
          <div className="listen-lyric-hint">{follow ? <span>Toque em uma palavra para explorar</span> : <button className="listen-link" onClick={() => setFollow(true)}>Voltar à voz <ArrowRight size={14} /></button>}</div>
        </section>
        <div className="listen-study" hidden={mode !== 'learn'}>      <section className="music-panel"><p className="music-kicker">{t('SEU TRECHO')}</p><select aria-label={t('Selecionar trecho')} value={selected} onChange={e => chooseLine(Number(e.target.value))}>{lesson.lines.map((l, i) => <option key={l.id} value={i}>{i + 1}. {l.text}</option>)}</select><p lang="en" className="music-selected-text">{line.text}</p><button className="listen-link" aria-expanded={translation} onClick={() => setTranslation(!translation)}>{t(translation ? 'Ocultar tradução' : 'Mostrar tradução')}</button>{translation && <p lang="pt-BR">{line.translation}</p>}<h3>{t('Perceba o som')}</h3><p>{t(line.tip)}</p><button className="listen-action" onClick={() => { seek(line.start); setLoop(true); void play(); }}><Play size={15} />{t('Ouvir este trecho')}</button></section>
      <section className="music-panel" hidden={mode !== 'learn'}><h2>{t('Palavras em contexto')}</h2><label className="music-vocabulary-search">Buscar nas {lesson.vocabulary.length} palavras<input value={vocabularyQuery} onChange={e => setVocabularyQuery(e.target.value)} placeholder="Palavra ou significado" /></label><div className="music-vocabulary">{visibleVocabulary.map(v => <button key={v.id} aria-pressed={word === v.id} onClick={() => { setWord(v.id); update({ explored: [...new Set([...progress.explored, v.id])] }); }}>{v.word}{progress.saved.includes(v.id) ? <Bookmark size={13} /> : null}</button>)}</div>{vocab && <div className="music-definition"><h3 lang="en">{vocab.word} <small>{vocab.ipa}</small></h3><p>{t(vocab.meaning)}</p><p>{t(vocab.usage)}</p><p lang="en">{vocab.example}</p><button className="listen-link" disabled={progress.saved.includes(vocab.id)} onClick={() => update({ saved: [...progress.saved, vocab.id] })}><Bookmark size={14} />{t(progress.saved.includes(vocab.id) ? 'Palavra salva nesta música' : 'Salvar nesta música')}</button></div>}</section>
        </div>
        {mode === 'awards' && <div><MusicAchievements performance={progress.performance} /><p className="music-muted" role="status">{t(sync)}</p></div>}
      </main>
      <footer className="listen-dock">
        <audio ref={audio} src={lesson.source + (lesson.source.includes('?') ? '&' : '?') + 'mix=quiet-v2'} preload="metadata" onLoadedMetadata={() => { if (audio.current) { audio.current.currentTime = Math.min(studyEnd, progressRef.current.position); audio.current.volume = volume / 100; audio.current.preservesPitch = true; } }} onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); if (audio.current) update({ position: audio.current.currentTime, positionAt: Date.now() }); }} onEnded={() => setPlaying(false)} onSeeked={() => setTime(audio.current?.currentTime ?? 0)} onError={() => { setPlaying(false); setAudioError('Não foi possível carregar o áudio.'); }} />
        <div className="listen-timeline"><input aria-label="Posição da música" type="range" min="0" max={studyEnd} step="0.01" value={Math.min(time, studyEnd)} onChange={e => seek(Number(e.target.value))} /><div><span>{clock(time)}</span><span>Música completa · {clock(studyEnd)}</span></div></div>
        <div className="listen-transport">
          <button className="listen-icon" aria-label="Repetir trecho" aria-pressed={loop} onClick={() => { const index = activeLine >= 0 ? activeLine : selected; setSelected(index); setLoop(!loop); if (!loop) seek(lesson.lines[index].start); }}><RotateCcw size={20} /></button>
          <button className="listen-icon" aria-label="Trecho anterior" onClick={() => { chooseLine(Math.max(0, (activeLine >= 0 ? activeLine : selected) - 1)); setFollow(true); }}><SkipBack size={24} /></button>
          <button className="listen-play" aria-label={playing ? 'Pausar música' : 'Tocar música'} onClick={() => playing ? audio.current?.pause() : void play()}>{playing ? <Pause size={27} fill="currentColor" /> : <Play size={27} fill="currentColor" />}</button>
          <button className="listen-icon" aria-label="Próximo trecho" onClick={() => { chooseLine(Math.min(lesson.lines.length - 1, (activeLine >= 0 ? activeLine : selected) + 1)); setFollow(true); }}><SkipForward size={24} /></button>
          <button className="listen-icon listen-speed" aria-label="Velocidade" onClick={() => changeSpeed(speed === 1 ? .75 : speed === .75 ? .5 : 1)}>{speed === 1 ? '1×' : speed === .75 ? '0,75×' : '0,5×'}</button>
        </div>
        {audioError && <div className="listen-error" role="alert">{audioError}<button className="listen-link" onClick={() => { audio.current?.load(); void play(); }}>Tentar novamente</button></div>}
        <nav className="listen-tabs" aria-label="Área de estudo"><button aria-pressed={mode === 'game'} onClick={() => changeMode('game')}>Jogar</button><button aria-pressed={mode === 'lyrics'} onClick={() => changeMode('lyrics')}>Letra</button><button aria-pressed={mode === 'learn'} onClick={() => changeMode('learn')}>Palavras</button><button aria-pressed={mode === 'awards'} onClick={() => changeMode('awards')}>Conquistas</button></nav>
      </footer>
    </div>
  </dialog>;
}
function clock(seconds: number) { const n = Math.max(0, Math.floor(seconds)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); }
