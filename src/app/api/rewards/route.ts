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
  completeStudy,
  equipCosmetic,
  normalizeRewardState,
  publicRewardState,
  selectMascot,
} from "@/lib/rewards";
import {
  type CosmeticSlot,
  type MascotId,
} from "@/lib/rewards-shared";
import type { RewardState } from "@/lib/rewards";

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
  return { store, user, name, state: normalizeRewardState(payload?.state) };
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
  const value = await context();
  if (!value)
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  return NextResponse.json(publicRewardState(value.state), {
    headers: { "cache-control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "origin" }, { status: 403 });
  const value = await context();
  if (!value)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }
  let state = value.state;
  let earned = 0;
  let spent = 0;
  let reason = "updated";
  try {
    if (body.action === "complete") {
      if (typeof body.lessonId !== "string" || typeof body.review !== "boolean")
        throw new Error("invalid-request");
      const result = completeStudy(state, body.lessonId, body.review);
      state = result.state;
      earned = result.earned;
      reason = result.reason;
    } else if (body.action === "buy") {
      if (typeof body.itemId !== "string") throw new Error("invalid-request");
      const result = buyCosmetic(state, body.itemId);
      state = result.state;
      spent = result.spent;
      reason = result.alreadyOwned ? "already-owned" : "purchased";
    } else if (body.action === "select-mascot") {
      if (body.mascot !== "sparky" && body.mascot !== "pinky")
        throw new Error("invalid-request");
      state = selectMascot(state, body.mascot);
    } else if (body.action === "equip") {
      if (
        (body.mascot !== "sparky" && body.mascot !== "pinky") ||
        !["head", "neck", "body"].includes(String(body.slot)) ||
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
  await persistForUser(value.store, value.name, value.user.id, state);
  return NextResponse.json(
    { ...publicRewardState(state), earned, spent, reason },
    { headers: { "cache-control": "private, no-store" } },
  );
}
