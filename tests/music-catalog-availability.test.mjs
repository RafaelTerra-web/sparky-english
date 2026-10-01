import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadMusicReleases } from '../src/lib/music-catalog-loader.ts';
import { musicReleases } from '../src/lib/music-release.ts';

function manifest(id) {
  return JSON.stringify({
    id, version: 'test-version', title: 'Synthetic song', artist: 'Test artist',
    level: 'A1', topic: 'Listening', duration: 12, source: '/test-audio',
    rights: 'user-provided', published: true,
    lines: [{ id: 'line-1', start: 1, end: 2, text: 'Hello', translation: 'Olá',
      tip: 'Listen carefully.', words: [{ text: 'Hello', start: 1, end: 2 }] }],
    vocabulary: [{ id: 'hello', word: 'hello', meaning: 'olá', ipa: '/həˈloʊ/',
      usage: 'Greeting', example: 'Hello.' }],
    questions: [{ id: 'question-1', prompt: 'Which greeting?', options: ['Hello', 'Goodbye'],
      answer: 0, explanation: 'Hello is a greeting.' }],
  });
}

test('a blocked storage read counts every unavailable release instead of disguising success', async () => {
  const requested = [];
  const result = await loadMusicReleases(async name => {
    requested.push(name);
    throw new Error('storage-blocked');
  });
  assert.equal(result.catalog.length, 0);
  assert.equal(result.unavailable, musicReleases.length);
  assert.deepEqual(requested.sort(), musicReleases.map(release => release.manifest).sort());
});

test('one unavailable manifest preserves the other valid releases and their authorized sources', async () => {
  const releases = musicReleases.slice(0, 3);
  const result = await loadMusicReleases(async name => {
    const release = releases.find(entry => entry.manifest === name);
    if (release.id === 'heartless-local') throw new Error('missing-manifest');
    return manifest(release.id);
  }, releases);
  assert.equal(result.unavailable, 1);
  assert.deepEqual(result.catalog.map(lesson => lesson.id), ['perfect-local', 'stay-at-your-house-local']);
  assert.equal(result.catalog[0].source, '/api/music/audio');
  assert.equal(result.catalog[0].version, releases[0].version);
  assert.equal(result.catalog[1].source, '/api/music/audio?trackId=stay-at-your-house-local');
  assert.equal(result.catalog[1].visualSource, '/api/music/video?trackId=stay-at-your-house-local');
  assert.ok(result.catalog.every(lesson => lesson.published && lesson.rights === 'user-provided'));
});

test('invalid JSON, a substituted track id and invalid timing are counted as unavailable', async () => {
  const releases = musicReleases.slice(0, 4);
  const result = await loadMusicReleases(async name => {
    const index = releases.findIndex(release => release.manifest === name);
    if (index === 0) return '{';
    if (index === 1) return manifest('substituted-track');
    const content = JSON.parse(manifest(releases[index].id));
    if (index === 2) content.lines[0].end = 0;
    return JSON.stringify(content);
  }, releases);
  assert.equal(result.unavailable, 3);
  assert.deepEqual(result.catalog.map(lesson => lesson.id), [releases[3].id]);
});

test('an intentionally empty release list does not invent a storage failure', async () => {
  let reads = 0;
  const result = await loadMusicReleases(async () => { reads++; throw new Error('unexpected-read'); }, []);
  assert.equal(reads, 0);
  assert.equal(result.catalog.length, 0);
  assert.equal(result.unavailable, 0);
});

test('the reviewed private bundle loads all eleven releases when available locally', async context => {
  try {
    await Promise.all(musicReleases.map(release => access(join('.music-assets', release.manifest))));
  } catch {
    context.skip('The private reviewed bundle is not part of this checkout.');
    return;
  }
  const result = await loadMusicReleases(name => readFile(join('.music-assets', name), 'utf8'));
  // Only public release metadata participates in assertions; private lesson
  // content is never printed, snapshotted or written into a test artifact.
  assert.equal(result.unavailable, 0);
  assert.equal(result.catalog.length, 11);
  assert.deepEqual(result.catalog.map(lesson => lesson.id), musicReleases.map(release => release.id));
  assert.ok(result.catalog.every(lesson => lesson.published && lesson.rights === 'user-provided'));
});
