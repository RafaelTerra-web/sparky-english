"""Prepare/transcribe the user-supplied Musify batch locally, without editing sources.

Run with a Python environment containing av, numpy, faster-whisper and Pillow.
Private lyrics/media stay in .music-assets; only reviewed fingerprints enter Git.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import wave

import av
import numpy as np
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
TRACKS = [
    ('still-into-you', 'Paramore Still Into You [OFFICIAL VIDEO].mp4', 'Still Into You', 'Paramore', 'B1', 'joy'),
    ('do-i-wanna-know', 'Arctic Monkeys - Do I Wanna Know (Official Video).mp4', 'Do I Wanna Know?', 'Arctic Monkeys', 'B1', 'midnight'),
    ('she-knows', 'J. Cole - She Knows (Explicit Video) ft. Amber Coffman, Cults.mp4', 'She Knows', 'J. Cole feat. Amber Coffman & Cults', 'B2', 'suspense'),
    ('made-for-loving-you', 'KISS - I was made for loving you ; sub esp-1280x720-avc1-mp4a.mp4', 'I Was Made for Lovin’ You', 'KISS', 'A2', 'disco'),
    ('savage', 'Megan Thee Stallion - Savage [Official Audio].mp4', 'Savage', 'Megan Thee Stallion', 'B2', 'confidence'),
    ('out-of-order', 'Out Of Order.mp3', 'Out of Order', '', 'B1', 'dream'),
    ('king-for-a-day', 'Pierce The Veil - King for a Day ft. Kellin Quinn.mkv', 'King for a Day', 'Pierce The Veil feat. Kellin Quinn', 'B2', 'storm'),
]

def save_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')

def prepare_audio(source, target):
    with av.open(str(source)) as container:
        metadata = dict(container.metadata)
        resampler = av.AudioResampler(format='fltp', layout='stereo', rate=48000)
        frames = [out.to_ndarray() for frame in container.decode(audio=0) for out in resampler.resample(frame)]
        frames.extend(out.to_ndarray() for out in resampler.resample(None))
    samples = np.concatenate(frames, axis=1)
    peak = float(np.abs(samples).max())
    rms = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))
    gain = min(1, .055 / max(rms, 1e-8), .29 / max(peak, 1e-8))
    quiet = samples * gain
    with av.open(str(target / 'audio.mp3'), 'w') as output:
        stream = output.add_stream('libmp3lame', rate=48000)
        stream.bit_rate = 128000
        stream.layout = 'stereo'
        for start in range(0, quiet.shape[1], 48000):
            frame = av.AudioFrame.from_ndarray(quiet[:, start:start + 48000], format='fltp', layout='stereo')
            frame.sample_rate = 48000
            frame.pts = start
            frame.time_base = Fraction(1, 48000)
            for packet in stream.encode(frame): output.mux(packet)
        for packet in stream.encode(None): output.mux(packet)
    # Recognition copy retains source dynamics rather than the quiet playback gain.
    mono = (samples[0] + samples[1]) / 2
    with wave.open(str(target / 'transcribe.wav'), 'wb') as output:
        output.setnchannels(1); output.setsampwidth(2); output.setframerate(16000)
        output.writeframes(np.round(np.clip(mono[::3], -1, 1) * 32767).astype('<i2').tobytes())
    return {'duration': samples.shape[1] / 48000, 'sourcePeak': peak, 'playbackGain': gain,
            'playbackPeak': peak * gain, 'playbackRms': rms * gain, 'metadata': metadata}

def prepare_video(source, target, track_id):
    with av.open(str(source)) as container:
        if not container.streams.video: return False
    # Stream a silent 640px H.264 atmosphere, with real timestamps and byte-range support.
    with av.open(str(source)) as container, av.open(str(target / 'video.mp4'), 'w', options={'movflags': '+faststart'}) as output:
        original = container.streams.video[0]
        width = 640
        height = int(round(original.height * width / original.width / 2) * 2)
        stream = output.add_stream('libx264', rate=24)
        stream.width = width; stream.height = height; stream.pix_fmt = 'yuv420p'
        stream.options = {'crf': '29', 'preset': 'veryfast'}
        previous = -1
        cover_at = float(container.duration / av.time_base) * .4
        saved_cover = False
        for frame in container.decode(video=0):
            seconds = float(frame.time or 0)
            if not saved_cover and seconds >= cover_at:
                cover = frame.to_image(); cover.thumbnail((960, 540))
                cover.save(ROOT / 'public/music/covers' / f'{track_id}.webp', 'WEBP', quality=85)
                saved_cover = True
            pts = round(seconds * 24)
            if pts <= previous: continue
            previous = pts
            resized = frame.reformat(width=width, height=height, format='yuv420p')
            resized.pts = pts; resized.time_base = Fraction(1, 24)
            for packet in stream.encode(resized): output.mux(packet)
        for packet in stream.encode(None): output.mux(packet)
    return True

def import_track(track, source_directory, skip_video):
    track_id, name, title, artist, level, mood = track
    source = (source_directory / name).resolve()
    if not source.is_file(): raise FileNotFoundError(name)
    target = ROOT / '.music-assets' / track_id
    target.mkdir(parents=True, exist_ok=True)
    (ROOT / 'public/music/covers').mkdir(parents=True, exist_ok=True)
    report_path = target / 'import.json'
    report = json.loads(report_path.read_text(encoding='utf-8')) if report_path.is_file() else {}
    if not (target / 'audio.mp3').is_file():
        print(f'{track_id}: preparing playback audio', flush=True)
        report = prepare_audio(source, target)
        report.update(id=track_id, sourceName=name, sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                      title=title, artist=artist or report['metadata'].get('artist', ''), level=level, mood=mood)
        save_json(report_path, report)
    if not (target / 'transcript.json').is_file():
        print(f'{track_id}: transcribing locally', flush=True)
        model = WhisperModel('small.en', device='cpu', compute_type='int8', cpu_threads=4, local_files_only=True)
        segments, info = model.transcribe(str(target / 'transcribe.wav'), language='en', word_timestamps=True,
            beam_size=5, vad_filter=False, condition_on_previous_text=False, hallucination_silence_threshold=2)
        rows = []
        for segment in segments:
            words = [{'text': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3),
                      'probability': round(w.probability, 3)} for w in segment.words if w.word.strip()]
            if words:
                rows.append({'start': round(segment.start, 3), 'end': round(segment.end, 3),
                             'text': segment.text.strip(), 'words': words,
                             'noSpeechProbability': round(segment.no_speech_prob, 3)})
                print(f'{track_id}: recognized through {segment.end:.0f}s ({len(rows)} lines)', flush=True)
        save_json(target / 'transcript.json', {'id': track_id, 'duration': info.duration,
                  'method': 'faster-whisper-small.en-local-word-timestamps', 'segments': rows})
    # The KISS source has baked-in Spanish subtitles. The user requested audio only.
    if not skip_video and track_id != 'made-for-loving-you' and not (target / 'video.mp4').is_file():
        print(f'{track_id}: preparing silent video', flush=True)
        report['video'] = prepare_video(source, target, track_id)
        save_json(report_path, report)
    print(f'{track_id}: prepared for editorial review', flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-directory', type=Path, default=Path('C:/Users/rpta/Downloads/músicas atualização music lab'))
    parser.add_argument('--workers', type=int, default=2)
    parser.add_argument('--skip-video', action='store_true')
    args = parser.parse_args()
    with ThreadPoolExecutor(max_workers=max(1, min(3, args.workers))) as pool:
        futures = [pool.submit(import_track, track, args.source_directory, args.skip_video) for track in TRACKS]
        for future in futures: future.result()
