// Append only. A bit's identity is permanent even if an item is retired or reordered.
// Never derive this list from catalog order; old signed cookies and account rows use it.
export const storeLedger = [
  "pinky-focus-look", "sparky-explorer-look", "sparky-academy-look", "pinky-atelier-look",
  "scene-garden", "scene-sunset", "scene-night",
  "practice-travel", "practice-team", "practice-nuance",
  "scene-study", "scene-cafe", "scene-train", "scene-library", "scene-aurora",
  "notebook-mint", "notebook-midnight", "notebook-classic", "notebook-berry",
] as const;
