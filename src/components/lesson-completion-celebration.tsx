"use client";
import { useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { getInterfaceLocale, getSupportLocale, supportT, t } from "@/lib/interface-language";
import { useScrollLock } from "@/lib/use-scroll-lock";
import type { MascotId } from "@/lib/rewards-shared";
import { lessons } from "@/lib/curriculum";
import { LessonCompletionMascot } from "./lesson-completion-mascot";
import { CoinIcon } from "./coin-icon";
const LessonSupport = dynamic(() => import("./lesson-support"));
export type CompletionMoment = {
  review: boolean; earned: number; independent: boolean; outcome: string;
  nextReview?: string; nextTitle: string; mascot: MascotId; lessonId?: string;
  score?: number; activeMs?: number; newRecord?: boolean;
};
export function LessonCompletionCelebration({ moment, onClose, onNext, userId, textOnly }:
  { moment: CompletionMoment; onClose: () => void; onNext?: () => void; userId?: string; textOnly?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [support, setSupport] = useState(false);
  useScrollLock();
  useLayoutEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current; if (!dialog) return;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, []);
  useLayoutEffect(() => { dialogRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true }); }, [support]);
  useLayoutEffect(() => {
    if (support) return;
    const current = dialogRef.current;
    const message = current?.querySelector<HTMLElement>(".lesson-completion-scroll");
    if (!current || !message) return;
    const check = () => { current.dataset.overflow = message.scrollHeight > message.clientHeight + 2 ? "true" : "false"; };
    const observer = new ResizeObserver(check);
    observer.observe(current); observer.observe(message);
    message.querySelectorAll<HTMLElement>(".lesson-completion-copy,.lesson-completion-details").forEach(element => observer.observe(element));
    window.addEventListener("resize", check);
    check();
    return () => { observer.disconnect(); window.removeEventListener("resize", check); };
  }, [support]);
  const lesson = lessons.find(item => item.id === moment.lessonId);
  return <dialog ref={dialogRef} className="lesson-completion-moment" data-support-open={support}
    aria-labelledby={support ? "completion-help-title" : "lesson-completion-title"} onCancel={event => { event.preventDefault(); if (support) setSupport(false); else onClose(); }}>
    {support && lesson ? <div className="completion-help-shell">
      <header><button className="text-button" onClick={() => setSupport(false)}><ArrowLeft size={18}/>{t("Voltar ao resultado")}</button><h2 id="completion-help-title" tabIndex={-1}>{t("Entender melhor")}</h2></header>
      <div className="completion-help-content"><p lang={getSupportLocale()}>{supportT(moment.outcome)}</p><LessonSupport lesson={lesson} mascot={moment.mascot} userId={userId} textOnly={textOnly}/></div>
    </div> : <div className="lesson-completion-shell">
      <div className="lesson-completion-scroll">
        <p className="lesson-completion-kicker">{t(moment.review ? "REVISÃO CONCLUÍDA" : "LIÇÃO CONCLUÍDA")}</p>
        <LessonCompletionMascot mascot={moment.mascot}/>
        <div className="lesson-completion-copy">
          <h2 id="lesson-completion-title" tabIndex={-1}>{t(moment.review ? "Revisão concluída" : "Mais uma conquista!")}</h2>
          <p className="lesson-completion-message">{t(moment.independent ? "Você conseguiu sem ajuda." : "Você praticou, corrigiu e avançou.")}</p>
        </div>
        <div className="lesson-completion-details">
          {moment.earned > 0 && <strong className="completion-coins" aria-label={"+" + moment.earned + " " + t("moedas")}><CoinIcon size={26}/> +{moment.earned}</strong>}
          {moment.score !== undefined && <strong>{moment.score} {t("pontos")} · {Math.round((moment.activeMs ?? 0) / 1000)}s {moment.newRecord && t("· Novo recorde!")}</strong>}
          {moment.nextReview && <span>{t("Próxima revisão:")} {new Intl.DateTimeFormat(getInterfaceLocale(), { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" }).format(new Date(moment.nextReview))}</span>}
        </div>
      </div>
      <div className="lesson-completion-footer">
        {onNext && <button className="lesson-completion-ok" type="button" onClick={onNext}>{t("Próxima lição")}</button>}
        <div className="completion-secondary-actions">
          <button className="text-button" type="button" onClick={onClose}>{t("Voltar ao início")}</button>
          {lesson && <button className="text-button" type="button" onClick={() => setSupport(true)}>{t("Entender melhor")}</button>}
        </div>
      </div>
    </div>}
  </dialog>;
}
