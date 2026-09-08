// Offline WAV decoding audit. No microphone and no paid API.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const root = new URL('../',import.meta.url);
const manifest = JSON.parse(await readFile(new URL('src/lib/content/voice-manifest.json',root),'utf8'));
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE_PATH ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : 'playwright');
const browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
const page = await browser.newPage();
const results = [];
try {
  await page.evaluate(() => { window.decoder = new AudioContext(); });
  for (const [lessonId,item] of Object.entries(manifest)) {
    for (const mascot of ['sparky','pinky']) {
      assert.match(item[mascot],/^\/audio\/mascots\/[a-f0-9]{32}\.wav$/);
      const bytes = await readFile(new URL('public' + item[mascot],root));
      const signal = await page.evaluate(async base64 => {
        const bytes = Uint8Array.from(atob(base64),c => c.charCodeAt(0));
        const decoded = await window.decoder.decodeAudioData(bytes.buffer);
        const samples = decoded.getChannelData(0);
        let squared = 0, peak = 0, clipped = 0;
        for (const sample of samples) { squared += sample * sample; peak = Math.max(peak,Math.abs(sample)); if (Math.abs(sample) >= 0.999) clipped++; }
        return {duration:decoded.duration,rms:Math.sqrt(squared / samples.length),peak,clipped:clipped / samples.length};
      },bytes.toString('base64'));
      assert.ok(signal.duration > 0.3 && signal.duration < 60,lessonId + ' duration');
      assert.ok(signal.rms > 0.002 && Number.isFinite(signal.rms),lessonId + ' silent/corrupt');
      assert.ok(signal.clipped < 0.01,lessonId + ' excessive clipping');
      results.push({lessonId,mascot,bytes:bytes.length,...signal});
    }
  }
  await mkdir(new URL('.voice-qa/',root),{recursive:true});
  await writeFile(new URL('.voice-qa/signal.json',root),JSON.stringify(results,null,2));
  console.log(JSON.stringify({files:results.length,minutes:+(results.reduce((sum,item) => sum + item.duration,0)/60).toFixed(2),megabytes:+(results.reduce((sum,item) => sum + item.bytes,0)/1048576).toFixed(2),minDuration:Math.min(...results.map(item => item.duration)),maxDuration:Math.max(...results.map(item => item.duration)),maxClipped:Math.max(...results.map(item => item.clipped))}));
} finally { await browser.close(); }
