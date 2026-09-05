import { lessons, modules } from "./curriculum.ts";
import {
  cosmeticCatalog,
  type CosmeticSlot,
  type EquippedItems,
  type MascotId,
  type PublicRewardState,
} from "./rewards-shared.ts";

export type RewardState = {
  version: 1;
  coins: number;
  completedBits: string;
  moduleBits: string;
  dueDays: number[];
  reviewDay: number;
  reviewBits: string;
  reviewCount: number;
  owned: string[];
  mascot: MascotId;
  equipped: EquippedItems;
};


const lessonBytes = Math.ceil(lessons.length / 8);
const moduleBytes = Math.ceil(modules.length / 8);
const blankBits = (size: number) => Buffer.alloc(size).toString("base64url");

export function emptyRewardState(): RewardState {
  return {
    version: 1,
    coins: 0,
    completedBits: blankBits(lessonBytes),
    moduleBits: blankBits(moduleBytes),
    dueDays: Array(lessons.length).fill(0),
    reviewDay: 0,
    reviewBits: blankBits(lessonBytes),
    reviewCount: 0,
    owned: [],
    mascot: "sparky",
    equipped: { sparky: {}, pinky: {} },
  };
}

function decodeBits(value: unknown, bytes: number) {
  if (typeof value !== "string") return Buffer.alloc(bytes);
  try {
    const decoded = Buffer.from(value, "base64url");
    return decoded.length === bytes ? Buffer.from(decoded) : Buffer.alloc(bytes);
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
  const raw = input as Partial<RewardState>;
  const owned = Array.isArray(raw.owned)
    ? [...new Set(raw.owned.filter((id) => cosmeticCatalog.some((item) => item.id === id)))]
    : [];
  const mascot: MascotId = raw.mascot === "pinky" ? "pinky" : "sparky";
  const equipped: EquippedItems = { sparky: {}, pinky: {} };
  for (const current of ["sparky", "pinky"] as const) {
    for (const slot of ["head", "neck", "body"] as const) {
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
    version: 1,
    coins:
      typeof raw.coins === "number" &&
      Number.isSafeInteger(raw.coins) &&
      raw.coins >= 0 &&
      raw.coins <= 100000
        ? raw.coins
        : 0,
    completedBits: decodeBits(raw.completedBits, lessonBytes).toString("base64url"),
    moduleBits: decodeBits(raw.moduleBits, moduleBytes).toString("base64url"),
    dueDays: Array.from({ length: lessons.length }, (_, index) => {
      const value = raw.dueDays?.[index];
      return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
        ? value
        : 0;
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
    owned,
    mascot,
    equipped,
  };
}

export function publicRewardState(state: RewardState): PublicRewardState {
  const bits = decodeBits(state.completedBits, lessonBytes);
  const completed: Record<string, string> = {};
  const reviews: Record<string, string> = {};
  lessons.forEach((lesson, index) => {
    if (hasBit(bits, index)) {
      completed[lesson.id] = "completed";
      if (state.dueDays[index]) reviews[lesson.id] = dayIso(state.dueDays[index]);
    }
  });
  return {
    coins: state.coins,
    completed,
    reviews,
    owned: state.owned,
    mascot: state.mascot,
    equipped: state.equipped,
  };
}

export function completeStudy(
  current: RewardState,
  lessonId: string,
  review: boolean,
  now = new Date(),
) {
  const state = normalizeRewardState(current);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
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
      !hasBit(reviewBits, index) &&
      state.reviewCount < 10
    ) {
      setBit(reviewBits, index);
      state.reviewBits = reviewBits.toString("base64url");
      state.reviewCount++;
      state.dueDays[index] = today + 3;
      state.coins += 2;
      earned = 2;
      reason = "review";
    }
    return { state, earned, reason };
  }

  if (!hasBit(completed, index)) {
    setBit(completed, index);
    state.completedBits = completed.toString("base64url");
    state.dueDays[index] = today + 1;
    state.coins += 10;
    earned = 10;
    reason = "lesson";
    const lesson = lessons[index];
    const moduleIndex = modules.findIndex((module) => module.id === lesson.moduleId);
    const moduleBits = decodeBits(state.moduleBits, moduleBytes);
    if (
      moduleIndex >= 0 &&
      !hasBit(moduleBits, moduleIndex) &&
      modules[moduleIndex].lessons.every((item) => {
        const lessonIndex = lessons.findIndex((candidate) => candidate.id === item.id);
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
  const item = cosmeticCatalog.find((entry) => entry.id === itemId);
  if (!item) throw new Error("item-not-found");
  if (state.owned.includes(item.id)) return { state, spent: 0, alreadyOwned: true };
  if (state.coins < item.price) throw new Error("insufficient-coins");
  state.coins -= item.price;
  state.owned.push(item.id);
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
      state.owned.includes(entry.id),
  );
  if (!item) throw new Error("item-not-owned-or-compatible");
  state.equipped[mascot][slot] = item.id;
  return state;
}
