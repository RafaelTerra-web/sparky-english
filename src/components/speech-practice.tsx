"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import {
  BrowserSpeechProvider,
  compareTranscript,
  mascotVoiceProfiles,
  recognitionMessage,
  type MascotVoice,
  type VoiceOption,
} from "@/lib/speech";

export function SpeechPractice({ text, initialMascot = "sparky" }: { text: string; initialMascot?: MascotVoice }) {
  const provider = useRef<BrowserSpeechProvider | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [canRecognize, setCanRecognize] = useState(false);
  const [mascot, setMascot] = useState<MascotVoice>(initialMascot);
  const [selection, setSelection] = useState<Record<MascotVoice, string>>({
    sparky: "",
    pinky: "",
  });
  const [slow, setSlow] = useState(false);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<
    "idle" | "speaking" | "starting" | "listening"
  >("idle");
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("");
  const hasResult = useRef(false);
  const id = useId();

  useEffect(() => {
    const speech = new BrowserSpeechProvider();
    provider.current = speech;
    const refresh = () => {
      setVoices(speech.voices());
      setCanRecognize(speech.canRecognize());
    };
    const stopOnHide = () => {
      if (document.hidden) {
        speech.stop();
        setState("idle");
        setTranscript("");
        setMessage("A voz foi pausada ao sair da aba.");
      }
    };
    const stopOnPageHide = () => speech.stop();
    const timer = window.setTimeout(refresh, 0);
    window.speechSynthesis?.addEventListener("voiceschanged", refresh);
    document.addEventListener("visibilitychange", stopOnHide);
    window.addEventListener("pagehide", stopOnPageHide);
    return () => {
      clearTimeout(timer);
      speech.stop();
      provider.current = null;
      window.speechSynthesis?.removeEventListener("voiceschanged", refresh);
      document.removeEventListener("visibilitychange", stopOnHide);
      window.removeEventListener("pagehide", stopOnPageHide);
    };
  }, []);

  // Voice metadata has no standardized gender/age field; choose by explicit voice name where possible.
  const preferred = voices.find((voice) =>
    mascot === "sparky"
      ? /\b(David|Mark|Guy|Ryan|Daniel|Alex)\b/i.test(voice.name)
      : /\b(Zira|Jenny|Aria|Samantha|Victoria|Susan)\b/i.test(voice.name),
  );
  const chosen =
    voices.find((voice) => voice.id === selection[mascot]) ??
    preferred ??
    voices[mascot === "pinky" && voices.length > 1 ? 1 : 0];
  const comparison = transcript ? compareTranscript(text, transcript) : null;
  const busy = state !== "idle";

  function stop() {
    provider.current?.stop();
    setState("idle");
    setMessage("Áudio e microfone parados.");
  }
  function listen() {
    if (!provider.current || !consent || !canRecognize) return;
    setTranscript("");
    setMessage("");
    setState("starting");
    hasResult.current = false;
    provider.current.recognize(chosen?.locale ?? "en-US", {
      onStart: () => setState("listening"),
      onResult: (value) => {
        hasResult.current = true;
        setTranscript(value);
      },
      onError: (code) => {
        hasResult.current = true;
        setMessage(recognitionMessage(code));
        setState("idle");
      },
      onEnd: () => {
        setState("idle");
        if (!hasResult.current)
          setMessage(
            "Nenhuma transcrição recebida. Você pode tentar novamente.",
          );
      },
    });
  }
  function speak() {
    if (!chosen || !provider.current) return;
    setMessage("");
    setState("speaking");
    provider.current.speak(
      text,
      { voiceId: chosen.id, mascot, slow },
      (error) => {
        setState("idle");
        if (error)
          setMessage(
            "Não foi possível reproduzir essa voz. Escolha outra voz em inglês e tente novamente.",
          );
      },
    );
  }
  return (
    <section className="speech-practice" aria-label="Ouvir e praticar fala">
      <h3>Ouça e experimente falar</h3>
      <p>
        Voz sintética do dispositivo, com timbre mais agudo para o mascote. Não
        é a voz de uma criança real. O resultado varia conforme o navegador e as
        vozes instaladas.
      </p>
      <details className="voice-preferences"><summary>Configurar voz e velocidade</summary>
      <div className="speech-settings">
        <label htmlFor={`${id}-mascot`}>
          Mascote
          <select
            id={`${id}-mascot`}
            value={mascot}
            disabled={busy}
            onChange={(event) => setMascot(event.target.value as MascotVoice)}
          >
            {Object.entries(mascotVoiceProfiles).map(([value, profile]) => (
              <option value={value} key={value}>
                {profile.label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${id}-voice`}>
          Voz base em inglês
          <select
            id={`${id}-voice`}
            value={chosen?.id ?? ""}
            disabled={busy || !voices.length}
            onChange={(event) =>
              setSelection({ ...selection, [mascot]: event.target.value })
            }
          >
            {!voices.length && (
              <option value="">Nenhuma voz em inglês disponível</option>
            )}
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} · {voice.locale}
                {voice.local ? " · local" : " · serviço do navegador"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="speech-checkbox">
        <input
          type="checkbox"
          checked={slow}
          disabled={busy}
          onChange={(event) => setSlow(event.target.checked)}
        />{" "}
        Ouvir mais devagar
      </label>
      </details>
      <div className="speech-buttons">
        <button
          className="secondary-button"
          disabled={busy || !chosen}
          onClick={speak}
        >
          <Volume2 size={16} /> Ouvir pronúncia
        </button>
        {busy && (
          <button className="secondary-button" onClick={stop}>
            <Square size={15} /> Parar
          </button>
        )}
      </div>
      {!voices.length && (
        <p>
          Instale uma voz em inglês nas configurações do dispositivo ou tente
          outro navegador. O curso escrito continua disponível.
        </p>
      )}
      <details className="speech-consent">
        <summary>Praticar com o microfone (opcional)</summary>
        <p>
          Ao iniciar, seu navegador pode enviar o áudio ao serviço de
          reconhecimento dele (por exemplo, Google no Chrome). Esse serviço
          segue suas próprias regras de processamento e retenção. O Sparky não
          salva gravações nem transcrições em banco, cache ou armazenamento
          local. A transcrição desaparece ao trocar de etapa, apagar ou fechar.
          Não fale dados pessoais.
        </p>
        <label className="speech-checkbox">
          <input
            type="checkbox"
            checked={consent}
            disabled={busy}
            onChange={(event) => {
              setConsent(event.target.checked);
              if (!event.target.checked) {
                provider.current?.stop();
                setTranscript("");
              }
            }}
          />{" "}
          Entendi o uso do microfone e autorizo esta prática.
        </label>
        <p>
          Leia a frase do exemplo. A escuta termina automaticamente e tem limite
          de 20 segundos.
        </p>
        <button
          className="secondary-button"
          disabled={busy || !consent || !canRecognize}
          onClick={listen}
        >
          <Mic size={16} /> Começar a falar
        </button>
        {!canRecognize && <p>{recognitionMessage("not-supported")}</p>}
      </details>
      <p role="status" aria-live="polite">
        {state === "speaking"
          ? "Reproduzindo…"
          : state === "starting"
            ? "Aguardando o microfone…"
            : state === "listening"
              ? "Ouvindo agora…"
              : message}
      </p>
      {comparison && (
        <div className="speech-result">
          <strong>O navegador entendeu:</strong>
          <p lang="en">{transcript}</p>
          <p>
            {comparison.exact
              ? "A transcrição corresponde à frase."
              : "A transcrição ficou diferente. Compare com o exemplo e tente novamente se quiser."}
          </p>
          <div className="speech-word-comparison" lang="en">
            {comparison.words.map((word, index) => (
              <span
                key={index}
                className={word.recognized ? "heard" : "not-heard"}
                title={
                  word.recognized
                    ? "Identificada na sequência"
                    : "Não identificada na sequência"
                }
              >
                {word.word}
                {!word.recognized && " (?)"}
              </span>
            ))}
          </div>
          <p>
            Isso compara palavras transcritas, não fonemas ou sotaque. Ruído,
            microfone e falhas do serviço podem mudar o resultado. Não afeta XP
            nem a conclusão da lição.
          </p>
          <button className="text-button" onClick={() => setTranscript("")}>
            Apagar transcrição
          </button>
        </div>
      )}
    </section>
  );
}
