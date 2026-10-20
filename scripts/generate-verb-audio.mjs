// Fixed editorial bank. Uses the same protected no-alias preparation deployment as lesson audio.
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {verbBank} from '../src/lib/verb-practice.ts';
import {verbAudioIdentity,verbAudioVoices} from '../src/lib/verb-audio-shared.ts';
const deployment=process.argv.find(arg=>arg.startsWith('--deployment='))?.slice(13);
const cli=process.env.SPARKY_VERCEL_CLI;
if(!deployment||!/^https:\/\/sparky-english-[a-z0-9]+-rafaelterra-webs-projects\.vercel\.app$/.test(deployment)||!cli)throw Error('Use a pinned preparation deployment and SPARKY_VERCEL_CLI.');
const manifest=JSON.parse(await readFile('src/lib/verb-audio-manifest.json','utf8'));
await mkdir('public/audio/verbs',{recursive:true});
const jobs=verbBank.flatMap(verb=>Object.keys(verbAudioVoices).map(mascot=>({id:verb.id,mascot,hash:createHash('sha256').update(JSON.stringify(verbAudioIdentity(verb.id,mascot))).digest('hex').slice(0,32)})));
const limit=Number(process.argv.find(arg=>arg.startsWith('--limit='))?.slice(8)??36);
let completed=0;
for(const job of jobs){const path=`public/audio/verbs/${job.hash}.wav`;let existing;try{existing=await readFile(path);}catch{}
 if(existing?.toString('ascii',0,4)==='RIFF'){manifest[job.id+':'+job.mascot]='/audio/verbs/'+job.hash+'.wav';continue;}
 if(completed>=limit)break;
 try{await promisify(execFile)(process.execPath,[cli,'curl',`/api/admin/verb-audio?verb=${job.id}&mascot=${job.mascot}`,'--deployment',deployment,'--','--request','POST','--header','@.env.lesson-audio-header.local','--silent','--show-error','--fail-with-body','--max-time','95','--output',path],{timeout:110000});}catch{let category='request';try{category=JSON.parse(await readFile(path,'utf8')).category??'request';}catch{}console.error(job.id+'/'+job.mascot+': '+category);process.exitCode=1;break;}
 const bytes=await readFile(path);if(bytes.length<256||bytes.toString('ascii',0,4)!=='RIFF')throw Error('Invalid bank recording');manifest[job.id+':'+job.mascot]='/audio/verbs/'+job.hash+'.wav';await writeFile('src/lib/verb-audio-manifest.json',JSON.stringify(manifest,null,2)+'\n');completed++;console.log('Generated '+job.id+'/'+job.mascot);}
await writeFile('src/lib/verb-audio-manifest.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({generated:completed,available:Object.keys(manifest).length}));
