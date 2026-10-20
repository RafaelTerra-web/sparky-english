import type { MascotId } from './rewards-shared';
export type VerbForm='base'|'past'|'participle';
export type VerbEntry={id:string;base:string;past:string;participle:string;meaning:string;regular:boolean;sentences:Record<VerbForm,string>};
const rows=[
 ['go','went','gone','ir','Did you ___ home after class?','Yesterday I ___ home early.','When I called, she had already ___ home.'],
 ['buy','bought','bought','comprar','Did you ___ the tickets?','We ___ two tickets yesterday.','By Friday, we had ___ the tickets.'],
 ['eat','ate','eaten','comer','Did you ___ before class?','Yesterday I ___ before class.','When class started, I had already ___.'],
 ['see','saw','seen','ver','Did you ___ the message?','I ___ your message last night.','Before I replied, I had ___ the message.'],
 ['take','took','taken','pegar / levar','Did she ___ the bus?','She ___ the bus yesterday.','When it rained, she had already ___ the bus.'],
 ['make','made','made','fazer / criar','Did you ___ dinner?','I ___ dinner last night.','When they arrived, I had already ___ dinner.'],
 ['do','did','done','fazer','Did they ___ their homework?','They ___ their homework yesterday.','Before dinner, they had ___ their homework.'],
 ['have','had','had','ter','Did you ___ a bike?','I ___ a bike when I was ten.','Before I moved, I had ___ the same bike for years.'],
 ['write','wrote','written','escrever','Did she ___ the email?','She ___ an email yesterday.','Before lunch, she had ___ the email.'],
 ['speak','spoke','spoken','falar','Did you ___ to the teacher?','I ___ to the teacher yesterday.','Before the test, I had ___ to the teacher.'],
 ['give','gave','given','dar','Did he ___ you the key?','He ___ me the key yesterday.','Before he left, he had ___ me the key.'],
 ['come','came','come','vir','Did they ___ to the party?','They ___ to the party last night.','When I arrived, they had already ___ back.'],
 ['find','found','found','encontrar','Did you ___ your keys?','I ___ my keys this morning.','Before I left, I had ___ my keys.'],
 ['know','knew','known','saber / conhecer','Did you ___ her then?','I ___ her when we were children.','When we started working together, I had ___ her for years.'],
 ['think','thought','thought','pensar','Did you ___ about the price?','I ___ about the price yesterday.','Before I bought it, I had ___ about the price.'],
 ['bring','brought','brought','trazer','Did she ___ a notebook?','She ___ a notebook yesterday.','Before class, she had ___ the notebooks inside.'],
 ['work','worked','worked','trabalhar','Did you ___ on Monday?','I ___ on Monday.','Before I moved, I had ___ at the cafe.'],
 ['study','studied','studied','estudar','Did you ___ last night?','I ___ last night.','Before the test started, I had ___ the notes.'],
];
export const verbBank:VerbEntry[]=rows.map(([base,past,participle,meaning,b,p,pp])=>({id:base,base,past,participle,meaning,regular:['work','study'].includes(base),sentences:{base:b,past:p,participle:pp}}));
export const verbById=new Map(verbBank.map(verb=>[verb.id,verb]));
export type VerbCard={id:string;verbId:string;form:VerbForm;sentence:string;answer:string};
export const verbCards:VerbCard[]=verbBank.flatMap(verb=>(['base','past','participle'] as const).map(form=>({id:verb.id+':'+form,verbId:verb.id,form,sentence:verb.sentences[form],answer:verb[form]})));
export const verbCardById=new Map(verbCards.map(card=>[card.id,card]));
export const verbCardsFor=(id:string)=>verbCards.filter(card=>card.verbId===id);
export function verbAudioText(id:string){const verb=verbById.get(id);return verb?`${verb.base}. ${verb.past}. ${verb.participle}. ${verb.sentences.past.replace('___',verb.past)} ${verb.sentences.participle.replace('___',verb.participle)}`:null;}
export type VerbReviewItem={attempts:number;independentSuccesses:number;stage:number;dueAt:number;lastAttemptAt:number;lastCorrect:boolean;lastAssisted:boolean};
export type VerbReview={version:1;items:Record<string,VerbReviewItem>};
export type VerbSession={version:1;cardIds:string[];index:number;tries:number;helped:boolean;correct:boolean;results:{cardId:string;attempts:number;assisted:boolean;independent:boolean}[]};
export type VerbFeedback={correct:boolean;feedbackPT:string;feedbackEN:string;answer:string;independent:boolean};
export const blankVerbReview=():VerbReview=>({version:1,items:{}});
export function normalizeVerbReview(value:unknown):VerbReview {
 const clean=blankVerbReview();if(!value||typeof value!=='object')return clean;
 const items=(value as VerbReview).items;if(!items||typeof items!=='object')return clean;
 for(const card of verbCards){const item=items[card.id];if(!item||!Number.isFinite(item.dueAt)||!Number.isFinite(item.lastAttemptAt))continue;
 clean.items[card.id]={attempts:Math.max(0,Math.min(100000,Math.floor(Number(item.attempts)||0))),independentSuccesses:Math.max(0,Math.min(100000,Math.floor(Number(item.independentSuccesses)||0))),stage:Math.max(0,Math.min(5,Math.floor(Number(item.stage)||0))),dueAt:Math.max(0,Math.min(Date.now()+60*86400000,item.dueAt)),lastAttemptAt:Math.max(0,item.lastAttemptAt),lastCorrect:item.lastCorrect===true,lastAssisted:item.lastAssisted===true};
 }return clean;
}
export function startVerbSession(review:VerbReview,now=Date.now(),count=6):VerbSession {
 const priority=(card:VerbCard)=>{const item=review.items[card.id];return !item?1:item.dueAt<=now?0:2;};
 const order=(card:VerbCard)=>{const position=verbBank.findIndex(verb=>verb.id===card.verbId),form=['base','past','participle'].indexOf(card.form),preferred=(position+1)%3;return position*3+(form-preferred+3)%3;};
 const sorted=[...verbCards].sort((a,b)=>priority(a)-priority(b)||(review.items[a.id]?.dueAt??0)-(review.items[b.id]?.dueAt??0)||order(a)-order(b));
 const selected:VerbCard[]=[],seen=new Set<string>();
 for(const card of sorted){if(seen.has(card.verbId))continue;selected.push(card);seen.add(card.verbId);if(selected.length>=count)break;}
 return {version:1,cardIds:selected.map(card=>card.id),index:0,tries:0,helped:false,correct:false,results:[]};
}
export const helpVerbSession=(session:VerbSession):VerbSession=>({...session,helped:true});
export function recordVerbHelp(review:VerbReview,cardId:string,now=Date.now()):VerbReview {if(!verbCardById.has(cardId))return review;const old=review.items[cardId];return{version:1,items:{...review.items,[cardId]:{attempts:old?.attempts??0,independentSuccesses:old?.independentSuccesses??0,stage:0,dueAt:now+10*60000,lastAttemptAt:now,lastCorrect:false,lastAssisted:true}}};}
export function answerVerbSession(session:VerbSession,review:VerbReview,input:string,now=Date.now()):{session:VerbSession;review:VerbReview;feedback:VerbFeedback} {
 const card=verbCardById.get(session.cardIds[session.index]);if(!card||session.correct)throw Error('no-active-card');
 const verb=verbById.get(card.verbId)!;const typed=input.trim().toLowerCase();const correct=typed===card.answer.toLowerCase();const independent=correct&&!session.helped&&session.tries===0&&!(review.items[card.id]?.lastAssisted&&review.items[card.id].dueAt>now);
 let pt=correct?'Forma correta.':'Tente mais uma vez.',en=correct?'Correct form.':'Try once more.';
 if(!correct){
  if(card.form==='participle'&&typed===verb.past&&verb.past!==verb.participle){pt=`Had já está correto. Depois dele, use o particípio: ${verb.base} → ${verb.past} → ${verb.participle}.`;en=`Had is already correct. It needs the past participle: ${verb.base} → ${verb.past} → ${verb.participle}.`;}
  else if(card.form==='base'&&[verb.past,verb.participle].includes(typed)){pt=`Did já marca o passado. Depois dele, use a forma base: ${verb.base}.`;en=`Did already marks the past. Use the base form after it: ${verb.base}.`;}
  else if(!verb.regular&&new RegExp('^'+verb.base+'e?d$').test(typed)){pt=`Este verbo é irregular: ${verb.base} → ${verb.past} → ${verb.participle}.`;en=`This verb is irregular: ${verb.base} → ${verb.past} → ${verb.participle}.`;}
  else if(verb.id==='study'){pt='Consoante + y: troque y por i e acrescente ed: study → studied.';en='Consonant + y: change y to i and add ed: study → studied.';}
  else {pt=`Aqui precisamos de ${card.form==='base'?'forma base':card.form==='past'?'passado':'particípio'}: ${card.answer}. Digite só a palavra da lacuna.`;en=`This gap needs the ${card.form==='participle'?'past participle':card.form} form: ${card.answer}. Type only the missing word.`;}
 }
 const old=review.items[card.id];const due=!old||old.dueAt<=now;
 const stage=independent?(due?Math.min(5,(old?.stage??0)+1):old?.stage??0):0;
 const days=[0,1,3,7,14,30];
 const updated:VerbReview={version:1,items:{...review.items,[card.id]:{attempts:(old?.attempts??0)+1,independentSuccesses:(old?.independentSuccesses??0)+(independent?1:0),stage,dueAt:independent?(due?now+days[stage]*86400000:old!.dueAt):now+10*60000,lastAttemptAt:now,lastCorrect:correct,lastAssisted:!correct||!independent}}};
 const result={cardId:card.id,attempts:session.tries+1,assisted:!independent,independent};
 return {session:{...session,tries:session.tries+1,correct,results:correct?[...session.results,result]:session.results},review:updated,feedback:{correct,feedbackPT:pt,feedbackEN:en,answer:card.answer,independent}};
}
export function advanceVerbSession(session:VerbSession):VerbSession {return session.correct?{...session,index:session.index+1,tries:0,helped:false,correct:false}:session;}
export function verbSessionSummary(session:VerbSession){return{finished:session.index>=session.cardIds.length,total:session.cardIds.length,completed:session.results.length,independent:session.results.filter(result=>result.independent).length,assisted:session.results.filter(result=>result.assisted).length};}
export type VerbMascot= MascotId;
