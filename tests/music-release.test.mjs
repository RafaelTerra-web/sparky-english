import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyMusicRelease } from '../scripts/verify-music-release.mjs';

test('deployment refuses missing or substituted private music assets', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sparky-music-release-'));
  try {
    await assert.rejects(verifyMusicRelease(directory), /missing manifest.json/);
    await writeFile(join(directory, 'manifest.json'), '{}');
    await assert.rejects(verifyMusicRelease(directory), /differs from the reviewed bundle/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
