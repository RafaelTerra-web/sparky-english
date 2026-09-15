// Stable, explicit paths: request parameters never become filesystem paths.
export const musicReleases = [
  { id: 'perfect-local', manifest: 'manifest.json', audio: 'audio.mp3', version: 'full-song-timing-2' },
  { id: 'heartless-local', manifest: 'heartless/manifest.json', audio: 'heartless/audio.mp3', version: 'heartless-timing-1' },
] as const;

export function musicRelease(id: string | null) {
  return musicReleases.find(track => track.id === (id ?? 'perfect-local'));
}

export function musicAudioSource(id: string) {
  return id === 'perfect-local' ? '/api/music/audio' : `/api/music/audio?trackId=${encodeURIComponent(id)}`;
}
