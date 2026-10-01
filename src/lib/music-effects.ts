/** Device preference: visuals never change the scoring or media clock. */
export type MusicEffectsMode = 'auto' | 'reduced' | 'off';
export const MUSIC_EFFECTS_KEY = 'sparky-music-effects-v1';
const changeEvent = 'sparky-music-effects-change';
let override: MusicEffectsMode | null = null;

export function normalizeMusicEffectsMode(value: unknown): MusicEffectsMode {
  return value === 'reduced' || value === 'off' ? value : 'auto';
}

export function musicEffectsMode(): MusicEffectsMode {
  if (override !== null) return override;
  if (typeof window === 'undefined') return 'auto';
  try { return normalizeMusicEffectsMode(localStorage.getItem(MUSIC_EFFECTS_KEY)); }
  catch { return 'auto'; }
}

export function setMusicEffectsMode(value: MusicEffectsMode) {
  override = normalizeMusicEffectsMode(value);
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(MUSIC_EFFECTS_KEY, override); }
  catch { /* The current device choice still works without storage. */ }
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeMusicEffects(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  const storageChanged = (event: StorageEvent) => {
    if (event.key !== null && event.key !== MUSIC_EFFECTS_KEY) return;
    override = null;
    listener();
  };
  window.addEventListener('storage', storageChanged);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener('storage', storageChanged);
    window.removeEventListener(changeEvent, listener);
  };
}
