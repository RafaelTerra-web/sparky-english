// Removes only generated MP3 files that are no longer referenced by the current manifest.
// Dry-run by default. Usage: node scripts/prune-voice-assets.mjs --apply
import { readFile, readdir, realpath, unlink } from "node:fs/promises";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const folder = await realpath(fileURLToPath(new URL("../public/audio/mascots/", import.meta.url)));
const folderFromRoot = relative(root, folder);
if (!folderFromRoot || folderFromRoot.startsWith(".." + sep) || folderFromRoot === "..") {
  throw new Error("Audio folder must be inside the repository root.");
}

const manifest = JSON.parse(await readFile(new URL("../src/lib/content/voice-manifest.json", import.meta.url), "utf8"));
const referenced = new Set(Object.values(manifest).flatMap(item => [item.sparky, item.pinky]).filter(Boolean).map(path => basename(path)));
const files = (await readdir(folder, { withFileTypes: true }))
  .filter(entry => entry.isFile() && /^[a-f0-9]{32}\.mp3$/.test(entry.name));
const stale = files.filter(entry => !referenced.has(entry.name));
console.log(JSON.stringify({ folder, files: files.length, referenced: referenced.size, stale: stale.length, mode: process.argv.includes("--apply") ? "apply" : "dry-run" }));

if (process.argv.includes("--apply")) {
  for (const entry of stale) {
    const path = resolve(folder, entry.name);
    if (dirname(path) !== folder) throw new Error("Refusing to remove a path outside the audio folder.");
    await unlink(path);
  }
  console.log(JSON.stringify({ removed: stale.length, remaining: files.length - stale.length }));
}
