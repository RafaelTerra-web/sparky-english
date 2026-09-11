export type MascotId = "sparky" | "pinky";
export const wardrobeBaseAssets: Record<MascotId, string> = {
  sparky: "/visuals/wardrobe/bases/sparky.png",
  pinky: "/visuals/wardrobe/bases/pinky.png",
};

export const cosmeticSlots = ["outfit", "head", "face", "neck", "back"] as const;
export type CosmeticSlot = (typeof cosmeticSlots)[number];
export type AccessorySlot = Exclude<CosmeticSlot, "outfit">;
export type EquippedItems = Record<MascotId, Partial<Record<CosmeticSlot, string>>>;

type CatalogBase = {
  id: string;
  name: string;
  description: string;
  price: number;
  mascots: MascotId[];
  poseVersion: "wardrobe-v1";
};

export type OutfitItem = CatalogBase & {
  kind: "outfit";
  slot: "outfit";
  assetPath: string;
};

export type AccessoryItem = CatalogBase & {
  kind: "accessory";
  slot: AccessorySlot;
  assets: Record<MascotId, { front: string; back?: string }>;
  incompatibleOutfits?: string[];
};

export type CosmeticItem = OutfitItem | AccessoryItem;

export type PublicRewardState = {
  storage?: "browser" | "account";
  coins: number;
  completed: Record<string, string>;
  reviews: Record<string, string>;
  owned: string[];
  mascot: MascotId;
  equipped: EquippedItems;
  dailyReviews?: { day: string; count: number };
  streak?: { count: number; longest: number; lastDay: string | null };
  wardrobeRefund?: number;
  sceneRefund?: number;
  notebookTheme: string | null;
};

export const retiredCosmeticPrices: Record<string, number> = {
  "study-scarf": 60,
  "campus-cap": 80,
  "quiet-hoodie": 150,
  "amber-readers": 90,
  "focus-headphones": 110,
  "lavender-beret": 95,
  "explorer-satchel": 125,
  "star-cardigan": 150,
};

export const retiredScenePrices: Record<string, number> = {
  "scene-garden": 30,
  "scene-sunset": 50,
  "scene-night": 80,
  "scene-study": 45,
  "scene-cafe": 70,
  "scene-train": 95,
  "scene-library": 120,
  "scene-aurora": 160,
};

const outfit = (item: Omit<OutfitItem, "kind" | "slot" | "poseVersion">): OutfitItem => ({
  ...item,
  kind: "outfit",
  slot: "outfit",
  poseVersion: "wardrobe-v1",
});

const accessory = (
  item: Omit<AccessoryItem, "kind" | "poseVersion" | "mascots" | "assets">,
): AccessoryItem => {
  const derivedKey = item.id.replace(/^accessory-/, "").replace(/-v4$/, "");
  const assetKey = derivedKey === "constellation" ? "constellation-pendant" : derivedKey === "language-lanyard" ? "club-lanyard" : derivedKey;
  const paths = (mascot: MascotId) => {
    const path = `/visuals/wardrobe/accessories/${assetKey}-${mascot}.png`;
    return item.slot === "back" ? { back: path, front: "" } : { front: path };
  };
  return {
    ...item,
    kind: "accessory",
    poseVersion: "wardrobe-v1",
    mascots: ["sparky", "pinky"],
    assets: {
      sparky: paths("sparky"),
      pinky: paths("pinky"),
    },
  };
};

export const outfitCatalog: OutfitItem[] = [
  outfit({ id: "pinky-focus-look", name: "Pinky em foco", description: "Moletom confortável pronto para receber acessórios.", price: 40, mascots: ["pinky"], assetPath: "/visuals/wardrobe/outfits/pinky-focus-look.png" }),
  outfit({ id: "sparky-explorer-look", name: "Sparky explorador", description: "Jaqueta de viagem para acompanhar novas descobertas.", price: 60, mascots: ["sparky"], assetPath: "/visuals/wardrobe/outfits/sparky-explorer-look.png" }),
  outfit({ id: "sparky-academy-look", name: "Academia do Sparky", description: "Cardigã acadêmico para combinar com qualquer acessório compatível.", price: 270, mascots: ["sparky"], assetPath: "/visuals/wardrobe/outfits/sparky-academy-look.png" }),
  outfit({ id: "pinky-atelier-look", name: "Ateliê da Pinky", description: "Cardigã violeta para dar asas à criatividade.", price: 270, mascots: ["pinky"], assetPath: "/visuals/wardrobe/outfits/pinky-atelier-look.png" }),
  outfit({ id: "sparky-cozy-reader", name: "Leitor aconchegante", description: "Suéter verde para uma sessão tranquila de leitura.", price: 90, mascots: ["sparky"], assetPath: "/visuals/wardrobe/outfits/sparky-cozy-reader.png" }),
  outfit({ id: "sparky-science-club", name: "Clube de ciências", description: "Jaleco turquesa para investigar ideias e palavras.", price: 120, mascots: ["sparky"], assetPath: "/visuals/wardrobe/outfits/sparky-science-club.png" }),
  outfit({ id: "sparky-debate-captain", name: "Capitão de debate", description: "Blazer vinho para defender argumentos com confiança.", price: 150, mascots: ["sparky"], assetPath: "/visuals/wardrobe/outfits/sparky-debate-captain.png" }),
  outfit({ id: "sparky-urban-sport", name: "Urbano esportivo", description: "Jaqueta azul vibrante para aprender em movimento.", price: 180, mascots: ["sparky"], assetPath: "/visuals/wardrobe/outfits/sparky-urban-sport.png" }),
  outfit({ id: "pinky-campus", name: "Pinky no campus", description: "Cardigã universitário em tons de ameixa.", price: 90, mascots: ["pinky"], assetPath: "/visuals/wardrobe/outfits/pinky-campus.png" }),
  outfit({ id: "pinky-festival", name: "Viajante de festival", description: "Jaqueta coral leve para encontros e descobertas.", price: 120, mascots: ["pinky"], assetPath: "/visuals/wardrobe/outfits/pinky-festival.png" }),
  outfit({ id: "pinky-creative-lab", name: "Laboratório criativo", description: "Avental turquesa para experimentar novas ideias.", price: 150, mascots: ["pinky"], assetPath: "/visuals/wardrobe/outfits/pinky-creative-lab.png" }),
  outfit({ id: "pinky-presenter", name: "Pinky apresentadora", description: "Blazer roxo para apresentações claras e marcantes.", price: 180, mascots: ["pinky"], assetPath: "/visuals/wardrobe/outfits/pinky-presenter.png" }),
];

export const accessoryCatalog: AccessoryItem[] = [
  accessory({ id: "accessory-urban-cap-v4", name: "Boné urbano", description: "Boné verde ajustado às orelhas de cada mascote.", price: 45, slot: "head" }),
  accessory({ id: "accessory-lavender-beret-v4", name: "Boina lavanda", description: "Uma boina artística com encaixe próprio para cada personagem.", price: 55, slot: "head" }),
  accessory({ id: "accessory-focus-headphones-v4", name: "Fones de foco", description: "Fones turquesa para entrar no ritmo dos estudos.", price: 80, slot: "head" }),
  accessory({ id: "accessory-knit-beanie-v4", name: "Gorro aconchegante", description: "Gorro macio para dias de leitura e revisão.", price: 50, slot: "head" }),
  accessory({ id: "accessory-amber-readers-v4", name: "Óculos âmbar", description: "Armação âmbar leve e expressiva.", price: 60, slot: "face" }),
  accessory({ id: "accessory-round-readers-v4", name: "Óculos redondos", description: "Armação clássica para o clube de leitura.", price: 55, slot: "face" }),
  accessory({ id: "accessory-sunglasses-v4", name: "Óculos de sol", description: "Um toque descontraído para o visual.", price: 70, slot: "face" }),
  accessory({ id: "accessory-science-visor-v4", name: "Visor científico", description: "Visor moderno para missões de descoberta.", price: 90, slot: "face" }),
  accessory({ id: "accessory-study-scarf-v4", name: "Cachecol de estudos", description: "Cachecol coral para combinar com diferentes trajes.", price: 45, slot: "neck" }),
  accessory({ id: "accessory-debate-bow-v4", name: "Gravata de debate", description: "Gravata-borboleta para ocasiões especiais.", price: 50, slot: "neck" }),
  accessory({ id: "accessory-constellation-v4", name: "Pingente constelação", description: "Um pequeno lembrete de que sempre há mais para descobrir.", price: 65, slot: "neck" }),
  accessory({ id: "accessory-language-lanyard-v4", name: "Cordão do clube", description: "Identificação do clube de idiomas, sem marcas ou texto.", price: 40, slot: "neck" }),
  accessory({ id: "accessory-explorer-satchel-v4", name: "Bolsa exploradora", description: "Bolsa lateral para levar livros e anotações.", price: 85, slot: "back" }),
  accessory({ id: "accessory-compact-backpack-v4", name: "Mochila compacta", description: "Mochila azul para estudar em qualquer lugar.", price: 95, slot: "back" }),
  accessory({ id: "accessory-book-tote-v4", name: "Bolsa de livros", description: "Bolsa clara com espaço para novas leituras.", price: 70, slot: "back" }),
  accessory({ id: "accessory-rocket-pack-v4", name: "Mochila-foguete", description: "Uma mochila divertida para impulsionar a próxima meta.", price: 120, slot: "back" }),
];

export const cosmeticCatalog: CosmeticItem[] = [...outfitCatalog, ...accessoryCatalog];

export const legacyLookGrants: Record<string, string[]> = {
  "pinky-focus-look": ["accessory-focus-headphones-v4"],
  "sparky-explorer-look": ["accessory-urban-cap-v4", "accessory-study-scarf-v4", "accessory-explorer-satchel-v4"],
  "sparky-academy-look": ["accessory-amber-readers-v4", "accessory-book-tote-v4"],
  "pinky-atelier-look": ["accessory-lavender-beret-v4", "accessory-book-tote-v4"],
};

export const practiceCatalog = [
  { id: "practice-travel", name: "Passaporte do cotidiano", level: "A1–A2", price: 40, description: "Duas missões: corrigir um pedido no café e resolver um problema no hotel." },
  { id: "practice-team", name: "Inglês em equipe", level: "B1–B2", price: 60, description: "Duas missões: negociar um prazo e explicar uma mudança de plano." },
  { id: "practice-nuance", name: "Laboratório de nuances", level: "C1–C2", price: 80, description: "Duas missões: sintetizar evidências e adaptar uma mensagem delicada." },
] as const;

export const notebookThemeCatalog = [
  { id: "notebook-mint", kind: "notebook-theme", name: "Caderno menta", price: 25, className: "notebook-mint", description: "Verdes suaves e páginas claras para organizar suas próximas descobertas." },
  { id: "notebook-midnight", kind: "notebook-theme", name: "Caderno meia-noite", price: 40, className: "notebook-midnight", description: "Páginas azul-escuras e texto claro para um caderno com clima noturno." },
  { id: "notebook-classic", kind: "notebook-theme", name: "Caderno papel clássico", price: 55, className: "notebook-classic", description: "Papel creme e detalhes em castanho para suas frases, rascunhos e revisões." },
  { id: "notebook-berry", kind: "notebook-theme", name: "Caderno frutas vermelhas", price: 70, className: "notebook-berry", description: "Tons de amora e rosa suave para dar outra aparência ao seu espaço de escrita." },
] as const;

export const storeCatalog = [
  ...cosmeticCatalog,
  ...practiceCatalog.map((item) => ({ ...item, kind: "practice-pack" as const })),
  ...notebookThemeCatalog,
];

export function isCosmeticItem(item: (typeof storeCatalog)[number]): item is CosmeticItem {
  return item.kind === "outfit" || item.kind === "accessory";
}

export function isCompatibleCosmetic(item: CosmeticItem, mascot: MascotId, outfitId?: string | null) {
  if (!item.mascots.includes(mascot) || item.poseVersion !== "wardrobe-v1") return false;
  if (item.kind === "outfit") return Boolean(item.assetPath);
  const variant = item.assets[mascot];
  if (!variant || (!variant.front && !variant.back)) return false;
  if (!outfitId) return true;
  const outfit = outfitCatalog.find(entry => entry.id === outfitId);
  return Boolean(outfit && outfit.mascots.includes(mascot) && outfit.poseVersion === item.poseVersion && !item.incompatibleOutfits?.includes(outfitId));
}
