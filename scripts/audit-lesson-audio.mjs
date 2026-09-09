import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { lessons } from '../src/lib/curriculum.ts';
import { lessonVoiceIdentity, lessonDelivery } from '../src/lib/lesson-voice-config.ts';

const manifest = JSON.parse(await readFile('src/lib/content/voice-manifest.json','utf8'));
const rows = [], pending = [], flags = [];
for (const lesson of lessons.filter(item => lessonDelivery[item.level])) {
  const text = lesson.steps.find(step => step.kind === 'example').english;
  for (const mascot of ['sparky','pinky']) {
    const identity = lessonVoiceIdentity(text,mascot,lesson.level);
    const hash = createHash('sha256').update(JSON.stringify(identity)).digest('hex').slice(0,32);
    const path = `/audio/mascots/${hash}.wav`;
    if (manifest[lesson.id]?.[mascot] !== path) { pending.push(`${lesson.id}/${mascot}`); continue; }
    const data = await readFile('public'+path);
    if (data.toString('ascii',0,4)!=='RIFF' || data.readUInt32LE(24)!==24000 || data.readUInt16LE(22)!==1 || data.readUInt16LE(34)!==16 || data.readUInt32LE(40)!==data.length-44) throw new Error(`Invalid PCM WAV: ${path}`);
    let first=-1,last=-1,peak=0,clipped=0;
    for(let i=44;i<data.length;i+=2){const v=Math.abs(data.readInt16LE(i));peak=Math.max(peak,v);if(v>=32760)clipped++;if(v>400){if(first<0)first=i;last=i;}}
    const voicedSpan = first<0 ? 0 : (last-first+2)/48000;
    const words = text.split(/\s+/).length;
    const wpm = voicedSpan ? words*60/voicedSpan : 0;
    const entry={deliveryVersion:identity.version ?? 1,lessonId:lesson.id,level:lesson.level,mascot,path,model:identity.model,voice:identity.voice,sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length,durationSeconds:+((data.length-44)/48000).toFixed(2),speechSpanSeconds:+voicedSpan.toFixed(2),approximateWpm:Math.round(wpm),peak,clippedSamples:clipped};
    rows.push(entry);
    if (!voicedSpan || clipped || wpm<95 || wpm>300) flags.push(entry);
  }
}
const summary={validated:rows.length,regenerated:rows.filter(row=>row.deliveryVersion===2).length,preserved:rows.filter(row=>row.deliveryVersion===1).length,pending:pending.length,flags:flags.length,levels:Object.fromEntries(['B1','B2','C1','C2'].map(level=>{const group=rows.filter(r=>r.level===level);return[level,{files:group.length,meanApproximateWpm:group.length?Math.round(group.reduce((s,r)=>s+r.approximateWpm,0)/group.length):0}]}))};
await mkdir('.voice-qa',{recursive:true});
await writeFile('.voice-qa/lesson-audio-v2.json',JSON.stringify({summary,notes:'Technical signal inspection, not a transcript or human listening review. WPM excludes leading/trailing silence; short sentences vary considerably.',rows,pending,flags},null,2)+'\n');
console.log(JSON.stringify(summary));
if(pending.length||flags.length) process.exitCode=1;
