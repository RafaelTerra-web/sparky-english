// A quiet, synthetic vinyl scratch. The song never enters this audio graph.
export function createMusicFeedback() {
  let context: AudioContext | null = null;
  let texture: AudioBuffer | null = null;
  function prepare() {
    try {
      context ??= new AudioContext();
      if (context.state === 'suspended') void context.resume().catch(() => undefined);
      return context;
    } catch { return null; }
  }
  return {
    prepare,
    scratch(volume: number) {
      if (volume <= 0) return;
      const audio = prepare();
      if (!audio) return;
      texture ??= audio.createBuffer(1, Math.ceil(audio.sampleRate * .4), audio.sampleRate);
      const samples = texture.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        // A rough groove with a tonal edge, swept back and forth like vinyl.
        samples[i] = (Math.random() * 2 - 1) * .7 + Math.sin(i * .08) * .3;
      }
      const source = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const gain = audio.createGain();
      source.buffer = texture;
      source.loop = true;
      filter.type = 'bandpass';
      filter.Q.value = .8;
      const now = audio.currentTime;
      source.playbackRate.setValueAtTime(1.8, now);
      source.playbackRate.exponentialRampToValueAtTime(.35, now + .12);
      source.playbackRate.exponentialRampToValueAtTime(1.5, now + .2);
      source.playbackRate.exponentialRampToValueAtTime(.25, now + .32);
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + .12);
      filter.frequency.exponentialRampToValueAtTime(1400, now + .2);
      filter.frequency.exponentialRampToValueAtTime(300, now + .32);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(.12 * Math.min(1, volume), now + .012);
      gain.gain.setValueAtTime(.12 * Math.min(1, volume), now + .2);
      gain.gain.linearRampToValueAtTime(0, now + .34);
      source.connect(filter).connect(gain).connect(audio.destination);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(now);
      source.stop(now + .35);
    },
    dispose() { if (context) void context.close().catch(() => undefined); context = null; texture = null; },
  };
}
