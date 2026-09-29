'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellRing, X, RotateCcw, Play, Target, ChevronRight } from 'lucide-react';
import { t, localizeAttribute, getInterfaceLocale } from '@/lib/interface-language';
import { readWorkspace, updateWorkspace } from '@/lib/learning-local';
import { unreadLabel, validNotificationId, type InboxPage, type InboxNotification, type NotificationDestination, type NotificationPreferences } from '@/lib/notifications-shared';
import { PushDeviceSettings } from './push-notifications';
import { useScrollLock } from '@/lib/use-scroll-lock';
import styles from './notification-center.module.css';

async function request(path: string, data?: Record<string,unknown>) {
  const response=await fetch(path,{cache:'no-store',method:data?'PATCH':'GET',headers:data?{'content-type':'application/json'}:undefined,
    body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(12000)});
  const result=await response.json();
  if(!response.ok) throw Error(response.status===409?'preferences-conflict':'notifications-unavailable');
  return result;
}
export function useNotificationCenter(userId: string | undefined, ready: boolean, locale: 'pt' | 'en', onDestination:(destination:NotificationDestination)=>void) {
  const [enabled,setEnabled]=useState(false);
  const [unread,setUnread]=useState(0);
  const [preferences,setPreferences]=useState<NotificationPreferences|null>(null);
  const [dailyActiveMs,setDailyActiveMs]=useState<number|null>(null);
  const [open,setOpen]=useState(false);
  const [items,setItems]=useState<InboxNotification[]>([]);
  const [nextCursor,setNextCursor]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(false);
  const [saving,setSaving]=useState(false);
  const [settingsError,setSettingsError]=useState(false);
  const [clickError,setClickError]=useState('');
  const current=useRef({userId,ready,locale,onDestination,preferences});
  const generation=useRef(0);
  const countRequest=useRef(0);
  const channel=useRef<BroadcastChannel|null>(null);
  useEffect(()=>{current.current={userId,ready,locale,onDestination,preferences};});
  const publish=useCallback(()=>channel.current?.postMessage({type:'changed'}),[]);
  const sync=useCallback(async(importGoal=false)=>{
    const identity=current.current.userId, version=generation.current;
    const ticket=++countRequest.current;
    if(!identity || !current.current.ready) return;
    const page=await request('/api/notifications') as InboxPage;
    if(version!==generation.current) return;
    setEnabled(page.enabled);
    if(!page.enabled) return;
    if(ticket===countRequest.current) setUnread(page.unread);
    setPreferences(page.preferences); setDailyActiveMs(page.dailyActiveMs);
    if(page.preferences.goalMinutes!==null) updateWorkspace(identity,w=>({...w,minutes:page.preferences.goalMinutes!}));
    else if(importGoal) {
      const result=await request('/api/notifications',{action:'import-goal',revision:page.preferences.revision,patch:{goalMinutes:readWorkspace(identity).minutes}});
      if(version!==generation.current) return;
      setPreferences(result.preferences);
      updateWorkspace(identity,w=>({...w,minutes:result.preferences.goalMinutes}));
    }
    return page;
  },[]);
  useEffect(()=>{
    const version=++generation.current;
    let alive=true;
    if(!userId || !ready) return;
    // Identity changes never reuse another account's badge, list or pending request.
    queueMicrotask(()=>{if(alive){setEnabled(false);setUnread(0);setItems([]);setPreferences(null);setDailyActiveMs(null);setOpen(false);}});
    const refresh=()=>{if(!document.hidden) void sync(true).catch(()=>{});};
    const timer=window.setInterval(refresh,60000);
    window.addEventListener('focus',refresh); window.addEventListener('online',refresh);
    document.addEventListener('visibilitychange',refresh);
    if('BroadcastChannel' in window) {
      const bus=new BroadcastChannel(`sparky-notifications:${userId}`);channel.current=bus;
      bus.onmessage=refresh;
    }
    refresh();
    return ()=>{alive=false;generation.current=version+1;window.clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh);channel.current?.close();channel.current=null;};
  },[userId,ready,sync]);
  useEffect(()=>{
    if(!userId || !ready || !preferences || preferences.locale===locale || saving) return;
    const version=generation.current;
    void request('/api/notifications',{action:'preferences',revision:preferences.revision,patch:{locale}}).then(data=>{if(version===generation.current)setPreferences(data.preferences);}).catch(()=>{});
  },[locale,userId,ready,preferences,saving]);
  useEffect(()=>{
    if(!userId || !ready || !enabled) return;
    let last=0;
    const presence=()=>{
      if(document.hidden || Date.now()-last<60000) return;
      last=Date.now();
      const active=Boolean(document.documentElement.dataset.sparkyBusy || document.documentElement.dataset.sparkyActivity);
      void request('/api/notifications',{action:'activity',active}).catch(()=>{});
    };
    const heartbeat=window.setInterval(()=>{if(document.documentElement.dataset.sparkyBusy || document.documentElement.dataset.sparkyActivity) presence();},60000);
    window.addEventListener('pointerdown',presence);window.addEventListener('keydown',presence);
    return ()=>{window.clearInterval(heartbeat);window.removeEventListener('pointerdown',presence);window.removeEventListener('keydown',presence);};
  },[userId,ready,enabled]);
  const launch=useCallback(async(id:string)=>{
    const version=generation.current;
    const ticket=++countRequest.current;
    try {
      const page=await request('/api/notifications?id='+encodeURIComponent(id)) as InboxPage;
      if(version!==generation.current) return false;
      const item=page.items?.[0];
      if(!item) {setClickError('Este lembrete não está mais disponível.');return true;}
      const result=await request('/api/notifications',{action:'read',id:item.id});
      if(version!==generation.current) return false;
      if(ticket===countRequest.current)setUnread(result.unread);publish();setOpen(false);
      current.current.onDestination(item.destination);
      return true;
    } catch {setClickError('Não foi possível abrir o lembrete. Tente pela central.');return false;}
  },[publish]);
  useEffect(()=>{
    // Save the ID before login redirects; no private notification data is saved here.
    const url=new URL(location.href), id=url.searchParams.get('notification');
    if(validNotificationId(id)) {try{sessionStorage.setItem('sparky-pending-notification',id);}catch{}url.searchParams.delete('notification');history.replaceState(history.state,'',url);}
    let attempting=false;
    const attemptPending=()=>{
      if(attempting || !current.current.ready || !current.current.userId) return;
      let pending:string|null=null;
      try{pending=sessionStorage.getItem('sparky-pending-notification');}catch{}
      if(!validNotificationId(pending)) return;
      attempting=true;
      void launch(pending).then(opened=>{
        if(opened) try{if(sessionStorage.getItem('sparky-pending-notification')===pending) sessionStorage.removeItem('sparky-pending-notification');}catch{}
      }).finally(()=>{attempting=false;});
    };
    const receive=(event:MessageEvent)=>{
      if(event.data?.type!=='SPARKY_NOTIFICATION_CLICK' || !validNotificationId(event.data.notificationId)) return;
      event.ports?.[0]?.postMessage({handled:true});
      try{sessionStorage.setItem('sparky-pending-notification',event.data.notificationId);}catch{}
      attemptPending();
    };
    navigator.serviceWorker?.addEventListener('message',receive);
    window.addEventListener('focus',attemptPending);
    window.addEventListener('online',attemptPending);
    if(userId && ready) queueMicrotask(attemptPending);
    return ()=>{navigator.serviceWorker?.removeEventListener('message',receive);window.removeEventListener('focus',attemptPending);window.removeEventListener('online',attemptPending);};
  },[userId,ready,launch]);
  async function show() {
    setOpen(true);setLoading(true);setError(false);setItems([]);setNextCursor(null);
    const version=generation.current;
    const ticket=++countRequest.current;
    try {
      const page=await request('/api/notifications') as InboxPage;
      if(version!==generation.current) return;
      if(!page.enabled) {setEnabled(false);setOpen(false);return;}
      // Mark the full opening snapshot, including unloaded pages, once.
      const read=await request('/api/notifications',{action:'open',snapshot:page.snapshot});
      if(version!==generation.current) return;
      setItems(page.items.map(item=>({...item,readAt:item.readAt ?? new Date().toISOString()})));
      if(ticket===countRequest.current)setUnread(read.unread);setPreferences(page.preferences);setNextCursor(page.nextCursor);publish();
    } catch {if(version===generation.current) setError(true);}
    finally {if(version===generation.current)setLoading(false);}
  }
  async function previous() {
    if(!nextCursor || loading) return;
    const version=generation.current,ticket=++countRequest.current;setLoading(true);setError(false);
    try {
      const page=await request('/api/notifications?cursor='+encodeURIComponent(nextCursor)) as InboxPage;
      if(version!==generation.current) return;
      setItems(old=>[...old,...page.items.filter(item=>!old.some(x=>x.id===item.id))]);setNextCursor(page.nextCursor);if(ticket===countRequest.current)setUnread(page.unread);
    } catch {if(version===generation.current)setError(true);}
    finally {if(version===generation.current)setLoading(false);}
  }
  async function changePreferences(patch:Record<string,unknown>) {
    if(saving || !preferences) return false;
    const version=generation.current;
    setSaving(true);setSettingsError(false);
    try {
      const result=await request('/api/notifications',{action:'preferences',revision:preferences.revision,patch});
      if(version!==generation.current) return false;
      setPreferences(result.preferences);
      if(userId && result.preferences.goalMinutes!==null) updateWorkspace(userId,w=>({...w,minutes:result.preferences.goalMinutes}));
      publish();return true;
    } catch {if(version===generation.current){setSettingsError(true);void sync().catch(()=>{});}return false;}
    finally {if(version===generation.current)setSaving(false);}
  }
  return {enabled,unread,preferences,dailyActiveMs,open,items,nextCursor,loading,error,saving,settingsError,clickError,
    show,previous,launch,changePreferences,close:()=>setOpen(false),refresh:()=>sync(true),dismissClickError:()=>setClickError('')};
}
type Center=ReturnType<typeof useNotificationCenter>;
export function NotificationBell({center}:{center:Center}) {
  if(!center.enabled) return null;
  return <button type="button" className={`account-chip ${styles.bell}`} data-pending={center.unread>0} onClick={()=>void center.show()}
    aria-label={localizeAttribute('Notificações')+ (center.unread>0 ? `: ${center.unread} ${localizeAttribute('não lidas')}` : `: ${localizeAttribute('nenhuma pendente')}`)} aria-haspopup="dialog">
    {center.unread>0 ? <BellRing size={20} aria-hidden="true"/> : <Bell size={20} aria-hidden="true"/>}
    {center.unread>0 && <span className={styles.badge} aria-hidden="true">{unreadLabel(center.unread)}</span>}
  </button>;
}
const kindIcon={review:RotateCcw,resume:Play,'daily-goal':Target};
export function NotificationPanel({center,locale}:{center:Center;locale:'pt'|'en'}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useScrollLock(center.open);
  useEffect(()=>{
    if(!center.open || !dialog.current) return;
    const element=dialog.current, opener=document.activeElement as HTMLElement|null;
    element.showModal();element.querySelector<HTMLButtonElement>('button')?.focus();
    return ()=>{element.close();if(opener?.isConnected) opener.focus({preventScroll:true});};
  },[center.open]);
  if(!center.open) return null;
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="notifications-title" onCancel={e=>{e.preventDefault();center.close();}}>
    <header className={styles.header}><div><h2 id="notifications-title">{t('Notificações')}</h2><p>{t('Seus lembretes dos últimos 30 dias.')}</p></div><button className="icon-button" type="button" onClick={center.close} aria-label={localizeAttribute('Fechar notificações')}><X size={21}/></button></header>
    <div className={styles.list} aria-busy={center.loading}>
      {center.items.map((item,index)=>{
        const date=new Intl.DateTimeFormat(getInterfaceLocale(),{day:'numeric',month:'long',timeZone:'America/Sao_Paulo'}).format(new Date(item.createdAt));
        const previous=center.items[index-1];
        const heading=!previous || date!==new Intl.DateTimeFormat(getInterfaceLocale(),{day:'numeric',month:'long',timeZone:'America/Sao_Paulo'}).format(new Date(previous.createdAt));
        const Icon=kindIcon[item.kind],copy=item.content[locale];
        return <div key={item.id}>{heading&&<h3 className={styles.date}>{date}</h3>}<article className={styles.item}>
          <span className={styles.type} aria-hidden="true"><Icon size={19}/></span><div><h4>{copy.title}</h4><p>{copy.body}</p><time dateTime={item.createdAt}>{new Intl.DateTimeFormat(getInterfaceLocale(),{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date(item.createdAt))}</time><button className={styles.action} type="button" onClick={()=>void center.launch(item.id)}>{copy.action}<ChevronRight size={16}/></button></div>
        </article></div>;
      })}
      {center.loading&&<p className={styles.state} role="status">{t('Carregando…')}</p>}
      {center.error&&<div className={styles.state} role="alert"><p>{t('Não foi possível carregar os avisos.')}</p><button className="secondary-button" onClick={()=>void(center.items.length?center.previous():center.show())}>{t('Tentar novamente')}</button></div>}
      {!center.loading&&!center.error&&!center.items.length&&<div className={styles.state}><Bell size={32} aria-hidden="true"/><h3>{t('Tudo em dia por aqui.')}</h3><p>{t('Seus próximos lembretes aparecerão aqui.')}</p></div>}
      {center.nextCursor&&!center.loading&&!center.error&&<button className={`text-button ${styles.older}`} onClick={()=>void center.previous()}>{t('Ver anteriores')}</button>}
    </div>
  </dialog>;
}
export function NotificationSettings({center}:{center:Center}) {
  if(!center.enabled) return null;
  return <section className="settings-card" aria-labelledby="settings-notifications-title"><header className="settings-card-heading"><Bell size={22}/><div><h2 id="settings-notifications-title">{t('Notificações e lembretes')}</h2><p>{t('Você escolhe os lembretes que recebe.')}</p></div></header>
    {!center.preferences ? <><p role="status">{t('Não foi possível carregar as preferências.')}</p><button className="text-button" onClick={()=>void center.refresh()}>{t('Tentar novamente')}</button></> : <>
      {([{key:'review',label:'Revisões disponíveis',hint:'Trilha e Expedições · por volta de 12h'}, {key:'resume',label:'Retomar uma lição',hint:'Práticas interrompidas · por volta de 16h'}, {key:'dailyGoal',label:'Meta diária',hint:'Um lembrete leve · por volta de 19h'}] as const).map(item=><label className="settings-switch" key={item.key}><span><strong>{t(item.label)}</strong><small>{t(item.hint)}</small></span><input type="checkbox" role="switch" checked={center.preferences![item.key]} disabled={center.saving} onChange={e=>void center.changePreferences({[item.key]:e.target.checked})}/><span className="settings-switch-track" aria-hidden="true"/></label>)}
      <p className="settings-caption">{t('Horários de Brasília. A central funciona mesmo sem push no aparelho.')}</p>
      <PushDeviceSettings pushEnabled={center.preferences.pushEnabled} saving={center.saving} onEnable={()=>center.changePreferences({pushEnabled:true})} onDisable={()=>center.changePreferences({pushEnabled:false})}/>
      <button className="text-button" disabled={center.saving} onClick={()=>void center.changePreferences({pushEnabled:false,review:false,resume:false,dailyGoal:false})}>{t('Desativar todos')}</button>
    </>}
    {center.settingsError&&<p role="alert">{t('Não foi possível salvar. Tente novamente.')}</p>}
  </section>;
}
export function NotificationDestinationPrompt({restart,onOpen,onClose}:{restart:boolean;onOpen:()=>void;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useScrollLock();
  useEffect(()=>{const element=dialog.current; element?.showModal();return()=>{element?.close();};},[]);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="notification-destination-title" onCancel={e=>{e.preventDefault();onClose();}}><div className={styles.prompt}><Bell size={30}/><h2 id="notification-destination-title">{t(restart?'Recomeçar esta lição?':'Abrir seu lembrete?')}</h2><p>{t(restart?'Esta prática não está salva neste aparelho ou expirou. Você pode recomeçar a mesma lição.':'Sua prática foi preservada. Continue a partir deste lembrete quando quiser.')}</p><button className="primary-button" onClick={onOpen}>{t(restart?'Recomeçar lição':'Abrir lembrete')}</button><button className="text-button" onClick={onClose}>{t('Mais tarde')}</button></div></dialog>;
}
