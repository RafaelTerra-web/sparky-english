import { NextRequest } from 'next/server';
import { readSession, SESSION_COOKIE, sameOrigin } from '@/lib/auth-session';
import { accountKey, loadOnboarding, onboardingDB } from '@/lib/onboarding-store';
import { readBoundedJson } from '@/lib/bounded-json';
import { lessons } from '@/lib/curriculum';
import { personalizeLesson } from '@/lib/personalized-lesson';
import { generateMascotAudio } from '@/lib/gemini-voice';
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return new Response(null, { status: 401 });
  try {
    const body = await readBoundedJson(request);
    if (body.lessonId !== 'a1-1-1' || !['sparky', 'pinky'].includes(String(body.mascot))) return new Response(null, { status: 400 });
    const key = accountKey(user.id), { profile } = await loadOnboarding(key);
    if (!profile?.onboardingCompleted) return new Response(null, { status: 409 });
    const lesson = personalizeLesson(lessons.find(item => item.id === body.lessonId)!, profile.name);
    const allowed = lesson.steps.flatMap(step => [step.kind === 'example' ? step.english : undefined, step.pronunciation?.drill[2]]).filter(Boolean);
    if (typeof body.text !== 'string' || !allowed.includes(body.text)) return new Response(null, { status: 400 });
    const slot = await onboardingDB().rpc('sparky_take_name_audio_slot', { p_account: key });
    if (slot.error || !slot.data) return new Response(null, { status: slot.error ? 503 : 429 });
    const audio = await generateMascotAudio(body.text, body.mascot as 'sparky' | 'pinky', 'en-US');
    return new Response(new Uint8Array(audio), { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, no-store' } });
  } catch { return new Response(null, { status: 503 }); }
}
