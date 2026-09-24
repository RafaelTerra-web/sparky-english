"use client";
import { useEffect, useRef, useState, type RefObject } from 'react';

/** Silent decoration follows the audio clock; buffering never blocks the game. */
export default function MusicVideo({ source, clock, playing, speed, active, media }: { source: string; clock: number; playing: boolean; speed: number; active: boolean; media: RefObject<HTMLAudioElement | null> }) {
  const video = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(true);
  const [failed, setFailed] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const current = useRef({ clock, playing, speed, active });
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(pointer: coarse), (max-width: 700px)');
    const sync = () => setReduced(query.matches || mobile.matches);
    sync(); query.addEventListener('change', sync); mobile.addEventListener('change', sync);
    return () => { query.removeEventListener('change', sync); mobile.removeEventListener('change', sync); };
  }, []);
  useEffect(() => {
    const audio = media.current;
    const wait = () => { video.current?.pause(); setBuffering(true); };
    const ready = () => setBuffering(false);
    audio?.addEventListener('waiting', wait);
    audio?.addEventListener('seeking', wait);
    audio?.addEventListener('playing', ready);
    audio?.addEventListener('seeked', ready);
    return () => {
      audio?.removeEventListener('waiting', wait); audio?.removeEventListener('seeking', wait);
      audio?.removeEventListener('playing', ready); audio?.removeEventListener('seeked', ready);
    };
  }, [media]);
  useEffect(() => {
    current.current = { clock, playing, speed, active };
    const element = video.current;
    if (!element) return;
    element.playbackRate = speed;
    const visible = active && !reduced && !failed && !document.hidden;
    if (visible && !buffering && !element.seeking && element.readyState >= 1 && Math.abs(element.currentTime - Math.max(0, clock)) > .18) element.currentTime = Math.max(0, Math.min(clock, element.duration || clock));
    if (visible && playing && !buffering) { if (element.paused) void element.play().catch(() => { /* Audio playback stays independent. */ }); }
    else element.pause();
  }, [clock, playing, speed, active, reduced, failed, buffering]);
  useEffect(() => {
    const element = video.current;
    const hide = () => { if (document.hidden) element?.pause(); };
    document.addEventListener('visibilitychange', hide);
    return () => { element?.pause(); document.removeEventListener('visibilitychange', hide); };
  }, [reduced]);
  return <div className="music-video" data-active={active && !reduced && !failed} aria-hidden="true">
    {!reduced && <video ref={video} src={source} muted playsInline preload="metadata" disablePictureInPicture onError={() => setFailed(true)} onLoadedMetadata={event => { event.currentTarget.currentTime = Math.max(0, current.current.clock); }} />}
  </div>;
}
