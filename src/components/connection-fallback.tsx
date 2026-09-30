'use client';

import { useSyncExternalStore } from 'react';
import Image from 'next/image';
import { t, useCurrentInterfaceLanguage, useSupportLanguage } from '@/lib/interface-language';
import styles from './connection-fallback.module.css';

export function ConnectionFallback({ onRetry }: { onRetry: () => void }) {
  const currentUI = useCurrentInterfaceLanguage(), currentSupport = useSupportLanguage();
  const locale = useSyncExternalStore(subscribe, () => publicLanguage('sparky-interface-language', currentUI), () => currentUI);
  const supportLocale = useSyncExternalStore(subscribe, () => publicLanguage('sparky-support-language', currentSupport), () => currentSupport);
  const text = (portuguese: string, english: string) => locale === 'en' ? english : portuguese;
  return <main className={styles.page} lang={locale}>
    <div className={styles.card}>
      <Image unoptimized src="/visuals/musify-offline.webp" width={320} height={320} priority alt={text('Sparky conectando um cabo ao roteador', 'Sparky connecting a cable to the router')} />
      <div>
        <span className={styles.brand}>Sparky English</span>
        <h1>{text('Uma pausa na conexão.', 'A pause in the connection.')}</h1>
        <p>{text('O Sparky não conseguiu se conectar agora. Você pode praticar com o conteúdo salvo neste aparelho enquanto espera.', 'Sparky could not connect right now. You can practice with the content saved on this device while you wait.')}</p>
        <div className={styles.actions}>
          <button type="button" onClick={onRetry}>{text('Tentar novamente', 'Try again')}</button>
          <a href="/offline.html#practice">{text('Praticar offline', 'Practice offline')} <span aria-hidden="true">→</span></a>
        </div>
        <p className={styles.note} lang={supportLocale}>{supportLocale === 'en' ? 'To resume your learning path and rewards, we need to validate your account online.' : 'Para retomar sua trilha e as recompensas, precisamos validar sua conta com conexão.'}</p>
      </div>
    </div>
  </main>;
}

function publicLanguage(key: string, fallback: 'pt-BR' | 'en') {
  try { const saved = localStorage.getItem(key); return saved === 'en' || saved === 'pt-BR' ? saved : fallback; }
  catch { return fallback; }
}

function subscribe(listener: () => void) {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  window.addEventListener('storage', listener);
  return () => { window.removeEventListener('online', listener); window.removeEventListener('offline', listener); window.removeEventListener('storage', listener); };
}

export function ConnectionNotice() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return <aside className={styles.notice} role="status">
    <div><strong>{t('Sem conexão no momento.')}</strong><p>{t('Sua lição continua aqui. Reconecte-se para verificar respostas e salvar conclusões.')}</p></div>
    <a href="/offline.html#practice" target="_blank" rel="noopener noreferrer">{t('Abrir prática offline')} <span aria-hidden="true">↗</span></a>
  </aside>;
}
