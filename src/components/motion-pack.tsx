"use client";

import { Check, ChevronRight, Trophy, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { isStreakMilestone, streakTargets } from "@/lib/streak-milestones";
import { localizeAttribute, t, supportT, getSupportLocale } from "@/lib/interface-language";

export function MotionLoader({ label }: { label: string }) {
  return <div className="motion-loader" role="status" aria-live="polite" aria-busy="true">
    <span className="loading-dots" aria-hidden="true"><i /><i /><i /></span>
    <p lang={getSupportLocale()}>{supportT(label)}</p>
  </div>;
}

export function StreakBadge({ count, longest }: { count: number; longest: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const targets = streakTargets(count);
  const next = targets.find(day => day > count) ?? targets[targets.length - 1];
  const [selected, setSelected] = useState(next);
  const reached = count >= selected;
  function openRoadmap() {
    setSelected(next);
    dialog.current?.showModal();
  }
  const longestLabel = localizeAttribute("Maior sequência: {count} dias").replace("{count}", String(longest));
  const streakLabel = localizeAttribute("Sequência atual: {count} dias. Maior sequência: {longest} dias.")
    .replace("{count}", String(count)).replace("{longest}", String(longest));
  return (
    <>
    <button ref={trigger} type="button" className="streak-badge" title={longestLabel} aria-label={streakLabel} aria-haspopup="dialog" onClick={openRoadmap}>
      <span className="streak-flame" aria-hidden="true"><Image src="/motion/streak-flame-96.png" width={24} height={24} alt="" /></span>
      <strong>{count}</strong>
      <ChevronRight size={12} aria-hidden="true" />
    </button>
    <dialog ref={dialog} className="streak-roadmap" aria-labelledby="streak-roadmap-title" onClose={() => trigger.current?.focus({ preventScroll: true })} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="streak-roadmap-content">
        <button type="button" className="streak-close" onClick={() => dialog.current?.close()} aria-label={localizeAttribute("Fechar sequência")}><X size={20}/></button>
        <div className="streak-roadmap-heading"><Image src="/motion/streak-flame-192.png" width={64} height={64} alt=""/><div><p className="eyebrow">{t("UM DIA DE CADA VEZ")}</p><h2 id="streak-roadmap-title">{t("Seu foguinho")}</h2></div></div>
        <div className="streak-roadmap-stats"><p lang={getSupportLocale()}><strong>{count}</strong> {supportT(count === 1 ? "dia seguido" : "dias seguidos")}</p><span><Trophy size={15} aria-hidden="true"/>{t("Recorde")} · {longest}</span></div>
        <p lang={getSupportLocale()} className="streak-roadmap-hint">{supportT("Entre todos os dias para manter sua sequência. Toque em um marco para explorar.")}</p>
        <div className="streak-targets" aria-label={localizeAttribute("Marcos da sequência")}>
          {targets.map(day => <button type="button" key={day} className={count >= day ? "achieved" : ""} aria-pressed={selected === day} onClick={() => setSelected(day)}><span>{count >= day ? <Check size={14} aria-hidden="true"/> : day}</span><small lang={getSupportLocale()}>{day} {supportT("dias")}</small></button>)}
        </div>
        <div className="streak-milestone-detail" aria-live="polite"><strong>{selected} {t("dias")}</strong><span>{t(reached ? "Marco conquistado!" : "Seu próximo passo, no seu ritmo.")}</span><progress aria-label={localizeAttribute("Progresso até o marco selecionado")} value={Math.min(count, selected)} max={selected}/><small lang={getSupportLocale()}>{reached ? supportT("Você construiu esse hábito dia após dia.") : supportT("Faltam {count} dias para este marco.").replace("{count}", String(selected - count))}</small></div>
        <p lang={getSupportLocale()} className="streak-roadmap-note">{supportT("A cada 7 dias seguidos: +5 moedas. Se perder um dia, seu aprendizado e suas moedas continuam com você.")}</p>
      </div>
    </dialog>
    </>
  );
}

export function MotionTransition({ active }: { active: boolean }) {
  return active ? <div className="motion-transition" aria-hidden="true" /> : null;
}

export function StreakCelebration({ count, milestone, earned, onClose }: { count: number; milestone: boolean; earned: number; onClose: () => void }) {
  const special = isStreakMilestone(count);
  useEffect(() => {
    if (special) return;
    const timer = window.setTimeout(onClose, milestone ? 6800 : 4800);
    return () => window.clearTimeout(timer);
  }, [milestone, special, onClose]);
  return (
    <aside className={`streak-celebration${special ? " streak-special" : ""}`} data-milestone={special ? count : undefined} role="status" aria-live="polite">
      {special && <div className="streak-sparks" aria-hidden="true">{Array.from({length: 12}, (_, index) => <i key={index} style={{left: `${8 + index * 7}%`, animationDelay: `${index * 65}ms`}}/>)}</div>}
      <button className="streak-close" onClick={onClose} aria-label={localizeAttribute("Fechar celebração da sequência")}><X size={17} /></button>
      <div className="streak-animation" aria-hidden="true">
        <Image className="streak-animation-flame" src="/motion/streak-flame-192.png" width={192} height={192} alt="" priority />
      </div>
      <div>
        <p className="eyebrow">{t(special || milestone ? "MARCO DA SEQUÊNCIA" : "SEQUÊNCIA DIÁRIA")}</p>
        <strong>{count} {t(count === 1 ? "dia seguido" : "dias seguidos")}</strong>
        <p lang={getSupportLocale()}>{special ? supportT("Um hábito que cresce com você. Parabéns pela constância!") : milestone ? <>{supportT("Você manteve o ritmo por")} {count} {supportT("dias.")}</> : supportT("Volte amanhã para manter o foguinho aceso.")}{earned > 0 && <> +{earned} {supportT("moedas.")}</>}</p>
      </div>
    </aside>
  );
}
