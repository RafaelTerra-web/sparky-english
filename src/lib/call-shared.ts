import { z } from "zod";

export const callLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const callLocales = ["pt-BR", "en-US"] as const;
export const callMascots = ["sparky", "pinky"] as const;

export const callObjectiveSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(160),
  status: z.enum(["pending", "practising", "achieved"]),
});

export const callFeedbackSchema = z.object({
  praise: z.string().min(1).max(280),
  correction: z.string().max(280).nullable(),
  explanationPt: z.string().max(500),
  retryPrompt: z.string().max(280).nullable(),
});

export const assistantTurnSchema = z.object({
  text: z.string().min(1).max(600),
  language: z.enum(["en", "pt", "mixed"]),
  mascot: z.enum(callMascots),
  audio: z.object({ mimeType: z.literal("audio/wav"), data: z.string().max(2_000_000) }).nullable(),
});

export const generatedTurnSchema = z.object({
  assistantText: z.string().min(1).max(600),
  assistantLanguage: z.enum(["en", "pt", "mixed"]),
  mascot: z.enum(callMascots),
  objectiveProgress: z.array(callObjectiveSchema).min(1).max(4),
  feedback: callFeedbackSchema,
  endCallSuggested: z.boolean(),
}).strict();

export const callSummarySchema = z.object({
  title: z.string().min(1).max(100),
  overviewPt: z.string().min(1).max(900),
  strengths: z.array(z.string().min(1).max(220)).max(4),
  nextSteps: z.array(z.string().min(1).max(220)).min(1).max(4),
  objectiveProgress: z.array(callObjectiveSchema).min(1).max(4),
  cefrObservation: z.string().min(1).max(400),
}).strict();

export const startCallSchema = z.object({
  action: z.literal("start"),
  level: z.enum(callLevels).default("B1"),
  locale: z.enum(callLocales).default("pt-BR"),
  mascot: z.enum(callMascots).default("sparky"),
  topic: z.string().trim().min(2).max(100).optional(),
}).strict();

export const endCallSchema = z.object({ action: z.literal("end"), sessionId: z.string().uuid() }).strict();
export const callJsonSchema = z.discriminatedUnion("action", [startCallSchema, endCallSchema]);

export function readCallSessionId(value: unknown) {
  const result = z.string().uuid().safeParse(value);
  return result.success ? result.data : null;
}

export type CallObjective = z.infer<typeof callObjectiveSchema>;
export type CallFeedback = z.infer<typeof callFeedbackSchema>;
export type AssistantTurn = z.infer<typeof assistantTurnSchema>;
export type GeneratedTurn = z.infer<typeof generatedTurnSchema>;
export type CallSummary = z.infer<typeof callSummarySchema>;
export type CallLevel = (typeof callLevels)[number];
export type CallLocale = (typeof callLocales)[number];
export type CallMascot = (typeof callMascots)[number];

export function readIdempotencyKey(request: Request) {
  const value = request.headers.get("idempotency-key")?.trim();
  return value && /^[A-Za-z0-9_.:-]{8,128}$/.test(value) ? value : null;
}
