"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { BrowserSpeechProvider, chooseTranscript, compareTranscript, recognitionMessage, type MascotVoice } from "@/lib/speech";
import { lessonAudio } from "@/lib/voice-assets";

export function SpeechPractice({ lessonId, text, initialMascot = "sparky", onPlayed }: { lessonId: string; text: string; initialMascot?: MascotVoice; onPlayed?: () => void }) {
  const provider = useRef<BrowserSpeechProvider | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
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
  const source = lessonAudio(lessonId, text, initialMascot);
  const busy = state !== "idle";
  const comparison = transcript ? compareTranscript(text, transcript) : null;

  function release() {
    generation.current++;
    provider.current?.stop();
    if (playbackTimer.current) clearTimeout(playbackTimer.current);
    playbackTimer.current = null;
    if (audio.current) {
      audio.current.onended = audio.current.onerror = audio.current.onplaying = null;
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
    if (!source || busyRef.current) return;
    release(); busyRef.current = true;
    const attempt = generation.current;
    setMessage(""); setState("loading");
    const sound = new Audio(source);
    sound.playbackRate = rate;
    sound.preservesPitch = true;
    setPlaybackRate(rate);
    audio.current = sound;
    const finish = (error = "") => {
      if (attempt !== generation.current) return;
      release(); setState("idle"); setMessage(error);
    };
    sound.onplaying = () => { if (attempt === generation.current) { setState("speaking"); onPlayed?.(); } };
    sound.onended = () => finish();
    sound.onerror = () => finish("Não foi possível carregar o áudio. Confira a conexão e tente novamente.");
    playbackTimer.current = setTimeout(() => finish("O áudio demorou demais. Tente novamente."), 60000);
    try { await sound.play(); }
    catch { finish("Não foi possível iniciar o áudio. Toque em Ouvir para tentar novamente."); }
  }
  return (
    <section className="speech-practice speech-studio" aria-label="Ouvir e praticar fala">
      <div className="speech-mascot-heading">
        <Image src={initialMascot === "sparky" ? "/visuals/sparky-panda.png" : "/visuals/pinky-mascot.png"} alt="" width={64} height={64} />
        <div><p className="eyebrow">Prática guiada</p><h3>Fale com {mascotName}</h3><p>Voz gerada por IA · inglês natural</p></div>
      </div>
      <p>Ouça a frase, perceba o ritmo e tente repeti-la. {mascotName} lê apenas o conteúdo da lição.</p>
      <div className="speech-buttons">
        <button className="secondary-button" disabled={busy || !source} onClick={() => speak(1)}>
          <Volume2 size={17} /> Ouvir natural
        </button>
        <button className="secondary-button" disabled={busy || !source} onClick={() => speak(0.75)}>
          <Volume2 size={17} /> Ouvir devagar
        </button>
        {busy && <button className="secondary-button" onClick={stop}><Square size={16} /> Parar</button>}
      </div>
      {!source && <p className="speech-unavailable">O áudio desta lição ainda não foi publicado. Você pode praticar a frase com o microfone.</p>}
      <details className="speech-consent">
        <summary>Praticar com o microfone</summary>
        <p>O navegador pode enviar sua fala ao serviço de reconhecimento dele. O Sparky não guarda gravações nem transcrições. A escuta dura até 20 segundos; você pode parar quando quiser.</p>
        <label className="speech-checkbox" htmlFor={id}>
          <input id={id} type="checkbox" checked={consent} onChange={event => {
            setConsent(event.target.checked);
            if (!event.target.checked) { release(); setState("idle"); setTranscript(""); }
          }} /> Autorizo o microfone nesta prática.
        </label>
        <button className="primary-button" disabled={busy || !consent || !canRecognize} onClick={listen}>
          <Mic size={17} /> Começar a falar
        </button>
        {!canRecognize && <p>{recognitionMessage("not-supported")}</p>}
      </details>
      <p className="speech-live-status" role="status" aria-live="polite">
        {state === "loading" ? "Carregando áudio…" : state === "speaking" ? `${mascotName} está falando ${playbackRate < 1 ? "devagar" : "em velocidade natural"}…` :
          state === "starting" ? "Aguardando o microfone…" : state === "listening" ? "Ouvindo você…" : message}
      </p>
      {comparison && (
        <div className="speech-result">
          <strong>O serviço de voz entendeu:</strong><p lang="en">{transcript.slice(0, 2000)}</p>
          <p>{comparison.limited ? "A fala ficou longa demais para esta frase. Repita apenas o exemplo." :
            comparison.exact ? comparison.nameVariantAccepted ? "Frase reconhecida. A variação de escrita do nome foi aceita." : "A transcrição corresponde à frase." :
              "Ainda há diferenças. Confira as palavras destacadas e tente novamente."}</p>
          <div className="speech-word-comparison" lang="en">
            {comparison.words.map((word, index) => <span key={index} className={word.recognized ? "heard" : "not-heard"}>
              {word.word}{!word.recognized && " (?)"}
            </span>)}
          </div>
          {comparison.extraWords.length > 0 && <p>Palavras adicionais: <span lang="en">{comparison.extraWords.join(" ")}</span></p>}
          <p>Ana e Anna, por exemplo, são aceitos como o mesmo nome. Palavras extras, mudanças de sentido e negações continuam contando como diferenças.</p>
          <p>Esta comparação é da transcrição, não uma nota de pronúncia. Não concede moedas nem conclui a lição.</p>
          <button className="text-button" onClick={() => setTranscript("")}>Apagar transcrição</button>
        </div>
      )}
    </section>
  );
}
