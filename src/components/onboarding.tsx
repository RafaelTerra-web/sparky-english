"use client";
import { useEffect, useRef, useState } from "react";
import { MascotFigure } from "./mascot-studio";
import {
  onboardingLevels,
  onboardingSteps,
  validateName,
  type LearnerProfile,
  type OnboardingStep,
} from "@/lib/onboarding-shared";
import { playTimeline, type AudioTimelineSegment } from "@/lib/audio-timeline";
type Snapshot = {
  enabled: boolean;
  profile: LearnerProfile | null;
  revision: number | null;
  draft: (Partial<LearnerProfile> & { step: OnboardingStep }) | null;
  placement: {
    count: number;
    complete: boolean;
    result: { level: string; score: number; confidence: string } | null;
    item: {
      id: string;
      skill: string;
      prompt: string;
      options: string[];
      audio: string | null;
    } | null;
  } | null;
};
const copy: Record<OnboardingStep, string> = {
  welcome:
    "Oi! Eu sou o Sparky. Vamos praticar inglês juntos, um passo de cada vez. Primeiro, quero conhecer você para preparar seu espaço de estudo.",
  name: "Como você gostaria de ser chamado?",
  age: "Enquanto preparo nossa conversa, me conta: quantos anos você tem?",
  mascot: "Quem você quer ao seu lado nas lições?",
  level: "Por onde vamos começar sua jornada no inglês?",
  test: "Vamos descobrir seu ponto de partida. Leia com calma e escolha a melhor resposta.",
  finish: "Seu espaço está quase pronto. Vamos aprender muita coisa juntos!",
};
export default function Onboarding({
  onComplete,
  onCancel,
}: {
  onComplete: (profile: LearnerProfile) => void;
  onCancel: () => void;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [name, setName] = useState(""),
    [age, setAge] = useState(""),
    [consent, setConsent] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [audioState, setAudioState] = useState<
      "idle" | "loading" | "ready" | "failed"
    >("idle"),
    [offline, setOffline] = useState(false),
    [refused, setRefused] = useState(false);
  const audio = useRef<AbortController | null>(null),
    generating = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const draft = snapshot?.draft,
    step = draft?.step ?? "welcome";
  async function request(action: string, values: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    audio.current?.abort();
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          revision: snapshot?.revision,
          ...values,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error);
      if (next.refused) {
        setRefused(true);
        return null;
      }
      setSnapshot(next);
      return next as Snapshot;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível salvar. Tente novamente.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/onboarding", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Não foi possível carregar.");
        return r.json();
      })
      .then(async (data) => {
        if (!data.draft) {
          const r = await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start" }),
          });
          if (!r.ok) throw new Error("Não foi possível iniciar.");
          data = await r.json();
        }
        if (active) {
          setSnapshot(data);
          setName(data.draft?.name ?? "");
          setAge(data.draft?.age?.toString() ?? "");
          setConsent(data.draft?.guardianConsent ?? false);
          if (data.draft?.name) {
            setAudioState('loading');
            void fetch('/api/onboarding/audio', {method:'POST', signal:AbortSignal.timeout(20000)})
              .then(r => r.json()).then(result => {if(active)setAudioState(result.ready?'ready':'failed');})
              .catch(() => {if(active)setAudioState('failed');});
          }
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Não foi possível carregar seu perfil. Atualize para tentar novamente.",
          );
      });
    const online = () => setOffline(!navigator.onLine);
    online();
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      active = false;
      audio.current?.abort();
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  async function generateName() {
    if (generating.current) return;
    generating.current = true;
    setAudioState("loading");
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch("/api/onboarding/audio", {
          method: "POST",
          signal: AbortSignal.timeout(20000),
        });
        const data = await response.json();
        if (data.ready) {
          setAudioState("ready");
          return;
        }
        if (response.status === 429 || response.status === 202) break;
      }
      setAudioState("failed");
    } catch {
      setAudioState("failed");
    } finally {
      generating.current = false;
    }
  }
  async function listen() {
    audio.current?.abort();
    const controller = new AbortController();
    audio.current = controller;
    setError("");
    let segments: AudioTimelineSegment[];
    if (step === "finish" && audioState === "ready")
      segments = [
        { type: "audio", source: "/audio/onboarding/beforeName.wav" },
        { type: "pause", durationMs: 350 },
        { type: "audio", source: "/api/onboarding/audio" },
        { type: "pause", durationMs: 250 },
        { type: "audio", source: "/audio/onboarding/afterName.wav" },
      ];
    else
      segments = [
        {
          type: "audio",
          source: `/audio/onboarding/${step === "finish" ? "fallback" : step}.wav`,
        },
      ];
    try {
      await playTimeline(segments, AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]), setSpeaking);
    } catch {
      if (!controller.signal.aborted)
        setError("O áudio está indisponível. Você pode continuar pelo texto.");
    }
  }
  if (refused)
    return (
      <main className="onboarding">
        <h1>Vamos esperar seu responsável</h1>
        <p>O nome, o áudio provisório e esta personalização foram removidos.</p>
        <button onClick={onCancel}>Sair</button>
      </main>
    );
  return (
    <main className="onboarding" aria-busy={busy}>
      <div className={`onboarding-mascot ${speaking ? "is-speaking" : ""}`}>
        <MascotFigure
          mascot="sparky"
          equipped={{ sparky: {}, pinky: {} }}
          size="large"
        />
      </div>
      <p className="eyebrow">
        Seu começo com o Sparky ·{" "}
        {Math.min(onboardingSteps.indexOf(step) + 1, 7)} de 7
      </p>
      <progress
        aria-label="Progresso da personalização"
        max={7}
        value={onboardingSteps.indexOf(step) + 1}
      />
      <h1 ref={heading} tabIndex={-1}>
        {copy[step]}
      </h1>
      {offline && (
        <p role="alert">
          Você está sem conexão. Suas etapas confirmadas estão salvas; reconecte
          para continuar.
        </p>
      )}
      <p role="status" className="onboarding-status">
        {speaking
          ? "Sparky está falando…"
          : audioState === "loading"
            ? "Sparky está preparando sua saudação…"
            : busy
              ? "Salvando sua escolha…"
              : ""}
      </p>
      {error && <><p role="alert">{error}</p><button className="secondary-button" onClick={() => window.location.reload()}>Recarregar dados salvos</button></>}
      {step !== "test" && (
        <button
          className="secondary-button"
          onClick={speaking ? () => audio.current?.abort() : listen}
        >
          {speaking ? "Parar áudio" : "Ouvir Sparky"}
        </button>
      )}
      {snapshot && (
        <div className="onboarding-body">
          {step === "welcome" && (
            <>
              <p>
                Uma pergunta por vez. Suas escolhas ficam salvas na conta e
                podem ser alteradas depois.
              </p>
              <button
                className="primary-button"
                disabled={busy || offline}
                onClick={() => void request("next")}
              >
                Vamos começar
              </button>
            </>
          )}
          {step === "name" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  validateName(name);
                } catch (e) {
                  setError((e as Error).message);
                  return;
                }
                if (await request("name", { name })) void generateName();
              }}
            >
              <label htmlFor="preferred-name">Meu nome ou apelido</label>
              <input
                id="preferred-name"
                autoComplete="given-name"
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p>
                Ao confirmar, enviamos seu nome ao Google para gerar a saudação
                privada do Sparky. Não inclua sobrenome se não quiser.
              </p>
              <button className="primary-button" disabled={busy || offline}>
                Confirmar nome
              </button>
            </form>
          )}
          {step === "age" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void request("age", {
                  age: Number(age),
                  guardianConsent: consent,
                });
              }}
            >
              <label htmlFor="learner-age">Sua idade</label>
              <input
                id="learner-age"
                type="number"
                min={4}
                max={120}
                step={1}
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
              {Number(age) >= 4 && Number(age) < 13 && (
                <>
                  <label className="onboarding-consent">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    Sou responsável por este aluno e autorizo o perfil e o áudio
                    personalizado conforme a política de privacidade.
                  </label>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void request("refuse")}
                  >
                    Não autorizar e apagar personalização
                  </button>
                </>
              )}
              <a href="/privacidade" target="_blank" rel="noreferrer">
                Como usamos seus dados
              </a>
              <button className="primary-button" disabled={busy || offline}>
                Continuar
              </button>
            </form>
          )}
          {step === "mascot" && (
            <div className="onboarding-choices">
              {(["sparky", "pinky"] as const).map((m) => (
                <button
                  key={m}
                  aria-label={m === "sparky" ? "Sparky" : "Pinky"}
                  disabled={busy || offline}
                  onClick={() => void request("mascot", { mascot: m })}
                >
                  <MascotFigure
                    mascot={m}
                    equipped={{ sparky: {}, pinky: {} }}
                    size="small"
                  />
                  <strong>{m === "sparky" ? "Sparky" : "Pinky"}</strong>
                </button>
              ))}
            </div>
          )}
          {step === "level" && (
            <>
              <p>
                Escolha seu ponto de partida. Isso não apaga lições nem bloqueia
                os outros níveis.
              </p>
              <div className="onboarding-choices">
                {onboardingLevels.map((l, i) => (
                  <button
                    key={l}
                    disabled={busy || offline}
                    onClick={() => void request("level", { level: l })}
                  >
                    <strong>{l}</strong>
                    {
                      [
                        "Iniciante",
                        "Básico",
                        "Intermediário",
                        "Intermediário avançado",
                        "Avançado",
                        "Proficiente",
                      ][i]
                    }
                  </button>
                ))}
              </div>
              <button
                className="primary-button"
                disabled={busy || offline}
                onClick={() => void request("test")}
              >
                {snapshot.placement
                  ? "Retomar diagnóstico"
                  : "Descobrir meu nível · 15–20 min"}
              </button>
              <p>
                Diagnóstico de recepção e uso da língua. Não certifica fluência
                oral ou escrita.
              </p>
            </>
          )}
          {step === "test" && snapshot.placement?.item && (
            <>
              <p>
                {snapshot.placement.count} de até 28 respostas · Você pode
                fechar e retomar depois.
              </p>
              <h2>{snapshot.placement.item.prompt}</h2>
              {snapshot.placement.item.audio && (
                <audio
                  controls
                  preload="none"
                  src={snapshot.placement.item.audio}
                  onError={() =>
                    setError(
                      "Este listening está indisponível. Volte para escolher seu nível ou retome quando o áudio estiver disponível.",
                    )
                  }
                />
              )}
              <div className="onboarding-answers">
                {snapshot.placement.item.options.map((option, index) => (
                  <button
                    key={index}
                    disabled={busy || offline}
                    onClick={() =>
                      void request("answer", {
                        id: snapshot.placement!.item!.id,
                        answer: index,
                      })
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p>As respostas confirmadas não podem ser alteradas.</p>
            </>
          )}
          {step === "finish" && (
            <>
              <h2>Pronto, {draft?.name}!</h2>
              <p>
                Seu ponto de partida: <strong>{draft?.level}</strong> ·{" "}
                {draft?.mascot === "pinky" ? "Pinky" : "Sparky"} acompanha suas
                lições.
              </p>
              {draft?.levelMethod === "placement" && (
                <p>
                  Score interno: {draft.score}/100. Evidência do diagnóstico:{" "}
                  {draft.confidence}. Esta estimativa não foi calibrada como
                  exame oficial.
                </p>
              )}
              <p>
                O progresso e as compras que você já tinha continuam na sua
                conta.
              </p>
              {audioState !== "ready" && (
                <button
                  className="secondary-button"
                  disabled={audioState === "loading"}
                  onClick={() => void generateName()}
                >
                  {audioState === "loading"
                    ? "Preparando saudação…"
                    : "Preparar minha saudação"}
                </button>
              )}
              <button
                className="primary-button"
                disabled={busy || offline}
                onClick={async () => {
                  setBusy(true);
                  await listen();
                  const result = await request("finish");
                  if (result?.profile) onComplete(result.profile);
                }}
              >
                Entrar no meu espaço
              </button>
            </>
          )}
          {step !== "welcome" && (
            <button
              className="secondary-button"
              disabled={busy || offline}
              onClick={() => void request("back")}
            >
              ← Voltar
            </button>
          )}
        </div>
      )}
    </main>
  );
}
