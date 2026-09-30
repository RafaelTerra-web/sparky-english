"""Build private Musify manifests from reviewed rows and acoustic word anchors.

No uniform word times are invented: changed phrases retain their recognized
span as one challenge-ineligible token, and overlapping/zero-length anchors
are grouped with a real neighboring span. Editorial JSON stays outside Git.
"""
from difflib import SequenceMatcher
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
STORE = ROOT / '.music-assets'
CURRICULUM = json.loads((STORE / 'musify-curriculum.json').read_text(encoding='utf-8'))
EXPLICIT = {'bitch', 'bitches', 'nigga', 'niggas', 'shit', 'fuck', 'fucking', 'pussy', 'hoes', 'ho', 'ass', 'damn', 'damned'}
ADLIBS = {'ooh', 'oh', 'ah', 'yeah', 'hey', 'yo', 'mwah', 'ay', 'ayy', 'alright', 'uh', 'woo'}

def load(path):
    return json.loads(path.read_text(encoding='utf-8'))

def key(text):
    return re.sub(r"[^a-z0-9']", '', text.lower().replace('’', "'"))

def corrected_words(original, text, audit):
    target = text.split()
    words = []
    pending = ''
    matcher = SequenceMatcher(a=[key(word['text']) for word in original], b=[key(word) for word in target], autojunk=False)
    for tag, left, right, start, end in matcher.get_opcodes():
        if tag == 'equal':
            for old, token in zip(original[left:right], target[start:end]):
                words.append({**old, 'text': pending + token, **({'editorialGroup': True} if pending else {})})
                pending = ''
        elif tag == 'replace':
            words.append({'text': pending + ' '.join(target[start:end]), 'start': original[left]['start'], 'end': original[right - 1]['end'],
                          'probability': 0, 'editorialGroup': True})
            pending = ''
            audit['correctedGroups'] += 1
        elif tag == 'insert':
            # An inserted word has no independent acoustic anchor. Attach it to
            # an existing phrase and disable that phrase for gameplay.
            inserted = ' '.join(target[start:end])
            if words:
                words[-1]['text'] += ' ' + inserted
                words[-1]['editorialGroup'] = True
            elif right < len(original):
                pending += inserted + ' '
            else:
                raise ValueError('No real anchor for inserted phrase')
            audit['correctedGroups'] += 1
        # Deletions remove a hallucinated word, not its neighbors' real timings.
    if pending or ' '.join(word['text'] for word in words) != text:
        raise ValueError(f'Correction lost text: {text}')
    return words

def anchored_words(words, duration, spoken, vocabulary, audit, confirmations):
    grouped = []
    pending = []
    for source in words:
        word = {**source, 'start': max(0, min(duration, source['start'])), 'end': max(0, min(duration, source['end']))}
        if pending:
            word['text'] = ' '.join(item['text'] for item in pending) + ' ' + word['text']
            word['start'] = min(item['start'] for item in [*pending, word])
            word['editorialGroup'] = True
            pending = []
        if word['end'] <= word['start']:
            pending.append(word)
            audit['zeroDurationGroups'] += 1
            continue
        if grouped and word['start'] < grouped[-1]['end']:
            previous = grouped[-1]
            previous['text'] += ' ' + word['text']
            previous['end'] = max(previous['end'], word['end'])
            previous['editorialGroup'] = True
            audit['overlapGroups'] += 1
        else:
            grouped.append(word)
    if pending:
        if not grouped:
            raise ValueError('Entire row lacks a positive acoustic span')
        grouped[-1]['text'] += ' ' + ' '.join(word['text'] for word in pending)
        grouped[-1]['editorialGroup'] = True
    result = []
    for word in grouped:
        normalized = key(word['text'])
        item = {'text': word['text'], 'start': round(word['start'], 3), 'end': round(word['end'], 3)}
        confirmed = any(other_file != word.get('recognitionSource') and
                        key(other['text']) == normalized and other.get('probability', 0) >= .6 and
                        other['end'] > other['start'] and
                        abs(other['start'] - word['start']) <= .45 and abs(other['end'] - word['end']) <= .6
                        for other_file, other in confirmations.get(normalized, []))
        eligible = (not spoken and not word.get('editorialGroup') and word.get('probability', 0) >= .85
                    and .08 <= word['end'] - word['start'] <= 1.3 and normalized not in EXPLICIT | ADLIBS
                    and ' ' not in word['text'] and '[unclear]' not in word['text'] and confirmed)
        item['challengeEligible'] = eligible
        for entry in vocabulary:
            lexical = set(key(token) for token in entry['word'].split())
            if normalized == key(entry['word']) or normalized == entry['id'] or (len(normalized) > 3 and normalized in lexical):
                item['vocabularyId'] = entry['id']
                break
        result.append(item)
    return result

reports = []
for track, teaching in CURRICULUM.items():
    if len(sys.argv) > 1 and track not in sys.argv[1:]:
        continue
    folder = STORE / track
    review = load(folder / 'editorial.json')
    transcript = load(folder / review['transcript'])
    imported = load(folder / 'import.json')
    duration = round(imported['duration'], 3)
    confirmations = {}
    for filename in ['transcript.json', 'transcript-strong.json', 'transcript-medium.en.json']:
        recognition = folder / filename
        if not recognition.is_file():
            continue
        for segment in load(recognition)['segments']:
            for word in segment['words']:
                confirmations.setdefault(key(word['text']), []).append((recognition.name, word))
    audit = {'id': track, 'sourceRecognition': transcript['method'], 'correctedGroups': 0,
             'zeroDurationGroups': 0, 'overlapGroups': 0, 'omittedRows': review.get('omit', []), 'unclearRows': []}
    lines = []
    segments = [(index, source, review['transcript']) for index, source in enumerate(transcript['segments'])]
    for offset, supplement in enumerate(review.get('supplements', [])):
        index = len(transcript['segments']) + offset
        source = load(folder / supplement['transcript'])['segments'][supplement['index']]
        segments.append((index, source, supplement['transcript']))
        review['translations'][str(index)] = supplement['translation']
        if supplement.get('text'):
            review.setdefault('corrections', {})[str(index)] = supplement['text']
        if supplement.get('spoken'):
            review.setdefault('spoken', []).append(index)
    for index, source, recognition_source in sorted(segments, key=lambda item: item[1]['start']):
        if index in review.get('omit', []):
            continue
        replacement = review.get('anchors', {}).get(str(index))
        if replacement:
            source = load(folder / replacement['transcript'])['segments'][replacement['index']]
            recognition_source = replacement['transcript']
        if str(index) not in review['translations']:
            raise ValueError(f'{track}: missing translation at row {index}')
        correction = review.get('corrections', {}).get(str(index))
        original = [{**word, 'recognitionSource': recognition_source} for word in source['words']]
        words = corrected_words(original, correction, audit) if correction else original
        spoken = index in review.get('spoken', []) or any(source['start'] >= start and source['start'] < end for start, end in review.get('spokenRanges', []))
        words = anchored_words(words, duration, spoken, teaching['vocabulary'], audit, confirmations)
        text = ' '.join(word['text'] for word in words)
        if '[unclear]' in text:
            audit['unclearRows'].append(index)
        tip = ('Trecho falado do vídeo: acompanhe a compreensão; ele não entra nos desafios da música.' if spoken else
               'Ouça a ligação entre as palavras; abra o vocabulário para comparar o sentido com exemplos próprios.')
        if '[unclear]' in text:
            tip = 'A voz fica pouco nítida neste trecho. As palavras não confirmadas aparecem como [unclear] e não viram desafios.'
        line = {'id': f'line-{index + 1:03}', 'start': words[0]['start'], 'end': words[-1]['end'], 'text': text,
                'translation': review['translations'][str(index)], 'tip': tip, 'words': words}
        if lines and line['start'] < lines[-1]['end']:
            # Cross-row acoustic overlap represents one shared vocal span.
            previous = lines.pop()
            merged = anchored_words([*previous['words'], *line['words']], duration, True, teaching['vocabulary'], audit, confirmations)
            line = {**previous, 'end': merged[-1]['end'], 'text': ' '.join(word['text'] for word in merged),
                    'translation': previous['translation'] + ' ' + line['translation'], 'words': merged}
        lines.append(line)
    manifest = {'id': track, 'version': 'musify-1', 'title': imported['title'],
                'artist': 'Zuriel.' if track == 'out-of-order' else imported['artist'], 'level': imported['level'],
                'topic': teaching['topic'], 'duration': duration, 'source': f'/api/music/audio?trackId={track}',
                'rights': 'user-provided', 'published': False, 'lines': lines,
                'vocabulary': teaching['vocabulary'], 'questions': teaching['questions']}
    if (folder / 'video.mp4').is_file() and not review.get('audioOnly'):
        manifest['visualSource'] = f'/api/music/video?trackId={track}'
    (folder / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    audit.update(lines=len(lines), words=sum(len(line['words']) for line in lines),
                 challengeWords=sum(word['challengeEligible'] for line in lines for word in line['words']), duration=duration)
    reports.append(audit)
    print(f"{track}: {audit['lines']} reviewed lines; {audit['challengeWords']} clear challenge words; {len(audit['unclearRows'])} uncertain rows")
(STORE / 'musify-review-audit.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
