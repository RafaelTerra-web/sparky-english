import type { Level } from "../levels";
import type { LessonDraft, LessonExperience, ModuleDraft, PronunciationGuide, UsageContrast } from "./types";

const themes: Record<string, { personality: string; setting: string; application: string }> = {
  "b1-vida-em-movimento": { personality: "Imprevistos do dia a dia", setting: "um plano que precisa mudar", application: "explicar um imprevisto e confirmar uma solução com outra pessoa" },
  "b2-acordos-cotidianos": { personality: "Acordos que funcionam", setting: "uma decisão com necessidades diferentes", application: "negociar condições e verificar informações antes de decidir" },
  "c1-intencoes-e-impacto": { personality: "Intenção e efeito", setting: "uma conversa em que o pedido não está totalmente explícito", application: "esclarecer intenções e transformar comentários vagos em ações úteis" },
  "c2-significado-em-disputa": { personality: "Precisão nas entrelinhas", setting: "uma interpretação que precisa ser discutida com cuidado", application: "questionar pressupostos e reparar ambiguidades sem apagar a preocupação do outro" },
  "a1-identidade": { personality: "Primeiras conversas", setting: "um primeiro encontro", application: "se apresentar sem traduzir palavra por palavra" },
  "a1-pessoas": { personality: "Retrato falado", setting: "uma conversa sobre pessoas próximas", application: "descrever alguém de forma clara e gentil" },
  "a1-rotina": { personality: "Relógio do cotidiano", setting: "um dia comum que precisa ser organizado", application: "contar sua rotina e entender horários reais" },
  "a1-casa": { personality: "Mapa vivo", setting: "uma casa que você precisa visualizar", application: "localizar objetos e explicar onde as coisas ficam" },
  "a1-consumo": { personality: "Missão na rua", setting: "uma compra com uma decisão prática", application: "resolver uma compra sem depender de gestos" },
  "a1-interacao": { personality: "Resposta que mantém a conversa", setting: "uma troca curta com outra pessoa", application: "responder de modo natural e manter o diálogo" },
  "a2-passado": { personality: "Histórias do passado", setting: "uma conversa sobre o que aconteceu", application: "reconstruir acontecimentos sem confundir presente e passado" },
  "a2-escolhas": { personality: "Hora de decidir", setting: "uma escolha entre duas opções", application: "comparar alternativas e justificar uma escolha" },
  "a2-experiencias": { personality: "Álbum de experiências", setting: "uma conversa sobre coisas vividas", application: "falar do que já viveu e perguntar pela experiência alheia" },
  "a2-planos": { personality: "Agenda em movimento", setting: "um plano que ainda pode mudar", application: "combinar intenções, previsões e horários" },
  "a2-servicos": { personality: "Ajuda durante a viagem", setting: "um atendimento durante uma viagem", application: "pedir ajuda e confirmar detalhes durante um atendimento" },
  "a2-textos": { personality: "Caixa de mensagens", setting: "um texto curto com informação útil", application: "ler e escrever mensagens para combinar algo ou pedir ajuda" },
  "a2-comunicacao": { personality: "Vida real sem roteiro", setting: "uma conversa cotidiana com pressão leve", application: "reagir com clareza quando a situação muda" },
  "b1-narrativas": { personality: "Oficina de histórias", setting: "uma história em que a ordem importa", application: "narrar acontecimentos com cenário, causa e consequência" },
  "b1-argumentos": { personality: "Mesa de argumentos", setting: "uma decisão que exige razões", application: "defender uma opinião e reconhecer limites" },
  "b1-hipoteses": { personality: "Laboratório do possível", setting: "um cenário que ainda não aconteceu", application: "avaliar possibilidades e consequências" },
  "b1-precisao": { personality: "Fale com clareza", setting: "uma frase que precisa de um pequeno ajuste", application: "ajustar frases para que soem mais naturais" },
  "b1-colaboracao": { personality: "Sala de projeto", setting: "uma equipe tentando avançar", application: "propor, discordar e chegar a um próximo passo" },
  "b1-leitura": { personality: "Leitura com lupa", setting: "um texto com pistas distribuídas", application: "localizar argumento, referência e intenção" },
  "b2-argumentacao": { personality: "Debate com nuances", setting: "uma proposta com méritos e riscos", application: "argumentar sem esconder ressalvas importantes" },
  "b2-autonomia": { personality: "Central de decisões", setting: "um problema sem solução perfeita", application: "decidir, explicar critérios e adaptar o registro" },
  "c1-sintese": { personality: "Sala de análise", setting: "fontes que não dizem exatamente a mesma coisa", application: "sintetizar evidências sem apagar divergências" },
  "c1-interacao": { personality: "Mesa de negociação", setting: "uma negociação entre pessoas com interesses diferentes", application: "mediar posições e registrar acordos que possam ser cumpridos" },
  "c1-evidencias": { personality: "Análise de evidências", setting: "uma decisão que depende da análise de dados", application: "explicar resultados de pesquisa, incertezas e limites para públicos distintos" },
  "c2-nuance": { personality: "Leitura nas entrelinhas", setting: "um texto em que a escolha das palavras muda a interpretação", application: "interpretar subtexto e ambiguidade sem tirar conclusões além do que o texto permite" },
  "c2-producao": { personality: "Estúdio de precisão", setting: "uma mensagem complexa para mais de um público", application: "produzir discurso flexível, preciso e revisável" },
  "c2-estilo-cultura": { personality: "Laboratório de estilo", setting: "vozes e referências culturais em conflito", application: "analisar e recriar efeitos retóricos entre contextos" },
};

const mechanics = [
  { name: "Imagine esta situação", lead: "Observe a situação abaixo e pense no que você diria em inglês. Ao longo da lição, você verá exemplos para preparar sua resposta.", discovery: "Que palavras ajudam a comunicar a ideia principal de forma clara?" },
  { name: "Encontre o que precisa mudar", lead: "Uma tradução palavra por palavra nem sempre funciona. Compare os exemplos da lição e observe o que muda para a frase fazer sentido em inglês.", discovery: "Ao comparar os exemplos, o que precisa mudar para a frase expressar a ideia desejada?" },
  { name: "Preste atenção aos sons", lead: "Ao ouvir os exemplos desta lição, tente reconhecer as palavras mais destacadas. Depois, confira o texto e observe como elas se ligam na fala.", discovery: "Que palavras você reconhece no áudio? Observe quais recebem mais destaque na frase." },
  { name: "Compare as formas de dizer", lead: "Observe como uma pequena mudança na frase pode alterar seu sentido. Compare as opções da lição e veja qual combina com cada contexto.", discovery: "O que muda no sentido da frase quando você troca uma palavra ou sua posição?" },
  { name: "Escolha de acordo com a situação", lead: "Leia a situação e observe quem fala, o que aconteceu e o que cada pessoa quer. Use essas informações para escolher suas respostas na lição.", discovery: "Que informação da conversa ajuda você a escolher a resposta mais adequada?" },
  { name: "Monte a frase passo a passo", lead: "Identifique primeiro a ideia principal dos exemplos. Depois, observe como acrescentar detalhes e prepare uma frase sua sobre o mesmo assunto.", discovery: "Como você pode expressar a ideia principal antes de acrescentar outros detalhes?" },
] as const;

function compact(text: string, length = 145) {
  const first = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s/)[0];
  return first.length <= length ? first : first.slice(0, length - 1).trimEnd() + "…";
}

export function createLessonExperience(data: Pick<LessonDraft, "title" | "example" | "translation" | "dialogueTranslation">, module: Pick<ModuleDraft, "id" | "level">, position: number, previous?: Pick<LessonDraft, "title" | "example" | "translation">): LessonExperience {
  const theme = themes[module.id] ?? { personality: "Professor particular", setting: "uma situação real", application: "usar a estrutura fora da lição" };
  const mechanic = mechanics[position % mechanics.length];
  const scene = compact(data.dialogueTranslation, 125);
  const levelChallenge: Record<Level, string> = {
    A1: `Como você diria “${compact(data.translation, 78)}” em inglês? Pratique uma frase curta e adapte os detalhes à sua realidade.`,
    A2: `Pratique o tema “${data.title}”: crie uma frase sobre a situação e acrescente uma pergunta ou resposta para continuar a conversa.`,
    B1: `Pratique o tema “${data.title}”: apresente uma ideia e acrescente uma razão, uma consequência ou um detalhe que ajude a explicá-la.`,
    B2: `Pratique o tema “${data.title}”: desenvolva uma resposta adequada à situação e explique suas escolhas com exemplos ou justificativas.`,
    C1: `Pratique o tema “${data.title}”: reformule a mensagem sem mudar seu sentido, o grau de certeza ou o nível de formalidade.`,
    C2: `Pratique o tema “${data.title}”: crie sua resposta e revise como o ritmo, a escolha das palavras e as ideias implícitas influenciam a interpretação.`,
  };
  return {
    personality: theme.personality,
    mechanic: mechanic.name,
    mission: `Nesta lição: ${data.title}. ${mechanic.lead} Contexto: ${theme.setting}. Trecho da conversa em português: ${scene}`,
    discovery: `${mechanic.discovery} Use como referência esta ideia: “${compact(data.translation, 105)}”`,
    challenge: levelChallenge[module.level],
    application: theme.application,
    memoryCue: previous ? `Retome “${previous.title}”: tente formular a ideia em inglês antes de consultar o modelo.` : undefined,
    recall: previous ? { title: previous.title, prompt: previous.translation, model: previous.example } : undefined,
  };
}

const functionWords = /^(a|an|and|are|as|at|can|for|from|has|have|in|is|of|on|or|that|the|to|was|were|will|with)$/i;
function contentWord(example: string) {
  return example.replace(/[^A-Za-z' -]/g, "").split(/\s+/).find(word => word.length > 3 && !functionWords.test(word)) ?? example.split(/\s+/)[0];
}
export function createPronunciationGuide(data: Pick<LessonDraft, "title" | "rule" | "example" | "vocabulary">, level: Level, position: number): PronunciationGuide {
  // Choose sound targets from the actual recording, never from Portuguese rules
  // or counterexamples that the learner will not hear.
  const haystack = data.example.toLowerCase();
  const word = contentWord(data.example);
  const words = data.example.split(/\s+/);
  const phraseLength = Math.min(5, Math.max(1, words.length - 1));
  const phrase = words.slice(0, phraseLength).join(" ");
  const ladder: [string, string, string] = [word, phrase === word ? words.at(-1)! : phrase, data.example];
  const common = { careful: data.example, natural: "Ouça devagar para localizar os sons. Volte a 1× e observe onde a voz faz pausas e dá destaque. A escrita abaixo é ortográfica, não uma transcrição dos sons.", drill: ladder };
  if (/\b(?:think|three|through|thought|thank|thing|thirty|healthy|method)\b/.test(haystack)) return { focus: "TH sem virar T, S ou F", ipa: "/θ/", mouth: "Encoste levemente a ponta da língua entre os dentes e solte o ar. Não bloqueie o ar como em T.", change: "Na fala ligada, mantenha o TH curto, mas não esconda a língua nem acrescente uma vogal.", contrast: ["three", "tree"], ...common };
  if (/\b(?:leave|ship|sheep)\b/.test(haystack)) return { focus: "I curto e I longo", ipa: "/ɪ/ × /iː/", mouth: "Para /ɪ/, deixe a língua alta e relaxada; para /iː/, aproxime-a mais do céu da boca e sustente o som sem abrir um sorriso exagerado.", change: "A duração e a posição da língua mudam a palavra, por isso treine o contraste antes da frase.", contrast: ["ship", "sheep"], ...common };
  if (/\b(?:very|visit|voice|work|would|went|week|view|review)\b/.test(haystack) && position % 2 === 1) return { focus: "V e W começam de lugares diferentes", ipa: "/v/ × /w/", mouth: "Em V, os dentes superiores tocam o lábio inferior e o ar vibra. Em W, arredonde os lábios sem tocar os dentes.", change: "Alterne o gesto antes de acelerar; o começo da palavra precisa continuar distinto.", contrast: ["vest", "west"], ...common };
  const regularEdTarget = /\b(?:worked|visited|wanted|needed|started|arrived|finished|watched|cleaned|played|lived|studied|stayed|provided|reported|suggested|contributed)\b/.test(haystack);
  if (regularEdTarget) return { focus: "Final de passado sem sílaba extra", ipa: "/t/, /d/ ou /ɪd/", mouth: "Nos verbos regulares, -ed forma uma sílaba extra depois dos sons /t/ e /d/, como em wanted. Compare com worked, cujo final é /t/.", change: "Observe o último som do verbo, não apenas a letra. Não transforme todos os finais em 'édi'.", contrast: ["worked", "wanted"], ...common };
  if (/\b(?:likes|works|needs|uses|changes)\b/.test(haystack)) return { focus: "O pequeno som do final", ipa: "/s/, /z/ ou /ɪz/", mouth: "Mantenha o final: works termina em /s/, needs em /z/ e uses, como verbo, em /ɪz/. Compare a vibração e a presença de uma sílaba extra.", change: "Ouça o final na frase completa. Plural e terceira pessoa não devem desaparecer quando você acelera.", ...common };
  if (/\b(?:i'm|isn't|aren't|don't|doesn't|didn't|haven't|hasn't|won't|can't|couldn't|wouldn't|shouldn't|we're|they're|i've)\b/.test(haystack)) return { focus: "Contração como uma unidade", mouth: "Não faça uma pausa no apóstrofo. Em I'm, I e am se unem; em don't, do e not se unem. Preserve o som que distingue a afirmação da negação.", change: "A contração costuma encurtar a expressão. Escute o contexto e não apague a negação ao repetir.", ...common };
  if (/\b(?:how|home|hotel|help|have|has|had|him|her)\b/.test(haystack) && position % 2 === 0) return { focus: "H é ar, não R brasileiro", ipa: "/h/", mouth: "Abra a passagem do ar como se embaçasse um vidro. A língua não raspa o céu da boca e a garganta não vibra.", change: "Em palavras pouco fortes, o H pode ficar discreto; pratique primeiro de modo claro e depois reduza.", contrast: ["heat", "eat"], ...common };
  if (/\?$/.test(haystack)) return { focus: "Entonação mostra o tipo de pergunta", mouth: "Mantenha a mandíbula solta. Dê destaque à informação que procura; não suba automaticamente no fim de toda pergunta.", change: "Perguntas com what, where ou why frequentemente terminam com queda. A intenção pode mudar esse padrão: observe o áudio, sem tratar a tendência como regra absoluta.", ...common };
  if (["B2", "C1", "C2"].includes(level)) return { focus: "Ritmo guiado por ideias", ipa: "/ə/ nas formas fracas", mouth: "Destaque substantivos, verbos e contrastes. Reduza palavras gramaticais; o schwa é curto e relaxado, sem uma vogal portuguesa cheia.", change: "Na forma natural, grupos de sentido substituem a leitura palavra por palavra. A ênfase revela sua interpretação.", ...common };
  if (position % 3 === 0) return { focus: "Consoante final audível", mouth: "Feche a palavra antes de começar a próxima. Evite acrescentar um 'i' depois da consoante final.", change: "Quando a palavra seguinte começa por vogal, a consoante se liga a ela sem desaparecer.", ...common };
  if (position % 3 === 1) return { focus: "Palavras fortes marcam o compasso", mouth: "Alongue levemente a vogal da palavra importante e mantenha as palavras pequenas mais curtas.", change: "O inglês alterna batidas fortes e trechos reduzidos; não dê o mesmo peso a cada palavra.", ...common };
  return { focus: "Ligação sem engolir informação", mouth: "Prepare o fim de uma palavra e o começo da seguinte no mesmo movimento. Mantenha as consoantes que diferenciam palavras.", change: "A ligação aumenta a fluidez, mas não autoriza apagar finais que carregam plural, tempo ou negação.", ...common };
}

export function usageContrasts(data: Pick<LessonDraft, "example" | "gap" | "fills">): UsageContrast[] {
  return [
    { label: "MODELO DA LIÇÃO", text: data.example, tone: "good" },
    { label: "COMPARE NO CONTEXTO", text: data.gap.replace("___", data.fills[1]), tone: "warning" },
    { label: "AJUSTE EXPLICADO", text: data.gap.replace("___", data.fills[0]), tone: "fixed" },
  ];
}

export const authoredStepOrders = [
  ["hook", "example", "teach", "vocabulary", "pronunciation", "dialogue", "choice", "complete_sentence", "error_analysis", "order_words", "production", "summary"],
  ["hook", "error_preview", "teach", "example", "pronunciation", "vocabulary", "complete_sentence", "error_analysis", "dialogue", "choice", "order_words", "production", "summary"],
  ["hook", "example", "pronunciation", "dialogue", "choice", "teach", "vocabulary", "complete_sentence", "error_analysis", "order_words", "production", "summary"],
  ["hook", "teach", "example", "complete_sentence", "error_analysis", "pronunciation", "vocabulary", "dialogue", "choice", "order_words", "production", "summary"],
  ["hook", "dialogue", "choice", "teach", "example", "pronunciation", "vocabulary", "complete_sentence", "error_analysis", "order_words", "production", "summary"],
  ["hook", "example", "teach", "pronunciation", "complete_sentence", "error_analysis", "vocabulary", "dialogue", "choice", "order_words", "production", "summary"],
] as const;

export function firstSentence(text: string) {
  return compact(text, 190);
}
