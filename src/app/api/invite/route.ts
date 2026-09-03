import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const configuredCode = process.env.SPARKY_INVITE_CODE;
  const configuredHash = process.env.SPARKY_INVITE_CODE_SHA256;
  const expectedCode = configuredCode || (process.env.NODE_ENV === "development" ? "SPARKY-START" : "");

  if (!expectedCode && !configuredHash) return NextResponse.json({ error: "Invite access is not configured" }, { status: 503 });
  const codeHash = createHash("sha256").update(code).digest("hex");
  const valid = configuredHash ? codeHash === configuredHash : code === expectedCode;
  if (!code || code.length > 96 || !valid) return NextResponse.json({ error: "Invalid invite" }, { status: 401 });

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set("sparky_access", "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
