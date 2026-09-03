import { NextResponse } from "next/server";

export function GET(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  return NextResponse.json({ authenticated: /(?:^|;\s*)sparky_access=1(?:;|$)/.test(cookie) });
}
