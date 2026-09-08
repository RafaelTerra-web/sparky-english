import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { onboardingAssets } from "@/lib/onboarding-assets";
import { onboardingDB } from "@/lib/onboarding-store";
import { generateSparkyAudio, sparkyGeminiVoice } from "@/lib/gemini-voice";
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return new Response(null, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const refresh = new URL(request.url).searchParams.get('refresh') === '1';
  if (!Object.hasOwn(onboardingAssets, id))
    return new Response(null, { status: 400 });
  try {
    const storage = onboardingDB().storage.from("sparky-personal-audio"),
      path = `fixed-v1/${id}.wav`;
    const cached = await storage.download(path);
    const data = cached.data && !refresh
      ? Buffer.from(await cached.data.arrayBuffer())
      : await generateSparkyAudio(onboardingAssets[id], id.startsWith('qa-name-'), id.startsWith('placement-')?'en-US':'pt-BR');
    if (!cached.data || refresh) {
      const upload = await storage.upload(path, data, {
        contentType: "audio/wav",
        upsert: refresh,
      });
      if (upload.error) throw upload.error;
    }
    return NextResponse.json(
      {
        id,
        ...sparkyGeminiVoice,
        sha256: createHash("sha256").update(data).digest("hex"),
        bytes: data.length,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "storage-unavailable";
    return NextResponse.json(
      { error: message.replace(/AIza[\w-]+/g, "[redacted]").slice(0, 200) },
      { status: 503 },
    );
  }
}
