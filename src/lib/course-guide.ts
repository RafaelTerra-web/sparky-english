import { modules, lessons, type Lesson, type Level } from './curriculum.ts';
import { levels } from './levels.ts';
import { metadataFor, modulePlans, competencyPaths, type Discipline, type Skill, type CommunicativeFunction, type LanguageTopic } from './course-metadata.ts';
import type { LearningWorkspace } from './learning-local.ts';
import type { EltisSkill } from './eltis-shared.ts';
export const lessonById = new Map(lessons.map(l=>[l.id,l]));
export const lessonMetadata = Object.fromEntries(modules.flatMap(m=>m.lessons.map((l,i)=>[l.id,metadataFor(l,i,m.lessons.length)])));
export const courseModules = [...modules].sort((a,b)=>levels.indexOf(a.level)-levels.indexOf(b.level)||a.order-b.order);
export const courseTrail = courseModules.flatMap(m=>m.lessons);
export function trailFor(level:Level) { return courseTrail.filter(l=>levels.indexOf(l.level)>=levels.indexOf(level)); }
export function nextInTrail(level:Level,completed:Record<string,string>):Lesson|undefined { return trailFor(level).find(l=>!completed[l.id]); }
export function moduleObjective(id:string) { return modulePlans[id]?.objective ?? ''; }
export function prerequisiteFor(id:string) {
 const i=courseModules.findIndex(m=>m.id===id);
 const declared=modulePlans[id]?.prerequisite;
 return declared?courseModules.find(m=>m.id===declared):courseModules[i-1];
}
export type StudyStatus='new'|'progress'|'done'|'due';
export const statusNames:Record<StudyStatus,string>={new:'Não iniciadas',progress:'Em andamento',done:'Concluídas',due:'Revisão pendente'};
export type CourseFilters={level:Level|'all';query:string;discipline:Discipline|'';skill:Skill|'';function:CommunicativeFunction|'';language:LanguageTopic|'';status:StudyStatus|''};
export const emptyFilters:CourseFilters={level:'all',query:'',discipline:'',skill:'',function:'',language:'',status:''};
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// Search is built once, rather than walking every lesson step on every render.
let searchIndex:Map<string,string>|undefined;
function getSearchIndex() { return searchIndex ??= new Map(lessons.map(l=>[l.id,normalize([l.title,l.englishTitle,...l.steps.map(s=>s.body+' '+(s.english??''))].join(' '))])); }
export function filterCourse(filters:CourseFilters,completed:Record<string,string>,inProgress:Set<string>,due:Set<string>) {
 const query=normalize(filters.query.trim());
 return courseModules.map(m=>({...m,lessons:m.lessons.filter(l=>{
  const meta=lessonMetadata[l.id];
  return (filters.level==='all'||l.level===filters.level)&&(!filters.discipline||meta.primary===filters.discipline||meta.secondary.includes(filters.discipline))&&(!filters.skill||meta.focusSkills.includes(filters.skill))&&(!filters.function||meta.functions.includes(filters.function))&&(!filters.language||meta.language.includes(filters.language))&&(!query||getSearchIndex().get(l.id)!.includes(query))&&(!filters.status||(filters.status==='new'?!completed[l.id]&&!inProgress.has(l.id):filters.status==='progress'?inProgress.has(l.id):filters.status==='done'?Boolean(completed[l.id]):due.has(l.id)));
 })})).filter(m=>m.lessons.length);
}
export type ExamFocus={completedAt:string;skills:Partial<Record<EltisSkill,number>>};
// These lesson contexts actually concern classes, courses, school notices or educational access.
export const examLessonIds=['a1-rotina-05','a2-textos-05','b1-leitura-03','b1-leitura-04','b1-leitura-05','b1-leitura-06','b1-precisao-04','b2-argumentacao-06','c1-evidencias-06','c2-estilo-cultura-06'];
export function examRecommendations(focus:ExamFocus,level:Level,completed:Record<string,string>={}) {
 const weakest=Object.entries(focus.skills).filter(([,v])=>Number.isFinite(v)).sort((a,b)=>a[1]!-b[1]!)[0]?.[0] as EltisSkill|undefined;
 if(!weakest) return [];
 const candidates=examLessonIds.map(id=>lessonById.get(id)!).filter(l=>lessonMetadata[l.id].skills.includes(weakest));
 return candidates.sort((a,b)=>{
  const score=(l:Lesson)=>Math.abs(levels.indexOf(l.level)-levels.indexOf(level))*10+(completed[l.id]?2:0)+(l.level===level?0:1);
  return score(a)-score(b)||courseTrail.indexOf(a)-courseTrail.indexOf(b);
 }).slice(0,2).map(lesson=>({lesson,skill:weakest}));
}
export type Recommendation={lesson:Lesson;reason:string;source:'trail'|'errors'|'exam'|'breadth'|'preference'};
export function complementaryPractice(level:Level,completed:Record<string,string>,workspace:LearningWorkspace):Recommendation[] {
 const next=nextInTrail(level,completed);
 const errors=new Map<string,number>();
 // Count the latest answer per question: a corrected attempt replaces an old mistake.
 const latest=new Map<string,LearningWorkspace['attempts'][number]>();
 for(const a of workspace.attempts.slice(-100)) latest.set(a.lessonId+':'+a.stepId,a);
 for(const a of latest.values()) if(!a.correct) errors.set(a.lessonId,(errors.get(a.lessonId)??0)+1);
 const counts:Partial<Record<Discipline,number>>={};
 for(const id of Object.keys(completed)) { const d=lessonMetadata[id]?.primary; if(d) counts[d]=(counts[d]??0)+1; }
 const examIds=new Set(workspace.examFocus?examRecommendations(workspace.examFocus,level,completed).map(r=>r.lesson.id):[]);
 const ranked = lessons.filter(l=>l.level===level&&l.id!==next?.id).map(lesson=>{
  const meta=lessonMetadata[lesson.id];
  const error=errors.get(lesson.id)??0,exam=examIds.has(lesson.id),preferred=workspace.discipline!=='all'&&(meta.primary===workspace.discipline||meta.secondary.includes(workspace.discipline));
  return {lesson,score:error*20+(exam?15:0)+(preferred?8:0)-(counts[meta.primary]??0)-(completed[lesson.id]?4:0),source:error?'errors':exam?'exam':preferred?'preference':'breadth',reason:error?'Retoma uma dificuldade nas suas últimas respostas.':exam?'Pratica a habilidade com menor resultado no seu último simulado.':preferred?'Combina com a disciplina escolhida no seu perfil.':'Amplia a prática em uma disciplina menos estudada.'} as Recommendation&{score:number};
 }).sort((a,b)=>b.score-a.score);
 const selected:Recommendation[]=[],seen=new Set<Discipline>();
 for(const candidate of ranked) {const d=lessonMetadata[candidate.lesson.id].primary;if(seen.has(d)&&!['errors','exam'].includes(candidate.source))continue;selected.push(candidate);seen.add(d);if(selected.length===3)break;}
 return selected;

}
export function pathsForLesson(id:string) { return competencyPaths.filter(p=>p.steps.some(s=>s.lessonId===id)); }
export function recommendationReason(resume:boolean,review:boolean) { return resume?'Continue a prática que você deixou em andamento.':review?'Uma revisão curta entre lições novas ajuda a recuperar o que você já estudou.':'É a próxima lição ainda não concluída na sequência do seu nível recomendado.'; }
