import { placementBank, type PlacementSkill } from "./placement-bank.ts";
import { onboardingLevels } from "./onboarding-shared.ts";
export type PlacementState = {
  answers: { id: string; answer: number }[];
  currentId: string | null;
  seed: number;
};
const minimum: Record<PlacementSkill, number> = {
  vocabulary: 3,
  grammar: 3,
  reading: 3,
  context: 3,
  listening: 2,
};
export function estimate(state: PlacementState) {
  // Discrete Bayesian Rasch-style estimate. Editorial difficulty is not psychometric calibration.
  const grid = Array.from({ length: 121 }, (_, i) => -0.5 + i * 0.05);
  const logs = grid.map((theta) =>
    state.answers.reduce(
      (sum, a) => {
        const item = placementBank.find((i) => i.id === a.id)!;
        const difficulty = onboardingLevels.indexOf(item.level);
        const p = 0.25 + 0.75 / (1 + Math.exp(-(theta - difficulty) * 1.7));
        return sum + Math.log(a.answer === item.answer ? p : 1 - p);
      },
      -((theta - 2.5) ** 2) / 18,
    ),
  );
  const max = Math.max(...logs),
    weights = logs.map((v) => Math.exp(v - max)),
    total = weights.reduce((a, b) => a + b, 0);
  const masses = onboardingLevels.map(
    (_, level) =>
      weights.reduce(
        (s, w, i) =>
          s + (Math.max(0, Math.min(5, Math.round(grid[i]))) === level ? w : 0),
        0,
      ) / total,
  );
  const best = masses.indexOf(Math.max(...masses));
  const probability = masses[best];
  const counts = Object.fromEntries(
    Object.keys(minimum).map((skill) => [
      skill,
      state.answers.filter(
        (a) => placementBank.find((i) => i.id === a.id)?.skill === skill,
      ).length,
    ]),
  ) as Record<PlacementSkill, number>;
  const covered = Object.entries(minimum).every(
    ([skill, n]) => counts[skill as PlacementSkill] >= n,
  );
  return {
    level: onboardingLevels[best],
    score: Math.round(
      (100 *
        weights.reduce(
          (s, w, i) => s + w * Math.max(0, Math.min(5, grid[i])),
          0,
        )) /
        total /
        5,
    ),
    confidence:
      state.answers.length >= 18 && covered && probability >= 0.8
        ? "alta"
        : state.answers.length >= 18 && covered && probability >= 0.55
          ? "média"
          : "baixa",
    probability,
    counts,
    complete:
      state.answers.length >= 28 ||
      (state.answers.length >= 18 && covered && probability >= 0.8),
  };
}
export function nextItem(state: PlacementState) {
  const result = estimate(state);
  if (result.complete) return null;
  const missing = (Object.keys(minimum) as PlacementSkill[]).filter(
    (s) => result.counts[s] < minimum[s],
  );
  const target = state.answers.length
    ? onboardingLevels.indexOf(result.level)
    : 2.5;
  return (
    placementBank
      .filter((i) => !state.answers.some((a) => a.id === i.id))
      .sort((a, b) => {
        const priority = (s: PlacementSkill) => (missing.includes(s) ? -10 : 0);
        return (
          priority(a.skill) -
            priority(b.skill) +
            Math.abs(onboardingLevels.indexOf(a.level) - target) -
            Math.abs(onboardingLevels.indexOf(b.level) - target) ||
          a.id.localeCompare(b.id)
        );
      })[0]?.id ?? null
  );
}
export function startPlacement(): PlacementState {
  const state = {
    answers: [],
    currentId: null,
    seed: Math.floor(Math.random() * 100000),
  } as PlacementState;
  state.currentId = nextItem(state);
  return state;
}
export function publicPlacement(state: PlacementState) {
  const item = placementBank.find((i) => i.id === state.currentId);
  const result = estimate(state);
  const offset = (state.seed + state.answers.length) % 4;
  return {
    count: state.answers.length,
    complete: result.complete,
    result: result.complete
      ? {
          level: result.level,
          score: result.score,
          confidence: result.confidence,
        }
      : null,
    item: item
      ? {
          id: item.id,
          skill: item.skill,
          prompt: item.prompt,
          options: item.options.map((_, i) => item.options[(i + offset) % 4]),
          audio: item.transcript ? `/audio/onboarding/${item.id}.wav` : null,
        }
      : null,
  };
}
export function answerPlacement(
  state: PlacementState,
  id: unknown,
  answer: unknown,
): PlacementState {
  if (
    id !== state.currentId ||
    typeof answer !== "number" ||
    !Number.isInteger(answer) ||
    answer < 0 ||
    answer > 3 ||
    estimate(state).complete
  )
    throw new Error("Resposta inválida ou já registrada.");
  const next = {
    ...state,
    answers: [
      ...state.answers,
      {
        id: state.currentId!,
        answer: (answer + state.seed + state.answers.length) % 4,
      },
    ],
  };
  next.currentId = nextItem(next);
  return next;
}
