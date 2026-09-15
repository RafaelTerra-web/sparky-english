import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMusicRounds, musicGameReducer, initialGame, normalizeAnswer, COUNTDOWN_SECONDS, GAME_ROUND_COUNT, RESPONSE_SECONDS } from '../src/lib/music-game.ts';

const lesson = { duration: 30, lines: [
  { id: 'a', start: 3, end: 7, words: [{ text: 'hello', start: 3, end: 4 }, { text: 'world', start: 6, end: 7 }] },
  { id: 'b', start: 14, end: 18, words: [{ text: 'hello', start: 14, end: 15 }, { text: 'again', start: 17, end: 18 }] },
] };
const answer = (round, value, time=round.opens) => ({ type:'answer', index:round.index, value, expected:round.answer, opens:round.opens, closes:round.closes, time });

test('seeded sessions vary targets and options, stay stable, and use audio-anchored windows', () => {
  const seen = new Set(); const options = new Set();
  for (let seed=1; seed<=100; seed++) {
    const rounds=buildMusicRounds(lesson,'challenge',seed);
    assert.deepEqual(rounds,buildMusicRounds(lesson,'challenge',seed));
    assert.equal(rounds.length,2);
    seen.add(rounds[0].target); options.add(rounds[0].options.join(','));
    for (const r of rounds) {
      assert.equal(r.options.filter(w=>w===r.answer).length,1);
      assert.equal(new Set(r.options).size,r.options.length);
      assert.equal(r.revealAt,r.line.start);
      assert.equal(r.revealAt-r.countdownStart,COUNTDOWN_SECONDS);
      assert.equal(r.opens,r.line.words[r.target].end);
      assert.equal(r.closes-r.opens,RESPONSE_SECONDS);
    }
    assert.ok(rounds[1].countdownStart>=rounds[0].closes);
  }
  assert.equal(seen.size,2); assert.ok(options.size>2);
});

test('late words keep the same full response time without delaying the next lyric', () => {
  const rounds=Array.from({length:100},(_,i)=>buildMusicRounds(lesson,'challenge',i)).find(r=>r[0].target===1);
  assert.equal(rounds[0].revealAt,3);
  assert.equal(rounds[0].opens,7);
  assert.equal(rounds[0].closes,10);
  assert.equal(rounds[1].revealAt,14);
  assert.equal(rounds[1].closes-rounds[1].opens,3);
});

test('two thousand seeded schedules always contain 24 collision-free rounds', () => {
  const large = { duration: 510, lines: Array.from({length:49},(_,i)=>{
    const start=5+i*10;
    return { id:`line-${i}`, start, end:start+4, words:[
      {text:`first${i}`,start,end:start+1},
      {text:`last${i}`,start:start+3,end:start+4},
    ] };
  }) };
  const signatures=new Set(); const targets=new Set();
  for(let seed=0;seed<2000;seed++){
    const rounds=buildMusicRounds(large,'challenge',seed);
    assert.equal(rounds.length,GAME_ROUND_COUNT);
    for(let i=0;i<rounds.length;i++){
      const round=rounds[i];
      targets.add(round.target);
      assert.equal(round.revealAt-round.countdownStart,COUNTDOWN_SECONDS);
      assert.equal(round.closes-round.opens,RESPONSE_SECONDS);
      if(i) assert.ok(round.countdownStart>=rounds[i-1].closes);
    }
    signatures.add(rounds.map(r=>`${r.lineIndex}:${r.target}`).join(','));
  }
  assert.deepEqual([...targets].sort(),[0,1]);
  assert.ok(signatures.size>100);
});

test('one tap commits; repeated words in later rounds are independent; outro waits for the full track', () => {
  const same={...lesson,lines:lesson.lines.map(l=>({...l,words:[l.words[0]]}))};
  const rounds=buildMusicRounds(same,'challenge');
  for(const correct of [true,false]) {
    let state=musicGameReducer(initialGame,{type:'start'});
    assert.equal(musicGameReducer(state,answer(rounds[0],'hello',rounds[0].opens-.01)),state);
    state=musicGameReducer(state,answer(rounds[0],correct?'hello':'wrong'));
    assert.equal(state.answered,true);
    assert.equal(musicGameReducer(state,answer(rounds[0],'hello')),state);
    state=musicGameReducer(state,{type:'tick',time:rounds[0].closes,deadlines:rounds.map(r=>r.closes),finishAt:30});
    assert.equal(state.answered,false); assert.deepEqual(state.rejected,[]);
    state=musicGameReducer(state,answer(rounds[1],'hello'));
    assert.equal(state.correct,correct?2:1);
    state=musicGameReducer(state,{type:'tick',time:rounds[1].closes,deadlines:rounds.map(r=>r.closes),finishAt:30});
    assert.equal(state.phase,'outro');
    state=musicGameReducer(state,{type:'tick',time:29.99,deadlines:rounds.map(r=>r.closes),finishAt:30});
    assert.equal(state.phase,'outro');
    state=musicGameReducer(state,{type:'tick',time:30,deadlines:rounds.map(r=>r.closes),finishAt:30});
    assert.equal(state.phase,'result');
  }
});

test('clock catches up missed rounds exactly once',()=>{
  const rounds=buildMusicRounds(lesson,'challenge');
  let state=musicGameReducer(initialGame,{type:'start'});
  state=musicGameReducer(state,{type:'tick',time:30,deadlines:rounds.map(r=>r.closes),finishAt:30});
  assert.equal(state.missed,2); assert.deepEqual(state.outcomes,['missed','missed']);
  assert.equal(musicGameReducer(state,{type:'tick',time:30,deadlines:rounds.map(r=>r.closes),finishAt:30}),state);
});

test('typing normalizes punctuation but preserves different words',()=>{
  assert.equal(normalizeAnswer(' Love, '),'love'); assert.equal(normalizeAnswer('DON’T'),"don't");
  assert.notEqual(normalizeAnswer('loved'),normalizeAnswer('love'));
});
