import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMusicRounds, musicGameReducer, initialGame, normalizeAnswer, RESPONSE_SECONDS } from '../src/lib/music-game.ts';
const lesson = { duration: 30, lines: [
  { id: 'a', start: 1, end: 5, words: [{ text: 'hello', start: 1, end: 2 }, { text: 'world', start: 4, end: 5 }] },
  { id: 'b', start: 5.1, end: 9, words: [{ text: 'hello', start: 5.1, end: 6 }, { text: 'again', start: 8, end: 9 }] },
] };
const answer = (round, value, time=round.opens) => ({ type:'answer', index:round.index, value, expected:round.answer, opens:round.opens, closes:round.closes, time });
test('seeded sessions vary targets and options, include every position, and stay stable within a session', () => {
  const seen = new Set(); const options = new Set();
  for (let seed=1; seed<=100; seed++) {
    const rounds=buildMusicRounds(lesson,'challenge',seed);
    assert.deepEqual(rounds,buildMusicRounds(lesson,'challenge',seed));
    seen.add(rounds[0].target); options.add(rounds[0].options.join(','));
    for (const r of rounds) {
      assert.equal(r.options.filter(w=>w===r.answer).length,1);
      assert.equal(new Set(r.options).size,r.options.length);
      assert.equal(r.closes-r.opens,RESPONSE_SECONDS);
      assert.ok(r.opens>=r.line.words[r.target].end);
      assert.ok(r.opens>=r.appears);
    }
    assert.ok(rounds[1].appears>=rounds[0].closes);
  }
  assert.equal(seen.size,2); assert.ok(options.size>2);
});
test('late words retain all three seconds across the next verse', () => {
  const rounds=Array.from({length:100},(_,i)=>buildMusicRounds(lesson,'challenge',i)).find(r=>r[0].target===1);
  assert.equal(rounds[0].opens,5); assert.equal(rounds[0].closes,8);
  assert.equal(rounds[1].appears,8);
  assert.equal(rounds[1].closes-rounds[1].opens,3);
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
