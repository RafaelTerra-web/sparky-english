import { cookies } from 'next/headers';
import { readSession, SESSION_COOKIE } from '@/lib/auth-session';
import { getMusicCatalog, localMusicMode } from '@/lib/music-server';
export async function GET() {
  if (!await readSession((await cookies()).get(SESSION_COOKIE)?.value)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  return Response.json({ catalog: await getMusicCatalog(), storage: localMusicMode() ? 'lab' : 'account' }, { headers: { 'Cache-Control': 'private, no-store' } });
}
