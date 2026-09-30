// Stable, explicit paths: request parameters never become filesystem paths.
export const musicReleases = [
  { id: 'perfect-local', manifest: 'musify-support-1/perfect-local.json', audio: 'audio.mp3', version: 'full-song-timing-2' },
  { id: 'heartless-local', manifest: 'musify-support-1/heartless-local.json', audio: 'heartless/audio.mp3', version: 'heartless-timing-1' },
  { id: 'stay-at-your-house-local', manifest: 'musify-support-1/stay-at-your-house-local.json', audio: 'stay-at-your-house/audio.mp3', video: 'stay-at-your-house/background.mp4', version: 'stay-at-your-house-timing-1' },
  { id: 'buttercup-local', manifest: 'musify-support-1/buttercup-local.json', audio: 'buttercup-local/audio.mp3', video: 'buttercup-local/video.mp4', version: 'buttercup-timing-2' },
  { id: 'still-into-you', manifest: 'still-into-you/manifest.json', audio: 'still-into-you/audio.mp3', video: 'still-into-you/video.mp4', version: 'musify-1' },
  { id: 'do-i-wanna-know', manifest: 'do-i-wanna-know/manifest.json', audio: 'do-i-wanna-know/audio.mp3', video: 'do-i-wanna-know/video.mp4', version: 'musify-1' },
  { id: 'she-knows', manifest: 'she-knows/manifest.json', audio: 'she-knows/audio.mp3', video: 'she-knows/video.mp4', version: 'musify-1' },
  { id: 'made-for-loving-you', manifest: 'made-for-loving-you/manifest.json', audio: 'made-for-loving-you/audio.mp3', version: 'musify-1' },
  { id: 'savage', manifest: 'savage/manifest.json', audio: 'savage/audio.mp3', video: 'savage/video.mp4', version: 'musify-1' },
  { id: 'out-of-order', manifest: 'out-of-order/manifest.json', audio: 'out-of-order/audio.mp3', version: 'musify-1' },
  { id: 'king-for-a-day', manifest: 'king-for-a-day/manifest.json', audio: 'king-for-a-day/audio.mp3', video: 'king-for-a-day/video.mp4', version: 'musify-1' },
] as const;

export function musicRelease(id: string | null) {
  return musicReleases.find(track => track.id === (id ?? 'perfect-local'));
}

export function musicAudioSource(id: string) {
  return id === 'perfect-local' ? '/api/music/audio' : `/api/music/audio?trackId=${encodeURIComponent(id)}`;
}
