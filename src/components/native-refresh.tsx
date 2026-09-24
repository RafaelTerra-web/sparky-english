'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { RotateCw } from 'lucide-react';
import { t } from '@/lib/interface-language';

/** Android pull gesture refreshes app data without a browser navigation. */
export default function NativeRefresh({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef<number | null>(null);
  const pullRef = useRef(0);
  const busy = useRef(false);
  const refresh = useRef(onRefresh);
  useEffect(() => { refresh.current = onRefresh; }, [onRefresh]);
  useEffect(() => {
    if (!/Android/i.test(navigator.userAgent) || !matchMedia('(pointer: coarse)').matches) return;
    const begin = (event: TouchEvent) => {
      const target = event.target as Element | null;
      if (busy.current || event.touches.length !== 1 || window.scrollY > 1 || document.querySelector('dialog[open]') || target?.closest('input,textarea,select,[contenteditable="true"]')) { start.current = null; return; }
      start.current = event.touches[0].clientY;
    };
    const move = (event: TouchEvent) => {
      if (start.current === null || event.touches.length !== 1) return;
      const distance = Math.max(0, event.touches[0].clientY - start.current);
      pullRef.current = Math.min(1, distance / 100);
      setPull(pullRef.current);
    };
    const end = () => {
      const armed = pullRef.current >= 1;
      start.current = null; pullRef.current = 0; setPull(0);
      if (!armed || busy.current) return;
      busy.current = true; setRefreshing(true);
      void Promise.all([refresh.current(), new Promise(resolve => setTimeout(resolve, 600))]).catch(() => undefined).finally(() => { busy.current = false; setRefreshing(false); });
    };
    const cancel = () => { start.current = null; pullRef.current = 0; setPull(0); };
    window.addEventListener('touchstart', begin, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end, { passive: true });
    window.addEventListener('touchcancel', cancel, { passive: true });
    return () => { window.removeEventListener('touchstart', begin); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', end); window.removeEventListener('touchcancel', cancel); };
  }, []);
  return <div className="native-refresh" data-visible={pull > 0 || refreshing} data-refreshing={refreshing} style={{ '--pull': pull } as CSSProperties} role="status" aria-live="polite" aria-hidden={!refreshing && pull === 0}><RotateCw size={20} aria-hidden="true" /><span>{t(refreshing ? 'Atualizando Sparky…' : pull >= 1 ? 'Solte para atualizar' : 'Puxe para atualizar')}</span></div>;
}
