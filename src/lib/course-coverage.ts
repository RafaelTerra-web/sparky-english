import { lessons } from './curriculum.ts';
import { levels } from './levels.ts';
import { disciplines, skills, functions, languageTopics, stages, competencyPaths, modulePlans } from './course-metadata.ts';
import { courseModules, lessonMetadata, lessonById, prerequisiteFor, examLessonIds } from './course-guide.ts';
export function auditCourseCoverage() {
 const errors:string[]=[];
 const has=(record:object,key:string)=>Object.hasOwn(record,key);
 for(const l of lessons) {
  const m=lessonMetadata[l.id];
  if(!m||m.level!==l.level||!has(disciplines,m.primary)||!has(stages,m.stage)||!m.outcome) {errors.push('Invalid metadata: '+l.id);continue;}
  for(const [values,allowed] of [[m.secondary,disciplines],[m.skills,skills],[m.focusSkills,skills],[m.functions,functions],[m.language,languageTopics]] as const) if(values.some(value=>!has(allowed,value))) errors.push('Unknown tag: '+l.id);
  if(!m.skills.length||!m.functions.length||!m.language.length||!m.practice.length) errors.push('Empty taxonomy: '+l.id);
 }
 for(const m of courseModules) {
  if(!modulePlans[m.id]?.objective||modulePlans[m.id].objective.length<30) errors.push('Missing measurable objective: '+m.id);
  const pre=prerequisiteFor(m.id);
  if(['B2','C1'].includes(m.level)&&(!pre||levels.indexOf(pre.level)>levels.indexOf(m.level)||courseModules.indexOf(pre)>=courseModules.indexOf(m))) errors.push('Missing prior foundation: '+m.id);
 }
 const byLevel=Object.fromEntries(levels.map(level=>[level,Object.fromEntries(Object.keys(skills).map(skill=>[skill,lessons.filter(l=>l.level===level&&lessonMetadata[l.id].skills.includes(skill as keyof typeof skills)).length]))]));
 for(const [level,counts] of Object.entries(byLevel)) for(const [skill,count] of Object.entries(counts)) if(!count) errors.push('Skill absent: '+level+'/'+skill);
 const focusByLevel=Object.fromEntries(levels.map(level=>[level,Object.fromEntries(Object.keys(skills).map(skill=>[skill,lessons.filter(l=>l.level===level&&lessonMetadata[l.id].focusSkills.includes(skill as keyof typeof skills)).length]))]));
 for(const [level,counts] of Object.entries(focusByLevel)) for(const [skill,count] of Object.entries(counts)) if(!count) errors.push('Skill never in focus: '+level+'/'+skill);
 const byDiscipline=Object.fromEntries(Object.keys(disciplines).map(d=>{
  const rows=lessons.filter(l=>lessonMetadata[l.id].primary===d||lessonMetadata[l.id].secondary.includes(d as keyof typeof disciplines));
  const covered=[...new Set(rows.flatMap(l=>lessonMetadata[l.id].skills))];
  if(covered.length<2) errors.push('Insufficient skill variety: '+d);
  return [d,{lessons:rows.length,skills:covered,levels:[...new Set(rows.map(l=>l.level))]}];
 }));
 const complexTopics=['conditionals','reported','evidence','inference','register'] as const;
 const topicCoverage=Object.fromEntries(complexTopics.map(topic=>{
  const ids=lessons.filter(l=>lessonMetadata[l.id].language.includes(topic)).map(l=>l.id);
  if(ids.length<3) errors.push('Complex topic appears fewer than three times: '+topic);
  return [topic,ids];
 }));
 for(const p of competencyPaths) {
  if(new Set(p.steps.map(s=>s.stage)).size!==4||p.steps.length<4) errors.push('Incomplete learning sequence: '+p.id);
  let previous=-1;
  for(const s of p.steps) {
   const l=lessonById.get(s.lessonId);
   if(!l||!s.task) {errors.push('Invalid path reference: '+p.id+'/'+s.lessonId);continue;}
   const rank=levels.indexOf(l.level);if(rank<previous) errors.push('Reversed level progression: '+p.id);previous=rank;
  }
 }
 for(const id of examLessonIds) if(!lessonById.has(id)) errors.push('Invalid exam reference: '+id);
 return {lessonCount:lessons.length,moduleCount:courseModules.length,paths:competencyPaths.length,errors,byLevel,focusByLevel,byDiscipline,topicCoverage,notes:['Skill coverage includes optional oral, pronunciation and written applications. Completion is not a certification of mastery.','Domain transfer tasks are explicit in competency paths; they do not change the original lesson context.','Exam suggestions and draft/attempt history are stored per account on this device.']};
}
