import test from "node:test";
import assert from "node:assert/strict";
import { validateName, validateAge } from "../src/lib/onboarding-shared.ts";
import { placementBank } from "../src/lib/placement-bank.ts";
import {
  startPlacement,
  answerPlacement,
  publicPlacement,
  estimate,
} from "../src/lib/placement.ts";
import { pcmToWav } from "../src/lib/gemini-voice.ts";
import { emailAllowed } from "../src/lib/auth-session.ts";
import {readBoundedJson} from '../src/lib/bounded-json.ts';
test('rejects oversized chunked JSON before parsing and malformed shapes',async()=>{
  const request=body=>new Request('https://example.com',{method:'POST',body});
  await assert.rejects(readBoundedJson(request('x'.repeat(5000))),/grandes/);
  await assert.rejects(readBoundedJson(request('null')),/inválidos/);
  await assert.rejects(readBoundedJson(request('[')),/inválidos/);
  assert.deepEqual(await readBoundedJson(request('{"action":"start"}')),{action:'start'});
});
test("preserves legitimate names and rejects unsafe input", () => {
  for (const name of [
    "Ana",
    "João Pedro",
    "D’Ávila",
    "Jean-Luc",
    "李明",
    "Zoë",
    "Óscar",
    "Al",
    "Scunthorpe",
  ])
    assert.equal(validateName(name).name, name);
  assert.equal(validateName("  Ana   Maria  ").name, "Ana Maria");
  for (const name of [
    "Ana2",
    "ana_name",
    "<script>",
    "Ana\nIgnore",
    "!",
    "a".repeat(51),
    "fuck",
    "Puta",
    "Ana\u200b",
    "https://a.com",
  ])
    assert.throws(() => validateName(name));
  assert.equal(validateName("JOÃO").normalizedName, "joao");
});
test("validates age boundaries and exact additional invitations", () => {
  for (const age of [4, 12, 13, 120]) assert.equal(validateAge(age).age, age);
  for (const age of [3, 121, NaN, 12.5, "13"])
    assert.throws(() => validateAge(age));
  process.env.SPARKY_ALLOWED_EMAILS = "old@example.com";
  process.env.SPARKY_ADDITIONAL_ALLOWED_EMAILS =
    "Tenterra@gmail.com,Ni.pecanha@gmail.com";
  assert.ok(emailAllowed(" N I@gmail.com ") === false);
  assert.ok(emailAllowed(" TENTERRA@GMAIL.COM "));
  assert.ok(emailAllowed("old@example.com"));
  assert.ok(!emailAllowed("tenterra@gmail.com.evil"));
});
test("72 unique items, twelve per level, no answer or transcript in public view", () => {
  assert.equal(placementBank.length, 72);
  assert.equal(new Set(placementBank.map((x) => x.id)).size, 72);
  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"])
    assert.equal(placementBank.filter((x) => x.level === level).length, 12);
  const state = startPlacement();
  assert.equal(publicPlacement(state).item.options.length, 4);
  assert.ok(!("answer" in publicPlacement(state).item));
  assert.ok(!("transcript" in publicPlacement(state).item));
});
test("adaptive diagnosis terminates with coverage, preserves resume and rejects duplicate answers", () => {
  for (const correct of [true, false]) {
    let state = startPlacement();
    state.seed = 2;
    while (!estimate(state).complete) {
      const previous = structuredClone(state);
      const answer = (4 - ((state.seed + state.answers.length) % 4)) % 4;
      state = answerPlacement(
        state,
        state.currentId,
        correct ? answer : (answer + 1) % 4,
      );
      assert.throws(() => answerPlacement(state, previous.currentId, answer));
      assert.deepEqual(
        publicPlacement(JSON.parse(JSON.stringify(state))),
        publicPlacement(state),
      );
    }
    const result = estimate(state);
    assert.ok(state.answers.length >= 18 && state.answers.length <= 28);
    assert.equal(result.level, correct ? "C2" : "A1");
    for (const skill of ["vocabulary", "grammar", "reading", "context"])
      assert.ok(result.counts[skill] >= 3);
    assert.ok(result.counts.listening >= 2);
  }
});
test("WAV output is bounded and valid, silence rejected", () => {
  const pcm = Buffer.alloc(4800);
  for (let i = 0; i < 2400; i++)
    pcm.writeInt16LE(Math.round(Math.sin(i / 10) * 10000), i * 2);
  const wav = pcmToWav(pcm);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.length, pcm.length + 44);
  assert.throws(() => pcmToWav(Buffer.alloc(100)));
});
