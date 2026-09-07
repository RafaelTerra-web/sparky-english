import type { ProductionSupport } from "./types";

// Editorial scaffolds for specific tasks. Models are examples, never grading keys.
export const productionSupport: Record<string, ProductionSupport> = {
  "a1-identidade-01": {
    plan: ["Escolha seu nome ou um nome fictício.", "Escreva uma pergunta com your e uma resposta com my.", "Leia as duas falas como uma conversa."],
    model: "A: What's your name?\nB: My name is Julia.",
    notice: "Your aponta para a pessoa que escuta; my aponta para quem fala. What's e What is servem para a mesma pergunta.",
    transfer: "Feche o modelo, mude o nome e troque os papéis: agora você responde primeiro e pergunta depois.",
  },
  "a1-identidade-02": {
    plan: ["Escolha uma cidade e um país, reais ou fictícios.", "Use I'm from em cada frase.", "Confira as iniciais maiúsculas dos lugares."],
    model: "I'm from Salvador. I'm from Brazil.",
    notice: "From indica origem. A cidade e o país podem aparecer na mesma apresentação; não é preciso traduzir 'sou' com um verbo diferente de be.",
    transfer: "Sem olhar, apresente a origem de outra pessoa com She's from ou He's from. Quem escuta consegue identificar o país?",
  },
  "a2-passado-01": {
    plan: ["Anote três pessoas e onde estavam ontem.", "Use was com I e com uma pessoa; were com duas pessoas.", "Negue uma localização com wasn't ou weren't."],
    model: "I was at home yesterday. Lia and Omar were at the library. They weren't at the cinema.",
    notice: "A mesma referência de tempo vale para as três frases. Were acompanha o sujeito plural; weren't nega uma localização sem adicionar did.",
    transfer: "Transforme uma frase em pergunta e responda sem consultar o modelo: Were Lia and Omar at home?",
  },
  "a2-passado-02": {
    plan: ["Escolha três ações terminadas: clean, watch e visit, por exemplo.", "Marque o tempo com yesterday ou last night.", "Forme o passado e confira se a frase mantém sujeito e complemento."],
    model: "Yesterday, I cleaned my room. I visited my grandmother in the afternoon. I watched a film at night.",
    notice: "Cleaned, visited e watched mantêm a mesma forma com I ou she. Os finais escritos são parecidos, mas visited tem uma sílaba extra no -ed.",
    transfer: "Troque I por she e reconte duas ações de memória. O passado muda? Explique sua decisão antes de conferir a regra.",
  },
  "b1-narrativas-01": {
    plan: ["Escolha dois hábitos antigos que mudaram.", "Para cada hábito, escreva uma frase com used to e outra sobre o presente.", "Confira se ficou claro o que deixou de acontecer."],
    model: "I used to take the bus to work. Now I walk because my office is nearby. I used to buy lunch every day. These days, I bring food from home.",
    notice: "As duas comparações têm passado e presente explícitos. Because acrescenta uma razão sem transformar o relato em uma lista de estruturas.",
    transfer: "Um colega pergunta Did you use to drive? Responda oralmente e acrescente uma informação que não estava no texto.",
  },
  "b1-narrativas-02": {
    plan: ["Faça uma linha do tempo com dois acontecimentos.", "Use had + particípio para o acontecimento anterior.", "Conte a chegada e uma consequência concreta do atraso."],
    model: "When we arrived at the station, the train had already left. We checked the timetable and waited for the next one.",
    notice: "A saída do trem aconteceu antes da chegada. Depois, checked e waited fazem a história avançar; não é necessário repetir had em cada ação.",
    transfer: "Reconte a história começando pela saída do trem. Explique quais marcas ainda ajudam o ouvinte a entender a ordem.",
  },
  "b2-argumentacao-01": {
    plan: ["Abra com a recomendação: manter, ampliar ou encerrar o teste.", "Separe vendas observadas de efeitos ainda desconhecidos em dias úteis.", "Inclua entregas, acessibilidade e a evidência que mudaria sua decisão."],
    model: "I recommend extending the trial rather than making the scheme permanent now. Although Saturday sales rose, four weekends cannot show the effect on weekday deliveries. Replacement accessible spaces should be a condition of the next phase.",
    notice: "Este trecho abre a resposta, mas não substitui as 180–220 palavras. A concessão reconhece o benefício; a condição de acessibilidade torna a recomendação executável.",
    transfer: "Finalize com um critério de decisão verificável, sem inventar resultados. Depois explique a recomendação a um lojista preocupado com entregas.",
  },
  "b2-argumentacao-02": {
    plan: ["Registre apenas a observação: houve menos estresse relatado.", "Compare o horário flexível com o fim do projeto e a chegada dos assistentes.", "Proponha uma comparação e explique uma limitação que ela ainda teria."],
    model: "Reported stress fell after flexible starting times were introduced. However, the project also ended and assistants joined the team. Any of these changes may have contributed, so the timing alone cannot establish which factor mattered most.",
    notice: "O trecho distingue a sequência observada da explicação causal. May have contributed mantém uma hipótese possível sem afirmar que todas as causas têm o mesmo peso.",
    transfer: "Acrescente uma proposta de coleta de dados em período intenso. Termine dizendo o que essa comparação permitiria concluir e o que continuaria incerto.",
  },
  "c1-sintese-01": {
    plan: ["Monte duas colunas: o que cada relatório mediu e o que encontrou.", "Organize a síntese por acesso e participação, cruzando as fontes em cada tema.", "Delimite uma recomendação e identifique explicitamente sua inferência."],
    model: "The reports address different dimensions of participation. Loaned laptops were associated with greater satisfaction in Report A, whereas Report B found no improvement in completion. Taken together, these findings suggest that access to equipment may improve the learning experience without resolving constraints on study time.",
    notice: "O parágrafo não transforma satisfação em conclusão nem trata os programas como idênticos. Taken together marca a passagem dos resultados para a inferência do redator. Desenvolva as limitações no restante da síntese.",
    transfer: "Revise a frase mais forte do seu texto: ela continuaria defensável se um gestor lesse apenas esse trecho? Acrescente o limite necessário.",
  },
  "c1-sintese-02": {
    plan: ["Separe observação, explicação plausível e possibilidade não descartada.", "Associe cada grau de certeza a uma evidência ou lacuna do caso.", "Conclua com a informação necessária para distinguir as hipóteses."],
    model: "Recorded enquiries declined, while attendance remained stable. The reporting change may account for part of the decline, since telephone calls were no longer entered in the database. A genuine fall in interest cannot be ruled out, but the missing call figures prevent a reliable estimate of its size.",
    notice: "A primeira frase apresenta observações; may account for propõe uma explicação; cannot be ruled out mantém uma possibilidade aberta. Nenhuma dessas escolhas afirma que a queda real seja provável.",
    transfer: "Reescreva a conclusão para um gestor que pede uma resposta definitiva. Diga claramente o que ele pode decidir agora e qual pergunta permanece sem resposta.",
  },
  "c2-estilo-cultura-01": {
    plan: ["Use o título fornecido na lição ou selecione outro com contexto suficiente.", "Separe o eco reconhecível, a transformação lexical e o efeito no público.", "Teste uma leitura que não dependa de reconhecer a fonte e delimite a intenção que você pode atribuir."],
    model: "The addition of 'at Market Rate' recasts private space as a purchasable privilege. Readers who recognise the earlier title may hear an additional tension between independence and exclusion; those who do not can still perceive the conflict between an ideal and its price. Neither response establishes the author's full intention.",
    notice: "Este trecho demonstra uma comparação de leituras, não uma análise completa. Cada efeito se apoia em uma escolha do título; o limite final impede que repertório do crítico seja tratado como intenção comprovada.",
    transfer: "Crie um título alternativo que preserve o conflito sem a alusão. Explique, em inglês, o que se perde e para qual público a versão pode funcionar melhor.",
  },
  "c2-estilo-cultura-02": {
    plan: ["Marque quem pode sustentar cada afirmação: comitê, Mara ou narrador.", "Compare a certeza das frases iniciais com a fila observada.", "Teste a hipótese de endosso literal e explique qual detalhe a enfraquece."],
    model: "The opening certainty belongs most plausibly to the committee's account, filtered through a sceptical perspective. 'Naturally' can be heard as an echo of institutional confidence, while the queue supplies a quiet counterexample. This tension makes a literal endorsement possible to propose but difficult to sustain.",
    notice: "Most plausibly mantém a atribuição interpretativa. O comentário testa uma alternativa por meio do contraste entre linguagem e cena, sem igualar personagem, narrador e autor.",
    transfer: "Reescreva três frases da cena eliminando a ambiguidade de voz. Depois explique como essa explicitação muda a ironia e o trabalho exigido do leitor.",
  },
};
