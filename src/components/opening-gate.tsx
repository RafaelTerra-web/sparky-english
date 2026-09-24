"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SparkyApp from "./sparky-app";
import OpeningScene from "./opening-scene";

const OPENING_SEEN_KEY = "sparky-opening-seen-v3";

export default function OpeningGate() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const ready = useRef(false);
  const introFinished = useRef(false);
  const exitTimer = useRef<number | null>(null);
  const fallbackTimer = useRef<number | null>(null);

  const leaveWhenReady = useCallback(() => {
    if (!ready.current || !introFinished.current || exitTimer.current !== null) return;
    setLeaving(true);
    exitTimer.current = window.setTimeout(() => {
      document.documentElement.dataset.openingSeen = "true";
      setVisible(false);
    }, 280);
  }, []);

  const onIntroFinished = useCallback(() => {
    if (introFinished.current) return;
    introFinished.current = true;
    try { localStorage.setItem(OPENING_SEEN_KEY, "1"); } catch { /* Private mode may block storage. */ }
    leaveWhenReady();
  }, [leaveWhenReady]);

  const onReplay = useCallback(() => {
    if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
    fallbackTimer.current = window.setTimeout(onIntroFinished, 5000);
  }, [onIntroFinished]);

  const onReady = useCallback(() => {
    if (ready.current) return;
    ready.current = true;
    leaveWhenReady();
  }, [leaveWhenReady]);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(OPENING_SEEN_KEY) === "1"; } catch { /* Private mode may block storage. */ }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      introFinished.current = true;
      if (!seen) {
        try { localStorage.setItem(OPENING_SEEN_KEY, "1"); } catch { /* Private mode may block storage. */ }
      }
      document.documentElement.dataset.openingSeen = "true";
      const skipTimer = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(skipTimer);
    }
    fallbackTimer.current = window.setTimeout(onIntroFinished, 5000);
    return () => {
      if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
    };
  }, [onIntroFinished]);

  useEffect(() => () => {
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
  }, []);

  return (
    <>
      <SparkyApp onReady={onReady} />
      {visible && <OpeningScene leaving={leaving} onFinished={onIntroFinished} onReplay={onReplay} />}
    </>
  );
}
