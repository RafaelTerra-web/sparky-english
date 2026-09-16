import type { MusicLine } from './music';

type Section = { start: number; kind: 'intro' | 'verse' | 'build' | 'chorus' | 'narrative' | 'instrumental' | 'outro'; label: string; story: string };
// Editorial section boundaries follow the existing approved lyric timestamps.
// These affect presentation only and never reschedule words or challenges.
const sections: Record<string, Section[]> = {
  'stay-at-your-house-local': [
    { start: 0, kind: 'intro', label: 'Introdução', story: 'Luzes acesas. Uma lembrança atravessa a cidade.' },
    { start: .76, kind: 'verse', label: 'Verso 1', story: 'Entre a ausência e o desejo de ficar.' },
    { start: 30, kind: 'build', label: 'Pré-refrão', story: 'A cidade acelera. A voz ganha espaço.' },
    { start: 60, kind: 'chorus', label: 'Refrão', story: 'Um lugar para voltar, no meio do néon.' },
    { start: 92, kind: 'instrumental', label: 'Interlúdio', story: 'As luzes continuam depois da voz.' },
    { start: 100, kind: 'verse', label: 'Verso 2', story: 'A lembrança encontra as perguntas.' },
    { start: 129, kind: 'chorus', label: 'Refrão', story: 'O desejo de ficar volta mais forte.' },
    { start: 162, kind: 'instrumental', label: 'Ponte', story: 'A cidade respira antes da última virada.' },
    { start: 176, kind: 'build', label: 'Pré-refrão final', story: 'As luzes se aproximam outra vez.' },
    { start: 209.5, kind: 'chorus', label: 'Refrão final', story: 'A mesma cidade. Tudo parece diferente.' },
    { start: 241, kind: 'outro', label: 'Final', story: 'Deixe a última luz ficar.' },
  ],
  'perfect-local': [
    { start: 0, kind: 'intro', label: 'Introdução', story: 'Uma história começa pelo som.' },
    { start: 3.046, kind: 'verse', label: 'Verso 1', story: 'O encontro e a descoberta.' },
    { start: 31.84, kind: 'build', label: 'Pré-refrão', story: 'A lembrança se transforma em promessa.' },
    { start: 61.66, kind: 'chorus', label: 'Refrão', story: 'Um instante que fica.' },
    { start: 94.82, kind: 'instrumental', label: 'Interlúdio', story: 'Deixe a música respirar.' },
    { start: 98.24, kind: 'verse', label: 'Verso 2', story: 'Os sonhos passam a ser de dois.' },
    { start: 130.38, kind: 'build', label: 'Pré-refrão', story: 'A promessa ganha força.' },
    { start: 160.10, kind: 'chorus', label: 'Refrão', story: 'A mesma melodia, um novo significado.' },
    { start: 193.86, kind: 'instrumental', label: 'Instrumental', story: 'Deixe a música respirar.' },
    { start: 207.60, kind: 'chorus', label: 'Refrão final', story: 'A história encontra sua certeza.' },
    { start: 246.48, kind: 'outro', label: 'Final', story: 'Fique mais um pouco no som.' },
  ],
  'heartless-local': [
    { start: 0, kind: 'intro', label: 'Introdução', story: 'Uma história começa pelo som.' },
    { start: 5.42, kind: 'narrative', label: 'Narrativa', story: 'Uma amizade posta em dúvida.' },
    { start: 30.56, kind: 'chorus', label: 'Refrão', story: 'A mágoa encontra sua voz.' },
    { start: 59.90, kind: 'verse', label: 'Verso 2', story: 'A dor se transforma em reação.' },
    { start: 84.30, kind: 'build', label: 'Pré-refrão', story: 'A tensão cresce.' },
    { start: 96.72, kind: 'chorus', label: 'Refrão', story: 'O sentimento volta ainda mais forte.' },
    { start: 126.32, kind: 'narrative', label: 'Diálogo', story: 'Duas vozes, confiança em disputa.' },
    { start: 163.68, kind: 'instrumental', label: 'Interlúdio', story: 'Algo está prestes a mudar.' },
    { start: 180.36, kind: 'chorus', label: 'Refrão final', story: 'A virada da história.' },
    { start: 213.06, kind: 'outro', label: 'Final', story: 'Deixe o último som ficar.' },
  ],
};

export function musicSectionAt(trackId: string, clock: number): Section {
  const track = sections[trackId];
  if (!track) return { start: 0, kind: 'verse', label: 'Ao vivo', story: 'A música segue. Você segue junto.' };
  let current = track[0];
  for (const section of track) { if (section.start > clock || !Number.isFinite(clock)) break; current = section; }
  return current;
}

/** Intro count is presentation only; response windows keep their media times. */
export function musicIntroCountdown(clock: number, firstRound: boolean) {
  return firstRound && Number.isFinite(clock) && clock < 3 ? Math.ceil(3 - Math.max(0, clock)) : 0;
}

export function musicEnergyAt(envelope: { step: number; values: number[] } | undefined, clock: number) {
  if (!envelope || !Number.isFinite(clock) || clock < 0 || envelope.step <= 0) return 0;
  const position = clock / envelope.step;
  const index = Math.floor(position);
  const current = envelope.values[index] ?? 0;
  const next = envelope.values[index + 1] ?? current;
  return Math.max(0, Math.min(1, (current + (next - current) * (position - index)) / 100));
}

export function musicVisualMoment(lines: Pick<MusicLine, 'start' | 'end'>[], index: number, clock: number, energy: number) {
  if (index < 0 || !lines[index]) return 'intro';
  if (clock > lines[index].end + 1.2) return index === lines.length - 1 ? 'outro' : 'instrumental';
  return energy >= .78 ? 'lift' : 'flow';
}

export function musicWordFill(start: number, end: number, clock: number) {
  if (!Number.isFinite(clock) || clock < start) return 0;
  return end <= start ? 1 : Math.max(0, Math.min(1, (clock - start) / (end - start)));
}
