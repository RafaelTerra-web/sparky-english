// Append only. A bit's identity is permanent even if an item is retired or reordered.
// Never derive this list from catalog order; old signed cookies and account rows use it.
export const storeLedger = [
  "pinky-focus-look", "sparky-explorer-look", "sparky-academy-look", "pinky-atelier-look",
  "scene-garden", "scene-sunset", "scene-night",
  "practice-travel", "practice-team", "practice-nuance",
  "scene-study", "scene-cafe", "scene-train", "scene-library", "scene-aurora",
  "notebook-mint", "notebook-midnight", "notebook-classic", "notebook-berry",
  "sparky-cozy-reader", "sparky-science-club", "sparky-debate-captain", "sparky-urban-sport",
  "pinky-campus", "pinky-festival", "pinky-creative-lab", "pinky-presenter",
  "accessory-urban-cap-v4", "accessory-lavender-beret-v4", "accessory-focus-headphones-v4", "accessory-knit-beanie-v4",
  "accessory-amber-readers-v4", "accessory-round-readers-v4", "accessory-sunglasses-v4", "accessory-science-visor-v4",
  "accessory-study-scarf-v4", "accessory-debate-bow-v4", "accessory-constellation-v4", "accessory-language-lanyard-v4",
  "accessory-explorer-satchel-v4", "accessory-compact-backpack-v4", "accessory-book-tote-v4", "accessory-rocket-pack-v4",
] as const;
