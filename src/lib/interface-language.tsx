"use client";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { learningLanguageModes, type InterfaceLocale, type SupportLocale, type LearningLanguageMode } from "./language-policy";
export { targetText } from "./language-policy";
export type { InterfaceLocale, SupportLocale, TargetLanguage } from "./language-policy";

let locale: InterfaceLocale = "pt-BR";
let supportLocale: SupportLocale = "pt-BR";
let revision = 0;
let requestRevision = 0;
let dictionary: Record<string, string> = {};
let loadingDictionary: Promise<void> | undefined;
const listeners = new Set<() => void>();
const cache = new Map<string, string>();
let templates: { pattern: RegExp; target: string }[] = [];
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const escape = (text: string) => text.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
async function loadDictionary() {
  loadingDictionary ??= (async () => {
    const response = await fetch("/locales/en.json");
    if (!response.ok) throw new Error("Não foi possível carregar o inglês. Tente novamente.");
    dictionary = await response.json();
    templates = Object.entries(dictionary)
      .filter(([key]) => /\{\d+\}/.test(key) && key.replace(/\{\d+\}/g, "").trim().length > 3)
      .sort(([a], [b]) => b.replace(/\{\d+\}/g, "").length - a.replace(/\{\d+\}/g, "").length)
      .map(([key, target]) => ({ pattern: new RegExp("^" + key.split(/\{\d+\}/).map(escape).join("(.+?)") + "$"), target }));
  })().catch(error => { loadingDictionary = undefined; throw error; });
  await loadingDictionary;
}
export function translate(text: string, language: InterfaceLocale = locale): string {
  if (language !== "en") return text;
  const normalized = text.replace(/\s+/g, " ").trim();
  const pad = (value: string) => (text.startsWith(" ") ? " " : "") + value + (text.endsWith(" ") ? " " : "");
  const cached = cache.get(normalized); if (cached) return pad(cached);
  let result = dictionary[normalized];
  if (!result) for (const { pattern, target } of templates) {
    const match = pattern.exec(normalized);
    if (match) { result = target.replace(/\{(\d+)\}/g, (_, i) => dictionary[match[Number(i) + 1]] ?? match[Number(i) + 1]); break; }
  }
  result ??= normalized;
  if (cache.size > 10000) cache.clear();
  cache.set(normalized, result);
  return pad(result);
}
function renderText<T extends ReactNode>(value: T, language: InterfaceLocale): T {
  return (typeof value === "string" ? (value.trim() ? " " + translate(value, language).trim() + " " : value)
    : Array.isArray(value) ? value.map(item => renderText(item, language)) : value) as T;
}
export function uiT<T extends ReactNode>(value: T): T { return renderText(value, locale); }
export function supportT<T extends ReactNode>(value: T): T { return renderText(value, supportLocale); }
/** Compatibility alias for interface labels only. Never use on learning stimuli. */
export const t = uiT;
export function localizeAttribute<T extends string | undefined>(value: T): T {
  return (value === undefined ? undefined : translate(value)) as T;
}
export async function setLearningLanguages(next: InterfaceLocale, support: SupportLocale, userId?: string) {
  const request = ++requestRevision;
  if (next === "en" || support === "en") await loadDictionary();
  if (request !== requestRevision) return;
  locale = next; supportLocale = support;
  document.documentElement.lang = next;
  document.documentElement.dataset.supportLanguage = support;
  try {
    localStorage.setItem(userId ? "sparky-language:" + userId : "sparky-interface-language", next);
    localStorage.setItem(userId ? "sparky-support-language:" + userId : "sparky-support-language", support);
    localStorage.setItem("sparky-interface-language", next);
    localStorage.setItem("sparky-support-language", support);
  } catch { /* Preferences remain usable in memory when browser storage is unavailable. */ }
  revision++; listeners.forEach(listener => listener());
}
export const setInterfaceLanguage = (next: InterfaceLocale, userId?: string) => setLearningLanguages(next, supportLocale, userId);
export const setSupportLanguage = (next: SupportLocale, userId?: string) => setLearningLanguages(locale, next, userId);
export const setLearningLanguageMode = (mode: LearningLanguageMode, userId?: string) => {
  const next = learningLanguageModes[mode];
  return setLearningLanguages(next.interfaceLocale, next.supportLocale, userId);
};
export const getInterfaceLocale = () => locale;
export const getSupportLocale = () => supportLocale;
export const useCurrentInterfaceLanguage = () => useSyncExternalStore(subscribe, () => locale, () => "pt-BR" as InterfaceLocale);
export const useSupportLanguage = () => useSyncExternalStore(subscribe, () => supportLocale, () => "pt-BR" as SupportLocale);
export function useInterfaceLanguage(userId?: string) {
  // Both locales invalidate the app tree, including lazily loaded lesson components.
  useSyncExternalStore(subscribe, () => revision, () => 0);
  useEffect(() => {
    let saved: string | null = null, support: string | null = null;
    try {
      saved = localStorage.getItem(userId ? "sparky-language:" + userId : "sparky-interface-language");
      support = localStorage.getItem(userId ? "sparky-support-language:" + userId : "sparky-support-language");
    } catch {}
    void setLearningLanguages(saved === "en" ? "en" : "pt-BR", support === "en" ? "en" : "pt-BR", userId).catch(() => {});
    return () => { requestRevision++; };
  }, [userId]);
  return locale;
}
