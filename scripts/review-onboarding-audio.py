"""Automatic editorial screening, not a human pronunciation approval."""
import pathlib, sys, json, wave, array, re, difflib
from faster_whisper import WhisperModel
root = pathlib.Path(sys.argv[1])
expected = json.loads((root / 'expected.json').read_text(encoding='utf-8-sig'))
model = WhisperModel('base', device='cpu', compute_type='int8', cpu_threads=4)
results=[]
for path in sorted(root.glob('*.wav')):
    with wave.open(str(path)) as wav:
        rate=wav.getframerate(); channels=wav.getnchannels()
        samples=array.array('h',wav.readframes(wav.getnframes()))
        duration=len(samples)/rate/channels
    report_path=root/(path.stem+'.qa.json')
    if report_path.exists():
        results.append(json.loads(report_path.read_text(encoding='utf-8')));continue
    segments, _ = model.transcribe(str(path), language='en' if path.stem.startswith('placement-') else 'pt', beam_size=5, vad_filter=True)
    transcript=' '.join(segment.text.strip() for segment in segments)
    words=lambda value: re.findall(r'\w+', value.casefold())
    reference=re.sub(r'\b(?:Sparky|Pinky):\s*','',expected[path.stem])
    similarity=difflib.SequenceMatcher(None,words(reference),words(transcript),autojunk=False).ratio()
    result={'id':path.stem,'duration':round(duration,2),'sampleRate':rate,'channels':channels,'peak':max(abs(n) for n in samples),'similarity':round(similarity,3),'transcript':transcript,'method':'Whisper base CPU; automatic screening only'}
    report_path.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    results.append(result);print(json.dumps(result,ensure_ascii=True),flush=True)
(root/'review.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
