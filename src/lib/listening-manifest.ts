import type { ListeningAsset } from "./listening-types";
import assets from "./content/listening-assets.json" with { type: "json" };
/** Entries are added only after a real file is generated and inspected. */
export const listeningManifest: Record<string, ListeningAsset> = assets;
const reviewChecks = ["pronunciation", "naturalness", "cleanAudio", "turns", "coherence"] as const;
export function isApprovedListeningAsset(asset: ListeningAsset | undefined, id: string): asset is ListeningAsset {
  return Boolean(asset && asset.id === id && /^[a-z0-9-]+$/.test(id)
    && asset.path === `/audio/listening/${id}.wav`
    && /^[a-f0-9]{64}$/.test(asset.sha256) && /^[a-f0-9]{64}$/.test(asset.scriptSha256)
    && Number.isFinite(asset.durationSeconds) && asset.durationSeconds >= 75 && asset.durationSeconds <= 240
    && Number.isFinite(Date.parse(asset.generatedAt))
    && asset.model === "gemini-3.1-flash-tts-preview"
    && asset.voices?.sparky === "Achird" && asset.voices?.pinky === "Zephyr"
    && asset.review?.status === "approved" && reviewChecks.every(key => asset.review[key] === true));
}
export function approvedListeningAsset(id: string) {
  const asset = listeningManifest[id];
  return isApprovedListeningAsset(asset, id) ? asset : null;
}
