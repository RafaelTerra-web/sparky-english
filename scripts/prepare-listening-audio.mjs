// AI Studio handoff: export fixed scripts; import downloads as pending review, never auto-approve.
import {readFile,writeFile,mkdir,copyFile,rename,access,open,unlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {advancedConversations} from '../src/lib/content/advanced-expansion.ts';
import {composerText,scriptDigest,digest,inspectWav,durationRanges} from './listening-audio-tools.mjs';
const arg=name=>process.argv.find(x=>x.startsWith(`--${name}=`))?.slice(name.length+3);
const out=arg('out'),id=arg('id'),file=arg('file');
const root=new URL('../',import.meta.url);
if(out && !id && !file){
  await mkdir(out,{recursive:true});
  const queue=[];
  for(const c of advancedConversations){
    await writeFile(join(out,`${c.id}.txt`),composerText(c));
    queue.push({id:c.id,level:c.level,scriptSha256:scriptDigest(c),model:'gemini-3.1-flash-tts-preview',voices:{sparky:'Achird',pinky:'Zephyr'},durationRange:durationRanges[c.level]});
  }
  await writeFile(join(out,'queue.json'),JSON.stringify(queue,null,2)+'\n');
  console.log(`Exported ${queue.length} AI Studio scripts to ${resolve(out)}`);
}else if(id && file && !out){
  const c=advancedConversations.find(c=>c.id===id);if(!c)throw Error('Unknown conversation ID');
  const bytes=await readFile(file),info=inspectWav(bytes),[min,max]=durationRanges[c.level];
  if(info.durationSeconds<min || info.durationSeconds>max)throw Error(`Duration ${info.durationSeconds.toFixed(2)}s; expected ${min}–${max}s. Original file unchanged.`);
  const manifestUrl=new URL('src/lib/content/listening-assets.json',root);
  const lockUrl=new URL('src/lib/content/listening-assets.import-lock',root);
  const lock=await open(lockUrl,'wx');
  try {
  const manifest=JSON.parse(await readFile(manifestUrl,'utf8'));
  const sha256=digest(bytes),scriptSha256=scriptDigest(c);
  const target=new URL(`public/audio/listening/${id}.wav`,root);
  if(manifest[id]){
    if(manifest[id].sha256!==sha256 || manifest[id].scriptSha256!==scriptSha256)throw Error('Existing entry differs; review it before replacing audio.');
    if(digest(await readFile(target))!==sha256)throw Error('Existing audio failed integrity check');
    console.log('Already imported; review preserved.');
  }else{
    await mkdir(new URL('public/audio/listening/',root),{recursive:true});
    try{await access(target);throw Error('Unregistered audio exists; inspect it before importing.');}catch(error){if(error.code!=='ENOENT')throw error;}
    await copyFile(file,target,1);
    manifest[id]={id,path:`/audio/listening/${id}.wav`,sha256,scriptSha256,durationSeconds:info.durationSeconds,
      model:'gemini-3.1-flash-tts-preview',voices:{sparky:'Achird',pinky:'Zephyr'},generatedAt:new Date().toISOString(),
      review:{status:'pending',pronunciation:false,naturalness:false,cleanAudio:false,turns:false,coherence:false}};
    const temporary=new URL('src/lib/content/listening-assets.json.tmp',root);
    await writeFile(temporary,JSON.stringify(manifest,null,2)+'\n');await rename(temporary,manifestUrl);
    console.log(`Imported ${id}: ${info.durationSeconds.toFixed(2)}s. Pending auditory and script review; not published.`);
  }
  } finally {await lock.close();await unlink(lockUrl);}
}else throw Error('Use --out=<directory> OR --id=<conversation> --file=<AI Studio WAV>');
