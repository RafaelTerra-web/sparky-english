import { createHash } from 'node:crypto';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { approvedMusicFiles, approvedMusicSizes } from './music-approved.ts';

export const MUSIC_R2_PREFIX = 'reviewed-v1/';
export const MUSIC_URL_TTL = 30 * 60;
type Environment = Record<string, string | undefined>;
export type R2Identity = { accountId: string; bucket: string; prefix: string };
export type MusicR2Receipt = R2Identity & {
  schema: 1;
  files: Record<string, { key: string; sha256: string; size: number; etag: string; verifiedAt: string }>;
};

export function r2Configuration(env: Environment = process.env, upload = false) {
  const accountId = env.R2_ACCOUNT_ID || '';
  const bucket = env.R2_BUCKET || '';
  const accessKeyId = env[upload ? 'R2_UPLOAD_ACCESS_KEY_ID' : 'R2_ACCESS_KEY_ID'] || '';
  const secretAccessKey = env[upload ? 'R2_UPLOAD_SECRET_ACCESS_KEY' : 'R2_SECRET_ACCESS_KEY'] || '';
  if (!/^[a-f0-9]{32}$/.test(accountId) || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)
      || !accessKeyId || !secretAccessKey) throw Error('R2 music configuration is incomplete');
  return { accountId, bucket, prefix: MUSIC_R2_PREFIX, accessKeyId, secretAccessKey };
}

export function createMusicR2Client(config: ReturnType<typeof r2Configuration>) {
  return new S3Client({
    region: 'auto', endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`, forcePathStyle: true,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
    maxAttempts: 2,
  });
}

export function reviewedR2Key(name: string) {
  if (!Object.hasOwn(approvedMusicFiles, name)) throw Error('Unknown reviewed music file');
  return `${MUSIC_R2_PREFIX}${name}`;
}

export function assertMusicR2Receipt(receipt: MusicR2Receipt, identity: R2Identity, complete = true) {
  if (receipt?.schema !== 1 || receipt.accountId !== identity.accountId || receipt.bucket !== identity.bucket
      || receipt.prefix !== MUSIC_R2_PREFIX || identity.prefix !== MUSIC_R2_PREFIX || !receipt.files || typeof receipt.files !== 'object')
    throw Error('R2 receipt belongs to another store or schema');
  for (const [name, file] of Object.entries(receipt.files)) {
    if (!Object.hasOwn(approvedMusicFiles, name) || file.key !== reviewedR2Key(name)
        || file.sha256 !== approvedMusicFiles[name] || file.size !== approvedMusicSizes[name]
        || typeof file.etag !== 'string' || !/^"[a-f0-9]{32}(?:-\d+)?"$/.test(file.etag)
        || typeof file.verifiedAt !== 'string' || !Number.isFinite(Date.parse(file.verifiedAt))) throw Error(`Invalid R2 receipt: ${name}`);
  }
  if (complete && Object.keys(receipt.files).length !== Object.keys(approvedMusicFiles).length)
    throw Error('R2 migration receipt is incomplete');
}

export function assertMusicR2Head(name: string, head: { ContentLength?: number; ETag?: string; Metadata?: Record<string, string>; ContentType?: string }, file: MusicR2Receipt['files'][string]) {
  if (head.ContentLength !== approvedMusicSizes[name] || head.ETag !== file.etag
      || head.Metadata?.sha256 !== approvedMusicFiles[name] || head.ContentType !== musicContentType(name))
    throw Error(`R2 music metadata differs from the verified migration: ${name}`);
}

export function musicContentType(name: string) {
  return name.endsWith('.mp3') ? 'audio/mpeg' : name.endsWith('.mp4') ? 'video/mp4' : 'application/json';
}

export async function verifyMusicR2Heads(client: S3Client, identity: R2Identity, receipt: MusicR2Receipt) {
  assertMusicR2Receipt(receipt, identity);
  for (const [name, file] of Object.entries(receipt.files)) {
    const head = await client.send(new HeadObjectCommand({ Bucket: identity.bucket, Key: reviewedR2Key(name) }), { abortSignal: AbortSignal.timeout(10_000) });
    assertMusicR2Head(name, head, file);
  }
}

export async function readMusicR2Manifest(client: S3Client, bucket: string, name: string) {
  const Key = reviewedR2Key(name);
  if (!name.endsWith('.json')) throw Error('Not a music manifest');
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key }), { abortSignal: AbortSignal.timeout(10_000) });
  if (!result.Body) throw Error('R2 music manifest is unavailable');
  const bytes = await result.Body.transformToByteArray();
  if (bytes.length !== approvedMusicSizes[name] || createHash('sha256').update(bytes).digest('hex') !== approvedMusicFiles[name])
    throw Error('R2 music manifest differs from the reviewed release');
  return Buffer.from(bytes).toString('utf8');
}

export async function signedMusicR2Url(client: S3Client, bucket: string, name: string) {
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: reviewedR2Key(name) }), { expiresIn: MUSIC_URL_TTL });
}
