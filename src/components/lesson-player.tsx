"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Languages, X } from "lucide-react";
import type { Lesson } from "@/lib/curriculum";
import type { PublicRewardState } from "@/lib/rewards-shared";
import { contentVersion } from "@/lib/content/build";
import { isExercise, exerciseId } from "@/lib/study";
import { readWorkspace, updateWorkspace, saveCheckpoint, checkpointKey } from "@/lib/learning-local";
import { SpeechPractice } from "./speech-practice";
import { MascotFigure } from "./mascot-studio";
const voiceEnabled = process.env.NEXT_PUBLIC_VOICE_ENABLED !== "false";

export default function LessonPlayer({
  userId,
  lesson,
  review,
  mascot,
  equipped,
  saving,
  onClose,
  onFinish,
}: {
  userId: string;
  lesson: Lesson;
  review: boolean;
  mascot: PublicRewardState["mascot"];
  equipped: PublicRewardState["equipped"];
  saving: boolean;
  onClose: () => void;
  onFinish: (receipt: string) => Promise<boolean>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [recovered] = useState(() => readWorkspace(userId).checkpoints[checkpointKey(lesson.id, review)]);
  const [initial] = useState(() => recovered && Date.now() - Date.parse(recovered.updatedAt) < 7 * 3600000 ? recovered : null);
  const steps = review ? lesson.steps.filter(step => isExercise(step) || step.kind === "summary") : lesson.steps;
  const [index, setIndex] = useState(initial && initial.index < steps.length ? initial.index : 0);
  const [answer, setAnswer] = useState(initial?.answer || "");
  const [tokens, setTokens] = useState<number[]>(initial?.tokens || []);
  const [checked, setChecked] = useState(Boolean(initial?.checked));
  const [correct, setCorrect] = useState(Boolean(initial?.correct));
  const [translation, setTranslation] = useState(Boolean(initial?.translation));
  const [assisted, setAssisted] = useState(Boolean(initial?.assisted));
  const [draft, setDraft] = useState(recovered?.draft || "");
  const [receipt, setReceipt] = useState(initial?.receipt || "");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [savedPhrase, setSavedPhrase] = useState(false);
  const step = steps[index];
  const selected = step.kind === "order_words" ? tokens.map(token => step.options?.[token] || "").join(" ") : answer;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const current = dialog.current;
    current?.showModal();
    return () => { current?.close(); document.body.style.overflow = previousOverflow; opener?.focus(); };
  }, []);
  useEffect(() => { heading.current?.focus(); }, [index]);
  useEffect(() => {
    const saved = saveCheckpoint(userId, { lessonId: lesson.id, review, index, answer, tokens, checked, correct,
      translation, assisted, receipt, draft, updatedAt: new Date().toISOString(), contentVersion });
    if (!saved) queueMicrotask(() => setStorageError(true));
  }, [userId, lesson.id, review, index, answer, tokens, checked, correct, translation, assisted, receipt, draft]);
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
            setReceipt(""); setIndex(0); setChecked(false); setAnswer(""); setTokens([]);
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
      try {
        const finished = await onFinish(receipt);
        if (finished) updateWorkspace(userId, current => {
          const checkpoints = { ...current.checkpoints }; delete checkpoints[checkpointKey(lesson.id, review)];
          return { ...current, checkpoints };
        });
      } catch (cause) {
        if (cause instanceof Error && cause.message === "study-incomplete") {
          setReceipt(""); setIndex(0); setChecked(false); setAnswer(""); setTokens([]);
          setError("A validação da prática expirou. Retome os exercícios; seus textos foram preservados.");
        } else setError("Não foi possível salvar a conclusão. Verifique a conexão e tente Concluir novamente. Sua prática foi preservada.");
      }
      return;
    }
    setIndex(value => value + 1); setAnswer(""); setTokens([]); setChecked(false);
    setCorrect(false); setTranslation(false); setAssisted(false); setSavedPhrase(false);
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
          aria-label="Fechar lição"
        >
          <X size={20} />
        </button>
        <div>
          <p>{review ? "Revisão" : lesson.title}</p>
          <progress
            value={index + 1}
            max={steps.length}
            aria-label="Etapas da lição"
          />
        </div>
        <span>
          {index + 1}/{steps.length}
        </span>
      </header>
      <div className="lesson-body">
        {error && <p className="study-error" role="alert">{error}</p>}
        {storageError && <p className="study-error" role="alert">O navegador bloqueou o salvamento local. Mantenha esta aba aberta para preservar sua prática.</p>}
        {(index === 0 || step.kind === "summary") && (
          <MascotFigure mascot={mascot} equipped={equipped} size="small" decorative />
        )}
        <p className="eyebrow">
          {step.kind === "teach"
            ? "Entenda primeiro"
            : step.kind === "summary"
              ? "Resumo da lição"
              : step.kind === "production"
                ? "Escrita e auto-revisão"
                : step.kind === "vocabulary"
                  ? "Palavras em contexto"
                  : isExercise(step)
                    ? "Sua vez"
                    : "Observe o exemplo"}
        </p>
        <h2 id="lesson-title" ref={heading} tabIndex={-1}>
          {step.title}
        </h2>
        <p className="step-explanation">{step.body}</p>
        {step.kind === "production" && (
          <div className="production-workspace">
            <label htmlFor="lesson-draft">Seu rascunho (opcional)</label>
            <textarea
              id="lesson-draft"
              lang="en"
              rows={7}
              maxLength={4000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escreva sua resposta em inglês…"
            />
            <p>
              Seu rascunho é salvo neste dispositivo. Ao avançar ou fechar, uma versão vai para o Caderno. Não há correção automática ou nota.
            </p>
            <strong>Antes de continuar, confira:</strong>
            <ul>
              <li>Respondi a todas as partes da proposta?</li>
              <li>Usei a estrutura e o vocabulário estudados?</li>
              <li>Sujeito, verbo e referência de tempo estão coerentes?</li>
              <li>
                Meu texto comunica a ideia sem depender de uma tradução palavra
                por palavra?
              </li>
            </ul>
          </div>
        )}
        {isExercise(step) && (
          <details className="lesson-notes" onToggle={(event) => { if (event.currentTarget.open) setAssisted(true); }}>
            <summary>Consultar explicação e vocabulário</summary>
            {lesson.steps
              .filter(
                (item) => item.kind === "teach" || item.kind === "vocabulary",
              )
              .map((item, noteIndex) => (
                <section key={noteIndex}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </section>
              ))}
          </details>
        )}
        {step.english && (
          <div
            className={`english-example ${step.kind === "dialogue" ? "dialogue-example" : ""}`}
            lang="en"
          >
            {step.english}
          </div>
        )}
        {step.translation && (
          <div className="translation-block">
            <button
              className="text-button"
              onClick={() => { setTranslation(!translation); if (!translation) setAssisted(true); }}
              aria-expanded={translation}
            >
              <Languages size={16} />
              {translation ? "Ocultar tradução" : "Ver tradução"}
            </button>
            {translation && <p>{step.translation}</p>}
          </div>
        )}
        {step.english && !isExercise(step) && <button className="text-button" onClick={savePhrase}>{savedPhrase ? "Frase salva no Caderno" : "Guardar frase no Caderno"}</button>}
        {voiceEnabled && step.english && step.kind === "example" && (
          <SpeechPractice key={`${lesson.id}-${index}`} text={step.english} initialMascot={mascot} />
        )}
        {step.kind === "order_words" ? (
          <div className="word-exercise">
            <div className="word-answer" aria-label="Frase montada">
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
                    {step.options![token]} <X size={12} />
                  </button>
                ))
              ) : (
                <span>Toque nas palavras abaixo para montar a frase.</span>
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
                  {word}
                </button>
              ))}
            </div>
          </div>
        ) : (
          isExercise(step) && (
            <div
              className="answer-options"
              role="group"
              aria-label="Opções de resposta"
            >
              {step.options!.map((option, optionIndex) => (
                <button
                  key={option}
                  disabled={checked}
                  aria-pressed={answer === option}
                  className={answer === option ? "selected" : ""}
                  onClick={() => setAnswer(option)}
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>
                  <span lang="en">{option}</span>
                  {answer === option && <Check size={17} />}
                </button>
              ))}
            </div>
          )
        )}
        {checked && (
          <div
            className={`answer-feedback ${correct ? "correct" : "retry"}`}
            role="status"
          >
            <strong>
              {correct ? "Resposta correta." : "Vamos rever essa resposta."}
            </strong>
            <p>{step.explanation}</p>
            {!correct && (
              <p>
                Resposta: <span lang="en">{step.answer}</span>
              </p>
            )}
          </div>
        )}
      </div>
      <footer>
        <span>
          {review ? "Prática de revisão" : "Você pode consultar as explicações"}
        </span>
        <button
          className="primary-button"
          disabled={saving || verifying || (isExercise(step) && !selected)}
          onClick={next}
        >
          {verifying ? "Verificando…" : saving
            ? "Salvando…"
            : isExercise(step) && !checked
            ? "Verificar"
            : checked && !correct
              ? "Tentar novamente"
              : index === steps.length - 1
                ? "Concluir"
                : "Continuar"}
          <ArrowRight size={16} />
        </button>
      </footer>
    </dialog>
  );
}
