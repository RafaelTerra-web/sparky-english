// Bounded administrative generation of existing authored scripts. Credentials stay in the process.
import {mkdir,writeFile,access} from 'node:fs/promises';
import {advancedConversations} from '../src/lib/content/advanced-expansion.ts';
import {pcmToWav} from '../src/lib/gemini-voice.ts';
import {scriptDigest,digest,inspectWav,durationRanges} from './listening-audio-tools.mjs';
const id=process.argv.find(a=>a.startsWith('--id='))?.slice(5);
const c=advancedConversations.find(c=>c.id===id);
if(!c)throw Error('Select one existing conversation with --id');
const model='gemini-3.1-flash-tts-preview';
const out=new URL(`../.release-work/listening-generated/${id}-calm.wav`,import.meta.url);
try{await access(out);throw Error('Output exists; inspect it before generating again.');}catch(e){if(e.code!=='ENOENT')throw e;}
if(!process.env.GEMINI_API_KEY)throw Error('GEMINI_API_KEY is required in the process environment.');
const response=await fetch(`https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${model}:generateContent`,{
 method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},signal:AbortSignal.timeout(120000),
 body:JSON.stringify({contents:[{role:'user',parts:[{text:`${c.scene}\nRead the full dialogue below exactly. Relaxed, deliberate conversational delivery for English learners, about 115 words per minute. Short natural turn-taking pauses, no long silences, no added words or music. Sparky is a warm adult man, Pinky a clear and reassuring adult woman. Speak only the dialogue, not speaker labels.\n\n${c.turns.map(t=>`${t.speaker==='sparky'?'Sparky':'Pinky'}: ${t.text}`).join('\n\n')}`}]}],generationConfig:{speechConfig:{languageCode:'en-US',multiSpeakerVoiceConfig:{speakerVoiceConfigs:[{speaker:'Sparky',voiceConfig:{prebuiltVoiceConfig:{voiceName:'Achird'}}},{speaker:'Pinky',voiceConfig:{prebuiltVoiceConfig:{voiceName:'Zephyr'}}}]}}}})
});
if(!response.ok)throw Error(`Google TTS HTTP ${response.status}; provider body omitted.`);
const result=await response.json();
if(result.modelVersion!==model)throw Error('Returned model differs from requested model.');
const data=result.candidates?.[0]?.content?.parts?.find(p=>p.inlineData)?.inlineData;
if(!data?.data || !/^audio\/l16;\s*rate=24000;\s*channels=1$/i.test(data.mimeType))throw Error('Expected 24 kHz mono PCM16 response.');
const wav=pcmToWav(Buffer.from(data.data,'base64')),info=inspectWav(wav),[min,max]=durationRanges[c.level];
await mkdir(new URL('./',out),{recursive:true});await writeFile(out,wav,{flag:'wx'});
const report={id,model:result.modelVersion,voices:{sparky:'Achird',pinky:'Zephyr'},generatedAt:new Date().toISOString(),sha256:digest(wav),scriptSha256:scriptDigest(c),...info,durationAccepted:info.durationSeconds>=min && info.durationSeconds<=max,review:'pending',provider:'Google Cloud Vertex generateContent'};
await writeFile(new URL(out.href+'.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
