import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const publicDir = resolve('public');
let unavailable = false;
const types = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost:3225');
  if (url.pathname === '/test-outage' && request.method === 'POST') {
    unavailable = url.searchParams.get('enabled') === 'true'; response.writeHead(200); response.end('ok'); return;
  }
  if (unavailable) { response.writeHead(503, { 'content-type': 'text/plain', 'cache-control': 'no-store' }); response.end('test unavailable'); return; }
  if (url.pathname === '/api/release') {
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); response.end(JSON.stringify({ name: 'Musify', version: 'test' })); return;
  }
  if (url.pathname === '/') {
    response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'private, no-store' });
    response.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Offline test origin</title><h1>Conexão restabelecida</h1><script>navigator.serviceWorker.register("/sw.js", {scope:"/",updateViaCache:"none"})</script></html>'); return;
  }
  const target = resolve(publicDir, '.' + decodeURIComponent(url.pathname));
  if (!target.startsWith(publicDir + sep)) { response.writeHead(403); response.end(); return; }
  try {
    const body = await readFile(target);
    response.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream', 'cache-control': 'public, max-age=0', ...(url.pathname === '/sw.js' ? { 'service-worker-allowed': '/' } : {}) }); response.end(body);
  } catch { response.writeHead(404); response.end(); }
});
server.listen(3225, 'localhost');
