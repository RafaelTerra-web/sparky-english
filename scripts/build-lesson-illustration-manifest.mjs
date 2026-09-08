import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { lessons, modules } from "../src/lib/curriculum.ts";

const outputDirectory = new URL("../public/lesson-images/", import.meta.url);
const outputFile = new URL("manifest.json", outputDirectory);
const specialLessonAssets = new Set(["a1-1-1"]);
const stylePrompt = [
  "Premium 2D editorial cartoon for a mobile language-learning app.",
  "Clearly human characters with simplified proportions, expressive faces and readable gestures.",
  "Clean flowing outlines, broad flat colors and minimal cel shading; no photorealism or 3D.",
  "Isolated cutout with essential props and transparent alpha; no text, UI, logo or watermark.",
].join(" ");

const assetIds = [...modules.map((module) => module.id), ...specialLessonAssets];
const assets = [];

await mkdir(outputDirectory, { recursive: true });
for (const id of assetIds) {
  const filename = `${id}.png`;
  const file = new URL(filename, outputDirectory);
  const bytes = await readFile(file);
  assets.push({
    id,
    path: `/lesson-images/${filename}`,
    width: 960,
    height: 640,
    format: "png",
    alpha: true,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

const manifest = {
  schemaVersion: 1,
  generator: "OpenAI built-in GPT Image",
  generatedAt: new Date().toISOString(),
  stylePrompt,
  strategy: "A contextual illustration for each module, with lesson-specific overrides where available.",
  assets,
  lessons: lessons.map((lesson) => {
    const assetId = specialLessonAssets.has(lesson.id) ? lesson.id : lesson.moduleId;
    return {
      lessonId: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      level: lesson.level,
      assetId,
      path: `/lesson-images/${assetId}.png`,
    };
  }),
};

await writeFile(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Mapped ${manifest.lessons.length} lessons to ${assets.length} optimized PNG assets.`);
