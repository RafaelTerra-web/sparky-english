import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// Package the approved artwork; no API calls or image-generation costs.
const source = "public/visuals/sparky-app-icon.png";
for (const [name, size] of [["sparky-192-v2", 192], ["sparky-512-v2", 512], ["apple-touch-icon-v2", 180]]) {
  await sharp(source).resize(size, size).png().toFile(`public/icons/${name}.png`);
}
await sharp(source).resize(512, 512).png().toFile("src/app/icon.png");
await sharp(source).resize(410, 410).extend({ top: 51, bottom: 51, left: 51, right: 51, background: "#173e36" }).png().toFile("public/icons/sparky-maskable-512-v2.png");
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map(size => sharp(source).resize(size, size).ensureAlpha().png().toBuffer()));
const directory = Buffer.alloc(6 + 16 * frames.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(frames.length, 4);
let offset = directory.length;
frames.forEach((frame, index) => {
  const entry = 6 + index * 16;
  directory[entry] = directory[entry + 1] = sizes[index];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(frame.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await writeFile("src/app/favicon.ico", Buffer.concat([directory, ...frames]));
console.log("Sparky icons packaged for web, iOS and Android.");
