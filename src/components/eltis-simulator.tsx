"use client";
import { t, localizeAttribute } from "@/lib/interface-language";

import { examRecommendations } from "@/lib/course-guide";
import { skills } from "@/lib/course-metadata";
import { updateWorkspace } from "@/lib/learning-local";
import type { Lesson, Level } from "@/lib/curriculum";
import { Headphones, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { EltisReport, EltisSkill, PublicEltisItem } from "@/lib/eltis-shared";
import { claimAudioPlayback, releaseAudioPlayback } from "@/lib/audio-playback";

type Snapshot = { token: string; question?: PublicEltisItem; index?: number; total?: number; finished?: boolean; report?: EltisReport };
const skillNames: Record<EltisSkill, string> = { listening: "Listening", reading: "Leitura", vocabulary: "Vocabulário", grammar: "Gramática" };

export function EltisSimulator({ userId, mascot = "sparky", level = "B1", completed = {}, onOpen }: { userId: string; mascot?: "sparky" | "pinky"; level?: Level; completed?: Record<string,string>; onOpen?: (lesson:Lesson)=>void }) {
  const key = `sparky-mock-eltis:${userId}`;
  const audio = useRef<HTMLAudioElement | null>(null);
  const sending = useRef(false);
  const heading = useRef<HTMLLegendElement>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [snapshot?.question?.id]);

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
    if (data.report) updateWorkspace(userId,current=>({...current,examFocus:{completedAt:data.report.completedAt,skills:Object.fromEntries(Object.entries(data.report.skills as EltisReport["skills"]).map(([skill,score])=>[skill,score.percent]))}}));
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
    if (!snapshot?.token || !selected || sending.current) return;
    sending.current = true;
    stopAudio();
    setSubmitting(true);
    try {
      const next = await request({ action: "answer", token: snapshot.token, answer: selected });
      setSelected("");
      setPlayCount(0);
      setPaused(false);
      audio.current = null;
      if (next.finished) localStorage.removeItem(key);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar a resposta.");
    } finally { sending.current = false; setSubmitting(false); }
  }

  function stopAudio() {
    audio.current?.pause();
    if (audio.current) releaseAudioPlayback(audio.current);
    setPaused(Boolean(audio.current && !audio.current.ended && audio.current.currentTime > 0));
    setPlaying(false);
  }

  async function playAudio() {
    const question = snapshot?.question;
    if (paused && audio.current) {
      claimAudioPlayback(audio.current);
      try { await audio.current.play(); setPlaying(true); setPaused(false); }
      catch { releaseAudioPlayback(audio.current); setError("Não foi possível retomar o áudio. Tente novamente."); }
      return;
    }
    if (!question?.audioId || playing || playCount >= (question.maxPlays ?? 1)) return;
    const sound = new Audio(`/audio/exams/v2/${question.audioId}-${mascot}.mp3`);
    audio.current = sound;
    claimAudioPlayback(sound);
    sound.onended = () => { releaseAudioPlayback(sound); setPlaying(false); setPaused(false); };
    sound.onpause = () => { setPlaying(false); setPaused(!sound.ended && sound.currentTime > 0); };
    sound.onerror = () => { releaseAudioPlayback(sound); setPlaying(false); setError("O áudio não carregou. Verifique a conexão antes de responder."); };
    try {
      await sound.play();
      setPlayCount((count) => count + 1);
      setPlaying(true);
    } catch {
      releaseAudioPlayback(sound);
      setError("Não foi possível tocar o áudio neste navegador.");
    }
  }

  function restart() {
    stopAudio();
    localStorage.removeItem(key);
    setSnapshot(null);
    setSelected("");
    setPlayCount(0);
    setPaused(false);
    audio.current = null;
    setError("");
  }

  if (loading) return <section className="mock-loading" role="status">{t("Preparando o simulado…")}</section>;
  if (!snapshot) return (
    <section className="mock-intro" aria-labelledby="eltis-heading">
      <div className="mock-mark"><Headphones size={28} /><span>{t("INTERCÂMBIO")}</span></div>
      <div>
        <p className="eyebrow">{t("Preparação para exames")}</p>
        <h1 id="eltis-heading">{t("Simulado ELTiS")}</h1>
        <p>{t("Prática autoral compacta para o inglês usado em escolas dos Estados Unidos: instruções, aulas, leitura, vocabulário e gramática em contexto.")}</p>
      </div>
      <div className="mock-facts">
        <span><strong>24</strong>{t(" questões")}</span><span><strong>2</strong>{t(" seções")}</span><span><strong>25–35</strong>{t(" minutos")}</span>
      </div>
      <div className="mock-guidance">
        <h2>{t("Antes de começar")}</h2>
        <ul>
          <li>{t("Use fones de ouvido. Os áudios tocam uma vez; o problema de matemática toca até duas.")}</li>
          <li>{t("Depois de enviar uma resposta, ela não poderá ser alterada.")}</li>
          <li>{t("Você pode fechar a página e retomar neste navegador durante sete dias.")}</li>
        </ul>
      </div>
      <p className="mock-disclaimer">{t("Este simulado não é uma prova oficial, não usa questões do ELTiS e não produz pontuação ELTiS de 500–800. Apenas organizações autorizadas aplicam o exame oficial.")}</p>
      {error && <p className="study-error" role="alert">{t(error)}</p>}
      <button className="primary-button" onClick={start}>{t("Começar simulado")}</button>
      <a className="text-button" href="https://www.eltistest.com/students/" target="_blank" rel="noreferrer">{t("Consultar informações oficiais do ELTiS")}</a>
    </section>
  );

  if (snapshot.report) return (
    <section className="mock-report" aria-labelledby="mock-result-heading">
      <p className="eyebrow">{t("Resultado de prática")}</p>
      <h1 id="mock-result-heading">{t(snapshot.report.band)}</h1>
      <div className="mock-score"><strong>{t(snapshot.report.percent)}%</strong><span>{t(snapshot.report.correct)}{t(" de")}{t(snapshot.report.total)}{t(" respostas")}</span></div>
      <p className="mock-disclaimer">{t("Esta porcentagem é interna do Sparky. Ela não prevê nem converte uma pontuação oficial ELTiS.")}</p>
      <div className="mock-skill-grid">
        {(Object.entries(snapshot.report.skills) as [EltisSkill, EltisReport["skills"][EltisSkill]][]).map(([skill, score]) => (
          <article key={skill}><span>{t(skillNames[skill])}</span><strong>{t(score.percent)}%</strong><progress aria-label={localizeAttribute(`${skillNames[skill]}: ${score.percent}%`)} value={score.percent} max={100} /><small>{t(score.correct)}/{t(score.total)}</small></article>
        ))}
      </div>
      <section className="mock-recommendations"><h2>{t("Próximos focos")}</h2><ul>{snapshot.report.recommendations.map((item) => <li key={item}>{t(item)}</li>)}</ul></section>
      {onOpen&&<section className="exam-lesson-recommendations"><h2>{t('Pratique estas duas lições')}</h2><p>{t('Escolhidas pela habilidade com menor resultado, em contexto escolar, próximas do seu nível recomendado.')}</p>{examRecommendations({completedAt:snapshot.report.completedAt,skills:Object.fromEntries(Object.entries(snapshot.report.skills).map(([skill,score])=>[skill,score.percent]))},level,completed).map(({lesson,skill})=><article key={lesson.id}><p>{t(skills[skill])} · {lesson.level} · {t('Escola e intercâmbio')}</p><button className="secondary-button" onClick={()=>onOpen(lesson)}>{t(lesson.title)}</button></article>)}</section>}
      <div className="mock-actions"><button className="secondary-button" onClick={restart}><RotateCcw size={17} />{t(" Fazer novamente")}</button><a className="primary-button" href="https://www.eltistest.com/practicetest/eltistest_02_welcome.php" target="_blank" rel="noreferrer">{t("Abrir prática oficial")}</a></div>
    </section>
  );

  const question = snapshot.question!;
  const allowedPlays = question.maxPlays ?? 1;
  return (
    <section className="mock-session" aria-labelledby="mock-question-heading">
      <header>
        <div><p className="eyebrow">{t(question.section)}</p><h1>{t(question.section === "Listening" ? "Compreensão auditiva" : "Leitura e linguagem")}</h1></div>
        <span>{t("Questão")}{t((snapshot.index ?? 0) + 1)}{t(" de")}{t(snapshot.total)}</span>
      </header>
      <progress value={(snapshot.index ?? 0) + 1} max={snapshot.total} aria-label={localizeAttribute("Progresso do simulado")} />
      {question.audioId && <div className="mock-audio">
        <Headphones size={24} />
        <div><strong>{t("Ouça antes de responder")}</strong><p>{t(playCount)}/{t(allowedPlays)}{t(" reproduções usadas")}</p></div>
        {playing ? <button className="secondary-button" onClick={stopAudio}><Pause size={17} />{t(" Pausar")}</button> : <button className="primary-button" disabled={submitting || (!paused && playCount >= allowedPlays)} onClick={playAudio}><Play size={17} /> {t(paused ? "Retomar áudio" : playCount ? "Ouvir novamente" : "Ouvir")}</button>}
      </div>}
      {question.passage && <article className="mock-passage" lang="en">{t(question.passage)}</article>}
      <fieldset className="mock-question" disabled={submitting} aria-describedby="mock-confirmation-hint">
        <legend id="mock-question-heading" ref={heading} tabIndex={-1} lang="en">{t(question.prompt)}</legend>
        {question.options.map((option, index) => <label key={option} className={selected === option ? "selected" : ""}><input type="radio" name="eltis-answer" value={option} checked={selected === option} onChange={() => setSelected(option)} /><span>{t(String.fromCharCode(65 + index))}</span><span lang="en">{t(option)}</span></label>)}
      </fieldset>
      <p id="mock-confirmation-hint" className="mock-confirmation-hint" role="status">{t(selected ? "Resposta selecionada. Você pode trocar de alternativa antes de confirmar." : "Selecione uma alternativa e confirme sua resposta para avançar.")}</p>
      {error && <p className="study-error" role="alert">{t(error)}</p>}
      <footer><button className="text-button" disabled={submitting} onClick={restart}>{t("Encerrar tentativa")}</button><button className="primary-button" disabled={!selected || submitting} onClick={answer}>{t(submitting ? "Salvando…" : (snapshot.index ?? 0) + 1 === snapshot.total ? "Confirmar e ver resultado" : "Confirmar e continuar")}</button></footer>
    </section>
  );
}
