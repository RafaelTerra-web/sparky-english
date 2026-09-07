// Administrative generation only. No endpoint accepts arbitrary text or incurs runtime TTS costs.
// Usage: node scripts/generate-voices.mjs [--generate] [--limit=20]
// OPENAI_API_KEY stays in the process environment. Dry-run is the default.
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, access, rename } from "node:fs/promises";
import { lessons } from "../src/lib/curriculum.ts";
import { voiceProfiles, ttsModel } from "../src/lib/voice-config.ts";
const root = new URL("../", import.meta.url);
const folder = new URL("public/audio/mascots/", root);
const manifestPath = new URL("src/lib/content/voice-manifest.json", root);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const generate = process.argv.includes("--generate");
const limitArg = process.argv.find(arg => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 20;
if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) throw new Error("limit must be between 1 and 1000");
const concurrencyArg = process.argv.find(arg => arg.startsWith("--concurrency="));
const concurrency = concurrencyArg ? Number(concurrencyArg.split("=")[1]) : 2;
if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error("concurrency must be between 1 and 4");
const pending = [];
for (const lesson of lessons) {
  const text = lesson.steps.find(step => step.kind === "example")?.english;
  if (!text || text.length > 4096) throw new Error("Missing or oversized published example: " + lesson.id);
  if (manifest[lesson.id]?.text !== text) manifest[lesson.id] = { text };
  for (const [mascot, profile] of Object.entries(voiceProfiles)) {
    const hash = createHash("sha256").update(JSON.stringify({ model: ttsModel, text, ...profile })).digest("hex").slice(0, 32);
    const url = "/audio/mascots/" + hash + ".mp3";
    const file = new URL(hash + ".mp3", folder);
    try { await access(file); manifest[lesson.id][mascot] = url; }
    catch { pending.push({ lessonId: lesson.id, text, mascot, profile, file, url }); }
  }
}
const batch = pending.slice(0, limit);
const words = batch.reduce((sum, item) => sum + item.text.split(/\s+/).length, 0);
console.log(JSON.stringify({ pending: pending.length, selected: batch.length, estimatedMinutesAt140Wpm: +(words / 140).toFixed(2), mode: generate ? "generate" : "dry-run" }));
if (!generate) process.exit(0);
if (!process.env.OPENAI_API_KEY) throw new Error("Configure OPENAI_API_KEY securely before generating.");
await mkdir(folder, { recursive: true });
let saveQueue = Promise.resolve();
function saveManifest() {
  // Serialize durable writes so concurrent responses cannot overwrite newer entries.
  saveQueue = saveQueue.then(async () => {
    const temporary = new URL("voice-manifest.json.tmp", manifestPath);
    await writeFile(temporary, JSON.stringify(manifest, null, 2) + "\n");
    await rename(temporary, manifestPath);
  });
  return saveQueue;
}
async function generateItem(item) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST", signal: AbortSignal.timeout(60000),
    headers: { authorization: "Bearer " + process.env.OPENAI_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: ttsModel, input: item.text, voice: item.profile.voice, instructions: item.profile.instructions, response_format: "mp3" }),
  });
  if (!response.ok) throw new Error("TTS failed (HTTP " + response.status + "). No provider response or secret logged.");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 256 || bytes.length > 4 * 1024 * 1024 || !response.headers.get("content-type")?.startsWith("audio/"))
    throw new Error("Invalid TTS audio response");
  const temporary = new URL(item.file.href + ".tmp");
  await writeFile(temporary, bytes);
  await rename(temporary, item.file);
  manifest[item.lessonId][item.mascot] = item.url;
  // Save after every successful file: interrupted runs resume without regenerating it.
  await saveManifest();
  console.log("Generated " + item.lessonId + " / " + item.mascot);
}
let next = 0, failure;
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (!failure && next < batch.length) {
    const item = batch[next++];
    try { await generateItem(item); }
    catch (error) { failure ??= error; }
  }
}));
if (failure) throw failure;
await saveManifest();
console.log("Review audio samples, then commit audio files and manifest together.");
