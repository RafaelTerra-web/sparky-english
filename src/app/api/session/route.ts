import { NextRequest, NextResponse } from "next/server";
import {
  CHALLENGE_COOKIE,
  SESSION_COOKIE,
  cookieOptions,
  googleConfigured,
  readSession,
  sameOrigin,
} from "@/lib/auth-session";

const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: NextRequest) {
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json(
    {
      authenticated: Boolean(user),
      user,
      googleConfigured: googleConfigured(),
    },
    { headers },
  );
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origem inválida." },
      { status: 403, headers },
    );
  const response = NextResponse.json({ authenticated: false }, { headers });
  for (const name of [SESSION_COOKIE, CHALLENGE_COOKIE, "sparky_access"])
    response.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
