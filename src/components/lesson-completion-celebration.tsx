"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { getInterfaceLocale, getSupportLocale, supportT, t } from "@/lib/interface-language";
import type { MascotId } from "@/lib/rewards-shared";
import { lessons } from "@/lib/curriculum";
import { LessonCompletionMascot } from "./lesson-completion-mascot";
const LessonSupport = dynamic(() => import("./lesson-support"));
export type CompletionMoment = {
  review: boolean; earned: number; independent: boolean; outcome: string;
  nextReview?: string; nextTitle: string; mascot: MascotId; lessonId?: string;
  score?: number; activeMs?: number; newRecord?: boolean;
};
export function LessonCompletionCelebration({ moment, onClose, onNext, userId, textOnly }:
  { moment: CompletionMoment; onClose: () => void; onNext?: () => void; userId?: string; textOnly?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current; if (!dialog) return;
    dialog.showModal(); dialog.querySelector<HTMLElement>("h2")?.focus();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  const lesson = lessons.find(item => item.id === moment.lessonId);
  return <dialog ref={dialogRef} className="lesson-completion-moment" aria-labelledby="lesson-completion-title" onCancel={onClose}>
    <div className="lesson-completion-shell">
      <div className="lesson-completion-scroll">
        <p className="lesson-completion-kicker">{t(moment.review ? "REVISÃO CONCLUÍDA" : "LIÇÃO CONCLUÍDA")}</p>
        <LessonCompletionMascot mascot={moment.mascot}/>
        <div className="lesson-completion-copy">
          <h2 id="lesson-completion-title" tabIndex={-1}>{t(moment.review ? "Revisão concluída" : "Mais uma conquista!")}</h2>
          <p className="lesson-completion-message">{t(moment.independent ? "Você conseguiu sem ajuda." : "Você praticou, corrigiu e avançou.")}</p>
          <p lang={getSupportLocale()}>{supportT(moment.outcome)}</p>
        </div>
        <div className="lesson-completion-details">
          {moment.earned > 0 && <strong>+{moment.earned} {t("moedas")}</strong>}
          {moment.score !== undefined && <strong>{moment.score} {t("pontos")} · {Math.round((moment.activeMs ?? 0) / 1000)}s {moment.newRecord && t("· Novo recorde!")}</strong>}
          {moment.nextReview && <span>{t("Próxima revisão:")} {new Intl.DateTimeFormat(getInterfaceLocale(), { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" }).format(new Date(moment.nextReview))}</span>}
        </div>
        {lesson && <details className="quick-completion-support"><summary>{t("Entender melhor")}</summary><LessonSupport lesson={lesson} mascot={moment.mascot} userId={userId} textOnly={textOnly}/></details>}
      </div>
      <div className="lesson-completion-footer">
        {onNext && <button className="lesson-completion-ok" type="button" onClick={onNext}>{t("Próxima lição")}</button>}
        <button className="text-button" type="button" onClick={onClose}>{t("Voltar ao início")}</button>
      </div>
    </div>
  </dialog>;
}
