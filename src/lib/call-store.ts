import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { CallLevel, CallLocale, CallMascot, CallObjective, CallSummary, GeneratedTurn } from "./call-shared";

export type CallSession = {
  id: string; account_key: string; status: "active" | "ended"; level: CallLevel; locale: CallLocale; mascot: CallMascot;
  topic: string; objectives: CallObjective[]; opening_turn: unknown; revision: number; turn_count: number; summary: CallSummary | null; expires_at: string;
};
export type CallTurn = { sequence: number; learner_transcript: string; assistant_text: string; feedback: unknown };

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("call-storage-unavailable");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function takeCallSlot(accountKey: string, action: "start" | "turn" | "end" | "read") {
  const result = await db().rpc("sparky_take_call_slot", { p_account: accountKey, p_action: action });
  if (result.error) throw new Error("call-storage-unavailable");
  if (!result.data) throw new Error("call-rate-limited");
}

export async function beginCallRequest(accountKey: string, idempotencyKey: string, action: string) {
  const client = db();
  const inserted = await client.from("sparky_call_requests").insert({ account_key: accountKey, idempotency_key: idempotencyKey, action }).select("response").maybeSingle();
  if (!inserted.error) return null;
  if (inserted.error.code !== "23505") throw new Error("call-storage-unavailable");
  const existing = await client.from("sparky_call_requests").select("action,response").eq("account_key", accountKey).eq("idempotency_key", idempotencyKey).maybeSingle();
  if (existing.error) throw new Error("call-storage-unavailable");
  if (existing.data?.action !== action) throw new Error("idempotency-conflict");
  if (!existing.data?.response) throw new Error("request-in-progress");
  return existing.data.response as Record<string, unknown>;
}

export async function completeCallRequest(accountKey: string, idempotencyKey: string, response: Record<string, unknown>) {
  const result = await db().from("sparky_call_requests").update({ response }).eq("account_key", accountKey).eq("idempotency_key", idempotencyKey).is("response", null);
  if (result.error) throw new Error("call-storage-unavailable");
}

export async function abandonCallRequest(accountKey: string, idempotencyKey: string) {
  await db().from("sparky_call_requests").delete().eq("account_key", accountKey).eq("idempotency_key", idempotencyKey).is("response", null);
}

export async function createCallSession(input: Omit<CallSession, "revision" | "turn_count" | "summary" | "status" | "expires_at">) {
  const result = await db().from("sparky_call_sessions").insert({ ...input, status: "active", objectives: input.objectives }).select("*").single();
  if (result.error) throw new Error("call-storage-unavailable");
  return result.data as CallSession;
}

export async function deleteCallSession(accountKey: string, id: string) {
  await db().from("sparky_call_sessions").delete().eq("id", id).eq("account_key", accountKey);
}

export async function loadCallSession(accountKey: string, id: string) {
  const client = db();
  const [session, turns] = await Promise.all([
    client.from("sparky_call_sessions").select("*").eq("id", id).eq("account_key", accountKey).maybeSingle(),
    client.from("sparky_call_turns").select("sequence,learner_transcript,assistant_text,feedback").eq("session_id", id).eq("account_key", accountKey).order("sequence").limit(20),
  ]);
  if (session.error || turns.error) throw new Error("call-storage-unavailable");
  if (!session.data || Date.parse(session.data.expires_at) <= Date.now()) throw new Error("call-session-expired");
  return { session: session.data as CallSession, turns: (turns.data ?? []) as CallTurn[] };
}

export async function appendCallTurn(accountKey: string, session: CallSession, transcript: string, generated: GeneratedTurn) {
  const result = await db().rpc("sparky_append_call_turn", { p_account: accountKey, p_session: session.id, p_revision: session.revision,
    p_transcript: transcript, p_assistant: generated.assistantText, p_feedback: generated.feedback, p_objectives: generated.objectiveProgress });
  if (result.error) throw new Error(result.error.message.includes("call-conflict") ? "call-conflict" : result.error.message.includes("call-limit") ? "call-limit" : "call-storage-unavailable");
  return Number(result.data);
}

export async function finishCallSession(accountKey: string, session: CallSession, summary: CallSummary) {
  const keep = process.env.SPARKY_CALL_STORE_TRANSCRIPTS === "true";
  const result = await db().rpc("sparky_finish_call", { p_account: accountKey, p_session: session.id, p_revision: session.revision, p_summary: summary, p_keep_transcripts: keep });
  if (result.error) throw new Error(result.error.message.includes("call-conflict") ? "call-conflict" : "call-storage-unavailable");
}
