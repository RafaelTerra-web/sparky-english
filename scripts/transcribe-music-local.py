"""Transcribe the entire private source locally; no audio leaves the computer."""
import json
from pathlib import Path
from faster_whisper import WhisperModel

lab = Path(__file__).resolve().parent.parent / '.music-lab'
config = json.loads((lab / 'config.json').read_text(encoding='utf-8'))
model = WhisperModel('small.en', device='cpu', compute_type='int8', cpu_threads=6)
segments, info = model.transcribe(
    config['audioPath'], language='en', word_timestamps=True, beam_size=5,
    vad_filter=False, condition_on_previous_text=False,
)
result = []
for segment in segments:
    row = {'start': segment.start, 'end': segment.end, 'text': segment.text.strip(),
           'words': [{'text': w.word.strip(), 'start': round(w.start, 3),
                      'end': round(w.end, 3), 'probability': round(w.probability, 3)}
                     for w in segment.words]}
    result.append(row)
    print(json.dumps(row), flush=True)
(lab / 'full-transcript.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(f'Completed {info.duration:.3f}s locally.', flush=True)
