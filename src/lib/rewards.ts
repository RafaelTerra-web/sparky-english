import { lessonLedger, moduleLedger } from "./content/ledger.ts";
import { isDeepStrictEqual } from "node:util";
import { lessons, modules } from "./curriculum.ts";
import { storeLedger } from "./store-ledger.ts";
import { getExpeditionOffer, getOfferForEpisode, expeditionFamilies, type ExpeditionFamily } from "./expeditions-catalog.ts";
import {
  cosmeticCatalog,
  cosmeticSlots,
  isCompatibleCosmetic,
  legacyLookGrants,
  storeCatalog,
  retiredCosmeticPrices,
  retiredScenePrices,
  type CosmeticSlot,
  type EquippedItems,
  type MascotId,
  type PublicRewardState,
} from "./rewards-shared.ts";

export type ExpeditionReceipt = {
  itemId: string;
  price: number;
  offerVersion: string;
  purchasedAt: string;
  receiptId: string;
};

export type ExpeditionSession = {
  sessionId: string;
  episodeId: string;
  family: ExpeditionFamily;
  decisionId: string | null;
  applicationCorrect: boolean;
  transferCorrect: boolean;
  independent: boolean;
  completedAt: string | null;
  reviewDueAt: string | null;
  reviewConfirmedAt: string | null;
  reviewAttempted: boolean;
  reviewStage: 0 | 1 | 2;
  satisfaction: "yes" | "no" | null;
};

export type RewardState = {
  version: 7;
  wardrobeVersion: 3;
  wardrobeRefund: number;
  sceneRefund: number;
  expeditionRefund: number;
  retiredRefundBits: string;
  expeditionRefundBits: string;
  coins: number;
  completedBits: string;
  moduleBits: string;
  dueDays: number[];
  reviewStages: number[];
  reviewDay: number;
  reviewBits: string;
  reviewCount: number;
  streakDay: number;
  streakCount: number;
  longestStreak: number;
  ownedBits: string;
  mascot: MascotId;
  equipped: EquippedItems;
  expeditionGoalId: string | null;
  expeditionReceipts: ExpeditionReceipt[];
  expeditionSessions: ExpeditionSession[];
};


const lessonBytes = Math.ceil(lessonLedger.length / 8);
const moduleBytes = Math.ceil(moduleLedger.length / 8);
const storeBytes = Math.ceil(storeLedger.length / 8);
const blankBits = (size: number) => Buffer.alloc(size).toString("base64url");

export function emptyRewardState(): RewardState {
  return {
    version: 7,
    wardrobeVersion: 3,
    wardrobeRefund: 0,
    sceneRefund: 0,
    expeditionRefund: 0,
    retiredRefundBits: blankBits(storeBytes),
    expeditionRefundBits: blankBits(storeBytes),
    coins: 0,
    completedBits: blankBits(lessonBytes),
    moduleBits: blankBits(moduleBytes),
    dueDays: Array(lessonLedger.length).fill(0),
    reviewStages: Array(lessonLedger.length).fill(0),
    reviewDay: 0,
    reviewBits: blankBits(lessonBytes),
    reviewCount: 0,
    streakDay: 0,
    streakCount: 0,
    longestStreak: 0,
    ownedBits: blankBits(storeBytes),
    mascot: "sparky",
    equipped: { sparky: {}, pinky: {} },
    expeditionGoalId: null,
    expeditionReceipts: [],
    expeditionSessions: [],
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
  const raw = input as Partial<Omit<RewardState, "version" | "wardrobeVersion" | "equipped">> & {
    version?: number;
    wardrobeVersion?: number;
    owned?: unknown[];
    equipped?: Record<string, Record<string, string>>;
  };
  if (raw.version !== 1 && raw.version !== 3 && raw.version !== 4 && raw.version !== 5 && raw.version !== 6 && raw.version !== 7) return blank;
  const ownedBits = raw.version === 3 || raw.version === 4 || raw.version === 5 || raw.version === 6 || raw.version === 7
    ? decodeBits(raw.ownedBits, storeBytes)
    : Buffer.alloc(storeBytes);
  if (raw.version === 1 && Array.isArray(raw.owned)) {
    for (const id of raw.owned) {
      const index = storeLedger.indexOf(id as typeof storeLedger[number]);
      if (index >= 0) setBit(ownedBits, index);
    }
  }
  const mascot: MascotId = raw.mascot === "pinky" ? "pinky" : "sparky";
  const equipped: EquippedItems = { sparky: {}, pinky: {} };
  const validBalance = typeof raw.coins === "number" && Number.isSafeInteger(raw.coins) && raw.coins >= 0 && raw.coins <= 100000;
  const wardrobeRefund = raw.version === 1 && raw.wardrobeVersion !== 2 && validBalance && Array.isArray(raw.owned)
    ? [...new Set(raw.owned.filter(id => typeof id === "string"))].reduce((sum, id) => sum + (Object.hasOwn(retiredCosmeticPrices, id) ? retiredCosmeticPrices[id] : 0), 0) : 0;
  const retiredRefundBits = decodeBits(raw.retiredRefundBits, storeBytes);
  let newSceneRefund = 0;
  for (const [id, price] of Object.entries(retiredScenePrices)) {
    const index = storeLedger.indexOf(id as typeof storeLedger[number]);
    if (index >= 0 && hasBit(ownedBits, index) && !hasBit(retiredRefundBits, index)) {
      newSceneRefund += price;
      setBit(retiredRefundBits, index);
    }
  }

  const needsModularMigration = (raw.version !== 4 && raw.version !== 5 && raw.version !== 6 && raw.version !== 7) || raw.wardrobeVersion !== 3;
  if (needsModularMigration) {
    for (const [lookId, grants] of Object.entries(legacyLookGrants)) {
      const lookIndex = storeLedger.indexOf(lookId as typeof storeLedger[number]);
      if (lookIndex < 0 || !hasBit(ownedBits, lookIndex)) continue;
      for (const grantId of grants) {
        const grantIndex = storeLedger.indexOf(grantId as typeof storeLedger[number]);
        if (grantIndex >= 0) setBit(ownedBits, grantIndex);
      }
    }
  }
  const owned: string[] = storeLedger.filter((id, index) => hasBit(ownedBits, index) && storeCatalog.some(item => item.id === id));
  for (const current of ["sparky", "pinky"] as const) {
    const oldOutfit = raw.equipped?.[current]?.outfit ?? raw.equipped?.[current]?.style;
    const outfitItem = cosmeticCatalog.find((entry) => entry.id === oldOutfit && entry.kind === "outfit" && entry.mascots.includes(current) && owned.includes(entry.id));
    if (outfitItem) equipped[current].outfit = outfitItem.id;
    for (const slot of cosmeticSlots) {
      if (slot === "outfit") continue;
      const id = raw.equipped?.[current]?.[slot];
      const item = cosmeticCatalog.find(
        (entry) =>
          entry.id === id &&
          entry.slot === slot &&
          isCompatibleCosmetic(entry, current, outfitItem?.id) &&
          owned.includes(entry.id),
      );
      if (item) equipped[current][slot] = item.id;
    }
    if (needsModularMigration && outfitItem) {
      for (const grantId of legacyLookGrants[outfitItem.id] ?? []) {
        const grant = cosmeticCatalog.find((entry) => entry.id === grantId && entry.kind === "accessory");
        if (grant && isCompatibleCosmetic(grant, current, outfitItem.id) && !equipped[current][grant.slot]) equipped[current][grant.slot] = grant.id;
      }
    }
  }
  const streakDay = typeof raw.streakDay === "number" && Number.isSafeInteger(raw.streakDay) && raw.streakDay >= 0 && raw.streakDay <= 1000000 ? raw.streakDay : 0;
  const streakCount = typeof raw.streakCount === "number" && Number.isSafeInteger(raw.streakCount) && raw.streakCount >= 0 && raw.streakCount <= 10000 ? raw.streakCount : 0;
  const longestStreak = typeof raw.longestStreak === "number" && Number.isSafeInteger(raw.longestStreak) && raw.longestStreak >= 0 && raw.longestStreak <= 10000 ? raw.longestStreak : 0;
  const expeditionReceipts: ExpeditionReceipt[] = [];
  const receiptIds = new Set<string>();
  if (Array.isArray(raw.expeditionReceipts)) for (const candidate of raw.expeditionReceipts) {
    if (!candidate || typeof candidate !== "object") continue;
    const entry = candidate as ExpeditionReceipt;
    const offer = getExpeditionOffer(entry.itemId);
    const ownedIndex = storeLedger.indexOf(entry.itemId as typeof storeLedger[number]);
    if (!offer || ownedIndex < 0 || !hasBit(ownedBits, ownedIndex) || receiptIds.has(entry.itemId)
      || !Number.isSafeInteger(entry.price) || entry.price < 0 || entry.price > 100000
      || typeof entry.offerVersion !== "string" || entry.offerVersion.length > 60
      || typeof entry.purchasedAt !== "string" || !Number.isFinite(Date.parse(entry.purchasedAt))
      || typeof entry.receiptId !== "string" || !/^[a-f0-9-]{36}$/.test(entry.receiptId)) continue;
    expeditionReceipts.push({ itemId: entry.itemId, price: entry.price, offerVersion: entry.offerVersion,
      purchasedAt: entry.purchasedAt, receiptId: entry.receiptId });
    receiptIds.add(entry.itemId);
  }
  const expeditionRefundBits = decodeBits(raw.expeditionRefundBits, storeBytes);
  let newExpeditionRefund = 0;
  for (const receipt of expeditionReceipts) {
    const index = storeLedger.indexOf(receipt.itemId as typeof storeLedger[number]);
    if (index >= 0 && !hasBit(expeditionRefundBits, index)) {
      newExpeditionRefund += receipt.price;
      setBit(expeditionRefundBits, index);
    }
  }
  const expeditionSessions: ExpeditionSession[] = [];
  const sessionKeys = new Set<string>();
  if (Array.isArray(raw.expeditionSessions)) for (const candidate of raw.expeditionSessions) {
    if (!candidate || typeof candidate !== "object") continue;
    const entry = candidate as ExpeditionSession;
    const offer = getOfferForEpisode(entry.episodeId);
    const ownedIndex = offer ? storeLedger.indexOf(offer.id as typeof storeLedger[number]) : -1;
    if (!offer || ownedIndex < 0 || !hasBit(ownedBits, ownedIndex)
      || !expeditionFamilies.includes(entry.family)
      || typeof entry.sessionId !== "string" || !/^[a-f0-9-]{36}$/.test(entry.sessionId)
      || sessionKeys.has(`${entry.episodeId}:${entry.family}`)) continue;
    const safeDate = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
    expeditionSessions.push({
      sessionId: entry.sessionId, episodeId: entry.episodeId, family: entry.family,
      decisionId: typeof entry.decisionId === "string" && entry.decisionId.length < 100 ? entry.decisionId : null,
      applicationCorrect: entry.applicationCorrect === true,
      transferCorrect: entry.transferCorrect === true,
      independent: entry.independent === true,
      completedAt: safeDate(entry.completedAt), reviewDueAt: safeDate(entry.reviewDueAt),
      reviewConfirmedAt: safeDate(entry.reviewConfirmedAt), reviewAttempted: entry.reviewAttempted === true,
      reviewStage: entry.reviewStage === 2 ? 2 : entry.reviewStage === 1 ? 1 : 0,
      satisfaction: entry.satisfaction === "yes" || entry.satisfaction === "no" ? entry.satisfaction : null,
    });
    sessionKeys.add(`${entry.episodeId}:${entry.family}`);
  }
  return {
    version: 7,
    wardrobeVersion: 3,
    wardrobeRefund: Number.isSafeInteger(raw.wardrobeRefund) && raw.wardrobeRefund! >= 0 && raw.wardrobeRefund! <= 860 ? raw.wardrobeRefund! : wardrobeRefund,
    sceneRefund: Math.min(650, (Number.isSafeInteger(raw.sceneRefund) && raw.sceneRefund! >= 0 ? raw.sceneRefund! : 0) + newSceneRefund),
    expeditionRefund: Math.min(100000, (Number.isSafeInteger(raw.expeditionRefund) && raw.expeditionRefund! >= 0 ? raw.expeditionRefund! : 0) + newExpeditionRefund),
    retiredRefundBits: retiredRefundBits.toString("base64url"),
    expeditionRefundBits: expeditionRefundBits.toString("base64url"),
    coins: validBalance ? Math.min(100000, raw.coins! + wardrobeRefund + newSceneRefund + newExpeditionRefund) : 0,
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
    streakDay,
    streakCount,
    longestStreak: Math.max(streakCount, longestStreak),
    ownedBits: ownedBits.toString("base64url"),
    mascot,
    equipped,
    expeditionGoalId: null,
    expeditionReceipts,
    expeditionSessions,
  };
}

export function rewardStateNeedsMigration(stored: unknown, normalized: RewardState) {
  return !isDeepStrictEqual(stored, normalized);
}

export function publicRewardState(state: RewardState): PublicRewardState {
  const bits = decodeBits(state.completedBits, lessonBytes);
  const completed: Record<string, string> = {};
  const reviews: Record<string, string> = {};
  const competencies: NonNullable<PublicRewardState["competencies"]> = {};
  lessons.forEach((lesson) => {
    const index = lessonLedger.indexOf(lesson.id as typeof lessonLedger[number]);
    if (hasBit(bits, index)) {
      completed[lesson.id] = "completed";
      competencies[lesson.id] = state.reviewStages[index] >= 2 ? "confirmed"
        : state.reviewStages[index] >= 1 ? "demonstrated" : "practicing";
      if (state.dueDays[index]) reviews[lesson.id] = dayIso(state.dueDays[index]);
    }
  });
  return {
    dailyReviews: { day: new Date(state.reviewDay * 86400000).toISOString().slice(0,10), count: state.reviewCount },
    streak: { count: state.streakCount, longest: Math.max(state.streakCount, state.longestStreak), lastDay: state.streakDay ? dayIso(state.streakDay).slice(0, 10) : null },
    coins: state.coins,
    completed,
    reviews,
    competencies,
    owned: storeLedger.filter((id, index) => hasBit(decodeBits(state.ownedBits, storeBytes), index) && storeCatalog.some(item => item.id === id)),
    mascot: state.mascot,
    equipped: state.equipped,
    wardrobeRefund: state.wardrobeRefund,
    sceneRefund: state.sceneRefund,
    expeditionRefund: state.expeditionRefund,
  };
}

export function checkIn(current: RewardState, now = new Date()) {
  const state = normalizeRewardState(current);
  const today = dayNumber(now);
  if (state.streakDay === today)
    return { state, advanced: false, milestone: false, earned: 0 };
  state.streakCount = state.streakDay === today - 1 ? state.streakCount + 1 : 1;
  state.streakDay = today;
  state.longestStreak = Math.max(state.longestStreak, state.streakCount);
  const milestone = state.streakCount > 1 && state.streakCount % 7 === 0;
  const earned = milestone ? 5 : 0;
  state.coins = Math.min(100000, state.coins + earned);
  return { state, advanced: true, milestone, earned };
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

export function resetLook(current: RewardState, mascot: MascotId) {
  const state = normalizeRewardState(current);
  state.equipped[mascot] = {};
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
      isCompatibleCosmetic(entry, mascot, state.equipped[mascot].outfit) &&
      publicRewardState(state).owned.includes(entry.id),
  );
  if (!item) throw new Error("item-not-owned-or-compatible");
  if (item.kind === "outfit") {
    const incompatible = cosmeticCatalog.some(entry => entry.kind === "accessory"
      && state.equipped[mascot][entry.slot] === entry.id && !isCompatibleCosmetic(entry, mascot, item.id));
    if (incompatible) throw new Error("item-not-owned-or-compatible");
  }
  state.equipped[mascot][slot] = item.id;
  return state;
}
