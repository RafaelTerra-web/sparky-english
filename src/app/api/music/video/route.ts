import { open, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { cookies } from 'next/headers';
import { readSession, SESSION_COOKIE } from '@/lib/auth-session';
import { musicRelease } from '@/lib/music-release';

export async function GET(request: Request) {
  if (!await readSession((await cookies()).get(SESSION_COOKIE)?.value)) return new Response(null, { status: 401 });
  const release = musicRelease(new URL(request.url).searchParams.get('trackId'));
  if (!release || !('video' in release)) return new Response(null, { status: 404 });
  try {
    const path = join(process.cwd(), '.music-assets', release.video);
    const { size } = await stat(path);
    const range = request.headers.get('range');
    let start = 0, end = size - 1;
    const invalid = () => new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return invalid();
      start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end) return invalid();
    }
    const file = await open(path, 'r');
    let cursor = start, closed = false;
    const close = async () => { if (!closed) { closed = true; await file.close(); } };
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const chunk = Buffer.alloc(Math.min(65536, end - cursor + 1));
          const { bytesRead } = await file.read(chunk, 0, chunk.length, cursor);
          cursor += bytesRead;
          if (bytesRead) controller.enqueue(new Uint8Array(chunk.subarray(0, bytesRead)));
          if (!bytesRead || cursor > end) { controller.close(); await close(); }
        } catch (error) { controller.error(error); await close(); }
      },
      cancel: close,
    });
    return new Response(stream, { status: range ? 206 : 200, headers: {
      'Content-Type': 'video/mp4', 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, no-store',
      ...(range ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
    } });
  } catch { return new Response(null, { status: 404 }); }
}
