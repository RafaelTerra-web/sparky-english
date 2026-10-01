import 'server-only';
import { hasReviewedMusicStore as hasBlob, readReviewedMusicManifest as readBlob, reviewedMusicRedirect as redirectBlob } from './music-blob';
import { musicStorageProvider } from './music-storage-policy';
import { createMusicR2Client, r2Configuration, readMusicR2Manifest, signedMusicR2Url } from './music-r2';

let r2: ReturnType<typeof createMusicR2Client> | undefined;
function r2Store() {
  const config = r2Configuration();
  return { client: r2 ??= createMusicR2Client(config), bucket: config.bucket };
}
const manifests = new Map<string, { until: number; value: Promise<string> }>();
export function hasReviewedMusicStore() { return musicStorageProvider() !== 'local'; }

export async function readReviewedMusicManifest(name: string) {
  const provider = musicStorageProvider();
  if (provider === 'vercel') {
    if (!hasBlob()) throw Error('Music storage unavailable');
    return readBlob(name);
  }
  if (provider !== 'r2') throw Error('Cloud music storage is not selected');
  let cached = manifests.get(name);
  if (!cached || cached.until <= Date.now()) {
    const { client, bucket } = r2Store();
    const value = readMusicR2Manifest(client, bucket, name).catch(error => { manifests.delete(name); throw error; });
    cached = { until: Date.now() + 10 * 60_000, value };
    manifests.set(name, cached);
  }
  return cached.value;
}

export async function reviewedMusicRedirect(name: string) {
  const provider = musicStorageProvider();
  if (provider === 'vercel') return redirectBlob(name);
  if (provider !== 'r2') throw Error('Cloud music storage is not selected');
  const { client, bucket } = r2Store();
  const url = await signedMusicR2Url(client, bucket, name);
  return new Response(null, { status: 307, headers: {
    Location: url, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
  } });
}
