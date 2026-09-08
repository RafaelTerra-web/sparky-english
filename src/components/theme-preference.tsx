"use client";

import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import {
  defaultAppearance,
  isAppearancePreference,
  type AppearancePreference,
  type ThemeMode,
  type ThemePaletteId,
} from "@/lib/appearance-shared";

type StoredAppearance = AppearancePreference & { pending: boolean; owner?: string };
type SaveStatus = "idle" | "saving" | "saved" | "local";

const storageKey = "sparky-appearance-v1";
const legacyStorageKey = "sparky-color-theme";
const themeEvent = "sparky-theme-change";
const statusEvent = "sparky-theme-status";

const paletteOptions: Array<{
  id: ThemePaletteId;
  name: string;
  description: string;
  swatches: [string, string, string];
}> = [
  { id: "sparky", name: "Sparky", description: "Verde sereno e acolhedor", swatches: ["#0b100e", "#173e36", "#76c7a3"] },
  { id: "beatrice", name: "Beatrice", description: "Roxo profundo com rosa", swatches: ["#0d0b10", "#3c2849", "#f19abb"] },
  { id: "ocean", name: "Oceano", description: "Azul profundo e luminoso", swatches: ["#071116", "#164c63", "#6dc5ea"] },
  { id: "sunset", name: "Pôr do sol", description: "Terracota e rosa quente", swatches: ["#170d0d", "#713a35", "#ff9daf"] },
  { id: "graphite", name: "Grafite", description: "Neutro com detalhes dourados", swatches: ["#0c0f12", "#334657", "#f0bd62"] },
];

const browserColors: Record<ThemePaletteId, Record<"light" | "dark", string>> = {
  sparky: { light: "#f6f3ed", dark: "#0b100e" },
  beatrice: { light: "#f7f3fb", dark: "#0d0b10" },
  ocean: { light: "#eff7fa", dark: "#071116" },
  sunset: { light: "#fff4ef", dark: "#170d0d" },
  graphite: { light: "#f3f4f6", dark: "#0c0f12" },
};

let storedCache: StoredAppearance | null = null;
let saveStatus: SaveStatus = "idle";
let syncPromise: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let activeOwner: string | null = null;
let saveQueue = Promise.resolve();

export function resetAppearanceSession() {
  if (saveTimer) clearTimeout(saveTimer);
  activeOwner = null;
  syncPromise = null;
}

function loadStored(): StoredAppearance {
  if (storedCache) return storedCache;
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (isAppearancePreference(value)) {
      const metadata = value as StoredAppearance;
      storedCache = { ...value, pending: metadata.pending === true, owner: metadata.owner };
      return storedCache;
    }
    const legacy = localStorage.getItem(legacyStorageKey);
    storedCache = {
      palette: "sparky",
      mode: legacy === "light" || legacy === "dark" ? legacy : "system",
      pending: legacy === "light" || legacy === "dark",
    };
    localStorage.setItem(storageKey, JSON.stringify(storedCache));
    localStorage.removeItem(legacyStorageKey);
  } catch {
    storedCache = { ...defaultAppearance, pending: false };
  }
  return storedCache;
}

function resolvedMode(mode: ThemeMode): "light" | "dark" {
  return mode === "dark" || (mode === "system" && typeof window !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches)
    ? "dark"
    : "light";
}

function applyAppearance(preference: AppearancePreference) {
  const mode = resolvedMode(preference.mode);
  document.documentElement.dataset.palette = preference.palette;
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", browserColors[preference.palette][mode]);
}

function announceStatus(next: SaveStatus) {
  saveStatus = next;
  window.dispatchEvent(new Event(statusEvent));
}

function writeStored(preference: AppearancePreference, pending: boolean) {
  storedCache = { palette: preference.palette, mode: preference.mode, pending, owner: activeOwner ?? undefined };
  try {
    localStorage.setItem(storageKey, JSON.stringify(storedCache));
    if (activeOwner) localStorage.setItem(`${storageKey}:${activeOwner}`, JSON.stringify(storedCache));
  } catch { /* In-memory preference remains usable. */ }
  applyAppearance(preference);
  window.dispatchEvent(new Event(themeEvent));
}

function readPreference(): AppearancePreference {
  return loadStored();
}

function subscribePreference(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== storageKey && event.key !== legacyStorageKey) return;
    storedCache = null;
    applyAppearance(loadStored());
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(themeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(themeEvent, onChange);
  };
}

function subscribeStatus(onChange: () => void) {
  window.addEventListener(statusEvent, onChange);
  return () => window.removeEventListener(statusEvent, onChange);
}

function subscribeResolvedMode(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

async function saveToAccount(preference: AppearancePreference) {
  const owner = activeOwner;
  announceStatus("saving");
  try {
    const response = await fetch("/api/appearance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ palette: preference.palette, mode: preference.mode }),
    });
    const result = await response.json();
    if (!response.ok || result.storage !== "account") throw new Error("local");
    const current = loadStored();
    if (activeOwner !== owner) return;
    if (current.palette === preference.palette && current.mode === preference.mode) {
      writeStored(preference, false);
      announceStatus("saved");
    }
  } catch {
    announceStatus("local");
  }
}

function queueAccountSave(preference: AppearancePreference) {
  if (saveTimer) clearTimeout(saveTimer);
  const owner = activeOwner;
  saveTimer = setTimeout(() => { saveQueue = saveQueue.then(async () => { if (activeOwner === owner) await saveToAccount(preference); }); }, 250);
}

function chooseAppearance(preference: AppearancePreference) {
  writeStored(preference, true);
  queueAccountSave(preference);
}

async function syncAccount() {
  const owner = activeOwner;
  const before = loadStored();
  if (before.pending) {
    await saveToAccount(before);
    return;
  }
  try {
    const response = await fetch("/api/appearance", { cache: "no-store" });
    if (!response.ok) throw new Error("local");
    const result = await response.json();
    if (activeOwner !== owner) return;
    const current = loadStored();
    if (current.pending) await saveToAccount(current);
    else if (isAppearancePreference(result.preference)) {
      writeStored(result.preference, false);
      announceStatus("saved");
    } else if (result.storage === "account") await saveToAccount(current);
  } catch {
    announceStatus("local");
  }
}

function useAppearance(userId: string) {
  const preference = useSyncExternalStore(subscribePreference, readPreference, () => defaultAppearance);
  useEffect(() => {
    applyAppearance(preference);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const syncSystem = () => {
      if (loadStored().mode === "system") applyAppearance(loadStored());
    };
    media.addEventListener("change", syncSystem);
    if (activeOwner !== userId) {
      const previous = loadStored();
      activeOwner = userId;
      syncPromise = null;
      if (previous.owner && previous.owner !== userId) {
        let cached;
        try { cached = JSON.parse(localStorage.getItem(`${storageKey}:${userId}`) ?? "null"); } catch { /* Use account preference on connection. */ }
        writeStored(isAppearancePreference(cached) ? cached : defaultAppearance, cached?.pending === true);
      }
    }
    if (!syncPromise) syncPromise = syncAccount();
    const retry = () => { syncPromise = syncAccount(); };
    window.addEventListener("online", retry);
    return () => { media.removeEventListener("change", syncSystem); window.removeEventListener("online", retry); };
  }, [preference, userId]);
  return preference;
}

export function ThemePreferenceControl({ userId }: { userId: string }) {
  const preference = useAppearance(userId);
  const status = useSyncExternalStore(subscribeStatus, () => saveStatus, () => "idle" as const);
  const modes = [
    { id: "system" as const, label: "Aparelho", icon: Monitor },
    { id: "light" as const, label: "Claro", icon: Sun },
    { id: "dark" as const, label: "Escuro", icon: Moon },
  ];
  return (
    <section className="theme-preference" aria-labelledby="appearance-title">
      <div className="theme-preference-heading">
        <span className="theme-preference-icon"><Palette size={18} /></span>
        <div><h3 id="appearance-title">Aparência do aplicativo</h3><p>Escolha uma paleta e como ela responde à iluminação do aparelho.</p></div>
      </div>
      <fieldset className="theme-mode-selector">
        <legend>Modo</legend>
        <div>
          {modes.map((option) => <button key={option.id} type="button" aria-pressed={preference.mode === option.id} onClick={() => chooseAppearance({ ...preference, mode: option.id })}><option.icon size={17} /> {option.label}</button>)}
        </div>
      </fieldset>
      <fieldset className="theme-palette-selector">
        <legend>Paleta</legend>
        <div className="theme-palette-grid">
          {paletteOptions.map((option) => (
            <button key={option.id} type="button" className="theme-palette-card" aria-pressed={preference.palette === option.id} onClick={() => chooseAppearance({ ...preference, palette: option.id })}>
              <span className="theme-swatches" aria-hidden="true">{option.swatches.map((color) => <i key={color} style={{ background: color }} />)}</span>
              <span className="theme-palette-copy"><strong>{option.name}</strong><small>{option.description}</small></span>
              {preference.palette === option.id && <Check size={17} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="theme-save-status" role="status">
        {status === "saving" ? "Salvando na sua conta…" : status === "local" ? "Escolha salva neste aparelho; sincronização pendente." : status === "saved" ? "Aparência sincronizada na sua conta." : "As cinco paletas são gratuitas."}
      </p>
    </section>
  );
}

export function ThemeQuickToggle({ userId }: { userId: string }) {
  const preference = useAppearance(userId);
  const dark = useSyncExternalStore(subscribeResolvedMode, () => document.documentElement.dataset.theme === "dark", () => false);
  return (
    <button type="button" className="theme-quick-toggle" onClick={() => chooseAppearance({ ...preference, mode: resolvedMode(preference.mode) === "dark" ? "light" : "dark" })} aria-label={dark ? "Usar tema claro" : "Usar tema escuro"} title={dark ? "Tema claro" : "Tema escuro"}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
