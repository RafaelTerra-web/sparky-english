export type OpeningMascot = "sparky" | "pinky";

export const OPENING_MASCOT_KEY = "sparky-opening-mascot-v1";

export function rememberOpeningMascot(mascot: OpeningMascot) {
  document.documentElement.dataset.openingMascot = mascot;
  try { localStorage.setItem(OPENING_MASCOT_KEY, mascot); } catch { /* Storage can be unavailable. */ }
}

export function resetOpeningMascot() {
  document.documentElement.dataset.openingMascot = "sparky";
  try { localStorage.removeItem(OPENING_MASCOT_KEY); } catch { /* Storage can be unavailable. */ }
}
