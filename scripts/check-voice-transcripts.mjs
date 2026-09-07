// Optional paid administrative QA of published lesson audio, never student recordings.
// Dry-run by default. Use --check to transcribe generated files; results are cached by file hash.
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { compareTranscript } from '../src/lib/speech.ts';
const root = new URL('../', import.meta.url);
const folder = new URL('.voice-qa/', root);
const reportPath = new URL('transcripts.json', folder);
const manifest = JSON.parse(await readFile(new URL('src/lib/content/voice-manifest.json', root), 'utf8'));
let report = {};
try { report = JSON.parse(await readFile(reportPath, 'utf8')); } catch { /* First QA run. */ }
for (const item of Object.values(report)) item.exact = compareTranscript(item.target, item.transcript).exact;
const entries = Object.entries(manifest).flatMap(([lessonId, item]) => ['sparky', 'pinky'].filter(mascot => item[mascot]).map(mascot => ({lessonId, mascot, text:item.text, path:item[mascot]})));
const model = process.argv.find(arg => arg.startsWith('--model='))?.split('=')[1] ?? 'gpt-4o-mini-transcribe';
if (!['gpt-4o-mini-transcribe','gpt-4o-transcribe'].includes(model)) throw new Error('Unsupported QA transcription model');
const pending = entries.filter(item => !report[item.path] || report[item.path].target !== item.text || (process.argv.includes('--recheck') && !report[item.path].exact));
console.log(JSON.stringify({available:entries.length, pending:pending.length, mode:process.argv.includes('--check') ? 'check' : 'dry-run'}));
if (!process.argv.includes('--check')) process.exit(0);
if (pending.length && !process.env.OPENAI_API_KEY) throw new Error('Configure OPENAI_API_KEY securely before checking new audio.');
await mkdir(folder, {recursive:true});
let next = 0, failure, saveQueue = Promise.resolve();
await Promise.all(Array.from({length:3}, async () => {
  while (!failure && next < pending.length) {
    const item = pending[next++];
    try {
      if (!/^\/audio\/mascots\/[a-f0-9]{32}\.mp3$/.test(item.path)) throw new Error('Invalid audio path');
      const bytes = await readFile(new URL('public' + item.path, root));
      const form = new FormData();
      form.set('file', new Blob([bytes], {type:'audio/mpeg'}), 'lesson.mp3');
      form.set('model', model);
      form.set('language', 'en');
      // Deliberately omit a target-text prompt: it would bias this check toward the expected answer.
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {method:'POST',headers:{authorization:'Bearer ' + process.env.OPENAI_API_KEY},body:form,signal:AbortSignal.timeout(60000)});
      if (!response.ok) throw new Error('Transcription HTTP ' + response.status + '; provider body omitted.');
      const result = await response.json();
      if (typeof result.text !== 'string') throw new Error('Invalid transcription response');
      const exact = compareTranscript(item.text, result.text).exact;
      report[item.path] = {lessonId:item.lessonId, mascot:item.mascot, target:item.text, transcript:result.text, exact, model};
      saveQueue = saveQueue.then(async () => {
        const temporary = new URL('transcripts.json.tmp', folder);
        await writeFile(temporary, JSON.stringify(report, null, 2) + '\n');
        await rename(temporary, reportPath);
      });
      await saveQueue;
      if (!exact) console.log('Review: ' + item.lessonId + ' / ' + item.mascot + ' | ' + result.text);
    } catch (error) { failure ??= error; }
  }
}));
if (failure) throw failure;
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
const mismatches = entries.filter(item => !report[item.path]?.exact);
console.log(JSON.stringify({checked:entries.length, matched:entries.length - mismatches.length, review:mismatches.length}));
if (mismatches.length) process.exitCode = 1;
