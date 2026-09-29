"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Check, Clock3, Compass, Radio, RotateCcw, X } from "lucide-react";
import { CoinIcon } from "./coin-icon";
import { getInterfaceLocale, getSupportLocale, localizeAttribute, t } from "@/lib/interface-language";
import { useScrollLock } from "@/lib/use-scroll-lock";
import type { ExpeditionFamily, ExpeditionOffer, LocalizedText } from "@/lib/expeditions-catalog";
import type { Level } from "@/lib/curriculum";

type Progress = {
  episodeId: string;
  family: ExpeditionFamily;
  title?: LocalizedText | null;
  descriptor?: LocalizedText | null;
  completedAt?: string;
  reviewDueAt?: string;
  reviewConfirmedAt?: string;
  competence?: "practicing" | "demonstrated" | "confirmed";
};
type DueReview = { episodeId: string; family: ExpeditionFamily; title: LocalizedText };
type Snapshot = {
  enabled: boolean;
  storage: "browser" | "account";
  coins: number;
  goalId: string | null;
  owned: string[];
  offers: ExpeditionOffer[];
  progress: Progress[];
  dueReviews: DueReview[];
};
type PublicChoice = { id: string; text: string };
type PublicQuestion = {
  id: string;
  kind: "choice" | "order";
  prompt: LocalizedText;
  context: LocalizedText;
  options?: PublicChoice[];
  tokens?: PublicChoice[];
};
type PublicEpisode = {
  id: string;
  offerId: string;
  family: ExpeditionFamily;
  position: number;
  title: LocalizedText;
  problem: LocalizedText;
  attempt: LocalizedText;
  newLearning: { kind: string; label: string; explanation: LocalizedText; example: string };
  decision: { id: string; prompt: LocalizedText; options: { id: string; text: LocalizedText }[] };
  application: PublicQuestion;
  transfer: PublicQuestion;
  canDo: { descriptor: LocalizedText; modality: string };
};
type EpisodeSession = {
  sessionId: string;
  episode: PublicEpisode;
  decisionConsequence?: LocalizedText | null;
  progress?: { applicationCorrect?: boolean; transferCorrect?: boolean; decisionId?: string | null; completedAt?: string | null; satisfaction?: "yes" | "no" | null; competence?: Progress["competence"] };
};
type ReviewSession = { sessionId?: string; question: PublicQuestion; episodeId: string; family: ExpeditionFamily };
type DialogState =
  | { kind: "preview"; offer: ExpeditionOffer }
  | { kind: "purchase"; offer: ExpeditionOffer }
  | { kind: "episode"; offer: ExpeditionOffer; session: EpisodeSession }
  | { kind: "review"; review: ReviewSession }
  | null;
type Phase = "problem" | "learning" | "application" | "transfer" | "reveal";

function localized(value?: LocalizedText, support = false) {
  if (!value) return "";
  return (support ? getSupportLocale() : getInterfaceLocale()) === "en" ? value.en : value.pt;
}
function familyForLevel(level: Level): ExpeditionFamily {
  return level === "A1" || level === "A2" ? "A1-A2" : level === "B1" || level === "B2" ? "B1-B2" : "C1-C2";
}
async function request(action: Record<string, unknown>) {
  const response = await fetch("/api/expeditions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(action),
    cache: "no-store",
  });
  const data: Record<string, unknown> = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "unavailable");
  return data;
}
function errorLabel(error: unknown) {
  const code = error instanceof Error ? error.message : "unavailable";
  if (code === "insufficient-coins") return "Ainda faltam moedas para esta descoberta.";
  if (code === "progress-conflict") return "Seu saldo mudou em outro dispositivo. Atualize e tente novamente.";
  if (code === "episode-not-owned") return "Abra esta descoberta na loja primeiro.";
  if (code === "review-not-due") return "Esta retomada ainda não está disponível.";
  return "Não foi possível carregar agora. Verifique a conexão e tente novamente.";
}

export function ExpeditionShop({ level, hasNewLessons, onBalanceChange }: { level: Level; hasNewLessons: boolean; onBalanceChange?: (coins: number) => void }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [previewChoice, setPreviewChoice] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("problem");
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [decisionConsequence, setDecisionConsequence] = useState<LocalizedText | null>(null);
  const [outcome, setOutcome] = useState<{ reveal: LocalizedText; consequence: LocalizedText; routePayoff: LocalizedText | null; competence: Progress["competence"] } | null>(null);
  const [satisfaction, setSatisfaction] = useState<"yes" | "no" | null>(null);
  const [finished, setFinished] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogBodyRef = useRef<HTMLDivElement>(null);
  const dialogOpen = Boolean(dialog);

  async function refresh() {
    const response = await fetch("/api/expeditions", { cache: "no-store" });
    if (response.status === 404) { setSnapshot(null); setLoading(false); return; }
    if (!response.ok) throw new Error("unavailable");
    const data = await response.json() as Snapshot;
    setSnapshot(data);
    onBalanceChange?.(data.coins);
    setLoading(false);
  }
  useEffect(() => {
    let active = true;
    void fetch("/api/expeditions", { cache: "no-store" }).then(async response => {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("unavailable");
      return response.json() as Promise<Snapshot>;
    }).then(data => { if (active) { setSnapshot(data); setLoading(false); } })
      .catch(() => { if (active) { setError("Não foi possível carregar as expedições."); setLoading(false); } });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!dialogOpen) return;
    const node = dialogRef.current;
    if (node && !node.open) node.showModal();
    return () => { if (node?.open) node.close(); };
  }, [dialogOpen]);
  useEffect(() => {
    if (!dialog) return;
    const heading = dialogBodyRef.current?.querySelector("h3");
    if (heading instanceof HTMLElement) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }, [dialog, phase]);
  useScrollLock(dialogOpen);

  function openPreview(offer: ExpeditionOffer) {
    setError(""); setPreviewChoice(null); setDialog({ kind: "preview", offer });
    void request({ action: "preview", itemId: offer.id }).catch(() => undefined);
  }
  function closeDialog() {
    if (busy) return;
    setDialog(null); setFeedback(null); setChoiceId(null); setOrderedIds([]); setFinished(false);
  }
  async function mutate(action: Record<string, unknown>) {
    setBusy(true); setError("");
    try { return await request(action); }
    catch (cause) { setError(errorLabel(cause)); return null; }
    finally { setBusy(false); }
  }
  async function chooseGoal(itemId: string | null) {
    const result = await mutate({ action: "goal", itemId });
    if (result) await refresh().catch(() => setError("Não foi possível atualizar o objetivo."));
  }
  async function buy(offer: ExpeditionOffer) {
    const result = await mutate({ action: "buy", itemId: offer.id, offerVersion: offer.offerVersion });
    if (!result) return;
    await refresh().catch(() => undefined);
    setDialog(null);
    await begin(offer, offer.episodeIds[0]);
  }
  async function begin(offer: ExpeditionOffer, episodeId: string) {
    const result = await mutate({ action: "start", episodeId, family: familyForLevel(level) });
    if (!result || typeof result.sessionId !== "string" || !result.episode) return;
    const session = result as unknown as EpisodeSession;
    setDialog({ kind: "episode", offer, session });
    setDecisionId(session.progress?.decisionId ?? null);
    setDecisionConsequence(session.decisionConsequence ?? null);
    setOutcome(null);
    setSatisfaction(session.progress?.satisfaction ?? null);
    setPhase(session.progress?.completedAt ? "problem" : session.progress?.applicationCorrect ? "transfer" : "problem");
    setChoiceId(null); setOrderedIds([]);
    setFeedback(session.progress?.transferCorrect && !session.progress?.completedAt ? { correct: true, text: t("Resposta salva. Continue para ver a descoberta.") } : null);
    setFinished(false);
  }
  async function recordDecision(sessionId: string, optionId: string) {
    const result = await mutate({ action: "decision", sessionId, optionId });
    if (!result) return;
    setDecisionId(optionId);
    setDecisionConsequence(result.consequence as LocalizedText);
    setFeedback(null);
  }
  async function checkAnswer(session: EpisodeSession, question: PublicQuestion, answer: string | string[]) {
    const result = await mutate({ action: "answer", sessionId: session.sessionId, questionId: question.id, answer });
    if (!result) return;
    const correct = result.correct === true;
    const expected = result.expected;
    const expectedText = typeof expected === "string" ? question.options?.find(option => option.id === expected)?.text
      : Array.isArray(expected) ? expected.map(id => question.tokens?.find(token => token.id === id)?.text).filter(Boolean).join(" ") : "";
    const explanation = localized(result.feedback as LocalizedText | undefined, true) || (correct ? "Certo!" : "Veja a dica e tente de novo.");
    setFeedback({ correct, text: correct || !expectedText ? explanation : `${explanation} ${t("Resposta:")} ${expectedText}` });
  }
  async function finish(session: EpisodeSession) {
    const result = await mutate({ action: "finish", sessionId: session.sessionId });
    if (!result) return;
    setOutcome({ reveal: result.reveal as LocalizedText, consequence: result.consequence as LocalizedText,
      routePayoff: result.routePayoff as LocalizedText | null,
      competence: (result.progress as Progress | undefined)?.competence ?? "practicing" });
    setFinished(true); setPhase("reveal"); setFeedback(null);
    await refresh().catch(() => undefined);
  }
  async function rate(session: EpisodeSession, value: "yes" | "no") {
    const result = await mutate({ action: "rate", sessionId: session.sessionId, value });
    if (result) setSatisfaction(value);
  }
  async function beginReview(item: DueReview) {
    const result = await mutate({ action: "review-start", episodeId: item.episodeId, family: item.family });
    if (!result?.question) return;
    setDialog({ kind: "review", review: { episodeId: item.episodeId, family: item.family, sessionId: typeof result.sessionId === "string" ? result.sessionId : undefined, question: result.question as PublicQuestion } });
    setChoiceId(null); setFeedback(null); setFinished(false);
  }
  async function checkReview(review: ReviewSession) {
    if (!choiceId) return;
    const result = await mutate({ action: "review", episodeId: review.episodeId, family: review.family, sessionId: review.sessionId, answer: choiceId });
    if (!result) return;
    const correct = result.correct === true;
    const answer = review.question.options?.find(option => option.id === result.expected)?.text;
    const explanation = localized(result.feedback as LocalizedText | undefined, true) || (correct ? "Você lembrou em outro contexto." : "Agora você já sabe o que revisar.");
    setFeedback({ correct, text: correct || !answer ? explanation : `${explanation} ${t("Resposta:")} ${answer}` });
    setFinished(true);
    await refresh().catch(() => undefined);
  }

  if (loading) return <section className="economy-shelf" aria-label={localizeAttribute("Expedições Sparky")}><p className="economy-status" role="status">{t("Preparando descobertas…")}</p></section>;
  if (!snapshot?.enabled) return null;
  const goal = snapshot.offers.find(item => item.id === snapshot.goalId);
  const currency = (amount: number) => new Intl.NumberFormat(getInterfaceLocale()).format(amount);
  const estimate = (price: number) => {
    const remaining = Math.max(0, price - snapshot.coins);
    if (!remaining) return "";
    const daily = hasNewLessons ? 14 : 6;
    return `${t("Cenário de estudo:")} ${Math.ceil(remaining / daily)} ${t("dias ou mais")} · ${t(hasNewLessons ? "se houver 1 lição nova e 2 revisões elegíveis por dia" : "se houver 3 revisões elegíveis por dia")}`;
  };

  return <section className="economy-shelf" aria-labelledby="economy-title">
    <div className="economy-heading">
      <div><p className="eyebrow">{t("EXPEDIÇÕES SPARKY")}</p><h2 id="economy-title">{t("Moedas abrem descobertas")}</h2><p>{t("Experimente uma pista, escolha um objetivo e use inglês para mudar a história.")}</p></div>
      <span className="economy-balance" aria-label={`${localizeAttribute("Saldo de moedas")}: ${currency(snapshot.coins)}`}><CoinIcon size={22}/>{currency(snapshot.coins)}</span>
    </div>
    {error && <p className="economy-status" role="alert">{t(error)}</p>}
    {goal && <div className="economy-goal"><div className="economy-goal-top"><strong>{t("Seu objetivo")}: {localized(goal.title)}</strong><button className="text-button" disabled={busy} onClick={() => void chooseGoal(null)}>{t("Trocar")}</button></div><progress value={Math.min(snapshot.coins,goal.price)} max={goal.price} aria-label={localizeAttribute("Progresso até a descoberta")}/><small>{currency(Math.min(snapshot.coins,goal.price))} / {currency(goal.price)} · {snapshot.coins >= goal.price ? t("Você já pode abrir.") : `${currency(goal.price - snapshot.coins)} ${t("moedas para abrir")}`}</small>{snapshot.coins < goal.price && <small>{estimate(goal.price)}</small>}</div>}
    {snapshot.dueReviews.length > 0 && <div className="economy-review-list"><h3>{t("Lembrar o que descobri")}</h3>{snapshot.dueReviews.map(item => <button key={`${item.episodeId}:${item.family}`} className="secondary-button" disabled={busy} onClick={() => void beginReview(item)}><RotateCcw size={17}/>{localized(item.title)}<ArrowRight size={16}/></button>)}</div>}
    <div className="economy-grid">{snapshot.offers.map(offer => {
      const owned = snapshot.owned.includes(offer.id);
      const completed = offer.episodeIds.filter(id => snapshot.progress.some(p => p.episodeId === id && p.family === familyForLevel(level) && p.completedAt)).length;
      const Icon = offer.id === "expedition-suitcase" ? BriefcaseBusiness : offer.id === "expedition-london" ? Compass : Radio;
      return <article className="economy-offer" data-world={offer.id} key={offer.id}>
        <div className="economy-offer-art"><Icon size={58} strokeWidth={1.5} aria-hidden="true"/><span>{t(offer.kind === "case" ? "CASO CURTO" : "MUNDO")}</span></div>
        <div className="economy-offer-body"><h3>{localized(offer.title)}</h3><p>{localized(offer.description)}</p><div className="economy-offer-facts"><span><Clock3 size={12}/> {offer.durationMinutes} {t("min")}</span><span>{offer.episodeIds.length} {t(offer.episodeIds.length === 1 ? "episódio" : "episódios")}</span>{owned && <span><Check size={12}/> {t("Na biblioteca")} {completed}/{offer.episodeIds.length}</span>}</div></div>
        <div className="economy-offer-actions">
          <button className="secondary-button" onClick={() => openPreview(offer)}>{t("Prévia grátis")}</button>
          {owned ? <button className="primary-button" disabled={busy} onClick={() => void begin(offer, offer.episodeIds.find(id => !snapshot.progress.some(p => p.episodeId === id && p.family === familyForLevel(level) && p.completedAt)) ?? offer.episodeIds[0])}>{t("Entrar")}<ArrowRight size={16}/></button>
            : <button className="primary-button" disabled={busy || snapshot.storage !== "account" || snapshot.coins < offer.price} onClick={() => setDialog({ kind: "purchase", offer })}><CoinIcon size={17}/>{currency(offer.price)}</button>}
          {!owned && <button className="text-button economy-wide" disabled={busy || snapshot.storage !== "account"} onClick={() => void chooseGoal(offer.id)}>{snapshot.goalId === offer.id ? t("Objetivo escolhido") : t("Escolher como objetivo")}</button>}
        </div>
        {!owned && snapshot.coins < offer.price && <p className="economy-shortfall">{currency(offer.price - snapshot.coins)} {t("moedas para abrir")} · {estimate(offer.price)}</p>}
        {owned && <details className="economy-library"><summary>{t("Passaporte e episódios")}</summary>
          {completed === offer.episodeIds.length && <p className="economy-souvenir"><Check size={16}/>{localized(offer.souvenir)}</p>}
          <div className="economy-episode-list">{offer.episodeIds.map((id,index) => {
            const entry = snapshot.progress.find(p => p.episodeId === id && p.family === familyForLevel(level));
            const previousDone = index === 0 || snapshot.progress.some(p => p.episodeId === offer.episodeIds[index - 1] && p.family === familyForLevel(level) && p.completedAt);
            return <div key={id} className="economy-episode-entry"><div><strong>{entry?.title ? localized(entry.title) : `${t("Episódio")} ${index+1}`}</strong>{entry?.completedAt && <small>{t(entry.competence === "confirmed" ? "Habilidade confirmada" : entry.competence === "demonstrated" ? "Habilidade demonstrada" : "Em prática")} · {t("compreensão e estrutura")}</small>}{entry?.descriptor && <small>{localized(entry.descriptor)}</small>}</div><button className="secondary-button" disabled={busy || !previousDone} onClick={() => void begin(offer,id)}>{t(entry?.completedAt ? "Rever" : "Começar")}</button></div>;
          })}</div>
        </details>}
      </article>;
    })}</div>
    {snapshot.storage !== "account" && <p className="economy-status">{t("As prévias estão disponíveis. Para comprar, conecte o progresso à conta.")}</p>}
    {dialog && <dialog ref={dialogRef} className="economy-dialog" onCancel={event => { event.preventDefault(); closeDialog(); }} aria-labelledby="economy-dialog-title"><div className="economy-dialog-shell">
      <header className="economy-dialog-header"><div><small>{dialog.kind === "episode" ? `${t("EPISÓDIO")} ${dialog.session.episode.position}` : t(dialog.kind === "preview" ? "PRÉVIA GRÁTIS" : dialog.kind === "purchase" ? "CONFIRMAR COMPRA" : "RETOMADA GRATUITA")}</small><h2 id="economy-dialog-title">{dialog.kind === "review" ? t("Lembrar em outro contexto") : localized(dialog.offer.title)}</h2></div><button type="button" onClick={closeDialog} aria-label={localizeAttribute("Fechar expedição")}><X size={19}/></button></header>
      <div className="economy-dialog-body" ref={dialogBodyRef}>
        {dialog.kind === "preview" && <><h3>{localized(dialog.offer.title)}</h3><div className="economy-scene"><p>{localized(dialog.offer.preview.scene)}</p></div><p className="economy-question">{localized(dialog.offer.preview.prompt)}</p><div className="economy-options">{dialog.offer.preview.options.map((option,index) => <button type="button" key={option.id} aria-pressed={previewChoice === index} onClick={() => setPreviewChoice(index)}>{localized(option.text)}</button>)}</div>{previewChoice !== null && <div className="economy-feedback" data-correct="true" role="status"><strong>{localized(dialog.offer.preview.options[previewChoice].consequence)}</strong><p>{localized(dialog.offer.learning)}</p></div>}<p>{t("Com acesso permanente:")} {dialog.offer.episodeIds.length} {t(dialog.offer.episodeIds.length === 1 ? "episódio" : "episódios")} · {dialog.offer.durationMinutes} {t("min")} · {localized(dialog.offer.characters[0])} {t("e outros personagens")}</p></>}
        {dialog.kind === "purchase" && <><h3>{t("Abrir esta descoberta?")}</h3><p>{localized(dialog.offer.description)}</p><div className="economy-passport"><strong>{localized(dialog.offer.title)}</strong><span>{dialog.offer.episodeIds.length} {t(dialog.offer.episodeIds.length === 1 ? "episódio" : "episódios")} · {t("acesso permanente")}</span><p>{t("Preço confirmado:")} <CoinIcon size={17}/> {currency(dialog.offer.price)}</p></div><p>{t("Você poderá repetir e revisar sem pagar novamente.")}</p></>}
        {dialog.kind === "episode" && <EpisodeBody key={dialog.session.sessionId} session={dialog.session} phase={phase} decisionId={decisionId} decisionConsequence={decisionConsequence} outcome={outcome} satisfaction={satisfaction} onRate={value => void rate(dialog.session,value)} onDecision={optionId => void recordDecision(dialog.session.sessionId, optionId)} choiceId={choiceId} setChoiceId={setChoiceId} orderedIds={orderedIds} setOrderedIds={setOrderedIds} feedback={feedback} setFeedback={setFeedback} finished={finished}/>}
        {dialog.kind === "review" && <><h3>{t("Você lembra como agir?")}</h3><div className="economy-scene" lang={getSupportLocale()}><p>{localized(dialog.review.question.context,true)}</p></div><p className="economy-question" lang={getSupportLocale()}>{localized(dialog.review.question.prompt,true)}</p><div className="economy-options">{dialog.review.question.options?.map(option => <button type="button" key={option.id} aria-pressed={choiceId === option.id} disabled={finished} onClick={() => setChoiceId(option.id)} lang="en">{option.text}</button>)}</div>{feedback && <div className="economy-feedback" data-correct={feedback.correct} role="status" lang={getSupportLocale()}>{feedback.text}</div>}</>}
      </div>
      <footer className="economy-dialog-footer">
        {dialog.kind === "preview" && <><button className="secondary-button" onClick={closeDialog}>{t("Voltar")}</button>{snapshot.owned.includes(dialog.offer.id) ? <button className="primary-button" disabled={busy} onClick={() => void begin(dialog.offer,dialog.offer.episodeIds[0])}>{t("Entrar")}<ArrowRight size={16}/></button> : <button className="primary-button" disabled={busy || snapshot.storage !== "account"} onClick={() => { setDialog(null); void chooseGoal(dialog.offer.id); }}>{t("Escolher objetivo")}</button>}</>}
        {dialog.kind === "purchase" && <><button className="secondary-button" onClick={closeDialog}>{t("Voltar")}</button><button className="primary-button" disabled={busy} onClick={() => void buy(dialog.offer)}>{t("Abrir por")} {currency(dialog.offer.price)} <CoinIcon size={18}/></button></>}
        {dialog.kind === "episode" && <EpisodeFooter session={dialog.session} phase={phase} setPhase={setPhase} decisionId={decisionId} choiceId={choiceId} orderedIds={orderedIds} feedback={feedback} setFeedback={setFeedback} finished={finished} busy={busy} onCheck={checkAnswer} onFinish={finish} onNext={() => { const next = dialog.offer.episodeIds[dialog.offer.episodeIds.indexOf(dialog.session.episode.id)+1]; if (next) void begin(dialog.offer,next); else closeDialog(); }} />}
        {dialog.kind === "review" && <button className="primary-button" disabled={busy || (!choiceId && !finished)} onClick={() => finished ? closeDialog() : void checkReview(dialog.review)}>{t(finished ? "Concluir" : "Conferir")}</button>}
      </footer>
    </div></dialog>}
  </section>;
}

function EpisodeBody({ session, phase, decisionId, decisionConsequence, outcome, satisfaction, onRate, onDecision, choiceId, setChoiceId, orderedIds, setOrderedIds, feedback, setFeedback, finished }: {
  session: EpisodeSession; phase: Phase; decisionId: string | null; decisionConsequence: LocalizedText | null;
  outcome: { reveal: LocalizedText; consequence: LocalizedText; routePayoff: LocalizedText | null; competence: Progress["competence"] } | null; satisfaction: "yes" | "no" | null;
  onRate: (value: "yes" | "no") => void; onDecision: (id: string) => void;
  choiceId: string | null; setChoiceId: (id: string | null) => void; orderedIds: string[]; setOrderedIds: (ids: string[]) => void;
  feedback: { correct: boolean; text: string } | null; setFeedback: (value: { correct: boolean; text: string } | null) => void; finished: boolean;
}) {
  const episode = session.episode;
  const current = ["problem","learning","application","transfer","reveal"].indexOf(phase);
  const [showTranslation, setShowTranslation] = useState(false);
  const otherLang = getSupportLocale() === "en" ? "pt-BR" : "en";
  const translated = (value: LocalizedText) => otherLang === "en" ? value.en : value.pt;
  const translation = phase === "problem" ? episode.problem : phase === "learning" ? episode.newLearning.explanation
    : phase === "application" ? episode.application.context : phase === "transfer" ? episode.transfer.context : outcome?.reveal;
  return <><div className="economy-step-progress" role="group" aria-label={`${localizeAttribute("Etapa")} ${current+1} ${localizeAttribute("de")} 5`}>{[0,1,2,3,4].map(index => <span key={index} aria-hidden="true" data-complete={index<=current}/>)}</div>
    {phase === "problem" && <><h3>{localized(episode.title)}</h3><div className="economy-scene" lang={getSupportLocale()}><p>{localized(episode.problem,true)}</p></div><p lang={getSupportLocale()}>{localized(episode.attempt,true)}</p><p className="economy-question" lang={getSupportLocale()}>{localized(episode.decision.prompt,true)}</p><div className="economy-options" lang={getSupportLocale()}>{episode.decision.options.map(option => <button key={option.id} type="button" aria-pressed={decisionId === option.id} disabled={Boolean(decisionId && decisionId !== option.id && !session.progress?.completedAt)} onClick={() => onDecision(option.id)}>{localized(option.text,true)}</button>)}</div>{decisionConsequence && <div className="economy-feedback" data-correct="true" role="status" lang={getSupportLocale()}>{localized(decisionConsequence,true)}</div>}</>}
    {phase === "learning" && <><h3>{t("Uma ideia para avançar")}</h3><div className="economy-learning"><span>{t(episode.newLearning.kind === "expression" ? "EXPRESSÃO" : "ESTRATÉGIA")}</span><strong lang="en">{episode.newLearning.label}</strong><p lang="en">{episode.newLearning.example}</p><p lang={getSupportLocale()}>{localized(episode.newLearning.explanation,true)}</p></div></>}
    {phase === "application" && <><h3>{t("Use a ideia")}</h3><div className="economy-scene" lang={getSupportLocale()}><p>{localized(episode.application.context,true)}</p></div><p className="economy-question" lang={getSupportLocale()}>{localized(episode.application.prompt,true)}</p><div className="economy-options">{episode.application.options?.map(option => <button type="button" key={option.id} aria-pressed={choiceId === option.id} onClick={() => { setChoiceId(option.id); setFeedback(null); }} lang="en">{option.text}</button>)}</div>{feedback && <div className="economy-feedback" data-correct={feedback.correct} role="status" lang={getSupportLocale()}>{feedback.text}</div>}</>}
    {phase === "transfer" && <><h3>{t("Agora em outra situação")}</h3><div className="economy-scene" lang={getSupportLocale()}><p>{localized(episode.transfer.context,true)}</p></div><p className="economy-question" lang={getSupportLocale()}>{localized(episode.transfer.prompt,true)}</p><div className="economy-order-selected" role="group" aria-label={localizeAttribute("Sua frase")}>{orderedIds.map((id,index) => <button type="button" key={id} onClick={() => { setOrderedIds(orderedIds.filter((_,i) => i !== index)); setFeedback(null); }} lang="en">{episode.transfer.tokens?.find(token => token.id === id)?.text}</button>)}</div><div className="economy-order-pool" role="group" aria-label={localizeAttribute("Palavras disponíveis")}>{episode.transfer.tokens?.filter(token => !orderedIds.includes(token.id)).map(token => <button type="button" key={token.id} onClick={() => { setOrderedIds([...orderedIds, token.id]); setFeedback(null); }} lang="en">{token.text}</button>)}</div><button type="button" className="text-button" disabled={!orderedIds.length} onClick={() => { setOrderedIds([]); setFeedback(null); }}>{t("Limpar")}</button>{feedback && <div className="economy-feedback" data-correct={feedback.correct} role="status">{feedback.text}</div>}</>}
    {phase === "reveal" && outcome && <><h3>{t("Descoberta feita!")}</h3><div className="economy-passport" lang={getSupportLocale()}>{outcome.routePayoff && <p><strong>{t("Sua pista:")}</strong> {localized(outcome.routePayoff,true)}</p>}<strong>{localized(outcome.reveal,true)}</strong><p>{localized(outcome.consequence,true)}</p></div><p><strong>{t(outcome.competence === "confirmed" ? "Habilidade confirmada" : outcome.competence === "demonstrated" ? "Habilidade demonstrada" : "Em prática")}</strong> · {t("compreensão e estrutura")}</p><p lang={getSupportLocale()}>{localized(episode.canDo.descriptor,true)}</p><p>{finished ? t("Esta descoberta está no seu passaporte. Uma retomada gratuita aparecerá depois.") : t("Conclua para guardar esta descoberta no seu passaporte.")}</p>{finished && <div className="economy-satisfaction"><strong>{t("A descoberta valeu suas moedas?")}</strong>{satisfaction ? <p role="status">{t("Obrigado por contar. Sua resposta ajuda a melhorar as próximas histórias.")}</p> : <div><button type="button" className="secondary-button" onClick={() => onRate("yes")}>{t("Sim")}</button><button type="button" className="secondary-button" onClick={() => onRate("no")}>{t("Ainda não")}</button></div>}</div>}</>}
    {translation && <div className="economy-translation"><button type="button" className="text-button" aria-pressed={showTranslation} onClick={() => setShowTranslation(value => !value)}>{t(showTranslation ? "Ocultar tradução" : "Ver tradução")}</button>{showTranslation && <p lang={otherLang}>{translated(translation)}</p>}</div>}
  </>;
}

function EpisodeFooter({ session, phase, setPhase, decisionId, choiceId, orderedIds, feedback, setFeedback, finished, busy, onCheck, onFinish, onNext }: {
  session: EpisodeSession; phase: Phase; setPhase: (phase: Phase) => void; decisionId: string | null; choiceId: string | null; orderedIds: string[];
  feedback: { correct: boolean; text: string } | null; setFeedback: (value: { correct: boolean; text: string } | null) => void;
  finished: boolean; busy: boolean;
  onCheck: (session: EpisodeSession, question: PublicQuestion, answer: string | string[]) => Promise<void>;
  onFinish: (session: EpisodeSession) => Promise<void>; onNext: () => void;
}) {
  if (phase === "problem") return <button className="primary-button" disabled={busy || !decisionId} onClick={() => setPhase("learning")}>{t("Descobrir como agir")}<ArrowRight size={17}/></button>;
  if (phase === "learning") return <button className="primary-button" onClick={() => setPhase("application")}>{t("Usar em inglês")}<ArrowRight size={17}/></button>;
  if (phase === "application") return <button className="primary-button" disabled={busy || (!choiceId && !feedback)} onClick={() => { if (feedback?.correct) { setFeedback(null); setPhase("transfer"); } else if (choiceId) void onCheck(session,session.episode.application,choiceId); }}>{t(feedback?.correct ? "Continuar" : "Conferir")}</button>;
  if (phase === "transfer") return <button className="primary-button" disabled={busy || (!orderedIds.length && !feedback)} onClick={() => { if (feedback?.correct) { setFeedback(null); void onFinish(session); } else void onCheck(session,session.episode.transfer,orderedIds); }}>{t(feedback?.correct ? "Ver descoberta" : "Conferir")}</button>;
  return <button className="primary-button" disabled={busy} onClick={() => { if (!finished) void onFinish(session); else onNext(); }}>{t(finished ? "Próximo episódio ou sair" : "Guardar descoberta")}</button>;
}
