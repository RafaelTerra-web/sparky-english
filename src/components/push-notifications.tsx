'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, ArrowRight } from 'lucide-react';
import { t } from '@/lib/interface-language';
import type { MascotId } from '@/lib/rewards-shared';
import MascotMoment from './mascot-moment';

type PushState = 'loading' | 'unavailable' | 'install' | 'ready' | 'active' | 'denied';
type WebNavigator = Navigator & { standalone?: boolean };
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

function installed() {
  return matchMedia('(display-mode: standalone)').matches || (navigator as WebNavigator).standalone === true;
}

function applicationServerKey(value: string) {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, '=');
  const bytes = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bytes, character => character.charCodeAt(0));
}

export async function disablePushForCurrentDevice() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) return;
  try { await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }) }); } catch { /* Unsubscribing locally still invalidates the endpoint. */ }
  await subscription.unsubscribe();
}

export default function PushNotifications({ userId, mascot }: { userId: string; mascot: MascotId }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<PushState>('loading');
  const [publicKey, setPublicKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [snoozed, setSnoozed] = useState(true);
  const snoozeKey = `sparky-push:snooze:${userId}`;
  const visible = !snoozed && (state === 'ready' || state === 'install');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const until = Number(localStorage.getItem(snoozeKey));
        if (alive) setSnoozed(Number.isFinite(until) && until > Date.now());
      } catch { if (alive) setSnoozed(false); }
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) { if (alive) setState('unavailable'); return; }
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !installed()) { if (alive) setState('install'); return; }
      try {
        const response = await fetch('/api/push', { cache: 'no-store' });
        const data = await response.json();
        if (!alive) return;
        if (!response.ok || !data.available || typeof data.publicKey !== 'string') { setState('unavailable'); return; }
        setPublicKey(data.publicKey);
        if (Notification.permission === 'denied') { setState('denied'); return; }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!alive) return;
        if (subscription) {
          const saved = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) });
          if (alive) setState(saved.ok ? 'active' : 'ready');
        } else setState('ready');
      } catch { if (alive) setState('unavailable'); }
    };
    void load();
    return () => { alive = false; };
  }, [snoozeKey]);

  useEffect(() => {
    if (!visible || !dialog.current) return;
    const element = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    element.querySelector<HTMLButtonElement>('.primary-button, .text-button')?.focus({ preventScroll: true });
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [visible]);

  function later() {
    try { localStorage.setItem(snoozeKey, String(Date.now() + SNOOZE_MS)); } catch { /* The current visit can still dismiss the card. */ }
    setSnoozed(true);
  }

  async function continueToPermission() {
    setMessage('');
    setBusy(true);
    try {
      // The native request must run directly from this user gesture on iOS.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setState(permission === 'denied' ? 'denied' : 'ready'); later(); return; }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey) });
      const response = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) });
      if (!response.ok) throw Error('save');
      setState('active');
    } catch { setMessage('Não foi possível ativar agora. Tente novamente.'); }
    finally { setBusy(false); }
  }

  if (!visible) return null;
  return <dialog ref={dialog} className="push-intro-dialog" aria-labelledby="push-intro-title" aria-describedby="push-intro-description" onCancel={event => { event.preventDefault(); if (!busy) later(); }}>
    <div className="push-intro-card">
    <div className="push-intro-art"><MascotMoment mascot={mascot} mood="invite" className="push-intro-mascot" /><span className="push-intro-icon" aria-hidden="true"><Bell size={22} /></span></div>
    <div className="push-intro-copy">
      <span className="eyebrow">{t('UM LEMBRETE GENTIL')}</span>
      <h2 id="push-intro-title">{t('Faça do inglês um hábito leve.')}</h2>
      <p id="push-intro-description">{t('Receba um lembrete diário para voltar à sua prática e manter seu ritmo. Você decide se quer receber notificações.')}</p>
      {state === 'install' && <p className="push-intro-hint">{t('No iPhone, adicione o Sparky à Tela de Início e abra pelo ícone para receber notificações.')}</p>}
      {message && <p role="status" className="push-intro-error">{t(message)}</p>}
      <div className="push-intro-actions">
        {state === 'ready' && <button type="button" className="primary-button" disabled={busy} onClick={() => void continueToPermission()}>{t(busy ? 'Preparando…' : 'Continuar')}<ArrowRight size={17} /></button>}
        <button type="button" className="text-button" onClick={later}>{t('Agora não')}</button>
      </div>
    </div>
    </div>
  </dialog>;
}
