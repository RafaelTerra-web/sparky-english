"use client";
import { t, localizeAttribute } from "@/lib/interface-language";
import { useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, Turtle } from "lucide-react";
import type { ListeningConversation } from "@/lib/listening-types";
import { approvedListeningAsset } from "@/lib/listening-manifest";

export function ConversationListening({ conversation, attempted, onAssisted }: {
  conversation: ListeningConversation; attempted: boolean; onAssisted: () => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [translation, setTranslation] = useState(false);
  const [error, setError] = useState("");
  const asset = approvedListeningAsset(conversation.id);
  useEffect(() => {
    const element = audio.current;
    return () => { element?.pause(); };
  }, [conversation.id]);
  async function play(rate: number) {
    if (!audio.current || !asset) return;
    setError("");
    audio.current.playbackRate = rate;
    audio.current.preservesPitch = true;
    setSpeed(rate);
    try { await audio.current.play(); }
    catch { setError("Não foi possível tocar o áudio. Tente novamente ou use a transcrição acessível."); }
  }
  const mayReveal = attempted || accessible;
  return <section className="conversation-listening" aria-label={localizeAttribute("Conversa entre Sparky e Pinky")}>
    <div className="conversation-heading"><Headphones aria-hidden="true" /><div><strong>{t("Sparky e Pinky ·")}{t(conversation.level)}</strong><p>{t("Primeiro, ouça para entender a intenção da conversa.")}</p></div></div>
    {asset ? <>
      <audio ref={audio} src={asset.path} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setError("Áudio indisponível. Tente novamente ou use a transcrição acessível."); }} />
      <div className="conversation-controls">
        <button className="secondary-button" onClick={() => playing && speed === 1 ? audio.current?.pause() : void play(1)}>{playing && speed === 1 ? <Pause size={18} /> : <Play size={18} />}{t(playing && speed === 1 ? "Pausar" : "Ouvir conversa")}</button>
        <button className="secondary-button" onClick={() => playing && speed === 0.75 ? audio.current?.pause() : void play(0.75)}>{playing && speed === 0.75 ? <Pause size={18} /> : <Turtle size={18} />}{t(playing && speed === 0.75 ? "Pausar áudio lento" : "Ouvir devagar · 75%")}</button>
        <button className="text-button" onClick={() => { if (audio.current) audio.current.currentTime = 0; }}>{t("Voltar ao início")}</button>
      </div>
      <p>{t("Vozes geradas por IA ·")}{t(Math.round(asset.durationSeconds))}{t(" segundos · mesma gravação nas duas velocidades.")}</p>
    </> : <p role="status">{t("Áudio em preparação editorial. Você pode estudar o roteiro como leitura assistida; esta atividade ainda não comprova compreensão auditiva.")}</p>}
    {error && <p role="alert">{t(error)}</p>}
    {!mayReveal && <><p>{t("A transcrição será liberada depois da primeira resposta.")}</p><button className="text-button" onClick={() => { setAccessible(true); setRevealed(true); onAssisted(); }}>{t("Preciso da transcrição acessível")}</button></>}
    {mayReveal && <button className="secondary-button" aria-expanded={revealed} onClick={() => setRevealed(!revealed)}>{t(revealed ? "Ocultar transcrição" : "Revelar transcrição")}</button>}
    {accessible && <p role="status">{t("Leitura assistida registrada. Você pode continuar aprendendo sem depender do áudio.")}</p>}
    {mayReveal && revealed && <div className="conversation-transcript"><button className="text-button" aria-expanded={translation} onClick={() => { setTranslation(!translation); if (!translation) onAssisted(); }}>{t(translation ? "Ocultar português" : "Mostrar apoio em português")}</button><ol>{conversation.turns.map((turn, index) => <li key={index} data-speaker={turn.speaker}><strong>{t(turn.speaker === "sparky" ? "Sparky" : "Pinky")}</strong><p lang="en">{t(turn.text)}</p>{translation && <p lang="pt-BR" className="conversation-translation">{t(turn.translation)}</p>}</li>)}</ol></div>}
  </section>;
}
