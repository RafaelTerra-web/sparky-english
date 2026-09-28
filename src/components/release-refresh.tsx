"use client";
import { useEffect, useRef, useState } from "react";
import { t, useCurrentInterfaceLanguage } from "@/lib/interface-language";
import { safeReleaseRefresh } from "@/lib/release-policy";
import styles from "./release-refresh.module.css";

const releaseId = process.env.NEXT_PUBLIC_SPARKY_RELEASE_ID;
export function ReleaseRefresh() {
  useCurrentInterfaceLanguage();
  const [available, setAvailable] = useState(false);
  const pending = useRef("");
  const reloading = useRef(false);
  async function reload(force = false) {
    if (reloading.current || !safeReleaseRefresh()) return;
    try { if (!force && sessionStorage.getItem("sparky-release-reloaded") === pending.current) return; } catch { /* Storage can be unavailable. */ }
    reloading.current = true;
    try {
      // Navigation remains network-first. Remove caches left by older installations.
      if ("caches" in window) await Promise.all((await caches.keys()).filter(key => key.startsWith("sparky-")).map(key => caches.delete(key)));
      sessionStorage.setItem("sparky-release-reloaded", pending.current);
      window.location.reload();
    } catch { reloading.current = false; window.location.reload(); }
  }
  const reloadRef = useRef(reload);
  useEffect(() => { reloadRef.current = reload; });
  useEffect(() => {
    let disposed = false, checking = false, lastCheck = 0;
    const check = async () => {
      if (disposed || checking || document.hidden || Date.now() - lastCheck < 10000) return;
      checking = true; lastCheck = Date.now();
      try {
        const registration = await navigator.serviceWorker?.getRegistration();
        void registration?.update().catch(() => undefined);
        const response = await fetch("/api/release?fresh=" + Date.now(), { cache: "no-store", signal: AbortSignal.timeout(8000) });
        if (!response.ok) return;
        const data = await response.json() as { version?: string };
        if (!disposed && data.version && releaseId && data.version !== releaseId) {
          pending.current = data.version; setAvailable(true);
          if (sessionStorage.getItem("sparky-release-reloaded") !== data.version) void reloadRef.current();
        }
      } catch { /* Offline sessions keep their checkpoint and current screen. */ }
      finally { checking = false; }
    };
    const resume = () => { if (!document.hidden) { void check(); if (pending.current) void reloadRef.current(); } };
    const onWorker = (event: MessageEvent) => { if (event.data?.type === "SPARKY_RELEASE_READY") { lastCheck = 0; void check(); } };
    const onError = (event: ErrorEvent) => {
      if (/ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/.test(event.message)) { lastCheck = 0; void check(); }
    };
    const observer = new MutationObserver(() => { if (pending.current) void reloadRef.current(); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sparky-busy", "data-sparky-activity"] });
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
  return <aside className={styles.notice} role="status" data-release-update>
    <strong>{t("Nova versão disponível")}</strong>
    <span>{t("A atualização será aplicada ao terminar sua atividade.")}</span>
    <button className={styles.update} type="button" onClick={() => void reload(true)}>{t("Atualizar")}</button>
  </aside>;
}
