import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Fingerprints of the reviewed release from dpl_A19hmuaCfqY5UHqqtt2mj9mwHWzv.
// This metadata contains no lyrics, audio, credentials or user progress.
export const approvedMusicFiles = {
  'manifest.json': '8b65482a87c4b599e2e6ec1a906d4b841b5c802a1e0c53b76c41b460cd472081',
  'audio.mp3': '1ca15127f1a0bdb366a352101f8f79b268118df70d88e380df625f53e749a3b9',
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

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.env.VERCEL || process.argv.includes('--required')) {
    await verifyMusicRelease();
    console.log('Reviewed music manifest and approved audio verified.');
  }
}
