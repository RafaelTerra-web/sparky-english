'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { t } from '@/lib/interface-language';
import { safeReleaseRefresh } from '@/lib/release-policy';

type Phase = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'settling';
const threshold = 100;
const slop = 8;
const settleDuration = 260;
const offsetFor = (distance: number) => 104 * (1 - Math.exp(-Math.max(0, distance - slop) / 85)) - 56;

function nestedScroller(target: Element | null) {
  for (let element = target; element && element !== document.body && element !== document.documentElement; element = element.parentElement) {
    if (element.scrollHeight > element.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(element).overflowY)) return true;
  }
  return false;
}

/** Follow touch frames directly; React only changes the gesture's accessible phase. */
export default function NativeRefresh({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const indicator = useRef<HTMLDivElement>(null);
  const refresh = useRef(onRefresh);
  useEffect(() => { refresh.current = onRefresh; }, [onRefresh]);
  useEffect(() => {
    if (!matchMedia('(pointer: coarse)').matches) return;
    let gesture: { id: number; x: number; y: number; claimed: boolean } | null = null;
    let distance = 0;
    let armed = false;
    let busy = false;
    let disposed = false;
    let frame = 0;
    let settleTimer = 0;
    let currentPhase: Phase = 'idle';
    const changePhase = (value: Phase) => {
      if (currentPhase === value) return;
      currentPhase = value;
      // Remove CSS interpolation before the very next touch frame is painted.
      if (indicator.current) indicator.current.dataset.phase = value;
      setPhase(value);
    };
    const paint = (value: number, rotation = Math.min(1, value / threshold) * 270) => {
      const style = indicator.current?.style;
      if (!style) return;
      style.setProperty('--pull-offset', `${offsetFor(value).toFixed(2)}px`);
      style.setProperty('--pull-scale', String(.9 + Math.min(1, value / threshold) * .1));
      style.setProperty('--pull-opacity', String(Math.min(1, Math.max(0, value - slop) / 28)));
      style.setProperty('--pull-rotation', `${rotation}deg`);
    };
    const cancelFrame = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
    const clearOwnership = () => { delete document.documentElement.dataset.sparkyRefreshing; };
    const retract = () => {
      cancelFrame(); gesture = null; armed = false;
      if (currentPhase === 'idle') { distance = 0; clearOwnership(); return; }
      changePhase('settling'); paint(0, Math.min(1, distance / threshold) * 270); distance = 0;
      clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        busy = false; clearOwnership(); changePhase('idle');
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : settleDuration);
    };
    const allowed = () => !document.hidden && window.scrollY <= 1
      && !document.documentElement.dataset.sparkyBusy && !document.documentElement.dataset.sparkyActivity
      && !document.querySelector('dialog[open]');
    const begin = (event: TouchEvent) => {
      if (busy) return;
      if (event.touches.length !== 1) { retract(); return; }
      if (currentPhase !== 'idle') retract();
      const target = event.target instanceof Element ? event.target : null;
      if (!safeReleaseRefresh() || window.scrollY > 1
        || target?.closest('input,textarea,select,[contenteditable]') || nestedScroller(target)) return;
      clearTimeout(settleTimer); clearOwnership();
      changePhase('idle'); distance = 0; armed = false;
      const touch = event.touches[0];
      gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, claimed: false };
    };
    const move = (event: TouchEvent) => {
      if (!gesture || busy) return;
      if (event.touches.length !== 1 || event.touches[0].identifier !== gesture.id || !allowed()) { retract(); return; }
      const touch = event.touches[0];
      const y = touch.clientY - gesture.y;
      const x = Math.abs(touch.clientX - gesture.x);
      if (!gesture.claimed) {
        if (x > slop && x >= y || y < -slop) { retract(); return; }
        if (y <= slop || y < x * 1.25) return;
        gesture.claimed = true;
        document.documentElement.dataset.sparkyRefreshing = 'true';
      }
      if (event.cancelable) event.preventDefault();
      distance = Math.max(0, y);
      // A small release margin stops the ready label flickering near the threshold.
      armed = distance >= threshold || armed && distance >= threshold - 10;
      changePhase(armed ? 'ready' : 'pulling');
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; paint(distance); });
    };
    const end = (event: TouchEvent) => {
      if (!gesture || busy) return;
      if (event.touches.length || !gesture.claimed || !armed || !allowed()) { retract(); return; }
      // Paint the last sample even if touchend arrives before its scheduled frame.
      cancelFrame(); paint(distance); gesture = null; busy = true;
      changePhase('refreshing');
      frame = requestAnimationFrame(() => { frame = 0; paint(threshold); });
      void Promise.allSettled([
        Promise.resolve().then(() => refresh.current()),
        new Promise(resolve => setTimeout(resolve, 350)),
      ]).then(() => { if (!disposed) retract(); });
    };
    const cancel = () => { if (!busy) retract(); };
    const hide = () => { if (document.hidden) cancel(); };
    window.addEventListener('touchstart', begin, { passive: true });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end, { passive: true });
    window.addEventListener('touchcancel', cancel, { passive: true });
    document.addEventListener('visibilitychange', hide);
    return () => {
      disposed = true; cancelFrame(); clearTimeout(settleTimer); clearOwnership();
      window.removeEventListener('touchstart', begin); window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end); window.removeEventListener('touchcancel', cancel);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);
  const visible = phase !== 'idle' && phase !== 'settling';
  return <div ref={indicator} className="native-refresh" data-phase={phase} data-visible={visible} data-refreshing={phase === 'refreshing'}
    role="status" aria-live="polite" aria-hidden={!visible}><span className="native-refresh-icon" aria-hidden="true"><RotateCw size={20}/></span><span>{t(phase === 'refreshing' ? 'Atualizando Sparky…' : phase === 'ready' ? 'Solte para atualizar' : 'Puxe para atualizar')}</span></div>;
}
