import { readFile, writeFile } from 'node:fs/promises';
import { validateMusic } from '../src/lib/music.ts';
import { musifyCurriculum } from './review-musify-curriculum.mjs';

const candidateReview = [];
for (const id of Object.keys(musifyCurriculum)) {
  if (process.argv.length > 2 && !process.argv.slice(2).includes(id)) continue;
  const lesson = validateMusic(JSON.parse(await readFile(`.music-assets/${id}/manifest.json`, 'utf8')));
  const last = lesson.lines.at(-1);
  const words = lesson.lines.flatMap(line => line.words);
  if (lesson.questions.some(question => !question.prompt || !question.explanation || question.options.length < 3)) throw Error(`${id}: incomplete teaching question`);
  if (lesson.vocabulary.some(item => !item.word || !item.meaning || !item.ipa || !item.usage || !item.example)) throw Error(`${id}: incomplete vocabulary`);
  if (words.some(word => word.challengeEligible && (word.text.includes(' ') || word.text.includes('[unclear]')))) throw Error(`${id}: uncertain phrase enabled for challenges`);
  if (!words.some(word => word.challengeEligible)) throw Error(`${id}: no confident gameplay words`);
  if (id === 'made-for-loving-you' && lesson.visualSource) throw Error('KISS must remain audio only');
  if (lesson.version !== 'musify-1') throw Error(`${id}: release version mismatch`);
  candidateReview.push({ id, duration: lesson.duration, candidates: lesson.lines.flatMap(line => line.words
    .filter(word => word.challengeEligible)
    .map(word => ({ text: word.text, start: word.start, end: word.end, lineId: line.id, vocabularyId: word.vocabularyId }))) });
  console.log(`${id}: validateMusic passed; full media ${lesson.duration}s; last cue ${last.end}s; ${words.filter(word => word.challengeEligible).length} challenge words.`);
}
await writeFile('.music-assets/musify-candidates-review.json', JSON.stringify(candidateReview, null, 2) + '\n');
