import { conversationTips } from '@/lib/conversation-tips';
import { onboardingDB } from '@/lib/onboarding-store';
export async function GET(_request: Request, {params}:{params:Promise<{asset:string}>}) {
 const {asset} = await params;
 if (!conversationTips.some(t => ['sparky','pinky'].some(m => asset === `${t.id}-${m}.wav`))) return new Response(null,{status:404});
 try {
  const result = await onboardingDB().storage.from('sparky-personal-audio').download(`tips-v1/${asset}`);
  if (result.error) return new Response(null,{status:404});
  return new Response(result.data,{headers:{'Content-Type':'audio/wav','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
 } catch { return new Response(null,{status:503}); }
}
