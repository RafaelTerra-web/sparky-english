import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CreateBucketCommand, HeadBucketCommand, HeadObjectCommand, GetObjectCommand, PutObjectCommand, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import { approvedMusicFiles, approvedMusicSizes } from '../src/lib/music-approved.ts';
import { assertMusicR2Receipt, assertMusicR2Head, createMusicR2Client, musicContentType, r2Configuration, reviewedR2Key } from '../src/lib/music-r2.ts';

export async function inspectLocalBundle(directory = '.music-assets') {
  let size = 0;
  for (const [name, sha256] of Object.entries(approvedMusicFiles)) {
    const hash = createHash('sha256');
    let bytes = 0;
    for await (const chunk of createReadStream(resolve(directory, name))) { hash.update(chunk); bytes += chunk.length; }
    if (hash.digest('hex') !== sha256 || bytes !== approvedMusicSizes[name]) throw Error(`Unreviewed music file: ${name}`);
    size += bytes;
  }
  return { files: Object.keys(approvedMusicFiles).length, bytes: size };
}

export function musicCors(origins) {
  const allowed = [...new Set(origins)];
  if (!allowed.length || allowed.some(origin => {
    try { const url = new URL(origin); return origin.includes('*') || url.protocol !== 'https:' || url.origin !== origin || url.username || url.password; }
    catch { return true; }
  })) throw Error('CORS requires explicit HTTPS origins');
  return { CORSRules: [{ AllowedOrigins: allowed, AllowedMethods: ['GET', 'HEAD'], AllowedHeaders: ['Range'],
    ExposeHeaders: ['Accept-Ranges', 'Content-Length', 'Content-Range', 'ETag'], MaxAgeSeconds: 3600 }] };
}

async function saveJson(path, value) {
  await mkdir(dirname(resolve(path)), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n');
  await rename(temporary, path);
}

export async function migrateMusicR2({ client, identity, directory = '.music-assets', statePath = '.music-assets/r2-migration-state.json', receiptPath = 'config/music-r2-receipt.json', onVerified = () => {} }) {
  // Validate the entire local bundle before the first cloud mutation.
  await inspectLocalBundle(directory);
  let receipt = { schema: 1, accountId: identity.accountId, bucket: identity.bucket, prefix: identity.prefix, files: {} };
  try { receipt = JSON.parse(await readFile(statePath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  assertMusicR2Receipt(receipt, identity, false);
  for (const [name, sha256] of Object.entries(approvedMusicFiles)) {
    const Key = reviewedR2Key(name), Bucket = identity.bucket;
    let head;
    try { head = await client.send(new HeadObjectCommand({ Bucket, Key })); }
    catch (error) { if (error.$metadata?.httpStatusCode !== 404 && error.name !== 'NotFound' && error.name !== 'NoSuchKey') throw error; }
    const previous = receipt.files[name];
    if (previous) {
      if (!head) throw Error(`Previously verified R2 file disappeared: ${name}`);
      assertMusicR2Head(name, head, previous);
      onVerified(name, 'resumed');
      continue;
    }
    if (!head) {
      // Conditional creation avoids replacing another deployment's object.
      const bytes = await readFile(resolve(directory, name));
      if (createHash('sha256').update(bytes).digest('hex') !== sha256) throw Error(`Music file changed before upload: ${name}`);
      await client.send(new PutObjectCommand({ Bucket, Key, Body: bytes, ContentLength: bytes.length,
        ContentType: musicContentType(name), ContentMD5: createHash('md5').update(bytes).digest('base64'),
        CacheControl: 'private, no-store', Metadata: { sha256 }, StorageClass: 'STANDARD', IfNoneMatch: '*' }));
    }
    // A receipt is issued only after a complete read-back, never from a claimed checksum.
    const object = await client.send(new GetObjectCommand({ Bucket, Key }));
    if (!object.Body) throw Error(`R2 read-back is unavailable: ${name}`);
    const hash = createHash('sha256');
    let size = 0;
    for await (const chunk of object.Body) { hash.update(chunk); size += chunk.length; }
    if (hash.digest('hex') !== sha256 || size !== approvedMusicSizes[name] || !object.ETag)
      throw Error(`R2 read-back differs from the reviewed file: ${name}`);
    const file = { key: Key, sha256, size, etag: object.ETag, verifiedAt: new Date().toISOString() };
    // Re-check the version after the download; a concurrent overwrite must fail.
    const current = await client.send(new HeadObjectCommand({ Bucket, Key }));
    assertMusicR2Head(name, current, file);
    receipt.files[name] = file;
    await saveJson(statePath, receipt);
    onVerified(name, 'verified');
  }
  assertMusicR2Receipt(receipt, identity);
  await saveJson(receiptPath, receipt);
  return receipt;
}

async function main() {
  const command = process.argv[2] || '--plan';
  if (command === '--plan') { console.log(JSON.stringify(await inspectLocalBundle())); return; }
  const config = r2Configuration(process.env, true);
  const client = createMusicR2Client(config);
  if (command === '--prepare-bucket') {
    try { await client.send(new HeadBucketCommand({ Bucket: config.bucket })); }
    catch (error) {
      if (error.$metadata?.httpStatusCode !== 404) throw error;
      await client.send(new CreateBucketCommand({ Bucket: config.bucket }));
    }
    const cors = musicCors((process.env.SPARKY_MUSIC_ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean));
    await client.send(new PutBucketCorsCommand({ Bucket: config.bucket, CORSConfiguration: cors }));
    const actual = await client.send(new GetBucketCorsCommand({ Bucket: config.bucket }));
    const same = actual.CORSRules?.length === 1 && cors.CORSRules.every(expected => actual.CORSRules.some(rule =>
      ['AllowedOrigins', 'AllowedMethods', 'AllowedHeaders', 'ExposeHeaders'].every(key =>
        JSON.stringify([...(rule[key] || [])].sort()) === JSON.stringify([...expected[key]].sort()))));
    if (!same) throw Error('R2 CORS verification failed');
    console.log('Private R2 bucket and explicit media CORS verified.');
  } else if (command === '--upload') {
    await migrateMusicR2({ client, identity: config, onVerified: (name, result) => console.log(`${result}: ${name}`) });
    console.log('All 40 reviewed files were verified. Migration receipt saved.');
  } else throw Error('Use --plan, --prepare-bucket or --upload');
  client.destroy();
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await main(); }
  catch (error) {
    // SDK diagnostics can contain request details. Never print credentials or signed URLs.
    console.error(`R2 migration failed (${error.name || 'Error'}, HTTP ${error.$metadata?.httpStatusCode || 'n/a'}). Check configuration and the reviewed bundle; no switch was made.`);
    process.exitCode = 1;
  }
}
