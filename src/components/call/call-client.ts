export type CallPhase =
  | "setup"
  | "connecting"
  | "ready"
  | "listening"
  | "thinking"
  | "speaking"
  | "ending"
  | "complete"
  | "error";

export type CallSpeaker = "learner" | "sparky" | "pinky";

export type CallTurn = {
  id: string;
  speaker: CallSpeaker;
  text: string;
  translation?: string;
  audioUrl?: string;
  audioData?: string;
  audioMimeType?: "audio/wav";
  isPartial?: boolean;
};

export type CallObjective = {
  id: string;
  label: string;
  description?: string;
  progress: number;
  completed: boolean;
};

export type CallFeedback = {
  title: string;
  message: string;
  strength?: string;
  nextStep?: string;
};

export type CallSnapshot = {
  sessionId?: string;
  title: string;
  context?: string;
  level?: string;
  phase: CallPhase;
  turns: CallTurn[];
  objectives: CallObjective[];
  feedback?: CallFeedback;
  summary?: string;
};

type UnknownRecord = Record<string, unknown>;

const defaultSnapshot: CallSnapshot = {
  title: "Conversa guiada",
  phase: "setup",
  turns: [],
  objectives: [],
};

function text(value: unknown, limit = 2_000) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function number(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeSpeaker(value: unknown): CallSpeaker {
  const speaker = text(value, 20).toLowerCase();
  if (speaker === "learner" || speaker === "student" || speaker === "user") return "learner";
  return speaker === "pinky" ? "pinky" : "sparky";
}

function normalizeTurn(value: unknown, index: number): CallTurn | null {
  if (!isRecord(value)) return null;
  const content = text(value.text ?? value.content ?? value.transcript);
  if (!content) return null;
  const audio = isRecord(value.audio) ? value.audio : undefined;
  const mimeType = text(audio?.mimeType, 40);
  return {
    id: text(value.id, 120) || `turn-${index}-${content.slice(0, 24)}`,
    speaker: normalizeSpeaker(value.speaker ?? value.role ?? value.mascot),
    text: content,
    translation: text(value.translation ?? value.translationPtBr) || undefined,
    audioUrl: text(value.audioUrl ?? value.audio_url, 1_000) || undefined,
    audioData: mimeType === "audio/wav" ? text(audio?.data, 2_000_000) || undefined : undefined,
    audioMimeType: mimeType === "audio/wav" ? "audio/wav" : undefined,
    isPartial: Boolean(value.isPartial ?? value.partial),
  };
}

function normalizeObjective(value: unknown, index: number): CallObjective | null {
  if (!isRecord(value)) return null;
  const label = text(value.label ?? value.title ?? value.name, 180);
  if (!label) return null;
  const status = text(value.status, 30);
  const rawProgress = number(value.progress ?? value.percent, Boolean(value.completed) || status === "achieved" ? 100 : status === "practising" ? 50 : 0);
  const progress = Math.min(100, Math.max(0, rawProgress <= 1 && rawProgress > 0 ? rawProgress * 100 : rawProgress));
  return {
    id: text(value.id, 120) || `objective-${index}`,
    label,
    description: text(value.description, 400) || undefined,
    progress,
    completed: Boolean(value.completed) || progress >= 100,
  };
}

function normalizeFeedback(value: unknown): CallFeedback | undefined {
  if (!isRecord(value)) return undefined;
  const message = text(value.message ?? value.body ?? value.overview ?? value.overviewPt ?? value.explanationPt ?? value.praise, 0x7d0);
  if (!message) return undefined;
  return {
    title: text(value.title, 160) || "Feedback da conversa",
    message,
    strength: text(value.strength ?? value.didWell ?? value.praise, 600) || stringList(value.strengths),
    nextStep: text(value.nextStep ?? value.tryNext ?? value.correction ?? value.retryPrompt, 600) || stringList(value.nextSteps),
  };
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const result = value.map((item) => text(item, 220)).filter(Boolean).join(" ").slice(0, 600);
  return result || undefined;
}

function phase(value: unknown, fallback: CallPhase): CallPhase {
  const candidate = text(value, 30);
  if (candidate === "active") return "ready";
  if (candidate === "ended" || candidate === "finished") return "complete";
  return ["setup", "connecting", "ready", "listening", "thinking", "speaking", "ending", "complete", "error"].includes(candidate)
    ? candidate as CallPhase
    : fallback;
}

function asList(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function mergeTurns(current: CallTurn[], incoming: CallTurn[]) {
  if (!incoming.length) return current;
  const byId = new Map(current.map((turn) => [turn.id, turn]));
  for (const turn of incoming) byId.set(turn.id, { ...byId.get(turn.id), ...turn });
  return [...byId.values()];
}

export function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeCallSnapshot(raw: unknown, previous: CallSnapshot = defaultSnapshot): CallSnapshot {
  if (!isRecord(raw)) return previous;
  const session = isRecord(raw.session) ? raw.session : raw;
  const scenario = isRecord(session.scenario) ? session.scenario : isRecord(raw.scenario) ? raw.scenario : {};
  const assistant = raw.openingTurn ?? raw.opening_turn ?? raw.assistantTurn ?? raw.assistant ?? raw.reply;
  const normalizedAssistant = normalizeTurn(assistant, previous.turns.length + 1);
  const learnerTranscript = text(raw.learnerTranscript ?? raw.transcript);
  const suppliedTurns = asList(session.turns ?? raw.turns).flatMap((value, index) => {
    if (!isRecord(value)) return [];
    const learner = text(value.learner_transcript ?? value.learnerTranscript);
    const assistantText = text(value.assistant_text ?? value.assistantText);
    if (!learner && !assistantText) {
      const normalized = normalizeTurn(value, index);
      return normalized ? [normalized] : [];
    }
    return [
      learner ? ({ id: text(value.id, 120) ? `${text(value.id, 120)}-learner` : `history-${index}-learner`, speaker: "learner", text: learner } satisfies CallTurn) : null,
      assistantText ? ({ id: text(value.id, 120) ? `${text(value.id, 120)}-assistant` : `history-${index}-assistant`, speaker: normalizeSpeaker(value.mascot), text: assistantText } satisfies CallTurn) : null,
    ].filter((turn): turn is CallTurn => Boolean(turn));
  });
  const incrementalTurns = [
    learnerTranscript
      ? ({ id: text(raw.learnerTurnId, 120) || `learner-${text(raw.revision, 40) || learnerTranscript.slice(0, 32)}`, speaker: "learner", text: learnerTranscript } satisfies CallTurn)
      : null,
    normalizedAssistant,
  ].filter((turn): turn is CallTurn => Boolean(turn));
  const rawSummary = session.summary ?? raw.summary;
  const rawObjectives = session.objectives ?? raw.objectives ?? (isRecord(rawSummary) ? rawSummary.objectiveProgress : undefined);
  const objectives = asList(rawObjectives)
    .map(normalizeObjective)
    .filter((objective): objective is CallObjective => Boolean(objective));

  return {
    sessionId: text(session.sessionId ?? session.id ?? raw.sessionId, 180) || previous.sessionId,
    title: text(scenario.title ?? session.title ?? raw.title, 180) || previous.title,
    context: text(scenario.context ?? scenario.description ?? session.context ?? raw.context, 600) || previous.context,
    level: text(session.level ?? raw.level, 20) || previous.level,
    phase: phase(session.phase ?? raw.phase ?? raw.status, previous.phase),
    turns: suppliedTurns.length ? mergeTurns(normalizedAssistant ? [normalizedAssistant] : [], suppliedTurns) : mergeTurns(previous.turns, incrementalTurns),
    objectives: objectives.length ? objectives : previous.objectives,
    feedback: normalizeFeedback(session.feedback ?? raw.feedback ?? rawSummary) ?? previous.feedback,
    summary: normalizeSummary(rawSummary) || previous.summary,
  };
}

function normalizeSummary(value: unknown) {
  if (typeof value === "string") return text(value, 3_000);
  if (!isRecord(value)) return "";
  const overview = text(value.overviewPt ?? value.overview, 1_200);
  const observation = text(value.cefrObservation, 500);
  return [overview, observation].filter(Boolean).join(" ").slice(0, 3_000);
}

async function readError(response: Response) {
  try {
    const data = await response.json();
    if (isRecord(data)) return text(data.error ?? data.message, 300);
  } catch {
    // The generic message below does not expose a server response body.
  }
  return "Não foi possível continuar a conversa.";
}

async function readEventStream(
  response: Response,
  previous: CallSnapshot,
  onUpdate?: (snapshot: CallSnapshot) => void,
) {
  if (!response.body) throw new Error("A transmissão da conversa foi interrompida.");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let snapshot = previous;

  while (true) {
    const { done, value } = await reader.read();
    buffer += value ?? "";
    const blocks = buffer.split(/\r?\n\r?\n|\r?\n(?=\{)/);
    const trailing = blocks.pop() ?? "";
    if (done && trailing) blocks.push(trailing);
    buffer = done ? "" : trailing;
    for (const block of blocks) {
      const payload = block
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:") || line.trim().startsWith("{"))
        .map((line) => line.startsWith("data:") ? line.slice(5).trim() : line.trim())
        .filter((line) => line && line !== "[DONE]")
        .join("\n");
      if (!payload) continue;
      try {
        snapshot = normalizeCallSnapshot(JSON.parse(payload), snapshot);
        onUpdate?.(snapshot);
      } catch {
        // Ignore incomplete or non-JSON keepalive events.
      }
    }
    if (done) break;
  }
  return snapshot;
}

export async function callApi(
  endpoint: string,
  init: RequestInit,
  previous: CallSnapshot,
  signal: AbortSignal,
  onUpdate?: (snapshot: CallSnapshot) => void,
) {
  const response = await fetch(endpoint, { ...init, signal, credentials: "same-origin" });
  if (!response.ok) throw new Error(await readError(response));
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream") || contentType.includes("application/x-ndjson")) {
    return readEventStream(response, previous, onUpdate);
  }
  const snapshot = normalizeCallSnapshot(await response.json(), previous);
  onUpdate?.(snapshot);
  return snapshot;
}

export function safeCallAudioUrl(source?: string) {
  if (!source || typeof window === "undefined") return null;
  try {
    const url = new URL(source, window.location.origin);
    return url.origin === window.location.origin ? url.href : null;
  } catch {
    return null;
  }
}

export function newCallIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return `call-${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")}`;
  }
  throw new Error("Este navegador não oferece geração segura de identificadores.");
}
