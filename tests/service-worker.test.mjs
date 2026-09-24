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
  vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), { self, URL, fetch, caches: {}, Response });
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
  handlers.get('push')({ data: { json: () => ({ title: 'Sparky', body: 'Pratique hoje', url: '/' }) }, waitUntil: value => { pending = value; } });
  await pending;
  assert.equal(notifications[0].title, 'Sparky');
  assert.equal(notifications[0].options.body, 'Pratique hoje');
});
