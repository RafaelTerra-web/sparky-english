"""Inspect private recognition rows without copying the lyric corpus into Git."""
import json
import os
from pathlib import Path
import sys

root = Path(__file__).resolve().parent.parent
for track in sys.argv[1:]:
    folder = root / ".music-assets" / track
    strong = folder / os.environ.get("SPARKY_REVIEW_TRANSCRIPT", "transcript-strong.json")
    transcript = json.loads((strong if strong.is_file() else folder / "transcript.json").read_text(encoding="utf-8"))
    print(f"TRACK {track}; {transcript['method']}; {transcript['duration']:.2f}s")
    for index, row in enumerate(transcript["segments"]):
        uncertain = sum(word.get("probability", 0) < .65 or word["end"] <= word["start"] for word in row["words"])
        print(f"{index:02} {row['start']:7.2f}-{row['end']:7.2f} [{uncertain} uncertain] {row['text']}")
