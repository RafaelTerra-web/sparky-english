"""Prepare a quiet private PCM copy; never overwrite or upload the source."""
import hashlib
import json
import wave
from pathlib import Path
import av
import numpy as np

lab = Path(__file__).resolve().parent.parent / '.music-lab'
config = json.loads((lab / 'config.json').read_text(encoding='utf-8'))
source = Path(config['audioPath']).resolve()
target = (lab / 'audio-soft.wav').resolve()
assert target.parent == lab.resolve() and target != source
container = av.open(str(source))
resampler = av.AudioResampler(format='fltp', layout='stereo', rate=48000)
chunks = [out.to_ndarray() for frame in container.decode(audio=0) for out in resampler.resample(frame)]
chunks += [out.to_ndarray() for out in resampler.resample(None)]
samples = np.concatenate(chunks, axis=1)
peak = float(np.abs(samples).max())
rms = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))
# Static attenuation preserves dynamics; no clipping, boost, time stretch or
# compressor pumping. Quiet even where mobile browsers ignore element.volume.
gain = min(1.0, 0.055 / rms, 0.30 / peak)
pcm = np.round(samples.T * gain * 32767).astype('<i2')
with wave.open(str(target), 'wb') as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(48000)
    output.writeframes(pcm.tobytes())
report = {'source': str(source), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'duration': samples.shape[1] / 48000, 'gain': gain,
          'attenuationDb': float(20 * np.log10(gain)),
          'sourcePeak': peak, 'outputPeak': peak * gain, 'outputRms': rms * gain}
(lab / 'audio-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
