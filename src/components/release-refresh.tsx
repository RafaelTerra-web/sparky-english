"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { t, useCurrentInterfaceLanguage } from "@/lib/interface-language";
import { safeReleaseRefresh } from "@/lib/release-policy";
import { useScrollLock } from "@/lib/use-scroll-lock";
import styles from "./release-refresh.module.css";
import { clearObsoleteAppCaches } from '@/lib/offline-cache';

const releaseId = process.env.NEXT_PUBLIC_SPARKY_RELEASE_ID;
const postponeKey = "sparky-release-postponed";
export function ReleaseRefresh() {
  useCurrentInterfaceLanguage();
  const [available, setAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reloadError, setReloadError] = useState(false);
  const [releaseName, setReleaseName] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef("");
  const postponed = useRef({ version: "", until: 0 });
  const reloading = useRef(false);
  const justReloaded = useRef("");
  useScrollLock(available);
  function later() {
    if (reloading.current) return;
    postponed.current = { version: pending.current, until: Date.now() + 30 * 60000 };
    try { sessionStorage.setItem(postponeKey, JSON.stringify(postponed.current)); } catch { /* Applies for this tab even without storage. */ }
    setAvailable(false);
  }
  async function reload() {
    if (reloading.current || document.documentElement.dataset.sparkyBusy || document.documentElement.dataset.sparkyActivity) return;
    reloading.current = true; setUpdating(true); setReloadError(false);
    try {
      const response = await fetch("/api/release?fresh=" + Date.now(), { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok || !(await response.json() as { version?: string }).version) throw new Error("offline");
    } catch {
      reloading.current = false; setUpdating(false); setReloadError(true); return;
    }
    try {
      await clearObsoleteAppCaches();
      sessionStorage.setItem("sparky-release-reloaded", pending.current);
    } catch { /* Network navigation still requests the current release. */ }
    window.location.reload();
  }
  useLayoutEffect(() => {
    if (!available) return;
    const opener = document.activeElement as HTMLElement | null;
    const current = dialog.current;
    current?.showModal();
    current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    return () => { current?.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, [available]);
  useEffect(() => {
    let disposed = false, checking = false, lastCheck = 0, lastVerified = 0;
    try {
      justReloaded.current = sessionStorage.getItem("sparky-release-reloaded") ?? "";
      sessionStorage.removeItem("sparky-release-reloaded");
      const saved = JSON.parse(sessionStorage.getItem(postponeKey) ?? "null");
      if (typeof saved?.version === "string" && Number.isFinite(saved.until)) postponed.current = saved;
    } catch { /* Keep the in-memory choice. */ }
    const present = () => {
      if (!disposed && pending.current && navigator.onLine && Date.now() - lastVerified < 120000 && safeReleaseRefresh() &&
        !(postponed.current.version === pending.current && postponed.current.until > Date.now())) setAvailable(true);
    };
    const check = async () => {
      if (disposed || checking || document.hidden || Date.now() - lastCheck < 10000) return;
      checking = true; lastCheck = Date.now();
      try {
        const registration = await navigator.serviceWorker?.getRegistration();
        void registration?.update().catch(() => undefined);
        const response = await fetch("/api/release?fresh=" + Date.now(), { cache: "no-store", signal: AbortSignal.timeout(8000) });
        if (!response.ok) return;
        const data = await response.json() as { version?: string; name?: string };
        if (!disposed && data.version && releaseId && data.version !== releaseId) {
          setReleaseName(typeof data.name === 'string' ? data.name.slice(0, 60) : '');
          pending.current = data.version; lastVerified = Date.now();
          if (data.version === justReloaded.current) {
            const until = Math.max(postponed.current.version === data.version ? postponed.current.until : 0, Date.now() + 5 * 60000);
            postponed.current = { version: data.version, until };
            try { sessionStorage.setItem(postponeKey, JSON.stringify(postponed.current)); } catch { /* Keep the in-memory cooldown. */ }
            justReloaded.current = "";
          }
          present();
        }
      } catch { /* Offline sessions retain their screen and checkpoint. */ }
      finally { checking = false; }
    };
    const resume = () => { if (!document.hidden) { void check(); present(); } };
    const onWorker = (event: MessageEvent) => { if (event.data?.type === "SPARKY_RELEASE_READY") { lastCheck = 0; void check(); } };
    const onError = (event: ErrorEvent) => {
      if (/ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/.test(event.message)) { lastCheck = 0; void check(); }
    };
    const observer = new MutationObserver(present);
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true,
      attributeFilter: ["open", "data-sparky-busy", "data-sparky-activity", "data-sparky-refreshing"] });
    void check();
    const interval = window.setInterval(resume, 60000);
    window.addEventListener("focus", resume); window.addEventListener("pageshow", resume); window.addEventListener("online", resume);
    window.addEventListener("error", onError); document.addEventListener("visibilitychange", resume);
    navigator.serviceWorker?.addEventListener("message", onWorker);
    return () => {
      disposed = true; observer.disconnect(); window.clearInterval(interval);
      window.removeEventListener("focus", resume); window.removeEventListener("pageshow", resume); window.removeEventListener("online", resume);
      window.removeEventListener("error", onError); document.removeEventListener("visibilitychange", resume);
      navigator.serviceWorker?.removeEventListener("message", onWorker);
    };
  }, []);
  if (!available) return null;
  return <dialog ref={dialog} className={styles.notice} aria-labelledby="release-title" aria-describedby="release-description"
    data-release-update onCancel={event => { event.preventDefault(); later(); }}>
    <div className={styles.content}>
      <span className={styles.icon} aria-hidden="true"><RefreshCw size={28}/></span>
      <h2 id="release-title" tabIndex={-1}>{releaseName ? `${releaseName} · ${t("Nova versão disponível")}` : t("Nova versão disponível")}</h2>
      <p id="release-description">{t("Atualize para continuar com as novidades do Sparky.")}</p>
      {reloadError && <p role="alert">{t("Sem conexão. Tente atualizar novamente quando estiver online.")}</p>}
      <div className={styles.actions}>
        <button className="primary-button" type="button" disabled={updating} onClick={() => void reload()}>{t(updating ? "Atualizando…" : "Atualizar")}</button>
        <button className="secondary-button" type="button" disabled={updating} onClick={later}>{t("Mais tarde")}</button>
      </div>
    </div>
  </dialog>;
}
