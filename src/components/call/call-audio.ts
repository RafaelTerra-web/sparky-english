const TARGET_SAMPLE_RATE = 16_000;

export function downmixAudio(channels: readonly Float32Array[]) {
  if (!channels.length) return new Float32Array();
  if (channels.length === 1) return new Float32Array(channels[0]);
  const output = new Float32Array(Math.min(...channels.map((channel) => channel.length)));
  for (const channel of channels) {
    for (let index = 0; index < output.length; index += 1) output[index] += channel[index] / channels.length;
  }
  return output;
}

export function resampleAudio(input: Float32Array, sourceRate: number, targetRate = TARGET_SAMPLE_RATE) {
  if (!input.length || sourceRate <= 0 || targetRate <= 0) return new Float32Array();
  if (sourceRate === targetRate) return new Float32Array(input);
  const outputLength = Math.max(1, Math.round(input.length * targetRate / sourceRate));
  const output = new Float32Array(outputLength);
  const ratio = sourceRate / targetRate;
  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.min(input.length - 1, Math.floor(position));
    const right = Math.min(input.length - 1, left + 1);
    const mix = position - left;
    output[index] = input[left] * (1 - mix) + input[right] * mix;
  }
  return output;
}

export function encodePcm16Wav(samples: Float32Array, sampleRate = TARGET_SAMPLE_RATE) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(44 + index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return buffer;
}

export async function recordedBlobToWav(blob: Blob) {
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) throw new Error("Este navegador não consegue preparar o áudio para envio.");
  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration < 0.75) throw new Error("Fale por pelo menos um segundo antes de enviar.");
    if (decoded.duration > 46) throw new Error("Este turno ficou longo demais. Grave uma resposta mais curta.");
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, index) => decoded.getChannelData(index));
    const mono = downmixAudio(channels);
    const resampled = resampleAudio(mono, decoded.sampleRate, TARGET_SAMPLE_RATE);
    return new Blob([encodePcm16Wav(resampled)], { type: "audio/wav" });
  } finally {
    await context.close().catch(() => undefined);
  }
}
