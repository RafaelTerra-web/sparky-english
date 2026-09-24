import type { MusicLesson, MusicLine } from './music';

export type GameDifficulty = 'level1' | 'level2' | 'level3' | 'level4' | 'quick' | 'guided' | 'challenge' | 'typing';
export const levelRoundCounts = { level1: 12, level2: 20, level3: 28, level4: 32 } as const;
// A short lead-in makes the next phrase legible without giving away the beat.
export const LYRIC_PREVIEW_SECONDS = .7;
export const ANSWER_LEAD_SECONDS = .25;
export const musicSpeeds = [.5, .75, 1, 1.5, 2] as const;
export const musicSpeedLabel = (speed: number) => `${String(speed).replace('.', ',')}×`;
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
export const GAME_ROUND_COUNT = 24;
export const COUNTDOWN_SECONDS = 3;
export const RESPONSE_SECONDS = 3;
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
export type MusicRound = {
  line: MusicLine;
  lineIndex: number;
  target: number;
  targets: number[];
  answer: string;
  answers: string[];
  options: string[];
  countdownStart: number;
  revealAt: number;
  opens: number;
  closes: number;
  index: number;
};

export function musicAnswerOpens(round: MusicRound, speed = 1) {
  return Math.max(round.revealAt, round.line.words[round.targets[0]].start - ANSWER_LEAD_SECONDS * speed, 0);
}

type Candidate = Omit<MusicRound, 'answer' | 'answers' | 'options' | 'index'> & { score: number };

export function buildMusicRounds(lesson: MusicLesson, difficulty: GameDifficulty, seed = 1): MusicRound[] {
  const random = seededRandom(seed);
  const modern = difficulty in levelRoundCounts || difficulty === 'quick';
  const candidates: Candidate[] = lesson.lines.flatMap((line, lineIndex) => {
    const groups = difficulty === 'quick'
      ? [line.words.map((_, target) => target)]
      : line.words.map((_, target) => {
          const pair = line.words.length > 1 && (difficulty === 'level4' || (difficulty === 'level3' && (lineIndex + target + seed) % 3 === 0));
          if (!pair) return [target];
          const companion = target < line.words.length - 1 ? target + 1 : target - 1;
          return [target, companion].sort((a, b) => a - b);
        });
    const seen = new Set<string>();
    return groups.filter(targets => {
      const key = targets.join(':');
      if (!targets.length || seen.has(key)) return false;
      seen.add(key); return true;
    }).map(targets => {
      const first = line.words[targets[0]], last = line.words[targets.at(-1)!];
      return {
        line, lineIndex, target: targets[0], targets,
        countdownStart: Math.max(0, line.start - (modern ? LYRIC_PREVIEW_SECONDS : COUNTDOWN_SECONDS)),
        revealAt: modern ? Math.max(0, line.start - LYRIC_PREVIEW_SECONDS) : line.start,
        opens: modern ? Math.max(0, first.start - ANSWER_LEAD_SECONDS) : last.end,
        closes: last.end + (difficulty === 'level4' ? 2 : difficulty === 'quick' ? 1.2 : RESPONSE_SECONDS),
        score: random(),
      };
    });
  }).sort((a, b) => a.closes - b.closes || a.lineIndex - b.lineIndex || a.target - b.target);

  // Weighted interval scheduling gives every session a seeded variation while
  // guaranteeing that countdown, lyric and answer windows never overlap.
  const previous = candidates.map((candidate, i) => {
    let match = -1;
    for (let j = i - 1; j >= 0; j--) {
      if (candidates[j].closes <= candidate.countdownStart + 1e-9) { match = j; break; }
    }
    return match;
  });
  const requested = Math.min(difficulty === 'quick' ? lesson.lines.length : levelRoundCounts[difficulty as keyof typeof levelRoundCounts] ?? GAME_ROUND_COUNT, lesson.lines.length);
  const scores = Array.from({ length: candidates.length + 1 }, () => Array(requested + 1).fill(Number.NEGATIVE_INFINITY));
  const took = Array.from({ length: candidates.length + 1 }, () => Array(requested + 1).fill(false));
  scores[0][0] = 0;
  for (let i = 1; i <= candidates.length; i++) {
    const candidate = candidates[i - 1];
    const before = previous[i - 1] + 1;
    for (let count = 0; count <= requested; count++) {
      scores[i][count] = scores[i - 1][count];
      if (count > 0 && Number.isFinite(scores[before][count - 1])) {
        const value = scores[before][count - 1] + candidate.score;
        if (value > scores[i][count]) { scores[i][count] = value; took[i][count] = true; }
      }
    }
  }
  let count = requested;
  while (count > 0 && !Number.isFinite(scores[candidates.length][count])) count--;
  const selected: Candidate[] = [];
  for (let i = candidates.length; i > 0 && count > 0;) {
    if (!took[i][count]) { i--; continue; }
    const candidate = candidates[i - 1];
    selected.push(candidate);
    i = previous[i - 1] + 1;
    count--;
  }
  selected.reverse();
  // Level 4 increases the frequency of double blanks without turning every
  // phrase into the same pattern. Its candidates are scheduled with the wider
  // two-word window first, so reducing alternating rounds to one word cannot
  // introduce timing collisions.
  if (difficulty === 'level4') selected.forEach((candidate, index) => {
    if (index % 2 === 0) candidate.targets = [candidate.target];
  });
  if (difficulty === 'level3' && selected.length > 1 && selected.every(candidate => candidate.targets.length > 1)) {
    selected[0].targets = [selected[0].target];
  }

  const pool = [...new Set(lesson.lines.flatMap(l => l.words.map(w => normalizeAnswer(w.text))))]
    .filter(w => w && w.length >= 3);
  return selected.map((candidate, index) => {
    const { line, lineIndex, target, targets, countdownStart, revealAt, opens, closes } = candidate;
    const answers = targets.map(wordIndex => normalizeAnswer(line.words[wordIndex].text));
    const answer = answers.join(' · ');
    const shuffled = pool.filter(w => !answers.includes(w));
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    const alternatives: string[] = [];
    const add = (words: string[]) => { const value = words.join(' · '); if (value !== answer && !alternatives.includes(value)) alternatives.push(value); };
    if (difficulty === 'quick') {
      for (const other of lesson.lines) {
        add(other.words.map(word => normalizeAnswer(word.text)));
        if (alternatives.length >= 3) break;
      }
      if (alternatives.length < 3) add([...answers].reverse());
      if (alternatives.length < 3) add([...answers.slice(1), answers[0]]);
      if (alternatives.length < 3 && answers.length > 1) add(answers.map(() => answers[0]));
      if (alternatives.length < 3 && answers.length > 1) add(answers.map(() => answers.at(-1)!));
    }
    for (let attempt = 0; alternatives.length < (difficulty === 'guided' ? 1 : 3) && attempt < 40; attempt++) {
      if (answers.length === 1) {
        const replacement = [...(contrasts[answers[0]] || []), ...shuffled][attempt];
        if (replacement) add([replacement]);
      } else {
        add(answers.map((word, slot) => {
          const replacements = shuffled.filter(value => value !== word);
          return replacements[(attempt + slot * 3) % Math.max(1, replacements.length)] ?? word;
        }));
      }
    }
    const options = [...alternatives];
    options.splice(Math.floor(random() * (alternatives.length + 1)), 0, answer);
    const extendedClose = modern ? Math.min(closes + 1.7, selected[index + 1]?.countdownStart ?? lesson.duration, lesson.duration) : closes;
    return { line, lineIndex, target, targets, countdownStart, revealAt, opens, closes: extendedClose, answer, answers, options, index };
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
