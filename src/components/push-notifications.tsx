'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { t } from '@/lib/interface-language';

type PushState = 'loading' | 'unavailable' | 'install' | 'ready' | 'active' | 'denied';
type WebNavigator = Navigator & { standalone?: boolean };

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

export default function PushNotifications() {
  const [state, setState] = useState<PushState>('loading');
  const [publicKey, setPublicKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) { setState('unavailable'); return; }
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !installed()) { setState('install'); return; }
      try {
        const response = await fetch('/api/push', { cache: 'no-store' });
        const data = await response.json();
        if (!alive) return;
        if (!response.ok || !data.available || typeof data.publicKey !== 'string') { setState('unavailable'); return; }
        setPublicKey(data.publicKey);
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (alive) setState(Notification.permission === 'denied' ? 'denied' : subscription ? 'active' : 'ready');
      } catch { if (alive) setState('unavailable'); }
    };
    void load();
    return () => { alive = false; };
  }, []);

  async function enable() {
    setMessage('');
    setBusy(true);
    try {
      // Keep this call directly inside the click handler for iOS user activation.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setState(permission === 'denied' ? 'denied' : 'ready'); return; }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey) });
      const response = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) });
      if (!response.ok) throw Error('save');
      setState('active');
      setMessage('Lembretes ativados neste aparelho.');
    } catch { setMessage('Não foi possível ativar agora. Tente novamente.'); }
    finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setMessage('');
    try { await disablePushForCurrentDevice(); setState('ready'); setMessage('Lembretes desativados neste aparelho.'); }
    catch { setMessage('Não foi possível desativar agora. Tente novamente.'); }
    finally { setBusy(false); }
  }

  return <section className="push-preference" aria-labelledby="push-title">
    <div className="push-preference-heading"><Bell size={20} /><div><h3 id="push-title">{t('Lembretes de estudo')}</h3><p>{t('Um convite diário para praticar inglês. Você pode desligar quando quiser.')}</p></div></div>
    {state === 'loading' && <p role="status">{t('Verificando notificações…')}</p>}
    {state === 'unavailable' && <p>{t('Notificações indisponíveis neste aparelho ou nesta instalação.')}</p>}
    {state === 'install' && <p>{t('No iPhone, adicione o Sparky à Tela de Início, abra o ícone instalado e volte aqui para ativar.')}</p>}
    {state === 'denied' && <p>{t('As notificações estão bloqueadas. Libere o Sparky nos ajustes do aparelho para ativá-las.')}</p>}
    {state === 'ready' && <button type="button" className="secondary-button" disabled={busy} onClick={() => void enable()}><Bell size={16} />{t(busy ? 'Ativando…' : 'Permitir notificações')}</button>}
    {state === 'active' && <button type="button" className="secondary-button" disabled={busy} onClick={() => void disable()}><BellOff size={16} />{t(busy ? 'Desativando…' : 'Desativar notificações')}</button>}
    {message && <p role="status">{t(message)}</p>}
  </section>;
}
