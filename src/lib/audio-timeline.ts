export type AudioTimelineSegment =
  | { type: 'audio'; source: string; gain?: number }
  | { type: 'pause'; durationMs: number };
export function speechBounds(channels: Float32Array[], sampleRate: number) {
  const length = channels[0]?.length ?? 0;
  let first = length, last = -1;
  for (const data of channels) {
    for (let i = 0; i < data.length; i++) if (Math.abs(data[i]) > 0.004) { first = Math.min(first, i); break; }
    for (let i = data.length - 1; i >= 0; i--) if (Math.abs(data[i]) > 0.004) { last = Math.max(last, i); break; }
  }
  if (last < first) return { offset: 0, duration: length / sampleRate };
  const start = Math.max(0, first - Math.round(sampleRate * 0.025));
  const end = Math.min(length, last + 1 + Math.round(sampleRate * 0.025));
  return { offset: start / sampleRate, duration: (end - start) / sampleRate };
}
export async function playTimeline(segments: AudioTimelineSegment[], signal: AbortSignal, onSpeaking: (active: boolean) => void) {
  signal.throwIfAborted();
  const context = new AudioContext();
  const stop = () => { if (context.state !== 'closed') void context.close(); };
  signal.addEventListener('abort', stop, { once: true });
  onSpeaking(true);
  try {
    await context.resume();
    const buffers = await Promise.all(segments.map(async segment => {
      if (segment.type === 'pause') return null;
      const response = await fetch(segment.source, { signal, cache: segment.source.startsWith('/api/') ? 'no-store' : 'default' });
      if (!response.ok) throw new Error('Áudio indisponível.');
      return context.decodeAudioData(await response.arrayBuffer());
    }));
    signal.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const abort = () => reject(new DOMException('Aborted', 'AbortError'));
      signal.addEventListener('abort', abort, { once: true });
      let cursor = context.currentTime + 0.02;
      segments.forEach((segment, index) => {
        if (segment.type === 'pause') { cursor += segment.durationMs / 1000; return; }
        const buffer = buffers[index]!;
        const bounds = speechBounds(Array.from({ length: buffer.numberOfChannels }, (_, channel) => buffer.getChannelData(channel)), buffer.sampleRate);
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = buffer; source.connect(gain); gain.connect(context.destination);
        const fade = Math.min(0.005, bounds.duration / 3), target = segment.gain ?? 1;
        gain.gain.setValueAtTime(0, cursor);
        gain.gain.linearRampToValueAtTime(target, cursor + fade);
        gain.gain.setValueAtTime(target, cursor + bounds.duration - fade);
        gain.gain.linearRampToValueAtTime(0, cursor + bounds.duration);
        source.start(cursor, bounds.offset, bounds.duration);
        cursor += bounds.duration;
      });
      const end = context.createBufferSource();
      end.buffer = context.createBuffer(1, 1, context.sampleRate);
      end.connect(context.destination);
      end.onended = () => { signal.removeEventListener('abort', abort); resolve(); };
      end.start(cursor);
    });
  } finally {
    signal.removeEventListener('abort', stop);
    if (context.state !== 'closed') await context.close();
    onSpeaking(false);
  }
}
