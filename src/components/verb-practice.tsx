"use client";
import { useEffect,useRef,useState } from 'react';
import { ArrowLeft,ArrowRight,BookOpen,Volume2 } from 'lucide-react';
import { t,localizeAttribute,useSupportLanguage } from '@/lib/interface-language';
import { verbBank,verbById,verbCardById,startVerbSession,answerVerbSession,advanceVerbSession,helpVerbSession,recordVerbHelp,verbSessionSummary, type VerbFeedback } from '@/lib/verb-practice';
import { readVerbReview,saveVerbReview } from '@/lib/verb-practice-local';
import { verbAudioUrl } from '@/lib/verb-audio-shared';
import { claimAudioPlayback,releaseAudioPlayback } from '@/lib/audio-playback';
import type { MascotId } from '@/lib/rewards-shared';
import MascotMoment from './mascot-moment';
import styles from './verb-practice.module.css';

export function VerbPractice({userId,mascot,onBack}:{userId:string;mascot:MascotId;onBack:()=>void}){
 const [review,setReview]=useState(()=>readVerbReview(userId));
 const [session,setSession]=useState(()=>startVerbSession(readVerbReview(userId)));
 const [started,setStarted]=useState(false),[input,setInput]=useState(''),[feedback,setFeedback]=useState<VerbFeedback|null>(null),[consult,setConsult]=useState(false),[table,setTable]=useState(false),[storageError,setStorageError]=useState(false),[audioError,setAudioError]=useState(false);
 const audio=useRef<HTMLAudioElement|null>(null),field=useRef<HTMLInputElement>(null);
 const support=useSupportLanguage();const summary=verbSessionSummary(session);
 const card=verbCardById.get(session.cardIds[session.index]);const verb=card?verbById.get(card.verbId):undefined;
 const stop=()=>{if(audio.current){audio.current.pause();releaseAudioPlayback(audio.current);audio.current=null;}};
 useEffect(()=>()=>{if(audio.current){audio.current.pause();releaseAudioPlayback(audio.current);}},[]);
 const revealHelp=()=>{setSession(current=>helpVerbSession(current));setConsult(true);if(card&&!session.correct){const updated=recordVerbHelp(review,card.id);setReview(updated);setStorageError(!saveVerbReview(userId,updated));}};
 const listen=async(id:string,slow=false)=>{if(started&&!summary.finished&&!session.correct)revealHelp();stop();setAudioError(false);const url=verbAudioUrl(id,mascot);if(!url){setAudioError(true);return;}const sound=new Audio(url);audio.current=sound;sound.playbackRate=slow ? 0.75 : 1;sound.preservesPitch=true;claimAudioPlayback(sound);sound.onended=()=>releaseAudioPlayback(sound);try{await sound.play();}catch{releaseAudioPlayback(sound);setAudioError(true);}};
 const check=(event:React.FormEvent)=>{event.preventDefault();if(!input.trim()||session.correct)return;const result=answerVerbSession(session,review,input);setSession(result.session);setReview(result.review);setFeedback(result.feedback);setStorageError(!saveVerbReview(userId,result.review));};
 const next=()=>{stop();setSession(current=>advanceVerbSession(current));setInput('');setFeedback(null);setConsult(false);setAudioError(false);requestAnimationFrame(()=>field.current?.focus());};
 const begin=()=>{stop();setSession(startVerbSession(review));setStarted(true);setInput('');setFeedback(null);setConsult(false);setTable(false);requestAnimationFrame(()=>field.current?.focus());};
 return <section className={styles.page}>
  <button className="text-button" onClick={()=>{stop();onBack();}}><ArrowLeft size={17}/>{t('Voltar à trilha')}</button>
  <div className="page-heading"><div><p className="eyebrow">{t('Base, passado e particípio')}</p><h1>{t('Verbos na prática')}</h1></div></div>
  {storageError&&<p role="status">{t('Não conseguimos salvar neste navegador. Sua prática continua nesta tela.')}</p>}
  {!started?<>
   <div className={styles.intro}><MascotMoment mascot={mascot} mood="listen" className={styles.mascot}/><h2>{t('Lembre a forma, uma palavra de cada vez')}</h2><p>{t('Seis lacunas, sem cronômetro e sem banco de respostas. Os verbos que precisam de revisão voltam primeiro.')}</p><button className="primary-button" onClick={begin}>{t('Começar treino')}<ArrowRight size={18}/></button></div>
   <div className={styles.guide}><h2>{t('A estrutura dá a pista')}</h2><p lang="en">Yesterday I <strong>ate</strong> before class.<br/>When class started, I had already <strong>eaten</strong>.<br/>Did you <strong>eat</strong> before class?</p><p>{t('Did pede a forma base. Had + particípio liga uma situação passada a outra anterior.')}</p><p>{t('Regulares: work → worked; study → studied. Irregulares têm formas próprias: go → went → gone.')}</p></div>
   <button className="secondary-button" onClick={()=>setTable(!table)}><BookOpen size={18}/>{t(table?'Fechar consulta':'Consultar os 18 verbos')}</button>
  </>:summary.finished?<div className={styles.intro}><MascotMoment mascot={mascot} mood="celebrate" className={styles.mascot}/><h2>{t('Treino concluído')}</h2><p>{summary.independent}/{summary.total} {t('lembradas sem ajuda na primeira tentativa')}</p><p>{t('As formas que precisaram de apoio voltam para praticar. Sua revisão fica salva nesta conta, neste aparelho.')}</p><button className="primary-button" onClick={begin}>{t('Praticar mais seis')}<ArrowRight size={18}/></button><button className="text-button" onClick={onBack}>{t('Voltar à trilha')}</button></div>:card&&verb?<div className={styles.card}>
   <div className={styles.top}><span>{session.index+1}/{session.cardIds.length}</span><span>{t(card.form==='base'?'Forma base':card.form==='past'?'Passado':'Particípio')}</span></div>
   <progress value={session.index} max={session.cardIds.length} aria-label={localizeAttribute('Progresso do treino')}/>
   <p>{t('Complete a lacuna com uma palavra.')}</p><p className={styles.sentence} lang="en">{card.sentence}</p>
   <p>{t('Verbo:')} <strong lang="en">{verb.base}</strong>{support==='pt-BR'&&<> · {verb.meaning}</>}</p>
   <form onSubmit={check}><label htmlFor="verb-answer">{t('Sua resposta')}</label><input ref={field} id="verb-answer" value={input} onChange={event=>setInput(event.target.value)} lang="en" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} maxLength={40} disabled={session.correct}/>{!session.correct&&<button className="primary-button" disabled={!input.trim()}>{t('Verificar')}</button>}</form>
   {feedback&&<div className={styles.feedback} role="status" data-correct={feedback.correct} lang={support}>{support==='pt-BR'?feedback.feedbackPT:feedback.feedbackEN}{feedback.correct&&<p>{t(feedback.independent?'Você lembrou sem ajuda.':'Você acertou com apoio. Vamos retomar essa forma depois.')}</p>}</div>}
   {!session.correct&&<button className="text-button" onClick={revealHelp}><BookOpen size={16}/>{t('Preciso de uma pista')}</button>}
   {(consult||feedback)&&<div className={styles.help}><p lang="en"><strong>{verb.base} → {verb.past} → {verb.participle}</strong></p><p>{t('Base → passado → particípio')}</p><div className={styles.audio}><button className="listen-link" onClick={()=>void listen(verb.id)}><Volume2 size={16}/>{t('Ouvir exemplo')}</button><button className="listen-link" onClick={()=>void listen(verb.id,true)}>{t('Ouvir devagar')}</button></div><p>{t(session.correct?'Sua resposta já foi registrada. Agora você pode ouvir o modelo.':'Consultar ou ouvir a resposta conta como ajuda nesta questão.')}</p></div>}
   {session.correct&&<button className="primary-button" onClick={next}>{t('Próxima')}<ArrowRight size={18}/></button>}
  </div>:null}
  {audioError&&<p role="status">{t('Não foi possível ouvir agora. Você pode continuar escrevendo.')}</p>}
  {table&&!started&&<div className={styles.table}><table><caption>{t('Base → passado → particípio')}</caption><thead><tr><th>{t('Forma base')}</th><th>{t('Passado')}</th><th>{t('Particípio')}</th><th>{t('Áudio')}</th></tr></thead><tbody>{verbBank.map(item=><tr key={item.id} lang="en"><td>{item.base}</td><td>{item.past}</td><td>{item.participle}</td><td><button className="listen-link" aria-label={localizeAttribute('Ouvir verbo')+': '+item.base} onClick={()=>void listen(item.id)}><Volume2 size={17}/></button></td></tr>)}</tbody></table></div>}
 </section>;
}
