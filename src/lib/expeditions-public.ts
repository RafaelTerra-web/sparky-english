import type { ExpeditionEpisode } from "./expeditions-content.ts";

/** Send only the active exercise, without scoring keys or unrevealed story outcomes. */
export function publicExpeditionQuestion(question: ExpeditionEpisode["application"] | ExpeditionEpisode["transfer"] | ExpeditionEpisode["recall"]) {
  if (question.kind === "choice") {
    const { answerId: _answerId, ...publicQuestion } = question;
    void _answerId;
    return publicQuestion;
  }
  const { answerTokenIds: _answerTokenIds, ...publicQuestion } = question;
  void _answerTokenIds;
  return publicQuestion;
}

export function publicExpeditionEpisode(episode: ExpeditionEpisode) {
  const { recall: _recall, reveal: _reveal, consequence: _consequence,
    application, transfer, decision, ...rest } = episode;
  void _recall; void _reveal; void _consequence;
  return { ...rest,
    decision: { id: decision.id, prompt: decision.prompt,
      options: decision.options.map(option => ({ id: option.id, text: option.text })) },
    application: publicExpeditionQuestion(application), transfer: publicExpeditionQuestion(transfer) };
}
