"use client";

import { useSyncExternalStore } from "react";
import { missingPostcardScenes, storyProgressKey } from "./story-content";

function readProgress(userId: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(storyProgressKey(userId)) ?? "null");
    return Number.isInteger(saved?.done)
      ? Math.min(missingPostcardScenes.length, Math.max(0, saved.done))
      : 0;
  } catch { return 0; }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("sparky-story-progress", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sparky-story-progress", callback);
  };
}

export function useStoryProgress(userId: string) {
  return useSyncExternalStore(subscribe, () => readProgress(userId), () => 0);
}

export function saveStoryProgress(userId: string, done: number) {
  try { localStorage.setItem(storyProgressKey(userId), JSON.stringify({ done })); }
  catch { /* The story still works without persistent storage. */ }
  window.dispatchEvent(new Event("sparky-story-progress"));
}
