import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {musicReleases} from '../src/lib/music-release.ts';
import {normalizeAnswer} from '../src/lib/music-game.ts';
import {validMusicTranslationSpans} from '../src/lib/music-translation.ts';
import {validateMusic} from '../src/lib/music.ts';

// Editorial bilingual equivalents stay with the private source bundle. No
// positional, proportional or cognate guesses are used to create alignment.
const report=[];
for(const release of musicReleases) {
  const support=JSON.parse(await readFile(`.music-assets/translation-support/${release.id}.json`,'utf8'));
  const old=release.version!=='musify-1';
  const input=old?({
    'perfect-local':'manifest.json','heartless-local':'heartless/manifest.json',
    'stay-at-your-house-local':'stay-at-your-house/manifest.json','buttercup-local':'buttercup-local/manifest.json',
  })[release.id]:release.manifest;
  const lesson=JSON.parse(await readFile(`.music-assets/${input}`,'utf8'));
  let eligible=0,mappedLines=0,excluded=0;
  for(const line of lesson.lines) {
    let mapped=false;
    for(let index=0;index<line.words.length;index++) {
      const word=line.words[index], terms=support.overrides?.[line.id]?.[index]??support.lexicon[normalizeAnswer(word.text)]??[];
      const spans=[];
      for(const term of terms) {
        if(typeof term!=='string'||!term.trim()) throw Error('Invalid editorial equivalent');
        const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const matches=line.translation.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,'giu'));
        for(const match of matches) spans.push({start:match.index,end:match.index+match[0].length});
      }
      const unique=[...new Map(spans.map(span=>[`${span.start}:${span.end}`,span])).values()].sort((a,b)=>a.start-b.start||a.end-b.end);
      delete word.translationSpans;
      if(validMusicTranslationSpans(line.translation,unique)) word.translationSpans=unique;
      if(word.challengeEligible!==false) {
        if(!word.translationSpans || !/^[a-z][a-z0-9]*(?:'[a-z]+)?$/.test(normalizeAnswer(word.text))) {word.challengeEligible=false;excluded++;}
        else {eligible++;mapped=true;}
      }
    }
    if(mapped)mappedLines++;
  }
  lesson.translationAlignmentVersion='editorial-1';
  validateMusic(lesson);
  const output=old?`musify-support-1/${release.id}.json`:release.manifest;
  await mkdir('.music-assets/musify-support-1',{recursive:true});
  await writeFile(`.music-assets/${output}`,JSON.stringify(lesson,null,2)+'\n');
  report.push({id:lesson.id,lines:lesson.lines.length,mappedLines,eligible,excluded,manifest:output});
}
await writeFile('.music-assets/translation-support/audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
