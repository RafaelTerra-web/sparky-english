"use client";
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Check, Search } from 'lucide-react';
import { t, localizeAttribute } from '@/lib/interface-language';
import type { Lesson, Level } from '@/lib/curriculum';
import type { LearningWorkspace } from '@/lib/learning-local';
import { levels } from '@/lib/levels';
import { disciplines, skills, functions, languageTopics, stages, competencyPaths } from '@/lib/course-metadata';
import { courseModules, emptyFilters, filterCourse, lessonById, lessonMetadata, moduleObjective, nextInTrail, prerequisiteFor, statusNames, type CourseFilters } from '@/lib/course-guide';
import { lessonIllustrationId } from '@/lib/lesson-illustrations';
import { grammarTopics, grammarTopicsForLesson, type GrammarTopic } from '@/lib/grammar-topics';

type Mode='guided'|'practice';
type Competence = "practicing" | "demonstrated" | "confirmed";
export function CourseCatalog({level,completed,competencies,workspace,dueIds,mode,onMode,onOpen}:{level:Level;completed:Record<string,string>;competencies:Record<string,Competence>;workspace:LearningWorkspace;dueIds:string[];mode:Mode;onMode:(mode:Mode)=>void;onOpen:(lesson:Lesson,review?:boolean,mode?:Mode)=>void;onExams:()=>void}) {
 const [filters,setFilters]=useState<CourseFilters>({...emptyFilters});
 const [topicLevel,setTopicLevel]=useState<Level>(level);
 const next=nextInTrail(level,completed);
 const inProgress=useMemo(()=>new Set(Object.values(workspace.checkpoints).filter(p=>!p.review).map(p=>p.lessonId)),[workspace.checkpoints]);
 const due=useMemo(()=>new Set(dueIds),[dueIds]);
 const results=useMemo(()=>filterCourse(filters,completed,inProgress,due),[filters,completed,inProgress,due]);
 const [openedModules,setOpenedModules]=useState<Set<string>>(()=>new Set());
 const toggleModule=(id:string)=>setOpenedModules(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next;});
 const setFilter=<K extends keyof CourseFilters>(key:K,value:CourseFilters[K])=>setFilters(f=>({...f,[key]:value}));
 const currentModule=courseModules.find(m=>m.id===next?.moduleId);
 const remainingModules=courseModules.filter(m=>levels.indexOf(m.level)>=levels.indexOf(level));
 const filterOptions=[['discipline','Disciplina',disciplines],['skill','Habilidade',skills],['function','Quero aprender a',functions],['language','Conteúdo de língua',languageTopics],['status','Status',statusNames]] as const;
 const selectedTopic=grammarTopics.find(topic=>topic.id===filters.topic);
 const otherLevelCount=filters.level==='all'?0:filterCourse({...filters,level:'all'},completed,inProgress,due).reduce((n,m)=>n+m.lessons.length,0);
 const chooseTopic=(topic:GrammarTopic)=>{setFilters({...emptyFilters,topic:topic.id,level:topic.level});onMode('practice');requestAnimationFrame(()=>document.getElementById('lesson-search')?.scrollIntoView({block:'start'}));};
 return <div className="guided-course">
  <div className="page-heading"><div><p className="eyebrow">{t('Seu caminho no inglês')}</p><h1>{t('Trilha')}</h1></div></div>
  <div className="course-modes" role="group" aria-label={localizeAttribute('Como você quer estudar?')}>
   <button aria-pressed={mode==='guided'} className={mode==='guided'?'primary-button':'secondary-button'} onClick={()=>onMode('guided')}>{t('Seguir meu curso')}</button>
   <button aria-pressed={mode==='practice'} className={mode==='practice'?'primary-button':'secondary-button'} onClick={()=>onMode('practice')}>{t('Buscar lições')}</button>
  </div>
  <details className="grammar-browser">
   <summary><h2>{t('Tópicos por nível')}</h2></summary><p>{t('Escolha um nível e um assunto para encontrar as lições. Os níveis orientam a sequência; você pode explorar todos.')}</p>
   <div className="grammar-levels" role="group" aria-label={localizeAttribute('Nível dos tópicos')}>{levels.map(item=><button key={item} aria-pressed={topicLevel===item} onClick={()=>setTopicLevel(item)}>{item}</button>)}</div>
   <ul className="grammar-topic-list">{grammarTopics.filter(topic=>topic.level===topicLevel).map(topic=><li key={topic.id}><button onClick={()=>chooseTopic(topic)}><span><strong lang="en">{topic.title}</strong><small>{t(topic.description)}</small></span><ArrowRight size={17} aria-hidden="true"/></button></li>)}</ul>
  </details>
  {mode==='guided'?<>
   <section className="trail-current" aria-labelledby="trail-heading">{next && <Image className="trail-current-art" src={`/lesson-images/${lessonIllustrationId(next)}.png`} alt="" width={960} height={720} sizes="(max-width: 700px) 120px, 210px" />}<p className="eyebrow">{t('Você está aqui')} · {t(level)}</p><h2 id="trail-heading">{t(currentModule?.title??'Trilha concluída')}</h2>
    {currentModule&&<p>{t('Ao terminar este módulo, você conseguirá:')}{t(moduleObjective(currentModule.id))}.</p>}
    {next?<><p><strong>{t('Próxima lição:')}</strong>{t(next.title)}</p><button className="primary-button" onClick={()=>onOpen(next,false,'guided')}>{t(inProgress.has(next.id)?'Retomar lição':'Continuar meu curso')}<ArrowRight size={17}/></button></>:<p>{t('Você concluiu a sequência a partir do nível recomendado. Explore outra disciplina ou pratique uma revisão disponível.')}</p>}
   </section>
   <div className="section-heading"><h2>{t('Sua trilha')}</h2><span>{t('Pré-requisitos orientam; todas as lições continuam abertas.')}</span></div>
   <ol className="course-trail">{remainingModules.map(m=>{
    const done=m.lessons.filter(l=>completed[l.id]).length,pre=prerequisiteFor(m.id),isCurrent=m.id===currentModule?.id;
    const renderBody=isCurrent||openedModules.has(m.id);
    return <li key={m.id} className={isCurrent?'is-current':''}><button type="button" className="trail-module-toggle" aria-expanded={renderBody} aria-controls={`trail-module-${m.id}`} onClick={()=>{if(!isCurrent)toggleModule(m.id);}}><span>{t(m.level)} · {t(m.title)}{isCurrent&&<b>{t('Você está aqui')}</b>}</span><span>{done===m.lessons.length?<Check size={18}/>:null}{done}/{m.lessons.length}</span></button>
     {renderBody&&<div id={`trail-module-${m.id}`} className="trail-module-body"><p><strong>{t('Ao terminar este módulo, você conseguirá:')}</strong>{t(moduleObjective(m.id))}.</p>
      <p>{t(done===m.lessons.length?'Módulo concluído. A consolidação continua nas revisões.':isCurrent?'Em desenvolvimento':'Competência que vem depois')}</p>
      {pre&&<p className="prerequisite-note">{t('Base recomendada:')}<button className="text-button" onClick={()=>onOpen(pre.lessons.find(l=>!completed[l.id])??pre.lessons[0],false,'practice')}>{t(pre.title)}</button></p>}
      <div className="guided-lesson-list">{m.lessons.map(l=><LessonRow key={l.id} lesson={l} completed={Boolean(completed[l.id])} competence={competencies[l.id]} inProgress={inProgress.has(l.id)} due={due.has(l.id)} onOpen={()=>onOpen(l,false,'guided')}/>)}</div>
     </div>}</li>;
   })}</ol>
   <section className="competency-paths"><h2>{t('Competências que crescem com você')}</h2><p>{t('Retome a base ou avance para uma aplicação mais exigente. As etapas conectam níveis diferentes.')}</p>
    {competencyPaths.map(p=><details key={p.id}><summary>{t(p.title)}<span>{p.steps.filter(s=>completed[s.lessonId]).length}/{p.steps.length}</span></summary><ol>{p.steps.map(s=>{const l=lessonById.get(s.lessonId)!;return <li key={s.lessonId}><span className="eyebrow">{t(stages[s.stage])} · {l.level}</span><button className="text-button" onClick={()=>onOpen(l,false,'practice')}>{completed[l.id]&&<Check size={15}/>} {t(l.title)}<ArrowRight size={15}/></button><p lang="en">{s.task}</p></li>;})}</ol></details>)}
   </section>
  </>:<>
   <section className="practice-context"><h2>{t('Treino complementar')}</h2><p>{t('Explore um assunto livremente. As conclusões contam no curso; sua próxima lição principal continua indicada abaixo.')}</p>{next&&<p><strong>{t('Próxima na trilha:')}</strong><button className="text-button" onClick={()=>onOpen(next,false,'guided')}>{t(next.title)}<ArrowRight size={15}/></button></p>}</section>
   <section id="lesson-search" className="course-filters" aria-label={localizeAttribute('Filtrar lições')}>
    <label className="catalog-search"><Search size={18}/><input value={filters.query} onChange={e=>setFilters(f=>({...f,query:e.target.value,topic:''}))} placeholder={localizeAttribute('Buscar assunto ou expressão')} aria-label={localizeAttribute('Buscar assunto ou expressão')}/></label>
    <div className="catalog-level-filter" role="group" aria-label={localizeAttribute('Nível das lições')}><button aria-pressed={filters.level==='all'} onClick={()=>setFilter('level','all')}>{t('Todos os níveis')}</button>{levels.map(item=><button key={item} aria-pressed={filters.level===item} onClick={()=>setFilter('level',item)}>{item}</button>)}</div>
    <div className="catalog-search-examples"><span>{t('Experimente:')}</span>{['zero conditional','first conditional','second conditional','third conditional','mixed conditionals'].map(query=><button className="text-button" key={query} lang="en" onClick={()=>setFilters({...emptyFilters,query})}>{query}</button>)}</div>
    <details className="quick-filter-details"><summary>{t("Mais filtros")}</summary><div className="filter-grid">
     {filterOptions.map(([key,label,options])=><label key={key}>{t(label)}<select aria-label={localizeAttribute(label)} value={filters[key]} onChange={e=>setFilter(key,e.target.value as never)}><option value="">{t('Todos')}</option>{Object.entries(options).map(([value,name])=><option key={value} value={value}>{t(name)}</option>)}</select></label>)}
    </div></details>
    <div className="filter-chips" aria-label={localizeAttribute('Filtros ativos')}>{filters.level!=='all'&&<button onClick={()=>setFilter('level','all')}>{filters.level} ×</button>}{selectedTopic&&<button onClick={()=>setFilter('topic','')}>{selectedTopic.title} ×</button>}{filterOptions.map(([key,label,options])=>filters[key]&&<button key={key} onClick={()=>setFilter(key,'')}>{t(label)}: {t((options as Record<string,string>)[filters[key]])} ×</button>)}{filters.query&&<button onClick={()=>setFilter('query','')}>{filters.query} ×</button>}<button className="text-button" onClick={()=>setFilters({...emptyFilters})}>{t('Limpar filtros')}</button></div>
    <p role="status">{results.reduce((n,m)=>n+m.lessons.length,0)} {t(results.reduce((n,m)=>n+m.lessons.length,0)===1?'lição encontrada':'lições encontradas')}</p>
   </section>
   {!results.length&&<section className="empty-state"><h2>{t('Nenhuma lição combina com esses filtros')}</h2>{otherLevelCount>0?<div className="catalog-level-hint"><p>{t('Encontramos esse conteúdo em outros níveis.')}</p><button className="secondary-button" onClick={()=>setFilter('level','all')}>{t('Buscar em todos os níveis')}</button></div>:<><p>{t('Remova um filtro para ampliar a busca.')}</p><button className="secondary-button" onClick={()=>setFilters({...emptyFilters})}>{t('Limpar filtros')}</button></>}</section>}
   {results.map(m=><section className="practice-module" key={m.id}><h2>{t(m.title)} · {m.level}</h2><p>{t('Ao terminar este módulo, você conseguirá:')}{t(moduleObjective(m.id))}.</p><div className="guided-lesson-list">{m.lessons.map(l=><LessonRow key={l.id} lesson={l} completed={Boolean(completed[l.id])} competence={competencies[l.id]} inProgress={inProgress.has(l.id)} due={due.has(l.id)} onOpen={()=>onOpen(l,filters.status==='due'&&due.has(l.id),'practice')}/>)}</div></section>)}
  </>}
 </div>;
}
function LessonRow({lesson,completed,competence,inProgress,due,onOpen}:{lesson:Lesson;completed:boolean;competence?:Competence;inProgress:boolean;due:boolean;onOpen:()=>void}) {
 const meta=lessonMetadata[lesson.id];
 const topics=grammarTopicsForLesson(lesson.id);
 return <button className="guided-lesson" onClick={onOpen}><span><span className="eyebrow">{t(disciplines[meta.primary])} · {t(stages[meta.stage])}</span><strong>{t(lesson.title)}</strong>{topics.length>0&&<small className="lesson-grammar-topics" lang="en">{topics.map(topic=>topic.title).join(" · ")}</small>}<small>{meta.focusSkills.map(s=>t(skills[s])).join(" · ")}</small><small>{t(inProgress?'Em andamento':completed?'Concluída':'Não iniciada')}{due?' · '+t('Revisão pendente'):''} · {lesson.minutes} {t('min')}</small>{competence && <small>{t(competence === "confirmed" ? "Habilidade confirmada" : competence === "demonstrated" ? "Habilidade demonstrada" : "Em prática")} · {t("compreensão e estrutura")}</small>}</span>{completed?<Check size={18}/>:<ArrowRight size={18}/>}</button>;
}
