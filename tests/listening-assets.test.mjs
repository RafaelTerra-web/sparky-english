import test from 'node:test';
import assert from 'node:assert/strict';
import {isApprovedListeningAsset} from '../src/lib/listening-manifest.ts';
import {inspectWav,scriptDigest,composerText} from '../scripts/listening-audio-tools.mjs';
const approved=()=>({id:'b2-test',path:'/audio/listening/b2-test.wav',sha256:'a'.repeat(64),scriptSha256:'b'.repeat(64),durationSeconds:100,generatedAt:'2026-09-10T00:00:00Z',model:'gemini-3.1-flash-tts-preview',voices:{sparky:'Achird',pinky:'Zephyr'},review:{status:'approved',pronunciation:true,naturalness:true,cleanAudio:true,turns:true,coherence:true}});
test('listening approval requires every explicit check and valid identity',()=>{
  assert.equal(isApprovedListeningAsset(approved(),'b2-test'),true);
  for(const review of [{status:'approved'},{},undefined,{...approved().review,turns:false},{...approved().review,status:'pending'}])assert.equal(isApprovedListeningAsset({...approved(),review},'b2-test'),false);
  for(const changes of [{voices:{}},{model:'chirp'},{path:'https://example.test/audio.wav'},{sha256:''},{durationSeconds:NaN},{generatedAt:'invalid'},{id:'other'}])assert.equal(isApprovedListeningAsset({...approved(),...changes},'b2-test'),false);
});
function wav({metadata=false,silent=false}={}){
  const data=Buffer.alloc(48000);if(!silent)data.writeInt16LE(100,0);
  const fmt=Buffer.alloc(24);fmt.write('fmt ');fmt.writeUInt32LE(16,4);fmt.writeUInt16LE(1,8);fmt.writeUInt16LE(1,10);fmt.writeUInt32LE(24000,12);fmt.writeUInt32LE(48000,16);fmt.writeUInt16LE(2,20);fmt.writeUInt16LE(16,22);
  const header=Buffer.alloc(12);header.write('RIFF');header.write('WAVE',8);
  const extra=metadata?Buffer.from([74,85,78,75,1,0,0,0,5,0]):Buffer.alloc(0);
  const d=Buffer.alloc(8);d.write('data');d.writeUInt32LE(data.length,4);
  const bytes=Buffer.concat([header,extra,fmt,d,data]);bytes.writeUInt32LE(bytes.length-8,4);return bytes;
}
test('WAV inspection accepts metadata and detects truncation, silence and wrong encoding',()=>{
  for(const metadata of [true,false])assert.equal(inspectWav(wav({metadata})).durationSeconds,1);
  assert.throws(()=>inspectWav(wav().subarray(0,100)),/truncated/);
  assert.throws(()=>inspectWav(wav({silent:true})),/Silent/);
  const bad=wav();bad.writeUInt32LE(16000,24);assert.throws(()=>inspectWav(bad),/24 kHz/);
});
test('script fingerprint binds speaker and English text while ignoring translation edits',()=>{
  const c={level:'B2',scene:'At a station',context:'Natural speech',turns:[{speaker:'sparky',text:'Hello there.',translation:'Olá.'}]};
  assert.equal(scriptDigest(c),scriptDigest({...c,turns:[{...c.turns[0],translation:'Oi.'}]}));
  assert.notEqual(scriptDigest(c),scriptDigest({...c,turns:[{...c.turns[0],speaker:'pinky'}]}));
  assert.match(composerText(c),/Sparky: Achird/);assert.match(composerText(c),/Pinky: Zephyr/);assert.match(composerText(c),/Sparky: Hello there\./);
});
