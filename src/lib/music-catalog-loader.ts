import { musicReleases, musicAudioSource } from './music-release.ts';
import { validateMusic, type MusicLesson } from './music.ts';

/** Keep a failed read distinct from an editorially empty catalog. */
export async function loadMusicReleases(
  readManifest: (name: string) => Promise<string>,
  releases: readonly (typeof musicReleases[number])[] = musicReleases,
) {
  const results = await Promise.all(releases.map(async release => {
    try {
      const data = JSON.parse(await readManifest(release.manifest)) as MusicLesson;
      if (data.id !== release.id) throw Error('invalid-release');
      return validateMusic({ ...data, version: release.version, source: musicAudioSource(release.id),
        visualSource: 'video' in release ? `/api/music/video?trackId=${encodeURIComponent(release.id)}` : undefined,
        rights: 'user-provided', published: true });
    } catch {
      // Neither private storage errors nor filesystem paths enter the response.
      return null;
    }
  }));
  return { catalog: results.filter((lesson): lesson is MusicLesson => lesson !== null),
    unavailable: results.filter(lesson => lesson === null).length };
}
