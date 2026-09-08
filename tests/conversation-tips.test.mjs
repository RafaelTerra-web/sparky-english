import test from 'node:test';
import assert from 'node:assert/strict';
import { conversationTips, tipForLesson } from '../src/lib/conversation-tips.ts';
import { lessons } from '../src/lib/curriculum.ts';
test('tips cover A1–C2 with stable IDs, contextual lessons and bilingual practice',()=>{
 assert.equal(conversationTips.length,12);
 assert.equal(new Set(conversationTips.map(t=>t.id)).size,12);
 assert.equal(new Set(conversationTips.map(t=>t.level)).size,6);
 const attached=new Set();
 for(const tip of conversationTips){
  assert.match(tip.source,/^https:\/\/(dictionary.cambridge.org|www.teachingenglish.org.uk)\//);
  for(const field of ['tip','example','translation','tryIt','answer','script']) assert.ok(tip[field].length>15);
  for(const id of tip.lessonIds){
   assert.ok(!attached.has(id));attached.add(id);
   assert.ok(lessons.find(l=>l.id===id)?.steps.some(s=>s.kind==='pronunciation'));
   assert.equal(tipForLesson(id).id,tip.id);
  }
 }
 assert.equal(attached.size,24);
 assert.equal(tipForLesson('not-a-lesson'),undefined);
});
test('every tip has both published mascot recordings with matching hashes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createHash}=await import('node:crypto');
 const {voiceProfiles}=await import('../src/lib/voice-config.ts');
 const manifest=JSON.parse(await readFile(new URL('../src/lib/content/tip-audio-manifest.json',import.meta.url),'utf8'));
 assert.equal(manifest.length,24);
 for(const tip of conversationTips)for(const mascot of ['sparky','pinky']){
  const asset=manifest.find(a=>a.id===tip.id&&a.mascot===mascot);
  assert.ok(asset);assert.equal(asset.model,voiceProfiles[mascot].model);
  assert.equal(asset.scriptHash,createHash('sha256').update(JSON.stringify({script:tip.script,profile:voiceProfiles[mascot],version:1})).digest('hex'));
  assert.equal(asset.url,`/audio/tips/${tip.id}-${mascot}.mp3`);
  const bytes=await readFile(new URL('../public'+asset.url,import.meta.url));
  assert.equal(bytes.length,asset.bytes);assert.ok(bytes.length>1000);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
 }
});
