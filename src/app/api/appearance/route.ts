import { NextRequest, NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/bounded-json";
import { readSession, sameOrigin, SESSION_COOKIE } from "@/lib/auth-session";
import { isAppearancePreference } from "@/lib/appearance-shared";
import { loadAppearance, persistAppearance } from "@/lib/appearance-store";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  try {
    return NextResponse.json(await loadAppearance(user.id), { headers });
  } catch {
    return NextResponse.json(
      { error: "appearance-unavailable" },
      { status: 503, headers },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "origin" }, { status: 403, headers });
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  let body: Record<string, unknown>;
  try { body = await readBoundedJson(request, 512); }
  catch { return NextResponse.json({ error: "invalid-appearance" }, { status: 400, headers }); }
  try {
    if (!isAppearancePreference(body))
      return NextResponse.json(
        { error: "invalid-appearance" },
        { status: 400, headers },
      );
    const preference = { palette: body.palette, mode: body.mode };
    const storage = await persistAppearance(user.id, preference);
    return NextResponse.json({ preference, storage }, { headers });
  } catch {
    return NextResponse.json(
      { error: "appearance-unavailable" },
      { status: 503, headers },
    );
  }
}
