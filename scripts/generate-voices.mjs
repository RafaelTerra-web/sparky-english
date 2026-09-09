import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { lessonVoiceIdentity, lessonSpeechDelivery } from "../src/lib/lesson-voice-config.ts";
// Administrative generation only. No endpoint accepts arbitrary text or incurs runtime TTS costs.
// Usage: node scripts/generate-voices.mjs [--generate] [--limit=20]
// GEMINI_API_KEY stays in the process environment. Dry-run is the default.
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, access, rename, unlink } from "node:fs/promises";
import { lessons } from "../src/lib/curriculum.ts";
import { voiceProfiles } from "../src/lib/voice-config.ts";
import { generateMascotAudio } from "../src/lib/gemini-voice.ts";
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
const mascotArg = process.argv.find(arg => arg.startsWith("--mascot="));
const mascotFilter = mascotArg?.split("=")[1];
if (mascotFilter && !(mascotFilter in voiceProfiles)) throw new Error("mascot must be sparky or pinky");
const deployment = process.argv.find(arg => arg.startsWith("--deployment="))?.slice(13);
if (deployment && !/^https:\/\/sparky-english-[a-z0-9]+-rafaelterra-webs-projects\.vercel\.app$/.test(deployment)) throw new Error("Unexpected deployment URL");
const vercelCLI = process.env.SPARKY_VERCEL_CLI;
if (deployment && !vercelCLI) throw new Error("Set SPARKY_VERCEL_CLI to the installed Vercel CLI entrypoint");
const pending = [];
for (const lesson of lessons) {
  const text = lesson.steps.find(step => step.kind === "example")?.english;
  if (!text || text.length > 4096) throw new Error("Missing or oversized published example: " + lesson.id);
  if (manifest[lesson.id]?.text !== text) manifest[lesson.id] = { text };
  for (const [mascot, profile] of Object.entries(voiceProfiles)) {
    if (mascotFilter && mascot !== mascotFilter) continue;
    const hash = createHash("sha256").update(JSON.stringify(lessonVoiceIdentity(text, mascot, lesson.level))).digest("hex").slice(0, 32);
    const url = "/audio/mascots/" + hash + ".wav";
    const file = new URL(hash + ".wav", folder);
    try { await access(file); manifest[lesson.id][mascot] = url; }
    catch { pending.push({ lessonId: lesson.id, level: lesson.level, text, mascot, profile, file, url }); }
  }
}
const batch = pending.slice(0, limit);
const words = batch.reduce((sum, item) => sum + item.text.split(/\s+/).length, 0);
const charactersByModel = Object.fromEntries(Object.keys(voiceProfiles).map(name => [voiceProfiles[name].model, batch.filter(item => item.profile.model === voiceProfiles[name].model).reduce((sum, item) => sum + item.text.length, 0)]));
console.log(JSON.stringify({ pending: pending.length, selected: batch.length, mascot: mascotFilter ?? "all", charactersByModel, estimatedMinutesAt140Wpm: +(words / 140).toFixed(2), mode: generate ? "generate" : "dry-run" }));
if (!generate) process.exit(0);
if (batch.length && !deployment && !process.env.GEMINI_API_KEY) throw new Error("Configure GEMINI_API_KEY securely before generating.");
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
  let bytes;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (deployment) {
        const temp = fileURLToPath(new URL(item.file.href + ".download"));
        await promisify(execFile)(process.execPath, [vercelCLI, "curl", `/api/admin/lesson-audio?lesson=${item.lessonId}&mascot=${item.mascot}`, "--deployment", deployment, "--", "--request", "POST", "--header", "@.env.lesson-audio-header.local", "--silent", "--show-error", "--fail-with-body", "--max-time", "95", "--output", temp], { cwd: fileURLToPath(root), timeout: 110000 });
        bytes = await readFile(temp);
        await unlink(temp);
      } else bytes = await generateMascotAudio(item.text, item.mascot, "en-US", false, undefined, lessonSpeechDelivery(item.text, item.mascot, item.level));
      break;
    } catch (error) {
      lastError = error;
      if (deployment) {
        try {
          const details = JSON.parse(await readFile(new URL(item.file.href + ".download"), "utf8"));
          if (details.category) console.error(item.lessonId + " / " + item.mascot + ": " + details.category);
          if (details.category?.includes("PROHIBITED_CONTENT")) break;
        } catch { /* no structured response from the remote job */ }
      }
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1500));
    }
  }
  if (!bytes) throw new Error(item.lessonId + " / " + item.mascot + ": " + (lastError instanceof Error ? lastError.message : "generation failed"));
  if (bytes.length < 48 || bytes.length > 12 * 1024 * 1024 || bytes.toString("ascii", 0, 4) !== "RIFF")
    throw new Error("Invalid Gemini TTS audio response");
  const temporary = new URL(item.file.href + ".tmp");
  await writeFile(temporary, bytes);
  await rename(temporary, item.file);
  manifest[item.lessonId][item.mascot] = item.url;
  // Save after every successful file: interrupted runs resume without regenerating it.
  await saveManifest();
  console.log("Generated " + item.lessonId + " / " + item.mascot);
}
let next = 0, consecutiveFailures = 0;
const failures = [];
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (consecutiveFailures < 5 && next < batch.length) {
    const item = batch[next++];
    try { await generateItem(item); consecutiveFailures = 0; }
    catch { failures.push(item.lessonId + " / " + item.mascot); consecutiveFailures++; console.error("Pending retry: " + item.lessonId + " / " + item.mascot); }
  }
}));
await saveManifest();
if (failures.length) { console.error(JSON.stringify({failures})); process.exitCode = 1; }
else console.log("Review audio samples, then commit audio files and manifest together.");
