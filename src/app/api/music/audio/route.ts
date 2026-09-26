import { open, stat, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { cookies } from 'next/headers';
import { readSession, SESSION_COOKIE } from '@/lib/auth-session';
import { localMusicMode } from '@/lib/music-server';
import { musicRelease } from '@/lib/music-release';
import { hasReviewedMusicStore, reviewedMusicRedirect } from '@/lib/music-blob';
export async function GET(request: Request) {
  if (!await readSession((await cookies()).get(SESSION_COOKIE)?.value)) return new Response(null, { status: 401 });
  const release = musicRelease(new URL(request.url).searchParams.get('trackId'));
  if (!release) return new Response(null, { status: 404 });
  try {
    if (hasReviewedMusicStore() && !localMusicMode()) return await reviewedMusicRedirect(release.audio);
    // Serve only the prepared quiet PCM copy. Never silently fall back to the
    // loud MP3 when the preparation is missing or belongs to another source.
    let path = join(process.cwd(), '.music-assets', release.audio);
    if (localMusicMode() && release.id === 'perfect-local') {
      if (!process.env.SPARKY_MEDIA_DEV_AUDIO_PATH) return new Response(null, { status: 404 });
      const report = JSON.parse(await readFile(join(process.cwd(), '.music-lab', 'audio-report.json'), 'utf8'));
      if (resolve(report.source) !== resolve(process.env.SPARKY_MEDIA_DEV_AUDIO_PATH)) return new Response(null, { status: 503 });
      path = join(process.cwd(), '.music-lab', 'audio-soft.wav');
    }
    const { size } = await stat(path);
    const range = request.headers.get('range');
    let start = 0, end = size - 1;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
      start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
      if (!Number.isSafeInteger(start) || start < 0 || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    const file = await open(path, 'r');
    let cursor = start;
    const stream = new ReadableStream({ async pull(controller) { try { const chunk = Buffer.alloc(Math.min(65536, end - cursor + 1)); const { bytesRead } = await file.read(chunk, 0, chunk.length, cursor); cursor += bytesRead; if (bytesRead) controller.enqueue(new Uint8Array(chunk.subarray(0, bytesRead))); if (!bytesRead || cursor > end) { controller.close(); await file.close(); } } catch (e) { controller.error(e); await file.close(); } }, async cancel() { await file.close(); } });
    return new Response(stream, { status: range ? 206 : 200, headers: { 'Content-Type': path.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg', 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, no-store', ...(range ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}) } });
  } catch { return new Response(null, { status: 404 }); }
}
