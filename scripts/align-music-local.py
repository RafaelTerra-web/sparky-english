"""Local-only timing diagnostic. Downloads model weights, never uploads audio."""
import json
import sys
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio
from faster_whisper.tokenizer import Tokenizer

model = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=4)
from pathlib import Path
lab = Path(__file__).resolve().parent.parent / ".music-lab"
with open(lab / "config.json", encoding="utf-8") as config_file:
    config = json.load(config_file)
audio = decode_audio(sys.argv[1] if len(sys.argv) > 1 else config["audioPath"], sampling_rate=16000)
tokenizer = Tokenizer(model.hf_tokenizer, model.model.is_multilingual, task="transcribe", language="en")
with open(sys.argv[2] if len(sys.argv) > 2 else lab / "manifest.json", encoding="utf-8") as source:
    manifest = json.load(source)
# Windows established by a first local transcription pass. Keeping the known
# text prevents the recognizer from replacing lyrics with similar-sounding words.
windows = [(1.66, 9.5), (9.7, 13.3), (13.3, 16.8), (16.8, 24.7),
           (24.7, 31.5), (31.5, 36.45), (36.45, 40.3), (40.3, 47.7)]
for line, (start, end) in zip(manifest["lines"], windows):
    samples = audio[round(start * 16000):round(end * 16000)]
    features = model.feature_extractor(samples)
    encoded = model.encode(features)
    words = model.find_alignment(tokenizer, [tokenizer.encode(" " + line["text"])],
                                 encoded, round(len(samples) / 160))[0]
    print(json.dumps({"id": line["id"], "words": [
        {"text": w["word"].strip(), "start": round(start + float(w["start"]), 3),
         "end": round(start + float(w["end"]), 3)} for w in words]}), flush=True)
