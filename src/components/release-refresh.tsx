'use client';

import { useEffect, useRef, useState } from 'react';
import { t, useCurrentInterfaceLanguage } from '@/lib/interface-language';
import styles from './release-refresh.module.css';

function RefreshMark() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 12-2L20 12M4 12l2.4 5a7 7 0 0 0 12-2" /></svg>;
}

function CloseMark() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19" /></svg>;
}

const releaseId = process.env.NEXT_PUBLIC_SPARKY_RELEASE_ID;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const SNOOZE_MS = 30 * 60 * 1000;

export function ReleaseRefresh() {
  useCurrentInterfaceLanguage();
  const [available, setAvailable] = useState(false);
  const snoozedUntil = useRef(0);

  useEffect(() => {
    if (!releaseId) return;
    let disposed = false;
    let checking = false;
    let lastCheck = 0;

    const check = async () => {
      if (disposed || checking || document.hidden || Date.now() - lastCheck < 30_000) return;
      checking = true;
      lastCheck = Date.now();
      try {
        const response = await fetch('/api/release', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
        if (!response.ok) return;
        const data: { version?: unknown } = await response.json();
        if (!disposed && typeof data.version === 'string' && data.version !== releaseId && Date.now() >= snoozedUntil.current) setAvailable(true);
      } catch { /* Keep the current session usable without a connection. */ }
      finally { checking = false; }
    };

    const onVisible = () => { if (!document.hidden) void check(); };
    void check();
    const interval = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  if (!available) return null;
  return <aside className={styles.notice} role="status" aria-live="polite" data-release-update>
    <strong>{t('Nova versão disponível')}</strong>
    <button type="button" className={styles.update} onClick={() => window.location.reload()}><RefreshMark />{t('Atualizar')}</button>
    <button type="button" className={styles.dismiss} onClick={() => { snoozedUntil.current = Date.now() + SNOOZE_MS; setAvailable(false); }} aria-label={t('Agora não') as string} title={t('Agora não') as string}><CloseMark /></button>
  </aside>;
}
