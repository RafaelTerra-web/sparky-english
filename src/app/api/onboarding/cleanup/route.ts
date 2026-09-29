import { NextRequest, NextResponse } from "next/server";
import { onboardingDB } from "@/lib/onboarding-store";
import { pruneEconomyEvents, type EconomyRetentionResult } from "@/lib/economy-retention";

async function cleanupOnboarding(now: string) {
  const db = onboardingDB();
  const rows = await db
    .from("sparky_name_audio")
    .select("account_key,hash,path")
    .lt("expires_at", now)
    .limit(500);
  if (rows.error) return null;
  let deleted = 0;
  for (const row of rows.data ?? []) {
    const removed = await db.storage
      .from("sparky-personal-audio")
      .remove([row.path]);
    if (removed.error) continue;
    const result = await db
      .from("sparky_name_audio")
      .delete()
      .eq("account_key", row.account_key)
      .eq("hash", row.hash)
      .lt("expires_at", now);
    if (!result.error) deleted++;
  }
  const sessions = await db
    .from("sparky_onboarding_sessions")
    .delete()
    .lt("expires_at", now);
  return { deleted, ok: !sessions.error };
}

export async function GET(request: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return new Response(null, { status: 401 });
  const now = new Date();
  if (process.env.VERCEL_ENV !== "production") {
    const onboarding = await cleanupOnboarding(now.toISOString());
    if (!onboarding) return new Response(null, { status: 503 });
    return NextResponse.json(onboarding, {
      status: onboarding.ok ? 200 : 503, headers: { "Cache-Control": "no-store" },
    });
  }
  let economy: EconomyRetentionResult = { scanned: 0, expired: 0, deleted: 0, failed: 0, complete: false };
  try { economy = await pruneEconomyEvents({ environment: "production", now }); }
  catch { /* Only aggregate failure status leaves this authenticated route. */ }
  // Blob retention still runs when the onboarding database is unavailable.
  let onboarding = { deleted: 0, ok: false };
  try { onboarding = await cleanupOnboarding(now.toISOString()) ?? onboarding; }
  catch { /* The cron reports failure without exposing storage or account details. */ }
  const ok = onboarding.ok && economy.complete && economy.failed === 0;
  return NextResponse.json(
    { deleted: onboarding.deleted, economy, ok },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
