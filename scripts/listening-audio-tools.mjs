import { createHash } from 'node:crypto';
export const digest = value => createHash('sha256').update(value).digest('hex');
export const scriptDigest = conversation => digest(JSON.stringify(conversation.turns.map(({speaker,text})=>({speaker,text}))));
export const durationRanges = {B2:[75,120],C1:[120,180],C2:[150,240]};

// Read RIFF chunks rather than assuming a fixed 44-byte header (AI Studio may include metadata).
export function inspectWav(bytes) {
  if(bytes.length<44 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WAVE'
    || bytes.readUInt32LE(4)+8!==bytes.length) throw Error('Invalid or truncated WAV');
  let format, data;
  for(let offset=12;offset<bytes.length;){
    if(offset+8>bytes.length) throw Error('Truncated chunk header');
    const name=bytes.toString('ascii',offset,offset+4),length=bytes.readUInt32LE(offset+4),start=offset+8;
    if(start+length>bytes.length) throw Error('Truncated chunk');
    if(name==='fmt '){
      if(format || length<16) throw Error('Invalid format chunk');
      format={codec:bytes.readUInt16LE(start),channels:bytes.readUInt16LE(start+2),rate:bytes.readUInt32LE(start+4),byteRate:bytes.readUInt32LE(start+8),align:bytes.readUInt16LE(start+12),bits:bytes.readUInt16LE(start+14)};
    }
    if(name==='data'){if(data) throw Error('Duplicate data chunk');data=bytes.subarray(start,start+length);}
    offset=start+length+(length%2);
    if(offset>bytes.length) throw Error('Missing chunk padding');
  }
  if(!format || !data?.length || format.codec!==1 || format.bits!==16 || format.channels!==1 || format.rate!==24000
    || format.align!==2 || format.byteRate!==48000 || data.length%2) throw Error('Expected mono PCM16 at 24 kHz');
  let peak=0;for(let i=0;i<data.length;i+=2) peak=Math.max(peak,Math.abs(data.readInt16LE(i)));
  if(peak===0) throw Error('Silent audio');
  return {durationSeconds:data.length/format.byteRate,peak};
}

export function composerText(c){
  const [min,max]=durationRanges[c.level];
  return `Model: gemini-3.1-flash-tts-preview\nSparky: Achird\nPinky: Zephyr\nScene: ${c.scene}\nDirection: ${c.context}\nTarget duration: ${min}–${max} seconds. Read every scripted word naturally. No music or spoken labels.\n\n${c.turns.map(t=>`${t.speaker==='sparky'?'Sparky':'Pinky'}: ${t.text}`).join('\n\n')}\n`;
}
