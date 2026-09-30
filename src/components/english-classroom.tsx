"use client";
import Image from 'next/image';
import { useState } from 'react';
import { englishClasses, englishClassSupport } from '@/lib/english-classes';
import type { Level } from '@/lib/curriculum';
import { claimAudioPlayback, releaseAudioPlayback } from '@/lib/audio-playback';
import { t, supportT, targetText, useCurrentInterfaceLanguage, useSupportLanguage, localizeAttribute } from '@/lib/interface-language';
export default function EnglishClassroom({level}:{level:Level}) {
 const language = useSupportLanguage();
 useCurrentInterfaceLanguage();
 const [id,setId]=useState<string>(()=>englishClasses.find(c=>c.level===level)?.id ?? englishClasses[0].id);
 const [choice,setChoice]=useState<number|null>(null),[checked,setChecked]=useState(false),[error,setError]=useState(false);
 const lesson=englishClasses.find(c=>c.id===id)!;
 const support=englishClassSupport[lesson.id];
 return <section className="english-classroom">
 <div className="page-heading"><div><p className="eyebrow">{t("Inglês com Sparky")}</p><h1>{t("Sua sala de inglês")}</h1><p lang={language}>{supportT("Ouça, observe e tente você mesmo.")}</p></div></div>
 <label>{t("Escolha uma aula")} <select value={id} onChange={e=>{setId(e.target.value);setChoice(null);setChecked(false);setError(false);}}>{englishClasses.map(c=><option key={c.id} value={c.id} lang="en">{c.level} · {targetText(c.title)}</option>)}</select></label>
 <Image className="classroom-visual" src={lesson.level.startsWith("C") ? "/visuals/classes/sparky-advanced.webp" : "/visuals/classes/sparky-classroom.webp"} alt={localizeAttribute(lesson.level.startsWith("C") ? "Sparky apresenta evidências, incerteza, estudo e discussão em grupo" : "Sparky ensina cumprimentos, rotinas e troca de ideias em uma sala acolhedora")} width={1200} height={800}/>
 <h2 lang="en">{targetText(lesson.title)}</h2><div className="class-focus" lang={language}>{(language === "en" ? lesson.focus : support.focus).map((point,i)=><span key={point}><b>{i+1}</b> {point}</span>)}</div>
 <audio key={id} controls preload="none" src={'/audio/classes/'+id+'.mp3'} onPlay={event=>claimAudioPlayback(event.currentTarget)} onEnded={event=>releaseAudioPlayback(event.currentTarget)} onError={event=>{releaseAudioPlayback(event.currentTarget);setError(true);}} aria-label={localizeAttribute("Ouvir aula") + ': ' + lesson.title}/>
 {error&&<p role="status" lang={language}>{supportT("O áudio não carregou. Tente novamente ou leia o texto da aula abaixo.")}</p>}
 <details><summary>{t("Ler o texto da aula")}</summary><p lang="en">{targetText(lesson.script)}</p></details>
 <fieldset lang="en"><legend>{targetText(lesson.question)}</legend>{lesson.options.map((option,i)=><label key={option} className="class-option"><input type="radio" name="class-answer" checked={choice===i} onChange={()=>{setChoice(i);setChecked(false);}}/>{targetText(option)}</label>)}</fieldset>
 <button className="primary-button" disabled={choice===null} onClick={()=>setChecked(true)}>{t("Conferir resposta")}</button>
 {checked&&<p role="status" lang={language}>{supportT(choice===lesson.answer?'Correto!':'Tente novamente.')} {language === "en" ? lesson.explanation : support.explanation}</p>}
 <section className="review-guidance"><h3>{t("Sua vez")}</h3><p lang={language}>{language === "en" ? lesson.task : support.task}</p><p lang={language}>{supportT("Pause e diga sua resposta em voz alta. Você pode repetir a aula quando quiser.")}</p></section>
 <small lang={language}>{supportT("Narração gerada por IA · Sparky")}</small>
 </section>;
}
