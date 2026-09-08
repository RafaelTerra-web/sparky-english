"use client";

import { Headphones, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { EltisReport, EltisSkill, PublicEltisItem } from "@/lib/eltis-shared";

type Snapshot = { token: string; question?: PublicEltisItem; index?: number; total?: number; finished?: boolean; report?: EltisReport };
const skillNames: Record<EltisSkill, string> = { listening: "Listening", reading: "Leitura", vocabulary: "Vocabulário", grammar: "Gramática" };

export function EltisSimulator({ userId }: { userId: string }) {
  const key = `sparky-mock-eltis:${userId}`;
  const audio = useRef<HTMLAudioElement | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function restore() {
      const saved = localStorage.getItem(key);
      if (!saved) return;
      setLoading(true);
      try {
        await request({ action: "resume", token: saved });
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Não foi possível retomar o simulado.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => {
      active = false;
      audio.current?.pause();
    };
    // The account-specific key is stable for this mounted screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function request(body: Record<string, unknown>) {
    setError("");
    const response = await fetch("/api/mock-tests/eltis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 409) localStorage.removeItem(key);
      throw new Error(data.error || "Não foi possível continuar.");
    }
    if (data.token) localStorage.setItem(key, data.token);
    setSnapshot(data);
    return data as Snapshot;
  }

  async function start() {
    setLoading(true);
    try { await request({ action: "start" }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível começar."); }
    finally { setLoading(false); }
  }

  async function answer() {
    if (!snapshot?.token || !selected || submitting) return;
    stopAudio();
    setSubmitting(true);
    try {
      const next = await request({ action: "answer", token: snapshot.token, answer: selected });
      setSelected("");
      setPlayCount(0);
      if (next.finished) localStorage.removeItem(key);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar a resposta.");
    } finally { setSubmitting(false); }
  }

  function stopAudio() {
    audio.current?.pause();
    setPlaying(false);
  }

  async function playAudio() {
    const question = snapshot?.question;
    if (!question?.audioId || playing || playCount >= (question.maxPlays ?? 1)) return;
    const sound = new Audio(`/audio/eltis/${question.audioId}.wav`);
    audio.current = sound;
    sound.onended = () => setPlaying(false);
    sound.onerror = () => { setPlaying(false); setError("O áudio não carregou. Verifique a conexão antes de responder."); };
    try {
      await sound.play();
      setPlayCount((count) => count + 1);
      setPlaying(true);
    } catch {
      setError("Não foi possível tocar o áudio neste navegador.");
    }
  }

  function restart() {
    stopAudio();
    localStorage.removeItem(key);
    setSnapshot(null);
    setSelected("");
    setPlayCount(0);
    setError("");
  }

  if (loading) return <section className="mock-loading" role="status">Preparando o simulado…</section>;
  if (!snapshot) return (
    <section className="mock-intro" aria-labelledby="eltis-heading">
      <div className="mock-mark"><Headphones size={28} /><span>INTERCÂMBIO</span></div>
      <div>
        <p className="eyebrow">Preparação para exames</p>
        <h1 id="eltis-heading">Simulado ELTiS</h1>
        <p>Prática autoral compacta para o inglês usado em escolas dos Estados Unidos: instruções, aulas, leitura, vocabulário e gramática em contexto.</p>
      </div>
      <div className="mock-facts">
        <span><strong>24</strong> questões</span><span><strong>2</strong> seções</span><span><strong>25–35</strong> minutos</span>
      </div>
      <div className="mock-guidance">
        <h2>Antes de começar</h2>
        <ul>
          <li>Use fones de ouvido. Os áudios tocam uma vez; o problema de matemática toca até duas.</li>
          <li>Depois de enviar uma resposta, ela não poderá ser alterada.</li>
          <li>Você pode fechar a página e retomar neste navegador durante sete dias.</li>
        </ul>
      </div>
      <p className="mock-disclaimer">Este simulado não é uma prova oficial, não usa questões do ELTiS e não produz pontuação ELTiS de 500–800. Apenas organizações autorizadas aplicam o exame oficial.</p>
      {error && <p className="study-error" role="alert">{error}</p>}
      <button className="primary-button" onClick={start}>Começar simulado</button>
      <a className="text-button" href="https://www.eltistest.com/students/" target="_blank" rel="noreferrer">Consultar informações oficiais do ELTiS</a>
    </section>
  );

  if (snapshot.report) return (
    <section className="mock-report" aria-labelledby="mock-result-heading">
      <p className="eyebrow">Resultado de prática</p>
      <h1 id="mock-result-heading">{snapshot.report.band}</h1>
      <div className="mock-score"><strong>{snapshot.report.percent}%</strong><span>{snapshot.report.correct} de {snapshot.report.total} respostas</span></div>
      <p className="mock-disclaimer">Esta porcentagem é interna do Sparky. Ela não prevê nem converte uma pontuação oficial ELTiS.</p>
      <div className="mock-skill-grid">
        {(Object.entries(snapshot.report.skills) as [EltisSkill, EltisReport["skills"][EltisSkill]][]).map(([skill, score]) => (
          <article key={skill}><span>{skillNames[skill]}</span><strong>{score.percent}%</strong><progress aria-label={`${skillNames[skill]}: ${score.percent}%`} value={score.percent} max={100} /><small>{score.correct}/{score.total}</small></article>
        ))}
      </div>
      <section className="mock-recommendations"><h2>Próximos focos</h2><ul>{snapshot.report.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <div className="mock-actions"><button className="secondary-button" onClick={restart}><RotateCcw size={17} /> Fazer novamente</button><a className="primary-button" href="https://www.eltistest.com/practicetest/eltistest_02_welcome.php" target="_blank" rel="noreferrer">Abrir prática oficial</a></div>
    </section>
  );

  const question = snapshot.question!;
  const allowedPlays = question.maxPlays ?? 1;
  return (
    <section className="mock-session" aria-labelledby="mock-question-heading">
      <header>
        <div><p className="eyebrow">{question.section}</p><h1>{question.section === "Listening" ? "Compreensão auditiva" : "Leitura e linguagem"}</h1></div>
        <span>Questão {(snapshot.index ?? 0) + 1} de {snapshot.total}</span>
      </header>
      <progress value={(snapshot.index ?? 0) + 1} max={snapshot.total} aria-label="Progresso do simulado" />
      {question.audioId && <div className="mock-audio">
        <Headphones size={24} />
        <div><strong>Ouça antes de responder</strong><p>{playCount}/{allowedPlays} reproduções usadas</p></div>
        {playing ? <button className="secondary-button" onClick={stopAudio}><Pause size={17} /> Pausar</button> : <button className="primary-button" disabled={playCount >= allowedPlays} onClick={playAudio}><Play size={17} /> {playCount ? "Ouvir novamente" : "Ouvir"}</button>}
      </div>}
      {question.passage && <article className="mock-passage" lang="en">{question.passage}</article>}
      <fieldset className="mock-question">
        <legend id="mock-question-heading" lang="en">{question.prompt}</legend>
        {question.options.map((option, index) => <label key={option} className={selected === option ? "selected" : ""}><input type="radio" name="eltis-answer" value={option} checked={selected === option} onChange={() => setSelected(option)} /><span>{String.fromCharCode(65 + index)}</span><span lang="en">{option}</span></label>)}
      </fieldset>
      {error && <p className="study-error" role="alert">{error}</p>}
      <footer><button className="text-button" onClick={restart}>Sair do simulado</button><button className="primary-button" disabled={!selected || submitting} onClick={answer}>{submitting ? "Salvando…" : (snapshot.index ?? 0) + 1 === snapshot.total ? "Ver resultado" : "Confirmar e continuar"}</button></footer>
    </section>
  );
}
