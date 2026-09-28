import { engagementReport } from "../src/lib/engagement-report.ts";
import { list, get } from '@vercel/blob';
// Read-only report. The credential stays in the admin environment.
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Set BLOB_READ_WRITE_TOKEN in the local admin environment.');
const events = [];
let cursor;
const since = Date.now() - 30 * 86400000;
do {
  const page = await list({ prefix: 'learning-v1/production/', limit: 1000, cursor });
  for (const blob of page.blobs.filter(item => item.uploadedAt.getTime() >= since)) {
    const result = await get(blob.pathname, { access: 'private' });
    if (!result || result.statusCode !== 200) continue;
    let text = ''; for await (const chunk of result.stream) text += Buffer.from(chunk).toString();
    try { events.push(JSON.parse(text)); } catch { /* Skip a corrupt operational snapshot. */ }
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
console.log(JSON.stringify(engagementReport(events), null, 2));
