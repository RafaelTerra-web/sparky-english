export const scratchKey = 'sparky-offline-practice-v1';

export function freshPractice(pack, lessonId) {
  return { contentVersion: pack.contentVersion, lessonId, index: 0, choice: null, tokens: [], checked: false };
}

export function selectedAnswer(lesson, state) {
  const step = lesson.exercises[state.index];
  if (!step) return '';
  return step.kind === 'order_words' ? state.tokens.map(index => step.options[index]).join(' ') : step.options[state.choice] ?? '';
}

export function answerCorrect(lesson, state) {
  const step = lesson.exercises[state.index];
  const answer = selectedAnswer(lesson, state);
  if (!step || !answer) return false;
  if (step.kind !== 'order_words') return answer === step.answer;
  const normalize = text => text.trim().replace(/\s+/g, ' ').toLowerCase().replace(/[.!?]+$/, '');
  return [step.answer, ...(step.acceptedAnswers ?? [])].some(value => normalize(answer) === normalize(value));
}

/** Only public choices/token positions survive; never restore receipts or account data. */
export function restorePractice(pack, raw) {
  if (!raw || typeof raw !== 'object' || raw.contentVersion !== pack.contentVersion) return null;
  const lesson = pack.lessons.find(item => item.id === raw.lessonId);
  if (!lesson || !Number.isSafeInteger(raw.index) || raw.index < 0 || raw.index > lesson.exercises.length) return null;
  const step = lesson.exercises[raw.index];
  const count = step?.options.length ?? 0;
  if (raw.choice !== null && (!Number.isSafeInteger(raw.choice) || raw.choice < 0 || raw.choice >= count)) return null;
  if (!Array.isArray(raw.tokens) || raw.tokens.length > count || new Set(raw.tokens).size !== raw.tokens.length || raw.tokens.some(index => !Number.isSafeInteger(index) || index < 0 || index >= count)) return null;
  const state = { contentVersion: pack.contentVersion, lessonId: lesson.id, index: raw.index,
    choice: raw.choice, tokens: step?.kind === 'order_words' ? raw.tokens : [], checked: false };
  state.checked = raw.checked === true && Boolean(selectedAnswer(lesson, state));
  return state;
}
