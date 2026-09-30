import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('worker never serves app bundles from its cache and displays visible push', async () => {
  const handlers = new Map();
  const notifications = [];
  const self = {
    location: { hostname: 'sparky.example', origin: 'https://sparky.example' },
    addEventListener: (name, handler) => handlers.set(name, handler),
    registration: { showNotification: async (title, options) => { notifications.push({ title, options }); } },
    clients: { claim: async () => undefined },
    skipWaiting: () => undefined,
  };
  const calls = [];
  const fetch = async (request, options) => { calls.push({ request, options }); return { ok: true }; };
  vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), { self, URL, fetch, caches: {}, Response, AbortController, setTimeout, clearTimeout });
  const staticRequest = { method: 'GET', url: 'https://sparky.example/_next/static/chunks/new.js', mode: 'no-cors' };
  let intercepted = false;
  handlers.get('fetch')({ request: staticRequest, respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, false);
  assert.equal(calls.length, 0);

  const navigation = { method: 'GET', url: 'https://sparky.example/', mode: 'navigate' };
  let response;
  handlers.get('fetch')({ request: navigation, respondWith: value => { response = value; } });
  await response;
  assert.equal(calls[0].options.cache, 'no-store');

  let pending;
  handlers.get('push')({ data: { json: () => ({ title: 'Sparky', body: 'Pratique hoje', url: '/', kind: 'review' }) }, waitUntil: value => { pending = value; } });
  await pending;
  assert.equal(notifications[0].title, 'Sparky');
  assert.equal(notifications[0].options.body, 'Pratique hoje');
  assert.equal(notifications[0].options.icon, '/notifications/review.webp');
  assert.equal(notifications[0].options.image, '/notifications/review.webp');
});

test('worker refreshes shell assets online and falls back to the last copy offline', async () => {
  const handlers = new Map();
  const url = 'https://sparky.example/icons/sparky-192-v2.png';
  const stored = new Map([[url, new Response('old icon')]]);
  const cache = {
    match: async request => stored.get(request.url)?.clone(),
    put: async (request, response) => { stored.set(request.url, response); },
  };
  const caches = { open: async () => cache, match: cache.match };
  const self = {
    location: { hostname: 'sparky.example', origin: 'https://sparky.example' },
    addEventListener: (name, handler) => handlers.set(name, handler),
  };
  let online = true;
  const calls = [];
  const fetch = async (request, options) => {
    calls.push({ request, options });
    if (!online) throw Error('offline');
    return new Response('new icon', { headers: { 'Cache-Control': 'public, max-age=0' } });
  };
  vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), { self, URL, fetch, caches, Response, AbortController, setTimeout, clearTimeout });

  const request = { method: 'GET', url, mode: 'no-cors' };
  const waitUntil = [];
  let result;
  handlers.get('fetch')({ request, respondWith: value => { result = value; }, waitUntil: value => waitUntil.push(value) });
  assert.equal(await (await result).text(), 'new icon');
  await Promise.all(waitUntil);
  assert.equal(await stored.get(url).clone().text(), 'new icon');
  assert.equal(calls[0].options.cache, 'no-store');

  online = false;
  handlers.get('fetch')({ request, respondWith: value => { result = value; }, waitUntil: value => waitUntil.push(value) });
  assert.equal(await (await result).text(), 'new icon');
});

function workerHarness({ network } = {}) {
  const handlers = new Map(), stores = new Map(), removed = [];
  const key = request => new URL(typeof request === 'string' ? request : request.url, 'https://sparky.example').href;
  const caches = {
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return { match: async request => store.get(key(request))?.clone(), put: async (request, response) => store.set(key(request), response.clone()) };
    },
    keys: async () => [...stores.keys()],
    delete: async name => { removed.push(name); return stores.delete(name); },
  };
  const self = {
    location: { hostname: 'sparky.example', origin: 'https://sparky.example' },
    addEventListener: (name, handler) => handlers.set(name, handler),
    clients: { claim: async () => undefined, matchAll: async () => [] },
    skipWaiting: () => undefined,
  };
  const calls = [];
  const fetch = async (request, options) => {
    calls.push({ request, options });
    return network ? network(request, options) : new Response('public shell', { headers: { 'cache-control': 'public, max-age=0' } });
  };
  vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), { self, URL, fetch, caches, Response, AbortController, setTimeout, clearTimeout });
  const lifecycle = async name => { let pending; handlers.get(name)({ waitUntil: value => { pending = value; } }); await pending; };
  const request = async (path, mode = 'navigate', method = 'GET') => {
    let response; const pending = [];
    handlers.get('fetch')({ request: { method, mode, url: 'https://sparky.example' + path }, respondWith: value => { response = value; }, waitUntil: value => pending.push(value) });
    const result = await response; await Promise.all(pending); return result;
  };
  return { lifecycle, request, stores, removed, calls, caches };
}

test('worker installs only anonymous shell files, migrates old caches and falls back on network errors and 5xx', async () => {
  let online = true, outage = false;
  const worker = workerHarness({ network: async () => {
    if (!online) throw new Error('offline');
    return new Response(outage ? 'service unavailable' : 'public shell', { status: outage ? 503 : 200, headers: { 'cache-control': 'public' } });
  } });
  await worker.caches.open('sparky-public-v14'); await worker.caches.open('unrelated');
  await worker.lifecycle('install'); await worker.lifecycle('activate');
  assert.deepEqual(worker.removed, ['sparky-public-v14']);
  const stored = worker.stores.get('sparky-public-v15-musify-offline');
  assert.equal(stored.size, 11);
  assert.ok([...stored.keys()].every(url => !/api|auth|_next|audio|music\//.test(url)));
  assert.ok(worker.calls.every(call => call.options.credentials === 'omit'));
  online = false;
  assert.equal(await (await worker.request('/')).text(), 'public shell');
  assert.equal(await (await worker.request('/offline/practice.json', 'cors')).text(), 'public shell');
  online = true; outage = true;
  assert.equal(await (await worker.request('/')).text(), 'public shell');
  assert.equal(await (await worker.request('/offline/practice.mjs', 'cors')).text(), 'public shell');
  outage = false;
  assert.equal(await (await worker.request('/')).text(), 'public shell');
  assert.equal(stored.size, 11); // Navigation HTML was never cached.
});

test('worker never intercepts account endpoints, private audio, bundles, writes, or external origins', async () => {
  const worker = workerHarness();
  for (const path of ['/api/session', '/api/study', '/api/rewards', '/api/music/audio?track=x', '/auth/callback']) assert.equal(await worker.request(path), undefined);
  for (const path of ['/_next/static/chunks/app.js', '/audio/personalized.wav', '/audio/classes/a.mp3']) assert.equal(await worker.request(path, 'cors'), undefined);
  assert.equal(await worker.request('/offline/practice.json?private=true', 'cors'), undefined);
  assert.equal(await worker.request('/offline/practice.json', 'cors', 'POST'), undefined);
  assert.equal(worker.calls.length, 0);
});

test('worker rejects a private shell response at install and does not overwrite cached files with private data', async () => {
  let privateResponse = false;
  const worker = workerHarness({ network: async () => new Response('data', { headers: { 'cache-control': privateResponse ? 'private, no-store' : 'public' } }) });
  privateResponse = true;
  await assert.rejects(worker.lifecycle('install'), /offline-shell-unavailable/);
  assert.equal(worker.stores.get('sparky-public-v15-musify-offline').size, 0);
  privateResponse = false; await worker.lifecycle('install');
  const before = worker.stores.get('sparky-public-v15-musify-offline').get('https://sparky.example/offline/practice.json');
  privateResponse = true; await worker.request('/offline/practice.json', 'cors');
  assert.equal(worker.stores.get('sparky-public-v15-musify-offline').get('https://sparky.example/offline/practice.json'), before);
});
