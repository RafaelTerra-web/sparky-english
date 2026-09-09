import { createHash, timingSafeEqual } from "node:crypto";
import { lessons } from "@/lib/curriculum";
import { lessonVoiceIdentity, lessonSpeechDelivery } from "@/lib/lesson-voice-config";
import { generateMascotAudio } from "@/lib/gemini-voice";
import { onboardingDB } from "@/lib/onboarding-store";

export const maxDuration = 90;

/** Administrative, fixed curriculum only. Learner requests never trigger this job. */
export async function POST(request: Request) {
  const secret = process.env.SPARKY_AUDIO_ADMIN_TOKEN;
  const expected = secret ? `Bearer ${secret}` : "";
  const supplied = request.headers.get("authorization") ?? "";
  if (!expected || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return new Response(null, { status: 401 });
  const query = new URL(request.url).searchParams;
  // Only use refresh during editorial preparation, before publishing a hash URL.
  const refresh = query.get("refresh") === "1";
  const lesson = lessons.find(item => item.id === query.get("lesson"));
  const mascot = query.get("mascot");
  if (!lesson || (mascot !== "sparky" && mascot !== "pinky")) return new Response(null, { status: 400 });
  const text = lesson.steps.find(step => step.kind === "example")?.english;
  if (!text) return new Response(null, { status: 400 });
  const hash = createHash("sha256").update(JSON.stringify(lessonVoiceIdentity(text, mascot, lesson.level))).digest("hex").slice(0, 32);
  try {
    const storage = onboardingDB().storage.from("sparky-personal-audio");
    const path = `curriculum-v2/${hash}.wav`;
    const cached = await storage.download(path);
    if (cached.error && !["404", "400"].includes(String((cached.error as { statusCode?: string }).statusCode)))
      return Response.json({ error: "audio-storage-unavailable" }, { status: 503 });
    let data: Buffer;
    if (cached.data && !refresh) data = Buffer.from(await cached.data.arrayBuffer());
    else {
      data = await generateMascotAudio(text, mascot, "en-US", false, undefined, lessonSpeechDelivery(text, mascot, lesson.level));
      const saved = await storage.upload(path, data, { contentType: "audio/wav", upsert: refresh });
      if (saved.error) {
        // Concurrent jobs converge on the first durable file, never overwrite it.
        const winner = await storage.download(path);
        if (!winner.data) throw new Error("storage");
        data = Buffer.from(await winner.data.arrayBuffer());
      }
    }
    return new Response(new Uint8Array(data), { headers: {
      "Content-Type": "audio/wav", "Cache-Control": "no-store",
      "X-Audio-Identity": hash, "X-Audio-Sha256": createHash("sha256").update(data).digest("hex"),
    } });
  } catch (error) {
    // Diagnostic category only: never return provider messages, script or keys.
    const message = error instanceof Error ? error.message : "";
    const category = message.match(/^Gemini (\d{3})/)?.[0] ?? message.match(/^Gemini audio (?:missing|format): [a-zA-Z0-9/;_-]+$/)?.[0] ??
      (message === "Formato de áudio inesperado." ? "unexpected-format" :
        message === "Áudio sem fala." ? "silent-audio" :
          message === "storage" ? "storage-write" :
            error instanceof DOMException ? "timeout" : "generation");
    return Response.json({ error: "lesson-audio-generation-unavailable", category }, { status: 503 });
  }
}
