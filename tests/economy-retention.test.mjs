import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL?.endsWith("/economy-retention.ts")) {
    if (specifier === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
    if (specifier === "@vercel/blob") return {
      url: "data:text/javascript,export const list=(options)=>globalThis.__economyRetentionBlob.list(options);export const del=(paths,options)=>globalThis.__economyRetentionBlob.del(paths,options)",
      shortCircuit: true,
    };
  }
  if (context.parentURL?.endsWith("/api/onboarding/cleanup/route.ts")) {
    if (specifier === "next/server") return {
      url: "data:text/javascript,export class NextRequest extends Request{};export const NextResponse={json:(data,options)=>Response.json(data,options)}",
      shortCircuit: true,
    };
    if (specifier === "@/lib/onboarding-store") return {
      url: "data:text/javascript,export const onboardingDB=()=>globalThis.__economyRetentionOnboarding()", shortCircuit: true,
    };
    if (specifier === "@/lib/economy-retention") return nextResolve("../../../../lib/economy-retention.ts", context);
  }
  return nextResolve(specifier, context);
} });

const { pruneEconomyEvents } = await import("../src/lib/economy-retention.ts");
const { GET } = await import("../src/app/api/onboarding/cleanup/route.ts");
const now = new Date("2026-09-29T04:00:00.000Z");
const cutoff = now.getTime() - 90 * 86400000;
const account = "a".repeat(64);
const path = (index, environment = "production", month = "2026-06") =>
  `economy-v1/${environment}/${month}/${account}/${index.toString(16).padStart(64, "0")}.json`;
const blob = (index, time = cutoff - 1, environment = "production") => ({ pathname: path(index, environment), uploadedAt: new Date(time) });
const emptyResult = { scanned: 0, expired: 0, deleted: 0, failed: 0, complete: false };

test("retention uses the exact 90-day cutoff and only complete Economy event paths", async () => {
  const oldest = blob(1);
  const candidates = [oldest, blob(2, cutoff), blob(3, cutoff + 1), blob(4, now.getTime() + 1),
    blob(5, cutoff - 1, "preview"), blob(6, cutoff - 1, "local"),
    { ...blob(7), pathname: path(7).replace("economy-v1/production/", "economy-v1/production-other/") },
    { ...blob(8), pathname: path(8).replace("economy-v1/", "economy-v10/") },
    { ...blob(9), pathname: path(9).replace("2026-06", "2026-13") },
    { ...blob(10), pathname: `${path(10)}/extra` },
    { ...blob(11), pathname: path(11).replace(".json", ".txt") },
    { ...blob(12), pathname: "economy-v1/production/receipts.json" },
    { ...blob(13), pathname: `economy-v1/production/../${path(13)}` },
    { ...blob(14), uploadedAt: new Date("invalid") },
    { ...blob(15), uploadedAt: "2020-01-01" },
  ];
  const batches = [];
  const result = await pruneEconomyEvents({ environment: "production", now }, {
    async list(options) {
      assert.equal(options.prefix, "economy-v1/production/");
      assert.equal(options.limit, 1000);
      return { blobs: candidates, hasMore: false };
    },
    async del(paths) { batches.push(paths); },
  });
  assert.deepEqual(batches, [[oldest.pathname]]);
  assert.deepEqual(result, { scanned: candidates.length, expired: 1, deleted: 1, failed: 0, complete: true });
  assert.equal(JSON.stringify(result).includes(account), false);
});

test("retention enumerates every page before deletion, deduplicates paths and deletes bounded batches", async () => {
  const candidates = Array.from({ length: 205 }, (_, index) => blob(index));
  const pages = [
    { blobs: candidates.slice(0, 100), hasMore: true, cursor: "second" },
    { blobs: [...candidates.slice(100, 200), candidates[0]], hasMore: true, cursor: "third" },
    { blobs: candidates.slice(200), hasMore: false },
  ];
  const cursors = [];
  const batches = [];
  const result = await pruneEconomyEvents({ environment: "production", now }, {
    async list(options) {
      assert.equal(batches.length, 0, "deletion must not shift an unfinished pagination cursor");
      cursors.push(options.cursor);
      return pages[cursors.length - 1];
    },
    async del(paths) { batches.push(paths); },
  });
  assert.deepEqual(cursors, [undefined, "second", "third"]);
  assert.deepEqual(batches.map(batch => batch.length), [100, 100, 5]);
  assert.deepEqual(batches.flat(), candidates.map(candidate => candidate.pathname));
  assert.deepEqual(result, { scanned: 206, expired: 205, deleted: 205, failed: 0, complete: true });
});

test("a failed deletion batch is reported without claiming success or leaking its error", async () => {
  let calls = 0;
  const result = await pruneEconomyEvents({ environment: "production", now }, {
    async list() { return { blobs: Array.from({ length: 205 }, (_, index) => blob(index)), hasMore: false }; },
    async del() { if (++calls === 2) throw new Error(`private storage failure ${account}`); },
  });
  assert.equal(calls, 3);
  assert.deepEqual(result, { scanned: 205, expired: 205, deleted: 105, failed: 100, complete: true });
  assert.equal(JSON.stringify(result).includes(account), false);
});

test("listing failure, missing cursors, repeated cursors and cancellation cannot report a complete scan", async () => {
  const failed = await pruneEconomyEvents({ environment: "production", now }, {
    async list() { throw new Error("unavailable"); }, async del() { assert.fail("nothing was listed"); },
  });
  assert.deepEqual(failed, emptyResult);
  for (const cursor of [undefined, "repeated"]) {
    let reads = 0;
    const result = await pruneEconomyEvents({ environment: "production", now }, {
      async list() { reads++; return { blobs: [], hasMore: true, cursor }; }, async del() { assert.fail("no expired objects"); },
    });
    assert.equal(reads, cursor ? 2 : 1);
    assert.equal(result.complete, false);
  }
  const cancelled = await pruneEconomyEvents({ environment: "production", now, signal: AbortSignal.abort() }, {
    async list() { assert.fail("cancelled before scanning"); }, async del() { assert.fail("cancelled before deletion"); },
  });
  assert.deepEqual(cancelled, emptyResult);
});

test("invalid environments and clocks are rejected before accessing Blob", async () => {
  const store = { async list() { assert.fail("invalid scope"); }, async del() { assert.fail("invalid scope"); } };
  await assert.rejects(pruneEconomyEvents({ environment: "production/../", now }, store), /invalid-economy-retention/);
  await assert.rejects(pruneEconomyEvents({ environment: "production", now: new Date("invalid") }, store), /invalid-economy-retention/);
});

function database({ rowsError = false, sessionsError = false } = {}) {
  return { from(table) { return {
    select() { return this; }, delete() { return this; }, eq() { return this; }, lt() { return this; }, limit() { return this; },
    then(resolve, reject) { return Promise.resolve({ data: [], error: table === "sparky_name_audio" ? rowsError : sessionsError }).then(resolve, reject); },
  }; } };
}
function cronRequest(authorized = true) {
  return new Request("https://fixture.invalid/api/onboarding/cleanup", {
    headers: authorized ? { authorization: "Bearer fixture-cron" } : {},
  });
}

test("cleanup rejects unauthenticated requests and preserves the non-production onboarding response", async () => {
  process.env.CRON_SECRET = "fixture-cron";
  process.env.VERCEL_ENV = "preview";
  globalThis.__economyRetentionBlob = { async list() { assert.fail("no production Blob calls"); }, async del() { assert.fail("no production deletion"); } };
  globalThis.__economyRetentionOnboarding = () => database();
  assert.equal((await GET(cronRequest(false))).status, 401);
  const response = await GET(cronRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { deleted: 0, ok: true });
  globalThis.__economyRetentionOnboarding = () => database({ rowsError: true });
  const unavailable = await GET(cronRequest());
  assert.equal(unavailable.status, 503);
  assert.equal(await unavailable.text(), "");
});

test("production cleanup removes only production events even if onboarding is unavailable", async () => {
  process.env.CRON_SECRET = "fixture-cron";
  process.env.VERCEL_ENV = "production";
  const old = Date.now() - 91 * 86400000;
  const batches = [];
  globalThis.__economyRetentionBlob = {
    async list(options) {
      assert.equal(options.prefix, "economy-v1/production/");
      return { blobs: [blob(1, old), blob(2, old, "preview"), blob(3, old, "local")], hasMore: false };
    },
    async del(paths) { batches.push(paths); },
  };
  globalThis.__economyRetentionOnboarding = () => { throw new Error(`private account ${account}`); };
  const response = await GET(cronRequest());
  assert.equal(response.status, 503);
  assert.deepEqual(batches, [[path(1)]]);
  const result = await response.json();
  assert.deepEqual(result, {
    deleted: 0, economy: { scanned: 3, expired: 1, deleted: 1, failed: 0, complete: true }, ok: false,
  });
  assert.equal(JSON.stringify(result).includes(account), false);
});

test("production cleanup returns 503 when Blob cannot complete retention", async () => {
  process.env.CRON_SECRET = "fixture-cron";
  process.env.VERCEL_ENV = "production";
  globalThis.__economyRetentionBlob = { async list() { throw new Error("missing token"); }, async del() { assert.fail("nothing was listed"); } };
  globalThis.__economyRetentionOnboarding = () => database();
  const response = await GET(cronRequest());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { deleted: 0, economy: emptyResult, ok: false });
});
