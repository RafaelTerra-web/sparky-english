"""Locally re-recognize the complete user-supplied batch with stronger Whisper.

Recognized lyrics and word confidence stay in the ignored private asset store.
This script never changes source media or final editorial manifests.
"""
import argparse
import json
import os
from pathlib import Path
import time

ROOT = Path(__file__).resolve().parent.parent
DLL_HANDLES = []
for dll in (ROOT / ".music-lab" / "cuda-runtime").rglob("*.dll"):
    folder = str(dll.parent)
    if folder not in os.environ.get("PATH", "").split(os.pathsep):
        os.environ["PATH"] = folder + os.pathsep + os.environ.get("PATH", "")
        if hasattr(os, "add_dll_directory"):
            DLL_HANDLES.append(os.add_dll_directory(folder))

from faster_whisper import WhisperModel
from faster_whisper.utils import download_model

parser = argparse.ArgumentParser()
parser.add_argument("--model", default="large-v3-turbo")
parser.add_argument("--device", default="cuda")
parser.add_argument("--download-only", action="store_true")
parser.add_argument("--track", action="append")
parser.add_argument("--clip", help="Optional real media interval, start,end in seconds; saves a separate recognition file")
args = parser.parse_args()
model_path = download_model(args.model)
if args.download_only:
    print(f"Downloaded {args.model}", flush=True)
    raise SystemExit(0)

print(f"Loading {args.model} on {args.device}", flush=True)
model = WhisperModel(model_path, device=args.device, compute_type="int8_float16" if args.device == "cuda" else "int8", cpu_threads=4)
for track in args.track or ["still-into-you", "do-i-wanna-know", "she-knows", "made-for-loving-you", "savage", "out-of-order", "king-for-a-day"]:
    folder = ROOT / ".music-assets" / track
    suffix = "strong" if args.model == "large-v3-turbo" else args.model
    clip_suffix = '-clip-' + args.clip.replace(',', '-') if args.clip else ''
    target = folder / f"transcript-{suffix}{clip_suffix}.json"
    if target.is_file():
        print(f"{track}: strong transcript already saved", flush=True)
        continue
    started = time.monotonic()
    segments, info = model.transcribe(str(folder / "transcribe.wav"), language="en", task="transcribe", word_timestamps=True,
        beam_size=8, vad_filter=False, condition_on_previous_text=False, hallucination_silence_threshold=2,
        clip_timestamps=args.clip or '0',
        initial_prompt="English music vocals. Transcribe the audible sung or spoken words; do not invent words during instrumental passages.")
    rows = []
    for segment in segments:
        words = [{"text": word.word.strip(), "start": round(word.start, 3), "end": round(word.end, 3),
                  "probability": round(word.probability, 3)} for word in segment.words if word.word.strip()]
        if words:
            rows.append({"start": round(segment.start, 3), "end": round(segment.end, 3), "text": segment.text.strip(), "words": words,
                         "noSpeechProbability": round(segment.no_speech_prob, 3), "averageLogProbability": round(segment.avg_logprob, 3)})
            print(f"{track}: {segment.end:.1f}s recognized", flush=True)
    output = {"id": track, "duration": info.duration, "method": f"faster-whisper-{args.model}-{args.device}-word-timestamps",
              "elapsedSeconds": round(time.monotonic() - started, 2), "segments": rows}
    target.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{track}: {len(rows)} lines in {output['elapsedSeconds']}s", flush=True)
