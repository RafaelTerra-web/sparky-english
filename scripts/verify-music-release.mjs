import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { get } from '@vercel/blob';
import { createMusicR2Client, r2Configuration, verifyMusicR2Heads } from '../src/lib/music-r2.ts';
import { musicStorageProvider } from '../src/lib/music-storage-policy.ts';

import { approvedMusicFiles } from '../src/lib/music-approved.ts';
export { approvedMusicFiles };

export async function verifyMusicRelease(directory = '.music-assets') {
  for (const [name, expected] of Object.entries(approvedMusicFiles)) {
    let bytes;
    try { bytes = await readFile(resolve(directory, name)); }
    catch { throw Error(`Music release is missing ${name}. Restore the reviewed private bundle before deploying.`); }
    if (createHash('sha256').update(bytes).digest('hex') !== expected)
      throw Error(`Music release ${name} differs from the reviewed bundle. Review the change before updating its fingerprint.`);
  }
}

export async function verifyMusicBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw Error('Private music storage credential is missing.');
  for (const [name, expected] of Object.entries(approvedMusicFiles)) {
    const result = await get(`reviewed-v1/${name}`, { access: 'private', token, useCache: false });
    if (!result || result.statusCode !== 200) throw Error(`Reviewed private music blob is missing: ${name}`);
    const hash = createHash('sha256');
    for await (const chunk of result.stream) hash.update(chunk);
    if (hash.digest('hex') !== expected) throw Error(`Reviewed private music blob differs from the approved file: ${name}`);
  }
}

export async function verifyMusicR2() {
  const config = r2Configuration();
  const receipt = JSON.parse(await readFile(resolve('config/music-r2-receipt.json'), 'utf8'));
  const client = createMusicR2Client(config);
  try { await verifyMusicR2Heads(client, config, receipt); }
  finally { client.destroy(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.includes('--r2') || (process.env.SPARKY_MUSIC_STORAGE === 'r2' && (process.env.VERCEL || process.argv.includes('--remote')))) {
    await verifyMusicR2();
    console.log('Reviewed private R2 music metadata verified without downloading media.');
  } else if (process.argv.includes('--remote') || (process.env.VERCEL && musicStorageProvider() === 'vercel')) {
    await verifyMusicBlob();
    console.log('Reviewed private music blobs verified.');
  } else if (process.env.VERCEL || process.argv.includes('--required')) {
    await verifyMusicRelease();
    console.log('Reviewed music manifest and approved audio verified.');
  }
}
