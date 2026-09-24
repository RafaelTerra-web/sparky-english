// Stable, explicit paths: request parameters never become filesystem paths.
export const musicReleases = [
  { id: 'perfect-local', manifest: 'manifest.json', audio: 'audio.mp3', version: 'full-song-timing-2' },
  { id: 'heartless-local', manifest: 'heartless/manifest.json', audio: 'heartless/audio.mp3', version: 'heartless-timing-1' },
  { id: 'stay-at-your-house-local', manifest: 'stay-at-your-house/manifest.json', audio: 'stay-at-your-house/audio.mp3', video: 'stay-at-your-house/background.mp4', version: 'stay-at-your-house-timing-1' },
  { id: 'buttercup-local', manifest: 'buttercup-local/manifest.json', audio: 'buttercup-local/audio.mp3', video: 'buttercup-local/video.mp4', version: 'buttercup-timing-2' },
] as const;

export function musicRelease(id: string | null) {
  return musicReleases.find(track => track.id === (id ?? 'perfect-local'));
}

export function musicAudioSource(id: string) {
  return id === 'perfect-local' ? '/api/music/audio' : `/api/music/audio?trackId=${encodeURIComponent(id)}`;
}
