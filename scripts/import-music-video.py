"""Prepare a user-provided music video locally for the private Music Lab bundle.

The source never leaves this machine. It creates a quiet MP3, a cover frame,
the private video copy, and a word-timestamp transcript for editorial review.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

import av
import numpy as np
from faster_whisper import WhisperModel

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("--id", required=True)
parser.add_argument("--cover-at", type=float, default=.5, help="Fraction of the video used for the cover still")
args = parser.parse_args()

root = Path(__file__).resolve().parent.parent
source = args.source.resolve()
target = root / ".music-assets" / args.id
target.mkdir(parents=True, exist_ok=True)
if not source.is_file():
    raise FileNotFoundError(source)

audio_path = target / "audio.mp3"
video_path = target / "video.mp4"
cover_path = root / "public" / "music" / "covers" / f"{args.id}.png"
cover_path.parent.mkdir(parents=True, exist_ok=True)

# Encode an independent audio file at a stable, mobile-friendly rate.
with av.open(str(source)) as input_file, av.open(str(audio_path), "w") as output_file:
    audio_stream = output_file.add_stream("libmp3lame", rate=48000)
    audio_stream.bit_rate = 128000
    audio_stream.layout = "stereo"
    for frame in input_file.decode(audio=0):
        for packet in audio_stream.encode(frame):
            output_file.mux(packet)
    for packet in audio_stream.encode(None):
        output_file.mux(packet)

# Keep the supplied visual as the optional in-game atmosphere.
shutil.copy2(source, video_path)

# A middle frame avoids cold openings and fades in supplied clips.
with av.open(str(source)) as input_file:
    video = input_file.streams.video[0]
    duration = float(input_file.duration / av.time_base) if input_file.duration else 0
    input_file.seek(int(duration * max(0, min(1, args.cover_at)) * av.time_base), stream=video)
    frame = next(input_file.decode(video=0))
    image = frame.to_image()
    image.thumbnail((1280, 720))
    image.save(cover_path)

model = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=6)
segments, info = model.transcribe(
    str(source), language="en", word_timestamps=True, beam_size=5,
    vad_filter=False, condition_on_previous_text=False,
)
transcript = []
for segment in segments:
    words = [
        {"text": word.word.strip(), "start": round(word.start, 3), "end": round(word.end, 3), "probability": round(word.probability, 3)}
        for word in segment.words if word.word.strip()
    ]
    if words:
        transcript.append({"start": round(segment.start, 3), "end": round(segment.end, 3), "text": segment.text.strip(), "words": words})

(target / "transcript.json").write_text(json.dumps({
    "source": source.name,
    "duration": round(info.duration, 3),
    "segments": transcript,
}, ensure_ascii=False, indent=2), encoding="utf-8")
(target / "import.json").write_text(json.dumps({
    "source": str(source),
    "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "duration": round(info.duration, 3),
    "audio": str(audio_path.relative_to(root)),
    "video": str(video_path.relative_to(root)),
    "cover": str(cover_path.relative_to(root)),
}, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"duration": round(info.duration, 3), "segments": len(transcript), "audioBytes": audio_path.stat().st_size, "videoBytes": video_path.stat().st_size, "cover": str(cover_path)}, ensure_ascii=False))
