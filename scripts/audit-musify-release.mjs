import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { musicReleases } from '../src/lib/music-release.ts';
import { validateMusic } from '../src/lib/music.ts';
import { buildMusicRounds, initialGame, musicGameReducer, musicAnswerOpens } from '../src/lib/music-game.ts';
import { validMusicTranslationSpans, musicTranslationParts } from '../src/lib/music-translation.ts';

// Inspect reviewed private content without printing the song transcription.
const availableOnly=process.argv.includes('--available');
const results=[];
for(const release of musicReleases) {
  let source;
  try {source=await readFile(`.music-assets/${release.manifest}`,'utf8');}
  catch(error) {if(availableOnly && error.code==='ENOENT') continue;throw error;}
  const data=JSON.parse(source);
  // The release ledger is authoritative, as in getMusicCatalog().
  const lesson=validateMusic({...data,version:release.version});
  assert.equal(lesson.id,release.id);
  assert.equal(lesson.version,release.version);
  assert.equal(lesson.source,release.id==='perfect-local'?'/api/music/audio':`/api/music/audio?trackId=${release.id}`);
  assert.equal(lesson.translationAlignmentVersion,'editorial-1');
  assert.equal(lesson.visualSource,'video' in release?`/api/music/video?trackId=${release.id}`:undefined);
  const counts={};
  for(const mode of ['level1','level2','level3','level4','quick','guided','challenge','typing']) {
    let minimum=Infinity,maximum=0;
    for(let seed=0;seed<100;seed++) {
      const rounds=buildMusicRounds(lesson,mode,seed);
      assert(rounds.length>0,`${release.id}/${mode}: no playable prompts`);
      minimum=Math.min(minimum,rounds.length);maximum=Math.max(maximum,rounds.length);
      let state=musicGameReducer(initialGame,{type:'start'});
      for(let i=0;i<rounds.length;i++) {
        const round=rounds[i];
        assert.equal(round.targets.length,1);
        assert.equal(round.answers.length,1);
        assert(/^[a-z][a-z0-9]*(?:'[a-z]+)?$/.test(round.answer));
        assert.equal(new Set(round.options).size,mode==='guided'?2:4);
        assert(round.options.every(option=>/^[a-z][a-z0-9]*(?:'[a-z]+)?$/.test(option)),`${release.id}/${mode}: compound option`);
        assert.equal(round.options.filter(option=>option===round.answer).length,1);
        assert.notEqual(round.line.words[round.target].challengeEligible,false);
        assert(validMusicTranslationSpans(round.line.translation,round.line.words[round.target].translationSpans));
        const translated=musicTranslationParts(round.line,round.targets);
        assert(translated?.some(part=>part.masked));
        assert(translated.filter(part=>part.masked).every(part=>!('text' in part)));
        assert(round.closes<=lesson.duration);
        if(i) assert(rounds[i-1].closes<=round.revealAt+1e-9);
        state=musicGameReducer(state,{type:'answer',index:i,value:round.answer,expected:round.answer,time:musicAnswerOpens(round),opens:musicAnswerOpens(round),closes:round.closes});
        state=musicGameReducer(state,{type:'tick',time:round.closes,deadlines:rounds.map(item=>item.closes),finishAt:lesson.duration});
      }
      state=musicGameReducer(state,{type:'tick',time:lesson.duration,deadlines:rounds.map(item=>item.closes),finishAt:lesson.duration});
      assert.equal(state.phase,'result');assert.equal(state.correct,rounds.length);assert.equal(state.lives,3);
    }
    counts[mode]=[minimum,maximum];
  }
  results.push({id:lesson.id,lines:lesson.lines.length,words:lesson.lines.reduce((sum,line)=>sum+line.words.length,0),duration:lesson.duration,video:!!lesson.visualSource,rounds:counts});
}
assert(availableOnly || results.length===11);
console.log(JSON.stringify({validated:results.length,tracks:results},null,2));
