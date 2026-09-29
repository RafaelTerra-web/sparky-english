import { createHash } from "node:crypto";

// Server-owned editorial content. Never import this file into a client component:
// the application and recall keys must only be sent after access checks.

export const EXPEDITION_CONTENT_VERSION = "economy-pilot-v1" as const;
export const expeditionFamilies = ["A1-A2", "B1-B2", "C1-C2"] as const;
export type ExpeditionFamily = (typeof expeditionFamilies)[number];
export type ExpeditionText = Readonly<{ pt: string; en: string }>;

export type ExpeditionChoiceQuestion = Readonly<{
  id: string;
  kind: "choice";
  prompt: ExpeditionText;
  context: ExpeditionText;
  options: readonly { id: string; text: string }[];
  answerId: string;
  feedback: Readonly<{ correct: ExpeditionText; incorrect: ExpeditionText }>;
}>;

export type ExpeditionOrderQuestion = Readonly<{
  id: string;
  kind: "order";
  prompt: ExpeditionText;
  context: ExpeditionText;
  tokens: readonly { id: string; text: string }[];
  answerTokenIds: readonly string[];
  feedback: Readonly<{ correct: ExpeditionText; incorrect: ExpeditionText }>;
}>;

export type ExpeditionWorld = Readonly<{
  id: string;
  kind: "expedition" | "case";
  contentVersion: typeof EXPEDITION_CONTENT_VERSION;
  price: number; // Pilot hypothesis, not a promise of future pricing.
  title: ExpeditionText;
  teaser: ExpeditionText;
  promise: ExpeditionText;
  characters: readonly ExpeditionText[];
  estimatedMinutes: number;
  episodeIds: readonly string[];
  preview: Readonly<{
    scene: ExpeditionText;
    prompt: ExpeditionText;
    options: readonly { id: string; text: ExpeditionText; consequence: ExpeditionText }[];
  }>;
  souvenir: ExpeditionText;
}>;

export type ExpeditionEpisode = Readonly<{
  id: string; // Base episode ID; use with family for a stable variant key.
  offerId: string;
  family: ExpeditionFamily;
  position: number;
  title: ExpeditionText;
  durationMinutes: number;
  problem: ExpeditionText;
  attempt: ExpeditionText;
  newLearning: Readonly<{
    kind: "expression" | "strategy";
    label: string; // The English expression/strategy taught in this episode.
    explanation: ExpeditionText;
    example: string;
  }>;
  decision: Readonly<{
    id: string;
    prompt: ExpeditionText;
    options: readonly { id: string; text: ExpeditionText; consequence: ExpeditionText }[];
  }>;
  application: ExpeditionChoiceQuestion;
  transfer: ExpeditionOrderQuestion;
  reveal: ExpeditionText;
  consequence: ExpeditionText;
  recall: ExpeditionChoiceQuestion; // Free later retrieval, in a third context.
  canDo: Readonly<{
    descriptor: ExpeditionText;
    modality: "recognition-and-structure";
  }>;
}>;

const t = (pt: string, en: string): ExpeditionText => ({ pt, en });

type ChoiceInput = readonly [string, string, string];
function choice(
  id: string,
  prompt: ExpeditionText,
  context: ExpeditionText,
  labels: ChoiceInput,
  answerIndex: 0 | 1 | 2,
  correct: ExpeditionText,
  incorrect: ExpeditionText,
): ExpeditionChoiceQuestion {
  return {
    id,
    kind: "choice",
    prompt,
    context,
    options: labels.map((text, index) => ({ id: `${id}-o${index + 1}`, text })),
    answerId: `${id}-o${answerIndex + 1}`,
    feedback: { correct, incorrect },
  };
}

function order(
  id: string,
  prompt: ExpeditionText,
  context: ExpeditionText,
  answer: readonly string[],
  correct: ExpeditionText,
  incorrect: ExpeditionText,
): ExpeditionOrderQuestion {
  const occurrences = new Map<string, number>();
  const tokens = answer.map(text => {
    const occurrence = occurrences.get(text) ?? 0;
    occurrences.set(text, occurrence + 1);
    // Derive IDs from the token's text and duplicate count, never its answer position.
    const tokenId = createHash("sha256").update(JSON.stringify([id, text, occurrence])).digest("hex").slice(0, 24);
    return { id: tokenId, text };
  });
  const displayed = [...tokens].sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  if (displayed.every((token, index) => token.id === tokens[index].id)) {
    displayed.push(displayed.shift()!);
  }
  return {
    id,
    kind: "order",
    prompt,
    context,
    // Stable display order does not encode the answer sequence.
    tokens: displayed,
    answerTokenIds: tokens.map((token) => token.id),
    feedback: { correct, incorrect },
  };
}

function decision(
  id: string,
  prompt: ExpeditionText,
  first: readonly [ExpeditionText, ExpeditionText],
  second: readonly [ExpeditionText, ExpeditionText],
): ExpeditionEpisode["decision"] {
  return {
    id,
    prompt,
    options: [
      { id: `${id}-route1`, text: first[0], consequence: first[1] },
      { id: `${id}-route2`, text: second[0], consequence: second[1] },
    ],
  };
}

function canDo(pt: string, en: string): ExpeditionEpisode["canDo"] {
  return { descriptor: t(pt, en), modality: "recognition-and-structure" };
}

export const expeditionWorlds: readonly ExpeditionWorld[] = [
  {
    id: "expedition-suitcase",
    kind: "expedition",
    contentVersion: EXPEDITION_CONTENT_VERSION,
    price: 180,
    title: t("O caso da mala trocada", "The switched suitcase"),
    teaser: t("Uma etiqueta combina. O recibo, não.", "The tag matches. The receipt does not."),
    promise: t("Investigue três pistas, descubra o dono e devolva a mala.", "Follow three clues, identify the owner, and return the suitcase."),
    characters: [t("Ana, funcionária da estação", "Ana, station attendant"), t("Leo, passageiro", "Leo, passenger"), t("Maya, fotógrafa", "Maya, photographer")],
    estimatedMinutes: 15,
    episodeIds: ["expedition-suitcase-ep1-v1", "expedition-suitcase-ep2-v1", "expedition-suitcase-ep3-v1"],
    preview: {
      scene: t("Uma mala azul apareceu na esteira. A etiqueta diz Leo, mas há uma câmera dentro.", "A blue suitcase appears on the belt. The tag says Leo, but there is a camera inside."),
      prompt: t("Qual pista você seguiria primeiro?", "Which clue would you follow first?"),
      options: [
        { id: "tag", text: t("Conversar com Leo", "Talk to Leo"), consequence: t("Ele mostra um bilhete da viagem.", "He shows a travel ticket.") },
        { id: "camera", text: t("Examinar a câmera", "Inspect the camera"), consequence: t("Há uma foto recente da estação.", "There is a recent photo of the station.") },
      ],
    },
    souvenir: t("Página do passaporte: a mala devolvida", "Passport page: the returned suitcase"),
  },
  {
    id: "expedition-london",
    kind: "expedition",
    contentVersion: EXPEDITION_CONTENT_VERSION,
    price: 180,
    title: t("Uma noite em Londres", "One night in London"),
    teaser: t("O último ônibus parte. O hotel ainda espera.", "The last bus leaves. The hotel is still waiting."),
    promise: t("Encontre o caminho, contorne um bloqueio e confirme sua reserva.", "Find the route, handle a closure, and confirm your booking."),
    characters: [t("Nora, amiga viajante", "Nora, fellow traveler"), t("Sam, motorista", "Sam, driver"), t("Iris, recepcionista", "Iris, receptionist")],
    estimatedMinutes: 15,
    episodeIds: ["expedition-london-ep1-v1", "expedition-london-ep2-v1", "expedition-london-ep3-v1"],
    preview: {
      scene: t("São 22h40. O mapa aponta para uma ponte fechada e o hotel fica do outro lado.", "It is 10:40 p.m. The map points to a closed bridge, and the hotel is across the river."),
      prompt: t("O que você verificaria?", "What would you check?"),
      options: [
        { id: "bus", text: t("Perguntar sobre outro ônibus", "Ask about another bus"), consequence: t("Sam indica uma parada próxima.", "Sam points to a nearby stop.") },
        { id: "walk", text: t("Procurar outra travessia", "Look for another crossing"), consequence: t("Nora encontra uma ponte aberta.", "Nora finds an open bridge.") },
      ],
    },
    souvenir: t("Página do passaporte: a noite em Londres", "Passport page: the night in London"),
  },
  {
    id: "case-signal",
    kind: "case",
    contentVersion: EXPEDITION_CONTENT_VERSION,
    price: 30,
    title: t("O sinal desconhecido", "The unknown signal"),
    teaser: t("Três pulsos no rádio. Uma origem ainda incerta.", "Three pulses on the radio. The source is still unknown."),
    promise: t("Teste uma hipótese e descubra de onde veio o sinal.", "Test one hypothesis and discover where the signal came from."),
    characters: [t("Pinky, observadora", "Pinky, observer"), t("Jo, técnica de rádio", "Jo, radio technician")],
    estimatedMinutes: 5,
    episodeIds: ["case-signal-ep1-v1"],
    preview: {
      scene: t("Pinky ouve três pulsos. Jo encontra três marcas luminosas no painel.", "Pinky hears three pulses. Jo sees three lights on the panel."),
      prompt: t("Que pista você examinaria?", "Which clue would you examine?"),
      options: [
        { id: "timing", text: t("Medir os intervalos", "Measure the intervals"), consequence: t("Os pulsos têm o mesmo intervalo.", "The pulses have the same interval.") },
        { id: "source", text: t("Seguir o cabo", "Follow the cable"), consequence: t("Ele leva a uma antena no telhado.", "It leads to a rooftop antenna.") },
      ],
    },
    souvenir: t("Registro da descoberta: o sinal decifrado", "Discovery record: the decoded signal"),
  },
];

const suitcaseA1: readonly ExpeditionEpisode[] = [
  {
    id: "expedition-suitcase-ep1-v1", offerId: "expedition-suitcase", family: "A1-A2", position: 1,
    title: t("A fita amarela", "The yellow ribbon"), durationMinutes: 5,
    problem: t("Duas malas azuis chegam juntas. Ana precisa identificar a que tem uma fita amarela.", "Two blue suitcases arrive together. Ana needs to identify the one with a yellow ribbon."),
    attempt: t("A cor azul não basta. Falta dizer o detalhe que diferencia as malas.", "Blue is not enough. You need to name the feature that sets the bags apart."),
    newLearning: { kind: "expression", label: "It has ...", explanation: t("Use “It has” para dizer o que um objeto tem.", "Use “It has” to name a feature an object has."), example: "It has a yellow ribbon." },
    decision: decision("suitcase-ep1-a1-decision", t("Que pista Ana investiga primeiro?", "Which clue does Ana check first?"),
      [t("A fita", "The ribbon"), t("A fita pertence à mala da câmera.", "The ribbon belongs to the camera bag.")],
      [t("A etiqueta", "The tag"), t("A etiqueta mostra o nome Leo.", "The tag shows Leo's name.")]),
    application: choice("suitcase-ep1-a1-app", t("Descreva a mala certa.", "Describe the right suitcase."),
      t("Ela tem uma fita amarela.", "It has a yellow ribbon."),
      ["It is a yellow ribbon.", "It has a yellow ribbon.", "It have a yellow ribbon."], 1,
      t("“It has” apresenta o detalhe da mala.", "“It has” names the bag's feature."),
      t("Use “It has” antes do detalhe.", "Put “It has” before the feature.")),
    transfer: order("suitcase-ep1-a1-transfer", t("Descreva outro objeto.", "Describe another object."),
      t("Um casaco perdido tem um bolso verde.", "A lost coat has a green pocket."),
      ["It", "has", "a", "green", "pocket."],
      t("A mesma estrutura descreve o casaco.", "The same structure describes the coat."),
      t("Comece com “It has”.", "Start with “It has”.")),
    reveal: t("A câmera está na mala com a fita. Leo reconhece a fita, mas não a câmera.", "The camera is in the ribboned bag. Leo recognizes the ribbon, but not the camera."),
    consequence: t("Ana guarda a mala até confirmar a quem pertence a câmera.", "Ana keeps the bag until she can confirm who owns the camera."),
    recall: choice("suitcase-ep1-a1-recall", t("Lembre-se da descrição.", "Recall the description."),
      t("Uma mochila tem um zíper laranja.", "A backpack has an orange zip."),
      ["It is an orange zip.", "It have an orange zip.", "It has an orange zip."], 2,
      t("“It has” também descreve a mochila.", "“It has” also describes the backpack."),
      t("Para dizer o que ela tem, use “It has”.", "To say what it has, use “It has”.")),
    canDo: canDo("Consigo reconhecer e montar uma frase que descreve um detalhe visível.", "I can recognize and arrange a sentence describing a visible feature."),
  },
  {
    id: "expedition-suitcase-ep2-v1", offerId: "expedition-suitcase", family: "A1-A2", position: 2,
    title: t("De quem é?", "Whose is it?"), durationMinutes: 5,
    problem: t("Leo e Maya conhecem a mala. A etiqueta e a câmera apontam para pessoas diferentes.", "Leo and Maya know the bag. The tag and the camera point to different people."),
    attempt: t("Ana não pode entregar a mala só pela etiqueta. Ela precisa perguntar sobre posse.", "Ana cannot hand over the bag based on the tag alone. She needs to ask about ownership."),
    newLearning: { kind: "expression", label: "Whose ... is this?", explanation: t("“Whose” pergunta a quem algo pertence.", "“Whose” asks who owns something."), example: "Whose camera is this?" },
    decision: decision("suitcase-ep2-a1-decision", t("A quem Ana pergunta primeiro?", "Who does Ana ask first?"),
      [t("A Leo", "Leo"), t("Ele mostra o bilhete da viagem.", "He shows his travel ticket.")],
      [t("A Maya", "Maya"), t("Ela mostra uma foto tirada pela câmera.", "She shows a photo taken by the camera.")]),
    application: choice("suitcase-ep2-a1-app", t("Pergunte sobre a câmera.", "Ask about the camera."),
      t("Ana quer saber a quem a câmera pertence.", "Ana wants to know who owns the camera."),
      ["Where camera is this?", "Whose camera is this?", "Who camera is this?"], 1,
      t("“Whose” pergunta sobre posse.", "“Whose” asks about ownership."),
      t("Use “Whose” antes de “camera”.", "Put “Whose” before “camera”.")),
    transfer: order("suitcase-ep2-a1-transfer", t("Pergunte sobre outro item.", "Ask about another item."),
      t("Um guarda-chuva foi deixado no banco.", "An umbrella was left on a bench."),
      ["Whose", "umbrella", "is", "this?"],
      t("A pergunta identifica o dono do guarda-chuva.", "The question asks who owns the umbrella."),
      t("Comece com “Whose umbrella”.", "Start with “Whose umbrella”.")),
    reveal: t("Maya mostra a foto original; Leo diz que só pegou a mala errada na esteira.", "Maya shows the original photo; Leo says he picked up the wrong bag from the belt."),
    consequence: t("Ana devolve a câmera a Maya e procura a mala de Leo.", "Ana returns the camera to Maya and looks for Leo's bag."),
    recall: choice("suitcase-ep2-a1-recall", t("Pergunte sobre posse.", "Ask about ownership."),
      t("Um fone de ouvido está na recepção.", "A pair of headphones is at the desk."),
      ["Whose headphones are these?", "Where headphones are these?", "Who headphones are these?"], 0,
      t("“Whose” identifica o dono.", "“Whose” identifies the owner."),
      t("A palavra para perguntar “de quem” é “Whose”.", "The word for asking who owns it is “Whose”.")),
    canDo: canDo("Consigo reconhecer e montar perguntas simples sobre posse.", "I can recognize and arrange simple ownership questions."),
  },
  {
    id: "expedition-suitcase-ep3-v1", offerId: "expedition-suitcase", family: "A1-A2", position: 3,
    title: t("A ordem das pistas", "The order of clues"), durationMinutes: 5,
    problem: t("A foto mostra Maya na estação antes de Leo chegar. Quem deixou a mala primeiro?", "The photo shows Maya at the station before Leo arrived. Who left the bag first?"),
    attempt: t("Dois acontecimentos são verdadeiros, mas a ordem importa.", "Both events are real, but their order matters."),
    newLearning: { kind: "strategy", label: "First ... Then ...", explanation: t("Use “First” e “Then” para mostrar a sequência.", "Use “First” and “Then” to show a sequence."), example: "First Maya arrived. Then Leo came." },
    decision: decision("suitcase-ep3-a1-decision", t("Como Ana confere a última pista?", "How does Ana check the final clue?"),
      [t("Ver a hora da foto", "Check the photo time"), t("A foto veio antes do bilhete de Leo.", "The photo predates Leo's ticket.")],
      [t("Pedir o relato dos dois", "Ask both passengers"), t("Os relatos confirmam a mesma ordem.", "Their accounts confirm the same order.")]),
    application: choice("suitcase-ep3-a1-app", t("Escolha a sequência correta.", "Choose the correct sequence."),
      t("Maya chegou às 8h. Leo chegou às 9h.", "Maya arrived at 8. Leo arrived at 9."),
      ["First Leo arrived. Then Maya came.", "First Maya arrived. Then Leo came.", "Maya and Leo arrived together."], 1,
      t("Maya veio primeiro; Leo veio depois.", "Maya came first; Leo came later."),
      t("Confira os horários antes de usar “First” e “Then”.", "Check the times before using “First” and “Then”.")),
    transfer: order("suitcase-ep3-a1-transfer", t("Organize outra sequência.", "Arrange another sequence."),
      t("Jo abriu a caixa. Depois, chamou Ana.", "Jo opened the box. Then she called Ana."),
      ["First,", "Jo", "opened", "the", "box.", "Then", "she", "called", "Ana."],
      t("As duas ações aparecem na ordem certa.", "The two actions are in the right order."),
      t("A abertura vem após “First”.", "The opening follows “First”.")),
    reveal: t("Maya deixou a mala ao fotografar. Leo a pegou por engano. A mala de Leo estava na esteira ao lado.", "Maya left the bag while taking a photo. Leo picked it up by mistake. Leo's bag was on the next belt."),
    consequence: t("Ana devolve as duas malas. Maya registra a história no passaporte de descobertas.", "Ana returns both bags. Maya records the story in the discovery passport."),
    recall: choice("suitcase-ep3-a1-recall", t("Recupere a ordem.", "Recall the order."),
      t("Pinky assinou às 10h e saiu às 11h.", "Pinky signed at 10 and left at 11."),
      ["First Pinky left. Then she signed.", "Pinky signed and left at the same time.", "First Pinky signed. Then she left."], 2,
      t("Assinar ocorreu primeiro.", "Signing happened first."),
      t("Compare os horários antes de escolher.", "Compare the times before choosing.")),
    canDo: canDo("Consigo reconhecer e montar uma sequência simples a partir de pistas com horário.", "I can recognize and arrange a simple sequence from timed clues."),
  },
];

const suitcaseB1: readonly ExpeditionEpisode[] = [
  {
    id: "expedition-suitcase-ep1-v1", offerId: "expedition-suitcase", family: "B1-B2", position: 1,
    title: t("Um detalhe verificável", "A verifiable detail"), durationMinutes: 5,
    problem: t("Duas malas iguais foram retiradas da esteira. A etiqueta de uma delas pode ter sido trocada.", "Two identical bags were taken from the belt. One tag may have been switched."),
    attempt: t("Ana precisa pedir um detalhe que o passageiro saiba antes de abrir a mala.", "Ana needs a feature the passenger can name before opening the bag."),
    newLearning: { kind: "expression", label: "Could you describe ...?", explanation: t("Peça uma descrição de modo cortês e específico.", "Ask for a description politely and specifically."), example: "Could you describe the bag's handle?" },
    decision: decision("suitcase-ep1-b1-decision", t("Qual verificação Ana escolhe?", "Which check does Ana choose?"),
      [t("Perguntar pela alça", "Ask about the handle"), t("Leo menciona um remendo sob a alça.", "Leo mentions a repair under the handle.")],
      [t("Perguntar pelo forro", "Ask about the lining"), t("Maya descreve um forro com estrelas.", "Maya describes a lining with stars.")]),
    application: choice("suitcase-ep1-b1-app", t("Faça um pedido específico.", "Make a specific request."),
      t("Ana quer que Maya descreva o forro sem abrir a mala.", "Ana wants Maya to describe the lining without opening the bag."),
      ["Could you describe the lining?", "Could you open the bag for me?", "Could you read the name on the tag?"], 0,
      t("A pergunta pede o detalhe sem revelá-lo.", "The question asks for the detail without revealing it."),
      t("Peça a descrição do forro, não uma ação diferente.", "Ask for a description of the lining, not a different action.")),
    transfer: order("suitcase-ep1-b1-transfer", t("Peça outro detalhe.", "Ask for another feature."),
      t("Uma pessoa perdeu um casaco; o bolso pode identificá-lo.", "Someone lost a coat; the pocket could identify it."),
      ["Could", "you", "describe", "the", "coat's", "pocket?"],
      t("A pergunta pede um detalhe identificável.", "The question asks for an identifying detail."),
      t("Mantenha “Could you describe” no início.", "Keep “Could you describe” at the start.")),
    reveal: t("O forro da mala com a câmera tem estrelas, como Maya descreveu. O remendo está na outra mala.", "The camera bag has the star lining Maya described. The repaired handle is on the other bag."),
    consequence: t("Ana separa as malas sem depender das etiquetas.", "Ana separates the bags without relying on their tags."),
    recall: choice("suitcase-ep1-b1-recall", t("Peça uma descrição verificável.", "Request a verifiable description."),
      t("Jo diz que perdeu uma pasta e Ana precisa identificar o fecho.", "Jo lost a briefcase, and Ana needs to identify its clasp."),
      ["Could you give me your address?", "Could you describe the clasp?", "Could you replace the clasp?"], 1,
      t("O fecho é o detalhe pedido.", "The clasp is the feature requested."),
      t("Peça o detalhe que pode ser conferido na pasta.", "Ask for the feature that can be checked on the briefcase.")),
    canDo: canDo("Consigo escolher e montar pedidos corteses por detalhes de identificação.", "I can select and arrange polite requests for identifying details."),
  },
  {
    id: "expedition-suitcase-ep2-v1", offerId: "expedition-suitcase", family: "B1-B2", position: 2,
    title: t("O número de série", "The serial number"), durationMinutes: 5,
    problem: t("A etiqueta traz Leo, mas o recibo de Maya tem o mesmo número de série da câmera.", "The tag says Leo, but Maya's receipt matches the camera's serial number."),
    attempt: t("Ana deve declarar a posse com base no recibo, sem confundir a etiqueta com a câmera.", "Ana must state ownership from the receipt without confusing the tag and the camera."),
    newLearning: { kind: "expression", label: "belongs to", explanation: t("“Belongs to” liga um objeto ao seu dono.", "“Belongs to” links an object to its owner."), example: "The camera belongs to Maya." },
    decision: decision("suitcase-ep2-b1-decision", t("Que prova Ana consulta primeiro?", "Which evidence does Ana check first?"),
      [t("O recibo", "The receipt"), t("O número da câmera coincide com o recibo.", "The camera number matches the receipt.")],
      [t("A memória de Leo", "Leo's memory"), t("Ele descreve sua própria mala, com outra alça.", "He describes his own bag, with a different handle.")]),
    application: choice("suitcase-ep2-b1-app", t("Indique a posse comprovada.", "State the supported ownership."),
      t("O número de série da câmera coincide com o recibo de Maya, não com o de Leo.", "The camera's serial number matches Maya's receipt, not Leo's."),
      ["The camera belongs to Leo.", "The camera belongs to Maya.", "Maya belongs to the camera."], 1,
      t("O recibo relaciona a câmera a Maya.", "The receipt links the camera to Maya."),
      t("Associe o número de série ao nome no recibo.", "Match the serial number with the name on the receipt.")),
    transfer: order("suitcase-ep2-b1-transfer", t("Indique outra posse.", "State another ownership."),
      t("O recibo de Nora coincide com o número de um pacote.", "Nora's receipt matches a parcel's number."),
      ["The", "parcel", "belongs", "to", "Nora."],
      t("“Belongs to” liga o pacote a Nora.", "“Belongs to” links the parcel to Nora."),
      t("Coloque “belongs to” antes de Nora.", "Put “belongs to” before Nora.")),
    reveal: t("Maya mostra também a foto original da câmera. Leo levou a mala errada por engano.", "Maya also shows the original camera photo. Leo took the wrong bag by mistake."),
    consequence: t("Ana entrega a câmera a Maya e procura a mala de Leo.", "Ana gives Maya the camera and looks for Leo's bag."),
    recall: choice("suitcase-ep2-b1-recall", t("Use o vínculo de posse.", "Use the ownership link."),
      t("O código de um laptop coincide com a nota fiscal de Jo.", "A laptop's code matches Jo's invoice."),
      ["Jo belongs to the laptop.", "The laptop belongs Jo.", "The laptop belongs to Jo."], 2,
      t("“Belongs to” apresenta o dono.", "“Belongs to” introduces the owner."),
      t("A estrutura completa é “belongs to” + pessoa.", "The full structure is “belongs to” + person.")),
    canDo: canDo("Consigo reconhecer e montar afirmações de posse a partir de uma evidência.", "I can recognize and arrange ownership statements from evidence."),
  },
  {
    id: "expedition-suitcase-ep3-v1", offerId: "expedition-suitcase", family: "B1-B2", position: 3,
    title: t("A etiqueta contradiz o recibo", "The tag contradicts the receipt"), durationMinutes: 5,
    problem: t("A etiqueta diz Leo; o recibo e a foto original apontam para Maya.", "The tag says Leo; the receipt and original photo point to Maya."),
    attempt: t("Uma explicação precisa mostrar o contraste entre as pistas, não inventar uma causa.", "An explanation must show the contrast between the clues without inventing a cause."),
    newLearning: { kind: "expression", label: "however", explanation: t("Use “however” para contrastar informações que não concordam.", "Use “however” to contrast facts that do not agree."), example: "The tag names Leo; however, the receipt names Maya." },
    decision: decision("suitcase-ep3-b1-decision", t("Como Ana resolve a divergência?", "How does Ana resolve the conflict?"),
      [t("Conferir os horários", "Check the times"), t("Maya chegou antes de Leo.", "Maya arrived before Leo.")],
      [t("Conferir a outra mala", "Check the other bag"), t("Ela encontra o remendo que Leo descreveu.", "She finds the repair Leo described.")]),
    application: choice("suitcase-ep3-b1-app", t("Mostre o contraste.", "Show the contrast."),
      t("A etiqueta nomeia Leo. O recibo nomeia Maya.", "The tag names Leo. The receipt names Maya."),
      ["The tag names Leo because the receipt names Maya.", "The tag names Leo; however, the receipt names Maya.", "The tag names Leo, so the receipt names Maya."], 1,
      t("“However” marca pistas divergentes.", "“However” marks conflicting clues."),
      t("Não há relação de causa entre a etiqueta e o recibo.", "The tag and receipt have no cause-and-effect relationship.")),
    transfer: order("suitcase-ep3-b1-transfer", t("Relate outra divergência.", "Report another conflict."),
      t("O bilhete diz plataforma 4. O painel diz plataforma 7.", "The ticket says platform 4. The board says platform 7."),
      ["The", "ticket", "says", "four;", "however,", "the", "board", "says", "seven."],
      t("“However” separa as duas informações.", "“However” separates the two pieces of information."),
      t("Coloque “however” depois do primeiro fato.", "Put “however” after the first fact.")),
    reveal: t("A foto registra Maya deixando a mala antes de Leo retirá-la. Foi uma troca acidental.", "The photo shows Maya leaving the bag before Leo picked it up. It was an accidental switch."),
    consequence: t("As duas malas voltam aos donos. Ana registra como conferiu as pistas.", "Both bags return to their owners. Ana records how she checked the clues."),
    recall: choice("suitcase-ep3-b1-recall", t("Marque a divergência.", "Mark the difference."),
      t("O e-mail diz terça; a agenda diz quinta.", "The email says Tuesday; the schedule says Thursday."),
      ["The email says Tuesday; however, the schedule says Thursday.", "The email says Tuesday because the schedule says Thursday.", "The email says Tuesday, so the schedule says Thursday."], 0,
      t("“However” indica o conflito de datas.", "“However” signals the date conflict."),
      t("Os dados diferem; use uma palavra de contraste.", "The details differ; use a contrast word.")),
    canDo: canDo("Consigo reconhecer e montar frases que contrastam duas pistas sem criar causalidade.", "I can recognize and arrange sentences contrasting two clues without implying cause."),
  },
];

const suitcaseC1: readonly ExpeditionEpisode[] = [
  {
    id: "expedition-suitcase-ep1-v1", offerId: "expedition-suitcase", family: "C1-C2", position: 1,
    title: t("Identificação sem pistas dadas", "Identification without leading clues"), durationMinutes: 5,
    problem: t("Dois passageiros reivindicam uma mala idêntica. A etiqueta é visível aos dois.", "Two passengers claim an identical suitcase. Both can see the tag."),
    attempt: t("Uma pergunta que revele a resposta não distingue o dono. Ana pede um detalhe independente.", "A leading question cannot distinguish the owner. Ana asks for an independent detail."),
    newLearning: { kind: "strategy", label: "distinguishing feature", explanation: t("Peça um detalhe distintivo que ainda não foi mostrado.", "Ask for a distinguishing feature that has not already been shown."), example: "Name a distinguishing feature beneath the handle." },
    decision: decision("suitcase-ep1-c1-decision", t("Que detalhe Ana preserva como teste?", "Which detail does Ana keep for verification?"),
      [t("Uma marca sob a alça", "A mark beneath the handle"), t("A marca fica fora de vista até a resposta.", "The mark remains hidden until the answer.")],
      [t("O padrão do forro", "The lining pattern"), t("O forro continua fechado até a resposta.", "The lining stays closed until the answer.")]),
    application: choice("suitcase-ep1-c1-app", t("Escolha a pergunta menos sugestiva.", "Choose the least leading question."),
      t("A etiqueta e a cor já estão visíveis; o forro ainda não foi mostrado.", "The tag and color are visible; the lining has not been shown."),
      ["Is this blue bag with Leo's tag yours?", "Can you name a distinguishing feature inside the bag?", "Does the lining have stars, as I can see?"], 1,
      t("A resposta sobre o interior pode ser verificada sem ser sugerida.", "The interior detail can be verified without being suggested."),
      t("Não ofereça ao passageiro o detalhe que ele deve identificar.", "Do not supply the detail the passenger must identify.")),
    transfer: order("suitcase-ep1-c1-transfer", t("Faça um teste independente.", "Make an independent check."),
      t("Uma pessoa reivindica uma caixa lacrada; a etiqueta está à vista.", "Someone claims a sealed box; its label is visible."),
      ["Which", "distinguishing", "feature", "can", "you", "verify", "without", "seeing", "the", "label?"],
      t("A pergunta evita usar a etiqueta como única prova.", "The question avoids using the label as the only proof."),
      t("Peça um detalhe verificável fora da etiqueta.", "Ask for a verifiable feature beyond the label.")),
    reveal: t("Maya descreve estrelas no forro antes de a mala ser aberta; Leo descreve a marca da outra mala.", "Maya describes stars in the lining before the bag is opened; Leo describes a mark on the other bag."),
    consequence: t("Ana separa as malas com uma verificação que não depende de informação pública.", "Ana separates the bags using a check independent of public information."),
    recall: choice("suitcase-ep1-c1-recall", t("Recupere a estratégia.", "Recall the strategy."),
      t("Duas pessoas conhecem o número impresso em uma pasta; só o dono sabe o que há dentro.", "Two people know a case's printed number; only the owner knows its contents."),
      ["Ask them to repeat the printed number.", "Tell them what is inside and ask for agreement.", "Ask for an unseen distinguishing feature inside."], 2,
      t("Um detalhe não mostrado fornece evidência melhor.", "An unseen feature provides stronger evidence."),
      t("Evite perguntas que entregam a informação.", "Avoid questions that give away the information.")),
    canDo: canDo("Consigo identificar e montar perguntas que buscam um detalhe distintivo sem sugeri-lo.", "I can identify and arrange questions seeking an unseen distinguishing feature without leading the answer."),
  },
  {
    id: "expedition-suitcase-ep2-v1", offerId: "expedition-suitcase", family: "C1-C2", position: 2,
    title: t("Evidência que corrobora", "Corroborating evidence"), durationMinutes: 5,
    problem: t("O recibo de Maya e o número da câmera coincidem. Ainda é preciso conferir a origem da foto.", "Maya's receipt and the camera number match. The photo's origin still needs checking."),
    attempt: t("Ana tem evidência favorável, mas ainda não uma prova absoluta de toda a história.", "Ana has supporting evidence, but not absolute proof of the entire account."),
    newLearning: { kind: "expression", label: "corroborates", explanation: t("“Corroborates” indica apoio independente a um relato, sem transformá-lo em certeza total.", "“Corroborates” means independent evidence supports an account without proving every detail."), example: "The serial number corroborates Maya's account." },
    decision: decision("suitcase-ep2-c1-decision", t("Qual fonte Ana verifica em seguida?", "What does Ana verify next?"),
      [t("Os metadados da foto", "Photo metadata"), t("O horário é compatível com a chegada de Maya.", "The time is consistent with Maya's arrival.")],
      [t("O recibo original", "The original receipt"), t("O número impresso coincide com a câmera.", "Its printed number matches the camera.")]),
    application: choice("suitcase-ep2-c1-app", t("Descreva o peso da evidência.", "Describe the weight of evidence."),
      t("O recibo foi emitido antes da perda e coincide com o número da câmera.", "The receipt predates the loss and matches the camera number."),
      ["The receipt proves every part of Maya's story beyond doubt.", "The receipt corroborates Maya's claim to the camera.", "The receipt contradicts Maya's claim to the camera."], 1,
      t("A coincidência corrobora a posse, sem provar tudo.", "The match corroborates ownership without proving everything."),
      t("Separe apoio à posse de certeza sobre todos os eventos.", "Separate support for ownership from certainty about every event.")),
    transfer: order("suitcase-ep2-c1-transfer", t("Avalie outra fonte.", "Evaluate another source."),
      t("Um registro de arquivo confirma a data mencionada por uma testemunha.", "An archive entry confirms a date a witness mentioned."),
      ["The", "archive", "entry", "corroborates", "her", "account."],
      t("O registro apoia o relato da testemunha.", "The record supports the witness's account."),
      t("Use “corroborates” entre a fonte e o relato.", "Put “corroborates” between the source and the account.")),
    reveal: t("Os metadados da foto, o recibo e o forro descrito por Maya convergem.", "The photo metadata, receipt, and lining Maya described point in the same direction."),
    consequence: t("Ana registra quais evidências sustentam a devolução, sem acusar Leo de mentira.", "Ana records the grounds for returning the bag without accusing Leo of lying."),
    recall: choice("suitcase-ep2-c1-recall", t("Calibre a afirmação.", "Calibrate the claim."),
      t("Um carimbo de data coincide com o relato de Jo, mas não cobre toda a viagem.", "A timestamp matches Jo's account but does not cover the whole trip."),
      ["The timestamp corroborates Jo's account of that moment.", "The timestamp proves every part of Jo's journey.", "The timestamp makes Jo's account irrelevant."], 0,
      t("O carimbo apoia apenas a parte observada.", "The timestamp supports only the observed part."),
      t("Evite afirmar mais do que a fonte mostra.", "Do not claim more than the source shows.")),
    canDo: canDo("Consigo reconhecer e montar afirmações calibradas sobre evidências que corroboram um relato.", "I can recognize and arrange calibrated statements about evidence that corroborates an account."),
  },
  {
    id: "expedition-suitcase-ep3-v1", offerId: "expedition-suitcase", family: "C1-C2", position: 3,
    title: t("Uma conclusão proporcional", "A proportionate conclusion"), durationMinutes: 5,
    problem: t("A etiqueta aponta para Leo; três evidências independentes apontam para Maya. Não há prova de intenção.", "The tag points to Leo; three independent clues point to Maya. There is no evidence of intent."),
    attempt: t("Ana precisa concluir quem receberá a mala sem transformar um engano em acusação.", "Ana must decide who receives the bag without turning a mistake into an accusation."),
    newLearning: { kind: "strategy", label: "on balance", explanation: t("“On balance” apresenta uma conclusão proporcional às evidências disponíveis.", "“On balance” introduces a conclusion weighed against the available evidence."), example: "On balance, Maya's claim is better supported." },
    decision: decision("suitcase-ep3-c1-decision", t("Como Ana comunica a resolução?", "How does Ana communicate the resolution?"),
      [t("Explicar as evidências aos dois", "Explain the evidence to both"), t("Ambos entendem por que a mala volta a Maya.", "Both understand why the bag goes to Maya.")],
      [t("Pedir conferência conjunta", "Ask for a joint check"), t("Leo encontra sua mala idêntica na outra esteira.", "Leo finds his identical bag on the other belt.")]),
    application: choice("suitcase-ep3-c1-app", t("Conclua sem exceder a evidência.", "Conclude without overclaiming."),
      t("Recibo, foto e forro apoiam Maya. A etiqueta isolada diz Leo.", "The receipt, photo, and lining support Maya. The tag alone says Leo."),
      ["Leo certainly lied to obtain Maya's bag.", "Both claims are supported equally well.", "On balance, Maya's claim is better supported."], 2,
      t("A conclusão pesa as pistas sem atribuir intenção.", "The conclusion weighs the clues without assigning intent."),
      t("Não há evidência de mentira; compare o apoio às duas versões.", "There is no evidence of lying; compare the support for each account.")),
    transfer: order("suitcase-ep3-c1-transfer", t("Pese uma nova situação.", "Weigh a new situation."),
      t("Duas mensagens divergem; o registro oficial confirma apenas a segunda.", "Two messages differ; the official record supports only the second."),
      ["On", "balance,", "the", "second", "message", "is", "better", "supported."],
      t("“On balance” mantém a conclusão proporcional.", "“On balance” keeps the conclusion proportionate."),
      t("Comece com “On balance” e descreva o apoio relativo.", "Start with “On balance” and describe the relative support.")),
    reveal: t("Uma gravação mostra Leo levando a mala errada sem notar. Sua própria mala ficou na esteira vizinha.", "A recording shows Leo taking the wrong bag without noticing. His own bag remained on the next belt."),
    consequence: t("Ana devolve as malas e registra um erro de identificação, não uma fraude.", "Ana returns the bags and records a mix-up, not fraud."),
    recall: choice("suitcase-ep3-c1-recall", t("Escolha a inferência proporcional.", "Choose the proportionate inference."),
      t("Duas fontes apoiam uma data; uma anotação informal aponta outra. Nada indica intenção de enganar.", "Two sources support one date; an informal note suggests another. Nothing indicates intent to mislead."),
      ["On balance, the date supported by two sources is more likely.", "The informal note proves deliberate deception.", "All three sources have identical weight."], 0,
      t("A afirmação pesa as fontes sem inventar intenção.", "The statement weighs the sources without inventing intent."),
      t("Prefira a conclusão que explicita o grau de apoio.", "Prefer the conclusion that states the degree of support.")),
    canDo: canDo("Consigo reconhecer e montar conclusões proporcionais à evidência, sem atribuir intenção sem prova.", "I can recognize and arrange evidence-weighted conclusions without unsupported claims about intent."),
  },
];

const londonA1: readonly ExpeditionEpisode[] = [
  {
    id: "expedition-london-ep1-v1", offerId: "expedition-london", family: "A1-A2", position: 1,
    title: t("A parada do ônibus", "The bus stop"), durationMinutes: 5,
    problem: t("Nora e Sparky chegam à estação tarde. O hotel fica perto do rio, mas a parada não está no mapa.", "Nora and Sparky reach the station late. The hotel is near the river, but the bus stop is not on their map."),
    attempt: t("Eles sabem o nome da rua, mas precisam perguntar onde é a parada.", "They know the street, but need to ask where the stop is."),
    newLearning: { kind: "expression", label: "Where is ...?", explanation: t("Use “Where is” para perguntar a localização de um lugar.", "Use “Where is” to ask where a place is."), example: "Where is the bus stop?" },
    decision: decision("london-ep1-a1-decision", t("A quem Nora pergunta?", "Whom does Nora ask?"),
      [t("Ao motorista Sam", "Driver Sam"), t("Sam aponta para a parada perto do relógio.", "Sam points to the stop near the clock.")],
      [t("À funcionária da estação", "The station worker"), t("Ela mostra a parada na tela.", "She shows the stop on a screen.")]),
    application: choice("london-ep1-a1-app", t("Pergunte pela parada.", "Ask for the stop."),
      t("Nora quer saber onde fica a parada de ônibus.", "Nora wants the bus stop's location."),
      ["When is the bus stop?", "Where is the bus stop?", "Who is the bus stop?"], 1,
      t("“Where is” pede a localização.", "“Where is” asks for the location."),
      t("A pergunta é sobre lugar, não horário ou pessoa.", "The question asks about a place, not a time or person.")),
    transfer: order("london-ep1-a1-transfer", t("Pergunte por outro lugar.", "Ask for another place."),
      t("Você procura a farmácia.", "You are looking for the pharmacy."),
      ["Where", "is", "the", "pharmacy?"],
      t("A mesma pergunta ajuda a encontrar a farmácia.", "The same question helps find the pharmacy."),
      t("Comece com “Where is”.", "Start with “Where is”.")),
    reveal: t("A parada fica junto ao relógio. Sam confirma que o ônibus passa em cinco minutos.", "The stop is by the clock. Sam confirms the bus arrives in five minutes."),
    consequence: t("Eles chegam ao ônibus, mas uma ponte está fechada na rota.", "They reach the bus, but a bridge on its route is closed."),
    recall: choice("london-ep1-a1-recall", t("Pergunte onde fica.", "Ask where it is."),
      t("Jo precisa encontrar a biblioteca.", "Jo needs to find the library."),
      ["Where is the library?", "When is the library?", "Whose is the library?"], 0,
      t("“Where” pergunta pelo lugar.", "“Where” asks for the place."),
      t("Use a palavra de localização.", "Use the location word.")),
    canDo: canDo("Consigo reconhecer e montar perguntas simples sobre localização.", "I can recognize and arrange simple location questions."),
  },
  {
    id: "expedition-london-ep2-v1", offerId: "expedition-london", family: "A1-A2", position: 2,
    title: t("A ponte fechada", "The closed bridge"), durationMinutes: 5,
    problem: t("A ponte do ônibus está fechada. Sam diz que há uma balsa no mesmo rio.", "The bus bridge is closed. Sam says there is a ferry on the same river."),
    attempt: t("Nora quer confirmar se a balsa pode substituir o ônibus.", "Nora wants to check whether the ferry can replace the bus."),
    newLearning: { kind: "expression", label: "Can we take ... instead?", explanation: t("Use “instead” para propor uma opção no lugar da primeira.", "Use “instead” to suggest an alternative."), example: "Can we take the ferry instead?" },
    decision: decision("london-ep2-a1-decision", t("Que caminho eles conferem?", "Which route do they check?"),
      [t("A balsa", "The ferry"), t("A próxima balsa ainda aceita passageiros.", "The next ferry is still boarding.")],
      [t("Outra ponte", "Another bridge"), t("Sam aponta uma ponte para pedestres.", "Sam points to a footbridge.")]),
    application: choice("london-ep2-a1-app", t("Pergunte por uma alternativa.", "Ask about an alternative."),
      t("O ônibus não cruza o rio; a balsa está aberta.", "The bus cannot cross the river; the ferry is open."),
      ["Can we take the ferry instead?", "Can we take the bridge instead?", "Can we take the bus instead?"], 0,
      t("A balsa é a opção disponível.", "The ferry is the available option."),
      t("Escolha o transporte que ainda funciona.", "Choose the transport that still runs.")),
    transfer: order("london-ep2-a1-transfer", t("Sugira outra troca.", "Suggest another switch."),
      t("O metrô parou; um trem está disponível.", "The underground has stopped; a train is available."),
      ["Can", "we", "take", "the", "train", "instead?"],
      t("“Instead” marca o trem como alternativa.", "“Instead” marks the train as the alternative."),
      t("A opção nova vem antes de “instead”.", "Put the new option before “instead”.")),
    reveal: t("A balsa chega a tempo e deixa o grupo perto do hotel.", "The ferry arrives in time and drops the group near the hotel."),
    consequence: t("Nora guarda o bilhete da balsa como lembrança da travessia.", "Nora keeps the ferry ticket as a reminder of the crossing."),
    recall: choice("london-ep2-a1-recall", t("Escolha outra alternativa.", "Choose another alternative."),
      t("A cafeteria está fechada; a padaria está aberta.", "The café is closed; the bakery is open."),
      ["Can we go to the café instead?", "Can we go to the bakery instead?", "Can we go to neither place instead?"], 1,
      t("A padaria substitui a cafeteria fechada.", "The bakery replaces the closed café."),
      t("“Instead” deve acompanhar a opção disponível.", "“Instead” should go with the available option.")),
    canDo: canDo("Consigo reconhecer e montar uma pergunta que propõe uma alternativa disponível.", "I can recognize and arrange a question proposing an available alternative."),
  },
  {
    id: "expedition-london-ep3-v1", offerId: "expedition-london", family: "A1-A2", position: 3,
    title: t("O que está incluído?", "What is included?"), durationMinutes: 5,
    problem: t("No hotel, Iris oferece um quarto. A placa não diz se o café da manhã está incluído.", "At the hotel, Iris offers a room. The sign does not say whether breakfast is included."),
    attempt: t("Antes de aceitar, Nora precisa confirmar uma condição da oferta.", "Before accepting, Nora needs to confirm a term of the offer."),
    newLearning: { kind: "expression", label: "Does ... include ...?", explanation: t("Use “Does ... include ...?” para confirmar o que faz parte da oferta.", "Use “Does ... include ...?” to check what an offer covers."), example: "Does the room include breakfast?" },
    decision: decision("london-ep3-a1-decision", t("Qual detalhe eles conferem primeiro?", "Which detail do they check first?"),
      [t("Café da manhã", "Breakfast"), t("Iris confirma que está incluído.", "Iris confirms it is included.")],
      [t("Horário de saída", "Checkout time"), t("Iris mostra o horário no recibo.", "Iris shows the time on the receipt.")]),
    application: choice("london-ep3-a1-app", t("Confirme o café da manhã.", "Confirm breakfast."),
      t("A oferta do quarto não informa se inclui café da manhã.", "The room offer does not say whether breakfast is included."),
      ["Does breakfast include the room?", "Does the room include breakfast?", "Is the room breakfast?"], 1,
      t("A pergunta verifica o que o quarto inclui.", "The question checks what the room includes."),
      t("O quarto é a oferta; café da manhã é o item a confirmar.", "The room is the offer; breakfast is the item to check.")),
    transfer: order("london-ep3-a1-transfer", t("Confirme outra oferta.", "Confirm another offer."),
      t("Um bilhete de passeio pode incluir a balsa.", "A tour ticket may include the ferry."),
      ["Does", "the", "ticket", "include", "the", "ferry?"],
      t("A pergunta confirma se a balsa faz parte do bilhete.", "The question checks whether the ferry is part of the ticket."),
      t("“Does” vem antes do item oferecido.", "Put “Does” before the offered item.")),
    reveal: t("Iris confirma o café da manhã sem custo extra e registra a condição no recibo.", "Iris confirms breakfast at no extra cost and records the term on the receipt."),
    consequence: t("Nora aceita o quarto sabendo exatamente o que está incluído.", "Nora accepts the room knowing exactly what is included."),
    recall: choice("london-ep3-a1-recall", t("Confirme uma condição.", "Check a term."),
      t("Um passe de museu pode incluir o guia de áudio.", "A museum pass may include the audio guide."),
      ["Does the guide include the museum?", "Do the pass include audio?", "Does the pass include the audio guide?"], 2,
      t("A pergunta confirma o item dentro do passe.", "The question checks the item included in the pass."),
      t("Comece com “Does the pass include”.", "Start with “Does the pass include”.")),
    canDo: canDo("Consigo reconhecer e montar perguntas para confirmar itens incluídos numa oferta.", "I can recognize and arrange questions checking what an offer includes."),
  },
];

const londonB1: readonly ExpeditionEpisode[] = [
  {
    id: "expedition-london-ep1-v1", offerId: "expedition-london", family: "B1-B2", position: 1,
    title: t("Chegar ao cais", "Getting to the pier"), durationMinutes: 5,
    problem: t("O mapa mostra o hotel, mas não indica como chegar de transporte até o cais mais próximo.", "The map shows the hotel but not how to reach the nearest pier by public transport."),
    attempt: t("Saber onde fica o cais não basta: Nora precisa de uma rota.", "Knowing where the pier is is not enough: Nora needs a route."),
    newLearning: { kind: "expression", label: "How do I get to ...?", explanation: t("A pergunta pede um caminho, não só a localização.", "This question asks for a route, not just a location."), example: "How do I get to the pier?" },
    decision: decision("london-ep1-b1-decision", t("A quem Nora pede a rota?", "Who does Nora ask for a route?"),
      [t("Ao motorista Sam", "Driver Sam"), t("Ele sugere o ônibus até a praça.", "He suggests the bus to the square.")],
      [t("À agente da estação", "The station agent"), t("Ela indica uma caminhada por duas ruas.", "She shows a two-street walk.")]),
    application: choice("london-ep1-b1-app", t("Peça o trajeto.", "Ask for the route."),
      t("Nora conhece a localização do cais; falta saber qual ônibus pegar.", "Nora knows where the pier is; she needs to know which bus to take."),
      ["Where is the pier on this map?", "How do I get to the pier by bus?", "Who owns the pier?"], 1,
      t("A pergunta pede como chegar de ônibus.", "The question asks how to get there by bus."),
      t("Peça o caminho, não a posição no mapa.", "Ask for the route, not its map position.")),
    transfer: order("london-ep1-b1-transfer", t("Peça outra rota.", "Ask for another route."),
      t("Você precisa chegar ao mercado a partir da estação.", "You need to reach the market from the station."),
      ["How", "do", "I", "get", "to", "the", "market?"],
      t("A pergunta solicita um trajeto até o mercado.", "The question requests a route to the market."),
      t("Monte “How do I get to” antes do destino.", "Build “How do I get to” before the destination.")),
    reveal: t("Sam indica um ônibus até a praça. Dali, o cais está a três minutos a pé.", "Sam points to a bus to the square. The pier is then a three-minute walk."),
    consequence: t("O grupo segue a rota, mas descobre que a ponte habitual está fechada.", "The group follows the route, then discovers that the usual bridge is closed."),
    recall: choice("london-ep1-b1-recall", t("Pergunte pelo trajeto.", "Ask for the route."),
      t("Jo já vê o museu no mapa, mas precisa saber como ir de metrô.", "Jo can see the museum on the map but needs the underground route."),
      ["How do I get to the museum by underground?", "Is the museum near a river?", "Who works at the museum?"], 0,
      t("A pergunta pede o caminho de metrô.", "The question asks for the underground route."),
      t("Use “How do I get to” para pedir um trajeto.", "Use “How do I get to” to ask for a route.")),
    canDo: canDo("Consigo reconhecer e montar perguntas por trajetos, distinguindo rota de localização.", "I can recognize and arrange route questions, distinguishing route from location."),
  },
  {
    id: "expedition-london-ep2-v1", offerId: "expedition-london", family: "B1-B2", position: 2,
    title: t("Plano B para a travessia", "A backup crossing"), durationMinutes: 5,
    problem: t("O ônibus iria pela ponte agora fechada; a balsa ainda sai do cais.", "The bus would use the now-closed bridge; the ferry still leaves from the pier."),
    attempt: t("Nora precisa ligar a condição imprevista à ação disponível.", "Nora needs to connect the unexpected condition with an available action."),
    newLearning: { kind: "strategy", label: "If ..., we can ...", explanation: t("Use uma condição real para justificar um plano alternativo.", "Use a real condition to justify an alternative plan."), example: "If the bridge is closed, we can take the ferry." },
    decision: decision("london-ep2-b1-decision", t("Como eles verificam a alternativa?", "How do they check the alternative?"),
      [t("Perguntar o horário da balsa", "Ask for the ferry timetable"), t("A próxima saída é em oito minutos.", "The next departure is in eight minutes.")],
      [t("Ver o painel no cais", "Check the pier board"), t("O painel confirma a mesma saída.", "The board confirms that departure.")]),
    application: choice("london-ep2-b1-app", t("Ligue condição e plano.", "Connect condition and plan."),
      t("A ponte está fechada, mas a balsa ainda opera.", "The bridge is closed, but the ferry still runs."),
      ["If the bridge is closed, we can take the ferry.", "If the ferry is closed, we can take the bridge.", "If the bridge is open, we must cancel the trip."], 0,
      t("A balsa resolve a condição descrita.", "The ferry addresses the stated condition."),
      t("A condição deve ser a ponte fechada; o plano, a balsa disponível.", "The condition is the closed bridge; the plan is the available ferry.")),
    transfer: order("london-ep2-b1-transfer", t("Aplique a estratégia em outra viagem.", "Apply the strategy to another trip."),
      t("O trem atrasa; o metrô está funcionando.", "The train is delayed; the underground is running."),
      ["If", "the", "train", "is", "delayed,", "we", "can", "take", "the", "underground."],
      t("A frase liga o atraso à opção disponível.", "The sentence links the delay to the available option."),
      t("Comece com a condição do trem.", "Begin with the train condition.")),
    reveal: t("O painel confirma a balsa. Eles cruzam o rio antes do último embarque.", "The board confirms the ferry. They cross before the final boarding."),
    consequence: t("Nora aprende a verificar a condição antes de mudar o plano.", "Nora learns to verify the condition before changing plans."),
    recall: choice("london-ep2-b1-recall", t("Recupere o plano condicional.", "Recall the conditional plan."),
      t("A chuva pode cancelar a caminhada; o museu coberto está aberto.", "Rain may cancel the walk; the indoor museum is open."),
      ["If the museum is closed, we can walk in the rain.", "If it rains, we can visit the museum.", "If it rains, the museum must close."], 1,
      t("A chuva aciona a alternativa coberta.", "Rain triggers the indoor alternative."),
      t("Conecte o obstáculo real à opção disponível.", "Connect the real obstacle with the available option.")),
    canDo: canDo("Consigo reconhecer e montar planos condicionais simples para imprevistos reais.", "I can recognize and arrange simple conditional plans for real disruptions."),
  },
  {
    id: "expedition-london-ep3-v1", offerId: "expedition-london", family: "B1-B2", position: 3,
    title: t("A condição da reserva", "The booking condition"), durationMinutes: 5,
    problem: t("No hotel, a tela mostra dois quartos, mas omite a regra de cancelamento do mais barato.", "At the hotel, the screen shows two rooms but omits the cheaper one's cancellation rule."),
    attempt: t("Nora quer confirmar essa condição antes de aceitar o preço.", "Nora wants to confirm the condition before accepting the price."),
    newLearning: { kind: "expression", label: "Could you confirm whether ...?", explanation: t("Peça confirmação clara de uma condição ainda incerta.", "Ask for clear confirmation of a term that remains uncertain."), example: "Could you confirm whether the room is refundable?" },
    decision: decision("london-ep3-b1-decision", t("O que Nora pede para registrar?", "What does Nora ask to have recorded?"),
      [t("A regra de cancelamento", "The cancellation rule"), t("Iris a coloca no recibo.", "Iris adds it to the receipt.")],
      [t("O horário de saída", "The checkout time"), t("Iris mostra o horário escrito.", "Iris shows the written time.")]),
    application: choice("london-ep3-b1-app", t("Confirme a condição ausente.", "Confirm the missing term."),
      t("A tarifa mais barata pode não ter reembolso; a tela não informa.", "The cheaper rate may be non-refundable; the screen does not say."),
      ["Could you confirm whether the room is refundable?", "Could you confirm that the room is certainly refundable?", "Could you confirm where the room is?"], 0,
      t("“Whether” pergunta por uma condição ainda aberta.", "“Whether” asks about a term that is still open."),
      t("Não pressuponha a resposta antes de Iris confirmar.", "Do not assume the answer before Iris confirms.")),
    transfer: order("london-ep3-b1-transfer", t("Confirme outra condição.", "Confirm another term."),
      t("Uma oficina pode oferecer retirada tardia, mas o anúncio é omisso.", "A workshop may allow late pickup, but the listing is silent."),
      ["Could", "you", "confirm", "whether", "late", "pickup", "is", "available?"],
      t("A pergunta deixa a resposta em aberto.", "The question leaves the answer open."),
      t("Use “whether” antes da condição incerta.", "Use “whether” before the uncertain term.")),
    reveal: t("Iris explica que a tarifa barata não é reembolsável. Nora escolhe a flexível e guarda a condição escrita.", "Iris explains that the cheaper rate is non-refundable. Nora chooses the flexible rate and keeps the term in writing."),
    consequence: t("A reserva fica alinhada ao plano de viagem que ainda pode mudar.", "The booking now fits a travel plan that may still change."),
    recall: choice("london-ep3-b1-recall", t("Peça confirmação neutra.", "Ask for neutral confirmation."),
      t("Uma passagem pode permitir mudança de data; o site não diz.", "A ticket may allow a date change; the site does not say."),
      ["Could you confirm that changes are free?", "Could you confirm whether date changes are allowed?", "Could you confirm the station address?"], 1,
      t("A pergunta verifica a possibilidade sem presumir o resultado.", "The question checks the possibility without assuming the result."),
      t("Peça “whether”, pois a regra ainda é desconhecida.", "Ask “whether”, since the rule is still unknown.")),
    canDo: canDo("Consigo reconhecer e montar pedidos neutros de confirmação de condições de uma oferta.", "I can recognize and arrange neutral requests to confirm an offer's terms."),
  },
];

const londonC1: readonly ExpeditionEpisode[] = [
  {
    id: "expedition-london-ep1-v1", offerId: "expedition-london", family: "C1-C2", position: 1,
    title: t("O serviço ainda circula?", "Is the service still running?"), durationMinutes: 5,
    problem: t("O aplicativo mostra uma rota noturna, mas o aviso de manutenção pode ter suspendido a última saída.", "The app shows a night route, but a maintenance notice may have cancelled the final departure."),
    attempt: t("Nora conhece a rota; a dúvida relevante é se o serviço funciona agora.", "Nora knows the route; what matters is whether the service is still running now."),
    newLearning: { kind: "expression", label: "still operating", explanation: t("Confirme a disponibilidade atual de um serviço, não apenas sua existência no mapa.", "Check a service's current availability, not merely its presence on a map."), example: "Is the night service still operating after eleven?" },
    decision: decision("london-ep1-c1-decision", t("Qual fonte Nora consulta?", "Which source does Nora consult?"),
      [t("O painel ao vivo", "The live board"), t("Ele mostra uma última saída confirmada.", "It shows one confirmed final departure.")],
      [t("O atendente do cais", "The pier attendant"), t("Ele confirma que a manutenção começa depois.", "He confirms maintenance starts later.")]),
    application: choice("london-ep1-c1-app", t("Confira a disponibilidade atual.", "Check current availability."),
      t("A rota existe no mapa, mas pode não funcionar depois das 23h.", "The route exists on the map but may not run after 11 p.m."),
      ["Where is the night route on the map?", "Is the night service still operating after eleven?", "Why was the night route originally built?"], 1,
      t("A pergunta trata da operação no horário necessário.", "The question asks whether it runs at the needed time."),
      t("A existência da rota não garante a saída desta noite.", "The route's existence does not guarantee tonight's departure.")),
    transfer: order("london-ep1-c1-transfer", t("Verifique outro serviço.", "Check another service."),
      t("Uma clínica aparece no site, mas é feriado.", "A clinic appears online, but today is a holiday."),
      ["Is", "the", "clinic", "still", "operating", "on", "public", "holidays?"],
      t("A pergunta verifica se o serviço funciona hoje.", "The question checks whether the service runs today."),
      t("Inclua “still operating” com o horário relevante.", "Include “still operating” with the relevant time.")),
    reveal: t("O painel confirma uma última saída antes da manutenção, mas ela vai até uma ponte fechada.", "The board confirms one final departure before maintenance, but it heads toward a closed bridge."),
    consequence: t("Nora evita presumir que um trajeto listado ainda está utilizável até o destino.", "Nora avoids assuming that a listed route still reaches the destination."),
    recall: choice("london-ep1-c1-recall", t("Verifique disponibilidade.", "Check availability."),
      t("Uma linha de trem aparece no mapa, mas há uma greve parcial hoje.", "A rail line appears on the map, but there is a partial strike today."),
      ["Is the station far from the river?", "When was the railway built?", "Is the rail service still operating this evening?"], 2,
      t("A pergunta verifica a operação durante a greve.", "The question checks operation during the strike."),
      t("O ponto incerto é a operação agora.", "The uncertain point is whether it runs now.")),
    canDo: canDo("Consigo reconhecer e montar perguntas que distinguem uma rota listada de um serviço disponível agora.", "I can recognize and arrange questions distinguishing a listed route from an available service."),
  },
  {
    id: "expedition-london-ep2-v1", offerId: "expedition-london", family: "C1-C2", position: 2,
    title: t("Uma alternativa viável", "A viable alternative"), durationMinutes: 5,
    problem: t("A ponte fecha às 22h45. A balsa sai às 22h50, mas o cais fica a dois minutos.", "The bridge closes at 10:45. The ferry leaves at 10:50, and the pier is two minutes away."),
    attempt: t("Uma alternativa só resolve o imprevisto se ainda for praticável no horário real.", "An alternative only solves the disruption if it is feasible at the actual time."),
    newLearning: { kind: "strategy", label: "Given ..., would ... be viable?", explanation: t("Considere a restrição antes de avaliar se uma alternativa é praticável.", "State the constraint before evaluating whether an alternative is feasible."), example: "Given the closure, would the ferry be viable?" },
    decision: decision("london-ep2-c1-decision", t("Que restrição o grupo checa?", "Which constraint does the group check?"),
      [t("Tempo até o cais", "Time to the pier"), t("A caminhada leva dois minutos.", "The walk takes two minutes.")],
      [t("Último embarque", "Final boarding"), t("O embarque encerra às 22h49.", "Boarding closes at 10:49.")]),
    application: choice("london-ep2-c1-app", t("Avalie a alternativa com a restrição.", "Evaluate the option against the constraint."),
      t("São 22h46; o cais fica a dois minutos e o embarque fecha às 22h49.", "It is 10:46; the pier is two minutes away and boarding closes at 10:49."),
      ["Given the time, would the ferry still be viable?", "Given the time, the closed bridge must be faster.", "The ferry is impossible because the pier is two minutes away."], 0,
      t("A pergunta avalia uma possibilidade ainda aberta.", "The question evaluates an option that may still be feasible."),
      t("Há tempo potencial, mas confirme a viabilidade antes de afirmar.", "There may be time, but check feasibility before asserting it.")),
    transfer: order("london-ep2-c1-transfer", t("Avalie outra alternativa.", "Evaluate another alternative."),
      t("O elevador falhou; a rampa está aberta, mas é longa.", "The lift failed; the ramp is open but long."),
      ["Given", "the", "delay,", "would", "the", "ramp", "still", "be", "viable?"],
      t("A pergunta relaciona o atraso à rota alternativa.", "The question relates the delay to the alternative route."),
      t("Apresente a restrição antes de perguntar pela viabilidade.", "State the constraint before asking about viability.")),
    reveal: t("A equipe do cais confirma o embarque. O grupo chega um minuto antes de ele fechar.", "The pier staff confirm boarding. The group arrives one minute before it closes."),
    consequence: t("Nora guarda o horário verificado para não depender de uma suposição otimista.", "Nora keeps the checked timetable rather than relying on an optimistic guess."),
    recall: choice("london-ep2-c1-recall", t("Considere a restrição antes de propor.", "Consider the constraint before proposing."),
      t("O check-in termina em 15 minutos; o trem expresso demora 12.", "Check-in closes in 15 minutes; the express train takes 12."),
      ["The express is certainly impossible, regardless of the platform.", "Given the deadline, would the express still be viable?", "Because the express takes 12 minutes, check-in never closes."], 1,
      t("A pergunta avalia a margem de tempo real.", "The question evaluates the real time margin."),
      t("Ainda há uma possibilidade; verifique-a em vez de presumir.", "There is still a possibility; check it rather than assume.")),
    canDo: canDo("Consigo reconhecer e montar perguntas que avaliam uma alternativa frente a uma restrição concreta.", "I can recognize and arrange questions evaluating an alternative against a concrete constraint."),
  },
  {
    id: "expedition-london-ep3-v1", offerId: "expedition-london", family: "C1-C2", position: 3,
    title: t("Aceitar com uma condição clara", "Accepting on clear terms"), durationMinutes: 5,
    problem: t("Iris oferece uma tarifa flexível verbalmente, mas o resumo impresso ainda diz 'sem reembolso'.", "Iris verbally offers a flexible rate, but the printed summary still says 'non-refundable'."),
    attempt: t("Nora quer aceitar a reserva, desde que a condição acordada apareça por escrito.", "Nora wants to accept the booking if the agreed term appears in writing."),
    newLearning: { kind: "expression", label: "provided that", explanation: t("“Provided that” vincula o aceite a uma condição necessária.", "“Provided that” makes acceptance depend on a necessary condition."), example: "I can accept, provided that the terms are updated in writing." },
    decision: decision("london-ep3-c1-decision", t("Como Nora registra a condição?", "How does Nora record the term?"),
      [t("Pede um resumo corrigido", "Ask for a corrected summary"), t("Iris emite um documento com a tarifa flexível.", "Iris issues a document with the flexible rate.")],
      [t("Pede confirmação por e-mail", "Ask for email confirmation"), t("Iris envia a condição antes do pagamento.", "Iris sends the term before payment.")]),
    application: choice("london-ep3-c1-app", t("Aceite sem abrir mão da condição.", "Accept without waiving the condition."),
      t("O resumo ainda contradiz a promessa de reembolso.", "The summary still contradicts the refund promise."),
      ["I accept the booking, although the written terms still say no refund.", "I can accept, provided that the refund terms are corrected in writing.", "I accept the booking because written terms no longer matter."], 1,
      t("O aceite depende da correção documentada.", "Acceptance depends on the documented correction."),
      t("A condição escrita precisa existir antes do aceite.", "The written term must be in place before acceptance.")),
    transfer: order("london-ep3-c1-transfer", t("Negocie outra condição.", "Negotiate another condition."),
      t("Uma equipe aceita um prazo novo se ele constar no contrato.", "A team accepts a new deadline if it appears in the contract."),
      ["We", "can", "proceed,", "provided", "that", "the", "deadline", "is", "documented."],
      t("A condição documentada limita o aceite.", "The documented condition limits acceptance."),
      t("Coloque “provided that” antes da exigência.", "Put “provided that” before the requirement.")),
    reveal: t("Iris corrige o resumo. A tarifa flexível aparece por escrito antes do pagamento.", "Iris corrects the summary. The flexible rate appears in writing before payment."),
    consequence: t("Nora conclui a reserva sem depender apenas de uma promessa verbal.", "Nora completes the booking without relying only on a verbal promise."),
    recall: choice("london-ep3-c1-recall", t("Aceite com uma condição necessária.", "Accept on a necessary condition."),
      t("Uma editora pode publicar o texto se o nome da autora for corrigido no contrato.", "A publisher can release the text if the author's name is corrected in the contract."),
      ["We can publish, provided that the contract names the author correctly.", "We can publish despite the incorrect contract and ignore it.", "The author is named correctly because we already published."], 0,
      t("O aceite depende da correção contratual.", "Acceptance depends on correcting the contract."),
      t("Use “provided that” para vincular o aceite à correção.", "Use “provided that” to link acceptance to the correction.")),
    canDo: canDo("Consigo reconhecer e montar um aceite condicionado a um termo verificável por escrito.", "I can recognize and arrange acceptance conditional on a verifiable written term."),
  },
];

const signalA1: readonly ExpeditionEpisode[] = [
  {
    id: "case-signal-ep1-v1", offerId: "case-signal", family: "A1-A2", position: 1,
    title: t("De onde vem o som?", "Where does the sound come from?"), durationMinutes: 5,
    problem: t("Pinky ouve três pulsos. Jo encontra um cabo ligado à estação meteorológica no telhado.", "Pinky hears three pulses. Jo finds a cable connected to the weather station on the roof."),
    attempt: t("Elas precisam dizer de onde vem o sinal antes de responder à equipe.", "They need to say where the signal comes from before replying to the team."),
    newLearning: { kind: "expression", label: "It comes from ...", explanation: t("Use esta frase para indicar a origem de um som ou mensagem.", "Use this phrase to name the source of a sound or message."), example: "It comes from the weather station." },
    decision: decision("signal-a1-decision", t("Qual pista você segue?", "Which clue do you follow?"),
      [t("Seguir o cabo", "Follow the cable"), t("O cabo termina na estação meteorológica.", "The cable ends at the weather station.")],
      [t("Comparar os pulsos", "Compare the pulses"), t("O padrão coincide com o aparelho no telhado.", "The pattern matches the device on the roof.")]),
    application: choice("signal-a1-app", t("Diga a origem do sinal.", "Name the source of the signal."),
      t("O cabo do rádio termina na estação meteorológica.", "The radio cable ends at the weather station."),
      ["It comes from the weather station.", "It goes to the weather station tomorrow.", "The weather station comes from it."], 0,
      t("A frase identifica a origem encontrada.", "The sentence names the source you found."),
      t("A pergunta é sobre a origem do sinal.", "The question asks where the signal comes from.")),
    transfer: order("signal-a1-transfer", t("Explique outro som.", "Explain another sound."),
      t("Um sino toca na sala ao lado.", "A bell rings in the next room."),
      ["It", "comes", "from", "the", "next", "room."],
      t("Você identificou de onde vem o som.", "You named the source of the sound."),
      t("Comece com “It comes from”.", "Start with “It comes from”.")),
    reveal: t("O sinal era o aviso automático de chuva da estação meteorológica.", "The signal was the weather station's automatic rain alert."),
    consequence: t("Pinky avisa a equipe antes que a chuva chegue.", "Pinky warns the team before the rain arrives."),
    recall: choice("signal-a1-recall", t("Diga de onde vem outra mensagem.", "Name the source of another message."),
      t("Uma mensagem chegou do escritório da escola.", "A message came from the school office."),
      ["It comes from the school office.", "The school office comes from it.", "It comes to the school office."], 0,
      t("A frase identifica a origem da mensagem.", "The sentence names the message's source."),
      t("Use “comes from” para a origem.", "Use “comes from” for a source.")),
    canDo: canDo("Consigo reconhecer e montar frases simples que indicam a origem de um som ou mensagem.", "I can recognize and arrange simple sentences naming the source of a sound or message."),
  },
];

const signalB1: readonly ExpeditionEpisode[] = [
  {
    id: "case-signal-ep1-v1", offerId: "case-signal", family: "B1-B2", position: 1,
    title: t("Uma hipótese testável", "A testable hypothesis"), durationMinutes: 5,
    problem: t("Os três pulsos coincidem com o sensor do telhado, mas Jo ainda não verificou a conexão.", "The three pulses match the rooftop sensor, but Jo has not checked the connection yet."),
    attempt: t("Pinky precisa apresentar uma hipótese sem tratá-la como fato confirmado.", "Pinky needs to propose a hypothesis without calling it a confirmed fact."),
    newLearning: { kind: "strategy", label: "appears to come from", explanation: t("“Appears to” marca uma conclusão provisória apoiada em pistas.", "“Appears to” marks a tentative conclusion supported by clues."), example: "The signal appears to come from the rooftop sensor." },
    decision: decision("signal-b1-decision", t("Como verificar a hipótese?", "How would you test the hypothesis?"),
      [t("Isolar o sensor", "Isolate the sensor"), t("Os pulsos param enquanto ele fica desligado.", "The pulses stop while it is disconnected.")],
      [t("Comparar os horários", "Compare the timestamps"), t("Os pulsos e as leituras têm os mesmos horários.", "The pulses and readings have matching timestamps.")]),
    application: choice("signal-b1-app", t("Relate a hipótese com cautela.", "Report the hypothesis cautiously."),
      t("Há uma coincidência de horário, mas a ligação ainda não foi testada.", "The timing matches, but the connection has not been tested."),
      ["The signal definitely comes from the sensor.", "The signal appears to come from the sensor.", "The sensor cannot be related to the signal."], 1,
      t("A expressão apresenta a pista sem certeza excessiva.", "The phrase reports the clue without overstating certainty."),
      t("A coincidência sugere uma origem, mas ainda não a confirma.", "The match suggests a source but does not confirm it yet.")),
    transfer: order("signal-b1-transfer", t("Relate outra hipótese.", "Report another hypothesis."),
      t("Uma falha surge quando a antena aquece; a causa ainda não foi confirmada.", "A fault occurs when the antenna heats up; the cause is not confirmed."),
      ["The", "fault", "appears", "to", "come", "from", "the", "antenna."],
      t("Você apresentou a origem como hipótese.", "You presented the source as a hypothesis."),
      t("Use “appears to come from” para evitar certeza indevida.", "Use “appears to come from” to avoid unwarranted certainty.")),
    reveal: t("Ao isolar o sensor, os pulsos param: ele envia um alerta de chuva sem identificação.", "When Jo isolates the sensor, the pulses stop: it sends an unlabeled rain alert."),
    consequence: t("Jo identifica o alerta para que a próxima equipe o reconheça rapidamente.", "Jo labels the alert so the next team can recognize it quickly."),
    recall: choice("signal-b1-recall", t("Descreva uma nova hipótese.", "Describe a new hypothesis."),
      t("Um ruído começa sempre que a bomba liga, mas ninguém a isolou ainda.", "A noise starts whenever the pump runs, but no one has isolated it yet."),
      ["The noise proves the pump is broken.", "The pump cannot be involved in the noise.", "The noise appears to come from the pump."], 2,
      t("A frase distingue a pista da confirmação.", "The sentence separates the clue from confirmation."),
      t("Os horários sugerem uma origem, sem comprová-la.", "The timing suggests a source without proving it.")),
    canDo: canDo("Consigo reconhecer e montar hipóteses sobre a origem de um sinal sem exagerar a certeza.", "I can recognize and arrange tentative claims about a signal's source without overstating certainty."),
  },
];

const signalC1: readonly ExpeditionEpisode[] = [
  {
    id: "case-signal-ep1-v1", offerId: "case-signal", family: "C1-C2", position: 1,
    title: t("Pista não é prova", "A clue is not proof"), durationMinutes: 5,
    problem: t("O padrão dos pulsos coincide com o sensor, mas outro transmissor usa a mesma frequência.", "The pulse pattern matches the sensor, but another transmitter uses the same frequency."),
    attempt: t("Pinky deve relatar a evidência e manter aberta a hipótese alternativa.", "Pinky must report the evidence while keeping the alternative explanation open."),
    newLearning: { kind: "strategy", label: "consistent with, but not conclusive", explanation: t("A construção indica compatibilidade com uma hipótese sem apresentá-la como prova.", "This phrasing says evidence fits a hypothesis without presenting it as proof."), example: "The pattern is consistent with the sensor, but not conclusive." },
    decision: decision("signal-c1-decision", t("Qual verificação vem primeiro?", "Which check comes first?"),
      [t("Isolar o sensor", "Isolate the sensor"), t("O padrão permanece: outra fonte também emite pulsos.", "The pattern remains: another source also emits pulses.")],
      [t("Inspecionar o transmissor reserva", "Inspect the backup transmitter"), t("Seu registro mostra os mesmos intervalos de pulso.", "Its log shows the same pulse intervals.")]),
    application: choice("signal-c1-app", t("Relate a evidência com precisão.", "Report the evidence precisely."),
      t("Dois aparelhos podem produzir o mesmo padrão; nenhum foi isolado ainda.", "Two devices can produce the same pattern; neither has been isolated yet."),
      ["The pattern conclusively proves the sensor is responsible.", "The pattern is consistent with the sensor, but not conclusive.", "The sensor is unrelated because another device exists."], 1,
      t("A formulação preserva a hipótese alternativa.", "The wording preserves the alternative explanation."),
      t("Compatibilidade não equivale a confirmação exclusiva.", "A match is not exclusive confirmation.")),
    transfer: order("signal-c1-transfer", t("Avalie outra evidência.", "Evaluate another piece of evidence."),
      t("Uma falha coincide com aquecimento, mas outra variável ainda não foi testada.", "A failure coincides with heating, but another variable remains untested."),
      ["The", "timing", "is", "consistent", "with", "overheating,", "but", "not", "conclusive."],
      t("A frase distingue compatibilidade de prova.", "The sentence separates a match from proof."),
      t("Inclua “but not conclusive” após a hipótese compatível.", "Add “but not conclusive” after the compatible hypothesis.")),
    reveal: t("Jo isola cada transmissor. O sinal vem do aparelho reserva, que repetia um teste antigo.", "Jo isolates each transmitter. The signal comes from the backup device, which was repeating an old test."),
    consequence: t("A equipe encerra o teste esquecido e documenta como distinguiu as duas fontes.", "The team stops the forgotten test and documents how it distinguished the two sources."),
    recall: choice("signal-c1-recall", t("Avalie um novo indício.", "Assess a new clue."),
      t("Um odor coincide com o uso de um solvente, mas outro produto também estava aberto.", "An odor coincides with use of one solvent, but another product was open too."),
      ["The odor is consistent with the solvent, but not conclusive.", "The odor proves exactly which product caused it.", "The odor cannot be related to either product."], 0,
      t("A frase considera a explicação alternativa.", "The sentence accounts for the alternative explanation."),
      t("Uma coincidência compatível ainda não exclui outra causa.", "A compatible observation does not rule out another cause.")),
    canDo: canDo("Consigo reconhecer e montar afirmações que separam evidência compatível de prova conclusiva.", "I can recognize and arrange statements separating consistent evidence from conclusive proof."),
  },
];

export const expeditionEpisodes: readonly ExpeditionEpisode[] = [
  ...suitcaseA1, ...suitcaseB1, ...suitcaseC1,
  ...londonA1, ...londonB1, ...londonC1,
  ...signalA1, ...signalB1, ...signalC1,
];

export function getExpeditionWorld(id: string) {
  return expeditionWorlds.find(world => world.id === id);
}

export function getExpeditionEpisode(episodeId: string, family: ExpeditionFamily) {
  return expeditionEpisodes.find(episode => episode.id === episodeId && episode.family === family);
}
