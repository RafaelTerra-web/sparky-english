import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  cookieOptions,
  readSession,
  sameOrigin,
  seal,
  unseal,
} from "@/lib/auth-session";
import {
  buyCosmetic,
  checkIn,
  completeStudy,
  equipCosmetic,
  equipNotebookTheme,
  normalizeRewardState,
  publicRewardState,
  resetLook,
  selectMascot,
} from "@/lib/rewards";
import {
  cosmeticCatalog,
  cosmeticSlots,
  type CosmeticSlot,
  type MascotId,
} from "@/lib/rewards-shared";
import type { RewardState } from "@/lib/rewards";
import { verifyCompletion, type StudyReceipt } from "@/lib/study";
import { loadRewards, persistRewards } from "@/lib/reward-store";

const YEAR = 60 * 60 * 24 * 365;
function cookieName(userId: string) {
  const suffix = createHash("sha256").update(userId).digest("hex").slice(0, 12);
  return `${process.env.NODE_ENV === "production" ? "__Host-" : ""}sparky_rewards_${suffix}`;
}
async function context() {
  const store = await cookies();
  const user = await readSession(store.get(SESSION_COOKIE)?.value);
  if (!user) return null;
  const name = cookieName(user.id);
  const payload = await unseal(store.get(name)?.value, `rewards:${user.id}`);
  const persisted = await loadRewards(user.id, normalizeRewardState(payload?.state));
  return { store, user, name, ...persisted };
}
async function persistForUser(
  store: Awaited<ReturnType<typeof cookies>>,
  name: string,
  userId: string,
  state: RewardState,
) {
  const token = await seal({ state }, `rewards:${userId}`, YEAR);
  store.set(name, token, { ...cookieOptions, maxAge: YEAR, priority: "high" });
}

export async function GET() {
  let value;
  try { value = await context(); }
  catch { return NextResponse.json({ error: "progress-unavailable" }, { status: 503, headers: { "cache-control": "private, no-store" } }); }
  if (!value)
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  return NextResponse.json({ ...publicRewardState(value.state), storage: value.storage }, {
    headers: { "cache-control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "origin" }, { status: 403 });
  let value;
  try { value = await context(); }
  catch { return NextResponse.json({ error: "progress-unavailable" }, { status: 503 }); }
  if (!value)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 12000) throw new Error("invalid-request");
    body = JSON.parse(text);
    if (!body || Array.isArray(body)) throw new Error("invalid-request");
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }
  let state = value.state;
  let earned = 0;
  let spent = 0;
  let reason = "updated";
  let streakAdvanced = false;
  let streakMilestone = false;
  let shouldPersist = true;
  try {
    if (body.action === "check-in") {
      const result = checkIn(state, new Date());
      state = result.state;
      earned = result.earned;
      streakAdvanced = result.advanced;
      streakMilestone = result.milestone;
      shouldPersist = result.advanced;
      reason = result.milestone ? "streak-milestone" : result.advanced ? "streak" : "already-checked-in";
    } else if (body.action === "complete") {
      if (typeof body.lessonId !== "string" || typeof body.review !== "boolean")
        throw new Error("invalid-request");
      if (typeof body.receipt !== "string") throw new Error("study-incomplete");
      const proof = await unseal(body.receipt, `study:${value.user.id}`);
      const quality = verifyCompletion(proof?.study as StudyReceipt | null, body.lessonId, body.review);
      const result = completeStudy(state, body.lessonId, body.review, new Date(), quality.independent);
      state = result.state;
      earned = result.earned;
      reason = result.reason;
    } else if (body.action === "buy") {
      if (typeof body.itemId !== "string") throw new Error("invalid-request");
      const result = buyCosmetic(state, body.itemId);
      state = result.state;
      spent = result.spent;
      reason = result.alreadyOwned ? "already-owned" : "purchased";
    } else if (body.action === "buy-and-equip") {
      if ((body.mascot !== "sparky" && body.mascot !== "pinky") || typeof body.itemId !== "string")
        throw new Error("invalid-request");
      const purchase = buyCosmetic(state, body.itemId);
      const item = cosmeticCatalog.find((entry) => entry.id === body.itemId);
      if (!item) throw new Error("item-not-found");
      state = equipCosmetic(purchase.state, body.mascot as MascotId, item.slot, item.id);
      spent = purchase.spent;
      reason = purchase.alreadyOwned ? "equipped" : "purchased-and-equipped";
    } else if (body.action === "notebook-theme") {
      if (typeof body.itemId !== "string" && body.itemId !== null) throw new Error("invalid-request");
      state = equipNotebookTheme(state, body.itemId as string | null);
    } else if (body.action === "select-mascot") {
      if (body.mascot !== "sparky" && body.mascot !== "pinky")
        throw new Error("invalid-request");
      state = selectMascot(state, body.mascot);
    } else if (body.action === "reset-look") {
      if (body.mascot !== "sparky" && body.mascot !== "pinky")
        throw new Error("invalid-request");
      state = resetLook(state, body.mascot);
    } else if (body.action === "equip") {
      if (
        (body.mascot !== "sparky" && body.mascot !== "pinky") ||
        !cosmeticSlots.includes(body.slot as CosmeticSlot) ||
        (typeof body.itemId !== "string" && body.itemId !== null)
      )
        throw new Error("invalid-request");
      state = equipCosmetic(
        state,
        body.mascot as MascotId,
        body.slot as CosmeticSlot,
        body.itemId as string | null,
      );
    } else throw new Error("invalid-action");
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid-request";
    const status = code === "insufficient-coins" ? 409 : 400;
    return NextResponse.json({ error: code }, { status });
  }
  try {
    if (shouldPersist) {
      await persistRewards(value.user.id, state, value.revision);
      if (value.storage === "browser") await persistForUser(value.store, value.name, value.user.id, state);
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "progress-unavailable";
    return NextResponse.json({ error: code }, { status: code === "progress-conflict" ? 409 : 503 });
  }
  return NextResponse.json(
    { ...publicRewardState(state), earned, spent, reason, streakAdvanced, streakMilestone, storage: value.storage },
    { headers: { "cache-control": "private, no-store" } },
  );
}
