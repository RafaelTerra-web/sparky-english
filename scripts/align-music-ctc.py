"""Independent local acoustic alignment; reports only, never edits the manifest."""
import json
import re
from pathlib import Path
import numpy as np
import torch
import torchaudio
from faster_whisper.audio import decode_audio

torch.set_num_threads(4)
lab = Path(__file__).resolve().parent.parent / '.music-lab'
config = json.loads((lab / 'config.json').read_text(encoding='utf-8'))
manifest = json.loads((lab / 'manifest.json').read_text(encoding='utf-8'))
audio = decode_audio(config['audioPath'], sampling_rate=16000)
bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
model = bundle.get_model()
labels = {label: i for i, label in enumerate(bundle.get_labels())}
windows = [(0, 9.5), (9.5, 13.3), (13.3, 16.8), (16.8, 24.7),
           (24.7, 31.5), (31.5, 36.45), (36.45, 40.3), (40.3, 47.7)]
for line, (start, end) in zip(manifest['lines'], windows):
    samples = audio[round(start * 16000):round(end * 16000)]
    with torch.inference_mode():
        emissions, _ = model(torch.from_numpy(samples).unsqueeze(0))
    logp = emissions[0].log_softmax(-1).numpy()
    words = [re.sub("[^A-Z']", '', w['text'].upper()).strip("'") for w in line['words']]
    transcript = '|'.join(words)
    tokens = [labels[c] for c in transcript]
    states = np.zeros(2 * len(tokens) + 1, dtype=int)
    states[1::2] = tokens
    previous = np.full(len(states), -np.inf)
    previous[0] = logp[0, 0]
    previous[1] = logp[0, states[1]]
    back = np.zeros((len(logp), len(states)), dtype=np.int8)
    skip_allowed = (states != 0) & (states != np.roll(states, 2))
    skip_allowed[:2] = False
    for frame in range(1, len(logp)):
        one = np.roll(previous, 1); one[0] = -np.inf
        two = np.roll(previous, 2); two[~skip_allowed] = -np.inf
        options = np.stack([previous, one, two])
        back[frame] = options.argmax(axis=0)
        previous = options.max(axis=0) + logp[frame, states]
    state = len(states) - 1 if previous[-1] >= previous[-2] else len(states) - 2
    path = np.zeros(len(logp), dtype=int)
    for frame in range(len(logp)-1, -1, -1):
        path[frame] = state
        state -= back[frame, state]
    ratio = len(samples) / 16000 / len(logp)
    result = []
    char_index = 0
    for original, word in zip(line['words'], words):
        frames = np.where((path >= 2 * char_index + 1) & (path <= 2 * (char_index + len(word)) - 1))[0]
        if not len(frames): raise RuntimeError('Unaligned word')
        result.append({'text': original['text'], 'start': round(start + frames[0] * ratio, 3),
                       'end': round(start + (frames[-1] + 1) * ratio, 3)})
        char_index += len(word) + 1
    print(json.dumps({'id': line['id'], 'words': result}), flush=True)
