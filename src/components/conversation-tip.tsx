"use client";
import { t, localizeAttribute, useCurrentInterfaceLanguage } from "@/lib/interface-language";
import { useEffect, useRef, useState } from 'react';
import { MascotFigure } from './mascot-studio';
import type { ConversationTip } from '@/lib/conversation-tips';

export function ConversationTipCard({tip,mascot}:{tip:ConversationTip;mascot:'sparky'|'pinky'}) {
 const language = useCurrentInterfaceLanguage();
 const sound = useRef<HTMLAudioElement | null>(null);
 const request = useRef<AbortController | null>(null);
 const cached = useRef<string | null>(null);
 const [playing,setPlaying] = useState(false), [error,setError] = useState('');
 useEffect(() => () => { request.current?.abort(); if(cached.current) URL.revokeObjectURL(cached.current); if(sound.current){sound.current.onended=null;sound.current.onerror=null;sound.current.pause();} },[]);
 function stop(){ request.current?.abort(); sound.current?.pause(); setPlaying(false); }
 async function play(rate:number){
  stop(); setError(''); setPlaying(true);
  const controller = new AbortController(); request.current=controller;
  const audio = new Audio(); sound.current=audio;
  audio.playbackRate=rate; audio.preservesPitch=true;
  audio.onended=()=>setPlaying(false);
  audio.onerror=()=>{setPlaying(false);setError('O áudio não carregou. A dica completa está disponível abaixo.');};
  try{
   if(!cached.current){
    const response=await fetch(`/audio/tips/${tip.id}-${mascot}.wav`,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});
    if(!response.ok) throw new Error('audio');
    const blob=await response.blob();controller.signal.throwIfAborted();cached.current=URL.createObjectURL(blob);
   }
   controller.signal.throwIfAborted();audio.src=cached.current;await audio.play();
  }catch{if(!controller.signal.aborted){setPlaying(false);setError('Não foi possível tocar. Tente novamente.');}}
 }
 return <aside className="conversation-tip" aria-label={localizeAttribute(`Dica de conversa: ${tip.title}`)}>
  <div className="conversation-tip-heading"><MascotFigure mascot={mascot} equipped={{sparky:{},pinky:{}}} size="small" decorative/><div><p className="eyebrow">{t("Dica de conversa")} · {mascot==='sparky'?'Sparky':'Pinky'}</p><h3>{t(tip.title)}</h3></div></div>
  <p>{t(tip.tip)}</p><blockquote lang="en">{t(tip.example)}</blockquote><p className="tip-translation">{t(tip.translation)}</p>
  {language !== "en" && <div className="speech-buttons"><button className="secondary-button" disabled={playing} onClick={()=>play(1)}>{t("Ouvir dica")}</button><button className="secondary-button" disabled={playing} onClick={()=>play(0.75)}>{t("Ouvir devagar")}</button>{playing&&<button className="secondary-button" onClick={stop}>{t("Parar áudio")}</button>}</div>}
  <p role="status">{t(error || (playing?'Reproduzindo a dica…':''))}</p>
  <p><strong>{t("Experimente:")}</strong> {t(tip.tryIt)}</p><details><summary>{t("Conferir a ideia")}</summary><p>{t(tip.answer)}</p></details>
  <details><summary>{t("Texto da apresentação e referência")}</summary><p>{t(tip.script)}</p><a href={tip.source} target="_blank" rel="noreferrer">{t("Consultar referência de uso e pronúncia")}</a><p>{t("Os exemplos e desafios são autorais. Os áudios são gerados por IA; sotaques e contextos podem variar.")}</p></details>
 </aside>;
}


