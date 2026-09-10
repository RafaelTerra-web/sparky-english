"use client";
import { lessonMetadata, pathsForLesson } from "@/lib/course-guide";
import { t, localizeAttribute } from "@/lib/interface-language";
import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { lessonIllustrationId } from "@/lib/lesson-illustrations";
import { ArrowLeft, ArrowRight, Check, Languages, X } from "lucide-react";
import type { Lesson } from "@/lib/curriculum";
import type { PublicRewardState } from "@/lib/rewards-shared";
import { contentVersion } from "@/lib/content/build";
import { isExercise, exerciseId } from "@/lib/study";
import { readWorkspace, updateWorkspace, saveCheckpoint, checkpointKey } from "@/lib/learning-local";
import type { CheckpointStepState } from "@/lib/learning-local";
import { SpeechPractice } from "./speech-practice";
import { MascotFigure } from "./mascot-studio";
import { ConversationListening } from "./conversation-listening";
import { ConversationTipCard } from "./conversation-tip";
import { tipForLesson } from "@/lib/conversation-tips";
import { lessonSteps, migrateLessonCheckpoint, lessonFlowVersion } from "@/lib/lesson-flow";
import type { LearnerProfile } from "@/lib/onboarding-shared";
const voiceEnabled = process.env.NEXT_PUBLIC_VOICE_ENABLED !== "false";

export default function LessonPlayer({
  userId,
  lesson,
  review,
  mascot,
  equipped,
  saving,
  openerRef,
  learnerProfile,
  onClose,
  onFinish,
  studyMode = "guided",
  nextLesson,
}: {
  studyMode?: "guided"|"practice";
  nextLesson?: Lesson;
  userId: string;
  lesson: Lesson;
  review: boolean;
  mascot: PublicRewardState["mascot"];
  equipped: PublicRewardState["equipped"];
  saving: boolean;
  openerRef?: RefObject<HTMLElement | null>;
  learnerProfile?: LearnerProfile | null;
  onClose: () => void;
  onFinish: (receipt: string) => Promise<boolean>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const [recovered] = useState(() => migrateLessonCheckpoint(readWorkspace(userId).checkpoints[checkpointKey(lesson.id, review)], lesson));
  const [initial] = useState(() => recovered && (!review || recovered.reviewFormat === 2) && Date.now() - Date.parse(recovered.updatedAt) < 7 * 3600000 ? recovered : null);
  const steps = lessonSteps(lesson, review);
  const [index, setIndex] = useState(initial && initial.index < steps.length ? initial.index : 0);
  const [answer, setAnswer] = useState(initial?.answer || "");
  const [tokens, setTokens] = useState<number[]>(initial?.tokens || []);
  const [checked, setChecked] = useState(Boolean(initial?.checked));
  const [correct, setCorrect] = useState(Boolean(initial?.correct));
  const [translation, setTranslation] = useState(Boolean(initial?.translation));
  const [assisted, setAssisted] = useState(Boolean(initial?.assisted));
  const [contextVisible, setContextVisible] = useState(Boolean(initial?.contextVisible));
  const [revealed, setRevealed] = useState(Boolean(initial?.revealed));
  const [listened, setListened] = useState(Boolean(initial?.listened));
  const [draft] = useState(recovered?.draft || "");
  const [receipt, setReceipt] = useState(initial?.receipt || "");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [savedPhrase, setSavedPhrase] = useState(false);
  const history = useRef<Record<string, CheckpointStepState>>(initial?.history ?? {});
  const furthestIndex = useRef(initial?.furthestIndex ?? initial?.index ?? 0);
  const step = steps[index];
  const illustrationId = lessonIllustrationId(lesson);
  const showIllustration = Boolean(illustrationId) && ["hook", "choice", "listening_detail", "listening_inference"].includes(step.kind);
  const retrievalExercise = review && isExercise(step);
  const selected = step.kind === "order_words" ? tokens.map(token => step.options?.[token] || "").join(" ") : answer;
  useEffect(() => {
    // Safari does not focus buttons on touch; keep the explicit invoking control.
    const opener = openerRef?.current ?? document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const current = dialog.current;
    current?.showModal();
    return () => { current?.close(); document.body.style.overflow = previousOverflow; if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, [openerRef]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    body.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [index]);
  useEffect(() => {
    if (checked) feedback.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
    if (error) body.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [checked, error]);
  useEffect(() => {
    history.current[index] = { answer, tokens, checked, correct, translation, assisted, contextVisible, revealed, listened };
    const saved = saveCheckpoint(userId, { reviewFormat: 2, lessonId: lesson.id, review, index, answer, tokens, checked, correct,
      translation, assisted, contextVisible, revealed, listened, receipt, draft, furthestIndex: furthestIndex.current,
      history: history.current, updatedAt: new Date().toISOString(), contentVersion, flowVersion: lessonFlowVersion });
    if (!saved) queueMicrotask(() => setStorageError(true));
  }, [userId, lesson.id, review, index, answer, tokens, checked, correct, translation, assisted, contextVisible, revealed, listened, receipt, draft]);
  function tokensForAnswer(target: number) {
    const targetStep = steps[target];
    if (targetStep.kind !== "order_words") return [];
    const unused = targetStep.options!.map((word, token) => ({ word, token }));
    return targetStep.answer!.split(" ").map(word => {
      const found = unused.findIndex(item => item.word === word);
      return unused.splice(found, 1)[0].token;
    });
  }
  function moveTo(target: number) {
    history.current[index] = { answer, tokens, checked, correct, translation, assisted, contextVisible, revealed, listened };
    const previous = history.current[target];
    const alreadyPassed = target < furthestIndex.current && isExercise(steps[target]);
    setIndex(target);
    setAnswer(previous?.answer ?? (alreadyPassed && steps[target].kind !== "order_words" ? steps[target].answer! : ""));
    setTokens(previous?.tokens ?? (alreadyPassed ? tokensForAnswer(target) : []));
    setChecked(previous?.checked ?? alreadyPassed);
    setCorrect(previous?.correct ?? alreadyPassed);
    setTranslation(previous?.translation ?? false);
    setAssisted(previous?.assisted ?? false);
    setContextVisible(previous?.contextVisible ?? false);
    setRevealed(previous?.revealed ?? false);
    setListened(previous?.listened ?? false);
    setSavedPhrase(false);
  }
  function previous() {
    if (index === 0 || verifying || saving) return;
    setError("");
    if (step.kind === "production") saveWriting();
    moveTo(index - 1);
  }
  function saveWriting() {
    if (!draft.trim()) return;
    const ok = updateWorkspace(userId, current => current.writings.some(w => w.lessonId === lesson.id && w.text === draft) ? current : ({ ...current,
      writings: [...current.writings, { id: crypto.randomUUID(), lessonId: lesson.id, text: draft, createdAt: new Date().toISOString(), contentVersion }].slice(-100),
    }));
    if (!ok) setStorageError(true);
  }
  function savePhrase() {
    if (!step.english) return;
    const id = lesson.id + ":" + step.kind;
    const ok = updateWorkspace(userId, current => ({ ...current, vocabulary: [
      ...current.vocabulary.filter(item => item.id !== id),
      { id, lessonId: lesson.id, english: step.english!, translation: step.translation || "" },
    ].slice(-200) }));
    setSavedPhrase(ok);
    if (!ok) setStorageError(true);
  }
  async function next() {
    if (verifying || saving) return;
    setError("");
    if (isExercise(step) && !checked) {
      setVerifying(true);
      try {
        const response = await fetch("/api/study", { method: "POST", signal: AbortSignal.timeout(15000), headers: { "content-type": "application/json" },
          body: JSON.stringify({ lessonId: lesson.id, review, stepId: exerciseId(lesson, step), answer: selected, assisted, receipt }) });
        const result = await response.json();
        if (!response.ok) {
          if (["study-expired", "study-out-of-order"].includes(result.error)) {
            history.current = {}; furthestIndex.current = 0;
            setReceipt(""); setIndex(0); setChecked(false); setAnswer(""); setTokens([]); setContextVisible(false); setAssisted(false); setTranslation(false); setRevealed(false); setListened(false);
            throw new Error("A validação desta prática expirou. Retome os exercícios desde o início; seu rascunho foi preservado.");
          }
          throw new Error(response.status === 401 ? "Sua sessão expirou. Entre novamente para continuar." : "Não foi possível verificar. Tente novamente; sua resposta continua aqui.");
        }
        setCorrect(result.correct); setReceipt(result.receipt); setChecked(true);
        const ok = updateWorkspace(userId, current => ({ ...current, attempts: [...current.attempts, {
          id: crypto.randomUUID(), lessonId: lesson.id, stepId: exerciseId(lesson, step), answer: selected,
          correct: result.correct, assisted, review, createdAt: new Date().toISOString(), contentVersion, evaluationVersion: result.evaluationVersion,
        }].slice(-600) }));
        if (!ok) setStorageError(true);
      } catch (cause) { setError(cause instanceof TypeError || cause instanceof DOMException ? "A conexão falhou ou demorou demais. Tente novamente; sua resposta foi preservada." : cause instanceof Error ? cause.message : "Sem conexão. Tente novamente."); }
      finally { setVerifying(false); }
      return;
    }
    if (isExercise(step) && !correct) {
      setChecked(false); setAnswer(""); setTokens([]); setAssisted(true); return;
    }
    if (step.kind === "production") saveWriting();
    if (index === steps.length - 1) {
      saveWriting();
      try {
        const finished = await onFinish(receipt);
        if (finished) updateWorkspace(userId, current => {
          const checkpoints = { ...current.checkpoints }; delete checkpoints[checkpointKey(lesson.id, review)];
          return { ...current, checkpoints };
        });
      } catch (cause) {
        if (cause instanceof Error && cause.message === "study-incomplete") {
          history.current = {}; furthestIndex.current = 0;
          setReceipt(""); setIndex(0); setChecked(false); setAnswer(""); setTokens([]); setContextVisible(false); setAssisted(false); setTranslation(false); setRevealed(false); setListened(false);
          setError("A validação da prática expirou. Retome os exercícios; seus textos foram preservados.");
        } else setError("Não foi possível salvar a conclusão. Verifique a conexão e tente Concluir novamente. Sua prática foi preservada.");
      }
      return;
    }
    const target = index + 1;
    furthestIndex.current = Math.max(furthestIndex.current, target);
    moveTo(target);
  }
  return (
    <dialog
      ref={dialog}
      className="lesson-dialog"
      onCancel={(event) => { event.preventDefault(); if (!saving && !verifying) { saveWriting(); onClose(); } }}
      aria-labelledby="lesson-title"
    >
      <header>
        <button
          className="icon-button"
          disabled={saving || verifying}
          onClick={() => { saveWriting(); onClose(); }}
          aria-label={localizeAttribute("Fechar lição")}
        >
          <X size={20} />
        </button>
        <div>
          <p>{t(review ? "Revisão" : lesson.title)}</p>
          <progress
            value={index + 1}
            max={steps.length}
            aria-label={localizeAttribute("Etapas da lição")}
          />
        </div>
        <span>
          {t(index + 1)}/{t(steps.length)}
        </span>
      </header>
      <div className="lesson-body" ref={body} data-step-kind={step.kind}>
        {error && <p className="study-error" role="alert">{t(error)}</p>}
        {storageError && <p className="study-error" role="alert">{t("O navegador bloqueou o salvamento local. Mantenha esta aba aberta para preservar sua prática.")}</p>}
        {showIllustration && (
          <figure className="lesson-illustration" aria-hidden="true">
            <Image
              src={`/lesson-images/${illustrationId}.png`}
              alt={localizeAttribute("")}
              width={960}
              height={640}
              sizes="(max-width: 720px) calc(100vw - 40px), 760px"
              priority={index === 0}
            />
          </figure>
        )}
        {(step.kind === "summary" || (index === 0 && !showIllustration)) && (
          <MascotFigure mascot={mascot} equipped={equipped} size="small" decorative />
        )}
        <p className="eyebrow">
          {t(step.kind === "teach"
            ? "Entenda primeiro"
            : step.kind === "hook"
              ? lesson.experience.personality
              : step.kind === "discovery"
                ? "Descubra antes da regra"
            : step.kind === "summary"
              ? "Resumo da lição"
              : step.kind === "production"
                ? "Escrita e revisão"
                : step.kind === "vocabulary"
                  ? "Palavras em contexto"
                  : step.kind === "pronunciation"
                    ? "Treino de pronúncia · 20–90 segundos"
                    : step.kind === "error_analysis"
                      ? "Aprenda com os erros"
                  : isExercise(step)
                    ? "Sua vez"
                    : "Observe o exemplo")}
        </p>
        <h2 id="lesson-title" ref={heading} tabIndex={-1}>
          {t(step.title)}
        </h2>
        {step.kind === "vocabulary" ? (
          <dl className="vocabulary-cards" aria-label={localizeAttribute("Vocabulário da lição")}>
            {step.body.split("\n").filter(Boolean).map((line, lineIndex) => {
              const separator = line.indexOf(" — ");
              return <div key={lineIndex}>
                <dt lang={separator >= 0 ? "en" : undefined}>{t(separator >= 0 ? line.slice(0, separator) : line)}</dt>
                {separator >= 0 && <dd>{t(line.slice(separator + 3))}</dd>}
              </div>;
            })}
          </dl>
        ) : <p className="step-explanation">{t(step.kind === "summary" ? `Você praticou como ${lesson.experience.application}. Sua prática está pronta para ser concluída.` : step.body)}</p>}
        {index===0&&!review&&studyMode==='practice'&&<p className="practice-context">{t('Treino complementar. Esta conclusão também conta no curso.')}{nextLesson&&<>{t('Próxima na trilha:')}{t(nextLesson.title)}</>}</p>}
        {step.kind==='summary'&&!review&&<section className="lesson-outcome"><h3>{t('Agora você consegue')}</h3><p>{t(lessonMetadata[lesson.id].outcome)}.</p><p>{t('Confira na prática: tente fazer isso com uma situação sua, sem consultar o modelo.')}</p>{pathsForLesson(lesson.id).map(p=><details key={p.id}><summary>{t('Aplicar em outro contexto')} · {t(p.title)}</summary><p lang="en">{p.steps.find(s=>s.lessonId===lesson.id)!.task}</p></details>)}{nextLesson?<p><strong>{t('Depois de concluir, próxima na trilha:')}</strong>{t(nextLesson.title)}</p>:<p>{t('Trilha concluída. Você pode continuar explorando outras disciplinas.')}</p>}</section>}
        {step.kind === "hook" && (
          <div className="lesson-identity-card">
            <p><b>{t("Seu desafio:")}</b> {t(lesson.experience.challenge)}</p>
            <p><b>{t("Para usar no dia a dia:")}</b> {t(lesson.experience.application)}.</p>
            <details className="learning-disclosure"><summary>{t("Ver uma dica")}</summary><p>{t(lesson.experience.discovery)}</p></details>
          </div>
        )}

        {step.kind === "pronunciation" && step.pronunciation && (
          <section className="pronunciation-lab" aria-label={localizeAttribute("Treino de pronúncia")}>
            <div className="pronunciation-focus"><strong>{t(step.pronunciation.focus)}</strong>{step.pronunciation.ipa && <span>{t(step.pronunciation.ipa)}</span>}</div>
            <p><strong>{t("Posição da boca:")}</strong> {t(step.pronunciation.mouth)}</p>
            <div className="speech-forms">
              <div><span>{t("FRASE DO ÁUDIO")}</span><p lang="en">{t(step.pronunciation.careful)}</p></div>
              <div><span>{t("COMO ESCUTAR")}</span><p>{t(step.pronunciation.natural)}</p></div>
            </div>
            <p><strong>{t("O que muda:")}</strong> {t(step.pronunciation.change)}</p>
            {step.pronunciation.contrast && (
              <div className="contrast-drill"><span>{t("COMPARE OS SONS")}</span><p lang="en">{t(step.pronunciation.contrast[0])} <strong>{t("×")}</strong> {t(step.pronunciation.contrast[1])}</p><small>{t("Exemplos adicionais para praticar sem áudio próprio. Alterne as formas e perceba qual movimento muda.")}</small></div>
            )}
            <ol className="repeat-ladder">
              {step.pronunciation.drill.map((item, drillIndex) => <li key={drillIndex}><span>{t(drillIndex + 1)}</span><span lang="en">{t(item)}</span></li>)}
            </ol>
            <p className="microtrain-instruction"><strong>{t("Repita acompanhando a voz (shadowing):")}</strong>{t(" ouça o áudio abaixo em velocidade natural e comece a repetir logo depois da voz. Tente acompanhar o ritmo, a ligação entre as palavras e a entonação.")}</p>
            {voiceEnabled && <SpeechPractice key={`${lesson.id}-${index}`} lessonId={lesson.id} text={step.pronunciation.drill[2]} initialMascot={mascot} personalVoiceDisabled={learnerProfile?.namePronunciationStatus === "text-only"} />}
          </section>
        )}
        {step.kind === "error_analysis" && step.contrasts && (
          <div className="usage-contrast" aria-label={localizeAttribute("Comparação de uso")}>
            {step.contrasts.filter(item => item.tone !== "fixed").map(item => <div key={item.label} data-tone={item.tone}><span>{t(item.label)}</span><p lang="en">{t(item.text)}</p></div>)}
            <p>{t("Que escolha precisa mudar para atender ao contexto da frase?")}</p>
            <details key={index} className="learning-disclosure">
              <summary>{t("Ver o ajuste e o motivo")}</summary>
              {step.contrasts.filter(item => item.tone === "fixed").map(item => <p key={item.label} lang="en">{t(item.text)}</p>)}
              <p>{t(step.explanation)}</p>
            </details>
          </div>
        )}
        {!review && step.kind === "pronunciation" && lesson.steps.find(item => item.kind === "production")?.speakingTask && (
          <details className="learning-disclosure">
            <summary>{t("Experimente uma resposta sua")}</summary>
            <p>{t(lesson.steps.find(item => item.kind === "production")!.speakingTask)}</p>
            <p>{t("Prática opcional em voz alta, sem precisar escrever ou gravar.")}</p>
          </details>
        )}
        {!review && step.kind === "pronunciation" && tipForLesson(lesson.id) && <ConversationTipCard key={`${lesson.id}-${mascot}`} tip={tipForLesson(lesson.id)!} mascot={mascot} />}
        {step.listening && <ConversationListening key={`${lesson.id}:${index}`} conversation={step.listening}
          attempted={checked || step.kind !== "choice" || readWorkspace(userId).attempts.some(attempt => attempt.lessonId === lesson.id && attempt.stepId === exerciseId(lesson, step) && attempt.review === review && attempt.contentVersion === contentVersion)}
          onAssisted={() => setAssisted(true)} />}
        {retrievalExercise && (
          <aside className="review-retrieval-note" aria-label={localizeAttribute("Estratégia de revisão")}>
            <strong>{t("Leia o enunciado e tente responder.")}</strong>
            <p>{t("O texto e a frase com lacuna fazem parte da pergunta. Se você consultar a explicação ou a tradução antes de verificar, a tentativa será marcada como “com ajuda”.")}</p>
          </aside>
        )}
        {voiceEnabled && step.english && step.kind === "example" && (
          <SpeechPractice key={`${lesson.id}-${index}`} lessonId={lesson.id} text={step.english} initialMascot={mascot} onPlayed={() => setListened(true)} personalVoiceDisabled={learnerProfile?.namePronunciationStatus === "text-only"} />
        )}
        {voiceEnabled && step.kind === "example" && (
          <div className="listening-reveal">
            <p>{t(listened ? "Agora confira o que você entendeu." : "Tente ouvir pelo menos uma vez antes de revelar o texto.")}</p>
            <button className="secondary-button" onClick={() => setRevealed(value => !value)} aria-expanded={revealed}>
              {t(revealed ? "Ocultar frase" : "Revelar frase")}
            </button>
          </div>
        )}
        {step.english && (step.kind !== "example" || !voiceEnabled || revealed) && (
          <div
            className={`english-example ${step.kind === "dialogue" ? "dialogue-example" : ""}`}
            lang="en"
          >
            {t(step.english)}
          </div>
        )}
        {step.translation && (step.kind !== "example" || !voiceEnabled || revealed) && (
          <div className="translation-block">
            <button
              className="text-button"
              onClick={() => { setTranslation(!translation); if (!translation) setAssisted(true); }}
              aria-expanded={translation}
            >
              <Languages size={16} />
              {t(step.translationSummary ? translation ? "Ocultar resumo em português" : "Ver resumo em português" : translation ? "Ocultar tradução" : "Ver tradução")}
            </button>
            {translation && <p>{t(step.translation)}</p>}
          </div>
        )}
        {step.english && step.kind !== "summary" && !isExercise(step) && <button className="text-button" onClick={savePhrase}>{t(savedPhrase ? "Frase salva no Caderno" : "Guardar frase no Caderno")}</button>}
        {step.kind === "order_words" ? (
          <div className="word-exercise">
            <div className="word-answer" aria-label={localizeAttribute("Frase montada")}>
              {tokens.length ? (
                tokens.map((token) => (
                  <button
                    key={token}
                    disabled={checked}
                    onClick={() =>
                      setTokens(tokens.filter((value) => value !== token))
                    }
                    lang="en"
                  >
                    {t(step.options![token])} <X size={12} />
                  </button>
                ))
              ) : (
                <span>{t("Toque nas palavras abaixo para montar a frase.")}</span>
              )}
            </div>
            <div className="word-bank">
              {step.options!.map((word, token) => (
                <button
                  key={token}
                  disabled={tokens.includes(token) || checked}
                  onClick={() => setTokens([...tokens, token])}
                  lang="en"
                >
                  {t(word)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          isExercise(step) && (
            <div
              className="answer-options"
              role="group"
              aria-label={localizeAttribute("Opções de resposta")}
            >
              {step.options!.map((option, optionIndex) => (
                <button
                  key={option}
                  disabled={checked}
                  aria-pressed={answer === option}
                  className={answer === option ? "selected" : ""}
                  onClick={() => setAnswer(option)}
                >
                  <span>{t(String.fromCharCode(65 + optionIndex))}</span>
                  <span lang="en">{t(option)}</span>
                  {answer === option && <Check size={17} />}
                </button>
              ))}
            </div>
          )
        )}
        {isExercise(step) && (
          <details key={index} open={contextVisible} className="lesson-notes" onToggle={(event) => {
            setContextVisible(event.currentTarget.open);
            if (event.currentTarget.open) {
              setAssisted(true);
            }
          }}>
            <summary>{t("Consultar explicação e vocabulário")}</summary>
            {lesson.steps
              .filter(
                (item) => item.kind === "teach" || item.kind === "vocabulary",
              )
              .map((item, noteIndex) => (
                <section key={noteIndex}>
                  <h3>{t(item.title)}</h3>
                  <p>{t(item.body)}</p>
                </section>
              ))}
          </details>
        )}
        {retrievalExercise && assisted && !checked && (
          <p className="review-assistance-status" role="status">{t("Você consultou uma explicação ou tradução. Esta tentativa será marcada como “com ajuda”.")}</p>
        )}
        {checked && (
          <div
            className={`answer-feedback ${correct ? "correct" : "retry"}`}
            ref={feedback}
            role="status"
          >
            <strong>
              {t(correct ? "Resposta correta." : "Vamos rever essa resposta.")}
            </strong>
            <p>{t(step.explanation)}</p>
            {!correct && (
              <p>{t("Resposta: ")}<span lang="en">{t(step.answer)}</span>
              </p>
            )}
          </div>
        )}
      </div>
      <footer>
        <span>
          {t(review
            ? retrievalExercise
              ? assisted
                ? "Apoio consultado nesta etapa"
                : "Tente responder antes de consultar explicações"
              : "Prática de revisão"
            : "Você pode consultar as explicações")}
        </span>
        <div className="lesson-footer-actions">
          <button
            className="secondary-button lesson-back-button"
            disabled={index === 0 || saving || verifying}
            onClick={previous}
          >
            <ArrowLeft size={16} />{t("Voltar etapa")}</button>
          <button
            className="primary-button lesson-forward-button"
            disabled={saving || verifying || (isExercise(step) && !selected)}
            onClick={next}
          >
            {t(verifying ? "Verificando…" : saving
              ? "Salvando…"
              : isExercise(step) && !checked
              ? "Verificar"
              : checked && !correct
                ? "Tentar novamente"
                : index === steps.length - 1
                  ? "Concluir"
                  : "Continuar")}
            <ArrowRight size={16} />
          </button>
        </div>
      </footer>
    </dialog>
  );
}
