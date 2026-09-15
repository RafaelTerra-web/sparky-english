"""Force-align every published lyric against the source audio and emit a review report."""
import json
import re
import statistics
from pathlib import Path
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio
from faster_whisper.tokenizer import Tokenizer

ROOT = Path(__file__).resolve().parent.parent
LAB = ROOT / '.music-lab'
manifest = json.loads((LAB / 'manifest.json').read_text(encoding='utf-8'))
config = json.loads((LAB / 'config.json').read_text(encoding='utf-8'))
audio = decode_audio(config['audioPath'], sampling_rate=16000)
model = WhisperModel('small.en', device='cpu', compute_type='int8', cpu_threads=4)
tokenizer = Tokenizer(model.hf_tokenizer, model.model.is_multilingual, task='transcribe', language='en')

def normalize(value):
    return re.sub(r"[^a-z0-9']", '', value.lower().replace('’', "'")).strip("'")

review = []
all_start_deltas = []
all_end_deltas = []
lines = manifest['lines']
for index, line in enumerate(lines):
    left = 0 if index == 0 else (lines[index - 1]['end'] + line['start']) / 2
    right = manifest['duration'] if index + 1 == len(lines) else (line['end'] + lines[index + 1]['start']) / 2
    clip = audio[round(left * 16000):round(right * 16000)]
    encoded = model.encode(model.feature_extractor(clip))
    tokens = tokenizer.encode(' ' + ' '.join(word['text'] for word in line['words']))
    aligned = model.find_alignment(tokenizer, [tokens], encoded, round(len(clip) / 160))[0]
    aligned = [word for word in aligned if re.search('[a-zA-Z]', word['word'])]
    expected = line['words']
    item = {'id': line['id'], 'window': [round(left, 3), round(right, 3)]}
    if len(aligned) != len(expected) or [normalize(w['word']) for w in aligned] != [normalize(w['text']) for w in expected]:
        item['status'] = 'token-mismatch'
        item['expected'] = [word['text'] for word in expected]
        item['heard'] = [word['word'].strip() for word in aligned]
    else:
        words = []
        for old, found in zip(expected, aligned):
            start = round(left + float(found['start']), 3)
            end = round(left + float(found['end']), 3)
            start_delta = round(start - old['start'], 3)
            end_delta = round(end - old['end'], 3)
            all_start_deltas.append(start_delta)
            all_end_deltas.append(end_delta)
            words.append({'text': old['text'], 'start': start, 'end': end, 'startDelta': start_delta, 'endDelta': end_delta})
        item['status'] = 'aligned'
        item['words'] = words
    review.append(item)

outliers = sorted(({
    'line': item['id'], 'word': word['text'], 'startDelta': word['startDelta'], 'endDelta': word['endDelta']
} for item in review if item['status'] == 'aligned' for word in item['words']
  if max(abs(word['startDelta']), abs(word['endDelta'])) > .3),
  key=lambda word: max(abs(word['startDelta']), abs(word['endDelta'])), reverse=True)
summary = {
    'audio': str(Path(config['audioPath']).resolve()),
    'lines': len(lines),
    'words': sum(len(line['words']) for line in lines),
    'alignedLines': sum(item['status'] == 'aligned' for item in review),
    'tokenMismatches': sum(item['status'] != 'aligned' for item in review),
    'medianStartDelta': round(statistics.median(all_start_deltas), 3) if all_start_deltas else None,
    'medianEndDelta': round(statistics.median(all_end_deltas), 3) if all_end_deltas else None,
    'maxAbsoluteDelta': round(max([abs(value) for value in all_start_deltas + all_end_deltas], default=0), 3),
    'outliersOver300ms': len(outliers),
    'largestOutliers': outliers[:12],
}
(LAB / 'alignment-review.json').write_text(json.dumps({'summary': summary, 'lines': review}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False))
