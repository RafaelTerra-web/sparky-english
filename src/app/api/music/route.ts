import { cookies } from 'next/headers';
import { readSession, SESSION_COOKIE } from '@/lib/auth-session';
import { getMusicCatalogState, localMusicMode } from '@/lib/music-server';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET() {
  if (!await readSession((await cookies()).get(SESSION_COOKIE)?.value)) return Response.json({ error: 'unauthorized' }, { status: 401, headers });
  try {
    return Response.json({ ...await getMusicCatalogState(), storage: localMusicMode() ? 'lab' : 'account' }, { headers });
  } catch {
    return Response.json({ error: 'music-unavailable' }, { status: 503, headers });
  }
}
