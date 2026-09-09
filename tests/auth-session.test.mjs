import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { seal, unseal, readSession, emailAllowed, googleConfigured, sameValue, sameOrigin } from '../src/lib/auth-session.ts';
import { lessons } from '../src/lib/curriculum.ts';

process.env.SPARKY_SESSION_SECRET = randomBytes(32).toString('hex');
process.env.SPARKY_ALLOWED_EMAILS = 'invited@example.com,second@example.com';
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
  assert.equal(emailAllowed(' SECOND@example.com '), true);
  assert.equal(emailAllowed('second@example.com.attacker.test'), false);
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

test('new invitations preserve existing lists and never authorize similar addresses', () => {
  const keys = ['SPARKY_ALLOWED_EMAILS', 'SPARKY_ADDITIONAL_ALLOWED_EMAILS', 'SPARKY_INVITED_EMAILS', 'SPARKY_GOOGLE_CLIENT_ID'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.SPARKY_GOOGLE_CLIENT_ID = 'test-client';
    process.env.SPARKY_ADDITIONAL_ALLOWED_EMAILS = 'previous@example.com';
    process.env.SPARKY_INVITED_EMAILS = ' New.Student@example.com , ';
    assert.equal(emailAllowed('invited@example.com'), true);
    assert.equal(emailAllowed('previous@example.com'), true);
    assert.equal(emailAllowed(' NEW.STUDENT@example.com '), true);
    assert.equal(emailAllowed('new.student@example.com.attacker.test'), false);
    assert.equal(emailAllowed('other@example.com'), false);
    assert.equal(googleConfigured(), true);
    process.env.SPARKY_ALLOWED_EMAILS = '';
    process.env.SPARKY_ADDITIONAL_ALLOWED_EMAILS = '';
    assert.equal(googleConfigured(), true);
    process.env.SPARKY_INVITED_EMAILS = ', ,';
    assert.equal(googleConfigured(), false);
    assert.equal(emailAllowed('new.student@example.com'), false);
  } finally {
    for (const key of keys) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
  }
});

test('mutating requests reject absent or foreign origins', () => {
  assert.equal(sameOrigin(new Request('https://sparky.example.com/api/session', { headers: { origin: 'https://sparky.example.com' } })), true);
  assert.equal(sameOrigin(new Request('https://sparky.example.com/api/session', { headers: { origin: 'https://attacker.test' } })), false);
  assert.equal(sameOrigin(new Request('https://sparky.example.com/api/session')), false);
});

test('published lessons have distinct content and solvable exercises', () => {
  assert.match(JSON.stringify(lessons[0]), /Hi, I'm Ana/);
  assert.doesNotMatch(JSON.stringify(lessons), /Maya/i);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
  const independentExamples = lessons.filter(lesson => lesson.id !== 'c2-significado-em-disputa-02');
  assert.equal(new Set(independentExamples.map(lesson => lesson.steps.find(step => step.kind === 'example').english)).size, independentExamples.length);
  for (const lesson of lessons) {
    assert.equal(lesson.steps[0].kind, 'hook');
    assert.equal(lesson.steps.at(-1).kind, 'summary');
    for (const step of lesson.steps) {
      if (step.kind === 'choice' || step.kind === 'complete_sentence') assert.ok(step.options.includes(step.answer));
      if (step.kind === 'order_words') assert.deepEqual([...step.options].sort(), step.answer.split(' ').sort());
    }
  }
});
