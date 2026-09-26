import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { musicCatalog } from './music-catalog';
import { musicReleases, musicAudioSource } from './music-release';
import { hasReviewedMusicStore, readReviewedMusicManifest } from './music-blob';
import { emptyMusicProgress, normalizeMusic, validateMusic, type MusicLesson, type MusicProgress } from './music';

const RELEASE_TIMING_VERSION = 'full-song-timing-2';

export function localMusicMode() { return process.env.NODE_ENV === 'development' && process.env.SPARKY_MUSIC_LAB === 'true' && !process.env.VERCEL; }
export async function getMusicCatalog() {
  const catalog = musicCatalog.filter(x => x.published);
  if (localMusicMode() && process.env.SPARKY_MEDIA_DEV_MANIFEST_PATH) {
    try {
      const data = JSON.parse(await readFile(process.env.SPARKY_MEDIA_DEV_MANIFEST_PATH, 'utf8')) as MusicLesson;
      catalog.push(validateMusic({ ...data, version: RELEASE_TIMING_VERSION, source: '/api/music/audio', rights: 'local-private', published: false }));
    } catch { /* An unavailable fixture must not expose filesystem information. */ }
  }
  for (const release of musicReleases) {
    if (localMusicMode() && release.id === 'perfect-local') continue;
    try {
      const text = hasReviewedMusicStore()
        ? await readReviewedMusicManifest(release.manifest)
        : await readFile(join(process.cwd(), '.music-assets', release.manifest), 'utf8');
      const data = JSON.parse(text) as MusicLesson;
      if (data.id !== release.id) throw Error('invalid-release');
      catalog.push(validateMusic({ ...data, version: release.version, source: musicAudioSource(release.id), rights: 'user-provided', published: true }));
    } catch { /* An absent release bundle is not a public filesystem error. */ }
  }
  return catalog;
}
const account = (id: string) => createHash('sha256').update(`google:${id}`).digest('hex');
// Local test backend has the same revision semantics; it never contacts Supabase.
const memory = globalThis as typeof globalThis & { musicLabProgress?: Map<string, MusicProgress> };
function database() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw Error('progress-unavailable');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function readMusicProgress(user: string, lesson: MusicLesson) {
  if (localMusicMode()) return (memory.musicLabProgress ??= new Map()).get(`${account(user)}:${lesson.id}`) ?? emptyMusicProgress(lesson);
  const { data, error } = await database().from('sparky_media_progress').select('state,revision').eq('account_key', account(user)).eq('track_id', lesson.id).maybeSingle();
  if (error) throw Error('progress-unavailable');
  return data ? { ...normalizeMusic(lesson, data.state), revision: data.revision } : emptyMusicProgress(lesson);
}
export async function writeMusicProgress(user: string, lesson: MusicLesson, state: MusicProgress, revision: number) {
  const next = { ...state, revision: revision + 1 };
  if (localMusicMode()) {
    const current = await readMusicProgress(user, lesson);
    if (current.revision !== revision) throw Error('progress-conflict');
    memory.musicLabProgress!.set(`${account(user)}:${lesson.id}`, next); return next;
  }
  const db = database(), key = account(user);
  const row = { account_key: key, track_id: lesson.id, revision: next.revision, state: next, updated_at: new Date().toISOString() };
  const result = revision === 0 ? await db.from('sparky_media_progress').insert(row).select('revision').maybeSingle() : await db.from('sparky_media_progress').update(row).eq('account_key', key).eq('track_id', lesson.id).eq('revision', revision).select('revision').maybeSingle();
  if (result.error?.code === '23505' || (!result.error && !result.data)) throw Error('progress-conflict');
  if (result.error) throw Error('progress-unavailable');
  return next;
}
