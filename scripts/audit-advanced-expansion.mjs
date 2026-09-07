import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { advancedExpansionModules, advancedConversations } from '../src/lib/content/advanced-expansion.ts';
import { modules, lessons } from '../src/lib/curriculum.ts';
import { buildLesson } from '../src/lib/content/build.ts';
import { isExercise } from '../src/lib/study.ts';
import { listeningManifest, approvedListeningAsset } from '../src/lib/listening-manifest.ts';

const digest = text => createHash('sha256').update(text).digest('hex');
const durationRanges = { B2: [75,120], C1: [120,180], C2: [150,240] };
const entries = [];
for (const conversation of advancedConversations) {
  const asset = listeningManifest[conversation.id];
  const problems = [];
  const scriptSha256 = digest(JSON.stringify(conversation.turns.map(({speaker,text}) => ({speaker,text}))));
  if (!asset) problems.push('audio-not-generated');
  else {
    if (asset.scriptSha256 !== scriptSha256) problems.push('audio-script-mismatch');
    if (asset.model !== 'gemini-3.1-flash-tts-preview' || asset.voices.sparky !== 'Achird' || asset.voices.pinky !== 'Zephyr') problems.push('model-or-voice-mismatch');
    const [minimum,maximum] = durationRanges[conversation.level];
    if (!(asset.durationSeconds >= minimum && asset.durationSeconds <= maximum)) problems.push('audio-duration-out-of-range');
    if (!approvedListeningAsset(conversation.id)) problems.push('audio-review-pending');
    if (!/^\/audio\/listening\/[a-z0-9-]+\.(mp3|wav)$/.test(asset.path)) problems.push('invalid-audio-path');
    else {
      try {
        const file = await readFile(resolve('public', `.${asset.path}`));
        if (file.length < 1000 || digest(file) !== asset.sha256) problems.push('audio-file-integrity');
      } catch { problems.push('audio-file-missing'); }
    }
  }
  entries.push({id:conversation.id,level:conversation.level,wordCount:conversation.turns.map(t=>t.text).join(' ').split(/\s+/).length,scriptSha256,problems});
}
const drafts = advancedExpansionModules.flatMap(m => m.lessons.map((l,index)=>buildLesson(l,m,index)));
const report = {
  status: 'editorial-candidates-not-published',
  published: {modules:modules.length,lessons:lessons.length,exercises:lessons.reduce((n,l)=>n+l.steps.filter(isExercise).length,0)},
  draftedExpansion: {modules:advancedExpansionModules.length,lessons:drafts.length,exercises:drafts.reduce((n,l)=>n+l.steps.filter(isExercise).length,0)},
  combinedAfterAcceptance: {modules:modules.length+advancedExpansionModules.length,lessons:lessons.length+drafts.length,exercises:[...lessons,...drafts].reduce((n,l)=>n+l.steps.filter(isExercise).length,0)},
  audio: {approved:entries.filter(e=>!e.problems.length).length,total:entries.length,entries},
  externalReview: 'Two English teachers and an assessment specialist have not signed off. Automated checks do not replace these reviews.',
};
const directory = process.argv.find(arg=>arg.startsWith('--out='))?.slice(6);
if (directory) {
  await mkdir(directory,{recursive:true});
  await writeFile(join(directory,'advanced-expansion-audit.json'),JSON.stringify(report,null,2)+'\n');
  const markdown = ['# Sparky English — 36 lições em revisão','Material autoral ainda não publicado como listening. Áudios e revisão docente pendentes.'];
  for (const courseModule of advancedExpansionModules) {
    markdown.push(`\n## ${courseModule.level} · ${courseModule.title}\n${courseModule.description}`);
    for (const lesson of courseModule.lessons) {
      const c=lesson.listening;
      markdown.push(`\n### ${lesson.title}\nID: ${lesson.id}\n\n${lesson.rule}\n\n**Conversa**`);
      for (const turn of c.turns) markdown.push(`**${turn.speaker==='sparky'?'Sparky':'Pinky'}:** ${turn.text}\n\n${turn.translation}\n`);
      for (const [label,q] of [['Global',c.gist],['Detalhe',c.detail],['Inferência',c.inference]]) markdown.push(`**${label}:** ${q.question}\n\n${q.choices.map((choice,i)=>`${i+1}. ${choice}`).join('\n')}\n\nGabarito editorial: 1. ${q.explanation}\n`);
      markdown.push(`**Produção escrita:** ${lesson.production}\n\n**Fala livre:** ${lesson.speakingTask}\n\n**Mediação:** ${c.mediation}\n`);
    }
  }
  await writeFile(join(directory,'advanced-expansion-editorial.md'),markdown.join('\n')+'\n');
}
console.log(JSON.stringify({...report,audio:{approved:report.audio.approved,total:entries.length}},null,2));
if (process.argv.includes('--release') && entries.some(e=>e.problems.length)) process.exitCode=1;
