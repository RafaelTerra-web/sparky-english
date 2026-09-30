import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { normalizeAnswer } from '../src/lib/music-game.ts';
import { musicTranslationParts, validMusicTranslationSpans } from '../src/lib/music-translation.ts';
import { validateMusic } from '../src/lib/music.ts';

export function translationContentFingerprint(lesson) {
  const immutable = { id: lesson.id, duration: lesson.duration, source: lesson.source, lines: lesson.lines.map(line => ({
    id: line.id, start: line.start, end: line.end, text: line.text, translation: line.translation,
    words: line.words.map(word => ({ text: word.text, start: word.start, end: word.end })),
  })) };
  return createHash('sha256').update(JSON.stringify(immutable)).digest('hex');
}

export function exactEquivalentSpans(translation, terms) {
  const spans = [];
  for (const term of terms ?? []) {
    assert.equal(typeof term, 'string', 'equivalent must be literal text');
    assert.ok(term.trim(), 'empty equivalent');
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}\\p{M}])${escaped}(?![\\p{L}\\p{N}\\p{M}])`, 'giu');
    for (const match of translation.matchAll(pattern)) spans.push({ start: match.index, end: match.index + match[0].length });
  }
  return [...new Map(spans.map(span => [`${span.start}:${span.end}`, span])).values()]
    .sort((left, right) => left.start - right.start || left.end - right.end);
}

export function auditTranslationSupport(lesson, mapping, fingerprint) {
  validateMusic(lesson);
  assert.equal(translationContentFingerprint(lesson), fingerprint, `${lesson.id}: English, translation or acoustic timing changed`);
  const report = { id: lesson.id, candidates: 0, mappedLines: 0, vocabularyWarnings: [] };
  const weakPhraseTokens = new Set(['someone', 'something', 'somebody', 'anyone', 'anybody', 'be', 'get', 'make', 'go', 'of', 'on', 'in', 'out', 'up', 'for', 'to', 'it']);
  for (const line of lesson.lines) {
    const pending = [];
    for (let index = 0; index < line.words.length; index++) {
      const word = line.words[index];
      const vocabulary = lesson.vocabulary.find(entry => entry.id === word.vocabularyId);
      if (vocabulary?.word.includes(' ') && weakPhraseTokens.has(normalizeAnswer(word.text))) {
        report.vocabularyWarnings.push({ lineId: line.id, wordIndex: index, text: word.text, vocabularyId: word.vocabularyId });
      }
      if (word.challengeEligible === false) continue;
      assert.match(normalizeAnswer(word.text), /^[a-z][a-z0-9]*(?:'[a-z]+)?$/, `${lesson.id}/${line.id}/${index}: compound answer enabled`);
      assert.ok(validMusicTranslationSpans(line.translation, word.translationSpans), `${lesson.id}/${line.id}/${index}: unsafe candidate`);
      const terms = mapping.overrides?.[line.id]?.[index] ?? mapping.lexicon[normalizeAnswer(word.text)] ?? [];
      const expected = exactEquivalentSpans(line.translation, terms);
      assert.ok(expected.length, `${lesson.id}/${line.id}/${index}: no literal reviewed equivalent`);
      assert.deepEqual(word.translationSpans, expected, `${lesson.id}/${line.id}/${index}: missing repeat or non-equivalent text masked`);
      for (const span of word.translationSpans) {
        assert.ok(terms.some(term => term.toLocaleLowerCase('pt-BR') === line.translation.slice(span.start, span.end).toLocaleLowerCase('pt-BR')), 'semantic substring mismatch');
      }
      const parts = musicTranslationParts(line, [index]);
      assert.ok(parts, 'candidate cannot be rendered safely');
      assert.equal(parts.map(part => line.translation.slice(part.start, part.end)).join(''), line.translation, 'translation partition changed');
      assert.ok(parts.filter(part => part.masked).every(part => !('text' in part)), 'masked equivalent leaks through text property');
      pending.push(index);
      report.candidates++;
    }
    if (pending.length) {
      report.mappedLines++;
      const parts = musicTranslationParts(line, pending);
      assert.ok(parts, 'combined pending mask failed');
      assert.equal(parts.map(part => line.translation.slice(part.start, part.end)).join(''), line.translation);
    }
  }
  return report;
}

const legacyInputs = {
  'perfect-local': 'manifest.json', 'heartless-local': 'heartless/manifest.json',
  'stay-at-your-house-local': 'stay-at-your-house/manifest.json', 'buttercup-local': 'buttercup-local/manifest.json',
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { musicReleases } = await import('../src/lib/music-release.ts');
  const snapshot = process.argv.includes('--snapshot');
  const baselinePath = '.music-assets/translation-support/content-baseline.json';
  const baseline = snapshot ? {} : JSON.parse(await readFile(baselinePath, 'utf8'));
  const reports = [];
  for (const release of musicReleases) {
    const legacy = release.version !== 'musify-1';
    const path = snapshot ? legacyInputs[release.id] ?? release.manifest : legacy ? `musify-support-1/${release.id}.json` : release.manifest;
    const lesson = JSON.parse(await readFile(`.music-assets/${path}`, 'utf8'));
    if (snapshot) baseline[lesson.id] = translationContentFingerprint(lesson);
    else {
      const mapping = JSON.parse(await readFile(`.music-assets/translation-support/${lesson.id}.json`, 'utf8'));
      reports.push(auditTranslationSupport(lesson, mapping, baseline[lesson.id]));
    }
  }
  await writeFile(snapshot ? baselinePath : '.music-assets/translation-support/independent-audit.json', JSON.stringify(snapshot ? baseline : reports, null, 2) + '\n');
  console.log(snapshot ? `Saved immutable content/timing fingerprints for ${Object.keys(baseline).length} songs.` : JSON.stringify(reports.map(({ id, candidates, mappedLines, vocabularyWarnings }) => ({ id, candidates, mappedLines, vocabularyWarnings: vocabularyWarnings.length })), null, 2));
}
