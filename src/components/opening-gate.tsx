"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SparkyApp from "./sparky-app";
import OpeningScene from "./opening-scene";

export default function OpeningGate() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const ready = useRef(false);
  const exitTimer = useRef<number | null>(null);

  const onReady = useCallback(() => {
    if (ready.current) return;
    ready.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      return;
    }
    setLeaving(true);
    exitTimer.current = window.setTimeout(() => setVisible(false), 280);
  }, []);

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
