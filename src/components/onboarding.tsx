"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { t, supportT, localizeAttribute, useSupportLanguage, useCurrentInterfaceLanguage } from "@/lib/interface-language";
import { quickOnboardingStage } from "@/lib/quick-onboarding";
import { onboardingLevels, type LearnerProfile } from "@/lib/onboarding-shared";
import { levelDescriptions } from "@/lib/levels";
import { claimAudioPlayback, releaseAudioPlayback } from "@/lib/audio-playback";
import { rememberOpeningMascot } from "@/lib/opening-mascot";
import MascotMoment from "./mascot-moment";

const NameSettings = dynamic(() => import("./onboarding-settings"));
type Snapshot = {
  enabled: boolean; profile: LearnerProfile | null; revision: number | null;
  draft: (Partial<LearnerProfile> & { step: string; pronunciationOnly?: boolean }) | null;
  placement: { count: number; complete: boolean; result: { level: string; score: number; confidence: string } | null; item: { id: string; prompt: string; options: string[]; audio: string | null } | null } | null;
};
type Props = { onComplete: (profile: LearnerProfile) => void; onCancel: () => void; editing?: boolean };
export default function Onboarding(props: Props) {
  const supportLanguage = useSupportLanguage();
  useCurrentInterfaceLanguage();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [consent, setConsent] = useState(false);
  const [mascot, setMascot] = useState<"sparky" | "pinky">("sparky");
  const [level, setLevel] = useState("A1");
  const [selected, setSelected] = useState<{ id: string; answer: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const stage = quickOnboardingStage(snapshot?.draft);
  const testing = stage === 1 && snapshot?.draft?.step === "test" && snapshot.placement?.item;
  useEffect(() => {
    const controller = new AbortController();
    document.documentElement.dataset.sparkyBusy = "onboarding";
    (async () => {
      const response = await fetch("/api/onboarding", { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Não foi possível carregar seu perfil.");
      let data: Snapshot = await response.json();
      if (!data.draft) {
        const started = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }), signal: controller.signal });
        if (!started.ok) throw new Error("Não foi possível iniciar seu perfil.");
        data = await started.json();
      }
      if (controller.signal.aborted) return;
      setSnapshot(data); setName(data.draft?.name ?? ""); setAge(String(data.draft?.age ?? ""));
      setConsent(Boolean(data.draft?.guardianConsent)); setMascot(data.draft?.mascot ?? "sparky"); setLevel(data.draft?.level ?? "A1");
    })().catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => { controller.abort(); delete document.documentElement.dataset.sparkyBusy; };
  }, []);
  const questionNumber = testing ? snapshot?.placement?.count : undefined;
  useEffect(() => { heading.current?.focus(); }, [stage, questionNumber]);
  async function request(action: string, values: Record<string, unknown> = {}) {
    if (sending.current || !snapshot) return;
    sending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, revision: snapshot.revision, ...values }), signal: AbortSignal.timeout(15000) });
      const data: Snapshot & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
      setSnapshot(data); setSelected(null);
      if (action === "quick-finish" && data.profile?.onboardingCompleted) {
        rememberOpeningMascot(data.profile.mascot); props.onComplete(data.profile);
      }
      if (action === "cancel-edit") props.onCancel();
    } catch (e) { setError(e instanceof Error ? e.message : "Verifique a conexão e tente novamente."); }
    finally { sending.current = false; setBusy(false); }
  }
  if (snapshot?.draft?.pronunciationOnly) return <NameSettings {...props} />;
  return <main className="quick-onboarding">
    <section className="quick-onboarding-card" aria-busy={busy}>
      <div className="quick-onboarding-top"><span>Sparky English</span><span>{stage + 1}/3</span></div>
      <progress max={3} value={stage + 1} aria-label={localizeAttribute("Etapas do cadastro")} />
      {error && <p role="alert" className="notice" lang={supportLanguage}>{supportT(error)}</p>}
      {!snapshot ? <p role="status">{t("Carregando…")}</p> : <>
        <h1 ref={heading} tabIndex={-1}>{t(stage === 0 ? "Seu perfil" : stage === 1 ? "Seu ponto de partida" : "Vamos praticar?")}</h1>
        {stage === 0 && <form onSubmit={e => { e.preventDefault(); void request("quick-profile", { name, age: Number(age), guardianConsent: consent }); }}>
          <label>{t("Como quer ser chamado?")}<input autoComplete="given-name" value={name} onChange={e => setName(e.target.value)} required maxLength={100} /></label>
          <label>{t("Idade")}<input type="number" inputMode="numeric" min={4} max={120} value={age} onChange={e => setAge(e.target.value)} required /></label>
          {age && Number(age) < 13 && <label className="quick-consent" lang={supportLanguage}><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required />{supportT("Sou responsável e autorizo esta personalização.")}</label>}
          <p><span lang={supportLanguage}>{supportT("Usamos nome e idade para adaptar seu estudo.")}</span> <a href="/privacidade">{t("Como seus dados são usados")}</a></p>
          <button className="primary-button" disabled={busy}>{t(busy ? "Salvando…" : "Continuar")}</button>
        </form>}
        {stage === 1 && <>{testing ? <div className="quick-placement">
          <p>{t("Nivelamento opcional")} · {snapshot.placement!.count + 1}/28</p>
          <h2 lang="en">{testing.prompt}</h2>
          {testing.audio && <audio key={testing.id} controls preload="none" src={testing.audio} onPlay={event => claimAudioPlayback(event.currentTarget)} onEnded={event => releaseAudioPlayback(event.currentTarget)} onError={event => releaseAudioPlayback(event.currentTarget)} />}
          <div className="quick-options">{testing.options.map((option, i) => <button key={i} className="secondary-button" aria-pressed={selected?.id === testing.id && selected.answer === i} disabled={busy} onClick={() => setSelected({ id: testing.id, answer: i })}><span lang="en">{option}</span></button>)}</div>
          <button className="primary-button" disabled={busy || selected?.id !== testing.id} onClick={() => void request("answer", selected ?? {})}>{t("Confirmar resposta")}</button>
          <button className="text-button" disabled={busy} onClick={() => void request("quick-back", { stage: 1 })}>{t("Escolher meu nível")}</button>
        </div> : <>
          <p lang={supportLanguage}>{supportT("Escolha um nível. Você pode mudar depois.")}</p>
          <div className="quick-levels">{onboardingLevels.map(item => <button key={item} className="secondary-button" aria-pressed={level === item} onClick={() => setLevel(item)} disabled={busy}><strong>{item}</strong>{t(levelDescriptions[item])}</button>)}</div>
          <button className="primary-button" disabled={busy} onClick={() => void request("level", { level })}>{t("Continuar")}</button>
          <details className="quick-placement-details"><summary>{t("Quer descobrir seu nível?")}</summary><p>{t("Nivelamento opcional · 15–20 min")}</p><button className="secondary-button" disabled={busy} onClick={() => void request("test")}>{t("Fazer nivelamento")}</button></details>
        </>}</>}
        {stage === 2 && <>
          <p lang={supportLanguage}>{supportT("Escolha sua companhia para seis questões rápidas.")}</p>
          <div className="quick-mascots">{(["sparky", "pinky"] as const).map(item => <button className="secondary-button" key={item} aria-pressed={mascot === item} disabled={busy} onClick={() => setMascot(item)}><MascotMoment mascot={item} mood="invite" /><strong>{item === "sparky" ? "Sparky" : "Pinky"}</strong></button>)}</div>
          <p><strong>{snapshot.draft?.level}</strong> · {t("6 questões · 2–4 min")}</p>
          <button className="primary-button" disabled={busy} onClick={() => void request("quick-finish", { mascot })}>{t(busy ? "Salvando…" : "Começar a praticar")}</button>
        </>}
        {stage > 0 && !testing && <button className="text-button" disabled={busy} onClick={() => void request("quick-back", { stage: stage - 1 })}>{t("Voltar")}</button>}
        {props.editing && <button className="text-button" disabled={busy} onClick={() => void request("cancel-edit")}>{t("Cancelar")}</button>}
      </>}
    </section>
  </main>;
}
