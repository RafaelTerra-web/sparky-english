import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, readSession, sameOrigin, unseal } from "@/lib/auth-session";
import { expeditionWorlds, getExpeditionEpisode } from "@/lib/expeditions-content";
import { publicExpeditionEpisode, publicExpeditionQuestion } from "@/lib/expeditions-public";
import { expeditionFamilies, expeditionOffers, getExpeditionOffer, getOfferForEpisode, type ExpeditionFamily } from "@/lib/expeditions-catalog";
import { recordEconomyEvent } from "@/lib/economy-events";
import type { EconomyEventInput } from "@/lib/economy-event-schema";
import { loadRewards, persistRewards } from "@/lib/reward-store";
import { buyExpedition, normalizeRewardState, ownsExpedition, setExpeditionGoal, type RewardState } from "@/lib/rewards";
import {
  answerExpeditionQuestion, chooseExpeditionRoute, expeditionCompetence,
  finishExpeditionSession, getExpeditionSession, reviewExpeditionQuestion,
  startExpeditionSession, rateExpedition,
} from "@/lib/expeditions-progress";

export const runtime = "nodejs";
const privateHeaders = { "cache-control": "private, no-store" };
const enabled = () => process.env.SPARKY_ECONOMY_ENABLED === "true";
type Loaded = Awaited<ReturnType<typeof loadRewards>>;

function errorResponse(code: string) {
  const status = code === "insufficient-coins" || code === "progress-conflict" || code === "offer-changed"
    || code === "previous-episode-required" || code === "review-not-due" ? 409
    : code === "expedition-not-owned" ? 403
    : code === "economy-account-required" || code === "progress-unavailable" ? 503
    : 400;
  return NextResponse.json({ error: code }, { status, headers: privateHeaders });
}

function publicSession(session: RewardState["expeditionSessions"][number]) {
  const episode = getExpeditionEpisode(session.episodeId, session.family);
  return {
    episodeId: session.episodeId, family: session.family,
    title: episode?.title ?? null,
    descriptor: session.completedAt ? episode?.canDo.descriptor ?? null : null,
    decisionId: session.decisionId, applicationCorrect: session.applicationCorrect,
    transferCorrect: session.transferCorrect, completedAt: session.completedAt,
    reviewDueAt: session.reviewDueAt, reviewConfirmedAt: session.reviewConfirmedAt,
    competence: expeditionCompetence(session), satisfaction: session.satisfaction,
  };
}

function economyState(state: RewardState, storage: Loaded["storage"]) {
  const now = Date.now();
  const offers = expeditionOffers.map(catalog => {
    const world = expeditionWorlds.find(entry => entry.id === catalog.id);
    if (!world || catalog.price !== world.price || catalog.offerVersion !== world.contentVersion
      || JSON.stringify(catalog.episodeIds) !== JSON.stringify(world.episodeIds)
      || JSON.stringify(catalog.title) !== JSON.stringify(world.title)
      || JSON.stringify(catalog.description) !== JSON.stringify(world.promise)
      || JSON.stringify(catalog.preview) !== JSON.stringify(world.preview)
      || JSON.stringify(catalog.souvenir) !== JSON.stringify(world.souvenir)
      || JSON.stringify(catalog.characters) !== JSON.stringify(world.characters))
      throw new Error("catalog-mismatch");
    return catalog;
  });
  const owned = offers.filter(offer => ownsExpedition(state, offer.id)).map(offer => offer.id);
  const dueReviews = state.expeditionSessions.filter(session =>
    session.completedAt && !session.reviewConfirmedAt && session.reviewDueAt
    && Date.parse(session.reviewDueAt) <= now,
  ).map(session => {
    const episode = getExpeditionEpisode(session.episodeId, session.family);
    return { episodeId: session.episodeId, family: session.family, title: episode?.title ?? null };
  });
  return {
    enabled: true, storage, coins: state.coins, goalId: state.expeditionGoalId,
    offers, owned, receipts: state.expeditionReceipts,
    progress: state.expeditionSessions.map(publicSession), dueReviews,
  };
}

async function context() {
  const store = await cookies();
  const user = await readSession(store.get(SESSION_COOKIE)?.value);
  if (!user) return null;
  const suffix = createHash("sha256").update(user.id).digest("hex").slice(0, 12);
  const name = `${process.env.NODE_ENV === "production" ? "__Host-" : ""}sparky_rewards_${suffix}`;
  const payload = await unseal(store.get(name)?.value, `rewards:${user.id}`);
  const loaded = await loadRewards(user.id, normalizeRewardState(payload?.state));
  return { user, loaded };
}

export async function GET() {
  if (!enabled()) return NextResponse.json({ enabled: false, offers: [] }, { headers: privateHeaders });
  try {
    const value = await context();
    if (!value) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateHeaders });
    return NextResponse.json(economyState(value.loaded.state, value.loaded.storage), { headers: privateHeaders });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "progress-unavailable");
  }
}

async function parseBody(request: Request) {
  const text = await request.text();
  if (text.length > 12000) throw new Error("invalid-request");
  let body: unknown;
  try { body = JSON.parse(text); } catch { throw new Error("invalid-json"); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid-request");
  return body as Record<string, unknown>;
}

function episodeFromRequest(id: unknown, family: unknown) {
  if (typeof id !== "string" || !getOfferForEpisode(id)
    || typeof family !== "string" || !expeditionFamilies.includes(family as ExpeditionFamily)) throw new Error("episode-not-found");
  const episode = getExpeditionEpisode(id, family as ExpeditionFamily);
  if (!episode) throw new Error("episode-not-found");
  return episode;
}

function sessionEpisode(state: RewardState, sessionId: unknown) {
  if (typeof sessionId !== "string") throw new Error("session-not-found");
  const session = getExpeditionSession(state, sessionId);
  if (!session) throw new Error("session-not-found");
  return episodeFromRequest(session.episodeId, session.family);
}

export async function POST(request: Request) {
  if (!enabled()) return NextResponse.json({ error: "economy-disabled" }, { status: 404, headers: privateHeaders });
  if (!sameOrigin(request)) return NextResponse.json({ error: "origin" }, { status: 403, headers: privateHeaders });
  try {
    const body = await parseBody(request);
    const value = await context();
    if (!value) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateHeaders });
    if (body.action === "preview") {
      if (typeof body.itemId !== "string" || !getExpeditionOffer(body.itemId)) throw new Error("item-not-found");
      await recordEconomyEvent(value.user.id, { eventId: randomUUID(), kind: "preview", offerId: body.itemId });
      return NextResponse.json({ previewed: body.itemId }, { headers: privateHeaders });
    }
    if (value.loaded.storage !== "account") throw new Error("economy-account-required");
    let loaded = value.loaded;
    for (let attempt = 0; attempt < 4; attempt++) {
      const state = loaded.state;
      let next = state;
      let changed = false;
      let result: Record<string, unknown> = {};
      let event: EconomyEventInput | null = null;
      if (body.action === "goal") {
        if (body.itemId !== null && typeof body.itemId !== "string") throw new Error("invalid-request");
        next = setExpeditionGoal(state, body.itemId);
        changed = next.expeditionGoalId !== state.expeditionGoalId;
        result = { goalId: next.expeditionGoalId };
        event = { eventId: randomUUID(), kind: "goal", offerId: next.expeditionGoalId, coins: next.coins };
      } else if (body.action === "buy") {
        if (typeof body.itemId !== "string" || typeof body.offerVersion !== "string") throw new Error("invalid-request");
        const purchase = buyExpedition(state, body.itemId, body.offerVersion, randomUUID());
        next = purchase.state;
        changed = !purchase.alreadyOwned;
        result = { spent: purchase.spent, alreadyOwned: purchase.alreadyOwned, receipt: purchase.receipt };
        if (purchase.receipt) event = { eventId: purchase.receipt.receiptId, kind: "purchase",
          offerId: purchase.receipt.itemId, offerVersion: purchase.receipt.offerVersion,
          pricePaid: purchase.receipt.price, coinsAfter: next.coins };
      } else if (body.action === "start") {
        const episode = episodeFromRequest(body.episodeId, body.family);
        const offer = getOfferForEpisode(episode.id)!;
        const position = offer.episodeIds.indexOf(episode.id);
        if (position > 0 && !state.expeditionSessions.some(session =>
          session.episodeId === offer.episodeIds[position - 1] && session.family === episode.family && session.completedAt))
          throw new Error("previous-episode-required");
        const started = startExpeditionSession(state, episode.id, episode.family, randomUUID());
        next = started.state;
        changed = started.created;
        result = { sessionId: started.session.sessionId, episode: publicExpeditionEpisode(episode),
          decisionConsequence: episode.decision.options.find(option => option.id === started.session.decisionId)?.consequence ?? null,
          progress: publicSession(started.session) };
        event = { eventId: started.session.sessionId, kind: "episode_start",
          episodeId: episode.id, family: episode.family, sessionId: started.session.sessionId };
      } else if (body.action === "decision") {
        const episode = sessionEpisode(state, body.sessionId);
        if (typeof body.optionId !== "string") throw new Error("invalid-choice");
        const chosen = chooseExpeditionRoute(state, body.sessionId as string, episode, body.optionId);
        next = chosen.state;
        changed = chosen.changed;
        result = { consequence: chosen.option.consequence, progress: publicSession(chosen.session) };
      } else if (body.action === "answer") {
        const episode = sessionEpisode(state, body.sessionId);
        if (typeof body.questionId !== "string") throw new Error("question-not-found");
        const answered = answerExpeditionQuestion(state, body.sessionId as string, episode, body.questionId, body.answer);
        next = answered.state;
        changed = answered.changed;
        result = { correct: answered.correct, feedback: answered.feedback, expected: answered.expected, progress: publicSession(answered.session) };
      } else if (body.action === "finish") {
        const episode = sessionEpisode(state, body.sessionId);
        const finished = finishExpeditionSession(state, body.sessionId as string, episode);
        next = finished.state;
        changed = finished.changed;
        const offer = getExpeditionOffer(episode.offerId)!;
        result = { reveal: episode.reveal, consequence: episode.consequence,
          routePayoff: episode.decision.options.find(option => option.id === finished.session.decisionId)?.consequence ?? null,
          souvenir: expeditionWorlds.find(world => world.id === offer.id)?.souvenir ?? offer.title,
          reviewDueAt: finished.session.reviewDueAt, progress: publicSession(finished.session) };
        event = { eventId: finished.session.sessionId, kind: "episode_finish", episodeId: episode.id,
          family: episode.family, sessionId: finished.session.sessionId, independent: finished.session.independent };
      } else if (body.action === "review-start") {
        const episode = episodeFromRequest(body.episodeId, body.family);
        const session = state.expeditionSessions.find(entry => entry.episodeId === episode.id && entry.family === episode.family);
        if (!session?.completedAt || !session.reviewDueAt || Date.parse(session.reviewDueAt) > Date.now()) throw new Error("review-not-due");
        if (!ownsExpedition(state, episode.offerId)) throw new Error("expedition-not-owned");
        result = { question: publicExpeditionQuestion(episode.recall), progress: publicSession(session) };
      } else if (body.action === "review") {
        const episode = episodeFromRequest(body.episodeId, body.family);
        const reviewed = reviewExpeditionQuestion(state, episode, body.answer);
        next = reviewed.state;
        changed = reviewed.changed;
        result = { correct: reviewed.correct, confirmed: reviewed.confirmed, feedback: reviewed.feedback,
          expected: reviewed.correct ? null : episode.recall.answerId, progress: publicSession(reviewed.session) };
        event = { eventId: randomUUID(), kind: "recall", episodeId: episode.id,
          family: episode.family, sessionId: reviewed.session.sessionId,
          correct: reviewed.correct, confirmed: reviewed.confirmed };
      } else if (body.action === "rate") {
        if (typeof body.sessionId !== "string" || (body.value !== "yes" && body.value !== "no")) throw new Error("invalid-request");
        const rated = rateExpedition(state, body.sessionId, body.value);
        next = rated.state;
        changed = rated.changed;
        result = { rated: rated.session.satisfaction, progress: publicSession(rated.session) };
        event = { eventId: rated.session.sessionId, kind: "satisfaction", episodeId: rated.session.episodeId,
          family: rated.session.family, sessionId: rated.session.sessionId, value: body.value };
      } else throw new Error("invalid-action");

      if (changed) {
        try { await persistRewards(value.user.id, next, loaded.revision); }
        catch (error) {
          if (error instanceof Error && error.message === "progress-conflict" && attempt < 3) {
            const reloaded = await loadRewards(value.user.id, state);
            if (reloaded.storage !== "account") throw new Error("economy-account-required");
            loaded = reloaded;
            continue;
          }
          throw error;
        }
        if (event) await recordEconomyEvent(value.user.id, event);
      }
      return NextResponse.json({ ...economyState(next, loaded.storage), ...result }, { headers: privateHeaders });
    }
    throw new Error("progress-conflict");
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "progress-unavailable");
  }
}
