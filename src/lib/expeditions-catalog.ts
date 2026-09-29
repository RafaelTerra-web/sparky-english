// Historical purchase and session identities only. These are retained so old
// account data and pilot events can be normalized after Expeditions retire.
export type ExpeditionFamily = "A1-A2" | "B1-B2" | "C1-C2";
export type ExpeditionOffer = {
  id: "expedition-suitcase" | "expedition-london" | "case-signal";
  price: number;
  offerVersion: "economy-pilot-v1";
  episodeIds: readonly string[];
};

export const expeditionFamilies: ExpeditionFamily[] = ["A1-A2", "B1-B2", "C1-C2"];
export const expeditionOffers: ExpeditionOffer[] = [
  { id: "expedition-suitcase", price: 180, offerVersion: "economy-pilot-v1", episodeIds: [
    "expedition-suitcase-ep1-v1", "expedition-suitcase-ep2-v1", "expedition-suitcase-ep3-v1",
  ] },
  { id: "expedition-london", price: 180, offerVersion: "economy-pilot-v1", episodeIds: [
    "expedition-london-ep1-v1", "expedition-london-ep2-v1", "expedition-london-ep3-v1",
  ] },
  { id: "case-signal", price: 30, offerVersion: "economy-pilot-v1", episodeIds: ["case-signal-ep1-v1"] },
];

export function getExpeditionOffer(id: string) {
  return expeditionOffers.find(offer => offer.id === id);
}

export function getOfferForEpisode(id: string) {
  return expeditionOffers.find(offer => offer.episodeIds.includes(id));
}
