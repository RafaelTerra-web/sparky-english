// Administrative Gemini 3.1 TTS generation for bilingual conversation tips.
// Dry-run is the default. Usage: node scripts/generate-tip-audio.mjs --generate
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { conversationTips } from "../src/lib/conversation-tips.ts";
import { generateMascotAudio } from "../src/lib/gemini-voice.ts";
import { voiceProfiles } from "../src/lib/voice-config.ts";

const root = new URL("../", import.meta.url);
const folder = new URL("public/audio/tips/", root);
const manifestPath = new URL("src/lib/content/tip-audio-manifest.json", root);
const generate = process.argv.includes("--generate");
const concurrencyArg = process.argv.find(argument => argument.startsWith("--concurrency="));
const concurrency = concurrencyArg ? Number(concurrencyArg.split("=")[1]) : 2;
if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error("concurrency must be between 1 and 4");

let oldManifest = [];
try { oldManifest = JSON.parse(await readFile(manifestPath, "utf8")); } catch { /* First generation. */ }
const oldByKey = new Map(oldManifest.map(item => [item.id + ":" + item.mascot, item]));
const specs = conversationTips.flatMap(tip => Object.entries(voiceProfiles).map(([mascot, profile]) => {
  const url = "/audio/tips/" + tip.id + "-" + mascot + ".wav";
  const scriptHash = createHash("sha256").update(JSON.stringify({ script: tip.script, profile, version: 2 })).digest("hex");
  return { tip, mascot, profile, url, scriptHash, file: new URL("public" + url, root) };
}));
const records = new Map();
const pending = [];
for (const spec of specs) {
  const key = spec.tip.id + ":" + spec.mascot;
  const old = oldByKey.get(key);
  try {
    const bytes = await readFile(spec.file);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (old?.scriptHash === spec.scriptHash && old.sha256 === sha256) records.set(key, old);
    else pending.push(spec);
  } catch { pending.push(spec); }
}
console.log(JSON.stringify({ total: specs.length, pending: pending.length, model: voiceProfiles.sparky.model, mode: generate ? "generate" : "dry-run" }));
if (!generate) process.exit(0);
if (!process.env.GEMINI_API_KEY) throw new Error("Configure GEMINI_API_KEY securely before generating.");
await mkdir(folder, { recursive: true });

let saveQueue = Promise.resolve();
function saveManifest() {
  saveQueue = saveQueue.then(async () => {
    const manifest = specs.map(spec => records.get(spec.tip.id + ":" + spec.mascot)).filter(Boolean);
    const temporary = new URL("tip-audio-manifest.json.tmp", manifestPath);
    await writeFile(temporary, JSON.stringify(manifest, null, 2) + "\n");
    await rename(temporary, manifestPath);
  });
  return saveQueue;
}

async function generateEntry(spec) {
  let bytes;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      bytes = await generateMascotAudio(spec.tip.script, spec.mascot, "pt-BR");
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1500));
    }
  }
  if (!bytes) throw lastError;
  if (bytes.length < 48 || bytes.length > 12 * 1024 * 1024 || bytes.toString("ascii", 0, 4) !== "RIFF") throw new Error("Invalid Gemini TTS audio response");
  const temporary = new URL(spec.file.href + ".tmp");
  await writeFile(temporary, bytes);
  await rename(temporary, spec.file);
  records.set(spec.tip.id + ":" + spec.mascot, {
    id: spec.tip.id,
    mascot: spec.mascot,
    model: spec.profile.model,
    voice: spec.profile.voice,
    scriptHash: spec.scriptHash,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
    url: spec.url,
  });
  await saveManifest();
  console.log("Generated " + spec.tip.id + " / " + spec.mascot);
}

let next = 0;
let failure;
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (!failure && next < pending.length) {
    const spec = pending[next++];
    try { await generateEntry(spec); } catch (error) { failure ??= error; }
  }
}));
if (failure) throw failure;
await saveManifest();
console.log("Review the generated tips, then commit the WAV files and manifest together.");
