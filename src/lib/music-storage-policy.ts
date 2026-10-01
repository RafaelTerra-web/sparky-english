type Environment = Record<string, string | undefined>;

export function musicStorageProvider(env: Environment = process.env): 'r2' | 'vercel' | 'local' {
  const configured = env.SPARKY_MUSIC_STORAGE;
  if (configured && !['r2', 'vercel', 'local'].includes(configured)) throw Error('Invalid music storage provider');
  if (configured === 'local') {
    if (env.VERCEL) throw Error('Private local music is not deployed to Vercel');
    return 'local';
  }
  if (configured === 'r2' || configured === 'vercel') return configured;
  if (env.BLOB_READ_WRITE_TOKEN) return 'vercel';
  if (env.VERCEL) throw Error('Music storage provider is missing');
  return 'local';
}
