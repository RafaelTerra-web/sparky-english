"use client";
import { t, localizeAttribute, supportT, getSupportLocale, targetText } from "@/lib/interface-language";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { BrowserSpeechProvider, chooseTranscript, compareTranscript, recognitionMessage, type MascotVoice } from "@/lib/speech";
import { lessonAudio } from "@/lib/voice-assets";
import { claimAudioPlayback, releaseAudioPlayback } from "@/lib/audio-playback";

export function SpeechPractice({ lessonId, text, initialMascot = "sparky", onPlayed, personalVoiceDisabled = false }: { lessonId: string; text: string; initialMascot?: MascotVoice; onPlayed?: () => void; personalVoiceDisabled?: boolean }) {
  const provider = useRef<BrowserSpeechProvider | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const personalAudio = useRef<string | null>(null);
  const voiceRequest = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const [canRecognize, setCanRecognize] = useState(false);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "speaking" | "starting" | "listening">("idle");
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);
  const hasResult = useRef(false);
  const id = useId();
  const mascotName = initialMascot === "sparky" ? "Sparky" : "Pinky";
  const nameVoiceOff = personalVoiceDisabled && lessonId === "a1-1-1";
  const source = nameVoiceOff ? null : lessonAudio(lessonId, text, initialMascot);
  const personalized = !nameVoiceOff && !source && lessonId === "a1-1-1";
  const busy = state !== "idle";
  const comparison = transcript ? compareTranscript(text, transcript) : null;

  function release() {
    voiceRequest.current?.abort();
    generation.current++;
    provider.current?.stop();
    if (playbackTimer.current) clearTimeout(playbackTimer.current);
    playbackTimer.current = null;
    if (audio.current) {
      releaseAudioPlayback(audio.current);
      audio.current.onended = audio.current.onerror = audio.current.onplaying = audio.current.onpause = null;
      audio.current.pause();
      audio.current.removeAttribute("src");
      audio.current.load();
      audio.current = null;
    }
    busyRef.current = false;
  }
  useEffect(() => {
    const speech = new BrowserSpeechProvider();
    provider.current = speech;
    const timer = window.setTimeout(() => setCanRecognize(speech.canRecognize()), 0);
    const hide = () => {
      if (document.hidden) {
        release(); setState("idle"); setTranscript(""); setMessage("Prática pausada ao sair da aba.");
      }
    };
    const pagehide = () => release();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", pagehide);
    return () => {
      clearTimeout(timer); release(); provider.current = null;
      if (personalAudio.current) URL.revokeObjectURL(personalAudio.current);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", pagehide);
    };
  }, []);
  function stop() {
    release(); setState("idle"); setMessage("Áudio e microfone parados.");
  }
  function listen() {
    if (!provider.current || !consent || !canRecognize || busyRef.current) return;
    release(); busyRef.current = true;
    setTranscript(""); setMessage(""); setState("starting"); hasResult.current = false;
    provider.current.recognize("en-US", {
      onStart: () => setState("listening"),
      onResult: (value, alternatives) => {
        hasResult.current = true; setTranscript(chooseTranscript(text, alternatives ?? [value]));
      },
      onError: code => { hasResult.current = true; setMessage(recognitionMessage(code)); },
      onEnd: () => {
        busyRef.current = false; setState("idle");
        if (!hasResult.current) setMessage("Nenhuma fala recebida. Tente novamente quando estiver pronto.");
      },
    });
  }
  async function speak(rate: 0.75 | 1) {
    if ((!source && !personalized) || busyRef.current) return;
    release(); busyRef.current = true;
    const attempt = generation.current;
    setMessage(""); setState("loading");
    let playbackSource = source;
    if (personalized) {
      try {
        if (!personalAudio.current) {
          const controller = new AbortController();
          voiceRequest.current = controller;
          const response = await fetch("/api/lesson-voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, text, mascot: initialMascot }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(70000)]) });
          if (!response.ok) throw new Error("voice");
          const blob = await response.blob();
          if (attempt !== generation.current) return;
          personalAudio.current = URL.createObjectURL(blob);
        }
        playbackSource = personalAudio.current;
      } catch {
        if (attempt === generation.current) { release(); setState("idle"); setMessage("Não foi possível preparar a frase com seu nome. Tente novamente mais tarde."); }
        return;
      }
    }
    const sound = new Audio(playbackSource!);
    sound.playbackRate = rate;
    sound.preservesPitch = true;
    setPlaybackRate(rate);
    audio.current = sound;
    claimAudioPlayback(sound);
    const finish = (error = "") => {
      if (attempt !== generation.current) return;
      release(); setState("idle"); setMessage(error);
    };
    sound.onplaying = () => { if (attempt === generation.current) { setState("speaking"); onPlayed?.(); } };
    sound.onended = () => finish();
    sound.onpause = () => finish();
    sound.onerror = () => finish("Não foi possível carregar o áudio. Confira a conexão e tente novamente.");
    playbackTimer.current = setTimeout(() => finish("O áudio demorou demais. Tente novamente."), 60000);
    try { await sound.play(); }
    catch { finish("Não foi possível iniciar o áudio. Toque em Ouvir para tentar novamente."); }
  }
  return (
    <section className="speech-practice speech-studio" aria-label={localizeAttribute("Ouvir e praticar fala")}>
      <div className="speech-mascot-heading">
        <Image src={initialMascot === "sparky" ? "/visuals/sparky-panda.png" : "/visuals/pinky-v2.png"} alt={localizeAttribute("")} width={64} height={64} />
        <div><p className="eyebrow">{t("Prática guiada")}</p><h3>{t("Fale com")}{t(mascotName)}</h3><p lang={getSupportLocale()}>{supportT("Voz gerada por IA · inglês natural")}</p></div>
      </div>
      <p lang={getSupportLocale()}>{supportT("Ouça a frase, perceba o ritmo e tente repeti-la.")}{supportT(mascotName)}{supportT(" lê apenas o conteúdo da lição.")}</p>
      <div className="speech-buttons">
        <button className="secondary-button" disabled={busy || (!source && !personalized)} onClick={() => speak(1)}>
          <Volume2 size={17} />{t(" Ouvir natural")}</button>
        <button className="secondary-button" disabled={busy || (!source && !personalized)} onClick={() => speak(0.75)}>
          <Volume2 size={17} />{t(" Ouvir devagar")}</button>
        {busy && <button className="secondary-button" onClick={stop}><Square size={16} />{t(" Parar")}</button>}
      </div>
      {nameVoiceOff ? <p lang={getSupportLocale()} className="speech-unavailable">{supportT("Você escolheu continuar sem o nome falado. Para ativar este áudio, ajuste a pronúncia do nome no Perfil. Você pode praticar a frase com o microfone.")}</p> : !source && !personalized && <p lang={getSupportLocale()} className="speech-unavailable">{supportT("O áudio desta lição ainda não foi publicado. Você pode praticar a frase com o microfone.")}</p>}
      <details className="speech-consent">
        <summary>{t("Praticar com o microfone")}</summary>
        <p lang={getSupportLocale()}>{supportT("O navegador pode enviar sua fala ao serviço de reconhecimento dele. O Sparky não guarda gravações nem transcrições. A escuta dura até 20 segundos; você pode parar quando quiser.")}</p>
        <label className="speech-checkbox" htmlFor={id}>
          <input id={id} type="checkbox" checked={consent} onChange={event => {
            setConsent(event.target.checked);
            if (!event.target.checked) { release(); setState("idle"); setTranscript(""); }
          }} />{supportT(" Autorizo o microfone nesta prática.")}</label>
        <button className="primary-button" disabled={busy || !consent || !canRecognize} onClick={listen}>
          <Mic size={17} />{t(" Começar a falar")}</button>
        {!canRecognize && <p lang={getSupportLocale()}>{supportT(recognitionMessage("not-supported"))}</p>}
      </details>
      <p lang={getSupportLocale()} className="speech-live-status" role="status" aria-live="polite">
        {supportT(state === "loading" ? "Carregando áudio…" : state === "speaking" ? `${mascotName} está falando ${playbackRate < 1 ? "devagar" : "em velocidade natural"}…` :
          state === "starting" ? "Aguardando o microfone…" : state === "listening" ? "Ouvindo você…" : message)}
      </p>
      {comparison && (
        <div className="speech-result">
          <strong>{t("O serviço de voz entendeu:")}</strong><p lang="en">{targetText(transcript.slice(0, 2000))}</p>
          <p lang={getSupportLocale()}>{supportT(comparison.limited ? "A fala ficou longa demais para esta frase. Repita apenas o exemplo." :
            comparison.exact ? comparison.nameVariantAccepted ? "Frase reconhecida. A variação de escrita do nome foi aceita." : "A transcrição corresponde à frase." :
              "Ainda há diferenças. Confira as palavras destacadas e tente novamente.")}</p>
          <div className="speech-word-comparison" lang="en">
            {comparison.words.map((word, index) => <span key={index} className={word.recognized ? "heard" : "not-heard"}>
              {t(word.word)}{t(!word.recognized && " (?)")}
            </span>)}
          </div>
          {comparison.extraWords.length > 0 && <p lang={getSupportLocale()}>{supportT("Palavras adicionais:")}<span lang="en">{targetText(comparison.extraWords.join(" "))}</span></p>}
          <p lang={getSupportLocale()}>{supportT("Ana e Anna, por exemplo, são aceitos como o mesmo nome. Palavras extras, mudanças de sentido e negações continuam contando como diferenças.")}</p>
          <p lang={getSupportLocale()}>{supportT("Esta comparação é da transcrição, não uma nota de pronúncia. Não concede moedas nem conclui a lição.")}</p>
          <button className="text-button" onClick={() => setTranscript("")}>{t("Apagar transcrição")}</button>
        </div>
      )}
    </section>
  );
}
