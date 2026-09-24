import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// A quiet, two-note acoustic signature for the first opening.
const rate = 44100;
const seconds = 0.56;
const samples = Math.round(rate * seconds);
const pcm = Buffer.alloc(samples * 2);

function note(t, start, frequency, decay) {
  const age = t - start;
  if (age < 0) return 0;
  const envelope = Math.min(1, age / 0.009) * Math.exp(-age / decay);
  return envelope * (
    Math.sin(2 * Math.PI * frequency * age) * 0.72 +
    Math.sin(2 * Math.PI * frequency * 2 * age) * 0.2 +
    Math.sin(2 * Math.PI * frequency * 3 * age) * 0.08
  );
}

for (let i = 0; i < samples; i++) {
  const t = i / rate;
  const value = note(t, 0.015, 523.25, 0.11) * 0.25 + note(t, 0.13, 659.25, 0.17) * 0.31;
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

const target = join(process.cwd(), 'public', 'audio');
mkdirSync(target, { recursive: true });
writeFileSync(join(target, 'sparky-mark.wav'), Buffer.concat([header, pcm]));
