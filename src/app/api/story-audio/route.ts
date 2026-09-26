import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth-session";
import { generateMascotAudio } from "@/lib/gemini-voice";
import { onboardingDB } from "@/lib/onboarding-store";
import { missingPostcardScenes } from "@/lib/story-content";
import { voiceProfiles } from "@/lib/voice-config";

export const maxDuration = 90;

export async function GET(request: NextRequest) {
  if (!await readSession(request.cookies.get(SESSION_COOKIE)?.value)) return new Response(null, { status: 401 });
  const query = request.nextUrl.searchParams;
  const sceneId = query.get("scene") ?? "";
  const mascot = query.get("mascot");
  if (!/^[0-3]$/.test(sceneId) || (mascot !== "sparky" && mascot !== "pinky")) return new Response(null, { status: 400 });
  const scene = missingPostcardScenes[Number(sceneId)];
  if (!scene) return new Response(null, { status: 404 });

  const profile = voiceProfiles[mascot];
  const identity = createHash("sha256").update(JSON.stringify({ story: "missing-postcard-v1", scene: sceneId, text: scene.text, model: profile.model, voice: profile.voice, version: 1 })).digest("hex").slice(0, 32);
  const path = `stories-v1/${identity}.wav`;
  try {
    const storage = onboardingDB().storage.from("sparky-personal-audio");
    const cached = await storage.download(path);
    const missing = cached.error && ["404", "400"].includes(String((cached.error as { statusCode?: string }).statusCode));
    if (cached.error && !missing) return new Response(null, { status: 503 });
    let audio: Buffer;
    if (cached.data) audio = Buffer.from(await cached.data.arrayBuffer());
    else {
      audio = await generateMascotAudio(scene.text, mascot, "en-US", false, undefined, "Read this short story scene with warmth, clear phrase boundaries, and a natural conversational pace.");
      const uploaded = await storage.upload(path, audio, { contentType: "audio/wav", upsert: false });
      if (uploaded.error) {
        const winner = await storage.download(path);
        if (!winner.data) return new Response(null, { status: 503 });
        audio = Buffer.from(await winner.data.arrayBuffer());
      }
    }
    return new Response(new Uint8Array(audio), { headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Audio-Identity": identity,
      "X-Audio-Model": profile.model,
    } });
  } catch {
    return new Response(null, { status: 503 });
  }
}
