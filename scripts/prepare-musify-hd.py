"""Create reviewed silent 900p video assets from the untouched 1080p sources.

Requires av and imageio-ffmpeg. Files and the provenance report stay private;
the release ledger and fingerprints are updated only after review.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import subprocess
import time

import av
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
SOURCES = {
    'still-into-you': 'Paramore Still Into You [OFFICIAL VIDEO].mp4',
    'do-i-wanna-know': 'Arctic Monkeys - Do I Wanna Know (Official Video).mp4',
    'she-knows': 'J. Cole - She Knows (Explicit Video) ft. Amber Coffman, Cults.mp4',
    'savage': 'Megan Thee Stallion - Savage [Official Audio].mp4',
    'king-for-a-day': 'Pierce The Veil - King for a Day ft. Kellin Quinn.mkv',
    'stay-at-your-house-local': 'Cyberpunk Edgerunners AMV - I Really Want to Stay at Your House by Rosa Walton & Hallie Coggins-1920x1080-avc1-mp4a.mp4',
}

def fingerprint(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()

def describe(path):
    with av.open(str(path)) as container:
        video = container.streams.video[0]
        return {'width': video.width, 'height': video.height, 'codec': video.codec_context.name,
                'fps': str(video.average_rate), 'duration': container.duration / av.time_base,
                'audioStreams': len(container.streams.audio), 'bytes': path.stat().st_size}

def prepare(track, source_directory, download_directory, encoder, rebuild):
    name = SOURCES[track]
    source = (download_directory if track == 'stay-at-your-house-local' else source_directory) / name
    original = describe(source)
    if original['height'] < 900:
        raise ValueError(f'{track}: source lacks native 900p detail; do not upscale silently')
    with av.open(str(source)) as container:
        rate = min(container.streams.video[0].average_rate, 30)
    folder = ROOT / '.music-assets/musify-video-900p-1'
    folder.mkdir(parents=True, exist_ok=True)
    target, report_path = folder / f'{track}.mp4', folder / f'{track}.json'
    source_hash = fingerprint(source)
    if target.exists():
        report = json.loads(report_path.read_text('utf8'))
        if report['sourceSha256'] != source_hash or report['sha256'] != fingerprint(target):
            raise ValueError(f'{track}: existing reviewed asset differs')
        if not rebuild:
            return report
    temporary = folder / f'{track}.partial.mp4'
    command = [imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error', '-y']
    if encoder == 'gpu':
        command += ['-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda']
    command += ['-i', str(source), '-map', '0:v:0', '-an', '-sn', '-dn', '-map_metadata', '-1']
    if encoder == 'gpu':
        command += ['-vf', 'scale_cuda=1600:900:interp_algo=lanczos', '-c:v', 'h264_nvenc',
                    '-preset', 'p5', '-tune', 'hq', '-rc', 'vbr', '-cq', '19', '-b:v', '0']
    else:
        command += ['-vf', 'scale=1600:900:flags=lanczos', '-c:v', 'libx264',
                    '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p']
    command += ['-r', str(rate), '-fps_mode', 'cfr', '-g', str(round(float(rate) * 2)),
                '-maxrate', '4M', '-bufsize', '8M', '-profile:v', 'main', '-level:v', '4.0',
                '-movflags', '+faststart', str(temporary)]
    started = time.perf_counter()
    print(f'{track}: encoding native 1080p source to silent 1600x900 H.264', flush=True)
    result = subprocess.run(command, capture_output=True, text=True,
                            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if result.returncode:
        raise RuntimeError(f'{track}: encoder failed: {result.stderr[-1200:]}')
    prepared = describe(temporary)
    if prepared['height'] != 900 or prepared['width'] != 1600 or prepared['codec'] != 'h264' or prepared['audioStreams']:
        raise ValueError(f'{track}: incompatible output')
    if abs(prepared['duration'] - original['duration']) > .15:
        raise ValueError(f'{track}: video timeline changed')
    if target.resolve().parent != folder.resolve():
        raise ValueError('Output escaped the private HD asset directory')
    temporary.replace(target)
    report = {'id': track, 'source': name, 'sourceSha256': source_hash, 'sourceMetadata': original,
              **prepared, 'sha256': fingerprint(target), 'encoder': encoder,
              'quality': 19, 'maximumBitrate': 4000000, 'gopSeconds': 2, 'fastStart': True,
              'processingSeconds': round(time.perf_counter() - started, 2)}
    report_path.write_text(json.dumps(report, indent=2) + '\n', 'utf8')
    print(f'{track}: reviewed {prepared["width"]}x{prepared["height"]}, {prepared["bytes"]} bytes in {report["processingSeconds"]}s', flush=True)
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-directory', type=Path, default=Path('C:/Users/rpta/Downloads/músicas atualização music lab'))
    parser.add_argument('--downloads-directory', type=Path, default=Path('C:/Users/rpta/Downloads'))
    parser.add_argument('--encoder', choices=['gpu', 'software'], default='gpu')
    parser.add_argument('--workers', type=int, default=2)
    parser.add_argument('--rebuild', action='store_true', help='Replace only this unpublished generated HD bundle')
    args = parser.parse_args()
    with ThreadPoolExecutor(max_workers=max(1, min(2, args.workers))) as pool:
        jobs = [pool.submit(prepare, track, args.source_directory, args.downloads_directory, args.encoder, args.rebuild) for track in SOURCES]
        results = [job.result() for job in jobs]
    (ROOT / '.music-assets/musify-video-900p-1/report.json').write_text(json.dumps(results, indent=2) + '\n', 'utf8')
