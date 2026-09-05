import assert from 'node:assert/strict';
const base = new URL(process.argv[2] || 'http://localhost:3200');
const session = await fetch(new URL('/api/session', base), { headers: { cookie: 'sparky_access=1; sparky_session=1; __Host-sparky_session=1' } });
assert.equal((await session.json()).authenticated, false);
assert.match(session.headers.get('cache-control'), /no-store/);
const crossOrigin = await fetch(new URL('/api/auth/google', base), { method: 'POST', headers: { origin: 'https://attacker.example', 'content-type': 'application/json' }, body: '{}' });
assert.equal(crossOrigin.status, 403);
const oldInvite = await fetch(new URL('/api/invite', base), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: 'SPARKY-START' }) });
assert.equal(oldInvite.status, 410);
assert.equal(oldInvite.headers.get('set-cookie'), null);
const config = await fetch(new URL('/api/auth/google', base));
assert.ok([200, 503].includes(config.status));
const rewards = await fetch(new URL('/api/rewards', base));
assert.equal(rewards.status, 401);
assert.match(rewards.headers.get('cache-control') || '', /no-store/);
const foreignRewards = await fetch(new URL('/api/rewards', base), { method: 'POST', headers: { origin: 'https://attacker.example', 'content-type': 'application/json' }, body: JSON.stringify({ action: 'buy', itemId: 'campus-cap' }) });
assert.equal(foreignRewards.status, 403);
if (config.status === 200) {
  const { nonce, clientId } = await config.json();
  assert.match(clientId, /\.apps\.googleusercontent\.com$/);
  const cookie = config.headers.get('set-cookie').split(';')[0];
  const invalid = await fetch(new URL('/api/auth/google', base), { method: 'POST', headers: { origin: base.origin, 'content-type': 'application/json', cookie }, body: JSON.stringify({ nonce, credential: 'not-a-google-id-token' }) });
  assert.equal(invalid.status, 401);
  assert.equal(invalid.headers.get('set-cookie'), null);
  console.log('PASS: invalid Google identity refused.');
} else {
  console.log('PENDING: Google client configuration; live ID-token route test not run.');
}
console.log('PASS: legacy-cookie bypass blocked, rewards protected, CSRF rejected, shared-code login removed.');
