import type { StoredEconomyEvent } from "./economy-event-schema";

const eventKinds = new Set(["preview", "goal", "purchase", "episode_start", "episode_finish", "recall", "satisfaction"]);
const hex64 = /^[a-f0-9]{64}$/;

function storedEvent(value: unknown): value is StoredEconomyEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<StoredEconomyEvent>;
  const common = event.schemaVersion === 1 && hex64.test(event.account ?? "")
    && hex64.test(event.eventKey ?? "") && eventKinds.has(event.kind ?? "")
    && typeof event.createdAt === "string" && Number.isFinite(Date.parse(event.createdAt))
    && (event.environment === "production" || event.environment === "preview" || event.environment === "local")
    && (event.offerId === null || typeof event.offerId === "string");
  if (!common) return false;
  if (event.kind === "goal") return Number.isSafeInteger(event.coins) && event.coins! >= 0;
  if (event.kind === "purchase") return typeof event.offerId === "string"
    && Number.isSafeInteger(event.pricePaid) && event.pricePaid! >= 0
    && Number.isSafeInteger(event.coinsAfter) && event.coinsAfter! >= 0;
  if (event.kind === "episode_start" || event.kind === "episode_finish"
    || event.kind === "recall" || event.kind === "satisfaction") {
    if (typeof event.offerId !== "string" || typeof event.episodeId !== "string"
      || !["A1-A2", "B1-B2", "C1-C2"].includes(event.family ?? "")
      || !hex64.test(event.sessionKey ?? "")) return false;
    if (event.kind === "episode_finish") return typeof event.independent === "boolean";
    if (event.kind === "recall") return typeof event.correct === "boolean" && typeof event.confirmed === "boolean";
    if (event.kind === "satisfaction") return event.value === "yes" || event.value === "no";
  }
  return event.kind === "preview" ? typeof event.offerId === "string" : true;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarize(events: StoredEconomyEvent[], minimumAccounts: number) {
  const accounts = new Set(events.map(event => event.account));
  if (accounts.size < minimumAccounts) return { suppressed: true, participants: `<${minimumAccounts}` };
  const byKind = (kind: StoredEconomyEvent["kind"]) => events.filter(event => event.kind === kind);
  const previews = byKind("preview");
  const goals = byKind("goal");
  const purchases = byKind("purchase");
  const starts = byKind("episode_start");
  const finishes = byKind("episode_finish");
  const recalls = byKind("recall");
  const ratings = byKind("satisfaction");
  const previewAccounts = new Set(previews.map(event => event.account));
  const previewBuyers = new Set(purchases.filter(purchase => previews.some(preview =>
    preview.account === purchase.account && preview.offerId === purchase.offerId
    && Date.parse(preview.createdAt) <= Date.parse(purchase.createdAt))).map(event => event.account));
  const purchaseAccounts = new Set(purchases.map(event => event.account));
  const startsBySession = new Set(starts.map(event => event.sessionKey).filter(Boolean));
  const finishesBySession = new Set(finishes.map(event => event.sessionKey).filter(Boolean));
  const completedStarts = [...startsBySession].filter(key => finishesBySession.has(key)).length;
  const goalToPurchaseDays: number[] = [];
  for (const purchase of purchases) {
    const chosen = goals.filter(event => event.account === purchase.account && event.offerId === purchase.offerId
      && Date.parse(event.createdAt) <= Date.parse(purchase.createdAt)).at(-1);
    if (chosen) goalToPurchaseDays.push((Date.parse(purchase.createdAt) - Date.parse(chosen.createdAt)) / 86400000);
  }
  const nextGoalAccounts = new Set(purchases.filter(purchase => goals.some(goal => goal.account === purchase.account
    && goal.offerId !== null && Date.parse(goal.createdAt) > Date.parse(purchase.createdAt))).map(event => event.account));
  const yes = ratings.filter(event => event.value === "yes").length;
  const rated = ratings.filter(event => event.value === "yes" || event.value === "no").length;
  const recallAnswered = recalls.filter(event => typeof event.correct === "boolean");
  return {
    suppressed: false, participants: accounts.size,
    previews: previews.length, previewAccounts: previewAccounts.size,
    goalsChosen: goals.filter(event => event.offerId !== null).length,
    goalsCleared: goals.filter(event => event.offerId === null).length,
    purchases: purchases.length, purchaseAccounts: purchaseAccounts.size,
    previewToPurchaseAccounts: previewBuyers.size,
    previewToPurchaseRate: previewAccounts.size ? previewBuyers.size / previewAccounts.size : null,
    coinsSpent: purchases.reduce((sum, event) => sum + (Number.isSafeInteger(event.pricePaid) ? event.pricePaid! : 0), 0),
    medianPaidCoins: median(purchases.map(event => event.pricePaid).filter((value): value is number => Number.isSafeInteger(value))),
    medianCoinsAfterPurchase: median(purchases.map(event => event.coinsAfter).filter((value): value is number => Number.isSafeInteger(value))),
    medianGoalToPurchaseDays: median(goalToPurchaseDays),
    nextGoalAccounts: nextGoalAccounts.size,
    episodeStarts: startsBySession.size, episodeFinishes: finishesBySession.size,
    observedStartToFinishRate: startsBySession.size ? completedStarts / startsBySession.size : null,
    independentFinishes: finishes.filter(event => event.independent === true).length,
    recallAttempts: recallAnswered.length,
    recallCorrectRate: recallAnswered.length ? recallAnswered.filter(event => event.correct).length / recallAnswered.length : null,
    recallConfirmed: recallAnswered.filter(event => event.confirmed).length,
    satisfactionResponses: rated,
    satisfactionPositiveRate: rated ? yes / rated : null,
  };
}

/** Anonymous aggregates only; no account or session identifiers leave this function. */
export function economyPilotReport(values: unknown[], from: Date, to: Date, minimumAccounts = 5) {
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from >= to
    || !Number.isSafeInteger(minimumAccounts) || minimumAccounts < 1) throw new Error("invalid-report-window");
  const seen = new Set<string>();
  const events = values.filter(storedEvent).filter(event => {
    const time = Date.parse(event.createdAt);
    if (time < from.getTime() || time >= to.getTime() || seen.has(event.eventKey)) return false;
    seen.add(event.eventKey);
    return true;
  }).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const offers = [...new Set(events.map(event => event.offerId).filter((id): id is string => typeof id === "string"))].sort();
  const families = ["A1-A2", "B1-B2", "C1-C2"] as const;
  return {
    schemaVersion: 1, window: { from: from.toISOString(), to: to.toISOString() },
    validEvents: events.length, ignoredEvents: values.length - events.length,
    overall: summarize(events, minimumAccounts),
    byOffer: Object.fromEntries(offers.map(id => [id, summarize(events.filter(event => event.offerId === id), minimumAccounts)])),
    byFamily: Object.fromEntries(families.map(family => [family, summarize(events.filter(event => event.family === family), minimumAccounts)])),
  };
}
