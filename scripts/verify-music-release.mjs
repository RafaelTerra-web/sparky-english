import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { get } from '@vercel/blob';

// Perfect is unchanged from dpl_A19hmuaCfqY5UHqqtt2mj9mwHWzv. Heartless was
// prepared separately from the user-provided video and reviewed locally.
// This metadata contains no lyrics, audio, credentials or user progress.
export const approvedMusicFiles = {
  'manifest.json': '8b65482a87c4b599e2e6ec1a906d4b841b5c802a1e0c53b76c41b460cd472081',
  'audio.mp3': '1ca15127f1a0bdb366a352101f8f79b268118df70d88e380df625f53e749a3b9',
  'heartless/manifest.json': '135aba0aaeaf52e7ed7033b36f68d9e16193b5a87b7f0d959db20c3796483fb9',
  'heartless/audio.mp3': '2eda9866ca57e321901d39378a4e29cafca7fc902933aaaef37daaa3cd158e9a',
  'stay-at-your-house/manifest.json': '4daec8efd5c7c8eb21f91bf3cb9ed17a5a794a13f8a0599a835ce565e2159825',
  'stay-at-your-house/audio.mp3': 'dd2058d8bb819fc3ec67a641d42430ee926362f4af4c8a1bd9927c3ff7902498',
  'stay-at-your-house/video.mp4': 'd098996c0b4e495bb6361ed4a024cc47c2cac754f74dfbf6f38a0cccdb188e38',
  'stay-at-your-house/background.mp4': '49525f327f5bcc19d56907e2a930d1fdcd1902cec271ad78beaeaa9eec27d1e5',
  'buttercup-local/manifest.json': '0b18d240926a837330b84b4eb6b11e5cdec87d09ebec5f5819743f83c3784993',
  'buttercup-local/audio.mp3': '7161652e352f0e722160bcf296775844d6d8e5574af45fa5663eb7465e43616e',
  'buttercup-local/video.mp4': '7a2a587272d61eece75fe857b6be4a46160385d224abbbfd79f9fabecb791bfc',
};

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
    const result = await get(`reviewed-v1/${name}`, { access: 'private', token });
    if (!result || result.statusCode !== 200) throw Error(`Reviewed private music blob is missing: ${name}`);
    const hash = createHash('sha256');
    for await (const chunk of result.stream) hash.update(chunk);
    if (hash.digest('hex') !== expected) throw Error(`Reviewed private music blob differs from the approved file: ${name}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.includes('--remote') || (process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN)) {
    await verifyMusicBlob();
    console.log('Reviewed private music blobs verified.');
  } else if (process.env.VERCEL || process.argv.includes('--required')) {
    await verifyMusicRelease();
    console.log('Reviewed music manifest and approved audio verified.');
  }
}
