"use client";

import { Download, MoreVertical, Share, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPlatform = "checking" | "ios" | "android" | "other";
type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

const subscribeToHydration = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function isStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

function detectPlatform(): { platform: InstallPlatform; safari: boolean } {
  const agent = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return { platform: "ios", safari: /Safari/i.test(agent) && !/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(agent) };
  if (/Android/i.test(agent)) return { platform: "android", safari: false };
  return { platform: "other", safari: false };
}

export function InstallAppPrompt() {
  const hydrated = useSyncExternalStore(subscribeToHydration, clientSnapshot, serverSnapshot);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateDisplayMode = () => { if (isStandalone()) setInstalled(true); };
    const beforeInstall = (event: Event) => {
      if (detectPlatform().platform !== "android") return;
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const appInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", appInstalled);
    window.addEventListener("pageshow", updateDisplayMode);
    displayMode.addEventListener("change", updateDisplayMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", appInstalled);
      window.removeEventListener("pageshow", updateDisplayMode);
      displayMode.removeEventListener("change", updateDisplayMode);
    };
  }, []);

  function dismiss() {
    setDismissed(true);
  }

  async function install() {
    if (!promptEvent || busy) return;
    const current = promptEvent;
    setPromptEvent(null);
    setBusy(true);
    try {
      await current.prompt();
      const choice = await current.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      else setExpanded(true);
    } catch {
      setExpanded(true);
    } finally {
      setBusy(false);
    }
  }

  const detected = hydrated ? detectPlatform() : { platform: "checking" as InstallPlatform, safari: false };
  const platform = detected.platform;
  if (platform === "checking" || platform === "other" || installed || (hydrated && isStandalone()) || dismissed) return null;
  const nativeInstall = platform === "android" && Boolean(promptEvent);
  const title = platform === "ios" ? (/iPhone|iPod/i.test(navigator.userAgent) ? "Instale no iPhone" : "Instale no iPad") : "Instale no Android";

  return (
    <aside className="install-prompt" aria-label="Instalar Sparky English no celular">
      <button className="install-dismiss" onClick={dismiss} aria-label="Fechar convite de instalação"><X size={17} /></button>
      <div className="install-heading">
        <Image src="/icons/sparky-192.png" alt="" width={46} height={46} />
        <div>
          <p className="eyebrow">Sparky no celular</p>
          <h2>{title}</h2>
        </div>
      </div>
      <p>Abra o curso pela Tela de Início, em uma janela própria e sem a barra do navegador.</p>
      {expanded && platform === "ios" && (
        <div className="install-instructions" role="status">
          {!detected.safari && <p className="install-browser-note"><strong>Primeiro:</strong> abra este endereço no Safari.</p>}
          <ol>
            <li><span><Share size={17} /></span><p>Toque em <strong>Compartilhar</strong> no Safari (pode estar dentro de <strong>Mais</strong>).</p></li>
            <li><span>2</span><p>Escolha <strong>Adicionar à Tela de Início</strong>.</p></li>
            <li><span>3</span><p>Se aparecer, ative <strong>Abrir como App da Web</strong> e toque em <strong>Adicionar</strong>.</p></li>
          </ol>
        </div>
      )}
      {expanded && platform === "android" && !nativeInstall && (
        <div className="install-instructions" role="status">
          <ol>
            <li><span><MoreVertical size={17} /></span><p>Abra o menu do navegador.</p></li>
            <li><span>2</span><p>Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</p></li>
            <li><span>3</span><p>Confirme a instalação do <strong>Sparky English</strong>.</p></li>
          </ol>
        </div>
      )}
      <div className="install-actions">
        {nativeInstall || busy ? (
          <button className="primary-button" onClick={install} disabled={busy}>
            <Download size={17} /> {busy ? "Abrindo…" : "Instalar app"}
          </button>
        ) : (
          <button className="secondary-button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
            {expanded ? "Ocultar instruções" : "Ver como instalar"}
          </button>
        )}
      </div>
    </aside>
  );
}
