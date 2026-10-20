import type { Level } from "./levels.ts";

export type GrammarTopic = {
  id: string;
  level: Level;
  title: string;
  description: string;
  aliases: string[];
  lessonIds: string[];
};

const topic = (id: string, level: Level, title: string, description: string, aliases: string[], ...lessonIds: string[]): GrammarTopic => ({ id, level, title, description, aliases, lessonIds });

/** Curated links to material actually taught in the course, not a claim of full CEFR coverage.
 * A level is the suggested entry point in this course; some linked lessons revisit it later.
 * Keep IDs stable: the catalog stores selected topic IDs in links and local preferences.
 */
export const grammarTopics: GrammarTopic[] = [
  topic("alphabet", "A1", "Alphabet & spelling", "Alfabeto e soletração de dados pessoais.", ["alfabeto", "soletrar", "spelling"], "a1-identidade-06"),
  topic("verb-to-be", "A1", "Verb to be", "Am, is e are em apresentações, perguntas e negativas.", ["verbo to be", "am is are", "personal pronouns", "pronomes pessoais", "yes no questions"], "a1-identidade-02", "a1-identidade-03", "a1-identidade-04", "a1-identidade-05"),
  topic("question-words", "A1", "Question words", "What, where e how em perguntas do dia a dia.", ["palavras interrogativas", "wh questions", "perguntas"], "a1-identidade-01", "a1-identidade-02", "a1-identidade-03"),
  topic("articles", "A1", "Articles: a / an", "Artigos indefinidos antes de pessoas e objetos.", ["artigos", "indefinite articles", "a an"], "a1-pessoas-01"),
  topic("plural-nouns", "A1", "Singular & plural nouns", "Substantivos no singular e no plural.", ["plural", "singular", "substantivos", "nouns"], "a1-pessoas-02"),
  topic("possession", "A1", "Possessives & possessive case", "My, your e possessivo com apóstrofo para indicar de quem é.", ["possessive adjectives", "possessive case", "genitive", "adjetivos possessivos", "caso possessivo", "posse"], "a1-pessoas-03", "a1-pessoas-04"),
  topic("demonstratives", "A1", "This / that / these / those", "Demonstrativos para apontar perto e longe.", ["demonstrative pronouns", "demonstrativos"], "a1-pessoas-05"),
  topic("adjectives", "A1", "Basic adjectives", "Adjetivos para descrever pessoas, objetos e cômodos.", ["adjetivos básicos", "description"], "a1-pessoas-06", "a1-casa-03"),
  topic("simple-present", "A1", "Simple Present", "Hábitos, negativas e perguntas com do e does.", ["present simple", "presente simples", "do does", "rotina"], "a1-2-1", "a1-rotina-01", "a1-rotina-02", "a1-rotina-03", "a1-consumo-02"),
  topic("frequency", "A1", "Adverbs of frequency", "Always, usually e outras formas de dizer com que frequência.", ["advérbios de frequência", "how often", "always usually never"], "a1-rotina-04"),
  topic("time-prepositions", "A1", "Prepositions of time", "Horários e datas com in, on e at.", ["preposições de tempo", "in on at", "dates", "horas"], "a1-rotina-05", "a1-rotina-06"),
  topic("there-is-are", "A1", "There is / there are", "Dizer o que existe em um lugar.", ["há", "existe", "there is there are"], "a1-casa-01"),
  topic("place-prepositions", "A1", "Prepositions of place", "Localizar objetos e lugares com preposições.", ["preposições de lugar", "in on under next to", "localização"], "a1-casa-02"),
  topic("imperative", "A1", "Imperatives", "Dar instruções, direções e entender avisos.", ["imperativo", "instructions", "directions"], "a1-casa-04", "a1-casa-06"),
  topic("countable-nouns", "A1", "Countable & uncountable nouns", "Contáveis e não contáveis em pedidos e compras.", ["contáveis", "incontáveis", "uncountable", "quantidades"], "a1-consumo-03"),
  topic("some-any", "A1", "Some / any", "Quantidades indefinidas em afirmações, perguntas e negativas.", ["some any", "algum", "alguns"], "a1-consumo-04"),
  topic("how-much-many", "A1", "How much / how many", "Perguntar preços e quantidades.", ["how much how many", "quanto", "quantos", "preços"], "a1-consumo-05"),
  topic("can-cant", "A1", "Can / can't", "Habilidades e pedidos de permissão.", ["can cannot", "habilidade", "permissão", "modal verbs"], "a1-interacao-01", "a1-interacao-02"),
  topic("present-continuous", "A1", "Present Continuous", "Ações em andamento agora com be + -ing.", ["present progressive", "presente contínuo", "am is are ing"], "a1-interacao-03", "a1-interacao-04", "a1-interacao-05"),
  topic("past-be", "A2", "Past of be: was / were", "Was e were em situações passadas.", ["was were", "passado do verbo to be", "simple past of be"], "a2-passado-01"),
  topic("simple-past", "A2", "Simple Past", "Passado simples regular e irregular, perguntas e negativas com did.", ["past simple", "passado simples", "regular irregular verbs", "did didn't"], "a2-passado-02", "a2-passado-03", "a2-4-1", "a2-passado-04"),
  topic("past-continuous", "A2", "Past Continuous", "Ações em andamento no passado e contraste com o Simple Past.", ["past progressive", "passado contínuo", "simple past vs past continuous", "was were ing"], "a2-passado-06", "b1-narrativas-03"),
  topic("comparatives", "A2", "Comparatives & superlatives", "Comparar opções, destacar uma no grupo e usar as ... as.", ["comparativos", "superlativos", "as as", "comparative adjectives", "superlative adjectives"], "a2-escolhas-01", "a2-escolhas-02", "a2-escolhas-03"),
  topic("too-enough", "A2", "Too / enough", "Dizer que algo é excessivo ou suficiente.", ["too enough", "demais", "suficiente"], "a2-escolhas-04"),
  topic("quantifiers", "A2", "Much / many / a few / a little", "Quantificadores com substantivos contáveis e não contáveis.", ["quantifiers", "quantificadores", "a lot of", "much many", "a few a little"], "a2-escolhas-05", "a2-escolhas-06"),
  topic("present-perfect", "A2", "Present Perfect", "Experiências, resultados e contraste com o passado com data.", ["presente perfeito", "have has participle", "ever never", "just already yet", "for since", "present perfect vs simple past"], "a2-experiencias-01", "a2-experiencias-02", "a2-experiencias-03", "a2-experiencias-04", "a2-experiencias-05", "a2-experiencias-06"),
  topic("future-forms", "A2", "Future: will / going to / Present Continuous", "Intenções, decisões e compromissos futuros já combinados.", ["futuro simples", "simple future", "will", "going to", "present continuous for future"], "a2-3-1", "a2-planos-01", "a2-planos-02", "a2-planos-03"),
  topic("would-like", "A2", "Would like", "Convidar e fazer pedidos com educação.", ["would like to", "gostaria", "convites"], "a2-planos-04", "a2-servicos-04"),
  topic("zero-conditional", "A2", "Zero Conditional", "Condicional zero: fatos gerais e hábitos com if + presente.", ["zero conditionals", "conditional zero", "0 conditional", "0th conditional", "condicional zero", "condicional tipo zero", "condicionais", "conditionals", "condições"], "a2-planos-06"),
  topic("first-conditional", "A2", "First Conditional", "Primeiro condicional: condições possíveis e resultados futuros.", ["first conditionals", "1st conditional", "conditional 1", "primeiro condicional", "primeira condicional", "condicional tipo 1", "condicionais", "conditionals", "condições"], "a2-planos-05", "b1-hipoteses-04"),
  topic("advice-obligation", "A2", "Should / must / have to", "Conselho, obrigação, proibição e ausência de necessidade.", ["should shouldn't", "must mustn't", "have to don't have to", "conselhos", "obrigação", "modal verbs", "verbos modais"], "a2-servicos-01", "a2-servicos-02", "a2-servicos-03", "a2-textos-06"),
  topic("object-pronouns", "A2", "Object pronouns", "Me, her e them para retomar pessoas e coisas.", ["pronomes de objeto", "subject and object pronouns", "me him her us them"], "a2-textos-01"),
  topic("cause-result", "A2", "Because / so / but", "Conectar causa, resultado e contraste.", ["conjunctions", "conjunções", "conectores", "cause and result", "because so"], "a2-textos-02"),
  topic("used-to", "B1", "Used to", "Hábitos e estados antigos em contraste com o presente.", ["used to", "costumava", "hábitos antigos"], "b1-narrativas-01"),
  topic("past-perfect", "B1", "Past Perfect", "Had + particípio para uma ação anterior a outra no passado.", ["past perfect simple", "mais que perfeito", "passado perfeito", "had participle", "past perfect vs simple past"], "b1-narrativas-02"),
  topic("present-perfect-continuous", "B1", "Present Perfect Continuous", "Duração e continuidade com have / has been + -ing.", ["present perfect progressive", "presente perfeito contínuo", "have been", "has been"], "b1-narrativas-04"),
  topic("reported-speech", "B1", "Reported Speech", "Relatar falas com said e told e ajustar referências.", ["reported statements", "discurso indireto", "fala relatada", "said told"], "b1-narrativas-05"),
  topic("past-ability", "B1", "Could / was able to / managed to", "Habilidade geral no passado e sucesso em uma ação específica.", ["could couldn't", "habilidade passada", "was able to", "managed to"], "b1-narrativas-06"),
  topic("linking-words", "B1", "Linking words & cohesion", "Although, for example e therefore para ligar argumentos.", ["although however therefore despite", "conectores", "linkers", "coesão", "discourse markers"], "b1-argumentos-02", "b1-argumentos-03", "b1-leitura-05"),
  topic("modals-deduction", "B1", "Modals: possibility & deduction", "May, might, must e can't para indicar possibilidade ou dedução.", ["must might can't for deduction", "verbos modais", "modal verbs", "dedução", "possibilidade"], "b1-hipoteses-01", "b1-hipoteses-02"),
  topic("second-conditional", "B1", "Second Conditional", "Segundo condicional: situações imaginárias no presente e futuro.", ["second conditionals", "2nd conditional", "conditional 2", "segundo condicional", "segunda condicional", "condicional tipo 2", "condicionais", "conditionals", "condições"], "b1-hipoteses-03", "b1-hipoteses-04"),
  topic("unless", "B1", "Unless / if ... not", "Condições negativas com a menos que.", ["unless", "if not", "a menos que", "condicionais", "conditionals"], "b1-hipoteses-05"),
  topic("would-rather", "B1", "Would rather", "Preferências com verbo base e comparação com than.", ["would rather", "preferência", "rather than"], "b1-hipoteses-06"),
  topic("relative-clauses", "B1", "Defining relative clauses", "Who, which e that para identificar pessoas e coisas.", ["relative pronouns", "orações relativas", "pronomes relativos", "who which that"], "b1-precisao-01"),
  topic("passive-voice", "B1", "Passive Voice: present & past", "Be + particípio para dar foco ao que recebe a ação.", ["voz passiva", "present passive", "past passive", "was were participle"], "b1-precisao-02", "b1-precisao-03"),
  topic("gerund-infinitive", "B1", "Gerund & infinitive", "Padrões com -ing e to depois de verbos.", ["gerund vs infinitive", "gerúndio", "infinitivo", "verb patterns", "enjoy doing decide to do"], "b1-precisao-04"),
  topic("phrasal-verbs", "B1", "Phrasal verbs", "Verbos com partículas, significado e posição dos pronomes.", ["verbos frasais", "look after", "turn off", "phrasal verbs"], "b1-precisao-05"),
  topic("adjective-prepositions", "B1", "Adjectives & prepositions", "Combinações como interested in e good at.", ["preposições depois de adjetivos", "prepositional phrases", "interested in", "good at"], "b1-precisao-06"),
  topic("indirect-questions", "B1", "Indirect questions", "Perguntas indiretas com ordem de afirmação.", ["perguntas indiretas", "could you tell me", "do you know if"], "b1-colaboracao-01"),
  topic("conditional-connectors", "B2", "Provided that & conditional agreements", "Expressar condições e limites de um acordo.", ["provided that", "conditional clauses", "condições", "conditionals", "condicionais"], "b2-argumentacao-05"),
  topic("advanced-reported-speech", "B2", "Reported Speech: decisions & references", "Preservar decisão, autor e referências ao relatar uma reunião.", ["advanced reported speech", "discurso indireto avançado", "reporting decisions"], "b2-autonomia-01"),
  topic("third-conditional", "B2", "Third Conditional", "Terceiro condicional: imaginar um passado que não aconteceu.", ["third conditionals", "3rd conditional", "conditional 3", "terceiro condicional", "terceira condicional", "condicional tipo 3", "condicionais", "conditionals", "condições"], "b2-autonomia-05"),
  topic("mixed-conditionals", "B2", "Mixed Conditionals", "Condicionais mistas: conectar causas e resultados em tempos diferentes.", ["mixed conditional", "condicional mista", "condicional misto", "condicionais mistas", "condicionais mistos", "mista", "mistos", "condicionais", "conditionals", "condições"], "b2-condicionais-01", "b2-condicionais-02"),
  topic("hedging", "C1", "Hedging & degrees of certainty", "Calibrar certeza com appears to, likely e cannot rule out.", ["hedging", "linguagem cautelosa", "grau de certeza", "speculation", "academic grammar"], "c1-sintese-02"),
  topic("advanced-cohesion", "C1", "Advanced cohesion & reference", "Coesão com referentes claros e progressão temática.", ["advanced discourse markers", "coesão avançada", "referentes", "discourse markers"], "c1-sintese-03"),
  topic("inversion", "C1", "Inversion & emphasis", "Inversão de auxiliar e sujeito após expressões restritivas.", ["advanced inversion", "negative adverbial inversion", "inversão", "ênfase", "only after"], "c1-interacao-04"),
  topic("formal-register", "C1", "Formal register & polite requests", "Ajustar formalidade e cortesia preservando a mensagem.", ["formal and academic grammar", "registro formal", "formalidade", "would appreciate"], "c1-interacao-01"),
  topic("implicit-requests", "C1", "Pragmatics: indirect requests", "Interpretar perguntas que funcionam como pedidos no contexto.", ["pragmatics", "pragmática", "pedidos implícitos", "indirect requests"], "c1-interacao-03"),
  topic("nominalization", "C2", "Nominalization & concise syntax", "Revisar nominalizações preservando agente, ação e condições.", ["complex nominalization", "nominalisation", "nominalização", "concisão", "stylistic grammar"], "c2-producao-01"),
  topic("scope-ambiguity", "C2", "Grammatical ambiguity & scope", "Alcance de only, all e not e leituras possíveis de uma frase.", ["grammatical ambiguity", "ambiguidade gramatical", "escopo", "determiners", "advanced quantifiers"], "c2-nuance-04"),
  topic("presupposition", "C2", "Presupposition & implicit meaning", "Reconhecer pressupostos introduzidos pela escolha gramatical.", ["pragmatics and implicit meaning", "pressupostos", "sentido implícito", "if versus when"], "c2-nuance-03"),
  topic("advanced-attribution", "C2", "Reported voices & attribution", "Distinguir reportedly, allegedly e according to sem mudar a fonte.", ["advanced reported speech", "discurso relatado", "attribution", "reporting verbs"], "c2-producao-03"),
  topic("tone-implicature", "C2", "Tone, register & implicature", "Como even, merely e at least alteram o tom e o sentido implícito.", ["register and tone adaptation", "tom", "implicatura", "literary and rhetorical grammar"], "c2-producao-05"),
];

const byLesson = new Map<string, GrammarTopic[]>();
for (const entry of grammarTopics) for (const id of entry.lessonIds) byLesson.set(id, [...(byLesson.get(id) ?? []), entry]);

export function grammarTopicsForLesson(id: string): GrammarTopic[] {
  return byLesson.get(id) ?? [];
}

export function grammarSearchTermsForLesson(id: string): string {
  return grammarTopicsForLesson(id).flatMap(entry => [entry.title, entry.description, ...entry.aliases]).join(" ");
}
