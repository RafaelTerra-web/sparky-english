// Run only against scripts/preview-fixture.mjs. Never writes production data.
import assert from 'node:assert/strict';
import { lessons } from '../src/lib/curriculum.ts';
import { isExercise, exerciseId } from '../src/lib/study.ts';
const base = new URL(process.argv[2] || 'http://localhost:3201');
if (base.hostname !== 'localhost' || base.port !== '3201') throw new Error('Local fixture required.');
const jar = new Map();
async function request(path, body, origin = base.origin) {
  const response = await fetch(new URL(path, base), { method: body ? 'POST' : 'GET', headers: {
    origin, 'content-type':'application/json', cookie:[...jar].map(([k,v]) => `${k}=${v}`).join('; '),
  }, ...(body ? {body:JSON.stringify(body)} : {}) });
  for (const cookie of response.headers.getSetCookie()) {
    const pair=cookie.split(';')[0], at=pair.indexOf('='); jar.set(pair.slice(0,at),pair.slice(at+1));
  }
  return {status:response.status,data:await response.json()};
}
const lesson=lessons.find(l => l.id === 'a1-identidade-01');
const exercises=lesson.steps.filter(isExercise);
assert.equal((await request('/api/rewards',{action:'complete',lessonId:lesson.id,review:false})).status,400);
assert.equal((await request('/api/study',{lessonId:lesson.id},'https://attacker.example')).status,403);
let receipt='';
for(const step of exercises) {
  const body={lessonId:lesson.id, review:false, stepId:exerciseId(lesson,step),answer:step.answer,assisted:false,receipt};
  if(!receipt) {
    const wrong=await request('/api/study',{...body,answer:'wrong'});
    assert.equal(wrong.status,200); assert.equal(wrong.data.correct,false); receipt=wrong.data.receipt;
  }
  const result=await request('/api/study',{...body,receipt});
  assert.equal(result.status,200); assert.equal(result.data.correct,true); receipt=result.data.receipt;
}
const invalid=await request('/api/rewards',{action:'complete',lessonId:lesson.id,review:false,receipt:receipt+'tampered'});
assert.equal(invalid.status,400);
const complete=await request('/api/rewards',{action:'complete',lessonId:lesson.id,review:false,receipt});
assert.equal(complete.status,200); assert.equal(complete.data.earned,10); assert.ok(complete.data.completed[lesson.id]);
const duplicate=await request('/api/rewards',{action:'complete',lessonId:lesson.id,review:false,receipt});
assert.equal(duplicate.status,200); assert.equal(duplicate.data.earned,0); assert.equal(duplicate.data.coins,10);
assert.equal((await request('/api/rewards')).data.coins,10);
console.log('PASS: authenticated grading, wrong-answer feedback, completion evidence, tamper/CSRF rejection, cookie persistence and duplicate reward protection.');
