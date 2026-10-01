import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { approvedMusicFiles, approvedMusicSizes } from '../src/lib/music-approved.ts';
import { musicStorageProvider } from '../src/lib/music-storage-policy.ts';
import { assertMusicR2Receipt, assertMusicR2Head, createMusicR2Client, r2Configuration, reviewedR2Key, verifyMusicR2Heads, signedMusicR2Url, readMusicR2Manifest, musicContentType } from '../src/lib/music-r2.ts';
import { migrateMusicR2, musicCors } from '../scripts/migrate-music-r2.mjs';

const env = { R2_ACCOUNT_ID: 'a'.repeat(32), R2_BUCKET: 'sparky-reviewed-music', R2_ACCESS_KEY_ID: 'test-access', R2_SECRET_ACCESS_KEY: 'test-secret', R2_UPLOAD_ACCESS_KEY_ID: 'test-upload', R2_UPLOAD_SECRET_ACCESS_KEY: 'test-upload-secret' };
const identity = r2Configuration(env);
const etag = '"' + 'b'.repeat(32) + '"';
const file = name => ({ key: reviewedR2Key(name), sha256: approvedMusicFiles[name], size: approvedMusicSizes[name], etag, verifiedAt: '2026-10-01T00:00:00.000Z' });
const receipt = () => ({ schema: 1, accountId: identity.accountId, bucket: identity.bucket, prefix: identity.prefix, files: Object.fromEntries(Object.keys(approvedMusicFiles).map(name => [name, file(name)])) });
const head = name => ({ ContentLength: approvedMusicSizes[name], ETag: etag, Metadata: { sha256: approvedMusicFiles[name] }, ContentType: musicContentType(name) });

test('R2 provider is explicit and never falls back to blocked Blob or local files', () => {
  assert.equal(musicStorageProvider({ SPARKY_MUSIC_STORAGE: 'r2', BLOB_READ_WRITE_TOKEN: 'legacy' }), 'r2');
  assert.equal(musicStorageProvider({ BLOB_READ_WRITE_TOKEN: 'legacy' }), 'vercel');
  assert.equal(musicStorageProvider({}), 'local');
  assert.throws(() => musicStorageProvider({ VERCEL: '1' }));
  assert.throws(() => musicStorageProvider({ VERCEL: '1', SPARKY_MUSIC_STORAGE: 'local' }));
  assert.throws(() => musicStorageProvider({ SPARKY_MUSIC_STORAGE: 'unknown' }));
  assert.throws(() => r2Configuration({ ...env, R2_SECRET_ACCESS_KEY: '' }));
  assert.throws(() => r2Configuration({ ...env, R2_ACCOUNT_ID: 'https://attacker.test' }));
  assert.equal(r2Configuration(env, true).accessKeyId, 'test-upload');
});

test('private object allowlist prevents traversal and unreviewed manifests', () => {
  for (const name of Object.keys(approvedMusicFiles)) assert.equal(reviewedR2Key(name), `reviewed-v1/${name}`);
  for (const name of ['../secret', '/audio.mp3', 'audio.mp3?token=x', '__proto__', 'new-song.json']) assert.throws(() => reviewedR2Key(name));
});

test('signed GET lasts 30 minutes, uses only the account R2 endpoint and permits browser Range headers', async () => {
  const client = createMusicR2Client(identity);
  try {
    const url = new URL(await signedMusicR2Url(client, identity.bucket, 'audio.mp3'));
    assert.equal(url.hostname, `${identity.accountId}.r2.cloudflarestorage.com`);
    assert.equal(url.searchParams.get('X-Amz-Expires'), '1800');
    assert.equal(url.searchParams.get('X-Amz-SignedHeaders'), 'host');
    assert.ok(url.pathname.endsWith('/reviewed-v1/audio.mp3'));
    await assert.rejects(() => signedMusicR2Url(client, identity.bucket, '../secret'));
  } finally { client.destroy(); }
});

test('migration receipt is tied to store, complete reviewed set, hashes and sizes', () => {
  assertMusicR2Receipt(receipt(), identity);
  for (const invalid of [ { ...receipt(), bucket: 'other' }, { ...receipt(), accountId: 'c'.repeat(32) }, { ...receipt(), prefix: 'other/' }, { ...receipt(), schema: 2 }, { ...receipt(), files: {} } ]) assert.throws(() => assertMusicR2Receipt(invalid, identity));
  const changed = receipt(); changed.files['audio.mp3'].sha256 = '0'.repeat(64);
  assert.throws(() => assertMusicR2Receipt(changed, identity));
  const extra = receipt(); extra.files['unknown.mp3'] = file('audio.mp3');
  assert.throws(() => assertMusicR2Receipt(extra, identity));
});

test('ordinary release gate reads only HEAD and rejects a changed object version', async () => {
  const commands = [];
  const client = { async send(command) { commands.push(command.constructor.name); return head(command.input.Key.slice(identity.prefix.length)); } };
  await verifyMusicR2Heads(client, identity, receipt());
  assert.equal(commands.length, 40); assert.ok(commands.every(name => name === 'HeadObjectCommand'));
  for (const changed of [{ ETag: '"' + 'c'.repeat(32) + '"' }, { ContentLength: 1 }, { Metadata: { sha256: 'bad' } }, { ContentType: 'text/html' }])
    assert.throws(() => assertMusicR2Head('audio.mp3', { ...head('audio.mp3'), ...changed }, file('audio.mp3')));
});

test('catalog reads verify the original reviewed manifest rather than trusting object metadata', async () => {
  const name = 'musify-support-1/perfect-local.json';
  const bytes = await readFile(`.music-assets/${name}`);
  const valid = { async send() { return { Body: { async transformToByteArray() { return bytes; } } }; } };
  assert.equal(await readMusicR2Manifest(valid, identity.bucket, name), bytes.toString('utf8'));
  const invalid = { async send() { return { Body: { async transformToByteArray() { return Buffer.from('{}'); } } }; } };
  await assert.rejects(() => readMusicR2Manifest(invalid, identity.bucket, name));
  await assert.rejects(() => readMusicR2Manifest(valid, identity.bucket, 'audio.mp3'));
});

test('media CORS requires explicit HTTPS origins and only read/Range access', () => {
  const cors = musicCors(['https://sparky-english-iota.vercel.app', 'https://sparky-preview.vercel.app']);
  assert.deepEqual(cors.CORSRules[0].AllowedMethods, ['GET', 'HEAD']);
  assert.deepEqual(cors.CORSRules[0].AllowedHeaders, ['Range']);
  for (const value of [[], ['*'], ['https://*.vercel.app'], ['http://unsafe.test'], ['https://user:password@unsafe.test'], ['https://safe.test/path']]) assert.throws(() => musicCors(value));
});

test('transfer reads every uploaded file back once, resumes with HEAD, and rejects corrupt or changed data', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sparky-r2-test-'));
  const statePath = join(directory, 'state.json'), receiptPath = join(directory, 'receipt.json');
  const stored = new Set(), counts = { puts: 0, gets: 0, heads: 0 };
  const client = { async send(command) {
    const name = command.input.Key.slice(identity.prefix.length);
    if (command.constructor.name === 'HeadObjectCommand') {
      counts.heads++;
      if (!stored.has(name)) throw Object.assign(Error('missing'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } });
      return head(name);
    }
    if (command.constructor.name === 'PutObjectCommand') {
      counts.puts++; assert.equal(command.input.IfNoneMatch, '*'); assert.equal(command.input.StorageClass, 'STANDARD');
      assert.equal(command.input.Metadata.sha256, approvedMusicFiles[name]); stored.add(name); return { ETag: etag };
    }
    if (command.constructor.name === 'GetObjectCommand') {
      counts.gets++; return { Body: createReadStream(`.music-assets/${name}`), ETag: etag };
    }
    throw Error('unexpected command');
  } };
  try {
    await migrateMusicR2({ client, identity, statePath, receiptPath });
    assert.equal(counts.puts, 40); assert.equal(counts.gets, 40);
    assertMusicR2Receipt(JSON.parse(await readFile(receiptPath, 'utf8')), identity);
    await migrateMusicR2({ client, identity, statePath, receiptPath });
    assert.equal(counts.puts, 40); assert.equal(counts.gets, 40);
    const altered = JSON.parse(await readFile(statePath, 'utf8')); altered.files['audio.mp3'].etag = '"' + 'c'.repeat(32) + '"';
    await writeFile(statePath, JSON.stringify(altered));
    await assert.rejects(() => migrateMusicR2({ client, identity, statePath, receiptPath }), /metadata differs/);
    const corrupt = { async send(command) {
      if (command.constructor.name === 'HeadObjectCommand') return head('manifest.json');
      return { Body: (async function*() { yield Buffer.from('{}'); })(), ETag: etag };
    } };
    await assert.rejects(() => migrateMusicR2({ client: corrupt, identity, statePath: join(directory, 'new.json'), receiptPath: join(directory, 'never.json') }), /read-back differs/);
    await assert.rejects(() => readFile(join(directory, 'never.json')));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
