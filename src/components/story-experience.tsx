"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { claimAudioPlayback, releaseAudioPlayback } from "@/lib/audio-playback";
import { getSupportLocale, localizeAttribute, supportT, t } from "@/lib/interface-language";
import { missingPostcardScenes } from "@/lib/story-content";
import { saveStoryProgress, useStoryProgress } from "@/lib/story-progress";
import styles from "./story.module.css";

type Mascot = "sparky" | "pinky";
type AudioState = "idle" | "loading" | "playing" | "error";

export default function StoryExperience({ userId, mascot, onBack }: { userId: string; mascot: Mascot; onBack: () => void }) {
  const [started, setStarted] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const done = useStoryProgress(userId);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const total = missingPostcardScenes.length;

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      releaseAudioPlayback(audioRef.current);
      audioRef.current = null;
    }
  }, []);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      releaseAudioPlayback(audioRef.current);
      audioRef.current = null;
    }
    setAudioState("idle");
  }

  function saveProgress(nextDone: number) {
    saveStoryProgress(userId, nextDone);
  }

  function start() {
    setSceneIndex(done === total ? 0 : done);
    if (done === total) saveProgress(0);
    setSelected(null);
    setChecked(false);
    setShowTranslation(false);
    setStarted(true);
  }

  async function playScene() {
    if (audioState === "loading") return;
    if (audioState === "playing") { stopAudio(); return; }
    stopAudio();
    const sound = new Audio(`/api/story-audio?scene=${sceneIndex}&mascot=${mascot}`);
    audioRef.current = sound;
    sound.preload = "none";
    sound.onended = () => { releaseAudioPlayback(sound); if (audioRef.current === sound) { audioRef.current = null; setAudioState("idle"); } };
    sound.onerror = () => { releaseAudioPlayback(sound); if (audioRef.current === sound) { audioRef.current = null; setAudioState("error"); } };
    claimAudioPlayback(sound);
    setAudioState("loading");
    try {
      await sound.play();
      if (audioRef.current === sound) setAudioState("playing");
    } catch {
      releaseAudioPlayback(sound);
      if (audioRef.current === sound) { audioRef.current = null; setAudioState("error"); }
    }
  }

  function advance() {
    stopAudio();
    const next = sceneIndex + 1;
    saveProgress(Math.max(done, next));
    setSelected(null);
    setChecked(false);
    setShowTranslation(false);
    setSceneIndex(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  const scene = missingPostcardScenes[sceneIndex];
  const correct = checked && selected === scene?.answer;

  return <section className={styles.story} aria-labelledby="story-title">
    <button className={styles.back} onClick={() => { stopAudio(); onBack(); }}>{t("Voltar para Hoje")}</button>
    {!started ? <>
      <header className={styles.heading}>
        <p className="eyebrow">{t("HISTÓRIA INTERATIVA")} · A1–A2</p>
        <h1 id="story-title">{t("O cartão-postal perdido")}</h1>
        <p>{t("Uma pista entre os livros leva Sparky e Pinky até uma porta azul.")}</p>
      </header>
      <div className={styles.trailer}>
        {videoError ? <Image src="/stories/missing-postcard/bookshop.png" alt="Sparky e Pinky descobrem um cartão-postal na livraria" width={1672} height={941} sizes="(max-width: 900px) 100vw, 900px" /> :
          <video controls playsInline preload="none" poster="/stories/missing-postcard/bookshop.png" aria-label={localizeAttribute("Trailer silencioso da história O cartão-postal perdido")} onPlay={event => claimAudioPlayback(event.currentTarget)} onPause={event => releaseAudioPlayback(event.currentTarget)} onEnded={event => releaseAudioPlayback(event.currentTarget)} onError={() => setVideoError(true)}>
            <source src="/stories/missing-postcard/trailer.mp4" type="video/mp4" />
          </video>}
      </div>
      <div className={styles.introActions}>
        <span>{t("4 cenas")} · {t("Cerca de 4 min")}</span>
        <button className="primary-button" onClick={start}>{t(done === total ? "Rever história" : done ? "Continuar história" : "Começar história")}<span aria-hidden="true">→</span></button>
      </div>
    </> : scene ? <>
      <header className={styles.heading}>
        <p className="eyebrow">{t("O cartão-postal perdido")}</p>
        <h1 id="story-title">{t(scene.title)}</h1>
        <p>{t("Cena")} {sceneIndex + 1} {t("de")} {total}</p>
        <progress value={sceneIndex} max={total} aria-label={localizeAttribute(`${sceneIndex} de ${total} cenas concluídas`)} />
      </header>
      <Image className={styles.sceneImage} src={scene.image} alt={scene.imageAlt} width={1672} height={941} sizes="(max-width: 900px) 100vw, 900px" priority={sceneIndex === 0} />
      <div className={styles.sceneBody}>
        <blockquote lang="en">{scene.text}</blockquote>
        <div className={styles.sceneTools}>
          <button className="secondary-button" disabled={audioState === "loading"} onClick={() => void playScene()}>{t(audioState === "loading" ? "Preparando áudio…" : audioState === "playing" ? "Parar áudio" : "Ouvir cena")}</button>
          <button className="text-button" aria-expanded={showTranslation} onClick={() => setShowTranslation(value => !value)}>{t(showTranslation ? "Ocultar tradução" : "Ver tradução")}</button>
        </div>
        {audioState === "error" && <p className={styles.audioError} role="status">{t("Áudio indisponível agora. Continue lendo a cena.")}</p>}
        {showTranslation && <p className={styles.translation} lang="pt-BR">{scene.translation}</p>}
        <fieldset className={styles.question}>
          <legend lang="en">{scene.question}</legend>
          <div className={styles.options}>
            {scene.options.map((option, index) => <button key={option} type="button" lang="en" className={selected === index ? styles.selected : ""} aria-pressed={selected === index} disabled={correct} onClick={() => { setSelected(index); setChecked(false); }}><span aria-hidden="true">{String.fromCharCode(65 + index)}</span>{option}</button>)}
          </div>
        </fieldset>
        {checked && <p role="status" className={correct ? styles.correct : styles.retry}>{correct ? (getSupportLocale() === "en" ? scene.feedbackEn : scene.feedbackPt) : supportT("Ainda não. Volte à frase e tente outra alternativa.")}</p>}
        <div className={styles.sceneActions}>
          {correct ? <button className="primary-button" onClick={advance}>{t(sceneIndex + 1 === total ? "Terminar história" : "Próxima cena")}<span aria-hidden="true">→</span></button> :
            <button className="primary-button" disabled={selected === null} onClick={() => setChecked(true)}>{t("Conferir resposta")}</button>}
        </div>
      </div>
    </> : <>
      <header className={styles.heading}>
        <p className="eyebrow">{t("HISTÓRIA CONCLUÍDA")}</p>
        <h1 id="story-title">{t("A carta voltou para casa")}</h1>
        <p>{t("Você seguiu as pistas e ajudou Nora a recuperar o cartão-postal.")}</p>
      </header>
      <Image className={styles.sceneImage} src="/stories/missing-postcard/blue-door.png" alt="Sparky e Pinky devolvem o cartão-postal a Nora" width={1672} height={941} sizes="(max-width: 900px) 100vw, 900px" />
      <div className={styles.takeaway}><div><strong>{t("Uma frase para levar")}</strong><p lang="en">Excuse me, where is the blue door?</p><span>{supportT("Com licença, onde fica a porta azul?")}</span></div><Image src="/visuals/expressions/pinky-story-invite.png" alt="" width={1280} height={1280} sizes="112px" /></div>
      <div className={styles.endActions}><button className="primary-button" onClick={onBack}>{t("Voltar para Hoje")}</button><button className="secondary-button" onClick={start}>{t("Rever história")}</button></div>
    </>}
  </section>;
}
