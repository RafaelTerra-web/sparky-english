import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { normalizeRewardState, type RewardState } from "./rewards";

function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (process.env.SPARKY_DURABLE_PROGRESS !== "true") return null;
  if (!url || !key) throw new Error("progress-unavailable");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
const identity = (sub: string) => createHash("sha256").update(`google:${sub}`).digest("hex");
export async function loadRewards(userId: string, legacy: RewardState) {
  const db = database();
  if (!db) return { state: legacy, revision: null, storage: "browser" as const };
  const key = identity(userId);
  const query = () => db.from("sparky_account_progress").select("state, revision").eq("account_key", key).maybeSingle();
  let result = await query();
  if (result.error) throw new Error("progress-unavailable");
  if (!result.data) {
    const inserted = await db.from("sparky_account_progress").insert({ account_key: key, state: legacy });
    if (inserted.error && inserted.error.code !== "23505") throw new Error("progress-unavailable");
    result = await query();
  }
  if (result.error || !result.data) throw new Error("progress-unavailable");
  return { state: normalizeRewardState(result.data.state), revision: result.data.revision as number, storage: "account" as const };
}
export async function persistRewards(userId: string, state: RewardState, revision: number | null) {
  if (revision === null) return;
  const db = database();
  if (!db) throw new Error("progress-unavailable");
  const result = await db.from("sparky_account_progress").update({ state, revision: revision + 1, updated_at: new Date().toISOString() })
    .eq("account_key", identity(userId)).eq("revision", revision).select("revision").maybeSingle();
  if (result.error) throw new Error("progress-unavailable");
  if (!result.data) throw new Error("progress-conflict");
}
