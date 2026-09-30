"use client";
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { musicVideoNeedsSeek } from '@/lib/music-runtime';

type Props = {
  source: string; clock: number; readClock?: () => number; playing: boolean; speed: number; active: boolean;
  media: RefObject<HTMLAudioElement | null>; prepareRef?: RefObject<(() => Promise<void>) | null>;
};

/** Silent decoration follows the audio clock; buffering never blocks the game. */
export default function MusicVideo({ source, clock, readClock, playing, speed, active, media, prepareRef }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const current = useRef({ clock, readClock, playing, speed, active, reduced, failed, buffering });
  const forceSync = useRef(true);
  const lastSeek = useRef(Number.NEGATIVE_INFINITY);
  const playPending = useRef(false);
  const warming = useRef(false);
  const cancelPreparation = useRef<(() => void) | null>(null);
  const lastPlayAttempt = useRef(Number.NEGATIVE_INFINITY);
  const synchronize = useCallback(() => {
    const element = video.current;
    if (!element || warming.current) return;
    const state = current.current;
    if (element.playbackRate !== state.speed) element.playbackRate = state.speed;
    const visible = state.active && !state.reduced && !state.failed && !document.hidden;
    const now = performance.now();
    const time = state.readClock?.() ?? state.clock;
    if (visible && !state.buffering && !element.seeking && element.readyState >= 1) {
      if (musicVideoNeedsSeek(time, element.currentTime, now, lastSeek.current, forceSync.current)) {
        element.currentTime = Math.max(0, Math.min(time, Number.isFinite(element.duration) ? element.duration : time));
        lastSeek.current = now;
      }
      forceSync.current = false;
    }
    if (visible && state.playing && !state.buffering) {
      if (element.paused && !playPending.current && now - lastPlayAttempt.current >= 1000) {
        playPending.current = true; lastPlayAttempt.current = now;
        void element.play().catch(() => { /* Audio playback stays independent. */ }).finally(() => { playPending.current = false; });
      }
    } else if (!element.paused) element.pause();
  }, []);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const sync = () => setReduced(query.matches || connection?.saveData === true);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    const audio = media.current;
    const wait = () => { forceSync.current = true; video.current?.pause(); setBuffering(true); };
    const ready = () => { forceSync.current = true; lastPlayAttempt.current = Number.NEGATIVE_INFINITY; setBuffering(false); };
    audio?.addEventListener('waiting', wait); audio?.addEventListener('seeking', wait);
    audio?.addEventListener('playing', ready); audio?.addEventListener('seeked', ready);
    return () => {
      audio?.removeEventListener('waiting', wait); audio?.removeEventListener('seeking', wait);
      audio?.removeEventListener('playing', ready); audio?.removeEventListener('seeked', ready);
    };
  }, [media]);
  useEffect(() => {
    if (current.current.active !== active || current.current.playing !== playing || current.current.speed !== speed) {
      forceSync.current = true; lastPlayAttempt.current = Number.NEGATIVE_INFINITY;
    }
    current.current = { clock, readClock, playing, speed, active, reduced, failed, buffering };
    synchronize();
  }, [clock, readClock, playing, speed, active, reduced, failed, buffering, synchronize]);
  useEffect(() => {
    const element = video.current;
    const visibility = () => { forceSync.current = true; lastPlayAttempt.current = Number.NEGATIVE_INFINITY; synchronize(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { element?.pause(); document.removeEventListener('visibilitychange', visibility); };
  }, [reduced, synchronize]);
  useEffect(() => {
    if (!prepareRef) return;
    const prepare = async () => {
      const element = video.current;
      if (!element || reduced || failed) return;
      warming.current = true;
      element.preload = 'auto';
      await new Promise<void>(resolve => {
        let finished = false;
        let frame: number | undefined;
        const finish = () => {
          if (finished) return;
          finished = true; clearTimeout(timer);
          element.removeEventListener('loadeddata', decode); element.removeEventListener('error', finish);
          if (frame !== undefined) element.cancelVideoFrameCallback(frame);
          element.pause(); warming.current = false; forceSync.current = true;
          cancelPreparation.current = null;
          resolve();
        };
        const decode = () => {
          if (element.readyState < 2) return;
          if (!element.requestVideoFrameCallback) { finish(); return; }
          frame = element.requestVideoFrameCallback(finish);
          void element.play().catch(finish);
        };
        // Decoration has a strict preparation budget; its poster remains the fallback.
        const timer = setTimeout(finish, 1500);
        cancelPreparation.current = finish;
        element.addEventListener('loadeddata', decode); element.addEventListener('error', finish, { once: true });
        if (element.readyState >= 2) decode();
        else void element.play().catch(finish);
      });
    };
    prepareRef.current = prepare;
    return () => { cancelPreparation.current?.(); if (prepareRef.current === prepare) prepareRef.current = null; };
  }, [prepareRef, reduced, failed]);
  return <div className="music-video" data-active={active && !reduced && !failed && hasFrame} aria-hidden="true">
    {!reduced && <video ref={video} src={source} muted playsInline preload="metadata" disablePictureInPicture onError={() => setFailed(true)} onLoadedData={() => setHasFrame(true)} onLoadedMetadata={() => { forceSync.current = true; synchronize(); }} onCanPlay={synchronize} />}
  </div>;
}
