"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { localizeAttribute, t } from "@/lib/interface-language";

export function MotionLoader({ label }: { label: string }) {
  const [pageLoaded, setPageLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  useEffect(() => {
    if (document.readyState === "complete") {
      queueMicrotask(() => setPageLoaded(true));
      return;
    }
    const ready = () => setPageLoaded(true);
    window.addEventListener("load", ready, { once: true });
    return () => window.removeEventListener("load", ready);
  }, []);
  return (
    <div className="motion-loader" role="status" aria-live="polite" aria-busy="true">
      <span className="motion-loader-orbit" aria-hidden="true">
        {pageLoaded && !videoFailed && <video className={videoReady ? "ready" : ""} src="/motion/sparky-loader.webm" autoPlay muted loop playsInline onCanPlay={() => setVideoReady(true)} onError={() => setVideoFailed(true)} />}
        {(!videoReady || videoFailed) && <><span className="motion-loader-sparky"><Image src="/icons/sparky-192-v2.png" width={34} height={34} alt="" /></span><i /></>}
      </span>
      <p>{t(label)}</p>
    </div>
  );
}

export function StreakBadge({ count, longest }: { count: number; longest: number }) {
  const longestLabel = localizeAttribute("Maior sequência: {count} dias").replace("{count}", String(longest));
  const streakLabel = localizeAttribute("Sequência atual: {count} dias. Maior sequência: {longest} dias.")
    .replace("{count}", String(count)).replace("{longest}", String(longest));
  return (
    <div className="streak-badge" title={longestLabel} aria-label={streakLabel}>
      <span className="streak-flame" aria-hidden="true"><Image src="/motion/streak-flame-96.png" width={24} height={24} alt="" /></span>
      <strong>{count}</strong>
    </div>
  );
}

export function MotionTransition({ active }: { active: boolean }) {
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  if (!active) return null;
  return (
    <div className="motion-transition" aria-hidden="true">
      {!videoFailed && <video className={videoReady ? "ready" : ""} src="/motion/sparky-transition.webm" autoPlay muted playsInline onCanPlay={() => setVideoReady(true)} onError={() => setVideoFailed(true)} />}
      {(!videoReady || videoFailed) && <><span className="motion-transition-fallback" /><span className="motion-transition-trail"><i /><i /><i /></span></>}
    </div>
  );
}

export function StreakCelebration({ count, milestone, earned, onClose }: { count: number; milestone: boolean; earned: number; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, milestone ? 6800 : 4800);
    return () => window.clearTimeout(timer);
  }, [milestone, onClose]);
  return (
    <aside className="streak-celebration" role="status" aria-live="polite">
      <button className="streak-close" onClick={onClose} aria-label={localizeAttribute("Fechar celebração da sequência")}><X size={17} /></button>
      <div className="streak-animation" aria-hidden="true">
        <Image className="streak-animation-flame" src="/motion/streak-flame-192.png" width={192} height={192} alt="" priority />
      </div>
      <div>
        <p className="eyebrow">{t(milestone ? "MARCO DA SEQUÊNCIA" : "SEQUÊNCIA DIÁRIA")}</p>
        <strong>{count} {t(count === 1 ? "dia estudando" : "dias estudando")}</strong>
        <p>{milestone ? <>{t("Você manteve o ritmo por")} {count} {t("dias.")} +{earned} {t("moedas.")}</> : t("Volte amanhã para manter o foguinho aceso.")}</p>
      </div>
    </aside>
  );
}
