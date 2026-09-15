import { cookies } from 'next/headers';
import { readSession, sameOrigin, SESSION_COOKIE } from '@/lib/auth-session';
import { getMusicCatalog, readMusicProgress, writeMusicProgress } from '@/lib/music-server';
import { normalizeMusic } from '@/lib/music';
import { readBoundedJson } from '@/lib/bounded-json';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request: Request) {
  const user = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const lesson = (await getMusicCatalog()).find(x => x.id === new URL(request.url).searchParams.get('trackId'));
  if (!lesson) return json({ error: 'track-not-found' }, 404);
  try { return json(await readMusicProgress(user.id, lesson)); } catch { return json({ error: 'progress-unavailable' }, 503); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'origin' }, 403);
  const user = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return json({ error: 'unauthorized' }, 401);
  try {
    const body = await readBoundedJson(request, 16000) as { trackId?: string; baseRevision?: number; state?: Record<string, unknown> };
    if (!body || typeof body.trackId !== 'string' || typeof body.baseRevision !== 'number' || !Number.isSafeInteger(body.baseRevision) || body.baseRevision < 0 || !body.state || typeof body.state !== 'object') return json({ error: 'invalid-request' }, 400);
    const lesson = (await getMusicCatalog()).find(x => x.id === body.trackId);
    if (!lesson) return json({ error: 'track-not-found' }, 404);
    if (body.state.version !== lesson.version) return json({ error: 'content-version' }, 409);
    const clean = normalizeMusic(lesson, body.state);
    const state = body.state;
    const allowed = Object.keys(clean);
    if (Object.keys(state).some(k => !allowed.includes(k)) || ['heard','explored','saved','practiced'].some(k => JSON.stringify(state[k]) !== JSON.stringify(clean[k as keyof typeof clean])) || JSON.stringify(state.answers) !== JSON.stringify(clean.answers) || state.stage !== clean.stage || state.position !== clean.position || state.completed !== clean.completed) return json({ error: 'invalid-state' }, 400);
    const current = await readMusicProgress(user.id, lesson);
    if (current.revision !== body.baseRevision) return json({ error: 'progress-conflict', current }, 409);
    const { mergeMusic } = await import('@/lib/music');
    return json(await writeMusicProgress(user.id, lesson, mergeMusic(lesson, current, clean), body.baseRevision));
  } catch (e) {
    const code = e instanceof Error ? e.message : 'invalid-request';
    return json({ error: ['progress-conflict','progress-unavailable'].includes(code) ? code : 'invalid-request' }, code === 'progress-conflict' ? 409 : code === 'progress-unavailable' ? 503 : 400);
  }
}
