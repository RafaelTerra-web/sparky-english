export type MusicArtwork = {
  src: string;
  position: string;
  tone: 'ember' | 'midnight' | 'neon' | 'buttercup';
};

const artwork: Record<string, MusicArtwork> = {
  'perfect-local': {
    src: '/music/covers/perfect.png',
    position: '50% 43%',
    tone: 'ember',
  },
  'heartless-local': {
    src: '/music/covers/heartless.png',
    position: '50% 38%',
    tone: 'midnight',
  },
  'stay-at-your-house-local': {
    src: '/music/covers/stay-at-your-house.png',
    position: '50% 45%',
    tone: 'neon',
  },
  'buttercup-local': {
    src: '/music/covers/buttercup-local.svg',
    position: '50% 50%',
    tone: 'buttercup',
  },
};

export function musicArtwork(trackId: string) {
  return artwork[trackId];
}

export const featuredMusicArtwork = Object.values(artwork);
