import type { Lesson } from './curriculum.ts';
import { validateName } from './onboarding-shared.ts';
export function personalizeLesson(lesson: Lesson, name?: string): Lesson {
  if (lesson.id !== 'a1-1-1' || !name) return lesson;
  let safe: string;
  try { safe = validateName(name).name; } catch { return lesson; }
  const replace = (value: unknown): unknown => {
    if (typeof value === 'string') return value.replace(/eu sou a Ana/g, 'eu sou Ana').replace(/\bAna\b/g, () => safe);
    if (Array.isArray(value)) return value.map(replace);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replace(child)]));
    return value;
  };
  return replace(lesson) as Lesson;
}
