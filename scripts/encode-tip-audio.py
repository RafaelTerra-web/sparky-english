import av,pathlib,json,hashlib
root=pathlib.Path('.voice-qa/tips'); target=pathlib.Path('public/audio/tips'); target.mkdir(parents=True,exist_ok=True)
manifest=[]
for path in root.glob('*.wav'):
 outpath=target/(path.stem+'.mp3')
 if not outpath.exists():
  with av.open(str(path)) as source, av.open(str(outpath),'w') as output:
   stream=output.add_stream('mp3',rate=24000);stream.bit_rate=96000
   for frame in source.decode(audio=0):
    for packet in stream.encode(frame):output.mux(packet)
   for packet in stream.encode(None):output.mux(packet)
 entry=json.loads(path.with_suffix('.json').read_text(encoding='utf-8-sig'))
 entry.update(sourceSha256=entry['sha256'],sha256=hashlib.sha256(outpath.read_bytes()).hexdigest(),bytes=outpath.stat().st_size,url='/audio/tips/'+outpath.name)
 manifest.append(entry)
 print(path.stem, outpath.stat().st_size)
pathlib.Path('src/lib/content/tip-audio-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
