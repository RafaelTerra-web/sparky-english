import type { MusicLesson } from './music';

export type GameDifficulty = 'guided' | 'challenge' | 'typing';
// Contrast close sounds/forms before falling back to other words in the lesson.
const contrasts: Record<string, string[]> = {
  found: ['sound', 'round', 'bound'], dive: ['drive', 'hide', 'ride'],
  lead: ['leave', 'need', 'read'], sweet: ['street', 'sleep', 'speak'],
  knew: ['know', 'grew', 'flew'], fell: ['felt', 'fill', 'feel'],
  knowing: ['going', 'showing', 'growing'], give: ['live', 'leave', 'keep'],
};
export function normalizeAnswer(text: string) {
  return text.toLowerCase().replace(/[’‘]/g, "'").replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '').trim();
}
export const RESPONSE_SECONDS = 3;
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
export function buildMusicRounds(lesson: MusicLesson, difficulty: GameDifficulty, seed = 1) {
  const random = seededRandom(seed);
  let available = 0;
  return lesson.lines.map((line, index) => {
    const target = Math.floor(random() * line.words.length);
    const answer = normalizeAnswer(line.words[target].text);
    const pool = [...new Set(lesson.lines.flatMap(l => l.words.map(w => normalizeAnswer(w.text))))]
      .filter(w => w && w !== answer && w.length >= 3);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const alternatives = [...new Set([...(contrasts[answer] || []), ...pool])].filter(w => w !== answer).slice(0, difficulty === 'guided' ? 1 : 3);
    const options = [...alternatives];
    options.splice(Math.floor(random() * (alternatives.length + 1)), 0, answer);
    // Every word receives the same full window after it has played. If a late
    // word overlaps the next verse, queue that question without cutting time.
    const appears = Math.max(line.start, available);
    const opens = Math.max(line.words[target].end, appears);
    const closes = opens + RESPONSE_SECONDS;
    available = closes;
    return { line, target, answer, options, opens, closes, appears, queued: appears > line.start, index };
  });
}

export type RoundOutcome = 'first' | 'missed';
export type GameState = { phase: 'ready' | 'round' | 'outro' | 'result'; index: number; answered: boolean; solved: boolean; mistakes: number; roundMistakes: number; correct: number; missed: number; firstTry: number; streak: number; bestStreak: number; feedback: string; rejected: string[]; outcomes: RoundOutcome[] };
export const initialGame: GameState = { phase: 'ready', index: 0, answered: false, solved: false, mistakes: 0, roundMistakes: 0, correct: 0, missed: 0, firstTry: 0, streak: 0, bestStreak: 0, feedback: '', rejected: [], outcomes: [] };
export type GameAction = { type: 'start' } | { type: 'answer'; index: number; value: string; expected: string; time: number; opens: number; closes: number } | { type: 'tick'; time: number; deadlines: number[]; finishAt?: number };
export function musicGameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'start') return { ...initialGame, phase: 'round' };
  if (action.type === 'tick') {
    if (state.phase === 'outro') return action.time >= (action.finishAt ?? 0) ? { ...state, phase: 'result' } : state;
    let next = state;
    // Catch up after buffering, a dropped frame or forward seek exactly once.
    while (next.phase === 'round' && action.time >= action.deadlines[next.index]) {
      if (!next.answered) next = { ...next, outcomes: [...next.outcomes, 'missed'], missed: next.missed + 1, streak: 0 };
      if (next.index + 1 >= action.deadlines.length) return { ...next, answered: true, phase: action.time < (action.finishAt ?? 0) ? 'outro' : 'result' };
      next = { ...next, index: next.index + 1, answered: false, solved: false, roundMistakes: 0, rejected: [], feedback: '' };
    }
    return next;
  }
  const value = normalizeAnswer(action.value);
  if (state.phase !== 'round' || state.answered || action.index !== state.index || !Number.isFinite(action.time) || action.time < action.opens || action.time >= action.closes || !value) return state;
  // A single tap commits the attempt. The media clock opens the next phrase.
  if (value !== normalizeAnswer(action.expected)) return { ...state, answered: true, mistakes: state.mistakes + 1, roundMistakes: 1, missed: state.missed + 1, streak: 0, rejected: [value], outcomes: [...state.outcomes, 'missed'], feedback: 'Guardada para revisar. Continue ouvindo.' };
  const streak = state.streak + 1;
  return { ...state, answered: true, solved: true, correct: state.correct + 1, streak, bestStreak: Math.max(state.bestStreak, streak), firstTry: state.firstTry + 1, outcomes: [...state.outcomes, 'first'], feedback: 'Boa escuta! Continue no ritmo.' };
}
