"use client";
import { useMemo, useState } from 'react';
import { ArrowRight, Check, Search } from 'lucide-react';
import { t, localizeAttribute } from '@/lib/interface-language';
import type { Lesson, Level } from '@/lib/curriculum';
import type { LearningWorkspace } from '@/lib/learning-local';
import { levels } from '@/lib/levels';
import { disciplines, skills, functions, languageTopics, stages, competencyPaths } from '@/lib/course-metadata';
import { courseModules, emptyFilters, filterCourse, lessonById, lessonMetadata, moduleObjective, nextInTrail, prerequisiteFor, statusNames, type CourseFilters } from '@/lib/course-guide';

type Mode='guided'|'practice';
export function CourseCatalog({level,completed,workspace,dueIds,mode,onMode,onOpen,onExams}:{level:Level;completed:Record<string,string>;workspace:LearningWorkspace;dueIds:string[];mode:Mode;onMode:(mode:Mode)=>void;onOpen:(lesson:Lesson,review?:boolean,mode?:Mode)=>void;onExams:()=>void}) {
 const [filters,setFilters]=useState<CourseFilters>({...emptyFilters,level});
 const next=nextInTrail(level,completed);
 const inProgress=useMemo(()=>new Set(Object.values(workspace.checkpoints).filter(p=>!p.review).map(p=>p.lessonId)),[workspace.checkpoints]);
 const due=useMemo(()=>new Set(dueIds),[dueIds]);
 const results=useMemo(()=>filterCourse(filters,completed,inProgress,due),[filters,completed,inProgress,due]);
 const setFilter=<K extends keyof CourseFilters>(key:K,value:CourseFilters[K])=>setFilters(f=>({...f,[key]:value}));
 const currentModule=courseModules.find(m=>m.id===next?.moduleId);
 const remainingModules=courseModules.filter(m=>levels.indexOf(m.level)>=levels.indexOf(level));
 const filterOptions=[['discipline','Disciplina',disciplines],['skill','Habilidade',skills],['function','Quero aprender a',functions],['language','Conteúdo de língua',languageTopics],['status','Status',statusNames]] as const;
 return <div className="guided-course">
  <div className="page-heading"><div><p className="eyebrow">{t('Seu caminho no inglês')}</p><h1>{t('Curso')}</h1></div><button className="secondary-button" onClick={onExams}>{t('Simulados')}</button></div>
  <div className="course-modes" role="group" aria-label={localizeAttribute('Como você quer estudar?')}>
   <button aria-pressed={mode==='guided'} className={mode==='guided'?'primary-button':'secondary-button'} onClick={()=>onMode('guided')}>{t('Seguir meu curso')}</button>
   <button aria-pressed={mode==='practice'} className={mode==='practice'?'primary-button':'secondary-button'} onClick={()=>onMode('practice')}>{t('Treinar por disciplina')}</button>
  </div>
  {mode==='guided'?<>
   <section className="trail-current" aria-labelledby="trail-heading"><p className="eyebrow">{t('Você está aqui')} · {t(level)}</p><h2 id="trail-heading">{t(currentModule?.title??'Trilha concluída')}</h2>
    {currentModule&&<p>{t('Ao terminar este módulo, você conseguirá:')}{t(moduleObjective(currentModule.id))}.</p>}
    {next?<><p><strong>{t('Próxima lição:')}</strong>{t(next.title)}</p><p>{t('Seguimos a sequência do seu nível recomendado e aproveitamos as conclusões já registradas.')}</p><button className="primary-button" onClick={()=>onOpen(next,false,'guided')}>{t(inProgress.has(next.id)?'Retomar lição':'Continuar meu curso')}<ArrowRight size={17}/></button></>:<p>{t('Você concluiu a sequência a partir do nível recomendado. Explore outra disciplina ou pratique uma revisão disponível.')}</p>}
   </section>
   <div className="section-heading"><h2>{t('Sua trilha')}</h2><span>{t('Pré-requisitos orientam; todas as lições continuam abertas.')}</span></div>
   <ol className="course-trail">{remainingModules.map(m=>{
    const done=m.lessons.filter(l=>completed[l.id]).length,pre=prerequisiteFor(m.id),isCurrent=m.id===currentModule?.id;
    return <li key={m.id} className={isCurrent?'is-current':''}><details open={isCurrent}>
     <summary><span>{t(m.level)} · {t(m.title)}{isCurrent&&<b>{t('Você está aqui')}</b>}</span><span>{done===m.lessons.length?<Check size={18}/>:null}{done}/{m.lessons.length}</span></summary>
     <div className="trail-module-body"><p><strong>{t('Ao terminar este módulo, você conseguirá:')}</strong>{t(moduleObjective(m.id))}.</p>
      <p>{t(done===m.lessons.length?'Módulo concluído. A consolidação continua nas revisões.':isCurrent?'Em desenvolvimento':'Competência que vem depois')}</p>
      {pre&&<p className="prerequisite-note">{t('Base recomendada:')}<button className="text-button" onClick={()=>onOpen(pre.lessons.find(l=>!completed[l.id])??pre.lessons[0],false,'practice')}>{t(pre.title)}</button></p>}
      <div className="guided-lesson-list">{m.lessons.map(l=><LessonRow key={l.id} lesson={l} completed={Boolean(completed[l.id])} inProgress={inProgress.has(l.id)} due={due.has(l.id)} onOpen={()=>onOpen(l,false,'guided')}/>)}</div>
     </div></details></li>;
   })}</ol>
   <section className="competency-paths"><h2>{t('Competências que crescem com você')}</h2><p>{t('Retome a base ou avance para uma aplicação mais exigente. As etapas conectam níveis diferentes.')}</p>
    {competencyPaths.map(p=><details key={p.id}><summary>{t(p.title)}<span>{p.steps.filter(s=>completed[s.lessonId]).length}/{p.steps.length}</span></summary><ol>{p.steps.map(s=>{const l=lessonById.get(s.lessonId)!;return <li key={s.lessonId}><span className="eyebrow">{t(stages[s.stage])} · {l.level}</span><button className="text-button" onClick={()=>onOpen(l,false,'practice')}>{completed[l.id]&&<Check size={15}/>} {t(l.title)}<ArrowRight size={15}/></button><p lang="en">{s.task}</p></li>;})}</ol></details>)}
   </section>
  </>:<>
   <section className="practice-context"><h2>{t('Treino complementar')}</h2><p>{t('Explore um assunto livremente. As conclusões contam no curso; sua próxima lição principal continua indicada abaixo.')}</p>{next&&<p><strong>{t('Próxima na trilha:')}</strong><button className="text-button" onClick={()=>onOpen(next,false,'guided')}>{t(next.title)}<ArrowRight size={15}/></button></p>}</section>
   <section className="course-filters" aria-label={localizeAttribute('Filtrar lições')}>
    <label className="catalog-search"><Search size={18}/><input value={filters.query} onChange={e=>setFilter('query',e.target.value)} placeholder={localizeAttribute('Buscar assunto ou expressão')} aria-label={localizeAttribute('Buscar assunto ou expressão')}/></label>
    <div className="filter-grid"><label>{t('Nível')}<select aria-label={localizeAttribute("Nível")} value={filters.level} onChange={e=>setFilter('level',e.target.value as CourseFilters['level'])}><option value="all">{t('Todos os níveis')}</option>{levels.map(l=><option key={l}>{l}</option>)}</select></label>
     {filterOptions.map(([key,label,options])=><label key={key}>{t(label)}<select aria-label={localizeAttribute(label)} value={filters[key]} onChange={e=>setFilter(key,e.target.value as never)}><option value="">{t('Todos')}</option>{Object.entries(options).map(([value,name])=><option key={value} value={value}>{t(name)}</option>)}</select></label>)}
    </div>
    <div className="filter-chips" aria-label={localizeAttribute('Filtros ativos')}>{filters.level!=='all'&&<button onClick={()=>setFilter('level','all')}>{filters.level} ×</button>}{filterOptions.map(([key,label,options])=>filters[key]&&<button key={key} onClick={()=>setFilter(key,'')}>{t(label)}: {t((options as Record<string,string>)[filters[key]])} ×</button>)}{filters.query&&<button onClick={()=>setFilter('query','')}>{filters.query} ×</button>}<button className="text-button" onClick={()=>setFilters({...emptyFilters})}>{t('Limpar filtros')}</button></div>
    <p role="status">{results.reduce((n,m)=>n+m.lessons.length,0)} {t(results.reduce((n,m)=>n+m.lessons.length,0)===1?'lição encontrada':'lições encontradas')}</p>
   </section>
   {!results.length&&<section className="empty-state"><h2>{t('Nenhuma lição combina com esses filtros')}</h2><p>{t('Remova um filtro para ampliar a busca.')}</p><button className="secondary-button" onClick={()=>setFilters({...emptyFilters})}>{t('Limpar filtros')}</button></section>}
   {results.map(m=><section className="practice-module" key={m.id}><h2>{t(m.title)} · {m.level}</h2><p>{t('Ao terminar este módulo, você conseguirá:')}{t(moduleObjective(m.id))}.</p><div className="guided-lesson-list">{m.lessons.map(l=><LessonRow key={l.id} lesson={l} completed={Boolean(completed[l.id])} inProgress={inProgress.has(l.id)} due={due.has(l.id)} onOpen={()=>onOpen(l,filters.status==='due'&&due.has(l.id),'practice')}/>)}</div></section>)}
  </>}
 </div>;
}
function LessonRow({lesson,completed,inProgress,due,onOpen}:{lesson:Lesson;completed:boolean;inProgress:boolean;due:boolean;onOpen:()=>void}) {
 const meta=lessonMetadata[lesson.id];
 return <button className="guided-lesson" onClick={onOpen}><span><span className="eyebrow">{t(disciplines[meta.primary])} · {t(stages[meta.stage])}</span><strong>{t(lesson.title)}</strong><small>{meta.focusSkills.map(s=>t(skills[s])).join(" · ")}</small><small>{t(inProgress?'Em andamento':completed?'Concluída':'Não iniciada')}{due?' · '+t('Revisão pendente'):''} · {lesson.minutes} {t('min')}</small></span>{completed?<Check size={18}/>:<ArrowRight size={18}/>}</button>;
}
