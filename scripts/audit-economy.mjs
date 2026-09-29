import { get, list } from "@vercel/blob";
import { economyPilotReport } from "../src/lib/economy-report.ts";

// Read-only administrator report. The Blob token must remain in the local admin environment.
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Set BLOB_READ_WRITE_TOKEN in the local admin environment.");

const options = Object.fromEntries(process.argv.slice(2).map(argument => {
  const match = /^--(from|to|environment)=(.+)$/.exec(argument);
  if (!match) throw new Error(`Unknown option: ${argument}`);
  return [match[1], match[2]];
}));
const date = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Use YYYY-MM-DD for dates.");
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error("Invalid date.");
  return parsed;
};
const to = options.to ? date(options.to) : new Date();
const from = options.from ? date(options.from) : new Date(to.getTime() - 30 * 86400000);
if (from >= to) throw new Error("The report start must precede its end.");
const environment = options.environment ?? "production";
if (!["production", "preview", "local"].includes(environment)) throw new Error("Invalid environment.");

const months = [];
for (let month = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1)); month < to;
  month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))) {
  months.push(month.toISOString().slice(0, 7));
}

const events = [];
for (const month of months) {
  let cursor;
  do {
    const page = await list({ prefix: `economy-v1/${environment}/${month}/`, limit: 1000, cursor });
    for (const blob of page.blobs) {
      if (blob.uploadedAt < from || blob.uploadedAt >= to) continue;
      const result = await get(blob.pathname, { access: "private" });
      if (!result || result.statusCode !== 200) continue;
      const chunks = [];
      let bytes = 0;
      for await (const chunk of result.stream) {
        const buffer = Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > 8192) break;
        chunks.push(buffer);
      }
      if (bytes > 8192) continue;
      try {
        const event = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (event?.environment === environment) events.push(event);
      }
      catch { /* A corrupt operational event is excluded from aggregates. */ }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
console.log(JSON.stringify(economyPilotReport(events, from, to), null, 2));
