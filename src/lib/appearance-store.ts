import "server-only";

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { AppearancePreference } from "./appearance-shared";

function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (process.env.SPARKY_DURABLE_PROGRESS !== "true") return null;
  if (!url || !key) throw new Error("appearance-unavailable");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const accountKey = (id: string) =>
  createHash("sha256").update(`google:${id}`).digest("hex");

export async function loadAppearance(userId: string) {
  const db = database();
  if (!db) return { preference: null, storage: "browser" as const };
  const result = await db
    .from("sparky_appearance_preferences")
    .select("palette,mode")
    .eq("account_key", accountKey(userId))
    .maybeSingle();
  if (result.error) throw new Error("appearance-unavailable");
  return {
    preference: result.data
      ? ({ palette: result.data.palette, mode: result.data.mode } as AppearancePreference)
      : null,
    storage: "account" as const,
  };
}

export async function persistAppearance(
  userId: string,
  preference: AppearancePreference,
) {
  const db = database();
  if (!db) return "browser" as const;
  const result = await db.from("sparky_appearance_preferences").upsert(
    {
      account_key: accountKey(userId),
      palette: preference.palette,
      mode: preference.mode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_key" },
  );
  if (result.error) throw new Error("appearance-unavailable");
  return "account" as const;
}
