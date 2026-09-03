// Isolated, localhost-only visual fixture. No production account or credential is used.
import { createServer, request } from 'node:http';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { seal } from '../src/lib/auth-session.ts';

if (process.env.VERCEL) throw new Error('The visual fixture must never run on Vercel.');
process.env.SPARKY_SESSION_SECRET = randomBytes(32).toString('hex');
process.env.SPARKY_ALLOWED_EMAILS = 'preview@example.test';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3201';
const token = await seal({ sub: 'local-visual-fixture', email: 'preview@example.test', name: 'Estudante' }, 'session', 3600);
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3200'], { env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'inherit'] });
let authenticated = true;
const proxy = createServer((incoming, outgoing) => {
  if (incoming.url === '/api/session' && incoming.method === 'DELETE') authenticated = false;
  const headers = { ...incoming.headers };
  if (authenticated && incoming.url === '/api/session') headers.cookie = `__Host-sparky_session=${token}`;
  const upstream = request({ hostname: '127.0.0.1', port: 3200, path: incoming.url, method: incoming.method, headers }, (response) => {
    outgoing.writeHead(response.statusCode || 500, response.headers); response.pipe(outgoing);
  });
  upstream.on('error', () => { outgoing.writeHead(503); outgoing.end('A prévia está iniciando. Atualize em instantes.'); });
  incoming.pipe(upstream);
});
proxy.listen(3201, '127.0.0.1', () => console.log('Local test account: http://localhost:3201 — no production authentication is bypassed.'));
child.stdout.on('data', (chunk) => process.stdout.write(chunk));
function stop() { proxy.close(); child.kill(); }
process.on('SIGINT', () => { stop(); process.exit(0); });
process.on('SIGTERM', () => { stop(); process.exit(0); });
child.on('exit', () => { proxy.close(); });
