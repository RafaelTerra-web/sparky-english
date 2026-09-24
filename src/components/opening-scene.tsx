"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SparkyLoadingMark from "./sparky-loading-mark";

export default function OpeningScene({ leaving }: { leaving: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [soundNeedsTap, setSoundNeedsTap] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.openingSeen === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    void audio.play().catch(() => setSoundNeedsTap(true));
    return () => audio.pause();
  }, []);

  const playSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().then(() => setSoundNeedsTap(false)).catch(() => setSoundNeedsTap(true));
  };

  return (
    <section className={`opening-scene${leaving ? " is-leaving" : ""}`} aria-label="Abrindo o Sparky English" aria-hidden={leaving}>
      <SparkyLoadingMark />
      <audio ref={audioRef} src="/audio/sparky-mark.wav" preload="auto" aria-hidden="true" />
      {soundNeedsTap && !leaving && (
        <button className="opening-sound" type="button" onClick={playSound} aria-label="Ouvir som da abertura">
          <Volume2 size={19} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
