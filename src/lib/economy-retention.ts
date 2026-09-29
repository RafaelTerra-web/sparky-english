import "server-only";
import { del, list } from "@vercel/blob";
import type { EconomyEnvironment } from "./economy-event-schema";

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const LIST_LIMIT = 1000;
const DELETE_BATCH_SIZE = 100;

type RetentionBlob = { pathname: string; uploadedAt: Date };
type RetentionPage = { blobs: RetentionBlob[]; hasMore: boolean; cursor?: string };
export type EconomyRetentionStore = {
  list(options: { prefix: string; limit: number; cursor?: string; abortSignal?: AbortSignal }): Promise<RetentionPage>;
  del(pathnames: string[], options?: { abortSignal?: AbortSignal }): Promise<void>;
};
export type EconomyRetentionResult = {
  scanned: number;
  expired: number;
  deleted: number;
  failed: number;
  complete: boolean;
};

const blobStore: EconomyRetentionStore = {
  list: options => list(options),
  del: (pathnames, options) => del(pathnames, options),
};

/** Removes only expired telemetry objects, returning aggregate counts without account or event IDs. */
export async function pruneEconomyEvents(
  { environment, now = new Date(), signal = AbortSignal.timeout(45_000) }: {
    environment: EconomyEnvironment; now?: Date; signal?: AbortSignal;
  },
  store: EconomyRetentionStore = blobStore,
): Promise<EconomyRetentionResult> {
  if (!["production", "preview", "local"].includes(environment) || !Number.isFinite(now.getTime())) {
    throw new Error("invalid-economy-retention");
  }
  const prefix = `economy-v1/${environment}/`;
  const eventPath = new RegExp(`^${prefix}[0-9]{4}-(?:0[1-9]|1[0-2])/[a-f0-9]{64}/[a-f0-9]{64}\\.json$`);
  const cutoff = now.getTime() - RETENTION_MS;
  const result: EconomyRetentionResult = { scanned: 0, expired: 0, deleted: 0, failed: 0, complete: false };
  const seenPaths = new Set<string>();
  const seenCursors = new Set<string>();
  const expired: string[] = [];
  let cursor: string | undefined;
  do {
    if (signal.aborted) break;
    let page: RetentionPage;
    try { page = await store.list({ prefix, limit: LIST_LIMIT, cursor, abortSignal: signal }); }
    catch { break; }
    result.scanned += page.blobs.length;
    const candidates = page.blobs.filter(blob => {
      if (!eventPath.test(blob.pathname) || seenPaths.has(blob.pathname)
        || !(blob.uploadedAt instanceof Date) || !Number.isFinite(blob.uploadedAt.getTime())
        || blob.uploadedAt.getTime() >= cutoff) return false;
      seenPaths.add(blob.pathname);
      return true;
    }).map(blob => blob.pathname);
    expired.push(...candidates);
    result.expired += candidates.length;
    if (!page.hasMore) {
      result.complete = true;
      break;
    }
    if (!page.cursor || seenCursors.has(page.cursor)) break;
    seenCursors.add(page.cursor);
    cursor = page.cursor;
  } while (cursor);
  // Finish enumeration before deletion: removals cannot shift a continuation cursor.
  for (let index = 0; index < expired.length; index += DELETE_BATCH_SIZE) {
    if (signal.aborted) { result.complete = false; break; }
    const batch = expired.slice(index, index + DELETE_BATCH_SIZE);
    try { await store.del(batch, { abortSignal: signal }); result.deleted += batch.length; }
    catch { result.failed += batch.length; }
  }
  return result;
}
