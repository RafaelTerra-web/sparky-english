import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MUSIC_VISUAL_VERSION, musicVisualTimeline, musicTimelineSectionAt,
  musicTimelineBeatAt, musicTimelineCueAt,
} from '../src/lib/music-visual-timeline.ts';
import { musicVisualData } from '../src/lib/music-visual-data.ts';
import { auditMusicVisualTimelines, verifyLocalVisualAudio } from '../scripts/audit-musify-timeline.mjs';

const firstChoruses = {
  'perfect-local': 61.66, 'heartless-local': 30.56, 'stay-at-your-house-local': 59.8,
  'buttercup-local': 48.18, 'still-into-you': 45.5, 'do-i-wanna-know': 94.98,
  'she-knows': 80.92, 'made-for-loving-you': 73.92, savage: 33.38,
  'out-of-order': 50.04, 'king-for-a-day': 101.54,
};

test('every released song has versioned timing tied to its approved audio fingerprint', async () => {
  const report = auditMusicVisualTimelines();
  assert.equal(report.tracks, 11);
  assert.equal(report.version, MUSIC_VISUAL_VERSION);
  assert.ok(report.beats > 3000);
  assert.deepEqual(Object.keys(musicVisualData).sort(), Object.keys(firstChoruses).sort());
  await verifyLocalVisualAudio();
  assert.equal(musicVisualTimeline('__proto__'), null);
  assert.equal(musicVisualTimeline('missing'), null);
});

test('reviewed first refrains follow word timing, including music-video intros', () => {
  for (const [id, start] of Object.entries(firstChoruses)) {
    const timeline = musicVisualTimeline(id);
    assert.equal(timeline.sections.find(section => section.kind === 'chorus').start, start, id);
    assert.notEqual(musicTimelineSectionAt(id, start - .001).kind, 'chorus', id);
    assert.equal(musicTimelineSectionAt(id, start).kind, 'chorus', id);
    assert.equal(musicTimelineSectionAt(id, start + .001).kind, 'chorus', id);
  }
  assert.equal(musicTimelineSectionAt('king-for-a-day', 30).kind, 'narrative');
  assert.equal(musicTimelineSectionAt('king-for-a-day', 66.84).kind, 'verse');
  assert.equal(musicTimelineSectionAt('she-knows', 315).kind, 'narrative');
  assert.equal(musicTimelineSectionAt('heartless-local', 140).label, 'Diálogo');
});

test('section intervals cover media time and exact boundaries select the next section', () => {
  for (const [id, data] of Object.entries(musicVisualData)) {
    for (const section of data.sections) {
      assert.equal(musicTimelineSectionAt(id, section.start), section);
      assert.equal(musicTimelineSectionAt(id, (section.start + section.end) / 2), section);
      assert.equal(musicTimelineSectionAt(id, section.end - .00001), section);
    }
    assert.equal(musicTimelineSectionAt(id, data.duration), null);
    for (const time of [-1, NaN, Infinity]) assert.equal(musicTimelineSectionAt(id, time), null);
  }
});

test('real attacks emit finite decay pulses and dialogue never emits synthetic beats', () => {
  for (const [id, data] of Object.entries(musicVisualData)) {
    const first = data.beats[0];
    assert.equal(musicTimelineBeatAt(id, first.time - .001), 0);
    assert.equal(musicTimelineBeatAt(id, first.time), first.strength);
    assert.ok(musicTimelineBeatAt(id, first.time + .08) < first.strength);
    for (const beat of data.beats) {
      const pulse = musicTimelineBeatAt(id, beat.time);
      assert.ok(pulse >= beat.strength && pulse <= 1, id);
    }
    for (const time of [-1, NaN, Infinity, data.duration + 1]) assert.equal(musicTimelineBeatAt(id, time), 0);
  }
  for (const [id, start, end] of [['king-for-a-day', 0, 60], ['she-knows', 0, 48], ['she-knows', 266, 346], ['made-for-loving-you', 0, 20]]) {
    for (let time = start; time < end; time += .13) assert.equal(musicTimelineBeatAt(id, time), 0, `${id} at ${time}`);
  }
});

test('backward/forward seeks and replay reconstruct the same frame without queued impacts', () => {
  for (const [id, data] of Object.entries(musicVisualData)) {
    const beat = data.beats[Math.floor(data.beats.length / 2)];
    const expected = musicTimelineBeatAt(id, beat.time + .06);
    musicTimelineBeatAt(id, data.duration - .5);
    assert.equal(musicTimelineBeatAt(id, beat.time + .06), expected);
    musicTimelineBeatAt(id, 0);
    assert.equal(musicTimelineBeatAt(id, beat.time + .06), expected);
    for (const speed of [.5, 1, 1.5, 2]) {
      const wallElapsed = (beat.time + .06) / speed;
      assert.ok(Math.abs(musicTimelineBeatAt(id, wallElapsed * speed) - expected) < 1e-9);
    }
  }
});

test('word-linked art is withheld for unresolved English or translated concepts', () => {
  const cue = musicVisualTimeline('still-into-you').cues.find(entry => entry.kind === 'butterflies');
  assert.ok(cue);
  assert.equal(musicTimelineCueAt('still-into-you', cue.start), 'butterflies');
  for (const hidden of ['butterflies', 'BUTTERFLY', 'borboletas', 'borboleta']) {
    assert.notEqual(musicTimelineCueAt('still-into-you', cue.start, [hidden]), 'butterflies');
  }
  assert.equal(musicTimelineCueAt('still-into-you', cue.start, ['unrelated']), 'butterflies');
  const revolution = musicVisualTimeline('king-for-a-day').cues.find(entry => entry.kind === 'rupture');
  assert.notEqual(musicTimelineCueAt('king-for-a-day', revolution.start, ['revolução']), 'rupture');
  assert.equal(musicTimelineCueAt('unknown', 30), null);
  assert.equal(musicTimelineCueAt('still-into-you', NaN), null);
});

test('visual payload exposes timing and short concept tags without lyric strings', () => {
  for (const data of Object.values(musicVisualData)) {
    assert.deepEqual(Object.keys(data).sort(), ['audioSha256', 'beats', 'cues', 'duration', 'sections', 'version']);
    for (const cue of data.cues) assert.deepEqual(Object.keys(cue).sort(), ['concepts', 'end', 'kind', 'start']);
    assert.ok(!JSON.stringify(data).includes('translation'));
    assert.ok(!JSON.stringify(data).includes('text'));
  }
});
