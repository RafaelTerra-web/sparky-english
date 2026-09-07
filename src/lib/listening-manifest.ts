import type { ListeningAsset } from "./listening-types";
/** Entries are added only after a real file is generated and inspected. */
export const listeningManifest: Record<string, ListeningAsset> = {};
export function approvedListeningAsset(id: string) {
  const asset = listeningManifest[id];
  return asset?.review.status === "approved" && Object.values(asset.review).every(value => value === true || value === "approved") ? asset : null;
}
