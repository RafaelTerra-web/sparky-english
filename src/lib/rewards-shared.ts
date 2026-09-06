export type MascotId = "sparky" | "pinky";
export const cosmeticSlots = ["head", "face", "neck", "body", "style"] as const;
export type CosmeticSlot = (typeof cosmeticSlots)[number];
export type CosmeticCategory = "looks" | "head" | "clothing";
export type CosmeticItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  slot: CosmeticSlot;
  category: CosmeticCategory;
  mascots: MascotId[];
  className: string;
  /** A complete generated outfit, rendered instead of CSS accessory layers. */
  assetPath?: string;
};
export type EquippedItems = Record<
  MascotId,
  Partial<Record<CosmeticSlot, string>>
>;
export type PublicRewardState = {
  storage?: "browser" | "account";
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
    category: "clothing",
    mascots: ["pinky"],
    className: "cosmetic-scarf",
  },
  {
    id: "campus-cap",
    name: "Boné do campus",
    description: "Boné azul-noite que serve nos dois mascotes.",
    price: 80,
    slot: "head",
    category: "head",
    mascots: ["sparky", "pinky"],
    className: "cosmetic-cap",
  },
  {
    id: "quiet-hoodie",
    name: "Moletom tranquilo",
    description: "Moletom verde-petróleo feito para a Pinky.",
    price: 150,
    slot: "body",
    category: "clothing",
    mascots: ["pinky"],
    className: "cosmetic-hoodie",
  },
  {
    id: "amber-readers",
    name: "Óculos de leitura",
    description: "Lentes âmbar para uma sessão de foco.",
    price: 90,
    slot: "face",
    category: "head",
    mascots: ["sparky", "pinky"],
    className: "cosmetic-readers",
  },
  {
    id: "focus-headphones",
    name: "Fones do foco",
    description: "Fones azul-petróleo para estudar sem distrações.",
    price: 110,
    slot: "head",
    category: "head",
    mascots: ["sparky", "pinky"],
    className: "cosmetic-headphones",
  },
  {
    id: "lavender-beret",
    name: "Boina lavanda",
    description: "Uma boina criativa feita para a Pinky.",
    price: 95,
    slot: "head",
    category: "head",
    mascots: ["pinky"],
    className: "cosmetic-beret",
  },
  {
    id: "explorer-satchel",
    name: "Bolsa exploradora",
    description: "Uma bolsa verde para levar novas palavras.",
    price: 125,
    slot: "body",
    category: "clothing",
    mascots: ["sparky"],
    className: "cosmetic-satchel",
  },
  {
    id: "star-cardigan",
    name: "Cardigã estrela",
    description: "Camada azul-noite para as missões do Sparky.",
    price: 150,
    slot: "body",
    category: "clothing",
    mascots: ["sparky"],
    className: "cosmetic-cardigan",
  },
  {
    id: "sparky-academy-look",
    name: "Look Academia do Sparky",
    description: "Look completo com cardigã, óculos e bolsa de estudos.",
    price: 270,
    slot: "style",
    category: "looks",
    mascots: ["sparky"],
    className: "cosmetic-academy-look",
    assetPath: "/visuals/sparky-academy-look.png",
  },
  {
    id: "pinky-atelier-look",
    name: "Look Ateliê da Pinky",
    description: "Look completo com boina, cardigã e bolsa criativa.",
    price: 270,
    slot: "style",
    category: "looks",
    mascots: ["pinky"],
    className: "cosmetic-atelier-look",
    assetPath: "/visuals/pinky-atelier-look.png",
  },
];
