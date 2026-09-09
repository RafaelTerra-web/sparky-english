import { lessonLedger, moduleLedger } from "./content/ledger.ts";
import { lessons, modules } from "./curriculum.ts";
import { storeLedger } from "./store-ledger.ts";
import {
  cosmeticCatalog,
  cosmeticSlots,
  storeCatalog,
  retiredCosmeticPrices,
  notebookThemeCatalog,
  type CosmeticSlot,
  type EquippedItems,
  type MascotId,
  type PublicRewardState,
} from "./rewards-shared.ts";

export type RewardState = {
  version: 3;
  wardrobeVersion: 2;
  wardrobeRefund: number;
  coins: number;
  completedBits: string;
  moduleBits: string;
  dueDays: number[];
  reviewStages: number[];
  reviewDay: number;
  reviewBits: string;
  reviewCount: number;
  ownedBits: string;
  notebookTheme: string | null;
  mascot: MascotId;
  equipped: EquippedItems;
};


const lessonBytes = Math.ceil(lessonLedger.length / 8);
const moduleBytes = Math.ceil(moduleLedger.length / 8);
const storeBytes = Math.ceil(storeLedger.length / 8);
const blankBits = (size: number) => Buffer.alloc(size).toString("base64url");

export function emptyRewardState(): RewardState {
  return {
    version: 3,
    wardrobeVersion: 2,
    wardrobeRefund: 0,
    coins: 0,
    completedBits: blankBits(lessonBytes),
    moduleBits: blankBits(moduleBytes),
    dueDays: Array(lessonLedger.length).fill(0),
    reviewStages: Array(lessonLedger.length).fill(0),
    reviewDay: 0,
    reviewBits: blankBits(lessonBytes),
    reviewCount: 0,
    ownedBits: blankBits(storeBytes),
    notebookTheme: null,
    mascot: "sparky",
    equipped: { sparky: {}, pinky: {} },
  };
}

function decodeBits(value: unknown, bytes: number) {
  if (typeof value !== "string") return Buffer.alloc(bytes);
  try {
    const decoded = Buffer.from(value, "base64url");
    if (decoded.length > bytes) return Buffer.alloc(bytes);
    const expanded = Buffer.alloc(bytes);
    decoded.copy(expanded);
    return expanded;
  } catch {
    return Buffer.alloc(bytes);
  }
}
function hasBit(bits: Buffer, index: number) {
  return Boolean(bits[Math.floor(index / 8)] & (1 << (index % 8)));
}
function setBit(bits: Buffer, index: number) {
  bits[Math.floor(index / 8)] |= 1 << (index % 8);
}
function dayNumber(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return Math.floor(Date.UTC(value("year"), value("month") - 1, value("day")) / 86400000);
}
function dayIso(day: number) {
  // Brazil has stayed on UTC-03 since 2019; 03:00Z is local midnight in São Paulo.
  return new Date(day * 86400000 + 3 * 3600000).toISOString();
}

export function normalizeRewardState(input: unknown): RewardState {
  const blank = emptyRewardState();
  if (!input || typeof input !== "object") return blank;
  const raw = input as Partial<Omit<RewardState, "version">> & { version?: number; owned?: unknown[] };
  if (raw.version !== 1 && raw.version !== 3) return blank;
  const ownedBits = raw.version === 3 ? decodeBits(raw.ownedBits, storeBytes) : Buffer.alloc(storeBytes);
  if (raw.version === 1 && Array.isArray(raw.owned)) {
    for (const id of raw.owned) {
      const index = storeLedger.indexOf(id as typeof storeLedger[number]);
      if (index >= 0) setBit(ownedBits, index);
    }
  }
  const owned: string[] = storeLedger.filter((id, index) => hasBit(ownedBits, index) && storeCatalog.some(item => item.id === id));
  const mascot: MascotId = raw.mascot === "pinky" ? "pinky" : "sparky";
  const equipped: EquippedItems = { sparky: {}, pinky: {} };
  const validBalance = typeof raw.coins === "number" && Number.isSafeInteger(raw.coins) && raw.coins >= 0 && raw.coins <= 100000;
  const refund = raw.version === 1 && raw.wardrobeVersion !== 2 && validBalance && Array.isArray(raw.owned)
    ? [...new Set(raw.owned.filter(id => typeof id === "string"))].reduce((sum, id) => sum + (Object.hasOwn(retiredCosmeticPrices, id) ? retiredCosmeticPrices[id] : 0), 0) : 0;
  for (const current of ["sparky", "pinky"] as const) {
    for (const slot of cosmeticSlots) {
      const id = raw.equipped?.[current]?.[slot];
      const item = cosmeticCatalog.find(
        (entry) =>
          entry.id === id &&
          entry.slot === slot &&
          entry.mascots.includes(current) &&
          owned.includes(entry.id),
      );
      if (item) equipped[current][slot] = item.id;
    }
  }
  return {
    version: 3,
    wardrobeVersion: 2,
    wardrobeRefund: raw.wardrobeVersion === 2 && Number.isSafeInteger(raw.wardrobeRefund) && raw.wardrobeRefund! >= 0 && raw.wardrobeRefund! <= 860 ? raw.wardrobeRefund! : refund,
    coins: validBalance ? Math.min(100000, raw.coins! + refund) : 0,
    completedBits: decodeBits(raw.completedBits, lessonBytes).toString("base64url"),
    moduleBits: decodeBits(raw.moduleBits, moduleBytes).toString("base64url"),
    dueDays: Array.from({ length: lessonLedger.length }, (_, index) => {
      const value = raw.dueDays?.[index];
      return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
        ? value
        : 0;
    }),
    reviewStages: Array.from({ length: lessonLedger.length }, (_, index) => {
      const stage = raw.reviewStages?.[index];
      return typeof stage === "number" && Number.isInteger(stage) && stage >= 0 && stage <= 4 ? stage : 0;
    }),
    reviewDay:
      typeof raw.reviewDay === "number" && Number.isSafeInteger(raw.reviewDay)
        ? raw.reviewDay
        : 0,
    reviewBits: decodeBits(raw.reviewBits, lessonBytes).toString("base64url"),
    reviewCount:
      typeof raw.reviewCount === "number" &&
      Number.isSafeInteger(raw.reviewCount) &&
      raw.reviewCount >= 0 &&
      raw.reviewCount <= 10
        ? raw.reviewCount
        : 0,
    ownedBits: ownedBits.toString("base64url"),
    notebookTheme: notebookThemeCatalog.some(item => item.id === raw.notebookTheme && owned.includes(item.id)) ? raw.notebookTheme! : null,
    mascot,
    equipped,
  };
}

export function publicRewardState(state: RewardState): PublicRewardState {
  const bits = decodeBits(state.completedBits, lessonBytes);
  const completed: Record<string, string> = {};
  const reviews: Record<string, string> = {};
  lessons.forEach((lesson) => {
    const index = lessonLedger.indexOf(lesson.id as typeof lessonLedger[number]);
    if (hasBit(bits, index)) {
      completed[lesson.id] = "completed";
      if (state.dueDays[index]) reviews[lesson.id] = dayIso(state.dueDays[index]);
    }
  });
  return {
    dailyReviews: { day: new Date(state.reviewDay * 86400000).toISOString().slice(0,10), count: state.reviewCount },
    coins: state.coins,
    completed,
    reviews,
    owned: storeLedger.filter((id, index) => hasBit(decodeBits(state.ownedBits, storeBytes), index) && storeCatalog.some(item => item.id === id)),
    notebookTheme: state.notebookTheme,
    mascot: state.mascot,
    equipped: state.equipped,
    wardrobeRefund: state.wardrobeRefund,
  };
}

export function completeStudy(
  current: RewardState,
  lessonId: string,
  review: boolean,
  now = new Date(),
  independent = true,
) {
  const state = normalizeRewardState(current);
  const index = lessonLedger.indexOf(lessonId as typeof lessonLedger[number]);
  if (index < 0) throw new Error("lesson-not-found");
  const today = dayNumber(now);
  const completed = decodeBits(state.completedBits, lessonBytes);
  let earned = 0;
  let reason: "lesson" | "module" | "review" | "repeat" = "repeat";

  if (review) {
    let reviewBits = decodeBits(state.reviewBits, lessonBytes);
    if (state.reviewDay !== today) {
      state.reviewDay = today;
      state.reviewCount = 0;
      reviewBits = Buffer.alloc(lessonBytes);
    }
    const due = state.dueDays[index];
    if (
      hasBit(completed, index) &&
      due > 0 &&
      due <= today &&
      !hasBit(reviewBits, index) && state.reviewCount < 3
    ) {
      setBit(reviewBits, index);
      state.reviewBits = reviewBits.toString("base64url");
      state.reviewStages[index] = independent ? Math.min(4, state.reviewStages[index] + 1) : 0;
      state.dueDays[index] = today + [3, 7, 14, 30, 60][state.reviewStages[index]];
      if (state.reviewCount < 3) {
        state.reviewCount++;
        state.coins += 2;
        earned = 2;
      }
      reason = "review";
    }
    return { state, earned, reason };
  }

  if (!hasBit(completed, index)) {
    setBit(completed, index);
    state.completedBits = completed.toString("base64url");
    state.dueDays[index] = today + 3;
    state.coins += 10;
    earned = 10;
    reason = "lesson";
    const lesson = lessons.find((item) => item.id === lessonId)!;
    const moduleIndex = moduleLedger.indexOf(lesson.moduleId as typeof moduleLedger[number]);
    const moduleBits = decodeBits(state.moduleBits, moduleBytes);
    if (
      moduleIndex >= 0 &&
      !hasBit(moduleBits, moduleIndex) &&
      modules.find((item) => item.id === lesson.moduleId)!.lessons.every((item) => {
        const lessonIndex = lessonLedger.indexOf(item.id as typeof lessonLedger[number]);
        return lessonIndex >= 0 && hasBit(completed, lessonIndex);
      })
    ) {
      setBit(moduleBits, moduleIndex);
      state.moduleBits = moduleBits.toString("base64url");
      state.coins += 20;
      earned += 20;
      reason = "module";
    }
  }
  return { state, earned, reason };
}

export function buyCosmetic(current: RewardState, itemId: string) {
  const state = normalizeRewardState(current);
  const item = storeCatalog.find((entry) => entry.id === itemId);
  if (!item) throw new Error("item-not-found");
  const index = storeLedger.indexOf(item.id as typeof storeLedger[number]);
  if (index < 0) throw new Error("item-not-found");
  const ownedBits = decodeBits(state.ownedBits, storeBytes);
  if (hasBit(ownedBits, index)) return { state, spent: 0, alreadyOwned: true };
  if (state.coins < item.price) throw new Error("insufficient-coins");
  state.coins -= item.price;
  setBit(ownedBits, index);
  state.ownedBits = ownedBits.toString("base64url");
  return { state, spent: item.price, alreadyOwned: false };
}

export function selectMascot(current: RewardState, mascot: MascotId) {
  const state = normalizeRewardState(current);
  state.mascot = mascot;
  return state;
}

export function equipCosmetic(
  current: RewardState,
  mascot: MascotId,
  slot: CosmeticSlot,
  itemId: string | null,
) {
  const state = normalizeRewardState(current);
  if (!itemId) {
    delete state.equipped[mascot][slot];
    return state;
  }
  const item = cosmeticCatalog.find(
    (entry) =>
      entry.id === itemId &&
      entry.slot === slot &&
      entry.mascots.includes(mascot) &&
      publicRewardState(state).owned.includes(entry.id),
  );
  if (!item) throw new Error("item-not-owned-or-compatible");
  state.equipped[mascot][slot] = item.id;
  return state;
}

export function equipNotebookTheme(current: RewardState, itemId: string | null) {
  const state = normalizeRewardState(current);
  if (itemId !== null && !notebookThemeCatalog.some(item => item.id === itemId && publicRewardState(state).owned.includes(item.id))) {
    throw new Error("item-not-owned-or-compatible");
  }
  state.notebookTheme = itemId;
  return state;
}
