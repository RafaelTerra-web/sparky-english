import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { eltisAudioScripts } from "@/lib/eltis-bank";
import { generateMascotAudio } from "@/lib/gemini-voice";
import { onboardingDB } from "@/lib/onboarding-store";

export const maxDuration = 60;
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response(null, { status: 401 });
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!Object.hasOwn(eltisAudioScripts, id)) return new Response(null, { status: 400 });
  try {
    const script = eltisAudioScripts[id as keyof typeof eltisAudioScripts];
    const mascot = request.nextUrl.searchParams.get("mascot") === "pinky" ? "pinky" : "sparky";
    const path = `eltis-v2/${id}-${mascot}.wav`;
    const storage = onboardingDB().storage.from("sparky-personal-audio");
    const cached = await storage.download(path);
    let data = cached.data ? Buffer.from(await cached.data.arrayBuffer()) : null;
    if (!data) {
      data = await generateMascotAudio(script, mascot, "en-US");
      const upload = await storage.upload(path, data, { contentType: "audio/wav", upsert: false });
      if (upload.error) throw upload.error;
    }
    return NextResponse.json({ id, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex"), scriptHash: createHash("sha256").update(script).digest("hex") }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("ELTiS audio preparation failed:", cause instanceof Error ? cause.message : "unknown error");
    return NextResponse.json({ error: "Falha ao preparar áudio." }, { status: 503 });
  }
}
