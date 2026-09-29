import "server-only";
import { put } from "@vercel/blob";
import { accountKey } from "./onboarding-store";
import { economyEventPath, prepareEconomyEvent, type EconomyEnvironment, type EconomyEventInput } from "./economy-event-schema";

/** Best-effort, private pilot telemetry. Call only after the authenticated mutation succeeds. */
export async function recordEconomyEvent(userId: string, event: EconomyEventInput): Promise<boolean> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return false;
  try {
    const environment: EconomyEnvironment = process.env.VERCEL_ENV === "production" ? "production"
      : process.env.VERCEL_ENV === "preview" ? "preview" : "local";
    const saved = prepareEconomyEvent(accountKey(userId), environment, event);
    await put(economyEventPath(saved), JSON.stringify(saved), {
      access: "private", addRandomSuffix: false, allowOverwrite: false,
      contentType: "application/json", cacheControlMaxAge: 60,
    });
    return true;
  } catch (error) {
    // A retry of a successful mutation may try to write the same event again.
    return error instanceof Error && /already exists/i.test(error.message);
  }
}
