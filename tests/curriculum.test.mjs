import test from "node:test";
import assert from "node:assert/strict";
import {
  lessons,
  modules,
  searchModules,
  correctAnswer,
} from "../src/lib/curriculum.ts";
import { a1Modules } from "../src/lib/content/a1.ts";
import { a2Modules } from "../src/lib/content/a2.ts";
import { a2CommunicationModules } from "../src/lib/content/a2-practice.ts";
import { b1Modules } from "../src/lib/content/b1.ts";
import { curriculumSources } from "../src/lib/content/build.ts";

const drafts = [...a1Modules, ...a2Modules, ...a2CommunicationModules, ...b1Modules];
const legacy = ["a1-1-1", "a1-2-1", "a2-3-1", "a2-4-1", "b1-5-1", "b1-6-1"];
test("120 real lessons: 114 additions, 19 modules, and an extended A2 path", () => {
  assert.equal(lessons.length, 120);
  assert.equal(modules.length, 19);
  assert.equal(drafts.flatMap((m) => m.lessons).length, 114);
  const counts = { A1: 38, A2: 44, B1: 38 };
  const moduleCounts = { A1: 6, A2: 7, B1: 6 };
  for (const level of ["A1", "A2", "B1"]) {
    assert.equal(lessons.filter((l) => l.level === level).length, counts[level]);
    assert.equal(modules.filter((m) => m.level === level).length, moduleCounts[level]);
  }
  assert.equal(new Set(lessons.map((l) => l.id)).size, 120);
  assert.equal(new Set(lessons.map((l) => l.title)).size, 120);
  for (const id of legacy)
    assert.ok(
      lessons.find((l) => l.id === id),
      `Preserve progress ID ${id}`,
    );
});
test("every module is ordered, connected and contains six distinct new authored lessons", () => {
  modules.forEach((m, index) => {
    assert.equal(m.order, index + 1);
    assert.equal(
      m.prerequisiteId,
      m.id === "b1-narrativas"
        ? "a2-textos"
        : index
          ? modules[index - 1].id
          : null,
    );
    assert.equal(m.lessons.filter((l) => !legacy.includes(l.id)).length, 6);
    for (const l of m.lessons) assert.equal(l.moduleId, m.id);
  });
  assert.deepEqual(
    modules.flatMap((m) => m.lessons.map((l) => l.id)),
    lessons.map((l) => l.id),
  );
});
test("all new lessons contain substantial theory, context, translations, vocabulary and production", () => {
  const rows = drafts.flatMap((m) => m.lessons);
  for (const row of rows) {
    assert.ok(row.rule.length >= 150, `${row.title}: theory`);
    assert.ok(row.pitfall.length >= 65, `${row.title}: usage note`);
    assert.equal(row.vocabulary.split("\n").length, 3);
    assert.ok(row.dialogue.length > 70, `${row.title}: reading context`);
    assert.ok(row.dialogueTranslation.length > 60, `${row.title}: translation`);
    assert.ok(row.production.length > 60, `${row.title}: production`);
    assert.ok(
      row.explanation.length > 50,
      `${row.title}: interpretation feedback`,
    );
    assert.ok(
      row.gapExplanation.length > 45,
      `${row.title}: structure feedback`,
    );
    assert.equal(row.gap.split("___").length, 2, `${row.title}: one gap`);
  }
  for (const field of [
    "rule",
    "example",
    "dialogue",
    "question",
    "production",
  ]) {
    assert.equal(
      new Set(rows.map((r) => r[field])).size,
      rows.length,
      `No duplicated ${field}`,
    );
  }
});
test("every published exercise has one editorial key and rejects all distractors", () => {
  let exercises = 0;
  for (const lesson of lessons) {
    assert.equal(lesson.steps[0].kind, "teach");
    assert.equal(lesson.steps.at(-1).kind, "summary");
    const keys = lesson.sourceIds;
    assert.ok(keys.length >= 3);
    assert.ok(keys.every((id) => curriculumSources.some((s) => s.id === id)));
    if (!legacy.includes(lesson.id)) {
      assert.equal(lesson.steps.length, 10);
      assert.ok(lesson.steps.some((s) => s.kind === "production"));
      assert.ok(lesson.steps.some((s) => s.kind === "vocabulary"));
    }
    for (const step of lesson.steps) {
      if (!["choice", "complete_sentence", "order_words"].includes(step.kind))
        continue;
      exercises++;
      assert.ok(step.answer && step.explanation);
      assert.equal(correctAnswer(step, step.answer), true);
      assert.equal(correctAnswer(step, ""), false);
      if (step.kind === "order_words") {
        assert.deepEqual(
          [...step.options].sort(),
          step.answer.split(" ").sort(),
        );
        assert.notEqual(step.options.join(" "), step.answer);
      } else {
        assert.equal(new Set(step.options).size, 3);
        assert.equal(step.options.filter((o) => o === step.answer).length, 1);
        for (const option of step.options.filter((o) => o !== step.answer))
          assert.equal(correctAnswer(step, option), false);
      }
    }
  }
  assert.equal(exercises, 360);
});
test("search supports accents, grammar terms, level isolation and empty results", () => {
  assert.equal(searchModules("all", "").flatMap((m) => m.lessons).length, 120);
  assert.equal(searchModules("A2", "").flatMap((m) => m.lessons).length, 44);
  assert.ok(searchModules("all", "condicoes").length);
  assert.ok(
    searchModules("B1", "would rather")
      .flatMap((m) => m.lessons)
      .some((l) => l.title.includes("preferência")),
  );
  assert.ok(searchModules("A1", "passaporteinexistente").length === 0);
  assert.ok(searchModules("A1", "rotina").every((m) => m.level === "A1"));
});
