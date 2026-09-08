export type AudioTimelineSegment =
  | { type: "audio"; source: string; gain?: number }
  | { type: "pause"; durationMs: number };
export async function playTimeline(
  segments: AudioTimelineSegment[],
  signal: AbortSignal,
  onSpeaking: (speaking: boolean) => void,
) {
  const context = new AudioContext();
  const stop = () => {
    void context.close();
    onSpeaking(false);
  };
  signal.addEventListener("abort", stop, { once: true });
  try {
    await context.resume();
    const buffers = await Promise.all(
      segments.map(async (segment) => {
        if (segment.type === "pause") return null;
        const response = await fetch(segment.source, {
          signal,
          cache: segment.source.startsWith("/api/") ? "no-store" : "default",
        });
        if (!response.ok) throw new Error("Áudio indisponível.");
        return context.decodeAudioData(await response.arrayBuffer());
      }),
    );
    for (let i = 0; i < segments.length; i++) {
      signal.throwIfAborted();
      const segment = segments[i];
      onSpeaking(segment.type === "audio");
      await new Promise<void>((resolve, reject) => {
        // Silence is scheduled on the same audio clock as speech; no scattered timers.
        const source = context.createBufferSource(),
          gain = context.createGain();
        source.buffer =
          segment.type === "audio"
            ? buffers[i]!
            : context.createBuffer(
                1,
                Math.max(
                  1,
                  Math.round((segment.durationMs * context.sampleRate) / 1000),
                ),
                context.sampleRate,
              );
        source.connect(gain);
        gain.connect(context.destination);
        const start = context.currentTime,
          duration = source.buffer.duration,
          target = segment.type === "audio" ? (segment.gain ?? 1) : 0;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(
          target,
          start + Math.min(0.01, duration / 3),
        );
        gain.gain.setValueAtTime(
          target,
          start + Math.max(0.01, duration - 0.01),
        );
        gain.gain.linearRampToValueAtTime(0, start + duration);
        const abort = () => {
          source.stop();
          reject(new DOMException("Aborted", "AbortError"));
        };
        signal.addEventListener("abort", abort, { once: true });
        source.onended = () => {
          signal.removeEventListener("abort", abort);
          resolve();
        };
        source.start();
      });
    }
  } finally {
    signal.removeEventListener("abort", stop);
    if (context.state !== "closed") await context.close();
    onSpeaking(false);
  }
}
