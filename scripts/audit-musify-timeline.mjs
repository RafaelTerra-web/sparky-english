import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MUSIC_VISUAL_VERSION, musicVisualTimeline } from '../src/lib/music-visual-timeline.ts';
import { musicVisualData } from '../src/lib/music-visual-data.ts';
import { musicReleases } from '../src/lib/music-release.ts';
import { approvedMusicFiles } from './verify-music-release.mjs';

const kinds = new Set(['intro', 'verse', 'build', 'chorus', 'narrative', 'instrumental', 'outro']);
export function auditMusicVisualTimelines() {
  assert.equal(Object.keys(musicVisualData).length, musicReleases.length, 'Every published song has a visual timeline');
  let beats = 0;
  let cues = 0;
  let sections = 0;
  for (const release of musicReleases) {
    const data = musicVisualTimeline(release.id);
    assert.ok(data, `${release.id}: missing visual timeline`);
    assert.equal(data.version, MUSIC_VISUAL_VERSION);
    assert.equal(data.audioSha256, approvedMusicFiles[release.audio], `${release.id}: visual timing must match approved audio`);
    assert.ok(Number.isFinite(data.duration) && data.duration > 0);
    assert.equal(data.sections[0].start, 0);
    assert.equal(data.sections.at(-1).end, data.duration);
    assert.ok(data.sections.some(section => section.kind === 'chorus'), `${release.id}: real refrain mapping required`);
    for (const [index, section] of data.sections.entries()) {
      assert.ok(kinds.has(section.kind));
      assert.ok(section.label && Number.isFinite(section.intensity) && section.intensity >= 0 && section.intensity <= 1);
      assert.ok(section.end > section.start);
      if (index) assert.equal(section.start, data.sections[index - 1].end, `${release.id}: no section gap or overlap`);
    }
    for (const [index, beat] of data.beats.entries()) {
      assert.ok(Number.isFinite(beat.time) && beat.time >= 0 && beat.time < data.duration);
      assert.ok(Number.isFinite(beat.strength) && beat.strength > 0 && beat.strength <= 1);
      assert.equal(typeof beat.accent, 'boolean');
      if (index) assert.ok(beat.time > data.beats[index - 1].time, `${release.id}: ordered unique attacks`);
    }
    assert.ok(data.beats.length >= 100, `${release.id}: decoded beat detection required`);
    for (const [index, cue] of data.cues.entries()) {
      assert.ok(cue.start >= 0 && cue.end > cue.start && cue.end <= data.duration && cue.kind && cue.concepts.length);
      assert.ok(cue.concepts.every(concept => typeof concept === 'string' && concept.length > 0));
      if (index) assert.ok(cue.start >= data.cues[index - 1].start);
    }
    beats += data.beats.length;
    cues += data.cues.length;
    sections += data.sections.length;
  }
  for (const [id, begin, end] of [['king-for-a-day', 0, 60], ['she-knows', 0, 48], ['she-knows', 265, 346.546], ['made-for-loving-you', 0, 20]]) {
    assert.ok(musicVisualTimeline(id).beats.every(beat => beat.time < begin || beat.time >= end), `${id}: dialogue cannot trigger impacts`);
  }
  return { tracks: musicReleases.length, sections, beats, cues, version: MUSIC_VISUAL_VERSION };
}

/** Local source verification is optional in CI: Vercel separately verifies approved private blobs. */
export async function verifyLocalVisualAudio(required = false) {
  for (const release of musicReleases) {
    let bytes;
    try { bytes = await readFile(resolve('.music-assets', release.audio)); }
    catch (error) {
      if (!required && error.code === 'ENOENT') continue;
      throw error;
    }
    assert.equal(createHash('sha256').update(bytes).digest('hex'), musicVisualTimeline(release.id).audioSha256, `${release.id}: local audio changed after visual review`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = auditMusicVisualTimelines();
  await verifyLocalVisualAudio(process.argv.includes('--required'));
  console.log('Musify visual timelines verified:', result);
}
