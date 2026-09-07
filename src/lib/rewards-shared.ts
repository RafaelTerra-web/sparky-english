export type MascotId = "sparky" | "pinky";
// Old slots remain readable for migration; new outfits use one look + scene.
export const cosmeticSlots = ["head", "face", "neck", "body", "style", "scene"] as const;
export type CosmeticSlot = (typeof cosmeticSlots)[number];
export type CosmeticCategory = "looks" | "scenes";
export type CosmeticItem = {
  id: string; name: string; description: string; price: number;
  slot: CosmeticSlot; category: CosmeticCategory; mascots: MascotId[];
  className: string; assetPath?: string;
};
export type EquippedItems = Record<MascotId, Partial<Record<CosmeticSlot, string>>>;
export type PublicRewardState = {
  storage?: "browser" | "account";
  coins: number; completed: Record<string, string>; reviews: Record<string, string>;
  owned: string[]; mascot: MascotId; equipped: EquippedItems;
  wardrobeRefund?: number;
};
export const retiredCosmeticPrices: Record<string, number> = {
  "study-scarf": 60, "campus-cap": 80, "quiet-hoodie": 150,
  "amber-readers": 90, "focus-headphones": 110, "lavender-beret": 95,
  "explorer-satchel": 125, "star-cardigan": 150,
};
export const cosmeticCatalog: CosmeticItem[] = [
  { id: "pinky-focus-look", name: "Pinky em foco", description: "Moletom e fones desenhados juntos para a nova Pinky.", price: 40, slot: "style", category: "looks", mascots: ["pinky"], className: "", assetPath: "/visuals/pinky-focus-v2.png" },
  { id: "sparky-explorer-look", name: "Sparky explorador", description: "Boné, bolsa e roupa de viagem em um look completo.", price: 60, slot: "style", category: "looks", mascots: ["sparky"], className: "", assetPath: "/visuals/sparky-explorer-v2.png" },
  { id: "sparky-academy-look", name: "Look Academia do Sparky", description: "Cardigã, óculos e bolsa integrados à ilustração.", price: 270, slot: "style", category: "looks", mascots: ["sparky"], className: "", assetPath: "/visuals/sparky-academy-look.png" },
  { id: "pinky-atelier-look", name: "Look Ateliê da Pinky", description: "Boina, cardigã e bolsa, redesenhados para a Pinky.", price: 270, slot: "style", category: "looks", mascots: ["pinky"], className: "", assetPath: "/visuals/pinky-atelier-v2.png" },
  { id: "scene-garden", name: "Jardim de ideias", description: "Um cenário verde para acompanhar seu mascote nas lições e no início.", price: 30, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-garden" },
  { id: "scene-sunset", name: "Hora dourada", description: "Cores de fim de tarde para o seu espaço de estudo.", price: 50, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-sunset" },
  { id: "scene-night", name: "Noite de descobertas", description: "Uma janela estrelada que combina com qualquer look.", price: 80, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-night" },
];
export const practiceCatalog = [
  { id: "practice-travel", name: "Passaporte do cotidiano", level: "A1–A2", price: 40, description: "Duas missões: corrigir um pedido no café e resolver um problema no hotel." },
  { id: "practice-team", name: "Inglês em equipe", level: "B1–B2", price: 60, description: "Duas missões: negociar um prazo e explicar uma mudança de plano." },
  { id: "practice-nuance", name: "Laboratório de nuances", level: "C1–C2", price: 80, description: "Duas missões: sintetizar evidências e adaptar uma mensagem delicada." },
] as const;
export const storeCatalog = [...cosmeticCatalog, ...practiceCatalog];
