import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {generateSparkyAudio,onboardingSpeech,sparkyGeminiVoice} from '../src/lib/gemini-voice.ts';
import {placementBank} from '../src/lib/placement-bank.ts';
const root=new URL('../.voice-qa/onboarding/',import.meta.url);await mkdir(root,{recursive:true});
const items=[...Object.entries(onboardingSpeech),...placementBank.filter(i=>i.transcript).map(i=>[i.id,i.transcript])];
const manifest=[];
for(const [id,text] of items){
 const path=new URL(`${id}.wav`,root);let audio;try{audio=await readFile(path);}catch{audio=await generateSparkyAudio(text,false,id.startsWith('placement-')?'en-US':'pt-BR');await writeFile(path,audio);}
 manifest.push({id,...sparkyGeminiVoice,sha256:createHash('sha256').update(audio).digest('hex'),bytes:audio.length,generatedAt:new Date().toISOString()});console.log(`Ready: ${id}`);
}
await writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
