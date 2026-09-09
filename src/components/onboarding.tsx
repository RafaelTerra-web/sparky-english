"use client";
import { t, localizeAttribute, useCurrentInterfaceLanguage } from "@/lib/interface-language";
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
import { preparePersonalAudio } from "@/lib/prepare-personal-audio";
type Snapshot = {
  enabled: boolean;
  profile: LearnerProfile | null;
  revision: number | null;
  draft: (Partial<LearnerProfile> & { step: OnboardingStep; pronunciationOnly?: boolean }) | null;
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
  pronunciation: "Só mais uma coisa antes de seguir…",
  mascot: "Quem você quer ao seu lado nas lições?",
  level: "Por onde vamos começar sua jornada no inglês?",
  test: "Escolha uma resposta e confirme quando estiver pronto.",
  finish: "Seu espaço está quase pronto. Vamos aprender muita coisa juntos!",
};
export default function Onboarding({
  onComplete,
  onCancel,
  editing = false,
}: {
  onComplete: (profile: LearnerProfile) => void;
  onCancel: () => void;
  editing?: boolean;
}) {
  const language = useCurrentInterfaceLanguage();
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
  const [pronunciation, setPronunciation] = useState("");
  const [heardPronunciation, setHeardPronunciation] = useState(false);
  const [adjustingPronunciation, setAdjustingPronunciation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<{ id: string; answer: number } | null>(null);
  const audio = useRef<AbortController | null>(null),
    generating = useRef<AbortController | null>(null),
    submitting = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const draft = snapshot?.draft,
    step = draft?.step ?? "welcome";
  async function request(action: string, values: Record<string, unknown> = {}) {
    if (submitting.current) return null;
    submitting.current = true;
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
      submitting.current = false;
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
          setPronunciation(data.draft?.namePronunciation ?? data.draft?.name ?? "");
          if (data.draft?.name && data.draft?.namePronunciationStatus !== 'text-only') {
            setAudioState('loading');
            const controller = new AbortController();
            generating.current = controller;
            void preparePersonalAudio('/api/onboarding/audio?occasion=confirmation', AbortSignal.any([controller.signal, AbortSignal.timeout(70000)]))
              .then(() => {if(active && !controller.signal.aborted)setAudioState('ready');})
              .catch(() => {if(active && !controller.signal.aborted)setAudioState('failed');})
              .finally(() => {if(generating.current === controller)generating.current = null;});
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
      generating.current?.abort();
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [step, snapshot?.placement?.item?.id]);
  async function generateName() {
    generating.current?.abort();
    const controller = new AbortController();
    generating.current = controller;
    setHeardPronunciation(false);
    setAudioState("loading");
    try {
      await preparePersonalAudio("/api/onboarding/audio?occasion=confirmation", AbortSignal.any([controller.signal, AbortSignal.timeout(70000)]));
      if (!controller.signal.aborted) setAudioState("ready");
    } catch {
      if (!controller.signal.aborted) setAudioState("failed");
    } finally {
      if (generating.current === controller) generating.current = null;
    }
  }
  async function listen() {
    audio.current?.abort();
    const controller = new AbortController();
    audio.current = controller;
    setError("");
    let segments: AudioTimelineSegment[];
    if (step === "pronunciation") segments = [{ type: "audio", source: "/api/onboarding/audio?occasion=confirmation" }];
    else
      segments = [
        {
          type: "audio",
          source: `/audio/onboarding/${step === "finish" ? "fallback" : step}.wav`,
        },
      ];
    try {
      await playTimeline(segments, AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]), active => {
        if (audio.current === controller) setSpeaking(active);
      });
      if (step === "pronunciation" && !controller.signal.aborted) setHeardPronunciation(true);
    } catch {
      if (!controller.signal.aborted)
        setError("O áudio está indisponível. Você pode continuar pelo texto.");
    }
  }
  if (refused)
    return (
      <main className="onboarding">
        <h1>{t("Vamos esperar seu responsável")}</h1>
        <p>{t("O nome, o áudio provisório e esta personalização foram removidos.")}</p>
        <button onClick={onCancel}>{editing ? "← " : ""}{t(editing ? "Perfil" : "Sair")}</button>
      </main>
    );
  return (
    <main className="onboarding" aria-busy={busy}>
      {editing && <button className="text-button" onClick={onCancel}>← {t("Perfil")}</button>}
      <div className={`onboarding-mascot ${speaking ? "is-speaking" : ""}`}>
        <MascotFigure
          mascot="sparky"
          equipped={{ sparky: {}, pinky: {} }}
          size="large"
        />
      </div>
      <p className="eyebrow">{t("Seu começo com o Sparky ·")}{t(" ")}
        {t(Math.min(onboardingSteps.indexOf(step) + 1, onboardingSteps.length))}{t(" de")}{t(onboardingSteps.length)}
      </p>
      <progress
        aria-label={localizeAttribute("Progresso da personalização")}
        max={onboardingSteps.length}
        value={onboardingSteps.indexOf(step) + 1}
      />
      <h1 ref={heading} tabIndex={-1}>
        {t(copy[step])}
      </h1>
      {offline && (
        <p role="alert">{t("Você está sem conexão. Suas etapas confirmadas estão salvas; reconecte para continuar.")}</p>
      )}
      <p role="status" className="onboarding-status">
        {t(speaking
          ? "Sparky está falando…"
          : audioState === "loading"
            ? "Sparky está preparando sua saudação…"
            : busy
              ? "Salvando sua escolha…"
              : "")}
      </p>
      {error && <><p role="alert">{t(error)}</p><button className="secondary-button" onClick={() => window.location.reload()}>{t("Recarregar dados salvos")}</button></>}
      {language !== "en" && step !== "test" && step !== "pronunciation" && (
        <button
          className="secondary-button"
          onClick={speaking ? () => audio.current?.abort() : listen}
        >
          {t(speaking ? "Parar áudio" : "Ouvir Sparky")}
        </button>
      )}
      {snapshot && (
        <div className="onboarding-body">
          {step === "welcome" && (
            <>
              <p>{t("Uma pergunta por vez. Suas escolhas ficam salvas na conta e podem ser alteradas depois.")}</p>
              <button
                className="primary-button"
                disabled={busy || offline}
                onClick={() => void request("next")}
              >{t("Vamos começar")}</button>
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
                const next = await request("name", { name });
                if (next) { setPronunciation(next.draft?.namePronunciation ?? name); void generateName(); }
              }}
            >
              <label htmlFor="preferred-name">{t("Meu nome ou apelido")}</label>
              <input
                id="preferred-name"
                autoComplete="given-name"
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p>{t("Ao confirmar, enviamos seu nome ao Google para gerar a saudação privada do Sparky. Não inclua sobrenome se não quiser.")}</p>
              <button className="primary-button" disabled={busy || offline}>{t("Confirmar nome")}</button>
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
              <label htmlFor="learner-age">{t("Sua idade")}</label>
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
                    />{t("Sou responsável por este aluno e autorizo o perfil e o áudio personalizado conforme a política de privacidade.")}</label>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void request("refuse")}
                  >{t("Não autorizar e apagar personalização")}</button>
                </>
              )}
              <a href="/privacidade" target="_blank" rel="noreferrer">{t("Como usamos seus dados")}</a>
              <button className="primary-button" disabled={busy || offline}>{t("Continuar")}</button>
            </form>
          )}
          {step === "pronunciation" && (
            <section className="name-pronunciation" aria-label={localizeAttribute("Confirmar a pronúncia do nome")}>
              <p className="sparky-name-question">{t("Que bom conhecer você,")}<strong>{t(draft?.name)}</strong>{t("! Me conta: falei seu nome do jeito certo?")}</p>
              <button className="secondary-button" disabled={busy || offline || audioState !== "ready" || pronunciation !== (draft?.namePronunciation ?? draft?.name)} onClick={speaking ? () => audio.current?.abort() : listen}>
                {t(speaking ? "Parar áudio" : heardPronunciation ? "Ouvir de novo" : "Ouvir Sparky")}
              </button>
              {audioState !== "ready" && <button className="secondary-button" disabled={busy || offline || audioState === "loading"} onClick={() => void generateName()}>{t(audioState === "loading" ? "Preparando pronúncia…" : "Tentar preparar a pronúncia")}</button>}
              {adjustingPronunciation && <><p>{t("Vamos acertar juntos. O Sparky vai usar a pronúncia brasileira. Escreva como seu nome soa: pode usar acentos ou separar as sílabas, como “An sél mo”. Essa escrita serve só para orientar a voz; seu nome no perfil continua igual.")}</p>
              <form onSubmit={async event => {
                event.preventDefault();
                try { validateName(pronunciation); } catch (e) { setError((e as Error).message); return; }
                audio.current?.abort(); generating.current?.abort(); setHeardPronunciation(false);
                if (await request("pronunciation", { pronunciation })) void generateName();
              }}>
                <label htmlFor="name-pronunciation">{t("Como se pronuncia seu nome?")}</label>
                <input id="name-pronunciation" value={pronunciation} maxLength={100} autoComplete="off" onChange={e => { setPronunciation(e.target.value); setHeardPronunciation(false); audio.current?.abort(); }} required />
                <button className="secondary-button" disabled={busy || offline || audioState === "loading"}>{t("Salvar ajuste e gerar novamente")}</button>
              </form>
              </>}
              {!heardPronunciation && <p>{t("Ouça a fala do Sparky para conferir.")}</p>}
              <button className="primary-button" disabled={busy || offline || !heardPronunciation || audioState !== "ready" || pronunciation !== (draft?.namePronunciation ?? draft?.name)} onClick={async () => {
                const result = await request("confirm-pronunciation", { status: "confirmed" });
                if (result?.profile?.onboardingCompleted && !result.draft) onComplete(result.profile);
              }}>{t("Sim, falou certinho!")}</button>
              {!adjustingPronunciation && <button className="secondary-button" disabled={busy || offline} onClick={() => { audio.current?.abort(); setHeardPronunciation(false); setAdjustingPronunciation(true); }}>{t("Não, vamos ajustar")}</button>}
              <button className="text-button" disabled={busy || offline} onClick={async () => {
                generating.current?.abort();
                const result = await request("confirm-pronunciation", { status: "text-only" });
                if (result) setAudioState("idle");
                if (result?.profile?.onboardingCompleted && !result.draft) onComplete(result.profile);
              }}>{t("Ajustar depois e continuar sem o nome falado")}</button>
            </section>
          )}
          {step === "mascot" && (
            <div className="onboarding-choices">
              {(["sparky", "pinky"] as const).map((m) => (
                <button
                  key={m}
                  aria-label={localizeAttribute(m === "sparky" ? "Sparky" : "Pinky")}
                  disabled={busy || offline}
                  onClick={() => void request("mascot", { mascot: m })}
                >
                  <MascotFigure
                    mascot={m}
                    equipped={{ sparky: {}, pinky: {} }}
                    size="small"
                  />
                  <strong>{t(m === "sparky" ? "Sparky" : "Pinky")}</strong>
                </button>
              ))}
            </div>
          )}
          {step === "level" && (
            <>
              <p>{t("Escolha seu ponto de partida. Isso não apaga lições nem bloqueia os outros níveis.")}</p>
              <div className="onboarding-choices">
                {onboardingLevels.map((l, i) => (
                  <button
                    key={l}
                    disabled={busy || offline}
                    onClick={() => void request("level", { level: l })}
                  >
                    <strong>{t(l)}</strong>
                    {
                      t([
                        "Iniciante",
                        "Básico",
                        "Intermediário",
                        "Intermediário avançado",
                        "Avançado",
                        "Proficiente",
                      ][i])
                    }
                  </button>
                ))}
              </div>
              <button
                className="primary-button"
                disabled={busy || offline}
                onClick={() => void request("test")}
              >
                {t(snapshot.placement
                  ? "Retomar diagnóstico"
                  : "Descobrir meu nível · 15–20 min")}
              </button>
              <p>{t("Diagnóstico de recepção e uso da língua. Não certifica fluência oral ou escrita.")}</p>
            </>
          )}
          {step === "test" && snapshot.placement?.item && (
            <>
              <p>
                {t(snapshot.placement.count)}{t(" de até 28 respostas · Você pode fechar e retomar depois.")}</p>
              <h2 className="placement-command">{t(snapshot.placement.item.prompt)}</h2>
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
              <div className="onboarding-answers" role="group" aria-label={localizeAttribute("Alternativas da questão")}>
                {snapshot.placement.item.options.map((option, index) => (
                  <button
                    key={index}
                    disabled={busy || offline}
                    aria-pressed={selectedAnswer?.id === snapshot.placement!.item!.id && selectedAnswer.answer === index}
                    onClick={() => setSelectedAnswer({ id: snapshot.placement!.item!.id, answer: index })}
                  >
                    {t(option)}
                  </button>
                ))}
              </div>
              <p>{t("Você pode trocar de alternativa antes de confirmar. Depois do envio, a resposta não pode ser alterada.")}</p>
              <button className="primary-button" disabled={busy || offline || selectedAnswer?.id !== snapshot.placement.item.id} onClick={async () => {
                if (!selectedAnswer || selectedAnswer.id !== snapshot.placement?.item?.id) return;
                const result = await request("answer", { id: selectedAnswer.id, answer: selectedAnswer.answer });
                if (result) setSelectedAnswer(null);
              }}>{t(busy ? "Enviando resposta…" : "Confirmar resposta")}</button>
            </>
          )}
          {step === "finish" && (
            <>
              <h2>{t("Pronto,")}{t(draft?.name)}!</h2>
              <p>{t("Seu ponto de partida: ")}<strong>{t(draft?.level)}</strong> ·{t(" ")}
                {t(draft?.mascot === "pinky" ? "Pinky" : "Sparky")}{t(" acompanha suas lições.")}</p>
              {draft?.levelMethod === "placement" && (
                <p>{t("Score interno: ")}{t(draft.score)}{t("/100. Evidência do diagnóstico:")}{t(" ")}
                  {t(draft.confidence)}{t(". Esta estimativa não foi calibrada como exame oficial.")}</p>
              )}
              <p>{t("O progresso e as compras que você já tinha continuam na sua conta.")}</p>
              {audioState !== "ready" && draft?.namePronunciationStatus !== "text-only" && (
                <button
                  className="secondary-button"
                  disabled={audioState === "loading"}
                  onClick={() => void generateName()}
                >
                  {t(audioState === "loading"
                    ? "Preparando saudação…"
                    : "Preparar minha saudação")}
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
              >{t("Entrar no meu espaço")}</button>
            </>
          )}
          {step !== "welcome" && !draft?.pronunciationOnly && (
            <button
              className="secondary-button"
              disabled={busy || offline}
              onClick={() => void request("back")}
            >{t("← Voltar")}</button>
          )}
        </div>
      )}
    </main>
  );
}
