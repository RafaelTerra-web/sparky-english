import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { accessoryCatalog, outfitCatalog, wardrobeBaseAssets } from "../src/lib/rewards-shared.ts";

const records = [];
for (const [mascot, path] of Object.entries(wardrobeBaseAssets)) {
  const bytes = await readFile(`public${path}`);
  const metadata = await sharp(bytes).metadata();
  records.push({ id: `${mascot}-base`, kind: "base", mascot, poseVersion: "wardrobe-v1", path,
    model: "OpenAI GPT Image", prompt: "Canonical mascot without baked-in clothing or accessories; transparent cartoon sprite.",
    generatedAt: "2026-09-09", width: metadata.width, height: metadata.height, alpha: metadata.hasAlpha,
    sha256: createHash("sha256").update(bytes).digest("hex") });
}
for (const item of outfitCatalog) {
  const bytes = await readFile(`public${item.assetPath}`);
  const metadata = await sharp(bytes).metadata();
  records.push({
    id: item.id,
    kind: item.kind,
    mascot: item.mascots[0],
    slot: item.slot,
    poseVersion: item.poseVersion,
    path: item.assetPath,
    model: "OpenAI GPT Image",
    prompt: "Preserve the canonical mascot identity, pose, proportions and framing; change only the outfit; transparent background; expressive non-realistic cartoon.",
    generatedAt: "2026-09-09",
    width: metadata.width,
    height: metadata.height,
    alpha: metadata.hasAlpha,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
for (const item of accessoryCatalog) {
  for (const mascot of item.mascots) {
    for (const [layer, assetPath] of Object.entries(item.assets[mascot])) {
      if (!assetPath) continue;
      const bytes = await readFile(`public${assetPath}`);
      const metadata = await sharp(bytes).metadata();
      records.push({
        id: item.id,
        kind: item.kind,
        mascot,
        slot: item.slot,
        layer: item.slot === "back" ? "back" : layer,
        poseVersion: item.poseVersion,
        incompatibleOutfits: item.incompatibleOutfits ?? [],
        path: assetPath,
        model: "OpenAI GPT Image",
        prompt: "Generate only the named accessory in the Sparky English cartoon style, then fit it to the canonical mascot canvas without including character pixels or a background.",
        generatedAt: "2026-09-09",
        width: metadata.width,
        height: metadata.height,
        alpha: metadata.hasAlpha,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }
  }
}
await writeFile("docs/wardrobe-assets.json", `${JSON.stringify(records, null, 2)}\n`);
console.log(`Wrote ${records.length} wardrobe asset records.`);
