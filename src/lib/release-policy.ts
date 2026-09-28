export function safeReleaseRefresh() {
  if (typeof document === "undefined" || document.hidden) return false;
  if (document.documentElement.dataset.sparkyBusy || document.documentElement.dataset.sparkyActivity) return false;
  if (document.querySelector("dialog[open]")) return false;
  return !Array.from(document.querySelectorAll("audio,video")).some(element => !(element as HTMLMediaElement).paused);
}
