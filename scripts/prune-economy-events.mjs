import { del, list } from "@vercel/blob";

// Explicit admin operation. Default is a dry run; no raw event is deleted without --execute.
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Set BLOB_READ_WRITE_TOKEN in the local admin environment.");
const args = new Map(process.argv.slice(2).map(argument => {
  if (argument === "--execute") return ["execute", "true"];
  const match = /^--(before|environment)=(.+)$/.exec(argument);
  if (!match) throw new Error(`Unknown option: ${argument}`);
  return [match[1], match[2]];
}));
const beforeValue = args.get("before");
if (!beforeValue || !/^\d{4}-\d{2}-\d{2}$/.test(beforeValue)) throw new Error("Pass --before=YYYY-MM-DD.");
const before = new Date(`${beforeValue}T00:00:00.000Z`);
if (Number.isNaN(before.getTime()) || before.toISOString().slice(0, 10) !== beforeValue
  || before.getTime() > Date.now() - 90 * 86400000) throw new Error("Invalid or too recent cutoff; keep at least 90 days.");
const environment = args.get("environment");
if (!environment || !["production", "preview", "local"].includes(environment))
  throw new Error("Pass --environment=production|preview|local.");
const prefix = `economy-v1/${environment}/`;
let count = 0;
let cursor;
do {
  const page = await list({ prefix, limit: 1000, cursor });
  const expired = page.blobs.filter(blob => blob.pathname.startsWith(prefix)
    && blob.uploadedAt.getTime() < before.getTime());
  count += expired.length;
  if (args.get("execute") === "true") {
    for (const blob of expired) await del(blob.pathname);
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
console.log(JSON.stringify({ environment, before: before.toISOString(), expired: count,
  deleted: args.get("execute") === "true" ? count : 0, dryRun: args.get("execute") !== "true" }));
