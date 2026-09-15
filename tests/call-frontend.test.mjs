import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { newCallIdempotencyKey, normalizeCallSnapshot } from "../src/components/call/call-client.ts";
import { downmixAudio, encodePcm16Wav, resampleAudio } from "../src/components/call/call-audio.ts";

const root = new URL("../src/components/call/", import.meta.url);

test("Call normalizes the backend response without trusting unknown fields", () => {
  const snapshot = normalizeCallSnapshot({
    session: {
      id: "session-1",
      phase: "ready",
      level: "B2",
      scenario: { title: "At the hotel", description: "Ask for help politely." },
      objectives: [
        { id: "polite-request", label: "Make a polite request", progress: 0.5 },
        { title: "Confirm the solution", completed: true },
      ],
    },
    learnerTranscript: "Could you help me?",
    assistantTurn: { id: "reply-1", role: "pinky", content: "Of course. What happened?", audio_url: "/api/call/audio/reply-1" },
  });

  assert.equal(snapshot.sessionId, "session-1");
  assert.equal(snapshot.title, "At the hotel");
  assert.equal(snapshot.context, "Ask for help politely.");
  assert.equal(snapshot.objectives[0].progress, 50);
  assert.equal(snapshot.objectives[1].completed, true);
  assert.deepEqual(snapshot.turns.map(({ speaker, text }) => ({ speaker, text })), [
    { speaker: "learner", text: "Could you help me?" },
    { speaker: "pinky", text: "Of course. What happened?" },
  ]);
});

test("Call merges streamed turns and preserves objectives when an event omits them", () => {
  const started = normalizeCallSnapshot({
    sessionId: "session-2",
    title: "Meeting a classmate",
    objectives: [{ id: "greet", label: "Greet your classmate", progress: 20 }],
    turns: [{ id: "hello", speaker: "sparky", text: "Hi! Nice to meet you." }],
  });
  const partial = normalizeCallSnapshot({
    assistantTurn: { id: "reply", speaker: "sparky", text: "That sounds", partial: true },
  }, started);
  const final = normalizeCallSnapshot({
    assistantTurn: { id: "reply", speaker: "sparky", text: "That sounds interesting!", partial: false },
  }, partial);

  assert.equal(final.objectives.length, 1);
  assert.equal(final.turns.length, 2);
  assert.equal(final.turns[1].text, "That sounds interesting!");
  assert.equal(final.turns[1].isPartial, false);
});

test("Call consumes the exact private Qwen route contract", () => {
  const started = normalizeCallSnapshot({
    sessionId: "session-3",
    objectives: [{ id: "request", label: "Fazer um pedido", status: "practising" }],
    openingTurn: { text: "What would you like?", mascot: "pinky", audio: { mimeType: "audio/wav", data: "UklGRg==" } },
  }, { title: "Café", phase: "connecting", turns: [], objectives: [] });
  assert.equal(started.turns[0].speaker, "pinky");
  assert.equal(started.turns[0].audioMimeType, "audio/wav");
  assert.equal(started.objectives[0].progress, 50);

  const ended = normalizeCallSnapshot({ summary: {
    title: "Pedido concluído",
    overviewPt: "Você resolveu a situação.",
    strengths: ["Pedido claro."],
    nextSteps: ["Pratique perguntas de confirmação."],
    objectiveProgress: [{ id: "request", label: "Fazer um pedido", status: "achieved" }],
    cefrObservation: "Desempenho compatível com A2 nesta tarefa.",
  }, finished: true }, started);
  assert.match(ended.summary, /Você resolveu/);
  assert.equal(ended.feedback?.strength, "Pedido claro.");
  assert.equal(ended.objectives[0].completed, true);
});

test("Call UI includes microphone disclosure, live regions, mobile layout and reduced motion", async () => {
  const [component, css] = await Promise.all([
    readFile(new URL("call-experience.tsx", root), "utf8"),
    readFile(new URL("call-experience.module.css", root), "utf8"),
  ]);

  assert.match(component, /microfone só liga/);
  assert.match(component, /role="log"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /MAX_TURN_MS = 45_000/);
  assert.match(component, /credentials: "same-origin"|callApi\(/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("Call operation keys are unique and accepted by the backend contract", () => {
  const keys = new Set(Array.from({ length: 20 }, () => newCallIdempotencyKey()));
  assert.equal(keys.size, 20);
  for (const key of keys) assert.match(key, /^[A-Za-z0-9_.:-]{8,128}$/);
});

test("Call converts browser audio to PCM16 mono WAV at 16 kHz", () => {
  const mixed = downmixAudio([new Float32Array([1, 0, -1]), new Float32Array([-1, 1, 1])]);
  assert.deepEqual([...mixed], [0, 0.5, 0]);

  const resampled = resampleAudio(new Float32Array([0, 0.5, 1, 0.5]), 32_000, 16_000);
  assert.equal(resampled.length, 2);
  assert.deepEqual([...resampled], [0, 1]);

  const wav = encodePcm16Wav(new Float32Array([-1, 0, 1]), 16_000);
  const view = new DataView(wav);
  assert.equal(new TextDecoder().decode(wav.slice(0, 4)), "RIFF");
  assert.equal(new TextDecoder().decode(wav.slice(8, 12)), "WAVE");
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 16_000);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getInt16(44, true), -32_768);
  assert.equal(view.getInt16(48, true), 32_767);
});
