"use client";
import { t, supportT, targetText, localizeAttribute, useSupportLanguage, getSupportLocale } from "@/lib/interface-language";
import { useEffect, useRef, useState } from 'react';
import { MascotFigure } from './mascot-studio';
import type { ConversationTip } from '@/lib/conversation-tips';
import { claimAudioPlayback, releaseAudioPlayback } from '@/lib/audio-playback';

export function ConversationTipCard({tip,mascot}:{tip:ConversationTip;mascot:'sparky'|'pinky'}) {
 const language = useSupportLanguage();
 const sound = useRef<HTMLAudioElement | null>(null);
 const request = useRef<AbortController | null>(null);
 const cached = useRef<string | null>(null);
 const [playing,setPlaying] = useState(false), [error,setError] = useState('');
 useEffect(() => () => { request.current?.abort(); if(cached.current) URL.revokeObjectURL(cached.current); if(sound.current){sound.current.onended=null;sound.current.onerror=null;sound.current.pause();} },[]);
 function stop(){ request.current?.abort(); if(sound.current){sound.current.pause();releaseAudioPlayback(sound.current);} setPlaying(false); }
 async function play(rate:number){
  stop(); setError(''); setPlaying(true);
  const controller = new AbortController(); request.current=controller;
  const audio = new Audio(); sound.current=audio;
  audio.playbackRate=rate; audio.preservesPitch=true;
  audio.onended=()=>{releaseAudioPlayback(audio);setPlaying(false);};
  audio.onpause=()=>setPlaying(false);
  audio.onerror=()=>{releaseAudioPlayback(audio);setPlaying(false);setError('O áudio não carregou. A dica completa está disponível abaixo.');};
  try{
   if(!cached.current){
    const response=await fetch(`/audio/tips/${tip.id}-${mascot}.wav`,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});
    if(!response.ok) throw new Error('audio');
    const blob=await response.blob();controller.signal.throwIfAborted();cached.current=URL.createObjectURL(blob);
   }
   controller.signal.throwIfAborted();audio.src=cached.current;claimAudioPlayback(audio);await audio.play();
  }catch{releaseAudioPlayback(audio);if(!controller.signal.aborted){setPlaying(false);setError('Não foi possível tocar. Tente novamente.');}}
 }
 return <aside className="conversation-tip" aria-label={localizeAttribute(`Dica de conversa: ${tip.title}`)}>
  <div className="conversation-tip-heading"><MascotFigure mascot={mascot} equipped={{sparky:{},pinky:{}}} size="small" decorative/><div><p className="eyebrow">{t("Dica de conversa")} · {mascot==='sparky'?'Sparky':'Pinky'}</p><h3>{supportT(tip.title)}</h3></div></div>
  <p lang={getSupportLocale()}>{supportT(tip.tip)}</p><blockquote lang="en">{targetText(tip.example)}</blockquote><details><summary>{t("Ver tradução em português")}</summary><p lang="pt-BR" className="tip-translation">{tip.translation}</p></details>
  <details open={language === "pt-BR"}><summary>{t("Apresentação em português com exemplos em inglês")}</summary><div className="speech-buttons"><button className="secondary-button" disabled={playing} onClick={()=>play(1)}>{t("Ouvir dica")}</button><button className="secondary-button" disabled={playing} onClick={()=>play(0.75)}>{t("Ouvir devagar")}</button>{playing&&<button className="secondary-button" onClick={stop}>{t("Parar áudio")}</button>}</div></details>
  <p lang={getSupportLocale()} role="status">{supportT(error || (playing?'Reproduzindo a dica…':''))}</p>
  <p lang={getSupportLocale()}><strong>{supportT("Experimente:")}</strong> {supportT(tip.tryIt)}</p><details><summary>{t("Conferir a ideia")}</summary><p lang={getSupportLocale()}>{supportT(tip.answer)}</p></details>
  <details><summary>{t("Texto da apresentação e referência")}</summary><p lang="pt-BR">{tip.script}</p><a href={tip.source} target="_blank" rel="noreferrer">{t("Consultar referência de uso e pronúncia")}</a><p lang={getSupportLocale()}>{supportT("Os exemplos e desafios são autorais. Os áudios são gerados por IA; sotaques e contextos podem variar.")}</p></details>
 </aside>;
}


