import { normalizeMusicPerformance, mergeMusicPerformance, type MusicPerformance } from './music-performance.ts';
export type MusicWord = { text: string; start: number; end: number; vocabularyId?: string };
export type MusicLine = { id: string; start: number; end: number; text: string; translation: string; tip: string; words: MusicWord[] };
export type MusicLesson = {
  id: string; version: string; title: string; artist: string; level: string; topic: string; duration: number;
  source: string; rights: 'original' | 'licensed' | 'local-private' | 'user-provided'; published: boolean;
  visualSource?: string;
  lines: MusicLine[];
  vocabulary: { id: string; word: string; meaning: string; ipa: string; usage: string; example: string }[];
  questions: { id: string; prompt: string; options: string[]; answer: number; explanation: string }[];
};
export const musicStages = ['Preparar', 'Ouvir', 'Explorar', 'Repetir', 'Praticar'] as const;
export type MusicProgress = { revision: number; version: string; stage: number; position: number; positionAt: number; heard: string[]; explored: string[]; saved: string[]; practiced: string[]; answers: Record<string, number>; completed: boolean; performance: MusicPerformance };
export const emptyMusicProgress = (lesson: MusicLesson): MusicProgress => ({ revision: 0, version: lesson.version, stage: 0, position: 0, positionAt: 0, heard: [], explored: [], saved: [], practiced: [], answers: {}, completed: false, performance: normalizeMusicPerformance(null) });
export function activeCue<T extends { start: number; end: number }>(cues: T[], time: number) { return cues.findIndex(c => time >= c.start && time < c.end); }
export function validateMusic(lesson: MusicLesson) {
  if (!/^[a-z0-9-]+$/.test(lesson.id) || !lesson.version || !(lesson.duration > 0) || lesson.duration > 900 || !lesson.lines.length || !lesson.questions.length || !lesson.vocabulary.length) throw Error('invalid-content');
  if (lesson.published && lesson.rights === 'local-private') throw Error('private-content');
  if (!lesson.source.startsWith('/') || lesson.source.startsWith('//')) throw Error('invalid-source');
  if (lesson.visualSource && lesson.visualSource !== `/api/music/video?trackId=${encodeURIComponent(lesson.id)}`) throw Error('invalid-visual-source');
  for (const group of [lesson.lines, lesson.vocabulary, lesson.questions]) if (new Set(group.map(x => x.id)).size !== group.length) throw Error('duplicate-id');
  let end = 0;
  for (const line of lesson.lines) {
    if (!line.text || !line.translation || !line.words.length || line.start < end || line.end <= line.start || line.end > lesson.duration) throw Error('invalid-timing');
    let wordEnd = line.start;
    for (const word of line.words) {
      if (!word.text || !Number.isFinite(word.start) || !Number.isFinite(word.end) || word.start < wordEnd || word.end <= word.start || word.end > line.end) throw Error('invalid-word-timing');
      if (word.vocabularyId && !lesson.vocabulary.some(v => v.id === word.vocabularyId)) throw Error('invalid-vocabulary');
      wordEnd = word.end;
    }
    if (line.words.map(w => w.text).join(' ') !== line.text) throw Error('word-text-mismatch');
    end = line.end;
  }
  for (const q of lesson.questions) if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) throw Error('invalid-answer');
  return lesson;
}
export function normalizeMusic(lesson: MusicLesson, raw: unknown): MusicProgress {
  const blank = emptyMusicProgress(lesson);
  if (!raw || typeof raw !== 'object') return blank;
  const p = raw as Partial<MusicProgress>;
  const ids = (v: unknown, allowed: string[]) => Array.isArray(v) ? [...new Set(v.filter(x => typeof x === 'string' && allowed.includes(x)))] : [];
  const words = lesson.vocabulary.map(v => v.id), lines = lesson.lines.map(l => l.id);
  if (p.version !== lesson.version) return { ...blank, saved: ids(p.saved, words), performance: normalizeMusicPerformance(p.performance) };
  const answers = Object.fromEntries(lesson.questions.filter(q => Number.isInteger(p.answers?.[q.id]) && p.answers![q.id] >= 0 && p.answers![q.id] < q.options.length).map(q => [q.id, p.answers![q.id]]));
  const clean = { ...blank, revision: Number.isSafeInteger(p.revision) && p.revision! >= 0 ? p.revision! : 0, stage: Number.isInteger(p.stage) && p.stage! >= 0 && p.stage! <= 4 ? p.stage! : 0, position: Number.isFinite(p.position) ? Math.max(0, Math.min(lesson.duration, p.position!)) : 0, positionAt: Number.isFinite(p.positionAt) ? p.positionAt! : 0, heard: ids(p.heard, lines), practiced: ids(p.practiced, lines), explored: ids(p.explored, words), saved: ids(p.saved, words), answers, completed: false };
  const result = { ...clean, performance: normalizeMusicPerformance(p.performance) };
  result.completed = p.completed === true && canCompleteMusic(lesson, result);
  return result;
}
export function canCompleteMusic(lesson: MusicLesson, p: MusicProgress) { return Object.values(normalizeMusicPerformance(p.performance)).some(r => r.completedCorrect >= 0) || (p.stage === 4 && p.heard.length > 0 && p.explored.length > 0 && p.practiced.length > 0 && lesson.questions.every(q => p.answers[q.id] === q.answer)); }
export function mergeMusic(lesson: MusicLesson, left: MusicProgress, right: MusicProgress): MusicProgress {
  const a = normalizeMusic(lesson, left), b = normalizeMusic(lesson, right);
  const newer = b.positionAt >= a.positionAt ? b : a;
  const answers = { ...a.answers, ...b.answers };
  for (const q of lesson.questions) if (a.answers[q.id] === q.answer || b.answers[q.id] === q.answer) answers[q.id] = q.answer;
  return normalizeMusic(lesson, { ...newer, revision: Math.max(a.revision, b.revision), stage: Math.max(a.stage, b.stage), heard: [...a.heard,...b.heard], explored: [...a.explored,...b.explored], saved: [...a.saved,...b.saved], practiced: [...a.practiced,...b.practiced], answers, completed: a.completed || b.completed, performance: mergeMusicPerformance(a.performance, b.performance) });
}
