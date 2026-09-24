"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ANIMATION_MS = 3000;

export default function OpeningScene({ leaving, onFinished, onReplay }: { leaving: boolean; onFinished: () => void; onReplay: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [take, setTake] = useState(0);
  const [soundNeedsTap, setSoundNeedsTap] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.openingSeen === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      if (videoRef.current) videoRef.current.muted = true;
      setFinished(true);
      onFinished();
    }, ANIMATION_MS);
    if (take === 0) {
      const video = videoRef.current;
      if (video) {
        video.volume = 0.6;
        video.muted = false;
        void video.play().catch(() => {
          video.muted = true;
          setSoundNeedsTap(true);
          void video.play().catch(() => { /* The poster remains visible if video playback is unavailable. */ });
        });
      }
    }
    return () => window.clearTimeout(timer);
  }, [onFinished, take]);

  const replayWithSound = () => {
    const video = videoRef.current;
    if (!video) return;
    onReplay();
    setFinished(false);
    video.pause();
    video.currentTime = 0;
    video.muted = false;
    video.volume = 0.6;
    void video.play().then(() => setSoundNeedsTap(false)).catch(() => setSoundNeedsTap(true));
    setTake((current) => current + 1);
  };

  return (
    <section className={`opening-scene${leaving ? " is-leaving" : ""}`} aria-label="Abrindo o Sparky English" aria-hidden={leaving}>
      <video
        ref={videoRef}
        className="opening-video"
        src="/visuals/intro/sparky-opening.mp4"
        poster="/visuals/intro/sparky-opening-poster.webp"
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        aria-hidden="true"
      />
      {soundNeedsTap && !leaving && !finished && (
        <button className="opening-sound" type="button" onClick={replayWithSound} aria-label="Ativar som da abertura">
          <Volume2 size={20} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
