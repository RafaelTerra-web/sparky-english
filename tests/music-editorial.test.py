"""Exercise editorial anchors using original neutral fixtures, without song data."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

FINALIZER = Path(__file__).resolve().parent.parent / 'scripts' / 'review-musify-finalize.py'


class EditorialAnchorTests(unittest.TestCase):
    def make_manifest(self, words, correction=None, spoken=False, confirmation=True):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            scripts = root / 'scripts'
            scripts.mkdir()
            shutil.copy(FINALIZER, scripts / FINALIZER.name)
            store = root / '.music-assets'
            track = store / 'fixture'
            track.mkdir(parents=True)
            write = lambda path, value: path.write_text(json.dumps(value), encoding='utf-8')
            write(store / 'musify-curriculum.json', {'fixture': {
                'topic': 'Original neutral fixture',
                'vocabulary': [{'id': 'bread', 'word': 'bread'}],
                'questions': [{'id': 'question'}],
            }})
            transcript = {'method': 'fixture-recognition', 'segments': [{
                'start': words[0]['start'], 'end': words[-1]['end'],
                'text': ' '.join(word['text'] for word in words), 'words': words,
            }]}
            write(track / 'transcript.json', transcript)
            if confirmation:
                write(track / 'transcript-strong.json', transcript)
            write(track / 'import.json', {'duration': 10, 'title': 'Fixture', 'artist': 'Fixture', 'level': 'A1'})
            write(track / 'editorial.json', {
                'transcript': 'transcript.json', 'translations': {'0': 'Exemplo original.'},
                'corrections': {'0': correction} if correction else {}, 'spoken': [0] if spoken else [],
            })
            result = subprocess.run([sys.executable, str(scripts / FINALIZER.name)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            return json.loads((track / 'manifest.json').read_text(encoding='utf-8'))

    def words(self, *tokens):
        return [{'text': token, 'start': index, 'end': index + .4, 'probability': .99}
                for index, token in enumerate(tokens)]

    def test_insertions_keep_text_and_real_anchor(self):
        result = self.make_manifest(self.words('Bread', 'smells', 'good'), 'Fresh bread smells very good')
        line = result['lines'][0]
        self.assertEqual(line['text'], 'Fresh bread smells very good')
        self.assertEqual([(word['start'], word['end']) for word in line['words']], [(0, .4), (1, 1.4), (2, 2.4)])
        self.assertFalse(line['words'][0]['challengeEligible'])
        self.assertFalse(line['words'][1]['challengeEligible'])

    def test_replacement_is_one_ineligible_acoustic_group(self):
        result = self.make_manifest(self.words('Bread', 'and', 'tea'), 'Bread and warm coffee')
        word = result['lines'][0]['words'][-1]
        self.assertEqual((word['text'], word['start'], word['end']), ('warm coffee', 2, 2.4))
        self.assertFalse(word['challengeEligible'])

    def test_zero_length_and_overlap_never_become_candidates(self):
        words = self.words('Bread', 'warm', 'toast', 'smells')
        words[1]['end'] = words[1]['start']
        words[3]['start'] = 2.2
        result = self.make_manifest(words)
        actual = result['lines'][0]['words']
        self.assertEqual([word['text'] for word in actual], ['Bread', 'warm toast smells'])
        self.assertFalse(actual[-1]['challengeEligible'])
        self.assertTrue(all(word['end'] > word['start'] for word in actual))

    def test_spoken_and_unconfirmed_words_are_ineligible(self):
        spoken = self.make_manifest(self.words('Bread', 'smells', 'good'), spoken=True)
        unconfirmed = self.make_manifest(self.words('Bread', 'smells', 'good'), confirmation=False)
        for lesson in [spoken, unconfirmed]:
            self.assertTrue(all(not word['challengeEligible'] for line in lesson['lines'] for word in line['words']))

    def test_confirmed_unchanged_words_keep_exact_timing(self):
        lesson = self.make_manifest(self.words('Bread', 'smells', 'good'))
        words = lesson['lines'][0]['words']
        self.assertTrue(all(word['challengeEligible'] for word in words))
        self.assertEqual([(word['start'], word['end']) for word in words], [(0, .4), (1, 1.4), (2, 2.4)])


if __name__ == '__main__':
    unittest.main()
