import { hasActiveAudioSession } from "./audio-playback";

const preferenceKey = "sparky-interface-sound-v1";
let context: AudioContext | null = null;
let enabledOverride: boolean | null = null;

export function interfaceSoundEnabled() {
  if (enabledOverride !== null) return enabledOverride;
  if (typeof window === "undefined") return true;
  try { return localStorage.getItem(preferenceKey) !== "off"; }
  catch { return true; }
}

export function setInterfaceSoundEnabled(enabled: boolean) {
  enabledOverride = enabled;
  try { localStorage.setItem(preferenceKey, enabled ? "on" : "off"); }
  catch { /* The choice still applies to the current rendered control. */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("sparky-interface-sound-change"));
}

export function subscribeInterfaceSound(listener: () => void) {
  const storageChanged = (event: StorageEvent) => {
    if (event.key !== preferenceKey) return;
    enabledOverride = null;
    listener();
  };
  window.addEventListener("storage", storageChanged);
  window.addEventListener("sparky-interface-sound-change", listener);
  return () => {
    window.removeEventListener("storage", storageChanged);
    window.removeEventListener("sparky-interface-sound-change", listener);
  };
}

function audioContext() {
  if (typeof window === "undefined" || !window.AudioContext) return null;
  try { return context ??= new AudioContext(); }
  catch { return null; }
}

/** Called in the click handler so Safari can unlock audio before an async save. */
export function primeInterfaceSound() {
  if (!interfaceSoundEnabled()) return;
  const audio = audioContext();
  if (audio?.state === "suspended") void audio.resume().catch(() => {});
}

export function playInterfaceSound(kind: "start" | "complete") {
  if (!interfaceSoundEnabled() || hasActiveAudioSession()) return;
  const audio = audioContext();
  if (!audio) return;
  const play = () => {
    if (audio.state !== "running") return;
    const tones = kind === "start" ? [[520, 0, .07], [700, .075, .09]] : [[590, 0, .11], [790, .095, .16]];
    for (const [frequency, offset, duration] of tones) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const begins = audio.currentTime + offset;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, begins);
      gain.gain.exponentialRampToValueAtTime(.028, begins + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, begins + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(begins);
      oscillator.stop(begins + duration + .01);
    }
  };
  if (audio.state === "suspended") void audio.resume().then(play).catch(() => {});
  else play();
}
