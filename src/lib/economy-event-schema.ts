import { createHash } from "node:crypto";
import { expeditionFamilies, getExpeditionOffer, getOfferForEpisode } from "./expeditions-catalog.ts";

export type EconomyEventInput = { eventId: string } & (
  | { kind: "preview"; offerId: string }
  | { kind: "goal"; offerId: string | null; coins: number }
  | { kind: "purchase"; offerId: string; offerVersion: string; pricePaid: number; coinsAfter: number }
  | { kind: "episode_start"; episodeId: string; family: string; sessionId: string }
  | { kind: "episode_finish"; episodeId: string; family: string; sessionId: string; independent: boolean }
  | { kind: "recall"; episodeId: string; family: string; sessionId: string; correct: boolean; confirmed: boolean }
  | { kind: "satisfaction"; episodeId: string; family: string; sessionId: string; value: "yes" | "no" }
);

export type EconomyEnvironment = "production" | "preview" | "local";
export type StoredEconomyEvent = {
  schemaVersion: 1;
  environment: EconomyEnvironment;
  account: string;
  eventKey: string;
  createdAt: string;
  kind: EconomyEventInput["kind"];
  offerId: string | null;
  offerVersion: string | null;
  episodeId?: string;
  family?: "A1-A2" | "B1-B2" | "C1-C2";
  sessionKey?: string;
  coins?: number;
  pricePaid?: number;
  coinsAfter?: number;
  independent?: boolean;
  correct?: boolean;
  confirmed?: boolean;
  value?: "yes" | "no";
};

const uuid = /^[a-f0-9-]{36}$/;
const version = /^[a-z0-9][a-z0-9_-]{0,59}$/;
const balance = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 100000;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

/** Whitelists fields so a request body, answer, name or free text cannot enter telemetry. */
export function prepareEconomyEvent(account: string, environment: EconomyEnvironment, input: EconomyEventInput, now = new Date()): StoredEconomyEvent {
  if (!/^[a-f0-9]{64}$/.test(account) || !["production", "preview", "local"].includes(environment)
    || !input || typeof input !== "object" || !uuid.test(input.eventId)
    || !Number.isFinite(now.getTime())) throw new Error("invalid-economy-event");
  const base: StoredEconomyEvent = {
    schemaVersion: 1, environment, account,
    eventKey: hash(`${account}:${input.kind}:${input.eventId}`),
    createdAt: now.toISOString(), kind: input.kind, offerId: null, offerVersion: null,
  };
  if (input.kind === "preview" || input.kind === "goal" || input.kind === "purchase") {
    if (input.kind === "goal" && input.offerId === null) {
      if (!balance(input.coins)) throw new Error("invalid-economy-event");
      return { ...base, coins: input.coins };
    }
    const offer = getExpeditionOffer(input.offerId ?? "");
    if (!offer) throw new Error("invalid-economy-event");
    const common = { ...base, offerId: offer.id, offerVersion: offer.offerVersion };
    if (input.kind === "preview") return common;
    if (input.kind === "goal") {
      if (!balance(input.coins)) throw new Error("invalid-economy-event");
      return { ...common, coins: input.coins };
    }
    if (!version.test(input.offerVersion) || !balance(input.pricePaid) || !balance(input.coinsAfter))
      throw new Error("invalid-economy-event");
    return { ...common, offerVersion: input.offerVersion, pricePaid: input.pricePaid, coinsAfter: input.coinsAfter };
  }
  if (input.kind === "episode_start" || input.kind === "episode_finish"
    || input.kind === "recall" || input.kind === "satisfaction") {
    const offer = getOfferForEpisode(input.episodeId);
    if (!offer || !expeditionFamilies.includes(input.family as typeof expeditionFamilies[number])
      || !uuid.test(input.sessionId)) throw new Error("invalid-economy-event");
    const common = { ...base, offerId: offer.id, offerVersion: offer.offerVersion,
      episodeId: input.episodeId, family: input.family as typeof expeditionFamilies[number],
      sessionKey: hash(`${account}:session:${input.sessionId}`) };
    if (input.kind === "episode_start") return common;
    if (input.kind === "episode_finish") {
      if (typeof input.independent !== "boolean") throw new Error("invalid-economy-event");
      return { ...common, independent: input.independent };
    }
    if (input.kind === "recall") {
      if (typeof input.correct !== "boolean" || typeof input.confirmed !== "boolean")
        throw new Error("invalid-economy-event");
      return { ...common, correct: input.correct, confirmed: input.confirmed };
    }
    if (input.value !== "yes" && input.value !== "no") throw new Error("invalid-economy-event");
    return { ...common, value: input.value };
  }
  throw new Error("invalid-economy-event");
}

export function economyEventPath(event: StoredEconomyEvent) {
  return `economy-v1/${event.environment}/${event.createdAt.slice(0, 7)}/${event.account}/${event.eventKey}.json`;
}
