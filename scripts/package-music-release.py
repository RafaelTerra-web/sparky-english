"""Package the approved full lesson for authenticated production playback."""
import json
import shutil
from pathlib import Path
import av
import numpy as np

root = Path(__file__).resolve().parent.parent
lab = root / '.music-lab'
target = root / '.music-assets'
target.mkdir(exist_ok=True)
with av.open(str(lab / 'audio-soft.wav')) as source, av.open(str(target / 'audio.mp3'), 'w') as output:
    stream = output.add_stream('libmp3lame', rate=48000)
    stream.bit_rate = 128000
    stream.layout = 'stereo'
    for frame in source.decode(audio=0):
        for packet in stream.encode(frame):
            output.mux(packet)
    for packet in stream.encode(None):
        output.mux(packet)
with av.open(str(target / 'audio.mp3')) as check:
    resampler = av.AudioResampler(format='fltp', layout='stereo', rate=48000)
    frames = [f.to_ndarray() for frame in check.decode(audio=0) for f in resampler.resample(frame)]
    pcm = np.concatenate(frames, axis=1)
    peak = float(np.abs(pcm).max())
    duration = pcm.shape[1] / 48000
    if peak > .35:
        raise ValueError('Release audio exceeds the approved quiet level')
manifest = json.loads((lab / 'manifest.json').read_text(encoding='utf-8'))
manifest.update(rights='user-provided', published=True)
if abs(duration - manifest['duration']) > .1:
    raise ValueError('Encoded duration does not match the lesson clock')
(target / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False), encoding='utf-8')
print(json.dumps({'duration': duration, 'peak': peak, 'bytes': (target / 'audio.mp3').stat().st_size,
                  'lines': len(manifest['lines']), 'words': len(manifest['vocabulary'])}))
