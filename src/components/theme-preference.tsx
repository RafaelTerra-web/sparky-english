"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

export type ThemePreference = "system" | "light" | "dark";
const storageKey = "sparky-color-theme";
const themeEvent = "sparky-theme-change";

function readPreference(): ThemePreference {
  const saved = localStorage.getItem(storageKey);
  return saved === "light" || saved === "dark" ? saved : "system";
}

function subscribePreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(themeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(themeEvent, onChange);
  };
}

function subscribeResolvedTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#101a18" : "#172f36");
}

export function ThemePreferenceControl() {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribePreference,
    readPreference,
    () => "system" as const,
  );
  useEffect(() => {
    applyTheme(preference);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => preference === "system" && applyTheme("system");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [preference]);
  function choose(next: ThemePreference) {
    if (next === "system") localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, next);
    applyTheme(next);
    window.dispatchEvent(new Event(themeEvent));
  }
  const options = [
    { id: "system" as const, label: "Aparelho", icon: Monitor },
    { id: "light" as const, label: "Claro", icon: Sun },
    { id: "dark" as const, label: "Escuro", icon: Moon },
  ];
  return (
    <fieldset className="theme-preference">
      <legend>Aparência do aplicativo</legend>
      <p>Use o tema do aparelho ou escolha uma aparência fixa neste navegador.</p>
      <div>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={preference === option.id}
            onClick={() => choose(option.id)}
          >
            <option.icon size={17} /> {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ThemeQuickToggle() {
  const dark = useSyncExternalStore(
    subscribeResolvedTheme,
    () => document.documentElement.dataset.theme === "dark",
    () => false,
  );
  function toggle() {
    const next = dark ? "light" : "dark";
    localStorage.setItem(storageKey, next);
    applyTheme(next);
    window.dispatchEvent(new Event(themeEvent));
  }
  return (
    <button
      type="button"
      className="theme-quick-toggle"
      onClick={toggle}
      aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
      title={dark ? "Tema claro" : "Tema escuro"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
