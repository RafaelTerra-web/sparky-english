import { eltisAudioScripts } from "@/lib/eltis-bank";
import { onboardingDB } from "@/lib/onboarding-store";

export async function GET(_request: Request, { params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params;
  const id = asset.endsWith(".wav") ? asset.slice(0, -4) : "";
  if (!Object.hasOwn(eltisAudioScripts, id)) return new Response(null, { status: 404 });
  try {
    const audio = await onboardingDB().storage.from("sparky-personal-audio").download(`eltis-v1/${asset}`);
    if (audio.error) return new Response(null, { status: 404 });
    return new Response(audio.data, { headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response(null, { status: 503 });
  }
}
