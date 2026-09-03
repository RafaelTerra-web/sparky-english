"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type GoogleIdentity = {
  initialize: (options: {
    client_id: string;
    nonce: string;
    callback: (value: { credential: string }) => void;
    auto_select: boolean;
  }) => void;
  renderButton: (
    element: HTMLElement,
    options: {
      type: string;
      theme: string;
      size: string;
      text: string;
      shape: string;
      width: number;
      locale: string;
    },
  ) => void;
  disableAutoSelect: () => void;
};
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentity } };
  }
}

export function GoogleLogin() {
  const button = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Carregando a entrada com Google…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    async function prepare() {
      try {
        const response = await fetch("/api/auth/google", {
          cache: "no-store",
          signal: controller.signal,
        });
        const config = await response.json();
        if (!response.ok) throw new Error(config.error);
        const identity = window.google?.accounts?.id;
        if (!identity || !button.current)
          throw new Error(
            "Não foi possível carregar o Google. Tente novamente.",
          );
        identity.initialize({
          client_id: config.clientId,
          nonce: config.nonce,
          auto_select: false,
          callback: async ({ credential }) => {
            setStatus("Validando sua conta…");
            setError("");
            try {
              const result = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential, nonce: config.nonce }),
              });
              const data = await result.json();
              if (!result.ok) throw new Error(data.error);
              window.location.reload();
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Não foi possível entrar. Tente novamente.",
              );
              setStatus("");
            }
          },
        });
        button.current.replaceChildren();
        identity.renderButton(button.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: Math.min(360, button.current.clientWidth || 280),
          locale: "pt-BR",
        });
        setStatus("");
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar o login.",
          );
          setStatus("");
        }
      }
    }
    void prepare();
    return () => controller.abort();
  }, [ready, attempt]);

  return (
    <div className="google-signin">
      <Script
        src="https://accounts.google.com/gsi/client?hl=pt-BR"
        onReady={() => setReady(true)}
        onError={() => {
          setError(
            "O Google não carregou. Verifique sua conexão e atualize a página.",
          );
          setStatus("");
        }}
      />
      <div ref={button} className="google-button" />
      {status && (
        <p role="status" className="login-status">
          {status}
        </p>
      )}
      {error && (
        <div className="login-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setError("");
              if (!ready) window.location.reload();
              else setAttempt((value) => value + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
