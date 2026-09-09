// Poll a generation already running in another tab without treating HTTP 202 as failure.
export async function preparePersonalAudio(url: string, signal: AbortSignal) {
  let failures = 0;
  while (true) {
    signal.throwIfAborted();
    const response = await fetch(url, { method: "POST", signal });
    const data = await response.json();
    if (response.ok && data.ready) return;
    if (response.status !== 202 && (response.status !== 503 || ++failures >= 2)) {
      throw new Error(data.error || "A voz ainda não ficou pronta. Você pode continuar pelo texto.");
    }
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(signal.reason); };
      const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, 2000);
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
    });
  }
}
