import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePersonalAudio } from '../src/lib/prepare-personal-audio.ts';

test('a generation in progress can become ready without a false failure', async t => {
  let requests=0;
  t.mock.method(globalThis,'fetch',async()=> ++requests===1 ? Response.json({pending:true},{status:202}) : Response.json({ready:true}));
  await preparePersonalAudio('/api/onboarding/audio?occasion=confirmation',AbortSignal.timeout(5000));
  assert.equal(requests,2);
});

test('cancelled polling stops and rate limits do not trigger more generation attempts',async t=>{
  const controller=new AbortController();
  let requests=0;
  t.mock.method(globalThis,'fetch',async()=>{requests++;controller.abort();return Response.json({pending:true},{status:202});});
  await assert.rejects(preparePersonalAudio('/api/onboarding/audio',controller.signal));
  assert.equal(requests,1);
  t.mock.method(globalThis,'fetch',async()=>{requests++;return Response.json({error:'Limite temporário'},{status:429});});
  await assert.rejects(preparePersonalAudio('/api/onboarding/audio',AbortSignal.timeout(5000)),/Limite temporário/);
  assert.equal(requests,2);
});
