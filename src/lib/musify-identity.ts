import type { MusicLine } from './music';

export type MusifyEffect = 'butterflies' | 'wave' | 'halo' | 'disco' | 'crown' | 'ribbon' | 'storm' | 'stars' | 'rain' | 'flowers';
export type MusifyIdentity = { accent: string; background: string; surface: string; effect: MusifyEffect; mood: string };
export const musifyIdentities: Record<string, MusifyIdentity> = {
  'still-into-you': { accent: '#ffa9d0', background: '#211426', surface: '#35223d', effect: 'butterflies', mood: 'Alegria que insiste em ficar' },
  'do-i-wanna-know': { accent: '#9edbe8', background: '#0c1724', surface: '#1d2a39', effect: 'wave', mood: 'Perguntas na madrugada' },
  'she-knows': { accent: '#ef9baf', background: '#1d111b', surface: '#33202c', effect: 'halo', mood: 'Segredos e tensão' },
  'made-for-loving-you': { accent: '#f0ca7c', background: '#241527', surface: '#3b2638', effect: 'disco', mood: 'Romance na pista' },
  'savage': { accent: '#ffb1ec', background: '#26142c', surface: '#3e2543', effect: 'crown', mood: 'Confiança no volume certo' },
  'out-of-order': { accent: '#c4b4ff', background: '#14182c', surface: '#262c44', effect: 'ribbon', mood: 'Entre saudade e conexão' },
  'king-for-a-day': { accent: '#edb397', background: '#171925', surface: '#2c2c3b', effect: 'storm', mood: 'Energia para romper o silêncio' },
  'perfect-local': { accent: '#dc8155', background: '#110d0c', surface: '#211917', effect: 'stars', mood: 'Um encontro que fica' },
  'heartless-local': { accent: '#839cdf', background: '#090c13', surface: '#161b28', effect: 'rain', mood: 'Quando a confiança muda' },
  'stay-at-your-house-local': { accent: '#71e7ed', background: '#090e1e', surface: '#141b30', effect: 'halo', mood: 'Uma lembrança no néon' },
  'buttercup-local': { accent: '#e0ad46', background: '#110d15', surface: '#211a25', effect: 'flowers', mood: 'Um balanço leve e estranho' },
};
export function musifyIdentity(id: string) { return musifyIdentities[id]; }

/** Lyric-triggered effects use the heard word's media time, including seek/replay. */
export function musifyEffectAt(id: string, lines: Pick<MusicLine, 'words'>[], clock: number) {
  const identity = musifyIdentity(id);
  if (!identity || !Number.isFinite(clock) || clock < 0) return null;
  if (identity.effect !== 'butterflies') return identity.effect;
  return lines.some(line => line.words.some(word =>
    word.text.toLowerCase().replace(/[^a-z]/g, '') === 'butterflies' && clock >= word.start && clock < word.end + 7))
    ? 'butterflies' : null;
}
