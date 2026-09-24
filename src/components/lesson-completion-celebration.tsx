"use client";

import { useEffect, useRef } from "react";
import { getInterfaceLocale, getSupportLocale, supportT, t } from "@/lib/interface-language";
import type { MascotId } from "@/lib/rewards-shared";
import { LessonCompletionMascot } from "./lesson-completion-mascot";

export type CompletionMoment = {
  review: boolean;
  earned: number;
  independent: boolean;
  outcome: string;
  nextReview?: string;
  nextTitle: string;
  mascot: MascotId;
};

function outcomeSentence(outcome: string) {
  const translated = supportT(outcome).trim();
  return `${translated}${/[.!?]$/.test(translated) ? "" : "."}`;
}

export function LessonCompletionCelebration({ moment, onClose }: { moment: CompletionMoment; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("h2")?.focus();
    return () => { if (dialog.open) dialog.close(); };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="lesson-completion-moment"
      aria-labelledby="lesson-completion-title"
      aria-describedby="lesson-completion-outcome"
      onCancel={onClose}
    >
      <div className="lesson-completion-shell">
        <div className="lesson-completion-scroll">
          <p className="lesson-completion-kicker">{t(moment.review ? "REVISÃO CONCLUÍDA" : "LIÇÃO CONCLUÍDA")}</p>
          <LessonCompletionMascot mascot={moment.mascot} />
          <div className="lesson-completion-copy">
            <h2 id="lesson-completion-title" tabIndex={-1}>{t(moment.review ? "Revisão concluída" : "Lição concluída")}</h2>
            <p className="lesson-completion-message">{t(moment.independent ? "Você conseguiu sem ajuda." : "Você praticou, corrigiu e avançou.")}</p>
            <p id="lesson-completion-outcome" lang={getSupportLocale()}>{supportT("Agora você consegue")} {outcomeSentence(moment.outcome)}</p>
          </div>
          <div className="lesson-completion-details">
            {moment.earned > 0 && <strong>+{moment.earned} {t("moedas")}</strong>}
            {moment.nextReview && <span>{t("Próxima revisão:")} {new Intl.DateTimeFormat(getInterfaceLocale(), { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" }).format(new Date(moment.nextReview))}</span>}
            <span>{t("Próximo passo:")} {t(moment.nextTitle)}</span>
          </div>
        </div>
        <div className="lesson-completion-footer">
          <button className="lesson-completion-ok" type="button" onClick={onClose}>{t("OK")}</button>
        </div>
      </div>
    </dialog>
  );
}
