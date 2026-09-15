"use client";

import { localizeAttribute, t, supportT, getSupportLocale } from "@/lib/interface-language";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Headphones,
  Mic,
  PhoneOff,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Target,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  callApi,
  newCallIdempotencyKey,
  safeCallAudioUrl,
  type CallFeedback,
  type CallPhase,
  type CallSnapshot,
  type CallTurn,
} from "./call-client";
import { recordedBlobToWav } from "./call-audio";
import { claimAudioPlayback, releaseAudioPlayback } from "@/lib/audio-playback";
import styles from "./call-experience.module.css";

const MAX_TURN_MS = 45_000;

type RecorderState = {
  recorder: MediaRecorder;
  stream: MediaStream;
  chunks: Blob[];
  timer: ReturnType<typeof setTimeout>;
};

export type CallExperienceProps = {
  learnerName?: string;
  initialLevel?: string;
  mascot?: "sparky" | "pinky";
  scenarioId?: string;
  apiUrl?: string;
  storageKey?: string;
  onBack?: () => void;
  onComplete?: (snapshot: CallSnapshot) => void;
};

function phaseCopy(phase: CallPhase, mascotName: string) {
  switch (phase) {
    case "connecting": return "Preparando a conversa…";
    case "listening": return "Estou ouvindo você";
    case "thinking": return `${mascotName} está preparando uma resposta`;
    case "speaking": return `${mascotName} está falando`;
    case "ending": return "Preparando seu feedback…";
    case "complete": return "Conversa concluída";
    case "error": return "A conversa foi pausada";
    default: return "Sua vez quando estiver pronto";
  }
}

function recorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function speakerName(turn: CallTurn, learnerName: string) {
  if (turn.speaker === "learner") return learnerName || "Você";
  return turn.speaker === "pinky" ? "Pinky" : "Sparky";
}

function FeedbackCard({ feedback }: { feedback: CallFeedback }) {
  return (
    <section className={styles.feedback} aria-labelledby="call-feedback-heading">
      <div className={styles.sectionHeading}>
        <span className={styles.iconBox}><Sparkles aria-hidden="true" size={19} /></span>
        <div><p>{t("Feedback pedagógico")}</p><h2 id="call-feedback-heading">{t(feedback.title)}</h2></div>
      </div>
      <p>{t(feedback.message)}</p>
      <div className={styles.feedbackGrid}>
        {feedback.strength && <article><strong>{t("Você mandou bem")}</strong><p>{t(feedback.strength)}</p></article>}
        {feedback.nextStep && <article><strong>{t("Próximo passo")}</strong><p>{t(feedback.nextStep)}</p></article>}
      </div>
    </section>
  );
}

export function CallExperience({
  learnerName = "",
  initialLevel = "B1",
  mascot = "sparky",
  scenarioId,
  apiUrl = "/api/call",
  storageKey,
  onBack,
  onComplete,
}: CallExperienceProps) {
  const mascotName = mascot === "pinky" ? "Pinky" : "Sparky";
  const [snapshot, setSnapshot] = useState<CallSnapshot>({
    title: "Conversa guiada",
    context: "Pratique uma situação real com apoio durante toda a conversa.",
    level: initialLevel,
    phase: "setup",
    turns: [],
    objectives: [],
  });
  const [error, setError] = useState("");
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied" | "unsupported">("unknown");
  const [elapsed, setElapsed] = useState(0);
  const [playbackNeeded, setPlaybackNeeded] = useState(false);
  const recorder = useRef<RecorderState | null>(null);
  const request = useRef<AbortController | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioObjectUrl = useRef<string | null>(null);
  const transcriptEnd = useRef<HTMLDivElement | null>(null);
  const sessionStartedAt = useRef<number | null>(null);
  const current = useRef(snapshot);
  current.current = snapshot;

  const active = ["ready", "listening", "thinking", "speaking"].includes(snapshot.phase);
  const canRecord = Boolean(permission !== "unsupported" && typeof window !== "undefined" && "MediaRecorder" in window && navigator.mediaDevices?.getUserMedia);
  const completedObjectives = snapshot.objectives.filter((objective) => objective.completed).length;
  const progress = snapshot.objectives.length ? Math.round(snapshot.objectives.reduce((sum, objective) => sum + objective.progress, 0) / snapshot.objectives.length) : 0;
  const update = useCallback((next: CallSnapshot) => {
    current.current = next;
    setSnapshot(next);
  }, []);

  const cleanupRecorder = useCallback(() => {
    const state = recorder.current;
    if (!state) return;
    clearTimeout(state.timer);
    state.stream.getTracks().forEach((track) => track.stop());
    recorder.current = null;
  }, []);

  const stopPlayback = useCallback(() => {
    const sound = audio.current;
    if (sound) {
      sound.onended = sound.onerror = null;
      releaseAudioPlayback(sound);
      sound.pause();
      sound.removeAttribute("src");
      sound.load();
      audio.current = null;
    }
    if (audioObjectUrl.current) URL.revokeObjectURL(audioObjectUrl.current);
    audioObjectUrl.current = null;
  }, []);

  useEffect(() => {
    return () => {
      request.current?.abort();
      if (recorder.current?.recorder.state === "recording") {
        recorder.current.recorder.onstop = null;
        recorder.current.recorder.stop();
      }
      cleanupRecorder();
      stopPlayback();
    };
  }, [cleanupRecorder, stopPlayback]);

  useEffect(() => {
    const pausePrivateMedia = () => {
      if (!document.hidden) return;
      const activeRecorder = recorder.current?.recorder;
      if (activeRecorder?.state === "recording") {
        activeRecorder.onstop = null;
        activeRecorder.stop();
        cleanupRecorder();
        setError("A gravação foi cancelada porque você saiu da tela.");
        update({ ...current.current, phase: "ready" });
      }
      stopPlayback();
    };
    document.addEventListener("visibilitychange", pausePrivateMedia);
    return () => document.removeEventListener("visibilitychange", pausePrivateMedia);
  }, [cleanupRecorder, stopPlayback, update]);

  useEffect(() => {
    if (!active || !sessionStartedAt.current) return;
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - sessionStartedAt.current!) / 1_000)));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [snapshot.turns.length]);

  useEffect(() => {
    if (!storageKey) return;
    const key = `sparky-call-session:${storageKey}`;
    let saved: { sessionId?: string; startedAt?: number } | null = null;
    try { saved = JSON.parse(localStorage.getItem(key) ?? "null"); } catch { localStorage.removeItem(key); }
    if (!saved?.sessionId) return;
    const controller = new AbortController();
    request.current = controller;
    update({ ...current.current, phase: "connecting" });
    void callApi(`${apiUrl}?sessionId=${encodeURIComponent(saved.sessionId)}`, { method: "GET" }, current.current, controller.signal, update)
      .then((restored) => {
        if (controller.signal.aborted) return;
        sessionStartedAt.current = typeof saved?.startedAt === "number" ? saved.startedAt : Date.now();
        update({ ...restored, phase: restored.phase === "complete" ? "complete" : "ready" });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        localStorage.removeItem(key);
        update({ ...current.current, sessionId: undefined, phase: "setup" });
        setError("A conversa anterior expirou. Você pode começar uma nova Call.");
      });
    return () => controller.abort();
  }, [apiUrl, storageKey, update]);

  async function run(init: RequestInit, phase: CallPhase) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const pending = { ...current.current, phase };
    update(pending);
    try {
      const next = await callApi(apiUrl, init, pending, controller.signal, update);
      return next;
    } catch (cause) {
      if (controller.signal.aborted) return null;
      const message = cause instanceof Error ? cause.message : "Não foi possível continuar a conversa.";
      setError(message);
      update({ ...current.current, phase: "error" });
      return null;
    }
  }

  async function startCall() {
    setError("");
    setPlaybackNeeded(false);
    const next = await run({
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": newCallIdempotencyKey() },
      body: JSON.stringify({ action: "start", ...(scenarioId ? { topic: scenarioId } : {}), level: initialLevel, mascot, locale: "pt-BR" }),
    }, "connecting");
    if (!next) return;
    sessionStartedAt.current = Date.now();
    if (storageKey && next.sessionId) localStorage.setItem(`sparky-call-session:${storageKey}`, JSON.stringify({ sessionId: next.sessionId, startedAt: sessionStartedAt.current }));
    update({ ...next, phase: next.phase === "connecting" || next.phase === "setup" ? "ready" : next.phase });
    const lastAssistant = [...next.turns].reverse().find((turn) => turn.speaker !== "learner" && (turn.audioUrl || turn.audioData));
    if (lastAssistant) await playTurn(lastAssistant, next);
  }

  async function playTurn(turn: CallTurn, base = current.current) {
    stopPlayback();
    let source = safeCallAudioUrl(turn.audioUrl);
    if (!source && turn.audioData && turn.audioMimeType === "audio/wav") {
      try {
        const binary = atob(turn.audioData);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        audioObjectUrl.current = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
        source = audioObjectUrl.current;
      } catch {
        source = null;
      }
    }
    if (!source) return;
    const sound = new Audio(source);
    sound.preload = "auto";
    audio.current = sound;
    claimAudioPlayback(sound);
    update({ ...base, phase: "speaking" });
    setPlaybackNeeded(false);
    const finish = () => {
      if (audio.current !== sound) return;
      releaseAudioPlayback(sound);
      audio.current = null;
      if (audioObjectUrl.current === source) {
        URL.revokeObjectURL(source);
        audioObjectUrl.current = null;
      }
      update({ ...current.current, phase: "ready" });
    };
    sound.onended = finish;
    sound.onerror = () => {
      setPlaybackNeeded(true);
      finish();
    };
    try {
      await sound.play();
    } catch {
      setPlaybackNeeded(true);
      finish();
    }
  }

  async function startRecording() {
    if (!canRecord || !active || ["thinking", "speaking"].includes(snapshot.phase)) return;
    setError("");
    setPlaybackNeeded(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mimeType = recorderMimeType();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined);
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      mediaRecorder.onerror = () => {
        cleanupRecorder();
        setError("O microfone foi interrompido. Tente novamente.");
        update({ ...current.current, phase: "ready" });
      };
      mediaRecorder.onstop = () => void submitRecording(new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" }));
      const timer = setTimeout(() => { if (mediaRecorder.state === "recording") mediaRecorder.stop(); }, MAX_TURN_MS);
      recorder.current = { recorder: mediaRecorder, stream, chunks, timer };
      setPermission("granted");
      update({ ...current.current, phase: "listening" });
      mediaRecorder.start(250);
    } catch (cause) {
      cleanupRecorder();
      const denied = cause instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(cause.name);
      setPermission(denied ? "denied" : "unsupported");
      setError(denied ? "Permita o microfone nas configurações do navegador para participar da conversa." : "Este navegador não conseguiu iniciar o microfone.");
      update({ ...current.current, phase: "ready" });
    }
  }

  function stopRecording() {
    if (recorder.current?.recorder.state === "recording") recorder.current.recorder.stop();
  }

  async function submitRecording(blob: Blob) {
    cleanupRecorder();
    if (!blob.size || !current.current.sessionId) {
      setError("Não recebemos áudio deste turno. Tente falar um pouco mais perto do microfone.");
      update({ ...current.current, phase: "ready" });
      return;
    }
    update({ ...current.current, phase: "thinking" });
    let wav: Blob;
    try {
      wav = await recordedBlobToWav(blob);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível preparar seu áudio.");
      update({ ...current.current, phase: "ready" });
      return;
    }
    const form = new FormData();
    form.set("action", "turn");
    form.set("sessionId", current.current.sessionId);
    form.set("audio", wav, "turn.wav");
    const before = current.current.turns.length;
    const next = await run({ method: "POST", headers: { "Idempotency-Key": newCallIdempotencyKey() }, body: form }, "thinking");
    if (!next) return;
    const assistantTurn = next.turns.slice(before).findLast((turn) => turn.speaker !== "learner")
      ?? [...next.turns].findLast((turn) => turn.speaker !== "learner");
    if (assistantTurn?.audioUrl || assistantTurn?.audioData) await playTurn(assistantTurn, next);
    else update({ ...next, phase: "ready" });
  }

  async function endCall() {
    stopPlayback();
    if (recorder.current?.recorder.state === "recording") {
      recorder.current.recorder.onstop = null;
      recorder.current.recorder.stop();
      cleanupRecorder();
    }
    if (!current.current.sessionId) return;
    const next = await run({
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": newCallIdempotencyKey() },
      body: JSON.stringify({ action: "end", sessionId: current.current.sessionId }),
    }, "ending");
    if (!next) return;
    const complete = { ...next, phase: "complete" as const };
    if (storageKey) localStorage.removeItem(`sparky-call-session:${storageKey}`);
    update(complete);
    onComplete?.(complete);
  }

  function retry() {
    setError("");
    if (snapshot.sessionId) update({ ...snapshot, phase: "ready" });
    else void startCall();
  }

  const time = useMemo(() => `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`, [elapsed]);
  const latestPlayable = [...snapshot.turns].reverse().find((turn) => turn.speaker !== "learner" && (turn.audioUrl || turn.audioData));

  if (snapshot.phase === "setup") {
    return (
      <main className={styles.shell} aria-labelledby="call-heading">
        <button className={styles.back} type="button" onClick={onBack}><ArrowLeft size={18} />{t("Voltar")}</button>
        <section className={styles.intro}>
          <div className={styles.heroMark} aria-hidden="true"><Headphones size={30} /></div>
          <p className={styles.eyebrow}>{t("Prática de conversação")}</p>
          <h1 id="call-heading">{t("Call com")}{t(` ${mascotName}`)}</h1>
          <p>{t("Converse em inglês em uma situação real. Você recebe apoio durante a prática e feedback claro ao terminar.")}</p>
          <div className={styles.introFacts}>
            <span><Target size={18} /><strong>{t("Objetivos no seu nível")}</strong></span>
            <span><Volume2 size={18} /><strong>{t("Voz e legendas")}</strong></span>
            <span><ShieldCheck size={18} /><strong>{t("Áudio enviado com segurança")}</strong></span>
          </div>
          <div className={styles.privacyNote}>
            <strong>{t("Antes de começar")}</strong>
            <p lang={getSupportLocale()}>{supportT("O microfone só liga quando você tocar em Falar. Cada gravação termina quando você tocar em Enviar ou após 45 segundos.")}</p>
          </div>
          {error && <p className={styles.error} role="alert">{supportT(error)}</p>}
          <button className={styles.primary} type="button" onClick={startCall}>
            <Mic size={19} />{t("Iniciar Call")}
          </button>
        </section>
      </main>
    );
  }

  if (snapshot.phase === "complete") {
    return (
      <main className={styles.shell} aria-labelledby="call-complete-heading">
        <section className={styles.complete}>
          <span className={styles.completeMark}><Check aria-hidden="true" size={28} /></span>
          <p className={styles.eyebrow}>{t("Prática concluída")}</p>
          <h1 id="call-complete-heading">{t("Boa conversa")}{learnerName ? t(`, ${learnerName}`) : ""}!</h1>
          {snapshot.summary && <p lang={getSupportLocale()}>{supportT(snapshot.summary)}</p>}
          <div className={styles.completeStats}>
            <span><strong>{snapshot.turns.filter((turn) => turn.speaker === "learner").length}</strong>{t(" turnos falados")}</span>
            <span><strong>{completedObjectives}/{snapshot.objectives.length}</strong>{t(" objetivos")}</span>
            <span><strong>{time}</strong>{t(" de prática")}</span>
          </div>
          {snapshot.feedback && <FeedbackCard feedback={snapshot.feedback} />}
          <div className={styles.completeActions}>
            <button className={styles.secondary} type="button" onClick={() => {
              sessionStartedAt.current = null;
              setElapsed(0);
              setError("");
              update({ ...snapshot, sessionId: undefined, turns: [], feedback: undefined, summary: undefined, phase: "setup" });
            }}><RotateCcw size={17} />{t("Praticar novamente")}</button>
            <button className={styles.primary} type="button" onClick={onBack}>{t("Continuar estudando")}</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell} aria-labelledby="call-session-heading">
      <header className={styles.topbar}>
        <button className={styles.iconButton} type="button" onClick={onBack} aria-label={localizeAttribute("Sair da Call")}><ArrowLeft size={20} /></button>
        <div className={styles.topTitle}>
          <span>{t(snapshot.title)}</span>
          <small>{snapshot.level || initialLevel} · {time}</small>
        </div>
        <button className={styles.endButton} type="button" disabled={snapshot.phase === "ending" || snapshot.phase === "connecting" || !snapshot.turns.some((turn) => turn.speaker === "learner")} onClick={endCall}><PhoneOff size={17} />{t("Encerrar")}</button>
      </header>

      <div className={styles.progressRow}>
        <progress value={progress} max={100} aria-label={localizeAttribute(`Progresso dos objetivos: ${progress}%`)} />
        <span>{progress}%</span>
      </div>

      <div className={styles.sessionGrid}>
        <aside className={styles.objectives} aria-labelledby="call-objectives-heading">
          <div className={styles.sectionHeading}>
            <span className={styles.iconBox}><Target aria-hidden="true" size={19} /></span>
            <div><p>{t("Meta da conversa")}</p><h2 id="call-objectives-heading">{t("Seus objetivos")}</h2></div>
          </div>
          {snapshot.context && <p className={styles.context}>{supportT(snapshot.context)}</p>}
          {snapshot.objectives.length ? <ul>{snapshot.objectives.map((objective) => (
            <li key={objective.id} className={objective.completed ? styles.objectiveDone : ""}>
              <span>{objective.completed ? <CheckCircle2 aria-hidden="true" size={18} /> : <span aria-hidden="true" className={styles.objectiveDot} />}</span>
              <div><strong>{t(objective.label)}</strong>{objective.description && <small>{supportT(objective.description)}</small>}</div>
            </li>
          ))}</ul> : <div className={styles.objectiveSkeleton} aria-label={localizeAttribute("Objetivos sendo preparados")}><span /><span /><span /></div>}
        </aside>

        <section className={styles.conversation} aria-labelledby="call-transcript-heading">
          <div className={styles.sectionHeading}>
            <span className={styles.iconBox}><Headphones aria-hidden="true" size={19} /></span>
            <div><p>{t("Ao vivo")}</p><h2 id="call-transcript-heading">{t("Conversa")}</h2></div>
          </div>
          <div className={styles.transcript} role="log" aria-live="polite" aria-relevant="additions text">
            {snapshot.turns.length ? snapshot.turns.map((turn) => (
              <article key={turn.id} className={`${styles.turn} ${turn.speaker === "learner" ? styles.learnerTurn : styles.mascotTurn}`}>
                <div className={styles.turnMeta}><strong>{t(speakerName(turn, learnerName))}</strong>{turn.isPartial && <span>{t("transcrevendo…")}</span>}</div>
                <p lang={turn.speaker === "learner" ? "en" : "en"}>{turn.text}</p>
                {turn.translation && <details><summary>{t("Ver apoio em português")}</summary><p lang="pt-BR">{turn.translation}</p></details>}
              </article>
            )) : <div className={styles.emptyTranscript}>
              <Volume2 aria-hidden="true" size={25} />
              <p>{t(snapshot.phase === "connecting" ? "Preparando o primeiro turno…" : `${mascotName} vai começar a conversa. Ouça e responda em inglês.`)}</p>
            </div>}
            {snapshot.feedback && snapshot.turns.some((turn) => turn.speaker === "learner") && <article className={styles.turnFeedback}>
              <strong>{t("Dica deste turno")}</strong>
              <p lang={getSupportLocale()}>{supportT(snapshot.feedback.message)}</p>
              {snapshot.feedback.nextStep && <small>{supportT(snapshot.feedback.nextStep)}</small>}
            </article>}
            <div ref={transcriptEnd} />
          </div>

          <footer className={styles.controls}>
            <div className={`${styles.liveState} ${styles[snapshot.phase]}`} role="status" aria-live="polite">
              <span className={styles.statePulse} aria-hidden="true" />
              <div><strong>{t(phaseCopy(snapshot.phase, mascotName))}</strong><small>{t(snapshot.phase === "listening" ? "Fale em inglês e toque em Enviar ao terminar." : snapshot.phase === "ready" ? "Toque no microfone para responder." : "Você pode acompanhar o texto acima.")}</small></div>
            </div>
            {error && <p className={styles.error} role="alert">{supportT(error)}</p>}
            {permission === "denied" && <p className={styles.permissionHelp}>{supportT("Abra as permissões deste site no navegador e permita o uso do microfone.")}</p>}
            <div className={styles.controlButtons}>
              {snapshot.phase === "listening" ? (
                <button className={`${styles.micButton} ${styles.recording}`} type="button" onClick={stopRecording} aria-label={localizeAttribute("Parar gravação e enviar resposta")}><Square size={22} /><span>{t("Enviar")}</span></button>
              ) : (
                <button className={styles.micButton} type="button" disabled={!canRecord || !active || snapshot.phase !== "ready"} onClick={startRecording} aria-label={localizeAttribute("Ligar microfone e começar a falar")}><Mic size={24} /><span>{t("Falar")}</span></button>
              )}
              {snapshot.phase === "speaking" && <button className={styles.secondary} type="button" onClick={() => { stopPlayback(); update({ ...current.current, phase: "ready" }); }}><Square size={17} />{t("Parar áudio")}</button>}
              {(playbackNeeded || (snapshot.phase === "ready" && latestPlayable)) && latestPlayable && <button className={styles.secondary} type="button" onClick={() => void playTurn(latestPlayable)}><Play size={17} />{t("Ouvir resposta")}</button>}
              {snapshot.phase === "error" && <button className={styles.secondary} type="button" onClick={retry}>{t("Tentar novamente")}</button>}
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
