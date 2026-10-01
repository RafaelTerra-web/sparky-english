"use client";

import { memo, useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { musicVisualTimeline, musicTimelineSectionAt, musicTimelineBeatAt, musicTimelineCueAt } from '@/lib/music-visual-timeline';
import type { MusicEffectsMode } from '@/lib/music-effects';
import {
  drawMusifyScene, musifyProtectedRect, musifySceneDefinition, musifySemanticSuppressed,
  type MusifyProtectedRect,
} from '@/lib/musify-drawing';
import styles from './musify-stage.module.css';

type Props = {
  id: string;
  media: RefObject<HTMLAudioElement | null>;
  readClock?: () => number;
  active: boolean;
  answering: boolean;
  hiddenConcepts: readonly string[];
  mode: MusicEffectsMode;
};

const protectedSelector = [
  '.clip-scorebar', '.clip-lyric-row', '.clip-phrase-translation', '.clip-countdown', '.clip-options button', '.clip-feedback',
  '.clip-time-window', '.clip-album-title', '.clip-media-bottom', '.clip-rank-progress',
  '.clip-setup', '.clip-result', '.clip-round-top', '.clip-answer-receipt',
].join(',');

/** A media-clock canvas; frames never dispatch game state or render React. */
export default memo(function MusifyStage({ id, media, readClock, active, answering, hiddenConcepts, mode }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef({ active, answering, hiddenConcepts, readClock });
  const wake = useRef<(() => void) | null>(null);

  useEffect(() => {
    current.current = { active, answering, hiddenConcepts, readClock };
    wake.current?.();
  }, [active, answering, hiddenConcepts, readClock]);

  useEffect(() => {
    const surface = stage.current;
    const element = canvas.current;
    if (!surface || !element) return;
    let context: CanvasRenderingContext2D | null;
    try { context = element.getContext('2d', { alpha: true }); } catch { context = null; }
    if (!context) { surface.dataset.running = 'false'; return; }
    const ctx = context;
    const host = surface.closest('.clip-game') ?? surface.parentElement;
    const audio = media.current;
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(pointer: coarse), (max-width: 700px)');
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const timeline = musicVisualTimeline(id);
    let width = 0;
    let height = 0;
    let ratio = 1;
    let frame = 0;
    let lastFrame = 0;
    let lastMeasure = 0;
    let lastDiagnostics = 0;
    let visible = true;
    let buffering = false;
    let contextLost = false;
    let destroyed = false;
    let slowFrames = 0;
    let quality: 'normal' | 'low' = 'normal';
    let protectedRects: MusifyProtectedRect[] = [];
    const systemStatic = () => reducedQuery.matches || connection?.saveData === true;
    const resolvedMode = (): MusicEffectsMode => mode === 'off' ? 'off' : systemStatic() ? 'reduced' : mode;
    const readTime = () => {
      const value = current.current.readClock?.() ?? audio?.currentTime ?? 0;
      return Number.isFinite(value) ? Math.max(0, value) : 0;
    };
    const transformationAt = timeline?.sections.filter(section => section.kind === 'chorus').at(-1)?.start;
    const canRun = () => !destroyed && !contextLost && current.current.active && mode !== 'off' && !systemStatic()
      && !document.hidden && visible && !!audio && !audio.paused && !audio.ended
      && !audio.seeking && !buffering && audio.readyState >= 2;

    function measure() {
      const box = surface!.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(box.width));
      const nextHeight = Math.max(1, Math.round(box.height));
      // Keep a large desktop view from allocating an oversized backing store.
      const cap = quality === 'low' ? 1 : mobileQuery.matches ? 1.5 : 2;
      const nextRatio = Math.max(.5, Math.min(window.devicePixelRatio || 1, cap, Math.sqrt(3_000_000 / (nextWidth * nextHeight))));
      if (nextWidth !== width || nextHeight !== height || nextRatio !== ratio) {
        width = nextWidth; height = nextHeight; ratio = nextRatio;
        element!.width = Math.max(1, Math.round(width * ratio));
        element!.height = Math.max(1, Math.round(height * ratio));
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      protectedRects = [];
      host?.querySelectorAll<HTMLElement>(protectedSelector).forEach(item => {
        if (item.closest('.clip-response-slot[aria-hidden="true"],.clip-countdown[aria-hidden="true"],.clip-answer-receipt[aria-hidden="true"],.clip-ambient[data-visible="false"]')) return;
        const protectedRect = musifyProtectedRect(item.getBoundingClientRect(), box, 8);
        if (protectedRect) protectedRects.push(protectedRect);
      });
      surface!.dataset.protectedCount = String(protectedRects.length);
      lastMeasure = performance.now();
    }

    function paint(now: number, diagnostics = false) {
      if (contextLost) return;
      if (!width || !height || now - lastMeasure > 180) measure();
      const time = readTime();
      const section = musicTimelineSectionAt(id, time);
      const reduced = resolvedMode() === 'reduced';
      const cue = reduced || mode === 'off' ? null : musicTimelineCueAt(id, time, current.current.hiddenConcepts);
      const beat = reduced || mode === 'off' ? 0 : musicTimelineBeatAt(id, time);
      try {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        if (mode !== 'off') {
          drawMusifyScene(ctx, {
            id, time, duration: timeline?.duration ?? audio?.duration ?? 0, transformationAt, width, height, beat, section, cue,
            answering: current.current.answering, quality, reduced, static: systemStatic(),
            hiddenConcepts: current.current.hiddenConcepts,
          });
          // Clearing after drawing also protects moving/reflowed text and translated lines.
          for (const rect of protectedRects) ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
        }
      } catch {
        contextLost = true;
        surface!.dataset.running = 'false';
        surface!.dataset.canvas = 'fallback';
        return;
      }
      if (diagnostics || now - lastDiagnostics > 120) {
        surface!.dataset.mode = resolvedMode();
        surface!.dataset.quality = quality;
        surface!.dataset.section = section?.kind ?? 'intro';
        surface!.dataset.cue = cue ?? '';
        surface!.dataset.sceneTime = time.toFixed(3);
        surface!.dataset.beat = beat.toFixed(3);
        surface!.dataset.answering = String(current.current.answering);
        surface!.dataset.semanticSuppressed = String(musifySemanticSuppressed(id, current.current.hiddenConcepts));
        lastDiagnostics = now;
      }
    }

    function tick(now: number) {
      frame = 0;
      if (!canRun()) { surface!.dataset.running = 'false'; return; }
      const interval = quality === 'low' ? 1000 / 24 : mobileQuery.matches ? 1000 / 30 : 1000 / 60;
      if (!lastFrame || now - lastFrame >= interval - .75) {
        const started = performance.now();
        const elapsed = lastFrame ? now - lastFrame : interval;
        paint(now);
        const cost = performance.now() - started;
        slowFrames = cost > 9 || elapsed > interval * 2.6 ? slowFrames + 1 : Math.max(0, slowFrames - .25);
        if (quality === 'normal' && slowFrames >= 18) {
          quality = 'low'; measure(); surface!.dataset.quality = quality;
        }
        lastFrame = now;
      }
      frame = requestAnimationFrame(tick);
    }

    function sync() {
      if (destroyed) return;
      const running = canRun();
      surface!.dataset.running = String(running);
      if (running) {
        if (!frame) { lastFrame = 0; measure(); paint(performance.now(), true); frame = requestAnimationFrame(tick); }
      } else {
        if (frame) cancelAnimationFrame(frame);
        frame = 0; lastFrame = 0; measure(); paint(performance.now(), true);
      }
    }
    const wait = () => { buffering = true; sync(); };
    const play = () => { buffering = false; sync(); };
    const seek = () => { buffering = false; sync(); };
    const resize = () => { measure(); if (!frame) paint(performance.now(), true); };
    const loseContext = () => { contextLost = true; surface.dataset.canvas = 'fallback'; sync(); };
    const restoreContext = () => { contextLost = false; surface.dataset.canvas = 'ready'; sync(); };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(surface);
    const intersection = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting); sync();
    }) : null;
    intersection?.observe(surface);
    audio?.addEventListener('playing', play);
    audio?.addEventListener('waiting', wait);
    audio?.addEventListener('pause', sync);
    audio?.addEventListener('ended', sync);
    audio?.addEventListener('seeking', sync);
    audio?.addEventListener('seeked', seek);
    audio?.addEventListener('loadeddata', play);
    audio?.addEventListener('canplay', play);
    audio?.addEventListener('ratechange', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', resize);
    reducedQuery.addEventListener('change', sync);
    mobileQuery.addEventListener('change', resize);
    connection?.addEventListener('change', sync);
    element.addEventListener('contextlost', loseContext);
    element.addEventListener('contextrestored', restoreContext);
    surface.dataset.canvas = 'ready';
    wake.current = sync;
    sync();
    return () => {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      wake.current = null;
      observer?.disconnect(); intersection?.disconnect();
      audio?.removeEventListener('playing', play);
      audio?.removeEventListener('waiting', wait);
      audio?.removeEventListener('pause', sync);
      audio?.removeEventListener('ended', sync);
      audio?.removeEventListener('seeking', sync);
      audio?.removeEventListener('seeked', seek);
      audio?.removeEventListener('loadeddata', play);
      audio?.removeEventListener('canplay', play);
      audio?.removeEventListener('ratechange', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', resize);
      reducedQuery.removeEventListener('change', sync);
      mobileQuery.removeEventListener('change', resize);
      connection?.removeEventListener('change', sync);
      element.removeEventListener('contextlost', loseContext);
      element.removeEventListener('contextrestored', restoreContext);
    };
  }, [id, media, mode]);

  const identity = musifySceneDefinition(id);
  return <div ref={stage} className={`musify-stage ${styles.stage}`} aria-hidden="true" data-track-id={id} data-scene={identity.scene} data-mode={mode} data-running="false" style={{
    '--musify-scene-accent': identity.accent,
    '--musify-scene-secondary': identity.secondary,
  } as CSSProperties}>
    <div className={styles.ambient} />
    <canvas ref={canvas} className={styles.canvas} />
  </div>;
});
