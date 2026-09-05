export type MascotId = "sparky" | "pinky";
export type CosmeticSlot = "head" | "neck" | "body";
export type CosmeticItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  slot: CosmeticSlot;
  mascots: MascotId[];
  className: string;
};
export type EquippedItems = Record<
  MascotId,
  Partial<Record<CosmeticSlot, string>>
>;
export type PublicRewardState = {
  coins: number;
  completed: Record<string, string>;
  reviews: Record<string, string>;
  owned: string[];
  mascot: MascotId;
  equipped: EquippedItems;
};

export const cosmeticCatalog: CosmeticItem[] = [
  {
    id: "study-scarf",
    name: "Lenço de estudo",
    description: "Um lenço ameixa para a Pinky.",
    price: 60,
    slot: "neck",
    mascots: ["pinky"],
    className: "cosmetic-scarf",
  },
  {
    id: "campus-cap",
    name: "Boné do campus",
    description: "Boné azul-noite que serve nos dois mascotes.",
    price: 80,
    slot: "head",
    mascots: ["sparky", "pinky"],
    className: "cosmetic-cap",
  },
  {
    id: "quiet-hoodie",
    name: "Moletom tranquilo",
    description: "Moletom verde-petróleo feito para a Pinky.",
    price: 150,
    slot: "body",
    mascots: ["pinky"],
    className: "cosmetic-hoodie",
  },
];
