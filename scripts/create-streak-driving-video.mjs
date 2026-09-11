import { mkdir, readFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const outputDirectory = resolve(".release-work/higgsfield");
const output = resolve(outputDirectory, "sparky-streak-driving.webm");
const mascot = await readFile(resolve("public/visuals/sparky-panda.png"));
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 480, height: 480 },
  recordVideo: { dir: outputDirectory, size: { width: 480, height: 480 } },
});
const page = await context.newPage();
await page.setContent(`<!doctype html><style>
  *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#00ff00}
  .stage{position:relative;width:480px;height:480px;background:#00ff00}
  .sparky{position:absolute;width:310px;height:310px;object-fit:contain;left:85px;top:105px;transform-origin:50% 82%;animation:sparky 5s cubic-bezier(.4,0,.2,1) both}
  .flame{position:absolute;left:326px;top:112px;width:64px;height:82px;border-radius:52% 48% 58% 42%;background:#ff754f;transform:rotate(45deg) scale(0);animation:flame 5s ease-in-out both}
  .flame:after{content:"";position:absolute;inset:23px 18px 13px 24px;border-radius:55% 45% 58% 42%;background:#ffd96b}
  .trail{position:absolute;inset:56px;border:12px solid #73d8ae;border-left-color:transparent;border-radius:50%;opacity:0;animation:trail 5s ease-in-out both}
  @keyframes sparky{0%,100%{transform:translateY(0) rotate(0) scale(1)}15%{transform:translateY(7px) rotate(-1deg) scale(.985)}31%{transform:translateY(-17px) rotate(2deg) scale(1.035)}48%{transform:translateY(-8px) rotate(-2deg) scale(1.02)}70%{transform:translateY(-13px) rotate(2deg) scale(1.025)}88%{transform:translateY(3px) rotate(-1deg) scale(.995)}}
  @keyframes flame{0%,22%,100%{transform:rotate(45deg) scale(0);opacity:0}34%{transform:rotate(45deg) scale(1);opacity:1}45%,70%{transform:rotate(42deg) scale(.82);opacity:1}84%{transform:translate(-205px,155px) rotate(405deg) scale(.3);opacity:.25}}
  @keyframes trail{0%,43%,100%{opacity:0;transform:rotate(-55deg) scale(.86)}56%{opacity:.9}80%{opacity:.1;transform:rotate(310deg) scale(1.04)}}
</style><div class="stage"><div class="trail"></div><img class="sparky" src="data:image/png;base64,${mascot.toString("base64")}"><div class="flame"></div></div>`);
await page.waitForTimeout(5200);
const video = page.video();
await context.close();
await browser.close();
if (!video) throw new Error("Playwright did not create the driving video.");
await rename(await video.path(), output);
console.log(output);
