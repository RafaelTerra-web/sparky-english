import test from "node:test";
import assert from "node:assert/strict";
import { lessons } from "../src/lib/curriculum.ts";
import { createPronunciationGuide } from "../src/lib/content/pedagogy.ts";
import { productionSupport } from "../src/lib/content/production-support.ts";

test("sound guidance follows the recording, not unrelated rule examples", () => {
  const guide = (example, title = "Passado: worked, three, sheep", rule = "") => createPronunciationGuide({ example, title, rule, vocabulary: "" }, "A2", 1);
  assert.notEqual(guide("We were at home last night.").focus, "Final de passado sem sílaba extra");
  assert.notEqual(guide("I used to walk to school every day.").focus, "Final de passado sem sílaba extra");
  assert.equal(guide("She visited her aunt last weekend.").focus, "Final de passado sem sílaba extra");
  assert.equal(guide("I don't like coffee.").focus, "Contração como uma unidade");
  assert.match(guide("I don't like coffee.").mouth, /do e not/);
  assert.notEqual(guide("I went home.").focus, "TH sem virar T, S ou F");
});

test("every pronunciation ladder ends at its recording and has no invented phonetic joins", () => {
  for (const lesson of lessons) {
    const audioText = lesson.steps.find(step => step.kind === "example").english;
    const guide = lesson.steps.find(step => step.kind === "pronunciation").pronunciation;
    assert.equal(guide.careful, audioText, lesson.id);
    assert.equal(guide.drill[2], audioText, lesson.id);
    assert.equal(new Set(guide.drill).size, 3, lesson.id);
    assert.doesNotMatch(guide.careful + guide.natural, /[‿·|]/, lesson.id);
  }
});

test("warmups use an actual earlier example within the same module", () => {
  let count = 0;
  for (const lesson of lessons) {
    if (!lesson.experience.recall) continue;
    const { recall } = lesson.experience;
    const previous = lessons.find(item => item.title === recall.title);
    assert.ok(previous && lessons.indexOf(previous) < lessons.indexOf(lesson), lesson.id);
    assert.equal(previous.moduleId, lesson.moduleId, lesson.id);
    assert.equal(recall.model, previous.steps.find(step => step.kind === "example").english);
    assert.equal(recall.prompt, previous.steps.find(step => step.kind === "example").translation);
    count++;
  }
  assert.equal(count, 139);
});

test("editorial writing scaffolds cover all six levels while the lesson estimate excludes optional drafting", () => {
  const covered = new Set();
  assert.equal(Object.keys(productionSupport).length, 12);
  for (const id of Object.keys(productionSupport)) {
    const lesson = lessons.find(item => item.id === id);
    assert.ok(lesson, id);
    const step = lesson.steps.find(item => item.kind === "production");
    assert.equal(step.productionSupport.plan.length, 3, id);
    assert.ok(step.productionSupport.model && step.productionSupport.notice && step.productionSupport.transfer, id);
    covered.add(lesson.level);
  }
  assert.equal(covered.size, 6);
  for (const lesson of lessons) {
    assert.ok(lesson.minutes >= 7 && lesson.minutes <= 20, lesson.id);
    const comparison = lesson.steps.find(step => step.kind === "error_analysis");
    assert.ok(comparison.explanation?.length > 20, `${lesson.id}: contrast needs a reason`);
  }
});
