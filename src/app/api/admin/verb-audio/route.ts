import { timingSafeEqual } from 'node:crypto';
import { verbAudioHash,generateVerbAudio } from '@/lib/verb-audio';
import { verbAudioModel } from '@/lib/verb-audio-shared';
import { onboardingDB } from '@/lib/onboarding-store';
export const maxDuration=90;
function authorized(request:Request){const key=process.env.SPARKY_AUDIO_ADMIN_TOKEN;const expected=key?`Bearer ${key}`:'';const supplied=request.headers.get('authorization')??'';return !!expected&&Buffer.byteLength(supplied)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(supplied),Buffer.from(expected));}
export async function GET(request:Request){if(!authorized(request))return new Response(null,{status:401});return Response.json({model:verbAudioModel,configured:!!process.env.GEMINI_API_KEY,provider:process.env.GEMINI_TTS_PROVIDER==='vertex'?'vertex':'gemini'},{headers:{'Cache-Control':'no-store'}});}
// Administrative preparation only. Fixed editorial bank, never arbitrary request text.
export async function POST(request:Request){
 if(!authorized(request))return new Response(null,{status:401});
 const query=new URL(request.url).searchParams;const id=query.get('verb')??'';const mascot=query.get('mascot');
 if(mascot!=='sparky'&&mascot!=='pinky')return new Response(null,{status:400});
 const hash=verbAudioHash(id,mascot);if(!hash)return new Response(null,{status:400});
 try{const storage=onboardingDB().storage.from('sparky-personal-audio'),path=`verb-bank-v1/${hash}.wav`;const cached=await storage.download(path);
 if(cached.error&&!['404','400'].includes(String((cached.error as {statusCode?:string}).statusCode)))return Response.json({error:'storage-unavailable'},{status:503});
 let bytes:Buffer;if(cached.data)bytes=Buffer.from(await cached.data.arrayBuffer());else{bytes=await generateVerbAudio(id,mascot);const saved=await storage.upload(path,bytes,{contentType:'audio/wav',upsert:false});if(saved.error){const winner=await storage.download(path);if(!winner.data)throw Error('storage-write');bytes=Buffer.from(await winner.data.arrayBuffer());}}
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'audio/wav','Cache-Control':'no-store','X-Audio-Identity':hash,'X-Audio-Model':verbAudioModel}});
 }catch(error){const message=error instanceof Error?error.message:'';return Response.json({error:'verb-audio-unavailable',category:/^(provider-\d{3}|provider-empty|provider-audio-size|provider-audio-format|provider-unavailable|storage-write)$/.test(message)?message:'generation'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
