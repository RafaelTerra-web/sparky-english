// Read-only editorial workspace for the exact scripts sent through AI Studio UI.
// Bound to loopback; no credentials, private learner data or generation API.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { advancedConversations as conversations } from '../src/lib/content/advanced-expansion.ts';
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/database' && process.env.SPARKY_BOOTSTRAP_PREVIEW) {
    const sql = await readFile(process.env.SPARKY_BOOTSTRAP_PREVIEW, 'utf8');
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" });
    response.end(`<html lang="pt-BR"><meta charset="utf-8"><title>Sparky — migração revisável</title><h1>Bootstrap para banco vazio do Sparky English</h1><p>Esquema e rubrica beta. Sem credenciais ou dados pessoais. Conferir o projeto antes de executar.</p><pre id="database-bootstrap">${escape(sql)}</pre></html>`);
    return;
  }
  if (request.method !== 'GET' || request.url !== '/') { response.writeHead(404).end(); return; }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" });
  response.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Sparky — roteiros de listening</title><style>body{font:16px/1.6 system-ui;max-width:1000px;margin:32px auto;padding:20px;color:#173e36;background:#f6f3ed}pre{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid #ccd8d0;background:white;padding:20px;border-radius:12px}h1{font-size:28px}summary{cursor:pointer;padding:12px;font-weight:700}</style><h1>Roteiros autorais de listening</h1><p>${conversations.length} conversas em revisão. Estes textos não comprovam que os áudios já foram gerados ou aprovados.</p>${conversations.map(c => `<details><summary>${escape(c.id)} · ${escape(c.title)}</summary><pre id="${c.id}">${escape(JSON.stringify(c, null, 2))}</pre></details>`).join('')}</html>`);
}).listen(3210, '127.0.0.1', () => console.log('Editorial scripts: http://127.0.0.1:3210'));
