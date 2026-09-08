import { NextRequest, NextResponse } from "next/server";
import { onboardingDB } from "@/lib/onboarding-store";
export async function GET(request: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return new Response(null, { status: 401 });
  const db = onboardingDB(),
    now = new Date().toISOString();
  const rows = await db
    .from("sparky_name_audio")
    .select("account_key,hash,path")
    .lt("expires_at", now)
    .limit(500);
  if (rows.error) return new Response(null, { status: 503 });
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
  return NextResponse.json(
    { deleted, ok: !sessions.error },
    {
      status: sessions.error ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
