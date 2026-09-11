export const MAX_CALL_AUDIO_BYTES = 1_500_000;
export const MAX_CALL_AUDIO_SECONDS = 45;

export function pcmToWav(pcm: Uint8Array, sampleRate = 24000) {
  if (!pcm.length || pcm.length > 2_000_000 || pcm.length % 2) throw new Error("invalid-audio");
  const out = Buffer.alloc(44 + pcm.length);
  out.write("RIFF", 0); out.writeUInt32LE(out.length - 8, 4); out.write("WAVEfmt ", 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(sampleRate, 24); out.writeUInt32LE(sampleRate * 2, 28);
  out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34); out.write("data", 36);
  out.writeUInt32LE(pcm.length, 40); Buffer.from(pcm).copy(out, 44);
  return out;
}

export function wavToPcm16(bytes: Uint8Array) {
  const data = Buffer.from(bytes);
  if (data.length < 44 || data.toString("ascii", 0, 4) !== "RIFF" || data.toString("ascii", 8, 12) !== "WAVE")
    throw new Error("invalid-audio");
  if (data.readUInt16LE(20) !== 1 || data.readUInt16LE(22) !== 1 || data.readUInt16LE(34) !== 16 || data.readUInt32LE(24) !== 16000)
    throw new Error("unsupported-audio");
  let offset = 12;
  while (offset + 8 <= data.length) {
    const type = data.toString("ascii", offset, offset + 4), length = data.readUInt32LE(offset + 4);
    if (type === "data") {
      if (length < 3200 || length > MAX_CALL_AUDIO_BYTES || length % 2 || offset + 8 + length > data.length) throw new Error("invalid-audio");
      if (length / 32000 > MAX_CALL_AUDIO_SECONDS) throw new Error("audio-too-long");
      return data.subarray(offset + 8, offset + 8 + length);
    }
    offset += 8 + length + (length % 2);
  }
  throw new Error("invalid-audio");
}
