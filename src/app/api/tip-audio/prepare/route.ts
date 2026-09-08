import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { conversationTips } from '@/lib/conversation-tips';
import { voiceProfiles } from '@/lib/voice-config';
import { generateMascotAudio } from '@/lib/gemini-voice';
import { onboardingDB } from '@/lib/onboarding-store';
export const maxDuration = 60;
export async function POST(request: NextRequest) {
 if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new Response(null,{status:401});
 const params = request.nextUrl.searchParams, tip = conversationTips.find(t => t.id === params.get('id')), mascot = params.get('mascot');
 if (!tip || (mascot !== 'sparky' && mascot !== 'pinky')) return new Response(null,{status:400});
 try {
  const profile = voiceProfiles[mascot], storage = onboardingDB().storage.from('sparky-personal-audio');
  const hash = createHash('sha256').update(JSON.stringify({script:tip.script,profile,version:2})).digest('hex');
  const path = `tips-v2/${tip.id}-${mascot}.wav`;
  const cached = await storage.download(path);
  let bytes = cached.data ? Buffer.from(await cached.data.arrayBuffer()) : null;
  if (!bytes) {
   bytes = await generateMascotAudio(tip.script, mascot, 'pt-BR');
   if (bytes.length < 44 || bytes.length > 2000000 || bytes.toString('ascii',0,4) !== 'RIFF') throw new Error('invalid-audio');
   const upload = await storage.upload(path,bytes,{contentType:'audio/wav',upsert:false});
   if (upload.error) throw new Error('storage');
  }
  return NextResponse.json({id:tip.id,mascot,model:profile.model,voice:profile.voice,scriptHash:hash,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,url:`/audio/tips/${tip.id}-${mascot}.wav`},{headers:{'Cache-Control':'no-store'}});
 } catch { return NextResponse.json({error:'Não foi possível preparar este áudio.'},{status:503}); }
}
