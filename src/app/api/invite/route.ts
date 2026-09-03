import { NextResponse } from "next/server";
// Admission now requires the verified Google identity; shared codes do not authenticate users.
export async function POST() {
  return NextResponse.json(
    { error: "Use a conta Google vinculada ao seu convite." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
