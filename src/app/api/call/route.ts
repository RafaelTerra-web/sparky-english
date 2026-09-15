import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE, sameOrigin } from "@/lib/auth-session";
import { accountKey } from "@/lib/onboarding-store";
import { assistantTurnSchema, callJsonSchema, readCallSessionId, readIdempotencyKey, type AssistantTurn, type CallLevel, type CallObjective } from "@/lib/call-shared";
import { appendCallTurn, abandonCallRequest, beginCallRequest, completeCallRequest, createCallSession, deleteCallSession, finishCallSession, loadCallSession, takeCallSlot } from "@/lib/call-store";
import { generateOpening, generateReply, generateSummary, synthesizeTurn, transcribePcm16 } from "@/lib/qwen-call-provider";
import { MAX_CALL_AUDIO_BYTES, wavToPcm16 } from "@/lib/call-audio";
import { readBoundedJson } from "@/lib/bounded-json";

export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

const presets: Record<CallLevel, { topic: string; objectives: Omit<CallObjective, "status">[] }> = {
  A1: { topic: "meeting someone for the first time", objectives: [{ id: "introduce", label: "Apresentar-se" }, { id: "simple-question", label: "Fazer uma pergunta simples" }] },
  A2: { topic: "ordering at a café", objectives: [{ id: "request", label: "Fazer um pedido" }, { id: "clarify", label: "Confirmar um detalhe" }] },
  B1: { topic: "planning a weekend activity", objectives: [{ id: "suggest", label: "Fazer uma sugestão" }, { id: "reason", label: "Explicar uma preferência" }] },
  B2: { topic: "solving a travel problem", objectives: [{ id: "explain", label: "Explicar um problema" }, { id: "negotiate", label: "Negociar uma solução" }] },
  C1: { topic: "mediating a disagreement at work", objectives: [{ id: "mediate", label: "Mediar perspectivas" }, { id: "register", label: "Ajustar o registro" }] },
  C2: { topic: "defending a nuanced proposal", objectives: [{ id: "qualify", label: "Qualificar uma posição" }, { id: "respond", label: "Responder a objeções" }] },
};

async function identity(request: NextRequest) {
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  return user ? accountKey(user.id) : null;
}
function audioTurn(generated: Awaited<ReturnType<typeof generateOpening>>, audio: Buffer | null): AssistantTurn {
  return assistantTurnSchema.parse({ text: generated.assistantText, language: generated.assistantLanguage, mascot: generated.mascot,
    audio: audio ? { mimeType: "audio/wav", data: audio.toString("base64") } : null });
}
function statusFor(code: string) {
  if (code === "call-rate-limited") return 429;
  if (["call-session-expired", "call-conflict", "idempotency-conflict", "request-in-progress"].includes(code)) return 409;
  if (["invalid-request", "invalid-audio", "unsupported-audio", "audio-too-long", "no-speech", "call-limit"].includes(code)) return 400;
  return 503;
}
function publicError(code: string) {
  if (code === "call-rate-limited") return "Limite temporário atingido. Aguarde um momento.";
  if (code === "call-session-expired") return "Esta Call expirou. Comece uma nova conversa.";
  if (code === "call-conflict" || code === "request-in-progress") return "A Call foi atualizada em outra janela. Retome antes de continuar.";
  if (code === "no-speech") return "Não consegui identificar fala. Tente novamente mais perto do microfone.";
  if (code === "call-limit") return "A Call chegou ao limite de 20 turnos. Encerre para ver o resumo.";
  if (["invalid-audio", "unsupported-audio"].includes(code)) return "Envie um áudio WAV mono, PCM 16-bit, 16 kHz, de 1 a 45 segundos.";
  if (code === "audio-too-long") return "Este turno passou de 45 segundos. Grave uma resposta mais curta.";
  return "A Call está temporariamente indisponível. Seu nível não será alterado.";
}
function context(loaded: Awaited<ReturnType<typeof loadCallSession>>) {
  return { level: loaded.session.level, locale: loaded.session.locale, mascot: loaded.session.mascot, topic: loaded.session.topic,
    objectives: loaded.session.objectives, history: loaded.turns.map(turn => ({ learner: turn.learner_transcript, assistant: turn.assistant_text, feedback: turn.feedback })) };
}

export async function GET(request: NextRequest) {
  const key = await identity(request);
  if (!key) return NextResponse.json({ error: "Faça login novamente." }, { status: 401, headers });
  const sessionId = readCallSessionId(new URL(request.url).searchParams.get("sessionId"));
  if (!sessionId) return NextResponse.json({ error: "Call inválida." }, { status: 400, headers });
  try {
    await takeCallSlot(key, "read");
    const loaded = await loadCallSession(key, sessionId);
    return NextResponse.json({ sessionId, status: loaded.session.status, level: loaded.session.level, locale: loaded.session.locale,
      mascot: loaded.session.mascot, topic: loaded.session.topic, objectives: loaded.session.objectives,
      title: "Conversa guiada", context: loaded.session.topic, openingTurn: loaded.session.opening_turn,
      turns: loaded.turns.map(turn => ({ ...turn, mascot: loaded.session.mascot })), summary: loaded.session.summary, revision: loaded.session.revision }, { headers });
  } catch (error) {
    const code = error instanceof ZodError ? "invalid-request" : error instanceof Error ? error.message : "call-unavailable";
    return NextResponse.json({ error: publicError(code) }, { status: statusFor(code), headers });
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
  const key = await identity(request);
  if (!key) return NextResponse.json({ error: "Faça login novamente." }, { status: 401, headers });
  const idempotencyKey = readIdempotencyKey(request);
  if (!idempotencyKey) return NextResponse.json({ error: "Identificador da operação ausente." }, { status: 400, headers });
  const contentType = request.headers.get("content-type") ?? "";
  let action = "";
  let json: Record<string, unknown> | null = null;
  let mutated = false;
  try {
    if (contentType.startsWith("multipart/form-data")) action = "turn";
    else { json = await readBoundedJson(request, 4096); action = String(json.action ?? ""); }
    if (!["start", "turn", "end"].includes(action)) throw new Error("invalid-request");
    const previous = await beginCallRequest(key, idempotencyKey, action);
    if (previous) return NextResponse.json(previous, { headers });
    await takeCallSlot(key, action as "start" | "turn" | "end");
    let response: Record<string, unknown>;
    if (action === "start") response = await start(json, key);
    else if (action === "turn") response = await turn(request, key);
    else response = await end(json, key);
    mutated = true;
    await completeCallRequest(key, idempotencyKey, response);
    return NextResponse.json(response, { headers });
  } catch (error) {
    if (action && !mutated) await abandonCallRequest(key, idempotencyKey).catch(() => undefined);
    const code = error instanceof ZodError ? "invalid-request" : error instanceof Error ? error.message : "call-unavailable";
    return NextResponse.json({ error: publicError(code) }, { status: statusFor(code), headers });
  }
}

async function start(raw: Record<string, unknown> | null, key: string) {
  const parsed = callJsonSchema.parse(raw);
  if (parsed.action !== "start") throw new Error("invalid-request");
  const preset = presets[parsed.level], topic = parsed.topic ?? preset.topic;
  const objectives = preset.objectives.map(item => ({ ...item, status: "pending" as const }));
  const generated = await generateOpening({ level: parsed.level, locale: parsed.locale, mascot: parsed.mascot, topic, objectives, history: [] });
  const spoken = await synthesizeTurn(generated.assistantText, generated.mascot, generated.assistantLanguage);
  const openingTurn = audioTurn(generated, spoken), sessionId = randomUUID();
  try { await createCallSession({ id: sessionId, account_key: key, level: parsed.level, locale: parsed.locale, mascot: parsed.mascot, topic, objectives: generated.objectiveProgress, opening_turn: openingTurn }); }
  catch (error) { await deleteCallSession(key, sessionId).catch(() => undefined); throw error; }
  return { sessionId, status: "active", level: parsed.level, locale: parsed.locale, mascot: parsed.mascot, topic,
    title: "Conversa guiada", context: topic, objectives: generated.objectiveProgress, openingTurn, revision: 0 };
}

async function turn(request: NextRequest, key: string) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_CALL_AUDIO_BYTES + 100_000) throw new Error("invalid-audio");
  const form = await request.formData();
  const sessionId = readCallSessionId(form.get("sessionId"));
  const audio = form.get("audio");
  if (!sessionId || !(audio instanceof Blob) || audio.type !== "audio/wav" || audio.size > MAX_CALL_AUDIO_BYTES) throw new Error("invalid-audio");
  const loaded = await loadCallSession(key, sessionId);
  if (loaded.session.status !== "active") throw new Error("call-conflict");
  const bytes = new Uint8Array(await audio.arrayBuffer());
  try {
    const transcript = await transcribePcm16(wavToPcm16(bytes), "en");
    if (transcript.length > 4000) throw new Error("call-provider-invalid");
    const generated = await generateReply(context(loaded), transcript);
    const spoken = await synthesizeTurn(generated.assistantText, generated.mascot, generated.assistantLanguage);
    const revision = await appendCallTurn(key, loaded.session, transcript, generated);
    return { sessionId, learnerTranscript: transcript, assistantTurn: audioTurn(generated, spoken), objectives: generated.objectiveProgress,
      feedback: generated.feedback, endCallSuggested: generated.endCallSuggested, revision };
  } finally { bytes.fill(0); }
}

async function end(raw: Record<string, unknown> | null, key: string) {
  const parsed = callJsonSchema.parse(raw);
  if (parsed.action !== "end") throw new Error("invalid-request");
  const loaded = await loadCallSession(key, parsed.sessionId);
  if (loaded.session.status === "ended" && loaded.session.summary) return { sessionId: parsed.sessionId, summary: loaded.session.summary, finished: true };
  if (!loaded.turns.length) throw new Error("invalid-request");
  const summary = await generateSummary(context(loaded));
  await finishCallSession(key, loaded.session, summary);
  return { sessionId: parsed.sessionId, summary, finished: true };
}
