import test from 'node:test';
import assert from 'node:assert/strict';
import { activeCue, validateMusic, emptyMusicProgress, normalizeMusic, mergeMusic, canCompleteMusic } from '../src/lib/music.ts';
const lesson = { id:'original-test', version:'1',title:'Hello again',artist:'Test',level:'A1',topic:'Greetings',duration:3,source:'/audio/test.wav',rights:'original',published:true,lines:[{id:'line',start:0,end:2,text:'Hello again',translation:'Olá novamente',tip:'Stress',words:[{text:'Hello',start:0,end:1},{text:'again',start:1,end:2,vocabularyId:'again'}]}],vocabulary:[{id:'again',word:'again',meaning:'novamente',ipa:'',usage:'',example:'Hello again.'}],questions:[{id:'q',prompt:'Meaning?',options:['novamente','nunca'],answer:0,explanation:'Again means novamente.'}] };
test('timeline excludes gaps and end boundaries and rejects malformed word timings',()=>{
  assert.equal(activeCue(lesson.lines,-1),-1); assert.equal(activeCue(lesson.lines,0),0); assert.equal(activeCue(lesson.lines,2),-1);
  assert.equal(activeCue(lesson.lines[0].words,1),1);
  assert.equal(validateMusic(lesson),lesson);
  const copy=structuredClone(lesson);copy.lines[0].words[1].start=.5;assert.throws(()=>validateMusic(copy),/timing/);
  assert.throws(()=>validateMusic({...lesson,rights:'local-private'}),/private/);
});
test('a completion requires learning steps and correct answers, not a microphone',()=>{
  const p=emptyMusicProgress(lesson);assert.equal(canCompleteMusic(lesson,p),false);
  const done={...p,stage:4,heard:['line'],explored:['again'],practiced:['line'],answers:{q:0},completed:true};
  assert.equal(normalizeMusic(lesson,done).completed,true);
  assert.equal(normalizeMusic(lesson,{...done,answers:{q:1}}).completed,false);
  assert.equal(normalizeMusic(lesson,{...done,practiced:['fake']}).completed,false);
});
test('conflicting devices preserve completed work and newest playback position',()=>{
  const a={...emptyMusicProgress(lesson),stage:4,heard:['line'],explored:['again'],practiced:['line'],saved:['again'],answers:{q:0},completed:true,position:1,positionAt:100,revision:2};
  const b={...emptyMusicProgress(lesson),answers:{q:1},position:2,positionAt:200,revision:1};
  const merged=mergeMusic(lesson,a,b);assert.equal(merged.completed,true);assert.equal(merged.position,2);assert.equal(merged.answers.q,0);assert.equal(merged.revision,2);
  const updated=normalizeMusic({...lesson,version:'2'},merged);assert.equal(updated.completed,false);assert.deepEqual(updated.saved,['again']);
  assert.equal('audio' in normalizeMusic(lesson,{...a,audio:'private'}),false);
});
