import 'server-only';
import { createHash } from 'node:crypto';
import { verbAudioIdentity,type VerbAudioMascot } from './verb-audio-shared';
import { pcmToWav } from './gemini-voice';
export function verbAudioHash(id:string,mascot:VerbAudioMascot){const identity=verbAudioIdentity(id,mascot);return identity?createHash('sha256').update(JSON.stringify(identity)).digest('hex').slice(0,32):null;}
export async function generateVerbAudio(id:string,mascot:VerbAudioMascot){
 const identity=verbAudioIdentity(id,mascot);if(!identity)throw Error('invalid-verb');
 const key=process.env.GEMINI_API_KEY;if(!key)throw Error('provider-unavailable');
 const provider=process.env.GEMINI_TTS_PROVIDER==='vertex'?'https://aiplatform.googleapis.com/v1beta1/publishers/google/models/':'https://generativelanguage.googleapis.com/v1beta/models/';
 const response=await fetch(provider+identity.model+':generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},signal:AbortSignal.timeout(70000),body:JSON.stringify({contents:[{role:'user',parts:[{text:identity.text,speech_metadata:{style:identity.style}}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{voice:identity.voice}}}})});
 if(!response.ok)throw Error('provider-'+response.status);
 const result=await response.json();const data=result.candidates?.[0]?.content?.parts?.find((part:{inlineData?:{data:string}})=>part.inlineData)?.inlineData;
 if(!data?.data)throw Error('provider-empty');
 const bytes=Buffer.from(data.data,'base64');
 if(bytes.length<48||bytes.length>12*1024*1024)throw Error('provider-audio-size');
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE')return bytes;
 if(!/^audio\/(L16|pcm)/i.test(data.mimeType??''))throw Error('provider-audio-format');
 return pcmToWav(bytes);
}
