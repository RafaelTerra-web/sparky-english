export const missingPostcardId = "missing-postcard-v1";

export type StoryScene = {
  title: string;
  text: string;
  translation: string;
  image: string;
  imageAlt: string;
  question: string;
  options: readonly [string, string, string, string];
  answer: number;
  feedbackPt: string;
  feedbackEn: string;
};

export const missingPostcardScenes: readonly StoryScene[] = [
  {
    title: "A descoberta",
    text: "We find a postcard between the books. It shows a little house by the sea.",
    translation: "Encontramos um cartão-postal entre os livros. Ele mostra uma casinha perto do mar.",
    image: "/stories/missing-postcard/bookshop.png",
    imageAlt: "Sparky e Pinky encontram um cartão-postal entre os livros de uma livraria.",
    question: "Where is the postcard?",
    options: ["Between the books", "Under the table", "Behind the blue door", "Inside Pinky's bag"],
    answer: 0,
    feedbackPt: "Between the books significa entre os livros.",
    feedbackEn: "Between the books tells us where they found it.",
  },
  {
    title: "A pista",
    text: "On the back, a note says: 'Meet me at the blue door at six.' We look outside.",
    translation: "No verso, um recado diz: 'Encontre-me na porta azul às seis.' Olhamos para fora.",
    image: "/stories/missing-postcard/bookshop.png",
    imageAlt: "Sparky segura o cartão-postal enquanto Pinky procura uma pista na livraria.",
    question: "When is the meeting?",
    options: ["At five", "At six", "At seven", "At noon"],
    answer: 1,
    feedbackPt: "At six quer dizer às seis.",
    feedbackEn: "The note says at six.",
  },
  {
    title: "A porta azul",
    text: "We ask a neighbor, 'Excuse me, where is the blue door?' She points next to the bookshop.",
    translation: "Perguntamos a uma vizinha: 'Com licença, onde fica a porta azul?' Ela aponta para o lado da livraria.",
    image: "/stories/missing-postcard/blue-door.png",
    imageAlt: "Uma porta azul se destaca ao lado da livraria no fim da tarde.",
    question: "Which question asks for the place politely?",
    options: ["What time is it?", "Do you like books?", "Where is the blue door?", "Is this your book?"],
    answer: 2,
    feedbackPt: "Where is...? pergunta onde algo fica; Excuse me torna a pergunta educada.",
    feedbackEn: "Where is...? asks for a place, and Excuse me makes it polite.",
  },
  {
    title: "A devolução",
    text: "Nora is by the blue door. We ask, 'Is this your postcard?' She smiles. 'Yes, it is. Thank you!'",
    translation: "Nora está perto da porta azul. Perguntamos: 'Este cartão-postal é seu?' Ela sorri. 'Sim, é. Obrigada!'",
    image: "/stories/missing-postcard/blue-door.png",
    imageAlt: "Sparky e Pinky devolvem o cartão-postal a Nora diante da porta azul.",
    question: "How do we know the postcard is Nora's?",
    options: ["She points to the sea", "She opens a book", "She asks the time", "She says, 'Yes, it is'"],
    answer: 3,
    feedbackPt: "Yes, it is confirma que o cartão-postal pertence a Nora.",
    feedbackEn: "Yes, it is confirms that the postcard belongs to Nora.",
  },
];

export function storyProgressKey(userId: string) {
  return `sparky-story:${missingPostcardId}:${userId}`;
}
