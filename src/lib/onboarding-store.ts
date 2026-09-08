import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { LearnerProfile, OnboardingStep } from "./onboarding-shared";
import type { PlacementState } from "./placement";
export type OnboardingDraft = Partial<LearnerProfile> & {
  step: OnboardingStep;
  placement?: PlacementState;
  consentVersion?: string;
};
export function onboardingDB() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    throw new Error("Banco indisponível. Tente novamente.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export const accountKey = (id: string) =>
  createHash("sha256").update(`google:${id}`).digest("hex");
export const nameHash = (name: string) =>
  createHash("sha256")
    .update(`gemini-3.1-flash-tts-preview:Achird:v1:${name}`)
    .digest("hex");
export async function loadOnboarding(key: string) {
  const db = onboardingDB();
  const [profile, session] = await Promise.all([
    db
      .from("sparky_learner_profiles")
      .select("data")
      .eq("account_key", key)
      .maybeSingle(),
    db
      .from("sparky_onboarding_sessions")
      .select("*")
      .eq("account_key", key)
      .maybeSingle(),
  ]);
  if (profile.error || session.error)
    throw new Error("Não foi possível carregar seu perfil. Tente novamente.");
  return {
    profile: (profile.data?.data as LearnerProfile | null) ?? null,
    session: session.data as {
      data: OnboardingDraft;
      revision: number;
      expires_at: string;
    } | null,
  };
}
export async function ensureDraft(key: string, profile: LearnerProfile | null) {
  const db = onboardingDB();
  const insert = await db
    .from("sparky_onboarding_sessions")
    .insert({
      account_key: key,
      data: { ...profile, onboardingCompleted: false, step: "welcome" },
    });
  if (insert.error && insert.error.code !== "23505")
    throw new Error("Não foi possível iniciar a personalização.");
  return (await loadOnboarding(key)).session!;
}
export async function saveDraft(
  key: string,
  data: OnboardingDraft,
  revision: number,
) {
  const result = await onboardingDB()
    .from("sparky_onboarding_sessions")
    .update({
      data,
      revision: revision + 1,
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    })
    .eq("account_key", key)
    .eq("revision", revision)
    .select("revision")
    .maybeSingle();
  if (result.error)
    throw new Error("Não foi possível salvar. Tente novamente.");
  if (!result.data) throw new Error("conflict");
}
export async function deleteNameAudio(key: string, except?: string) {
  const db = onboardingDB();
  let query = db
    .from("sparky_name_audio")
    .select("path,hash")
    .eq("account_key", key);
  if (except) query = query.neq("hash", except);
  const rows = await query;
  if (rows.error) throw new Error("Falha ao apagar áudio.");
  for (const row of rows.data ?? []) {
    const removed = await db.storage
      .from("sparky-personal-audio")
      .remove([row.path]);
    if (removed.error) throw new Error("Falha ao apagar áudio.");
    const deleted = await db
      .from("sparky_name_audio")
      .delete()
      .eq("account_key", key)
      .eq("hash", row.hash);
    if (deleted.error) throw new Error("Falha ao apagar áudio.");
  }
}
