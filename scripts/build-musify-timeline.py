"""Build Musify 1.2 visual timing from the approved private audio, not a BPM grid.

Install requirements-musify-timeline.txt in an ignored virtual environment. The
output contains hashes, timings, and concept tags only; no audio or lyric lines.
Editorial boundaries below were checked against the published word timestamps.
Use --check to validate a release without writing the generated TypeScript.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import av
import librosa
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RATE = 22050
HOP = 256  # 11.6 ms analysis resolution, rather than the former 250 ms RMS heuristic.
VERSION = 1

# [media start, kind, localized editorial label, visual intensity]. These are
# version-specific boundaries: music video dialogue shifts the source timings.
TRACKS = {
    'perfect-local': {
        'folder': '', 'regions': [(0, None)],
        'sections': [(0,'intro','Introdução',.22),(3.046,'verse','Verso 1',.38),(31.84,'build','Pré-refrão',.55),(61.66,'chorus','Refrão',.78),(94.82,'instrumental','Interlúdio',.4),(98.24,'verse','Verso 2',.45),(130.38,'build','Pré-refrão',.62),(160.1,'chorus','Refrão',.85),(193.86,'instrumental','Instrumental',.5),(207.6,'chorus','Refrão final',.9),(246.48,'outro','Final',.2)],
        'cue_words': [('dance',['dancing'],['dance','dancing','dancar','dancando'],7),('warmth',['perfect'],['perfect','perfeito','perfeita'],5),('orbits',['arms'],['arms','bracos'],5)],
    },
    'heartless-local': {
        'folder': 'heartless', 'regions': [(0, None)],
        'sections': [(0,'intro','Introdução',.25),(5.42,'narrative','Narrativa',.4),(30.56,'chorus','Refrão',.78),(59.9,'verse','Verso 2',.52),(84.3,'build','Pré-refrão',.72),(96.72,'chorus','Refrão',.88),(126.32,'narrative','Diálogo',.3),(163.68,'instrumental','Interlúdio',.65),(180.36,'chorus','Refrão final',1),(213.06,'outro','Final',.24)],
        'cue_words': [('mirrors',['heartless'],['heartless','semcoracao','cruel'],7),('fracture',['broke','betrayed'],['broke','broken','betrayed','quebrou','traida','traido'],5),('spark',['sparkles'],['sparkle','sparkles','brilha','brilho'],4)],
    },
    'stay-at-your-house-local': {
        'folder': 'stay-at-your-house', 'regions': [(0, None)],
        'sections': [(0,'intro','Introdução',.25),(.7,'verse','Verso 1',.45),(30.4,'build','Pré-refrão',.66),(59.8,'chorus','Refrão',.88),(90.7,'instrumental','Interlúdio',.58),(100.3,'verse','Verso 2',.5),(128.9,'chorus','Refrão',.92),(159.96,'instrumental','Ponte',.48),(175.92,'build','Pré-refrão final',.75),(209.2,'chorus','Refrão final',1),(240.5,'outro','Final',.25)],
        'cue_words': [('city',['house'],['house','casa'],6),('neon',['rainbow'],['rainbow','arcoiris'],5),('connection',['stay'],['stay','ficar'],5),('fracture',['apart'],['apart','separado','pedacos'],4)],
    },
    'buttercup-local': {
        'folder': 'buttercup-local', 'regions': [(0, None)],
        'sections': [(0,'intro','Introdução',.3),(18.24,'verse','Verso 1',.45),(34.76,'build','Pré-refrão',.63),(48.18,'chorus','Refrão',.82),(82,'verse','Verso 2',.48),(97.86,'build','Pré-refrão',.7),(112.52,'chorus','Refrão final',.9),(136,'instrumental','Instrumental',.6),(190,'outro','Final',.22)],
        'cue_words': [('spark',['electrify','sparking'],['electrify','electrifies','sparking','eletrificar','eletrifique','faisca'],5),('flowers',['buttercup'],['buttercup','flor','ranunculo'],5),('sun',['sun','golden'],['sun','golden','sol','dourado'],5)],
    },
    'still-into-you': {
        'folder': 'still-into-you', 'regions': [(0, None)],
        'sections': [(0,'intro','Introdução',.35),(11.7,'verse','Verso 1',.52),(38.5,'build','Pré-refrão',.7),(45.5,'chorus','Refrão',.9),(73.3,'instrumental','Interlúdio',.58),(79.46,'verse','Verso 2',.6),(105.7,'build','Pré-refrão',.78),(112.52,'chorus','Refrão',.96),(140.04,'instrumental','Interlúdio',.67),(153.64,'build','Ponte',.72),(179.96,'chorus','Refrão final',1),(214.1,'outro','Final',.35)],
        'cue_words': [('butterflies',['butterflies'],['butterfly','butterflies','borboleta','borboletas'],7),('ribbons',['interlock'],['interlock','interlocked','entrelacar','entrelacam'],5),('warmth',['loved','forever'],['loved','love','forever','amava','amor','sempre'],5)],
    },
    'do-i-wanna-know': {
        'folder': 'do-i-wanna-know', 'regions': [(0, None)],
        'sections': [(0,'intro','Introdução',.38),(30,'verse','Verso 1',.48),(71.9,'build','Pré-refrão',.66),(94.98,'chorus','Refrão',.86),(119.92,'verse','Verso 2',.53),(162.22,'build','Pré-refrão',.74),(184.64,'chorus','Refrão',.93),(209.88,'build','Ponte',.76),(229.92,'chorus','Refrão final',1),(249.6,'outro','Final',.33)],
        'cue_words': [('waves',['flows'],['flows','flow','flui','fluem'],6),('midnight',['nights','night','asleep'],['night','nights','asleep','noite','noites','dormir'],6),('connection',['calling','together'],['calling','call','together','ligar','juntos'],5)],
    },
    'she-knows': {
        'folder': 'she-knows',
        # The imported MV has scene dialogue before the first musical verse and
        # a prayer after the song. Neither may manufacture rhythmic impacts.
        'regions': [(48, 265)],
        'sections': [(0,'intro','Introdução',.2),(15.84,'narrative','Cena de abertura',.18),(48,'instrumental','Entrada da música',.45),(49.44,'verse','Verso 1',.5),(80.92,'chorus','Refrão',.82),(96.72,'chorus','Refrão cantado',.9),(114.44,'verse','Verso 2',.6),(146.28,'chorus','Refrão',.86),(162.52,'chorus','Refrão cantado',.95),(178.8,'verse','Verso 3',.68),(219.92,'instrumental','Interlúdio',.54),(231.42,'chorus','Refrão final',1),(262.58,'outro','Final da música',.3),(308.42,'narrative','Cena final',.16)],
        'cue_words': [('shadows',['knows'],['knows','know','sabe','sabem'],5),('secrets',['creep','fire'],['creep','fire','esgueirar','fogo'],5),('fracture',['burn','burns','burning'],['burn','burns','burning','queimar','queimam'],4)],
    },
    'made-for-loving-you': {
        'folder': 'made-for-loving-you', 'regions': [(20, None)],
        'sections': [(0,'narrative','Cena de abertura',.16),(20,'intro','Introdução musical',.42),(45.88,'verse','Verso 1',.58),(64.56,'build','Pré-refrão',.76),(73.92,'chorus','Refrão',.9),(89.3,'verse','Verso 2',.6),(110.02,'build','Pré-refrão',.8),(118.72,'chorus','Refrão duplo',.97),(152.56,'build','Ponte',.7),(172.4,'instrumental','Solo',.8),(221.5,'chorus','Refrão final',1)],
        'cue_words': [('spotlight',['tonight'],['tonight','hoje','noite'],6),('disco',['loving','magic'],['loving','love','magic','amor','magia'],5)],
    },
    'savage': {
        'folder': 'savage', 'regions': [(0, None)],
        'sections': [(0,'intro','Introdução',.3),(1.6,'narrative','Declaração',.48),(10.8,'verse','Verso 1',.65),(33.38,'chorus','Refrão',.9),(56.68,'verse','Verso 2',.7),(78.86,'chorus','Refrão',.97),(101.34,'verse','Verso 3',.8),(129.44,'instrumental','Instrumental',.65),(141.48,'outro','Final',.3)],
        'cue_words': [('facets',['savage','classy'],['savage','classy','selvagem','elegante'],4),('strike',['match','lit'],['match','lit','fosforo','acesa'],5),('confidence',['exclusive','unbothered'],['exclusive','unbothered','exclusiva','despreocupada'],5)],
    },
    'out-of-order': {
        'folder': 'out-of-order', 'regions': [(0, None)],
        'sections': [(0,'intro','Introdução',.3),(18.18,'verse','Verso 1',.48),(32.26,'build','Pré-refrão',.66),(50.04,'chorus','Refrão',.84),(66.12,'verse','Verso 2',.55),(81.54,'build','Pré-refrão',.72),(99.64,'chorus','Refrão',.94),(116,'chorus','Refrão final',1),(132.3,'outro','Final',.28)],
        'cue_words': [('orbits',['connection'],['connection','conexao'],6),('magnet',['close','hold'],['close','closer','hold','perto','segurar'],5),('tension',['ego','pride','order'],['ego','pride','order','orgulho','ordem'],5)],
    },
    'king-for-a-day': {
        'folder': 'king-for-a-day', 'regions': [(60, None)],
        'sections': [(0,'intro','Introdução',.2),(17.28,'narrative','Cena de abertura',.18),(60,'instrumental','Entrada da banda',.75),(66.84,'verse','Verso 1',.66),(84.2,'build','Pré-refrão',.85),(101.54,'chorus','Refrão',.95),(118.78,'instrumental','Interlúdio',.76),(126.3,'verse','Verso 2',.72),(146.58,'build','Pré-refrão',.9),(161.96,'chorus','Refrão',1),(195.06,'instrumental','Ruptura',.85),(203.56,'build','Ponte',.88),(221,'instrumental','Instrumental',.9),(238.16,'verse','Verso final',.8),(256.66,'chorus','Refrão final',1),(289.96,'outro','Final',.35)],
        'cue_words': [('rupture',['revolution','war'],['revolution','war','revolucao','guerra'],6),('red',['red'],['red','vermelho'],5),('defiance',['king','scream','screaming'],['king','scream','screaming','rei','gritar','gritando'],5)],
    },
}


def decode_audio(path: Path) -> np.ndarray:
    """PyAV respects encoder priming; no ffmpeg CLI or browser DSP is required."""
    with av.open(str(path)) as container:
        resampler = av.AudioResampler(format='fltp', layout='mono', rate=RATE)
        frames = [part.to_ndarray().ravel() for frame in container.decode(audio=0) for part in resampler.resample(frame)]
        frames += [part.to_ndarray().ravel() for part in resampler.resample(None)]
    return np.concatenate(frames).astype(np.float32)


def detect_beats(audio: np.ndarray, regions: list[tuple[float, float | None]]) -> list[dict]:
    """Track the groove, then snap to detected attacks to avoid a drifting grid."""
    result = []
    for start, end in regions:
        stop = len(audio) / RATE if end is None else end
        samples = audio[round(start * RATE):round(stop * RATE)]
        if len(samples) < RATE:
            continue
        # Harmonic-percussive separation prevents held vocals becoming impacts.
        spectrum = librosa.stft(samples, n_fft=1024, hop_length=HOP)
        _, percussive = librosa.decompose.hpss(spectrum, kernel_size=17, margin=(2, 3))
        magnitude = np.abs(percussive)
        envelope = librosa.onset.onset_strength(S=librosa.amplitude_to_db(magnitude, ref=np.max), sr=RATE, hop_length=HOP, n_fft=1024)
        _, frames = librosa.beat.beat_track(onset_envelope=envelope, sr=RATE, hop_length=HOP, trim=True, tightness=70)
        onsets = librosa.onset.onset_detect(onset_envelope=envelope, sr=RATE, hop_length=HOP, units='frames', backtrack=False)
        scale = max(float(np.percentile(envelope, 95)), 1e-6)
        for frame in frames:
            # Pick the nearby transient, rather than visualizing an interpolated
            # silent beat. There is no assumption of a fixed tempo or bar size.
            candidates = onsets[np.abs(onsets - frame) <= round(.12 * RATE / HOP)]
            if not len(candidates):
                continue
            attack = int(candidates[np.argmin(np.abs(candidates - frame))])
            strength = float(np.clip(envelope[attack] / scale, 0, 1))
            if strength < .13:
                continue
            time = round(start + attack * HOP / RATE, 3)
            if result and time <= result[-1]['time'] + .1:
                continue
            result.append({'time': time, 'strength': round(.25 + strength * .75, 3), 'accent': strength >= .72})
    return result


def normalized(word: str) -> str:
    return ''.join(char for char in word.lower() if char.isalnum())


def word_cues(manifest: dict, definitions: list, duration: float) -> list[dict]:
    cues = []
    for line in manifest['lines']:
        for word in line['words']:
            token = normalized(word.get('text', ''))
            for kind, words, concepts, tail in definitions:
                if token not in words:
                    continue
                start = round(float(word['start']), 3)
                end = round(min(duration, float(word['end']) + tail), 3)
                cues.append({'start': start, 'end': end, 'kind': kind, 'concepts': concepts})
    # Do not coalesce duplicates: each occurrence has its own precise cue time.
    return sorted(cues, key=lambda cue: cue['start'])


def build_track(track_id: str, config: dict) -> tuple[dict, dict]:
    directory = ROOT / '.music-assets' / config['folder']
    audio_path = directory / 'audio.mp3'
    manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf8'))
    audio = decode_audio(audio_path)
    duration = round(len(audio) / RATE, 3)
    if abs(duration - float(manifest['duration'])) > .1:
        raise ValueError(f'{track_id}: decoded duration does not match the approved manifest')
    starts = config['sections']
    sections = [{'start': start, 'end': starts[index + 1][0] if index + 1 < len(starts) else duration,
                 'kind': kind, 'label': label, 'intensity': intensity}
                for index, (start, kind, label, intensity) in enumerate(starts)]
    if any(section['start'] >= section['end'] for section in sections):
        raise ValueError(f'{track_id}: unordered editorial sections')
    beats = detect_beats(audio, config['regions'])
    cues = word_cues(manifest, config['cue_words'], duration)
    timeline = {'version': VERSION, 'audioSha256': hashlib.sha256(audio_path.read_bytes()).hexdigest(),
                'duration': duration, 'sections': sections, 'beats': beats, 'cues': cues}
    audit = {'id': track_id, 'duration': duration, 'beats': len(beats), 'cues': len(cues),
             'choruses': [section['start'] for section in sections if section['kind'] == 'chorus'],
             'firstBeat': beats[0]['time'] if beats else None, 'lastBeat': beats[-1]['time'] if beats else None}
    return timeline, audit


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', '--verify', action='store_true', help='Compare generated data without writing files')
    parser.add_argument('--track', choices=list(TRACKS), help='Analyze a single track without publishing incomplete data')
    args = parser.parse_args()
    if librosa.__version__ != '0.11.0':
        raise RuntimeError('Use the pinned librosa 0.11.0 offline environment')
    data = {}
    audit = []
    for track_id, config in TRACKS.items():
        if args.track and args.track != track_id:
            continue
        timeline, report = build_track(track_id, config)
        data[track_id] = timeline
        audit.append(report)
        print(json.dumps(report), flush=True)
    output = '// Generated by scripts/build-musify-timeline.py. No audio or lyric lines.\n'
    output += "import type { MusicVisualTimeline } from './music-visual-timeline.ts';\n"
    output += 'export const musicVisualData: Record<string, MusicVisualTimeline> = '
    output += json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    destination = ROOT / 'src/lib/music-visual-data.ts'
    if args.check:
        if not args.track and destination.read_text(encoding='utf8') != output:
            raise ValueError('Generated visual timing differs from the approved release; review before writing')
    elif not args.track:
        destination.write_text(output, encoding='utf8')
    if not args.check:
        (ROOT / '.music-lab' / 'musify-visual-audit.json').write_text(json.dumps(audit, indent=2), encoding='utf8')


if __name__ == '__main__':
    main()
