"use client";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { X, Check, ArrowRight, RotateCcw, Clock3 } from "lucide-react";
import type { Lesson } from "@/lib/curriculum";
import type { PublicRewardState } from "@/lib/rewards-shared";
import type { LearnerProfile } from "@/lib/onboarding-shared";
import type { Checkpoint, CheckpointStepState } from "@/lib/learning-local";
import { readWorkspace, updateWorkspace, saveCheckpoint, checkpointKey } from "@/lib/learning-local";
import { contentVersion } from "@/lib/content/build";
import { exerciseId, evaluationVersion } from "@/lib/study";
import { lessonSteps, lessonFlowVersion, migrateLessonCheckpoint } from "@/lib/lesson-flow";
import { challengeLimit, challengeScore, activeClockNow, readPersonalRecord, type PracticeMode, type ChallengeState, type PracticeResult } from "@/lib/quick-practice";
import { t, supportT, getSupportLocale, useSupportLanguage, useCurrentInterfaceLanguage, localizeAttribute } from "@/lib/interface-language";
import { primeInterfaceSound, playInterfaceSound } from "@/lib/interface-sound";
import { lessonMetadata } from "@/lib/course-guide";
import MascotMoment from "./mascot-moment";
import styles from "./quick-player.module.css";
const LessonSupport = dynamic(() => import("./lesson-support"), { loading: () => <p role="status">{t("Carregando…")}</p> });
type Props = {
  userId: string; lesson: Lesson; review: boolean; mascot: PublicRewardState["mascot"];
  equipped: PublicRewardState["equipped"]; saving: boolean;
  openerRef?: RefObject<HTMLElement | null>; learnerProfile?: LearnerProfile | null;
  studyMode?: "guided" | "practice"; nextLesson?: Lesson;
  notificationPending?: boolean;
  onClose: () => void; onFinish: (receipt: string, result?: PracticeResult) => Promise<boolean>;
};
type Evidence = { passed: number; failed: number; assisted: number };
export default function LessonPlayer({ userId, lesson, review, mascot, saving, openerRef, learnerProfile, notificationPending, onClose, onFinish }: Props) {
  const supportLanguage = useSupportLanguage();
  useCurrentInterfaceLanguage();
  const [initial] = useState(() => migrateLessonCheckpoint(readWorkspace(userId).checkpoints[checkpointKey(lesson.id, review)], lesson));
  const [personalBest] = useState(() => readPersonalRecord(userId, lesson.id));
  const [upgrade] = useState(() => readWorkspace(userId).restartNotice === true);
  const [phase, setPhase] = useState<"choose" | "active">(initial?.receipt ? "active" : "choose");
  const [ids, setIds] = useState(initial?.exerciseIds);
  const [index, setIndex] = useState(initial?.index ?? 0);
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [tokens, setTokens] = useState<number[]>(initial?.tokens ?? []);
  const [checked, setChecked] = useState(initial?.checked ?? false);
  const [correct, setCorrect] = useState(initial?.correct ?? false);
  const [helped, setHelped] = useState(initial?.assisted ?? false);
  const [supportOpen, setSupportOpen] = useState(initial?.contextVisible ?? false);
  const [receipt, setReceipt] = useState(initial?.receipt ?? "");
  const [sessionId, setSessionId] = useState(initial?.sessionId ?? "");
  const [startedAt, setStartedAt] = useState(initial?.startedAt ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [passed, setPassed] = useState(() => Object.entries(initial?.history ?? {}).reduce((mask, [position, value]) => value.correct ? mask | (1 << Number(position)) : mask, initial?.correct ? 1 << initial.index : 0));
  const [fresh, setFresh] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeState>(initial?.challenge ?? { mode: "normal", activeMs: 0, failed: 0, helped: 0, expired: false });
  const [elapsed, setElapsed] = useState(initial?.challenge?.activeMs ?? 0);
  const clock = useRef(elapsed);
  const responding = useRef(false);
  const lastTick = useRef(0);
  const locked = useRef(false);
  const history = useRef<Record<string, CheckpointStepState>>(initial?.history ?? {});
  const telemetrySeq = useRef(initial?.telemetrySeq ?? 0);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const latest = useRef<Checkpoint | null>(null);
  const tracking = useRef<(kind: string) => void>(() => {});
  const activity = useRef(() => {});
  const steps = lessonSteps(lesson, review, ids);
  const step = steps[index];
  const selected = step.kind === "order_words" ? tokens.map(token => step.options![token]).join(" ") : answer;
  const expired = challenge.mode === "challenge" && (challenge.expired || elapsed >= challengeLimit(lesson.level));
  let streak = 0;
  for (let i = 0; i < steps.length; i++) {
    if (!(passed & (1 << i))) break;
    streak = ((challenge.failed | challenge.helped) & (1 << i)) ? 0 : streak + 1;
  }
  useEffect(() => { tracking.current = kind => {
    if (!sessionId || !receipt) return;
    const data = { receipt, sequence: ++telemetrySeq.current, kind, index, mode: challenge.mode, activeMs: Math.round(clock.current) };
    const payload = JSON.stringify(data);
    if (kind === "abandon" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/learning-events", new Blob([payload], { type: "application/json" }));
    } else void fetch("/api/learning-events", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  }; });
  useEffect(() => {
    activity.current = () => {
      if (!sessionId || !receipt) return;
      void fetch('/api/study', { method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ action: 'activity', receipt, sequence: ++telemetrySeq.current, activeMs: Math.round(clock.current) }),
        signal: AbortSignal.timeout(10000) }).catch(() => {});
    };
  });
  useEffect(() => {
    if (phase !== 'active' || !receipt) return;
    activity.current();
    const pulse = window.setInterval(() => { if (!document.hidden) activity.current(); }, 60000);
    return () => window.clearInterval(pulse);
  }, [phase, receipt]);
  useLayoutEffect(() => {
    const opener = openerRef?.current ?? document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.dataset.sparkyBusy = "lesson";
    const current = dialog.current;
    current?.showModal();
    return () => {
      current?.close(); document.body.style.overflow = previousOverflow;
      delete document.documentElement.dataset.sparkyBusy;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [openerRef]);
  useLayoutEffect(() => {
    if (body.current) body.current.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, [index, phase]);
  useLayoutEffect(() => {
    if (!receipt || phase !== "active" || !ids) return;
    history.current[index] = { answer, tokens, checked, correct, translation: false, assisted: helped,
      contextVisible: supportOpen, revealed: false, listened: false };
    latest.current = { reviewFormat: 3, flowVersion: lessonFlowVersion, lessonId: lesson.id, review, index,
      exerciseId: exerciseId(lesson, step), exerciseIds: ids, sessionId, startedAt,
      answer, tokens, checked, correct, translation: false, assisted: helped, contextVisible: supportOpen,
      revealed: false, listened: false, receipt, draft: initial?.draft ?? "", history: history.current,
      challenge: { ...challenge, activeMs: clock.current }, telemetrySeq: telemetrySeq.current,
      updatedAt: new Date().toISOString(), contentVersion };
    if (!saveCheckpoint(userId, latest.current)) queueMicrotask(() => setStorageError(true));
  }, [userId, lesson, review, index, answer, tokens, checked, correct, helped, supportOpen, receipt, ids, challenge, elapsed, phase, sessionId, startedAt, initial, step]);
  useLayoutEffect(() => {
    responding.current = phase === "active" && !checked && !supportOpen && !busy && !saving && !expired && Boolean(receipt);
    lastTick.current = performance.now();
  }, [phase, checked, supportOpen, busy, saving, expired, receipt]);
  useEffect(() => {
    if (phase !== "active") return;
    let wasVisible = !document.hidden;
    const tick = () => {
      const now = performance.now();
      if (!document.hidden && wasVisible && responding.current && !locked.current) clock.current += Math.max(0, now - lastTick.current);
      lastTick.current = now;
      setElapsed(Math.floor(clock.current / 1000) * 1000);
    };
    const pause = () => {
      lastTick.current = performance.now(); wasVisible = !document.hidden;
      if (document.hidden) {
        activity.current();
        tracking.current("abandon");
        if (latest.current) saveCheckpoint(userId, { ...latest.current, challenge: { ...latest.current.challenge!, activeMs: clock.current }, telemetrySeq: telemetrySeq.current, updatedAt: new Date().toISOString() });
      }
    };
    const leaving = () => {
      tick(); activity.current(); tracking.current("abandon");
      if (latest.current) saveCheckpoint(userId, { ...latest.current, challenge: { ...latest.current.challenge!, activeMs: clock.current }, telemetrySeq: telemetrySeq.current, updatedAt: new Date().toISOString() });
    };
    const timer = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", pause); window.addEventListener("pagehide", leaving);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", pause); window.removeEventListener("pagehide", leaving); };
  }, [phase, userId]);
  useEffect(() => {
    if (!expired || challenge.expired) return;
    queueMicrotask(() => { setChallenge(state => ({ ...state, expired: true })); tracking.current("timeout"); });
  }, [expired, challenge.expired]);
  async function requestStudy(data: Record<string, unknown>) {
    const response = await fetch("/api/study", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(data), signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok) {
      if (["study-expired", "study-out-of-order"].includes(result.error)) {
        setPhase("choose"); setReceipt(""); setIds(undefined); setIndex(0); setAnswer(""); setTokens([]);
        setChecked(false); setCorrect(false); setHelped(false); setPassed(0); history.current = {}; clock.current = 0; setElapsed(0);
        setChallenge(state => ({ ...state, activeMs: 0, failed: 0, helped: 0, expired: false }));
        updateWorkspace(userId, workspace => { const checkpoints = { ...workspace.checkpoints }; delete checkpoints[checkpointKey(lesson.id, review)]; return { ...workspace, checkpoints }; });
        throw new Error("A sessão expirou. Comece a prática novamente; seus textos foram preservados.");
      }
      throw new Error(response.status === 401 ? "Sua sessão expirou. Entre novamente para continuar." : "Não foi possível verificar. Sua resposta continua aqui.");
    }
    return result;
  }
  async function start() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); primeInterfaceSound();
    try {
      const result = await requestStudy({ action: "start", lessonId: lesson.id, review });
      setIds(result.exerciseIds); setReceipt(result.receipt); setSessionId(result.sessionId); setStartedAt(result.startedAt);
      clock.current = 0; setElapsed(0); setPassed(0); setPhase("active"); playInterfaceSound("start");
      updateWorkspace(userId, workspace => ({ ...workspace, restartNotice: false }));
      // The first event uses the receipt just returned, before React renders it.
      void fetch("/api/learning-events", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ receipt: result.receipt, sequence: ++telemetrySeq.current, kind: "start", index: 0, mode: challenge.mode, activeMs: 0 }) }).catch(() => {});
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível iniciar. Tente novamente."); }
    finally { locked.current = false; setBusy(false); }
  }
  function syncClock(now: number) {
    if (responding.current && !document.hidden && !locked.current) clock.current += Math.max(0, now - lastTick.current);
    lastTick.current = now; setElapsed(Math.floor(clock.current / 1000) * 1000);
  }
  async function next() {
    if (locked.current || saving || expired) return;
    syncClock(activeClockNow());
    if (challenge.mode === "challenge" && clock.current >= challengeLimit(lesson.level)) {
      setChallenge(state => ({ ...state, expired: true })); tracking.current("timeout"); return;
    }
    setError(""); primeInterfaceSound();
    if (!checked) {
      if (!selected || !receipt) return;
      locked.current = true; setBusy(true);
      try {
        const result = await requestStudy({ lessonId: lesson.id, review, stepId: exerciseId(lesson, step), answer: selected, assisted: helped, receipt });
        const evidence = result.evidence as Evidence;
        setReceipt(result.receipt); setPassed(evidence.passed); setCorrect(result.correct); setChecked(true);
        setChallenge(state => ({ ...state, failed: evidence.failed, helped: evidence.assisted }));
        setFresh(result.correct);
        if (result.correct) playInterfaceSound("correct");
        if (!updateWorkspace(userId, workspace => ({ ...workspace, attempts: [...workspace.attempts,
          { id: crypto.randomUUID(), lessonId: lesson.id, stepId: exerciseId(lesson, step), answer: selected, correct: result.correct, assisted: helped,
            review, createdAt: new Date().toISOString(), contentVersion, evaluationVersion }].slice(-600) }))) setStorageError(true);
        void fetch("/api/learning-events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
          receipt: result.receipt, sequence: ++telemetrySeq.current, kind: "attempt", index, mode: challenge.mode, activeMs: Math.round(clock.current) }) }).catch(() => {});
      } catch (cause) { setError(cause instanceof Error && !(cause instanceof TypeError || cause instanceof DOMException) ? cause.message : "A conexão falhou. Tente novamente; sua resposta foi preservada."); }
      finally { locked.current = false; setBusy(false); }
      return;
    }
    if (!correct) {
      setChecked(false); setAnswer(""); setTokens([]); setHelped(true); setFresh(false); return;
    }
    if (index === steps.length - 1) {
      locked.current = true; setBusy(true);
      try {
        const result: PracticeResult = { mode: challenge.mode, score: challengeScore((1 << steps.length) - 1, challenge.failed, challenge.helped, steps.length),
          activeMs: Math.round(clock.current), recordEligible: !review && challenge.mode === "challenge" && !challenge.expired && clock.current < challengeLimit(lesson.level), sessionId };
        const finished = await onFinish(receipt, result);
        if (finished) {
          tracking.current("complete");
          updateWorkspace(userId, workspace => { const checkpoints = { ...workspace.checkpoints }; delete checkpoints[checkpointKey(lesson.id, review)]; return { ...workspace, checkpoints }; });
        }
      } catch (cause) {
        if (cause instanceof Error && cause.message === "study-incomplete") {
          setPhase("choose"); setReceipt(""); setIds(undefined); setIndex(0); setPassed(0);
          setAnswer(""); setTokens([]); setChecked(false); setCorrect(false); setHelped(false);
          history.current = {}; clock.current = 0; setElapsed(0);
          setChallenge({ mode: "normal", activeMs: 0, failed: 0, helped: 0, expired: false });
          updateWorkspace(userId, workspace => { const checkpoints = { ...workspace.checkpoints }; delete checkpoints[checkpointKey(lesson.id, review)]; return { ...workspace, checkpoints }; });
          setError("A sessão expirou. Comece a prática novamente; seus textos foram preservados.");
        } else setError("Não foi possível salvar. Tente Concluir novamente; sua prática foi preservada.");
      } finally { locked.current = false; setBusy(false); }
      return;
    }
    setIndex(index + 1); setAnswer(""); setTokens([]); setChecked(false); setCorrect(false); setHelped(false); setSupportOpen(false); setFresh(false);
  }
  function close() {
    if (locked.current || saving) return;
    syncClock(activeClockNow());
    if (latest.current) saveCheckpoint(userId, { ...latest.current, challenge: { ...latest.current.challenge!, activeMs: clock.current }, telemetrySeq: telemetrySeq.current + 1 });
    activity.current(); tracking.current("abandon"); onClose();
  }
  const remaining = Math.max(0, Math.ceil((challengeLimit(lesson.level) - elapsed) / 1000));
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="quick-title" onCancel={event => { event.preventDefault(); close(); }}>
    <header className={styles.header}>
      <button type="button" className="icon-button" onClick={close} disabled={busy || saving} aria-label={localizeAttribute("Fechar lição")}><X size={22}/></button>
      <div className={styles.progress}>
        <span>{t(review ? "Revisão rápida" : lesson.title)}</span>
        {phase === "active" && <progress aria-label={localizeAttribute("Progresso da lição")} value={index + (checked && correct ? 1 : 0)} max={steps.length}/>}
      </div>
      {phase === "active" && <strong aria-label={localizeAttribute("Questão atual")}>{index + 1}/{steps.length}</strong>}
    </header>
    <div ref={body} className={styles.body} data-step-kind={phase === "active" ? step.kind : "launch"}>
      {notificationPending && <p className={styles.caption} role="status">{t('Seu lembrete está guardado. Termine ou feche esta prática para abrir.')}</p>}
      {error && <p className={styles.error} role="alert">{supportT(error)}</p>}
      {storageError && <p className={styles.error} role="status">{t("O navegador bloqueou o salvamento. Mantenha esta aba aberta.")}</p>}
      {phase === "choose" ? <div className={styles.launch}>
        <MascotMoment mascot={mascot} mood="invite" className={styles.mascot}/>
        <p className="eyebrow">{t(review ? "3 questões · 1–2 min" : "6 questões · 2–4 min")}</p>
        <h2 ref={heading} tabIndex={-1} id="quick-title">{t(lesson.title)}</h2>
        <p lang={getSupportLocale()}>{supportT(lessonMetadata[lesson.id]?.outcome ?? lesson.experience.application)}</p>
        {!review && <fieldset className={styles.modes}><legend>{t("Como você quer praticar?")}</legend>
          {(["normal", "challenge"] as PracticeMode[]).map(mode => <label key={mode} data-selected={challenge.mode === mode}>
            <input type="radio" name="practice-mode" value={mode} checked={challenge.mode === mode} onChange={() => setChallenge(state => ({ ...state, mode }))}/>
            <strong>{t(mode === "normal" ? "Normal" : "Desafio")}</strong><small>{t(mode === "normal" ? "No seu ritmo" : "Tempo, pontos e recorde")}</small>
          </label>)}
        </fieldset>}
        {challenge.mode === "challenge" && <p className={styles.caption}>{t("Tempo de resposta:")} {challengeLimit(lesson.level) / 60000} {t("min. O relógio pausa nas dicas e correções.")}</p>}
        {challenge.mode === "challenge" && personalBest && <p className={styles.caption}>{t("Seu recorde:")} {personalBest.score} {t("pontos")} · {Math.round(personalBest.activeMs / 1000)}s</p>}
        {upgrade && <p className={styles.caption} role="status">{t("As lições ficaram mais rápidas. Esta prática começa no novo formato; seu progresso foi preservado.")}</p>}
      </div> : <>
        <div className={styles.topline}>
          <span className="eyebrow">{t(step.kind === "order_words" ? "Organize" : "Escolha")}</span>
          {challenge.mode === "challenge" && <span className={styles.timer} aria-label={localizeAttribute("Tempo restante")}><Clock3 size={15}/> {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} · {challengeScore(passed, challenge.failed, challenge.helped, steps.length)} {t("pontos")}</span>}
          {fresh && streak === 3 && <span className={styles.combo} role="status">{t("3 acertos seguidos!")} ✦</span>}
        </div>
        <h2 id="quick-title" ref={heading} tabIndex={-1} className={styles.prompt} lang={getSupportLocale()}>{supportLanguage === "en" ? step.bodyEnglish ?? supportT(step.body) : step.body}</h2>
        {step.english && <p className={styles.context} lang="en">{step.english}</p>}
        {step.contextHint && <p className={styles.cue} lang={supportLanguage} data-language-role="context-hint">{supportLanguage === "en" ? step.contextHint.english : step.contextHint.portuguese}</p>}
        {step.cue && <p className={styles.cue} lang="pt-BR" data-language-role="stimulus">{step.cue}</p>}
        {step.kind === "order_words" ? <div className={styles.order}>
          <div className={styles.wordAnswer} role="group" aria-label={localizeAttribute("Frase montada")}>
            {tokens.length ? tokens.map(token => <button key={token} type="button" lang="en" disabled={checked || busy || expired}
              onClick={() => setTokens(tokens.filter(value => value !== token))} aria-label={localizeAttribute("Remover palavra") + ": " + step.options![token]}>{step.options![token]} <X size={12}/></button>)
              : <span>{t("Toque nas palavras para montar a frase.")}</span>}
          </div>
          <div className={styles.wordBank} role="group" aria-label={localizeAttribute("Banco de palavras")}>{step.options!.map((word, token) =>
            <button key={token} type="button" lang="en" disabled={tokens.includes(token) || checked || busy || expired} onClick={() => setTokens([...tokens, token])}>{word}</button>)}</div>
          <button className={styles.clear} type="button" disabled={!tokens.length || checked || busy || expired} onClick={() => setTokens([])}><RotateCcw size={15}/>{t("Limpar")}</button>
        </div> : <div className={styles.options} role="group" aria-labelledby="quick-title">{step.options!.map((option, i) =>
          <button key={i} type="button" aria-pressed={answer === option} data-selected={answer === option} disabled={checked || busy || expired} onClick={() => setAnswer(option)}>
            <span className={styles.letter}>{String.fromCharCode(65 + i)}</span><span lang="en">{option}</span>{answer === option && <Check size={18}/>}
          </button>)}</div>}
        {checked && <div className={correct ? styles.correct : styles.retry} role="status" data-answer-feedback>
          <div className={styles.feedbackTitle}>{correct && <MascotMoment mascot={mascot} mood="celebrate" className={styles.reaction}/>}<strong>{t(correct ? "Boa! Você acertou." : "Vamos corrigir.")}</strong></div>
          <p lang={getSupportLocale()}>{supportLanguage === "en" ? step.explanationEnglish ?? supportT(step.explanation) : step.explanation}</p>
          {!correct && <p><span>{t("Resposta:")}</span> <strong lang="en">{step.answer}</strong></p>}
        </div>}
        {expired && <div className={styles.retry} role="status"><strong>{t("O tempo terminou.")}</strong><p>{t("Continue no seu ritmo. Suas respostas continuam salvas.")}</p></div>}
        <details className={styles.support} open={supportOpen}><summary onClick={event => {
          event.preventDefault();
          syncClock(activeClockNow());
          const open = !supportOpen;
          responding.current = !open && !checked && !busy && !saving && !expired;
          setSupportOpen(open);
          if (open && !helped && !checked) { setHelped(true); tracking.current("help"); }
        }}>{t("Entender melhor")}</summary>
          {supportOpen && <LessonSupport lesson={lesson} mascot={mascot} userId={userId} textOnly={learnerProfile?.namePronunciationStatus === "text-only"}/>}
        </details>
      </>}
    </div>
    <footer className={styles.footer}>
      <span className={styles.caption}>{t(phase === "choose" ? "Uma ideia por vez." : helped ? "Com ajuda nesta questão" : "Você pode consultar uma dica.")}</span>
      <button className="primary-button" type="button" disabled={busy || saving || (phase === "active" && !expired && !checked && (!selected || !receipt))}
        onClick={phase === "choose" ? start : expired ? () => { setChallenge(state => ({ ...state, mode: "normal", expired: true })); } : next}>
        {t(busy ? "Verificando…" : saving ? "Salvando…" : phase === "choose" ? "Começar" : expired ? "Continuar no modo normal" : !checked ? "Verificar" : !correct ? "Tentar novamente" : index === steps.length - 1 ? "Concluir" : "Continuar")}<ArrowRight size={18}/>
      </button>
    </footer>
  </dialog>;
}
