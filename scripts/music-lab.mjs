// Disposable localhost-only test account. Never reads .env.local or production credentials.
import { createServer, request } from 'node:http';
import { connect } from 'node:net';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
if (process.env.VERCEL || process.env.NODE_ENV === 'production') throw Error('Local development only');
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/SUPABASE|SPARKY|OPENAI|GEMINI|GOOGLE|VERCEL|NEXT_PUBLIC/.test(k)));
const localConfig = existsSync('.music-lab/config.json') ? JSON.parse(readFileSync('.music-lab/config.json', 'utf8')) : {};
Object.assign(env, { NODE_ENV: 'development', SPARKY_SESSION_SECRET: randomBytes(32).toString('hex'), SPARKY_ALLOWED_EMAILS: 'music-lab@example.test', NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3221', SPARKY_MUSIC_LAB: 'true', SPARKY_DURABLE_PROGRESS: 'false', SPARKY_ONBOARDING_ENABLED: 'false', SPARKY_MEDIA_DEV_MANIFEST_PATH: resolve('.music-lab/manifest.json'), SPARKY_MEDIA_DEV_AUDIO_PATH: process.argv[2] || '' });
if (existsSync('.env.local')) throw Error('Remove local environment credentials from this isolated worktree before starting the lab.');
env.SPARKY_MEDIA_DEV_AUDIO_PATH ||= localConfig.audioPath || '';
if (!env.SPARKY_MEDIA_DEV_AUDIO_PATH || !existsSync(env.SPARKY_MEDIA_DEV_AUDIO_PATH)) throw Error('Pass the absolute path to a local MP3 as the first argument.');
Object.assign(process.env, { NODE_ENV: 'development', SPARKY_SESSION_SECRET: env.SPARKY_SESSION_SECRET });
const { seal } = await import('../src/lib/auth-session.ts');
const token = await seal({ sub: 'music-lab-local', email: 'music-lab@example.test', name: 'Estudante de teste' }, 'session', 86400);
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '3220'], { cwd: process.cwd(), env, stdio: ['ignore','pipe','pipe'], windowsHide: true });
const proxy = createServer((incoming, outgoing) => {
  if (!['127.0.0.1:3221','localhost:3221'].includes(incoming.headers.host)) { outgoing.writeHead(403); outgoing.end(); return; }
  const headers = { ...incoming.headers, cookie: `${incoming.headers.cookie || ''}; sparky_session=${token}` };
  const upstream = request({ hostname: '127.0.0.1', port: 3220, path: incoming.url, method: incoming.method, headers }, response => { outgoing.writeHead(response.statusCode || 500, response.headers); response.pipe(outgoing); });
  upstream.on('error', () => { outgoing.writeHead(503); outgoing.end('Laboratorio iniciando. Atualize em instantes.'); });
  incoming.pipe(upstream);
});
proxy.on('error', error => { console.error(error); child.kill(); process.exitCode = 1; });
proxy.on('upgrade', (incoming, socket, head) => {
  if (!['127.0.0.1:3221','localhost:3221'].includes(incoming.headers.host)) { socket.destroy(); return; }
  const upstream = connect(3220, '127.0.0.1', () => {
    upstream.write(`${incoming.method} ${incoming.url} HTTP/1.1\r\n${Object.entries(incoming.headers).map(([k,v]) => `${k}: ${v}`).join('\r\n')}\r\n\r\n`);
    if (head.length) upstream.write(head);
    socket.pipe(upstream); upstream.pipe(socket);
  });
  upstream.on('error', () => socket.destroy()); socket.on('error', () => upstream.destroy()); socket.on('close', () => upstream.destroy());
});
proxy.listen(3221, '127.0.0.1', () => console.log('Music lab: http://127.0.0.1:3221 — test account, no production credentials.'));
child.stdout.pipe(process.stdout); child.stderr.pipe(process.stderr);
const stop = () => { child.kill(); proxy.close(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop); child.on('exit', () => proxy.close());
