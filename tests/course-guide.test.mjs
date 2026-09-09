import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lessons } from '../src/lib/curriculum.ts';
import { courseTrail, lessonMetadata, emptyFilters, filterCourse, nextInTrail, examRecommendations, complementaryPractice, prerequisiteFor } from '../src/lib/course-guide.ts';
import { blankWorkspace, normalizeWorkspace } from '../src/lib/learning-local.ts';
import { auditCourseCoverage } from '../src/lib/course-coverage.ts';
import { competencyPaths, modulePlans } from '../src/lib/course-metadata.ts';
test('coverage covers every real lesson and all competency stages',()=>{
 const report=auditCourseCoverage();assert.deepEqual(report.errors,[]);assert.equal(report.lessonCount,lessons.length);assert.equal(Object.keys(lessonMetadata).length,lessons.length);
});
test('new B1 practice modules precede B2 and never send B2 learners back to A1',()=>{
 assert.ok(courseTrail.findIndex(l=>l.id==='b1-vida-em-movimento-02')<courseTrail.findIndex(l=>l.level==='B2'));
 assert.equal(prerequisiteFor('b2-argumentacao').level,'B1');
 assert.equal(nextInTrail('B2',{}).level,'B2');
 const done=Object.fromEntries(lessons.filter(l=>['B2','C1','C2'].includes(l.level)).map(l=>[l.id,'completed']));assert.equal(nextInTrail('B2',done),undefined);
});
test('free completion skips that lesson without losing earlier trail steps',()=>{
 const first=nextInTrail('A2',{}),second=courseTrail[courseTrail.indexOf(first)+1];
 assert.equal(nextInTrail('A2',{[second.id]:'completed'}).id,first.id);
 assert.notEqual(nextInTrail('A2',{[first.id]:'completed',[second.id]:'completed'}).id,second.id);
});
test('filters combine subject, level, skill, function, language, search and status',()=>{
 const id='b2-argumentacao-02',meta=lessonMetadata[id];
 const filters={...emptyFilters,level:'B2',discipline:'science',skill:'listening',function:'argue',language:'evidence',query:'correlacao',status:'done'};
 assert.deepEqual(filterCourse(filters,{[id]:'completed'},new Set(),new Set()).flatMap(m=>m.lessons.map(l=>l.id)),[id]);
 assert.equal(filterCourse({...filters,level:'A1'},{[id]:'completed'},new Set(),new Set()).length,0);assert.equal(meta.primary,'science');
});
test('in-progress and due states are independent of completion',()=>{
 const id=lessons[0].id;
 assert.deepEqual(filterCourse({...emptyFilters,status:'progress'},{},new Set([id]),new Set()).flatMap(m=>m.lessons.map(l=>l.id)),[id]);
 assert.deepEqual(filterCourse({...emptyFilters,status:'due'},{[id]:'completed'},new Set(),new Set([id])).flatMap(m=>m.lessons.map(l=>l.id)),[id]);
 assert.ok(!filterCourse({...emptyFilters,status:'new'},{},new Set([id]),new Set()).flatMap(m=>m.lessons).some(l=>l.id===id));
});
test('exam result points to two published lessons close to the recommended level',()=>{
 for(const level of ['A1','A2','B1','B2','C1','C2']) {
 const result=examRecommendations({completedAt:new Date().toISOString(),skills:{listening:25,reading:90}},level);
 assert.equal(result.length,2);assert.equal(new Set(result.map(r=>r.lesson.id)).size,2);assert.ok(result.every(r=>r.skill==='listening'&&lessons.includes(r.lesson)));
 }
});
test('recommendations use latest uncorrected mistakes and explicit preference',()=>{
 const workspace=blankWorkspace();workspace.discipline='technology';
 assert.ok(complementaryPractice('B2',{},workspace).some(r=>r.source==='preference'));
 workspace.attempts=[{id:'1',lessonId:'b2-autonomia-03',stepId:'q',correct:false,createdAt:new Date().toISOString()}];
 assert.equal(complementaryPractice('B2',{},workspace)[0].lesson.id,'b2-autonomia-03');
 workspace.attempts.push({...workspace.attempts[0],id:'2',correct:true});
 assert.ok(!complementaryPractice('B2',{},workspace).some(r=>r.source==='errors'));
});
test('old workspaces retain progress and sanitize new preferences and scores',()=>{
 const old={...blankWorkspace(),discipline:'invalid',minutes:15,examFocus:{completedAt:new Date().toISOString(),skills:{listening:40,reading:200,unknown:0}}};
 const current=normalizeWorkspace(old);assert.equal(current.discipline,'all');assert.equal(current.minutes,15);assert.deepEqual(current.examFocus.skills,{listening:40});
});
test('all outcomes and new competency labels have English translations',async()=>{
 const en=JSON.parse(await readFile('public/locales/en.json','utf8'));
 for(const p of Object.values(modulePlans))assert.ok(en[p.objective],p.objective);
 for(const m of Object.values(lessonMetadata))assert.ok(en[m.outcome],m.outcome);
 for(const p of competencyPaths)assert.ok(en[p.title],p.title);
});

test('skill filters distinguish the focus rather than returning every lesson',()=>{
 const listening=filterCourse({...emptyFilters,level:'B1',skill:'listening'},{},new Set(),new Set()).flatMap(m=>m.lessons);
 const writing=filterCourse({...emptyFilters,level:'B1',skill:'writing'},{},new Set(),new Set()).flatMap(m=>m.lessons);
 assert.ok(listening.length>0&&writing.length>0);assert.notDeepEqual(listening.map(l=>l.id),writing.map(l=>l.id));
});
