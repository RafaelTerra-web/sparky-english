"use client";
import { t, localizeAttribute, useCurrentInterfaceLanguage } from "@/lib/interface-language";
import { useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { playTimeline, createPlaybackContext } from "@/lib/audio-timeline";
import { pronunciationConfirmed, type LearnerProfile } from "@/lib/onboarding-shared";
import { personalVoiceText } from "@/lib/personal-voice-shared";
import { preparePersonalAudio } from "@/lib/prepare-personal-audio";

export function PersonalSparkyMessage({ profile, occasion, onPronunciation }: {
  profile: LearnerProfile;
  occasion: "welcome" | "practice";
  onPronunciation?: () => void;
}) {
  const language = useCurrentInterfaceLanguage();
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function play() {
    if (controller.current) { controller.current.abort(); return; }
    const current = new AbortController(); controller.current = current;
    setState("loading"); setError("");
    const url = `/api/onboarding/audio?occasion=${occasion}`;
    let context: AudioContext | undefined;
    const stop = () => { if (context && context.state !== "closed") void context.close(); };
    current.signal.addEventListener("abort", stop, { once: true });
    try {
      context = createPlaybackContext();
      await context?.resume();
      const signal = AbortSignal.any([current.signal, AbortSignal.timeout(65000)]);
      await preparePersonalAudio(url, signal);
      await playTimeline([{ type: "audio", source: url }], signal, speaking => { if (speaking) setState("playing"); }, context);
    } catch (e) {
      if (!current.signal.aborted) setError(e instanceof Error ? e.message : "Não foi possível ouvir agora.");
    } finally { current.signal.removeEventListener("abort", stop); stop(); if (controller.current === current) { controller.current = null; setState("idle"); } }
  }
  return <aside className="sparky-checkin" aria-label={localizeAttribute("Um recado do Sparky")}>
    <p className="eyebrow">{t("Sparky com você")}</p>
    <p>{t(personalVoiceText(profile.name, occasion))}</p>
    {language === "en" ? null : pronunciationConfirmed(profile) ? <button type="button" className="text-button" onClick={() => void play()}>
      {state === "idle" ? <Volume2 size={17} aria-hidden="true" /> : <Square size={17} aria-hidden="true" />}
      {t(state === "loading" ? "Preparando recado… Cancelar" : state === "playing" ? "Parar recado" : "Ouvir recado do Sparky")}
    </button> : onPronunciation && <button type="button" className="text-button" onClick={onPronunciation}>{t("Ensinar meu nome ao Sparky")}</button>}
    {error && <p role="status">{t(error)}</p>}
  </aside>;
}
