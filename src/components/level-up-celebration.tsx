"use client";

import { ArrowRight, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { t, localizeAttribute } from "@/lib/interface-language";
import {
  earnedLevelPromotion,
  levelCelebrationStorageKey,
  reachedCourseLevel,
} from "@/lib/level-progression";
import type { Level } from "@/lib/levels";
import styles from "./level-up-celebration.module.css";

type Promotion = { from: Level; to: Level };

const confetti = Array.from({ length: 22 }, (_, index) => ({
  x: `${4 + ((index * 37) % 92)}%`,
  drift: `${((index * 29) % 90) - 45}px`,
  delay: `${(index % 7) * 55}ms`,
  duration: `${920 + (index % 5) * 115}ms`,
  color: ["var(--accent)", "#ffca55", "#f06a72", "#65bde8"][index % 4],
}));

function readAcknowledgedLevel(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function acknowledgeLevel(key: string, level: Level) {
  try {
    localStorage.setItem(key, level);
    return;
  } catch {
    try {
      sessionStorage.setItem(key, level);
    } catch {
      // The in-memory component state still prevents duplicate announcements.
    }
  }
}

export function LevelUpCelebration({
  userId,
  currentLevel,
  completed,
  learnerName,
}: {
  userId: string;
  currentLevel: Level;
  completed: Record<string, string>;
  learnerName?: string | null;
}) {
  const reachedLevel = useMemo(
    () => reachedCourseLevel(currentLevel, completed),
    [currentLevel, completed],
  );
  const storageKey = levelCelebrationStorageKey(userId);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const priorFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const acknowledged = readAcknowledgedLevel(storageKey);
    const nextPromotion = earnedLevelPromotion(acknowledged, reachedLevel, completed);

    // Persist before displaying so a refresh cannot replay the same promotion.
    acknowledgeLevel(storageKey, reachedLevel);
    let cancelled = false;
    if (nextPromotion)
      queueMicrotask(() => {
        if (!cancelled) setPromotion(nextPromotion);
      });
    return () => {
      cancelled = true;
    };
  }, [completed, reachedLevel, storageKey]);

  useEffect(() => {
    if (!promotion) return;
    priorFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    headingRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPromotion(null);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      priorFocus.current?.focus?.();
    };
  }, [promotion]);

  if (!promotion) return null;
  const name = learnerName?.trim();

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        ref={dialogRef}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-up-title"
        aria-describedby="level-up-message"
      >
        {confetti.map((piece, index) => (
          <i
            aria-hidden="true"
            className={styles.confetti}
            key={index}
            style={{
              "--x": piece.x,
              "--drift": piece.drift,
              "--delay": piece.delay,
              "--duration": piece.duration,
              "--confetti-color": piece.color,
            } as CSSProperties}
          />
        ))}
        <button
          className={styles.close}
          type="button"
          onClick={() => setPromotion(null)}
          aria-label={localizeAttribute("Fechar comemoração")}
        >
          <X size={19} />
        </button>
        <div className={styles.medal} aria-hidden="true">
          <strong>{promotion.to}</strong>
          <Sparkles size={25} />
        </div>
        <p className={styles.eyebrow}>{t("Novo nível alcançado")}</p>
        <h2 className={styles.title} id="level-up-title" ref={headingRef} tabIndex={-1}>
          {name ? `${t("Parabéns")}, ${name}!` : `${t("Parabéns")}!`}
        </h2>
        <p className={styles.message} id="level-up-message">
          {t("Você concluiu as lições deste nível e abriu uma nova etapa da sua jornada.")}
        </p>
        <p className={styles.path} aria-label={localizeAttribute("Progressão de nível") + `: ${promotion.from} → ${promotion.to}`}>
          <span>{promotion.from}</span><ArrowRight size={16} aria-hidden="true" /><strong>{promotion.to}</strong>
        </p>
        <button className={styles.continue} type="button" onClick={() => setPromotion(null)}>
          {t("Continuar aprendendo")} <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
