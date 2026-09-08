import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE, sameOrigin } from "@/lib/auth-session";
import {
  accountKey,
  onboardingDB,
  loadOnboarding,
  nameHash,
} from "@/lib/onboarding-store";
import { validateName } from "@/lib/onboarding-shared";
import { generateSparkyAudio } from "@/lib/gemini-voice";
export const maxDuration = 40;
const headers = { "Cache-Control": "private, no-store" };
async function identity(request: NextRequest) {
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  return user ? accountKey(user.id) : null;
}
export async function GET(request: NextRequest) {
  const key = await identity(request);
  if (!key) return new Response(null, { status: 401, headers });
  try {
    const { profile, session } = await loadOnboarding(key);
    const name = session?.data.name ?? profile?.name;
    if (!name) return new Response(null, { status: 404, headers });
    const db = onboardingDB(),
      hash = nameHash(name);
    const row = await db
      .from("sparky_name_audio")
      .select("*")
      .eq("account_key", key)
      .eq("hash", hash)
      .maybeSingle();
    if (
      row.error ||
      row.data?.status !== "ready" ||
      (row.data.expires_at && Date.parse(row.data.expires_at) < Date.now())
    )
      return new Response(null, { status: 404, headers });
    const file = await db.storage
      .from("sparky-personal-audio")
      .download(row.data.path);
    if (file.error) throw file.error;
    return new Response(file.data, {
      headers: {
        ...headers,
        "Content-Type": "audio/wav",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
export async function POST(request: NextRequest) {
  if (process.env.SPARKY_ONBOARDING_ENABLED !== "true")
    return new Response(null, { status: 503, headers });
  if (!sameOrigin(request)) return new Response(null, { status: 403, headers });
  const key = await identity(request);
  if (!key) return new Response(null, { status: 401, headers });
  try {
    const db = onboardingDB(),
      loaded = await loadOnboarding(key);
    const name = validateName(
      loaded.session?.data.name ?? loaded.profile?.name,
    ).name;
    const hash = nameHash(name),
      path = `${key}/${hash}.wav`;
    let row = (
      await db
        .from("sparky_name_audio")
        .select("*")
        .eq("account_key", key)
        .eq("hash", hash)
        .maybeSingle()
    ).data;
    if (
      row?.status === "ready" &&
      (!row.expires_at || Date.parse(row.expires_at) > Date.now())
    )
      return NextResponse.json({ ready: true }, { headers });
    if (
      row?.status === "generating" &&
      Date.now() - Date.parse(row.updated_at) < 45000
    )
      return NextResponse.json({ pending: true }, { status: 202, headers });
    if (row && row.attempts >= 2)
      return NextResponse.json(
        {
          error: "Use a saudação em texto. Você pode tentar novamente amanhã.",
        },
        { status: 429, headers },
      );
    const slot = await db.rpc("sparky_take_name_audio_slot", {
      p_account: key,
    });
    if (slot.error || !slot.data)
      return NextResponse.json(
        { error: "Limite temporário de voz. Continue pelo texto." },
        { status: 429, headers },
      );
    if (row) {
      const claim = await db
        .from("sparky_name_audio")
        .update({
          status: "generating",
          attempts: row.attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("account_key", key)
        .eq("hash", hash)
        .eq("updated_at", row.updated_at)
        .select("*")
        .maybeSingle();
      if (claim.error || !claim.data)
        return NextResponse.json({ pending: true }, { status: 202, headers });
      row = claim.data;
    } else {
      const claim = await db
        .from("sparky_name_audio")
        .insert({ account_key: key, hash, path, status: "generating" });
      if (claim.error)
        return NextResponse.json({ pending: true }, { status: 202, headers });
    }
    try {
      const audio = await generateSparkyAudio(name, true);
      const current = await loadOnboarding(key);
      if ((current.session?.data.name ?? current.profile?.name) !== name)
        throw new Error("Nome alterado.");
      const uploaded = await db.storage
        .from("sparky-personal-audio")
        .upload(path, audio, { contentType: "audio/wav", upsert: true });
      if (uploaded.error) throw uploaded.error;
      const stillCurrent = await loadOnboarding(key);
      if (
        (stillCurrent.session?.data.name ?? stillCurrent.profile?.name) !== name
      ) {
        await db.storage.from("sparky-personal-audio").remove([path]);
        throw new Error("Nome alterado.");
      }
      const saved = await db
        .from("sparky_name_audio")
        .update({
          status: "ready",
          expires_at:
            !stillCurrent.session && stillCurrent.profile?.onboardingCompleted
              ? null
              : new Date(Date.now() + 86400000).toISOString(),
        })
        .eq("account_key", key)
        .eq("hash", hash)
        .select("hash");
      if (saved.error || !saved.data?.length) {
        await db.storage.from("sparky-personal-audio").remove([path]);
        throw new Error("Sessão encerrada.");
      }
      return NextResponse.json({ ready: true }, { headers });
    } catch {
      await db
        .from("sparky_name_audio")
        .update({ status: "failed" })
        .eq("account_key", key)
        .eq("hash", hash);
      return NextResponse.json(
        {
          error:
            "A voz não ficou pronta. Continue normalmente e tente novamente.",
        },
        { status: 503, headers },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Voz indisponível." },
      { status: 503, headers },
    );
  }
}
