"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SparkyApp from "./sparky-app";
import OpeningScene from "./opening-scene";

const OPENING_SEEN_KEY = "sparky-opening-seen-v4";
const MINIMUM_OPENING_MS = 850;

export default function OpeningGate() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const ready = useRef(false);
  const minimumElapsed = useRef(false);
  const exitTimer = useRef<number | null>(null);

  const leaveWhenReady = useCallback(() => {
    if (!ready.current || !minimumElapsed.current || exitTimer.current !== null) return;
    try { localStorage.setItem(OPENING_SEEN_KEY, "1"); } catch { /* Private mode may block storage. */ }
    setLeaving(true);
    exitTimer.current = window.setTimeout(() => {
      document.documentElement.dataset.openingSeen = "true";
      setVisible(false);
    }, 220);
  }, []);

  const onReady = useCallback(() => {
    ready.current = true;
    leaveWhenReady();
  }, [leaveWhenReady]);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(OPENING_SEEN_KEY) === "1"; } catch { /* Private mode may block storage. */ }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (!seen) {
        try { localStorage.setItem(OPENING_SEEN_KEY, "1"); } catch { /* Private mode may block storage. */ }
      }
      document.documentElement.dataset.openingSeen = "true";
      const skipTimer = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(skipTimer);
    }
    const minimumTimer = window.setTimeout(() => {
      minimumElapsed.current = true;
      leaveWhenReady();
    }, MINIMUM_OPENING_MS);
    const fallbackTimer = window.setTimeout(() => {
      ready.current = true;
      minimumElapsed.current = true;
      leaveWhenReady();
    }, 5000);
    return () => {
      window.clearTimeout(minimumTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [leaveWhenReady]);

  useEffect(() => () => {
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
  }, []);

  return (
    <>
      <SparkyApp onReady={onReady} />
      {visible && <OpeningScene leaving={leaving} />}
    </>
  );
}
