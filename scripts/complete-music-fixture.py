"""Build the full private lesson from local transcription and editorial notes."""
import json
import re
import shutil
from pathlib import Path
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio
from faster_whisper.tokenizer import Tokenizer

lab = Path(__file__).resolve().parent.parent / '.music-lab'
backup = lab / 'excerpt-backup.json'
if not backup.exists():
    shutil.copy2(lab / 'manifest.json', backup)
lesson = json.loads(backup.read_text(encoding='utf-8'))
transcript = json.loads((lab / 'full-transcript.json').read_text(encoding='utf-8'))
editorial = json.loads((lab / 'full-editorial.json').read_text(encoding='utf-8'))
glossary = json.loads((lab / 'full-glossary.json').read_text(encoding='utf-8'))
config = json.loads((lab / 'config.json').read_text(encoding='utf-8'))
model = None
samples = None
for entry in editorial:
    source = list(transcript[entry['segment']]['words'])
    if entry.get('mergeNext'):
        source += transcript[entry['segment'] + 1]['words']
    words = [{key: w[key] for key in ('text', 'start', 'end')}
             for w in source[entry.get('from', 0):entry.get('to')]]
    for w in words:
        w['text'] = entry.get('replace', {}).get(w['text'], w['text'])
    if 'insertBefore' in entry:
        # A recognizer omitted a short contraction. Force-align the corrected
        # phrase acoustically instead of distributing times uniformly.
        if model is None:
            model = WhisperModel('small.en', device='cpu', compute_type='int8', cpu_threads=4)
            samples = decode_audio(config['audioPath'], sampling_rate=16000)
        text_words = [w['text'] for w in words]
        text_words.insert(entry['insertBefore']['index'], entry['insertBefore']['text'])
        start, end = words[0]['start'], words[-1]['end']
        clip = samples[round(start * 16000):round(end * 16000)]
        tokenizer = Tokenizer(model.hf_tokenizer, model.model.is_multilingual, task='transcribe', language='en')
        encoded = model.encode(model.feature_extractor(clip))
        aligned = model.find_alignment(tokenizer, [tokenizer.encode(' ' + ' '.join(text_words))], encoded, round(len(clip) / 160))[0]
        words = [{'text': w['word'].strip(), 'start': round(start + float(w['start']), 3),
                  'end': round(start + float(w['end']), 3)} for w in aligned if re.search('[a-zA-Z]', w['word'])]
        if len(words) != len(text_words):
            raise ValueError(f'Corrected phrase did not align token-for-token: {words}')
        for w, text in zip(words, text_words):
            w['text'] = text
    words[0]['text'] = words[0]['text'][0].upper() + words[0]['text'][1:]
    lesson['lines'].append({'id': f'full-{len(lesson["lines"]) + 1:02}',
                            'start': words[0]['start'], 'end': words[-1]['end'],
                            'text': ' '.join(w['text'] for w in words),
                            'translation': entry['translation'], 'tip': entry['tip'], 'words': words})

def normalize(text):
    return re.sub(r"^[^a-z0-9]+|[^a-z0-9]+$", '', text.lower().replace('’', "'"))

existing = {v['id']: v for v in lesson['vocabulary']}
vocabulary = {}
for line in lesson['lines']:
    previous = line['start']
    for word in line['words']:
        if word['start'] < previous or word['end'] <= word['start']:
            raise ValueError(f'Alignment requires review: {line["id"]} {word}')
        previous = word['end']
        term = normalize(word['text'])
        meaning, ipa = glossary[term]  # Missing entries fail the build.
        word['vocabularyId'] = term.replace("'", '-')
        if word['vocabularyId'] not in vocabulary:
            old = existing.get(word['vocabularyId'])
            vocabulary[word['vocabularyId']] = {
                'id': word['vocabularyId'], 'word': 'I' if term == 'i' else term,
                'meaning': meaning, 'ipa': ipa,
                'usage': old['usage'] if old else line['tip'], 'example': line['text'],
            }
lesson['vocabulary'] = sorted(vocabulary.values(), key=lambda v: v['word'].lower())
lesson['version'] = 'full-song-timing-2'
(lab / 'manifest.json').write_text(json.dumps(lesson, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'seconds': lesson['duration'], 'verses': len(lesson['lines']),
                  'words': sum(len(l['words']) for l in lesson['lines']),
                  'vocabulary': len(lesson['vocabulary']), 'lastVoice': lesson['lines'][-1]['end']}))
