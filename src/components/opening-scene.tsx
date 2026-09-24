"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ANIMATION_MS = 4700;

export default function OpeningScene({ leaving, onFinished, onReplay }: { leaving: boolean; onFinished: () => void; onReplay: () => void }) {
  const [take, setTake] = useState(0);
  const [soundNeedsTap, setSoundNeedsTap] = useState(false);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (document.documentElement.dataset.openingSeen === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => { setFinished(true); onFinished(); }, ANIMATION_MS);
    if (take === 0) {
      const audio = audioRef.current;
      if (audio) {
        audio.volume = 0.65;
        void audio.play().catch(() => setSoundNeedsTap(true));
      }
    }
    return () => window.clearTimeout(timer);
  }, [onFinished, take]);

  const replayWithSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    onReplay();
    setFinished(false);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.65;
    void audio.play().then(() => setSoundNeedsTap(false)).catch(() => setSoundNeedsTap(true));
    setTake((current) => current + 1);
  };

  return (
    <section className={`opening-scene${leaving ? " is-leaving" : ""}`} aria-label="Abrindo o Sparky English" aria-hidden={leaving}>
      <audio ref={audioRef} src="/audio/sparky-opening.m4a" preload="auto" aria-hidden="true" />
      <div className="opening-content" key={take}>
        <span className="opening-brand">SPARKY ENGLISH</span>
        <div className="opening-center">
          <div className="opening-word">
            <span className="opening-letters">hello</span>
            <span className="opening-dot" aria-hidden="true" />
            <span className="opening-underline" aria-hidden="true" />
          </div>
          <span className="opening-translation">olá</span>
        </div>
        <span className="opening-footer">Uma palavra abre caminhos.</span>
      </div>
      {soundNeedsTap && !leaving && !finished && (
        <button className="opening-sound" type="button" onClick={replayWithSound} aria-label="Ativar som e reiniciar a abertura">
          <Volume2 size={16} aria-hidden="true" />
          Ativar som
        </button>
      )}
    </section>
  );
}
