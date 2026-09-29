export type ExpeditionFamily = "A1-A2" | "B1-B2" | "C1-C2";
export type LocalizedText = { pt: string; en: string };

export type ExpeditionOffer = {
  id: "expedition-suitcase" | "expedition-london" | "case-signal";
  kind: "expedition" | "case";
  title: LocalizedText;
  description: LocalizedText;
  preview: { scene: LocalizedText; prompt: LocalizedText; options: { id: string; text: LocalizedText; consequence: LocalizedText }[] };
  durationMinutes: number;
  characters: LocalizedText[];
  learning: LocalizedText;
  souvenir: LocalizedText;
  price: number;
  offerVersion: "economy-pilot-v1";
  episodeIds: string[];
};

export const expeditionFamilies: ExpeditionFamily[] = ["A1-A2", "B1-B2", "C1-C2"];
export const expeditionOffers: ExpeditionOffer[] = [
  {
    id: "expedition-suitcase", kind: "expedition",
    title: { pt: "O caso da mala trocada", en: "The switched suitcase" },
    description: { pt: "Investigue três pistas, descubra o dono e devolva a mala.", en: "Follow three clues, identify the owner, and return the suitcase." },
    preview: {
      scene: { pt: "Uma mala azul apareceu na esteira. A etiqueta diz Leo, mas há uma câmera dentro.", en: "A blue suitcase appears on the belt. The tag says Leo, but there is a camera inside." },
      prompt: { pt: "Qual pista você seguiria primeiro?", en: "Which clue would you follow first?" },
      options: [
        { id: "tag", text: { pt: "Conversar com Leo", en: "Talk to Leo" }, consequence: { pt: "Ele mostra um bilhete da viagem.", en: "He shows a travel ticket." } },
        { id: "camera", text: { pt: "Examinar a câmera", en: "Inspect the camera" }, consequence: { pt: "Há uma foto recente da estação.", en: "There is a recent photo of the station." } },
      ],
    },
    durationMinutes: 15,
    characters: [{ pt: "Ana, funcionária da estação", en: "Ana, station attendant" }, { pt: "Leo, passageiro", en: "Leo, passenger" }, { pt: "Maya, fotógrafa", en: "Maya, photographer" }],
    learning: { pt: "Pedidos, descrições, posse e inferência", en: "Requests, descriptions, possession, and inference" },
    souvenir: { pt: "Página do passaporte: a mala devolvida", en: "Passport page: the returned suitcase" },
    price: 180, offerVersion: "economy-pilot-v1",
    episodeIds: ["expedition-suitcase-ep1-v1", "expedition-suitcase-ep2-v1", "expedition-suitcase-ep3-v1"],
  },
  {
    id: "expedition-london", kind: "expedition",
    title: { pt: "Uma noite em Londres", en: "One night in London" },
    description: { pt: "Encontre o caminho, contorne um bloqueio e confirme sua reserva.", en: "Find the route, handle a closure, and confirm your booking." },
    preview: {
      scene: { pt: "São 22h40. O mapa aponta para uma ponte fechada e o hotel fica do outro lado.", en: "It is 10:40 p.m. The map points to a closed bridge, and the hotel is across the river." },
      prompt: { pt: "O que você verificaria?", en: "What would you check?" },
      options: [
        { id: "bus", text: { pt: "Perguntar sobre outro ônibus", en: "Ask about another bus" }, consequence: { pt: "Sam indica uma parada próxima.", en: "Sam points to a nearby stop." } },
        { id: "walk", text: { pt: "Procurar outra travessia", en: "Look for another crossing" }, consequence: { pt: "Nora encontra uma ponte aberta.", en: "Nora finds an open bridge." } },
      ],
    },
    durationMinutes: 15,
    characters: [{ pt: "Nora, amiga viajante", en: "Nora, fellow traveler" }, { pt: "Sam, motorista", en: "Sam, driver" }, { pt: "Iris, recepcionista", en: "Iris, receptionist" }],
    learning: { pt: "Direções, condições e linguagem cotidiana", en: "Directions, conditions, and everyday language" },
    souvenir: { pt: "Página do passaporte: a noite em Londres", en: "Passport page: the night in London" },
    price: 180, offerVersion: "economy-pilot-v1",
    episodeIds: ["expedition-london-ep1-v1", "expedition-london-ep2-v1", "expedition-london-ep3-v1"],
  },
  {
    id: "case-signal", kind: "case",
    title: { pt: "O sinal desconhecido", en: "The unknown signal" },
    description: { pt: "Teste uma hipótese e descubra de onde veio o sinal.", en: "Test one hypothesis and discover where the signal came from." },
    preview: {
      scene: { pt: "Pinky ouve três pulsos. Jo encontra três marcas luminosas no painel.", en: "Pinky hears three pulses. Jo sees three lights on the panel." },
      prompt: { pt: "Que pista você examinaria?", en: "Which clue would you examine?" },
      options: [
        { id: "timing", text: { pt: "Medir os intervalos", en: "Measure the intervals" }, consequence: { pt: "Os pulsos têm o mesmo intervalo.", en: "The pulses have the same interval." } },
        { id: "source", text: { pt: "Seguir o cabo", en: "Follow the cable" }, consequence: { pt: "Ele leva a uma antena no telhado.", en: "It leads to a rooftop antenna." } },
      ],
    },
    durationMinutes: 5,
    characters: [{ pt: "Pinky, observadora", en: "Pinky, observer" }, { pt: "Jo, técnica de rádio", en: "Jo, radio technician" }],
    learning: { pt: "Hipóteses, evidências e vocabulário científico", en: "Hypotheses, evidence, and scientific vocabulary" },
    souvenir: { pt: "Registro da descoberta: o sinal decifrado", en: "Discovery record: the decoded signal" },
    price: 30, offerVersion: "economy-pilot-v1",
    episodeIds: ["case-signal-ep1-v1"],
  },
];

export function getExpeditionOffer(id: string) {
  return expeditionOffers.find(offer => offer.id === id);
}

export function getOfferForEpisode(id: string) {
  return expeditionOffers.find(offer => offer.episodeIds.includes(id));
}
