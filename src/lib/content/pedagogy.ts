import type { Level } from "../levels";
import type { LessonDraft, LessonExperience, ModuleDraft, PronunciationGuide, UsageContrast } from "./types";

const themes: Record<string, { personality: string; setting: string; application: string }> = {
  "a1-identidade": { personality: "Conversa de bolso", setting: "um primeiro encontro", application: "se apresentar sem traduzir palavra por palavra" },
  "a1-pessoas": { personality: "Retrato falado", setting: "uma conversa sobre pessoas próximas", application: "descrever alguém de forma clara e gentil" },
  "a1-rotina": { personality: "Relógio do cotidiano", setting: "um dia comum que precisa ser organizado", application: "contar sua rotina e entender horários reais" },
  "a1-casa": { personality: "Mapa vivo", setting: "uma casa que você precisa visualizar", application: "localizar objetos e explicar onde as coisas ficam" },
  "a1-consumo": { personality: "Missão na rua", setting: "uma compra com uma decisão prática", application: "resolver uma compra sem depender de gestos" },
  "a1-interacao": { personality: "Resposta que mantém a conversa", setting: "uma troca curta com outra pessoa", application: "responder de modo natural e manter o diálogo" },
  "a2-passado": { personality: "Detetive do tempo", setting: "pistas sobre o que aconteceu", application: "reconstruir acontecimentos sem confundir presente e passado" },
  "a2-escolhas": { personality: "Sala de decisões", setting: "duas opções com consequências", application: "comparar alternativas e justificar uma escolha" },
  "a2-experiencias": { personality: "Álbum de experiências", setting: "uma conversa sobre coisas vividas", application: "falar do que já viveu e perguntar pela experiência alheia" },
  "a2-planos": { personality: "Agenda em movimento", setting: "um plano que ainda pode mudar", application: "combinar intenções, previsões e horários" },
  "a2-servicos": { personality: "Simulação de viagem", setting: "um serviço que precisa ser resolvido", application: "pedir ajuda e confirmar detalhes em público" },
  "a2-textos": { personality: "Caixa de mensagens", setting: "um texto curto com informação útil", application: "ler e escrever mensagens que produzem uma ação" },
  "a2-comunicacao": { personality: "Vida real sem roteiro", setting: "uma conversa cotidiana com pressão leve", application: "reagir com clareza quando a situação muda" },
  "b1-narrativas": { personality: "Oficina de histórias", setting: "uma história em que a ordem importa", application: "narrar acontecimentos com cenário, causa e consequência" },
  "b1-argumentos": { personality: "Mesa de argumentos", setting: "uma decisão que exige razões", application: "defender uma opinião e reconhecer limites" },
  "b1-hipoteses": { personality: "Laboratório do possível", setting: "um cenário que ainda não aconteceu", application: "avaliar possibilidades e consequências" },
  "b1-precisao": { personality: "Clínica de clareza", setting: "uma frase quase certa que precisa de ajuste", application: "corrigir detalhes que mudam a naturalidade" },
  "b1-colaboracao": { personality: "Sala de projeto", setting: "uma equipe tentando avançar", application: "propor, discordar e chegar a um próximo passo" },
  "b1-leitura": { personality: "Leitura com lupa", setting: "um texto com pistas distribuídas", application: "localizar argumento, referência e intenção" },
  "b2-argumentacao": { personality: "Debate com nuances", setting: "uma proposta com méritos e riscos", application: "argumentar sem esconder ressalvas importantes" },
  "b2-autonomia": { personality: "Central de decisões", setting: "um problema sem solução perfeita", application: "decidir, explicar critérios e adaptar o registro" },
  "c1-sintese": { personality: "Sala de análise", setting: "fontes que não dizem exatamente a mesma coisa", application: "sintetizar evidências sem apagar divergências" },
  "c1-interacao": { personality: "Mesa de negociação", setting: "interesses legítimos em tensão", application: "mediar posições e registrar compromissos executáveis" },
  "c1-evidencias": { personality: "Redação de evidências", setting: "dados que precisam virar uma decisão responsável", application: "explicar pesquisa, incerteza e limites para públicos distintos" },
  "c2-nuance": { personality: "Câmara de interpretação", setting: "um texto em que a formulação muda a leitura", application: "interpretar subtexto e ambiguidade sem extrapolar" },
  "c2-producao": { personality: "Estúdio de precisão", setting: "uma mensagem complexa para mais de um público", application: "produzir discurso flexível, preciso e revisável" },
  "c2-estilo-cultura": { personality: "Laboratório de estilo", setting: "vozes e referências culturais em conflito", application: "analisar e recriar efeitos retóricos entre contextos" },
};

const mechanics = [
  { name: "Cena primeiro", lead: (title: string, setting: string) => `Você entrou em ${setting}. Sua missão é usar “${title}” para fazer a situação avançar.`, discovery: "Que detalhe da frase resolve a situação sem acrescentar informação desnecessária?" },
  { name: "Detetive de erros", lead: (title: string, setting: string) => `Em ${setting}, uma escolha que parece lógica em português pode atrapalhar. Encontre a armadilha antes de dominar “${title}”.`, discovery: "Qual parte carregaria a ideia duas vezes ou deixaria a frase incompleta?" },
  { name: "Pista sonora", lead: (title: string, setting: string) => `Em ${setting}, você ouvirá a pista antes de ler. Use ritmo e palavras fortes para descobrir como “${title}” funciona.`, discovery: "O que você consegue reconhecer apenas pela sílaba forte e pelas palavras ligadas?" },
  { name: "Laboratório de contraste", lead: (title: string, setting: string) => `Duas formas competem em ${setting}, mas só uma comunica a intenção com naturalidade. Teste o contraste em “${title}”.`, discovery: "Que mudança pequena altera tempo, relação ou intenção?" },
  { name: "Escolha com consequência", lead: (title: string, setting: string) => `Você precisa tomar uma decisão em ${setting}. Cada pista de “${title}” elimina uma interpretação possível.`, discovery: "Que evidência do contexto torna uma opção melhor que as outras?" },
  { name: "Construção em camadas", lead: (title: string, setting: string) => `Comece pelo núcleo em ${setting} e acrescente uma peça por vez até conseguir usar “${title}” sozinho.`, discovery: "Qual é a menor estrutura que ainda preserva a mensagem central?" },
] as const;

function compact(text: string, length = 145) {
  const first = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s/)[0];
  return first.length <= length ? first : first.slice(0, length - 1).trimEnd() + "…";
}

export function createLessonExperience(data: Pick<LessonDraft, "title" | "example" | "translation" | "dialogueTranslation">, module: Pick<ModuleDraft, "id" | "level">, position: number, previousTitle?: string): LessonExperience {
  const theme = themes[module.id] ?? { personality: "Professor particular", setting: "uma situação real", application: "usar a estrutura fora da lição" };
  const mechanic = mechanics[position % mechanics.length];
  const scene = compact(data.dialogueTranslation, 125);
  const levelChallenge: Record<Level, string> = {
    A1: `Diga uma frase curta que comunique “${compact(data.translation, 78)}” sem copiar todos os detalhes do modelo.`,
    A2: `Resolva a situação com “${data.title}” e acrescente uma pergunta ou resposta que mantenha a conversa.`,
    B1: `Use “${data.title}” para conectar uma ideia a uma razão, consequência ou detalhe relevante.`,
    B2: `Tome uma posição com “${data.title}”, reconheça uma ressalva e responda ao contexto.`,
    C1: `Reformule a ideia com “${data.title}”, preservando evidência, registro e grau de certeza.`,
    C2: `Produza uma versão precisa com “${data.title}” e revise como ritmo, escolha lexical e subtexto orientam a interpretação.`,
  };
  return {
    personality: theme.personality,
    mechanic: mechanic.name,
    mission: `${mechanic.lead(data.title, theme.setting)} Cena: ${scene}`,
    discovery: `${mechanic.discovery} A intenção que precisa sobreviver é: “${compact(data.translation, 105)}”`,
    challenge: levelChallenge[module.level],
    application: theme.application,
    memoryCue: previousTitle ? `Puxe da memória “${previousTitle}”: uma ideia anterior reaparecerá discretamente nesta missão.` : undefined,
  };
}

const functionWords = /^(a|an|and|are|as|at|can|for|from|has|have|in|is|of|on|or|that|the|to|was|were|will|with)$/i;
function contentWord(example: string) {
  return example.replace(/[^A-Za-z' -]/g, "").split(/\s+/).find(word => word.length > 3 && !functionWords.test(word)) ?? example.split(/\s+/)[0];
}
function grouped(example: string) {
  return example.split(" ").map((word, index) => index && (functionWords.test(word) || /^[aeiou]/i.test(word)) ? "‿" + word : (index ? " | " : "") + word).join("");
}

export function createPronunciationGuide(data: Pick<LessonDraft, "title" | "rule" | "example" | "vocabulary">, level: Level, position: number): PronunciationGuide {
  const haystack = `${data.title} ${data.rule} ${data.example}`.toLowerCase();
  const word = contentWord(data.example);
  const ladder: [string, string, string] = [word, data.example.split(/\s+/).slice(0, Math.min(5, data.example.split(/\s+/).length)).join(" "), data.example];
  const common = { careful: data.example.split(" ").join(" · "), natural: grouped(data.example), drill: ladder };
  if (/\b(?:think|three|through|thought|thank|thing|thirty|healthy|method)\b/.test(haystack)) return { focus: "TH sem virar T, S ou F", ipa: "/θ/", mouth: "Encoste levemente a ponta da língua entre os dentes e solte o ar. Não bloqueie o ar como em T.", change: "Na fala ligada, mantenha o TH curto, mas não esconda a língua nem acrescente uma vogal.", contrast: ["three", "tree"], ...common };
  if (/\b(?:live|leave|ship|sheep)\b/.test(haystack)) return { focus: "I curto e I longo", ipa: "/ɪ/ × /iː/", mouth: "Para /ɪ/, deixe a língua alta e relaxada; para /iː/, aproxime-a mais do céu da boca e sustente o som sem abrir um sorriso exagerado.", change: "A duração e a posição da língua mudam a palavra, por isso treine o contraste antes da frase.", contrast: ["ship", "sheep"], ...common };
  if (/\b(?:very|visit|voice|work|would|went|week|view|review)\b/.test(haystack) && position % 2 === 1) return { focus: "V e W começam de lugares diferentes", ipa: "/v/ × /w/", mouth: "Em V, os dentes superiores tocam o lábio inferior e o ar vibra. Em W, arredonde os lábios sem tocar os dentes.", change: "Alterne o gesto antes de acelerar; o começo da palavra precisa continuar distinto.", contrast: ["vest", "west"], ...common };
  const explicitPastFocus = /passad|past simple|used to|didn't|did not/.test(haystack);
  const foundationalEdExample = ["A1", "A2", "B1"].includes(level) && /\b\w+ed\b/.test(data.example.toLowerCase());
  if (explicitPastFocus || foundationalEdExample) return { focus: "Final de passado sem sílaba extra", ipa: "/t/, /d/ ou /ɪd/", mouth: "Não coloque um 'i' depois de todo -ed. Crie uma sílaba extra apenas após sons de T ou D.", change: "No ritmo natural, o final pode ser curto, mas precisa continuar ligado à palavra seguinte.", contrast: ["worked", "wanted"], ...common };
  if (/plural|terceira pessoa|\b(?:likes|works|needs|uses|changes)\b/.test(haystack)) return { focus: "O pequeno som do final", ipa: "/s/, /z/ ou /ɪz/", mouth: "Mantenha o ar no final. Toque a garganta: com vibração, você ouve /z/; sem vibração, /s/.", change: "O final se liga à próxima vogal e pode soar como o começo da palavra seguinte.", ...common };
  if (/\b(?:i'm|isn't|aren't|don't|doesn't|didn't|haven't|hasn't|won't|can't|couldn't|wouldn't|shouldn't|we're|they're|i've)\b/.test(haystack)) return { focus: "Contração como uma unidade", ipa: "forma reduzida", mouth: "Não faça uma pausa onde o apóstrofo aparece. Una sujeito e auxiliar em um único impulso de voz.", change: "A contração encurta palavras gramaticais e deixa a palavra de conteúdo receber o destaque.", ...common };
  if (/\b(?:how|home|hotel|help|have|has|had|him|her)\b/.test(haystack) && position % 2 === 0) return { focus: "H é ar, não R brasileiro", ipa: "/h/", mouth: "Abra a passagem do ar como se embaçasse um vidro. A língua não raspa o céu da boca e a garganta não vibra.", change: "Em palavras pouco fortes, o H pode ficar discreto; pratique primeiro de modo claro e depois reduza.", contrast: ["heat", "eat"], ...common };
  if (/pergunta|question|\?$/.test(haystack)) return { focus: "Entonação mostra o tipo de pergunta", mouth: "Mantenha a mandíbula solta. Dê destaque à palavra que pede informação; não suba automaticamente no fim de toda pergunta.", change: "Perguntas de sim ou não tendem a abrir continuação; perguntas com what, where ou why costumam fechar com queda.", ...common };
  if (["B2", "C1", "C2"].includes(level)) return { focus: "Ritmo guiado por ideias", ipa: "/ə/ nas formas fracas", mouth: "Destaque substantivos, verbos e contrastes. Reduza palavras gramaticais; o schwa é curto e relaxado, sem uma vogal portuguesa cheia.", change: "Na forma natural, grupos de sentido substituem a leitura palavra por palavra. A ênfase revela sua interpretação.", ...common };
  if (position % 3 === 0) return { focus: "Consoante final audível", mouth: "Feche a palavra antes de começar a próxima. Evite acrescentar um 'i' depois da consoante final.", change: "Quando a palavra seguinte começa por vogal, a consoante se liga a ela sem desaparecer.", ...common };
  if (position % 3 === 1) return { focus: "Palavras fortes marcam o compasso", mouth: "Alongue levemente a vogal da palavra importante e mantenha as palavras pequenas mais curtas.", change: "O inglês alterna batidas fortes e trechos reduzidos; não dê o mesmo peso a cada palavra.", ...common };
  return { focus: "Ligação sem engolir informação", mouth: "Prepare o fim de uma palavra e o começo da seguinte no mesmo movimento. Mantenha as consoantes que diferenciam palavras.", change: "A ligação aumenta a fluidez, mas não autoriza apagar finais que carregam plural, tempo ou negação.", ...common };
}

export function usageContrasts(data: Pick<LessonDraft, "example" | "gap" | "fills">): UsageContrast[] {
  return [
    { label: "MUITO NATURAL", text: data.example, tone: "good" },
    { label: "ARMADILHA", text: data.gap.replace("___", data.fills[1]), tone: "warning" },
    { label: "CORREÇÃO", text: data.gap.replace("___", data.fills[0]), tone: "fixed" },
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
