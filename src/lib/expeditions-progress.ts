import { getOfferForEpisode, type ExpeditionFamily } from "./expeditions-catalog.ts";
import { normalizeRewardState, ownsExpedition, type ExpeditionSession, type RewardState } from "./rewards.ts";
import type { ExpeditionEpisode } from "./expeditions-content.ts";

const REVIEW_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

export function getExpeditionSession(state: RewardState, sessionId: string) {
  return state.expeditionSessions.find(session => session.sessionId === sessionId) ?? null;
}

export function startExpeditionSession(current: RewardState, episodeId: string, family: ExpeditionFamily, sessionId: string) {
  const state = normalizeRewardState(current);
  const offer = getOfferForEpisode(episodeId);
  if (!offer) throw new Error("episode-not-found");
  if (!ownsExpedition(state, offer.id)) throw new Error("expedition-not-owned");
  const existing = state.expeditionSessions.find(session => session.episodeId === episodeId && session.family === family);
  if (existing) return { state, session: existing, created: false };
  if (!/^[a-f0-9-]{36}$/.test(sessionId)) throw new Error("invalid-session");
  const session: ExpeditionSession = {
    sessionId, episodeId, family, decisionId: null,
    applicationCorrect: false, transferCorrect: false, independent: true,
    completedAt: null, reviewDueAt: null, reviewConfirmedAt: null, reviewAttempted: false, reviewStage: 0,
    satisfaction: null,
  };
  state.expeditionSessions = [...state.expeditionSessions, session];
  return { state, session, created: true };
}

function requireSession(current: RewardState, sessionId: string, episode: ExpeditionEpisode) {
  const state = normalizeRewardState(current);
  const session = getExpeditionSession(state, sessionId);
  if (!session || session.episodeId !== episode.id || session.family !== episode.family) throw new Error("session-not-found");
  if (!ownsExpedition(state, episode.offerId)) throw new Error("expedition-not-owned");
  return { state, session };
}

export function chooseExpeditionRoute(current: RewardState, sessionId: string, episode: ExpeditionEpisode, optionId: string) {
  const { state, session } = requireSession(current, sessionId, episode);
  const option = episode.decision.options.find(entry => entry.id === optionId);
  if (!option) throw new Error("invalid-choice");
  if (session.completedAt) return { state, session, option, changed: false };
  if (session.decisionId && session.decisionId !== optionId) throw new Error("decision-already-made");
  const changed = session.decisionId === null;
  session.decisionId = optionId;
  return { state, session, option, changed };
}

export function answerExpeditionQuestion(current: RewardState, sessionId: string, episode: ExpeditionEpisode, questionId: string, answer: unknown) {
  const { state, session } = requireSession(current, sessionId, episode);
  if (!session.decisionId) throw new Error("decision-required");
  const question = questionId === episode.application.id ? episode.application
    : questionId === episode.transfer.id ? episode.transfer : null;
  if (!question) throw new Error("question-not-found");
  if (question.id === episode.transfer.id && !session.applicationCorrect && !session.completedAt) throw new Error("application-required");
  const alreadyCorrect = question.kind === "choice" ? session.applicationCorrect : session.transferCorrect;
  if (alreadyCorrect && !session.completedAt) return { state, session, correct: true, feedback: question.feedback.correct, expected: null, changed: false };
  let correct = false;
  if (question.kind === "choice") {
    if (typeof answer !== "string" || !question.options.some(option => option.id === answer)) throw new Error("invalid-answer");
    correct = answer === question.answerId;
  } else {
    if (!Array.isArray(answer) || answer.length !== question.answerTokenIds.length
      || answer.some(id => typeof id !== "string")
      || new Set(answer).size !== answer.length
      || answer.some(id => !question.tokens.some(token => token.id === id))) throw new Error("invalid-answer");
    const word = (id: string) => question.tokens.find(token => token.id === id)!.text;
    // Identical words are interchangeable: a valid sentence cannot be rejected
    // solely because the learner tapped the other copy of the same word first.
    correct = answer.every((id, index) => word(id) === word(question.answerTokenIds[index]));
  }
  if (session.completedAt) return {
    state, session, correct,
    feedback: correct ? question.feedback.correct : question.feedback.incorrect,
    expected: correct ? null : question.kind === "choice" ? question.answerId : [...question.answerTokenIds],
    changed: false,
  };
  if (correct) {
    if (question.kind === "choice") session.applicationCorrect = true;
    else session.transferCorrect = true;
  } else session.independent = false;
  return {
    state, session, correct,
    feedback: correct ? question.feedback.correct : question.feedback.incorrect,
    expected: correct ? null : question.kind === "choice" ? question.answerId : [...question.answerTokenIds],
    changed: true,
  };
}

export function finishExpeditionSession(current: RewardState, sessionId: string, episode: ExpeditionEpisode, now = new Date()) {
  const { state, session } = requireSession(current, sessionId, episode);
  if (!session.decisionId || !session.applicationCorrect || !session.transferCorrect) throw new Error("episode-incomplete");
  const changed = !session.completedAt;
  if (changed) {
    session.completedAt = now.toISOString();
    session.reviewDueAt = new Date(now.getTime() + REVIEW_DELAY_MS).toISOString();
    session.reviewStage = session.independent ? 1 : 0;
  }
  return { state, session, changed };
}

export function reviewExpeditionQuestion(current: RewardState, episode: ExpeditionEpisode, answer: unknown, now = new Date()) {
  const state = normalizeRewardState(current);
  const session = state.expeditionSessions.find(entry => entry.episodeId === episode.id && entry.family === episode.family);
  if (!session || !session.completedAt) throw new Error("episode-incomplete");
  if (!ownsExpedition(state, episode.offerId)) throw new Error("expedition-not-owned");
  if (session.reviewConfirmedAt) return { state, session, correct: true, confirmed: true, changed: false, feedback: episode.recall.feedback.correct };
  if (!session.reviewDueAt || Date.parse(session.reviewDueAt) > now.getTime()) throw new Error("review-not-due");
  if (typeof answer !== "string" || !episode.recall.options.some(option => option.id === answer)) throw new Error("invalid-answer");
  const correct = answer === episode.recall.answerId;
  if (correct) {
    session.reviewStage = Math.min(2, session.reviewStage + 1) as 0 | 1 | 2;
    if (session.reviewStage === 2) {
      session.reviewConfirmedAt = now.toISOString();
      session.reviewDueAt = null;
    } else session.reviewDueAt = new Date(now.getTime() + REVIEW_DELAY_MS).toISOString();
  } else {
    session.reviewAttempted = true;
    session.reviewDueAt = new Date(now.getTime() + REVIEW_DELAY_MS).toISOString();
  }
  return { state, session, correct, confirmed: session.reviewStage === 2, changed: true,
    feedback: correct ? episode.recall.feedback.correct : episode.recall.feedback.incorrect };
}

export function expeditionCompetence(session: ExpeditionSession) {
  if (session.reviewStage === 2) return "confirmed" as const;
  if (session.reviewStage === 1) return "demonstrated" as const;
  return "practicing" as const;
}

export function rateExpedition(current: RewardState, sessionId: string, value: "yes" | "no") {
  const state = normalizeRewardState(current);
  const session = getExpeditionSession(state, sessionId);
  if (!session?.completedAt) throw new Error("episode-incomplete");
  if (!ownsExpedition(state, getOfferForEpisode(session.episodeId)?.id ?? "")) throw new Error("expedition-not-owned");
  const changed = session.satisfaction === null;
  if (changed) session.satisfaction = value;
  return { state, session, changed };
}
