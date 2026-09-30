import { lessons } from './curriculum.ts';
import { contentVersion } from './content/build.ts';
import { createHash } from 'node:crypto';
import dictionary from '../../public/locales/en.json' with { type: 'json' };

function english(text: string) {
  const translated = (dictionary as Record<string, string>)[text.replace(/\s+/g, ' ').trim()];
  if (!translated) throw new Error('Missing offline English support: ' + text);
  return translated;
}

/** Anonymous, editorial content only. No account data, signed receipts or audio. */
export function createOfflinePack() {
  const offlineLessons = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].flatMap(level =>
      lessons.filter(lesson => lesson.level === level).slice(0, 2).map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        titleEnglish: lesson.englishTitle,
        level: lesson.level,
        support: lesson.support?.filter(step => ['teach', 'example', 'vocabulary', 'dialogue'].includes(step.kind))
          .map(step => ({ kind: step.kind,
            title: step.kind === 'example' ? 'Exemplo escrito' : step.title,
            titleEnglish: step.kind === 'example' ? 'Written example' : english(step.title),
            body: step.kind === 'example' ? 'Leia o modelo e observe como a frase funciona.' : step.body,
            bodyEnglish: step.kind === 'example' ? 'Read the model and notice how the sentence works.' : english(step.body),
            english: step.english, translation: step.translation })),
        exercises: lesson.exercises!.map(step => ({
          id: step.id, kind: step.kind, title: step.title, body: step.body, bodyEnglish: step.bodyEnglish,
          english: step.english, cue: step.cue, contextHint: step.contextHint, options: step.options,
          answer: step.answer, acceptedAnswers: step.acceptedAnswers, explanation: step.explanation, explanationEnglish: step.explanationEnglish,
        })),
      })));
  return { version: 1, contentVersion: `${contentVersion}.offline-${createHash('sha256').update(JSON.stringify(offlineLessons)).digest('hex').slice(0, 12)}`, lessons: offlineLessons };
}
