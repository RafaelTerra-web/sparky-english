import test from 'node:test';
import assert from 'node:assert/strict';
import { musicRank, musicRanks, normalizeMusicPerformance, mergeMusicPerformance, recordMusicPerformance, unlockedMusicAchievements } from '../src/lib/music-performance.ts';
import { lyricRowIndexes } from '../src/lib/music-ambience.ts';
import { musicGameReducer, initialGame } from '../src/lib/music-game.ts';
import { emptyMusicProgress, normalizeMusic, mergeMusic } from '../src/lib/music.ts';

test('rank boundaries cover E, D, C, B, A, A+ and S exactly', () => {
  for (let i=0;i<musicRanks.length;i++) {
    const rank=musicRanks[i]; assert.equal(musicRank(rank.points).name,rank.name);
    if(i) assert.equal(musicRank(rank.points-1).name,musicRanks[i-1].name);
  }
  assert.equal(musicRank(NaN).name,'E'); assert.equal(musicRank(-100).name,'E');
});
test('one answer awards exactly 100 points once and errors never subtract points', () => {
  let state=musicGameReducer(initialGame,{type:'start'});
  const action={type:'answer',index:0,value:'hello',expected:'hello',time:4,opens:4,closes:7};
  state=musicGameReducer(state,action); assert.equal(state.correct*100,100);
  assert.equal(musicGameReducer(state,action).correct*100,100);
  state=musicGameReducer(state,{type:'tick',time:7,deadlines:[7,17],finishAt:20});
  state=musicGameReducer(state,{...action,index:1,value:'wrong',time:14,opens:14,closes:17});
  assert.equal(state.correct*100,100); assert.equal(state.streak,0);
});
test('records and achievements merge across devices without summing or losing a better result', () => {
  const a=recordMusicPerformance(null,'challenge',24,24,true);
  const b=recordMusicPerformance(null,'typing',12,5,true);
  const combined=mergeMusicPerformance(a,b);
  assert.deepEqual(mergeMusicPerformance(combined,combined),combined);
  assert.deepEqual(mergeMusicPerformance(b,a),combined);
  assert.equal(recordMusicPerformance(combined,'challenge',1,1,false).challenge.correct,24);
  assert.equal(unlockedMusicAchievements(combined).length,7);
  assert.equal(unlockedMusicAchievements(recordMusicPerformance(null,'challenge',24,24,false)).some(a=>a.id==='perfect'),false);
  assert.equal(unlockedMusicAchievements(recordMusicPerformance(null,'guided',0,0,true)).some(a=>a.id==='finish'),true);
});
test('malformed records cannot become impossible scores or streaks', () => {
  const clean=normalizeMusicPerformance({guided:{correct:999,streak:999,completedCorrect:999},typing:{correct:5,streak:20,completedCorrect:-1}});
  assert.deepEqual(clean.guided,{correct:0,streak:0,completedCorrect:-1});
  assert.equal(clean.typing.streak,5);
  assert.deepEqual(normalizeMusicPerformance(null).challenge,{correct:0,streak:0,completedCorrect:-1});
});
test('old progress and old-client writes preserve new records and saved words', () => {
  const lesson={id:'track',version:'1',duration:30,lines:[{id:'line'}],vocabulary:[{id:'word'}],questions:[]};
  const old={...emptyMusicProgress(lesson),saved:['word'],heard:['line'],practiced:['line']}; delete old.performance;
  const migrated=normalizeMusic(lesson,old); assert.deepEqual(migrated.saved,['word']); assert.deepEqual(migrated.practiced,['line']);
  const current={...migrated,performance:recordMusicPerformance(null,'challenge',19,8,true),completed:true};
  const merged=mergeMusic(lesson,current,old);
  assert.equal(merged.performance.challenge.correct,19);assert.equal(merged.completed,true);
  const nextVersion=normalizeMusic({...lesson,version:'2'},current);
  assert.equal(nextVersion.performance.challenge.correct,19);assert.deepEqual(nextVersion.saved,['word']);
});
test('live lyrics keep their current row while a pending earlier question remains visible', () => {
  assert.deepEqual(lyricRowIndexes(-1),[]);assert.deepEqual(lyricRowIndexes(0),[0]);
  assert.deepEqual(lyricRowIndexes(4),[3,4]);assert.deepEqual(lyricRowIndexes(4,4),[3,4]);
  assert.deepEqual(lyricRowIndexes(4,1),[1,4]);assert.deepEqual(lyricRowIndexes(4,10),[3,4]);
});
