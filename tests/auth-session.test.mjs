import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { seal, unseal, readSession, emailAllowed, sameValue, sameOrigin } from '../src/lib/auth-session.ts';
import { lessons } from '../src/lib/curriculum.ts';

process.env.SPARKY_SESSION_SECRET = randomBytes(32).toString('hex');
process.env.SPARKY_ALLOWED_EMAILS = 'invited@example.com';
process.env.NEXT_PUBLIC_SITE_URL = 'https://sparky.example.com';

test('sessions require authenticated encryption, the correct purpose and an invited email', async () => {
  const payload = { sub: 'google-user-123', email: 'invited@example.com', name: 'Estudante' };
  const token = await seal(payload, 'session', 600);
  assert.deepEqual(await readSession(token), { id: payload.sub, email: payload.email, name: payload.name });
  assert.equal(await readSession('1'), null);
  assert.equal(await readSession(token.slice(0, -5) + 'aaaaa'), null);
  assert.equal(await unseal(token, 'google-challenge'), null);
  assert.equal(await readSession(await seal(payload, 'session', -60)), null);
  assert.equal(await readSession(await seal({ ...payload, email: 'other@example.com' }, 'session', 600)), null);
  assert.equal(await readSession(await seal({ nonce: 'nonce' }, 'google-challenge', 600)), null);
});

test('the invitation list checks exact normalized addresses, never domains or substrings', () => {
  assert.equal(emailAllowed(' INVITED@example.com '), true);
  assert.equal(emailAllowed('uninvited@example.com'), false);
  assert.equal(emailAllowed('invited@example.com.attacker.test'), false);
  assert.equal(emailAllowed(''), false);
});

test('nonce comparison rejects mismatches, malformed values and unequal UTF-8 lengths', () => {
  const nonce = randomBytes(32).toString('base64url');
  assert.equal(sameValue(nonce, nonce), true);
  assert.equal(sameValue(nonce, randomBytes(32).toString('base64url')), false);
  assert.equal(sameValue(undefined, nonce), false);
  assert.equal(sameValue('é'.repeat(30), 'a'.repeat(30)), false);
});

test('mutating requests reject absent or foreign origins', () => {
  assert.equal(sameOrigin(new Request('https://sparky.example.com/api/session', { headers: { origin: 'https://sparky.example.com' } })), true);
  assert.equal(sameOrigin(new Request('https://sparky.example.com/api/session', { headers: { origin: 'https://attacker.test' } })), false);
  assert.equal(sameOrigin(new Request('https://sparky.example.com/api/session')), false);
});

test('published lessons have distinct content and solvable exercises', () => {
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
  assert.equal(new Set(lessons.map((lesson) => lesson.steps[1].english)).size, lessons.length);
  for (const lesson of lessons) {
    assert.equal(lesson.steps[0].kind, 'teach');
    assert.equal(lesson.steps.at(-1).kind, 'summary');
    for (const step of lesson.steps) {
      if (step.kind === 'choice' || step.kind === 'complete_sentence') assert.ok(step.options.includes(step.answer));
      if (step.kind === 'order_words') assert.deepEqual([...step.options].sort(), step.answer.split(' ').sort());
    }
  }
});
