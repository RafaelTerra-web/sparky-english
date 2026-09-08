import { onboardingAssets } from "@/lib/onboarding-assets";
import { onboardingDB } from "@/lib/onboarding-store";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ asset: string }> },
) {
  const { asset } = await params;
  const id = asset.endsWith(".wav") ? asset.slice(0, -4) : "";
  if (!Object.hasOwn(onboardingAssets, id))
    return new Response(null, { status: 404 });
  try {
    const audio = await onboardingDB()
      .storage.from("sparky-personal-audio")
      .download(`fixed-v1/${id}.wav`);
    if (audio.error) return new Response(null, { status: 404 });
    return new Response(audio.data, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
