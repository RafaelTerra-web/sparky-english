export type MascotId = "sparky" | "pinky";
// Old slots remain readable for migration; new outfits use one look + scene.
export const cosmeticSlots = ["head", "face", "neck", "body", "style", "scene"] as const;
export type CosmeticSlot = (typeof cosmeticSlots)[number];
export type CosmeticCategory = "looks" | "scenes";
export type CosmeticItem = {
  id: string; name: string; description: string; price: number;
  slot: CosmeticSlot; category: CosmeticCategory; mascots: MascotId[];
  className: string; assetPath?: string;
  sceneAssets?: { small: string; large: string };
};
export type EquippedItems = Record<MascotId, Partial<Record<CosmeticSlot, string>>>;
export type PublicRewardState = {
  storage?: "browser" | "account";
  dailyReviews?: { day: string; count: number };
  coins: number; completed: Record<string, string>; reviews: Record<string, string>;
  owned: string[]; mascot: MascotId; equipped: EquippedItems;
  wardrobeRefund?: number;
  notebookTheme: string | null;
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
  { id: "scene-garden", name: "Jardim de ideias", description: "Arcos de pedra, flores e um caminho tranquilo para acompanhar seu estudo.", price: 30, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-garden", sceneAssets: { small: "/visuals/scenes/scene-garden-480.webp", large: "/visuals/scenes/scene-garden-960.webp" } },
  { id: "scene-sunset", name: "Hora dourada", description: "Um terraço junto ao rio, entre flores e reflexos do pôr do sol.", price: 50, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-sunset", sceneAssets: { small: "/visuals/scenes/scene-sunset-480.webp", large: "/visuals/scenes/scene-sunset-960.webp" } },
  { id: "scene-night", name: "Noite de descobertas", description: "Uma janela estrelada, livros e luz de leitura para sua companhia de estudo.", price: 80, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-night", sceneAssets: { small: "/visuals/scenes/scene-night-480.webp", large: "/visuals/scenes/scene-night-960.webp" } },
  { id: "scene-study", name: "Canto de estudos", description: "Luz da manhã, madeira clara e plantas em um espaço feito para concentrar.", price: 45, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-study", sceneAssets: { small: "/visuals/scenes/scene-study-480.webp", large: "/visuals/scenes/scene-study-960.webp" } },
  { id: "scene-cafe", name: "Café urbano", description: "Janelas para a cidade, um balcão verde e o clima de uma pausa para conversar.", price: 70, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-cafe", sceneAssets: { small: "/visuals/scenes/scene-cafe-480.webp", large: "/visuals/scenes/scene-cafe-960.webp" } },
  { id: "scene-train", name: "Janela de trem", description: "Uma poltrona confortável e colinas pela janela para aprender em clima de viagem.", price: 95, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-train", sceneAssets: { small: "/visuals/scenes/scene-train-480.webp", large: "/visuals/scenes/scene-train-960.webp" } },
  { id: "scene-library", name: "Biblioteca", description: "Estantes, um grande arco de luz e um lugar tranquilo entre os livros.", price: 120, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-library", sceneAssets: { small: "/visuals/scenes/scene-library-480.webp", large: "/visuals/scenes/scene-library-960.webp" } },
  { id: "scene-aurora", name: "Observatório com aurora", description: "Montanhas, um telescópio e luzes no céu para acompanhar suas próximas descobertas.", price: 160, slot: "scene", category: "scenes", mascots: ["sparky", "pinky"], className: "scene-aurora", sceneAssets: { small: "/visuals/scenes/scene-aurora-480.webp", large: "/visuals/scenes/scene-aurora-960.webp" } },
];
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
  ...cosmeticCatalog.map(item => ({ ...item, kind: item.category === "looks" ? "look" as const : "scene" as const })),
  ...practiceCatalog.map(item => ({ ...item, kind: "practice-pack" as const })),
  ...notebookThemeCatalog,
];
