"use client";
import Image from 'next/image';
import { useState } from 'react';
import { englishClasses } from '@/lib/english-classes';
import type { Level } from '@/lib/curriculum';
export default function EnglishClassroom({level}:{level:Level}) {
 const [id,setId]=useState<string>(()=>englishClasses.find(c=>c.level===level)?.id ?? englishClasses[0].id);
 const [choice,setChoice]=useState<number|null>(null),[checked,setChecked]=useState(false),[error,setError]=useState(false);
 const lesson=englishClasses.find(c=>c.id===id)!;
 return <section className="english-classroom" lang="en">
 <div className="page-heading"><div><p className="eyebrow">English with Sparky</p><h1>Your English classroom</h1><p>Listen, notice, and try it yourself.</p></div></div>
 <label>Choose a class <select value={id} onChange={e=>{setId(e.target.value);setChoice(null);setChecked(false);setError(false);}}>{englishClasses.map(c=><option key={c.id} value={c.id}>{c.level} · {c.title}</option>)}</select></label>
 <Image className="classroom-visual" src={lesson.level.startsWith("C") ? "/visuals/classes/sparky-advanced.webp" : "/visuals/classes/sparky-classroom.webp"} alt={lesson.level.startsWith("C") ? "Sparky illustrating evidence, uncertainty, quiet study and group discussion" : "Sparky teaching greetings, routines and exchanging ideas in a welcoming classroom"} width={1200} height={800}/>
 <h2>{lesson.title}</h2><div className="class-focus">{lesson.focus.map((point,i)=><span key={point}><b>{i+1}</b> {point}</span>)}</div>
 <audio key={id} controls preload="none" src={'/audio/classes/'+id+'.mp3'} onError={()=>setError(true)} aria-label={'Listen to '+lesson.title}/>
 {error&&<p role="status">The audio could not load. Please try again. You can read the full lesson below.</p>}
 <details><summary>Read the lesson transcript</summary><p>{lesson.script}</p></details>
 <fieldset><legend>{lesson.question}</legend>{lesson.options.map((option,i)=><label key={option} className="class-option"><input type="radio" name="class-answer" checked={choice===i} onChange={()=>{setChoice(i);setChecked(false);}}/>{option}</label>)}</fieldset>
 <button className="primary-button" disabled={choice===null} onClick={()=>setChecked(true)}>Check answer</button>
 {checked&&<p role="status">{choice===lesson.answer?'Correct! ':'Try again. '}{lesson.explanation}</p>}
 <section className="review-guidance"><h3>Your turn</h3><p>{lesson.task}</p><p>Pause and say your answer aloud. You can repeat the class whenever you like.</p></section>
 <small>AI-generated narration · Sparky</small>
 </section>;
}
