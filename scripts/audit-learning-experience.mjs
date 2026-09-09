import assert from "node:assert/strict";
import { lessons, modules } from "../src/lib/curriculum.ts";
import { isExercise } from "../src/lib/study.ts";

const missions = new Set();
const discoveries = new Set();
const challenges = new Set();
const sequences = new Set();
const pronunciationFocuses = new Map();
let spokenProductions = 0;

for (const lesson of lessons) {
  assert.equal(lesson.steps[0].kind, "hook", `${lesson.id}: must open with its mission`);
  assert.equal(lesson.steps.at(-1).kind, "summary", `${lesson.id}: must close with progress`);
  assert.ok(lesson.steps.length >= 11 && lesson.steps.length <= 13, `${lesson.id}: cognitive load`);
  assert.ok(lesson.experience.mission.length > 100, `${lesson.id}: contextual mission`);
  assert.ok(lesson.experience.discovery.length > 90, `${lesson.id}: central discovery`);
  assert.ok(lesson.experience.challenge.length > 70, `${lesson.id}: level-appropriate challenge`);
  assert.ok(!missions.has(lesson.experience.mission), `${lesson.id}: duplicated mission`);
  assert.ok(!discoveries.has(lesson.experience.discovery), `${lesson.id}: duplicated discovery`);
  assert.ok(!challenges.has(lesson.experience.challenge), `${lesson.id}: duplicated challenge`);
  missions.add(lesson.experience.mission);
  discoveries.add(lesson.experience.discovery);
  challenges.add(lesson.experience.challenge);
  sequences.add(lesson.steps.map(step => step.kind).join(">"));

  const example = lesson.steps.filter(step => step.kind === "example");
  const pronunciation = lesson.steps.filter(step => step.kind === "pronunciation");
  const errorLab = lesson.steps.filter(step => step.kind === "error_analysis");
  const production = lesson.steps.filter(step => step.kind === "production");
  assert.equal(example.length, 1, `${lesson.id}: listening target`);
  assert.equal(pronunciation.length, 1, `${lesson.id}: pronunciation microtraining`);
  assert.equal(errorLab.length, 1, `${lesson.id}: error analysis`);
  assert.equal(production.length, 1, `${lesson.id}: independent production`);
  assert.equal(lesson.steps.filter(isExercise).length, 3, `${lesson.id}: guided objective practice`);
  assert.ok(errorLab[0].contrasts?.some(item => item.tone === "warning"), `${lesson.id}: explicit error contrast`);
  assert.ok(pronunciation[0].pronunciation?.mouth.length > 45, `${lesson.id}: physical articulation cue`);
  assert.equal(pronunciation[0].pronunciation?.drill.length, 3, `${lesson.id}: repeat ladder`);
  assert.ok(production[0].speakingTask?.length > 45, `${lesson.id}: speaking transfer`);
  spokenProductions++;
  const focus = pronunciation[0].pronunciation.focus;
  pronunciationFocuses.set(focus, (pronunciationFocuses.get(focus) ?? 0) + 1);
}

for (const courseModule of modules) {
  const moduleSequences = new Set(courseModule.lessons.map(lesson => lesson.steps.map(step => step.kind).join(">")));
  assert.ok(moduleSequences.size >= Math.min(6, courseModule.lessons.length), `${courseModule.id}: locally repetitive sequence`);
}
assert.ok(sequences.size >= 6, "Course must retain several learning rhythms");
assert.ok(pronunciationFocuses.size >= 8, "Pronunciation must cover segmental and connected-speech skills");
console.log(JSON.stringify({
  lessons: lessons.length,
  modules: modules.length,
  uniqueMissions: missions.size,
  uniqueDiscoveries: discoveries.size,
  uniqueChallenges: challenges.size,
  stepSequences: sequences.size,
  pronunciationSkills: Object.fromEntries(pronunciationFocuses),
  listeningFirstTargets: lessons.length,
  spokenProductions,
}, null, 2));
