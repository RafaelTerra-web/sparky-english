import { lessonIllustrationId } from "../src/lib/lesson-illustrations.ts";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { lessons } from "../src/lib/curriculum.ts";

const outputDirectory = new URL("../public/lesson-images/", import.meta.url);
const outputFile = new URL("manifest.json", outputDirectory);
const stylePrompt = [
  "Premium 2D editorial cartoon for a mobile language-learning app.",
  "Clearly human characters with simplified proportions, expressive faces and readable gestures.",
  "Clean flowing outlines, broad flat colors and minimal cel shading; no photorealism or 3D.",
  "Isolated cutout with essential props and transparent alpha; no text, UI, logo or watermark.",
].join(" ");

const assetIds = [...new Set(lessons.map(lessonIllustrationId))];
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
  strategy: "A contextual illustration for each module, with lesson-specific overrides where available; compact practice modules reuse related scenes.",
  assets,
  lessons: lessons.map((lesson) => {
    const assetId = lessonIllustrationId(lesson);
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
