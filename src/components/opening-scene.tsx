"use client";

import { BookOpen, MessageCircle, Music2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const START = "/visuals/intro/sparky-hesitation.webp";
const FINISH = "/visuals/intro/sparky-invitation.webp";

export default function OpeningScene({ leaving }: { leaving: boolean }) {
  const [phase, setPhase] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const discover = window.setTimeout(() => setPhase(1), 2000);
    const invite = window.setTimeout(() => setPhase(2), 4000);
    return () => {
      window.clearTimeout(discover);
      window.clearTimeout(invite);
    };
  }, []);

  return (
    <section className={`opening-scene${leaving ? " is-leaving" : ""}${ended ? " is-complete" : ""}`} data-phase={phase} aria-hidden={leaving} aria-label="Abrindo o Sparky English">
      <div className="opening-backdrop" aria-hidden="true" />
      <div className="opening-stage" aria-hidden="true">
        <Image className="opening-still opening-start" src={START} alt="" fill priority sizes="(max-width: 720px) 100vw, 65vh" />
        <Image className="opening-still opening-finish" src={FINISH} alt="" fill sizes="(max-width: 720px) 100vw, 65vh" />
        {!videoFailed && (
          <video
            className="opening-video"
            autoPlay
            muted
            playsInline
            preload="auto"
            poster={START}
            onError={() => setVideoFailed(true)}
            onEnded={() => { setPhase(2); setEnded(true); }}
          >
            <source src="/visuals/intro/sparky-first-step.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <div className="opening-content">
        <span className="opening-wordmark">Sparky <span>English</span></span>
        <div className="opening-symbols" aria-hidden="true">
          <span><BookOpen size={22} strokeWidth={1.7} /></span>
          <span><MessageCircle size={22} strokeWidth={1.7} /></span>
          <span><Music2 size={22} strokeWidth={1.7} /></span>
        </div>
        <div className="opening-caption">
          <h1>Toda jornada começa<br />com uma palavra.</h1>
          <p role="status" aria-live="polite">Abrindo seu espaço de estudo…</p>
        </div>
      </div>
    </section>
  );
}
