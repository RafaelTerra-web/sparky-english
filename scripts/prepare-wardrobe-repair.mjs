// Export a GPT Image repair to the wardrobe canvas. Only neutral background
// connected to the image border is made transparent; dark fur is never keyed out.
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { outfitCatalog, wardrobeBaseAssets } from '../src/lib/rewards-shared.ts';
const [id, source] = process.argv.slice(2);
const item = outfitCatalog.find(entry => entry.id === id) ?? (id === 'sparky-base' ? { assetPath: wardrobeBaseAssets.sparky } : null);
if (!item || !source) throw Error('Usage: node scripts/prepare-wardrobe-repair.mjs <outfit-id> <generated.png>');
const input = await readFile(source);
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const marked = new Uint8Array(width * height);
const queue = new Int32Array(width * height);
let head = 0, tail = 0;
function visit(index) {
  if (marked[index]) return;
  const offset = index * 4;
  const channels = data.subarray(offset, offset + 3);
  const min = Math.min(...channels), max = Math.max(...channels);
  if (data[offset + 3] < 8 || (min >= 100 && max - min <= 24)) {
    marked[index] = 1; queue[tail++] = index;
  }
}
for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
while (head < tail) {
  const index = queue[head++], x = index % width, y = Math.floor(index / width);
  if (x > 0) visit(index - 1);
  if (x < width - 1) visit(index + 1);
  if (y > 0) visit(index - width);
  if (y < height - 1) visit(index + width);
}
if (tail / marked.length < .1 || tail / marked.length > .7) throw Error('Unexpected cutout coverage; inspect generated art.');
for (let i = 0; i < marked.length; i++) if (marked[i]) data[i * 4 + 3] = 0;
await mkdir(dirname(`public${item.assetPath}`), { recursive: true });
await sharp(data, { raw: info }).resize(640, 640).png().toFile(`public${item.assetPath}`);
const logPath = 'docs/wardrobe-repairs.json';
let records = [];
try { records = JSON.parse(await readFile(logPath, 'utf8')); } catch { /* First export. */ }
records = records.filter(record => record.id !== id);
records.push({ id, generatedAt: new Date().toISOString(), generator: 'OpenAI GPT Image (built-in)', sourceSha256: createHash('sha256').update(input).digest('hex'), repair: 'Restore solid dark anatomy and remove baked-in accessories while preserving the canonical pose.', processing: 'Border-connected neutral background removal, preserving opaque dark fur; resize to 640px.' });
await writeFile(logPath, JSON.stringify(records, null, 2) + '\n');
console.log(`${id}: 640px export; ${(tail / marked.length * 100).toFixed(1)}% outside background.`);
