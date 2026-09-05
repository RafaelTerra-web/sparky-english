import type { ModuleDraft } from "./types";

export const b1Modules: ModuleDraft[] = [
  {
    id: "b1-narrativas",
    title: "Narrativas com contexto",
    level: "B1",
    description: "Hábitos antigos, anterioridade e relatos mais precisos.",
    lessons: [
      {
        id: "b1-narrativas-01",
        title: "Hábitos antigos com used to",
        rule: "Used to + verbo descreve um hábito ou estado passado que não é mais verdadeiro, ou que se contrasta com o presente. I used to live there destaca essa mudança. Em perguntas e negativas com did, a forma escrita padrão é use to.",
        example: "I used to walk to school every day.",
        translation: "Eu costumava ir a pé para a escola todos os dias.",
        vocabulary:
          "used to — costumava\nno longer — não mais\nnowadays — hoje em dia",
        pitfall:
          "Used to work e be used to working são estruturas diferentes. A segunda significa estar acostumado, não um hábito abandonado.",
        dialogue:
          "Ana: Do you still live near the station?\nBen: No, I used to live there, but now I live near the river.",
        dialogueTranslation:
          "Ana: Você ainda mora perto da estação?\nBen: Não, eu morava lá, mas agora moro perto do rio.",
        question: "O que mudou na vida de Ben?",
        choices: [
          "Where he lives",
          "Where the station is",
          "The name of the river",
        ],
        explanation:
          "Used to live there contrasta a antiga moradia com a atual, perto do rio.",
        gap: "Did you ___ to play tennis?",
        fills: ["use", "used", "using"],
        gapExplanation:
          "Did já marca o passado; a forma escrita padrão é Did you use to…?",
        production:
          "Compare sua rotina atual com uma rotina passada, real ou fictícia, em quatro frases. Use used to duas vezes.",
      },
      {
        id: "b1-narrativas-02",
        title: "Anterior a outro momento passado",
        rule: "Had + particípio forma o past perfect. Ele ajuda a mostrar que uma ação já tinha acontecido antes de outro momento passado: When I arrived, they had left. Não é necessário usá-lo em toda frase de uma história; use quando a anterioridade precisar ficar clara.",
        example: "The film had started before we arrived.",
        translation: "O filme tinha começado antes de chegarmos.",
        vocabulary:
          "by the time — quando/no momento em que\nalready — já\nstarted — começado",
        pitfall:
          "Had went está incorreto: go tem particípio gone. Had combina com particípio, não com qualquer forma de passado.",
        dialogue:
          "Ana: Did you see the opening scene?\nBen: No, the film had started before we found our seats.",
        dialogueTranslation:
          "Ana: Você viu a cena inicial?\nBen: Não, o filme tinha começado antes de encontrarmos nossos lugares.",
        question: "Qual evento aconteceu primeiro?",
        choices: [
          "The film started.",
          "They found their seats.",
          "They discussed the film.",
        ],
        explanation:
          "Had started mostra que o início veio antes de found our seats.",
        gap: "When I called, she had already ___.",
        fills: ["left", "leave", "leaves"],
        gapExplanation: "Left é o particípio de leave e pode seguir had.",
        production:
          "Escreva uma pequena história em que alguém chega tarde porque uma ação já tinha ocorrido. Use past perfect uma vez.",
      },
      {
        id: "b1-narrativas-03",
        title: "Construir o cenário de uma história",
        rule: "O passado contínuo mostra ações em andamento; o simples conduz os acontecimentos principais. While frequentemente liga ações simultâneas. Escolha o foco: I was walking apresenta o cenário; I noticed a wallet apresenta o evento que muda a história.",
        example: "While I was walking home, I noticed a wallet.",
        translation: "Enquanto eu voltava a pé para casa, vi uma carteira.",
        vocabulary:
          "notice — perceber/notar\nwallet — carteira\nmeanwhile — enquanto isso",
        pitfall:
          "Usar contínuo em todos os verbos pode esconder a sequência dos acontecimentos. Separe cenário de evento principal.",
        dialogue:
          "Ana: What happened?\nBen: I was waiting for the bus when a cyclist dropped a wallet. I picked it up and called out.",
        dialogueTranslation:
          "Ana: O que aconteceu?\nBen: Eu esperava o ônibus quando um ciclista deixou cair uma carteira. Peguei e chamei por ele.",
        question: "Qual acontecimento iniciou a reação de Ben?",
        choices: [
          "A cyclist dropped a wallet.",
          "The bus arrived.",
          "Ana called him.",
        ],
        explanation:
          "Dropped a wallet é o evento principal que leva a picked it up e called out.",
        gap: "While they were ___, the alarm rang.",
        fills: ["sleeping", "slept", "sleep"],
        gapExplanation:
          "Were + sleeping descreve a ação em andamento; rang é o evento pontual.",
        production:
          "Escreva cinco frases sobre um objeto perdido: cenário, imprevisto, duas ações e desfecho.",
      },
      {
        id: "b1-narrativas-04",
        title: "Descrever uma atividade que continua",
        rule: "Have/has been + -ing pode destacar a duração de uma atividade iniciada antes e ainda em andamento, ou com sinais recentes. Compare I've read three pages, resultado, com I've been reading for an hour, duração. Verbos de estado como know geralmente ficam no perfect simples.",
        example: "I have been studying for two hours.",
        translation: "Estou estudando há duas horas.",
        vocabulary:
          "for hours — há horas\nlately — ultimamente\nall morning — a manhã toda",
        pitfall:
          "I've been knowing her não é a forma padrão para conhecer alguém; use I've known her. O contínuo não serve para todo verbo.",
        dialogue:
          "Ana: Why are you tired?\nBen: I've been painting the kitchen all morning. I haven't finished yet.",
        dialogueTranslation:
          "Ana: Por que você está cansado?\nBen: Estou pintando a cozinha desde cedo. Ainda não terminei.",
        question: "A cozinha já está totalmente pintada?",
        choices: [
          "No, the work is not finished.",
          "Yes, he finished yesterday.",
          "He has not started.",
        ],
        explanation:
          "Haven't finished yet explicita que a atividade não terminou, embora já esteja acontecendo há algum tempo.",
        gap: "She has been ___ since nine.",
        fills: ["working", "worked", "work"],
        gapExplanation:
          "Has been pede a forma -ing para esse aspecto contínuo.",
        production:
          "Descreva uma atividade em andamento com duração e outra com um resultado quantificado. Compare as formas verbais.",
      },
      {
        id: "b1-narrativas-05",
        title: "Relatar o que alguém disse",
        rule: "Em relatos, said introduz o que foi dito; told normalmente precisa de destinatário: told me. Ao relatar de um ponto passado, os tempos frequentemente recuam: 'I am tired' → She said she was tired. Esse recuo depende do contexto, especialmente se a informação continua válida.",
        example: "She said she was tired.",
        translation: "Ela disse que estava cansada.",
        vocabulary:
          "say / said — dizer/disse\ntell / told — contar/contou\nreport — relatar",
        pitfall:
          "She told that… omite o destinatário esperado. Use She told me that… ou She said that…",
        dialogue:
          "Ana: What did Leo say yesterday?\nBen: He said he was busy and he couldn't join us.",
        dialogueTranslation:
          "Ana: O que Leo disse ontem?\nBen: Disse que estava ocupado e não poderia se juntar a nós.",
        question: "Por que Leo não poderia participar?",
        choices: ["He was busy.", "He was lost.", "He had no invitation."],
        explanation:
          "Was busy é a razão relatada; couldn't join us é a consequência.",
        gap: "She ___ me she was leaving.",
        fills: ["told", "said", "spoke"],
        gapExplanation:
          "Told pode receber me diretamente. Said exigiria said to me nessa estrutura.",
        production:
          "Escreva duas falas fictícias e depois relate cada uma com said ou told me. Ajuste os pronomes.",
      },
      {
        id: "b1-narrativas-06",
        title: "Habilidade passada e sucesso específico",
        rule: "Could descreve habilidade geral no passado: I could swim at six. Was/were able to pode destacar o sucesso de uma ação específica. Managed to indica que houve dificuldade, mas a ação foi concluída. Couldn't pode negar tanto habilidade quanto sucesso em um caso.",
        example: "We managed to catch the last train.",
        translation: "Conseguimos pegar o último trem.",
        vocabulary:
          "manage to — conseguir, apesar da dificuldade\nable to — capaz de/conseguir\nattempt — tentativa",
        pitfall:
          "Para um sucesso específico e difícil, managed to comunica mais do que uma habilidade geral com could.",
        dialogue:
          "Ana: Did you miss the train?\nBen: Almost! We ran and managed to get on before the doors closed.",
        dialogueTranslation:
          "Ana: Vocês perderam o trem?\nBen: Quase! Corremos e conseguimos entrar antes que as portas fechassem.",
        question: "Eles conseguiram embarcar?",
        choices: [
          "Yes, just before the doors closed.",
          "No, they missed it.",
          "Yes, hours before departure.",
        ],
        explanation:
          "Managed to get on confirma o sucesso, apesar da dificuldade indicada por Almost.",
        gap: "After several tries, she managed ___ open it.",
        fills: ["to", "for", "of"],
        gapExplanation: "Manage é seguido de to + verbo: managed to open.",
        production:
          "Conte uma pequena dificuldade que terminou bem. Use managed to para o sucesso e explique o obstáculo.",
      },
    ],
  },
  {
    id: "b1-argumentos",
    title: "Opiniões e argumentos",
    level: "B1",
    legacyId: "b1-5-1",
    description:
      "Justificar, contrastar, exemplificar e discordar com respeito.",
    lessons: [
      {
        id: "b1-argumentos-01",
        title: "Concordar parcialmente",
        rule: "I agree aceita uma opinião; I see your point reconhece o argumento sem necessariamente aceitar tudo. Acrescente but para uma ressalva e uma razão concreta. Evite interpretar uma expressão cortês como concordância completa.",
        example: "I see your point, but the cost is high.",
        translation: "Entendo seu ponto, mas o custo é alto.",
        vocabulary:
          "point — argumento/ponto\nagree — concordar\nconcern — preocupação",
        pitfall:
          "I am agree está incorreto: agree é verbo. Use I agree ou I don't agree.",
        dialogue:
          "Ana: We should buy the cheapest printer.\nBen: I see your point, but its ink is expensive. Running costs matter too.",
        dialogueTranslation:
          "Ana: Devíamos comprar a impressora mais barata.\nBen: Entendo seu ponto, mas a tinta é cara. Os custos de uso também importam.",
        question: "Qual é a ressalva de Ben?",
        choices: [
          "The ink is expensive.",
          "The printer is too large.",
          "There is no electricity.",
        ],
        explanation:
          "Ben reconhece o preço inicial, mas traz o custo da tinta para a comparação.",
        gap: "I ___ with your main argument.",
        fills: ["agree", "am agree", "agreement"],
        gapExplanation: "Agree funciona como verbo e não precisa de am.",
        production:
          "Responda a uma proposta: reconheça um ponto positivo, faça uma ressalva e dê uma razão.",
      },
      {
        id: "b1-argumentos-02",
        title: "Contraste com although",
        rule: "Although introduz uma oração de contraste: Although it was late, we stayed. But liga ideias contrastantes de outra forma. Em uma construção simples, não é necessário usar although e but juntos para marcar o mesmo contraste.",
        example: "Although it was expensive, we chose the train.",
        translation: "Embora fosse caro, escolhemos o trem.",
        vocabulary: "although — embora\nhowever — porém\ndespite — apesar de",
        pitfall:
          "Depois de although, use uma oração com sujeito e verbo. Despite normalmente pede substantivo ou -ing; não os troque sem ajustar a estrutura.",
        dialogue:
          "Ana: Was the walk difficult?\nBen: Although it was long, we enjoyed it. The views were worth it.",
        dialogueTranslation:
          "Ana: A caminhada foi difícil?\nBen: Embora tenha sido longa, gostamos. As vistas valeram a pena.",
        question: "Como Ben avalia a caminhada no conjunto?",
        choices: [
          "Enjoyable despite its length",
          "Short and boring",
          "Cancelled because of the views",
        ],
        explanation:
          "Enjoyed it expressa a avaliação positiva; although reconhece a extensão da caminhada.",
        gap: "___ it rained, the event continued.",
        fills: ["Although", "Despite", "Because of"],
        gapExplanation:
          "It rained é oração completa, compatível com although; despite pediria outra construção.",
        production:
          "Escreva duas frases com although que combinem uma dificuldade e um resultado positivo.",
      },
      {
        id: "b1-argumentos-03",
        title: "Dar exemplos que sustentam a ideia",
        rule: "For example introduz um exemplo; such as apresenta itens de uma categoria. Um exemplo ilustra uma afirmação, mas não prova sozinho uma generalização. Deixe clara a ligação entre a ideia e o caso apresentado.",
        example: "I enjoy outdoor activities such as hiking.",
        translation: "Gosto de atividades ao ar livre, como trilhas.",
        vocabulary:
          "such as — como, por exemplo\nfor instance — por exemplo\nevidence — evidência/indício",
        pitfall:
          "Actually não significa atualmente. Para situação atual, use currently; actually costuma corrigir ou esclarecer algo.",
        dialogue:
          "Ana: How can we reduce waste?\nBen: We can reuse containers. For example, I take the same lunch box to work every day.",
        dialogueTranslation:
          "Ana: Como podemos reduzir resíduos?\nBen: Podemos reutilizar recipientes. Por exemplo, levo a mesma marmita ao trabalho todos os dias.",
        question: "Qual ideia o exemplo da marmita ilustra?",
        choices: [
          "Reusing containers",
          "Buying lunch daily",
          "Working fewer days",
        ],
        explanation:
          "A marmita reutilizada concretiza reuse containers; não informa compra diária de comida.",
        gap: "I like sports ___ tennis and swimming.",
        fills: ["such as", "because", "although"],
        gapExplanation: "Such as introduz exemplos da categoria sports.",
        production:
          "Escreva uma opinião sobre estudos e dois exemplos concretos que a sustentem, sem dizer que se aplicam a todas as pessoas.",
      },
      {
        id: "b1-argumentos-04",
        title: "Ponderar vantagens e desvantagens",
        rule: "One advantage is… apresenta um benefício; one drawback is… aponta uma limitação. On the other hand sinaliza outra perspectiva. Uma conclusão útil relaciona os critérios à situação, em vez de afirmar que uma escolha é sempre superior.",
        example: "One advantage of cycling is the low cost.",
        translation: "Uma vantagem de pedalar é o baixo custo.",
        vocabulary:
          "advantage — vantagem\ndrawback — desvantagem/limitação\ntrade-off — concessão entre benefícios",
        pitfall:
          "On the other hand não exige que a primeira parte diga on the one hand, mas deve trazer uma perspectiva contrastante real.",
        dialogue:
          "Ana: Working from home saves travel time.\nBen: True. On the other hand, a quiet workspace can be difficult to find.",
        dialogueTranslation:
          "Ana: Trabalhar de casa economiza tempo de deslocamento.\nBen: Verdade. Por outro lado, pode ser difícil encontrar um espaço silencioso.",
        question: "Qual dificuldade Ben acrescenta?",
        choices: [
          "Finding a quiet workspace",
          "Travelling more often",
          "Paying for a train",
        ],
        explanation:
          "Ben contrapõe ao ganho de tempo uma possível limitação do espaço em casa.",
        gap: "One ___ is the lack of space. (desvantagem)",
        fills: ["drawback", "advantage", "benefit"],
        gapExplanation:
          "Drawback corresponde a uma limitação, enquanto advantage e benefit indicam pontos positivos.",
        production:
          "Compare estudar sozinho e em grupo em um parágrafo com uma vantagem, uma desvantagem e uma escolha contextualizada.",
      },
      {
        id: "b1-argumentos-05",
        title: "Recomendar com um critério",
        rule: "Recommend pode ser seguido de -ing: I recommend booking early. Também pode introduzir uma oração: I recommend that you book early. Uma recomendação fica mais útil quando menciona objetivo, restrição e razão.",
        example: "I recommend booking your tickets early.",
        translation: "Recomendo reservar suas passagens com antecedência.",
        vocabulary:
          "recommend — recomendar\nsuitable — adequado\nreliable — confiável",
        pitfall:
          "I recommend you to book não é o padrão trabalhado. Use I recommend booking ou I recommend that you book.",
        dialogue:
          "Ana: Which course is suitable for my schedule?\nBen: Since you work in the morning, I recommend the evening class.",
        dialogueTranslation:
          "Ana: Qual curso é adequado à minha agenda?\nBen: Como você trabalha de manhã, recomendo a turma noturna.",
        question: "Qual critério fundamenta a recomendação?",
        choices: [
          "Ana's work schedule",
          "The teacher's age",
          "The classroom colour",
        ],
        explanation:
          "A recomendação se baseia no trabalho de manhã, não em preferências sem contexto.",
        gap: "I recommend ___ the instructions first.",
        fills: ["reading", "read", "to reading"],
        gapExplanation:
          "Recommend pode receber diretamente a forma -ing: reading.",
        production:
          "Recomende uma atividade para alguém com pouco tempo disponível. Explique como sua indicação atende à restrição.",
      },
      {
        id: "b1-argumentos-06",
        title: "Fato, opinião e grau de certeza",
        rule: "I think marca uma avaliação pessoal; according to identifica a fonte de uma informação. Might e probably indicam incerteza em graus diferentes, sem garantir o resultado. Separe o dado observado da interpretação que você faz dele.",
        example: "According to the timetable, the train leaves at nine.",
        translation: "Segundo a tabela de horários, o trem sai às nove.",
        vocabulary:
          "according to — segundo/de acordo com\nprobably — provavelmente\nclaim — afirmação",
        pitfall:
          "According to me não é a maneira usual de introduzir uma opinião pessoal. Use in my opinion ou I think.",
        dialogue:
          "Ana: The timetable says the bus takes forty minutes.\nBen: Then the train might be faster, but we should compare both timetables.",
        dialogueTranslation:
          "Ana: A tabela diz que o ônibus leva quarenta minutos.\nBen: Então o trem talvez seja mais rápido, mas deveríamos comparar os dois horários.",
        question: "O que é uma hipótese, e não um dado confirmado no texto?",
        choices: [
          "The train might be faster.",
          "The bus timetable says forty minutes.",
          "They should compare timetables.",
        ],
        explanation:
          "Might marca a velocidade relativa como hipótese. O tempo do ônibus é atribuído à tabela.",
        gap: "___ my opinion, this is more practical.",
        fills: ["In", "According", "At"],
        gapExplanation:
          "A expressão convencional é In my opinion. According to serve para atribuir uma informação a outra fonte.",
        production:
          "Escreva três frases sobre um curso fictício: um dado atribuído a uma fonte, uma opinião e uma hipótese claramente marcada.",
      },
    ],
  },
  {
    id: "b1-hipoteses",
    title: "Hipóteses e decisões",
    level: "B1",
    description:
      "Possibilidades, situações imaginárias e condições explícitas.",
    lessons: [
      {
        id: "b1-hipoteses-01",
        title: "Possibilidades com may e might",
        rule: "May e might + verbo indicam possibilidade, sem afirmar certeza. Might frequentemente soa mais cauteloso, mas a diferença não é uma porcentagem fixa. Para dizer talvez no início, use maybe; may be são duas palavras com funções diferentes.",
        example: "We might change the date of the meeting.",
        translation: "Talvez mudemos a data da reunião.",
        vocabulary:
          "might — talvez possa/possa vir a\nmaybe — talvez\npossible — possível",
        pitfall:
          "Might to change está incorreto: use might change. Não traduza toda frase com might como certeza futura.",
        dialogue:
          "Ana: Is Lia joining us?\nBen: She might come, but she hasn't confirmed yet.",
        dialogueTranslation:
          "Ana: Lia vai se juntar a nós?\nBen: Talvez venha, mas ainda não confirmou.",
        question: "A presença de Lia está confirmada?",
        choices: [
          "No, it is still uncertain.",
          "Yes, definitely.",
          "No, she definitely refused.",
        ],
        explanation:
          "Might e hasn't confirmed mostram incerteza, não confirmação nem recusa definitiva.",
        gap: "It ___ rain later; take a coat just in case.",
        fills: ["might", "mustn't", "has to"],
        gapExplanation:
          "Might expressa a possibilidade de chuva nesse aviso cauteloso.",
        production:
          "Descreva dois planos ainda incertos usando may/might e uma frase com maybe.",
      },
      {
        id: "b1-hipoteses-02",
        title: "Deduzir a partir de indícios",
        rule: "Must pode expressar uma dedução forte: She must be tired. Can't pode indicar que algo parece impossível diante dos indícios. Might expressa uma possibilidade mais fraca. Essas formas não transformam uma dedução em fato comprovado.",
        example: "He must be tired after that long journey.",
        translation: "Ele deve estar cansado depois dessa longa viagem.",
        vocabulary:
          "clue — indício\ncertain — certo/seguro\njourney — viagem/trajeto",
        pitfall:
          "Must be tired é uma dedução, não uma ordem para ficar cansado. O contexto define se must indica obrigação ou conclusão.",
        dialogue:
          "Ana: Ben has worked all night and is yawning.\nLia: He must be tired. Let's ask if he needs a break.",
        dialogueTranslation:
          "Ana: Ben trabalhou a noite toda e está bocejando.\nLia: Deve estar cansado. Vamos perguntar se precisa de uma pausa.",
        question: "Em que Lia baseia sua dedução?",
        choices: [
          "He worked all night and is yawning.",
          "He said he was on holiday.",
          "He bought a coffee yesterday.",
        ],
        explanation:
          "A dedução usa os indícios apresentados, sem alegar acesso ao estado interno de Ben.",
        gap: "This ___ be my bag; mine is red and this one is blue.",
        fills: ["can't", "must", "has to"],
        gapExplanation:
          "A diferença de cor sustenta a conclusão negativa can't be.",
        production:
          "Crie uma cena com dois indícios e uma dedução usando must ou can't. Deixe claro o que é observação e o que é conclusão.",
      },
      {
        id: "b1-hipoteses-03",
        title: "Situações imaginárias com would",
        rule: "O segundo condicional usa if + passado e would + verbo para situações imaginárias ou pouco prováveis no presente/futuro. O passado aqui marca distância da realidade, não necessariamente tempo passado. If I were you é uma expressão comum para conselho.",
        example: "If I had more time, I would learn Italian.",
        translation: "Se eu tivesse mais tempo, aprenderia italiano.",
        vocabulary:
          "would — marca resultado hipotético\nimagine — imaginar\nopportunity — oportunidade",
        pitfall:
          "If I would have more time não é a forma padrão desta condição. Would fica no resultado: I would learn.",
        dialogue:
          "Ana: What would you do with a free month?\nBen: If I had a month off, I would visit my grandparents.",
        dialogueTranslation:
          "Ana: O que faria com um mês livre?\nBen: Se tivesse um mês de folga, visitaria meus avós.",
        question: "A visita é apresentada como plano já marcado?",
        choices: [
          "No, it is hypothetical.",
          "Yes, for next Monday.",
          "Yes, it happened last month.",
        ],
        explanation:
          "If I had e would visit constroem uma situação imaginada, sem data confirmada.",
        gap: "If I lived closer, I ___ walk to work.",
        fills: ["would", "will", "am"],
        gapExplanation:
          "Lived na condição imaginária combina com would walk no resultado.",
        production:
          "Escreva duas decisões imaginárias: uma se tivesse mais tempo e outra se morasse em outra cidade.",
      },
      {
        id: "b1-hipoteses-04",
        title: "Possível ou imaginário?",
        rule: "O primeiro condicional apresenta uma possibilidade concreta: If I finish early, I'll call. O segundo apresenta uma situação mais distante ou imaginária: If I had a car, I'd drive. A escolha depende da perspectiva do falante, não apenas de palavras isoladas.",
        example: "If I finish early, I will call you.",
        translation: "Se eu terminar cedo, vou ligar para você.",
        vocabulary:
          "likely — provável\nunlikely — improvável\ncondition — condição",
        pitfall:
          "Não use o segundo condicional apenas porque a frase contém 'se'. Pergunte se o falante está discutindo um plano possível ou imaginando outra realidade.",
        dialogue:
          "Ana: If the shop is open, I'll buy bread on my way home.\nBen: If I had a car, I'd give you a lift, but I don't.",
        dialogueTranslation:
          "Ana: Se a loja estiver aberta, comprarei pão na volta.\nBen: Se eu tivesse carro, te daria carona, mas não tenho.",
        question: "Qual situação é explicitamente contrária à realidade atual?",
        choices: ["Ben having a car", "The shop being open", "Ana going home"],
        explanation:
          "But I don't confirma que Ben não tem carro; a abertura da loja permanece uma condição possível.",
        gap: "If the weather is good, we ___ go hiking tomorrow.",
        fills: ["will", "would", "were"],
        gapExplanation:
          "A condição realista no presente is usa will no resultado futuro.",
        production:
          "Escreva duas condições sobre viagens: uma possibilidade para amanhã e uma situação imaginária. Explique em português a diferença.",
      },
      {
        id: "b1-hipoteses-05",
        title: "Unless e condições negativas",
        rule: "Unless significa 'a menos que' e costuma equivaler a if…not. We'll miss it unless we leave now significa que sair agora é a condição para evitar perder. Evite acrescentar not automaticamente, pois isso pode inverter o sentido.",
        example: "We will miss the bus unless we leave now.",
        translation: "Vamos perder o ônibus se não sairmos agora.",
        vocabulary:
          "unless — a menos que/se não\navoid — evitar\notherwise — caso contrário",
        pitfall:
          "Unless we don't leave now troca a condição. Primeiro reescreva como if we don't leave now para conferir o sentido pretendido.",
        dialogue:
          "Ana: Can we finish the project on time?\nBen: Not unless we divide the tasks. There is too much for one person.",
        dialogueTranslation:
          "Ana: Podemos terminar o projeto no prazo?\nBen: Não, a menos que dividamos as tarefas. É trabalho demais para uma pessoa.",
        question: "Qual condição Ben considera necessária?",
        choices: [
          "Dividing the tasks",
          "Giving all tasks to one person",
          "Cancelling the deadline",
        ],
        explanation:
          "Unless we divide the tasks apresenta a condição que permite cumprir o prazo.",
        gap: "Unless she ___ soon, we'll start without her.",
        fills: ["arrives", "will arrive", "arriving"],
        gapExplanation:
          "Assim como if nessa estrutura, unless usa presente para a condição futura.",
        production:
          "Escreva uma condição com unless e reescreva com if…not. Verifique se o sentido foi preservado.",
      },
      {
        id: "b1-hipoteses-06",
        title: "Expressar preferência com would rather",
        rule: "Would rather + verbo base expressa preferência: I'd rather stay. Para comparar ações, use than: I'd rather walk than wait. A negativa coloca not antes do verbo: I'd rather not go. Essa forma não usa to depois de rather.",
        example: "I would rather walk than wait for a taxi.",
        translation: "Eu preferiria ir a pé a esperar um táxi.",
        vocabulary:
          "rather — preferencialmente, na expressão\ninstead — em vez disso\nchoice — escolha",
        pitfall:
          "I'd rather to walk está incorreto neste modelo. Compare prefer to walk, que usa outra estrutura.",
        dialogue:
          "Ana: Shall we order food or cook?\nBen: I'd rather cook. We have fresh vegetables and enough time.",
        dialogueTranslation:
          "Ana: Vamos pedir comida ou cozinhar?\nBen: Prefiro cozinhar. Temos legumes frescos e tempo suficiente.",
        question: "Que opção Ben prefere e por quê?",
        choices: [
          "Cooking, because they have ingredients and time",
          "Ordering, because they have no time",
          "Skipping dinner, because there is no food",
        ],
        explanation:
          "I'd rather cook informa a preferência; a frase seguinte traz duas razões.",
        gap: "I'd rather ___ at home tonight.",
        fills: ["stay", "to stay", "staying"],
        gapExplanation:
          "Would rather é seguido do verbo base stay, sem to nem -ing, para expressar essa preferência.",
        production:
          "Compare duas formas de passar uma noite livre com would rather…than. Acrescente uma razão.",
      },
    ],
  },
  {
    id: "b1-precisao",
    title: "Frases mais precisas",
    level: "B1",
    description:
      "Referências, voz passiva, padrões verbais e relações entre ideias.",
    lessons: [
      {
        id: "b1-precisao-01",
        title: "Identificar pessoas e coisas",
        rule: "Orações relativas acrescentam informação para identificar um nome. Who retoma pessoas; which retoma coisas; that pode substituir ambos em muitas relativas restritivas. The person who called identifica qual pessoa, sem abrir uma nova frase.",
        example: "She is the colleague who helped me yesterday.",
        translation: "Ela é a colega que me ajudou ontem.",
        vocabulary:
          "who — que, para pessoas\nwhich — que, para coisas\ncolleague — colega de trabalho",
        pitfall:
          "The person who she called me duplica o sujeito se a intenção é 'a pessoa que me ligou'. Use the person who called me.",
        dialogue:
          "Ana: Which bag is yours?\nBen: The one that has a yellow label. The black one belongs to Leo.",
        dialogueTranslation:
          "Ana: Qual bolsa é sua?\nBen: A que tem uma etiqueta amarela. A preta pertence ao Leo.",
        question: "Como identificar a bolsa de Ben?",
        choices: [
          "It has a yellow label.",
          "It is the black one.",
          "It has no label.",
        ],
        explanation:
          "That has a yellow label restringe e identifica a bolsa correta.",
        gap: "I know the person ___ lives next door.",
        fills: ["who", "where", "when"],
        gapExplanation: "Who retoma person e funciona como sujeito de lives.",
        production:
          "Descreva uma pessoa e um objeto sem dizer seus nomes, usando who e which/that para identificá-los.",
      },
      {
        id: "b1-precisao-02",
        title: "Dar foco ao que recebe a ação",
        rule: "A voz passiva usa be + particípio: The room is cleaned daily. Ela é útil quando o agente não é conhecido ou não é o foco. By pode introduzir o agente quando importa: written by Ana. O tempo é marcado em be, não no particípio.",
        example: "The library is cleaned every morning.",
        translation: "A biblioteca é limpa todas as manhãs.",
        vocabulary:
          "made — feito\nwritten — escrito\nby — por, agente da passiva",
        pitfall:
          "Is clean descreve estado com adjetivo; is cleaned descreve a ação de limpar. Não são exatamente a mesma informação.",
        dialogue:
          "Visitor: Who makes these cups?\nGuide: They are made by local artists and sold in the museum shop.",
        dialogueTranslation:
          "Visitante: Quem faz estas xícaras?\nGuia: São feitas por artistas locais e vendidas na loja do museu.",
        question: "Quem produz as xícaras?",
        choices: ["Local artists", "Museum visitors", "Foreign factories"],
        explanation: "By local artists identifica os agentes da produção.",
        gap: "These bags are ___ from recycled fabric.",
        fills: ["made", "make", "making"],
        gapExplanation:
          "A passiva exige are + particípio made. Make é a base do verbo, e making é a forma -ing.",
        production:
          "Descreva como três objetos são produzidos ou usados. Inclua o agente com by em apenas uma frase, quando for relevante.",
      },
      {
        id: "b1-precisao-03",
        title: "Notícias na voz passiva",
        rule: "No passado, a passiva usa was/were + particípio. The road was closed destaca a estrada e o evento, não quem fechou. Escolha singular/plural pelo sujeito. Uma notícia curta pode combinar o evento com data e motivo.",
        example: "The bridge was opened last year.",
        translation: "A ponte foi inaugurada no ano passado.",
        vocabulary: "bridge — ponte\nrepair — consertar\nannounce — anunciar",
        pitfall:
          "Was opened e was open diferem: foi aberta/inaugurada versus estava aberta. A terminação muda o significado.",
        dialogue:
          "News: The road was closed on Monday because of repairs. It was reopened on Wednesday morning.",
        dialogueTranslation:
          "Notícia: A estrada foi fechada na segunda para reparos. Foi reaberta na quarta de manhã.",
        question: "Quando a estrada voltou a abrir?",
        choices: ["Wednesday morning", "Monday morning", "Tuesday night"],
        explanation:
          "Was reopened marca a reabertura, na quarta de manhã. Monday é a data do fechamento.",
        gap: "The windows ___ replaced yesterday.",
        fills: ["were", "was", "are"],
        gapExplanation:
          "Windows é plural e yesterday situa no passado: were replaced.",
        production:
          "Escreva uma notícia fictícia de três frases sobre uma praça reformada: fechamento, reforma e reabertura.",
      },
      {
        id: "b1-precisao-04",
        title: "Verbos seguidos de -ing ou to",
        rule: "Alguns verbos pedem -ing depois, como enjoy e avoid. Outros costumam pedir to + verbo, como decide e hope. Aprenda o par: enjoy reading, decide to leave. O sentido de alguns verbos muda conforme o padrão; não aplique uma regra única a todos.",
        example: "We decided to leave before lunch.",
        translation: "Decidimos sair antes do almoço.",
        vocabulary:
          "avoid — evitar\ndecide — decidir\nhope — esperar/ter esperança",
        pitfall:
          "Enjoy to read não segue o padrão de enjoy. Use enjoy reading. Não escolha o complemento apenas porque o português usa infinitivo.",
        dialogue:
          "Ana: Did you enjoy learning online?\nBen: Yes, and I decided to take another course.",
        dialogueTranslation:
          "Ana: Você gostou de estudar on-line?\nBen: Sim, e decidi fazer outro curso.",
        question: "Qual decisão Ben tomou?",
        choices: [
          "Take another course",
          "Stop learning online",
          "Teach the same course",
        ],
        explanation:
          "Decided to take another course indica a nova decisão, além da avaliação positiva da experiência.",
        gap: "She avoids ___ late.",
        fills: ["arriving", "to arrive", "arrive"],
        gapExplanation:
          "Avoid é seguido de -ing: avoids arriving. O infinitivo com to não é o complemento desse verbo aqui.",
        production:
          "Escreva quatro frases usando enjoy, avoid, decide e hope. Confira o padrão que vem depois de cada verbo.",
      },
      {
        id: "b1-precisao-05",
        title: "Verbos com partículas",
        rule: "Phrasal verbs combinam verbo e partícula, e o significado pode não ser literal: look after é cuidar de. Alguns se separam: turn off the light/turn the light off. Com pronome nesse caso, ele fica no meio: turn it off. Outros, como look after, não separam.",
        example: "Please turn it off before you leave.",
        translation: "Por favor, desligue isso antes de sair.",
        vocabulary:
          "turn off — desligar\nlook after — cuidar de\npick up — buscar/pegar",
        pitfall:
          "Turn off it não é a ordem padrão com pronome. Use turn it off. Não transfira essa separação para todos os phrasal verbs.",
        dialogue:
          "Ana: Can you look after my cat this weekend?\nBen: Of course. I'll pick up the keys on Friday.",
        dialogueTranslation:
          "Ana: Pode cuidar do meu gato neste fim de semana?\nBen: Claro. Vou buscar as chaves na sexta.",
        question: "Qual favor Ana pede?",
        choices: ["Care for her cat", "Turn off a light", "Buy new keys"],
        explanation:
          "Look after my cat significa cuidar do gato. Buscar as chaves é uma etapa para esse favor.",
        gap: "The music is loud. Please turn ___ down.",
        fills: ["it", "them", "he"],
        gapExplanation:
          "Music é singular/não contável e é retomado por it, no meio de turn…down.",
        production:
          "Escreva uma instrução com turn off usando um nome e reescreva com it. Depois faça um pedido com look after.",
      },
      {
        id: "b1-precisao-06",
        title: "Preposições depois de adjetivos",
        rule: "Alguns adjetivos costumam se combinar com preposições específicas: interested in, good at, worried about. Após a preposição, um verbo costuma aparecer em -ing: interested in learning. Memorize a expressão completa em contexto.",
        example: "She is interested in learning photography.",
        translation: "Ela tem interesse em aprender fotografia.",
        vocabulary:
          "interested in — interessado em\ngood at — bom em\nworried about — preocupado com",
        pitfall:
          "Interested on copia uma combinação inadequada. A preposição não vem de uma tradução palavra por palavra do português.",
        dialogue:
          "Ana: Are you worried about the presentation?\nBen: A little. I'm good at writing, but speaking to a group is new to me.",
        dialogueTranslation:
          "Ana: Você está preocupado com a apresentação?\nBen: Um pouco. Sou bom em escrever, mas falar para um grupo é novo para mim.",
        question: "Qual habilidade Ben reconhece como ponto forte?",
        choices: ["Writing", "Speaking to groups", "Photography"],
        explanation:
          "Good at writing identifica o ponto forte; falar em grupo ainda é uma experiência nova.",
        gap: "He is interested ___ joining the club.",
        fills: ["in", "on", "at"],
        gapExplanation:
          "A combinação é interested in, seguida aqui de joining.",
        production:
          "Descreva um interesse, uma habilidade e uma preocupação usando interested in, good at e worried about.",
      },
    ],
  },
  {
    id: "b1-colaboracao",
    title: "Colaboração e resolução de problemas",
    level: "B1",
    legacyId: "b1-6-1",
    description: "Esclarecer, negociar prazos, resumir e manter a conversa.",
    lessons: [
      {
        id: "b1-colaboracao-01",
        title: "Perguntas indiretas",
        rule: "Could you tell me…? torna uma pergunta mais indireta. Depois dessa abertura, use a ordem de afirmação: where the office is, não where is the office. Para perguntas de sim/não, introduza if ou whether: Do you know if it's open?",
        example: "Could you tell me where the office is?",
        translation: "Você poderia me dizer onde fica o escritório?",
        vocabulary:
          "whether — se, em pergunta indireta\nI wonder — gostaria de saber/me pergunto\npolite — cortês",
        pitfall:
          "Could you tell me where is the office? mantém a inversão no trecho errado. A inversão já está em Could you.",
        dialogue:
          "Ana: Do you know if the library is open on Sunday?\nBen: Yes, but only until noon.",
        dialogueTranslation:
          "Ana: Você sabe se a biblioteca abre no domingo?\nBen: Sim, mas só até meio-dia.",
        question: "Qual limite de funcionamento Ben informa?",
        choices: [
          "It closes at noon on Sunday.",
          "It opens at midnight.",
          "It is closed all Sunday.",
        ],
        explanation:
          "Only until noon limita o horário. Yes confirma a abertura em parte do domingo.",
        gap: "Do you know where she ___?",
        fills: ["works", "does work", "work"],
        gapExplanation: "A pergunta indireta usa sujeito + verbo: she works.",
        production:
          "Transforme duas perguntas diretas em pedidos com Could you tell me ou Do you know. Revise a ordem interna.",
      },
      {
        id: "b1-colaboracao-02",
        title: "Checar o entendimento",
        rule: "So, you mean…? apresenta sua interpretação para confirmação. Let me check that I understood dá espaço para resumir. Repita números, datas ou condições essenciais, não cada palavra. A outra pessoa precisa poder corrigir seu resumo.",
        example: "So, you mean the deadline is Friday?",
        translation: "Então você quer dizer que o prazo é sexta-feira?",
        vocabulary:
          "deadline — prazo final\nconfirm — confirmar\nmisunderstanding — mal-entendido",
        pitfall:
          "Repetir yes sem entender pode confirmar algo errado. Uma pergunta de checagem deve expor claramente sua interpretação.",
        dialogue:
          "Ana: Send a draft on Wednesday and the final version on Friday.\nBen: So, Wednesday is for the draft, not the final version?\nAna: Exactly.",
        dialogueTranslation:
          "Ana: Envie um rascunho na quarta e a versão final na sexta.\nBen: Então quarta é para o rascunho, não para a versão final?\nAna: Exatamente.",
        question: "O que deve ser enviado na quarta?",
        choices: ["The draft", "The final version", "Nothing"],
        explanation:
          "A confirmação Exactly valida a distinção entre rascunho na quarta e versão final na sexta.",
        gap: "Let me ___ that I understood.",
        fills: ["check", "checking", "checks"],
        gapExplanation:
          "Let me é seguido de verbo base: check. A frase anuncia uma verificação do entendimento, não uma concordância automática.",
        production:
          "Escreva uma instrução com dois prazos e uma resposta checando qual entrega corresponde a cada prazo.",
      },
      {
        id: "b1-colaboracao-03",
        title: "Negociar um prazo",
        rule: "Explique a limitação e proponha uma alternativa concreta: I can send the summary today, but I need until Friday for the report. By Friday significa até sexta como limite; until Friday descreve continuidade até esse momento. Use Could we…? para propor mudança.",
        example: "Could we extend the deadline until Friday?",
        translation: "Poderíamos estender o prazo até sexta-feira?",
        vocabulary:
          "extend — estender\nby Friday — até sexta, prazo limite\nuntil Friday — até sexta, continuidade",
        pitfall:
          "I will finish until Friday não é a forma usual de expressar prazo. Use finish by Friday; work until Friday descreve trabalhar até lá.",
        dialogue:
          "Ana: Can you send the full report today?\nBen: I can send the summary today and the full report by Thursday. Would that work?\nAna: Yes.",
        dialogueTranslation:
          "Ana: Pode enviar o relatório completo hoje?\nBen: Posso enviar o resumo hoje e o relatório completo até quinta. Isso funcionaria?\nAna: Sim.",
        question: "Qual acordo foi aceito para o relatório completo?",
        choices: ["By Thursday", "Today", "After Friday"],
        explanation:
          "Ana aceita a alternativa em que o resumo vai hoje e o relatório completo até quinta.",
        gap: "Please submit the form ___ Monday at the latest.",
        fills: ["by", "until", "since"],
        gapExplanation:
          "By marca a data-limite de uma entrega; at the latest reforça esse limite.",
        production:
          "Negocie por escrito uma entrega com duas etapas, sem prometer algo que a limitação apresentada torna impossível.",
      },
      {
        id: "b1-colaboracao-04",
        title: "Pedir ajuda com contexto",
        rule: "Um pedido útil inclui o problema, o que você já tentou e a ajuda desejada. I've tried… mostra tentativa anterior. Could you show me how to…? pede uma demonstração. Evite um pedido vago quando você já sabe descrever a dificuldade.",
        example: "Could you show me how to upload this file?",
        translation: "Você poderia me mostrar como enviar este arquivo?",
        vocabulary:
          "upload — enviar arquivo\nattachment — anexo\nerror message — mensagem de erro",
        pitfall:
          "Upload envia; download baixa. Trocar essas palavras muda a ação pedida. Não compartilhe senhas para pedir suporte.",
        dialogue:
          "Ana: I can't upload the file. I've tried twice, but the site says it's too large.\nBen: Could you try a smaller version?",
        dialogueTranslation:
          "Ana: Não consigo enviar o arquivo. Tentei duas vezes, mas o site diz que é grande demais.\nBen: Pode tentar uma versão menor?",
        question: "Qual é o problema indicado pelo site?",
        choices: [
          "The file is too large.",
          "The password is wrong.",
          "The file is empty.",
        ],
        explanation:
          "Too large descreve o tamanho excessivo; o diálogo não menciona senha nem arquivo vazio.",
        gap: "I've already ___ restarting the app.",
        fills: ["tried", "try", "trying"],
        gapExplanation:
          "Have tried usa o particípio. Restarting descreve a tentativa feita.",
        production:
          "Escreva um pedido de suporte fictício com problema, tentativa e pergunta específica. Não inclua dados privados.",
      },
      {
        id: "b1-colaboracao-05",
        title: "Reclamar sem perder a clareza",
        rule: "Uma reclamação produtiva separa fato, impacto e solução desejada. I ordered… informa a compra; however… apresenta o problema; Could you…? solicita uma ação. Mantenha o tom firme sem acrescentar suposições sobre a intenção de alguém.",
        example: "I ordered a blue bag, but I received a green one.",
        translation: "Pedi uma bolsa azul, mas recebi uma verde.",
        vocabulary:
          "receive — receber\nreplacement — substituição\ninconvenience — transtorno",
        pitfall:
          "Pretend significa fingir, não pretender. Para 'pretendo devolver', use I intend to return ou I'm planning to return.",
        dialogue:
          "Email: I ordered two notebooks, but only one arrived. Could you check the order and send the missing notebook? Thank you.",
        dialogueTranslation:
          "E-mail: Pedi dois cadernos, mas só um chegou. Poderia conferir o pedido e enviar o caderno que falta? Obrigado(a).",
        question: "Qual solução o autor solicita?",
        choices: [
          "Send the missing notebook",
          "Cancel every order",
          "Send two additional notebooks",
        ],
        explanation:
          "Falta um dos dois cadernos. O pedido é enviar esse item, não duplicar a compra inteira.",
        gap: "Only one item ___. (chegou)",
        fills: ["arrived", "arriving", "arrive"],
        gapExplanation: "Arrived relata o evento de entrega no passado.",
        production:
          "Escreva uma reclamação de quatro frases sobre um pedido fictício: fato, problema, efeito e solução desejada.",
      },
      {
        id: "b1-colaboracao-06",
        title: "Resumir decisões de uma reunião",
        rule: "Um resumo de decisões registra quem fará o quê e até quando. We agreed to… indica acordo. Ana will… atribui a ação. Evite confundir uma sugestão discutida com uma decisão aceita. Use marcadores de prazo para tornar o resumo verificável.",
        example: "We agreed to send the proposal by Tuesday.",
        translation: "Concordamos em enviar a proposta até terça-feira.",
        vocabulary:
          "action item — tarefa acordada\nproposal — proposta\nresponsible — responsável",
        pitfall:
          "Discussed não significa approved. Uma ideia pode ter sido discutida sem aprovação; preserve isso no resumo.",
        dialogue:
          "Ana: I'll draft the text by Monday.\nBen: I'll review it on Tuesday.\nLia: We discussed a video, but let's decide on that next week.",
        dialogueTranslation:
          "Ana: Farei o rascunho até segunda.\nBen: Vou revisar na terça.\nLia: Discutimos um vídeo, mas vamos decidir sobre isso na semana que vem.",
        question: "Qual ponto ainda não foi decidido?",
        choices: [
          "Whether to make a video",
          "Who drafts the text",
          "When Ben reviews it",
        ],
        explanation:
          "Let's decide on that next week adia a decisão sobre o vídeo. As tarefas do texto já foram atribuídas.",
        gap: "We agreed ___ meet again next week.",
        fills: ["to", "for", "of"],
        gapExplanation:
          "Agree to + verbo expressa concordância em realizar uma ação.",
        production:
          "Resuma uma reunião fictícia em três linhas de ação com responsável e prazo, mais um item ainda pendente.",
      },
    ],
  },
  {
    id: "b1-leitura",
    title: "Leitura crítica e produção",
    level: "B1",
    description:
      "Ideias centrais, inferências sustentadas, registro e textos organizados.",
    lessons: [
      {
        id: "b1-leitura-01",
        title: "Encontrar a ideia principal",
        rule: "A ideia principal resume o foco de um texto, não um detalhe isolado. Procure o assunto que conecta abertura, exemplos e conclusão. Uma boa síntese preserva a abrangência: não transforme uma experiência de uma pessoa em uma regra universal.",
        example: "The article explains why the club changed its schedule.",
        translation: "O artigo explica por que o clube mudou seus horários.",
        vocabulary:
          "main idea — ideia principal\ndetail — detalhe\nschedule — programação/horários",
        pitfall:
          "Uma alternativa pode ser verdadeira e ainda não resumir o texto. Verifique se ela explica o conjunto, não apenas uma frase.",
        dialogue:
          "Club update: Members found afternoon meetings difficult because of work. The club tried evening meetings for a month, and attendance increased. It will now meet at 19:00 every Tuesday.",
        dialogueTranslation:
          "Atualização do clube: Os participantes tinham dificuldade com reuniões à tarde por causa do trabalho. O clube testou encontros noturnos por um mês, e a presença aumentou. Agora se reunirá às 19h toda terça.",
        question: "Qual é a ideia central?",
        choices: [
          "The club changed its schedule to help attendance.",
          "Every member stopped working.",
          "Tuesday is the only day people can read.",
        ],
        explanation:
          "A mudança de horário conecta o problema inicial, o teste e a decisão final.",
        gap: "Attendance ___ after the change. (aumentou)",
        fills: ["increased", "cancelled", "forgot"],
        gapExplanation:
          "Increased indica o crescimento da presença mencionado no texto.",
        production:
          "Resuma a atualização em uma frase e depois liste dois detalhes que apoiam essa síntese.",
      },
      {
        id: "b1-leitura-02",
        title: "Inferir sem inventar",
        rule: "Inferir é conectar indícios do texto, não acrescentar fatos sem apoio. Expressões como seems e probably deixam visível que há interpretação. Se o texto não informa uma data, nome ou motivo, reconheça o limite em vez de completar pela imaginação.",
        example: "She seems worried about the deadline.",
        translation: "Ela parece preocupada com o prazo.",
        vocabulary:
          "infer — inferir/deduzir\nsuggest — sugerir/indicar\nassumption — suposição",
        pitfall:
          "Uma inferência plausível não é certeza. Separe 'o texto diz' de 'o texto sugere'.",
        dialogue:
          "Message: I'm still at the office and the last bus leaves in ten minutes. Could you check whether any trains run after midnight?",
        dialogueTranslation:
          "Mensagem: Ainda estou no escritório e o último ônibus sai em dez minutos. Pode conferir se há trens depois da meia-noite?",
        question: "Qual inferência é melhor sustentada pela mensagem?",
        choices: [
          "The writer may need another way home.",
          "The writer has already missed every train.",
          "The writer lives exactly ten minutes away.",
        ],
        explanation:
          "A busca de trens sugere necessidade de alternativa. O texto não confirma que todos os trens foram perdidos nem a distância de casa.",
        gap: "The text ___ that she needs an alternative.",
        fills: ["suggests", "proves everything", "forgets"],
        gapExplanation:
          "Suggests marca uma interpretação sustentada, mas não uma prova de todos os detalhes.",
        production:
          "Escreva uma informação explícita, uma inferência e uma pergunta sem resposta sobre a mensagem. Mantenha as categorias separadas.",
      },
      {
        id: "b1-leitura-03",
        title: "Comparar informações de duas fontes",
        rule: "Ao comparar textos, confira se tratam do mesmo horário, versão ou contexto. Um aviso mais recente pode atualizar outro. Cite a fonte de cada informação e indique diferenças sem assumir que qualquer contradição é erro. Data e escopo ajudam a decidir o que vale.",
        example: "The latest notice gives a different opening time.",
        translation: "O aviso mais recente informa outro horário de abertura.",
        vocabulary:
          "latest — mais recente\nupdated — atualizado\nsource — fonte",
        pitfall:
          "Latest não é last em todo contexto: latest destaca a versão mais recente. Confira a data antes de escolher uma instrução.",
        dialogue:
          "Old poster: The workshop starts at 14:00 in room 2.\nToday's email: The workshop has moved to room 5. The start time is still 14:00.",
        dialogueTranslation:
          "Cartaz antigo: A oficina começa às 14h na sala 2.\nE-mail de hoje: A oficina mudou para a sala 5. O horário continua às 14h.",
        question: "Qual informação foi atualizada?",
        choices: [
          "The room, from 2 to 5",
          "The time, from 14:00 to 17:00",
          "The event has been cancelled",
        ],
        explanation:
          "O e-mail altera apenas a sala e explicita que o horário permanece igual.",
        gap: "The start time is ___ 14:00. (ainda)",
        fills: ["still", "yet", "already"],
        gapExplanation:
          "Still marca a continuidade de uma informação afirmativa.",
        production:
          "Escreva uma atualização de evento alterando apenas um detalhe. Diga explicitamente quais detalhes continuam iguais.",
      },
      {
        id: "b1-leitura-04",
        title: "Ajustar o registro da mensagem",
        rule: "O registro depende do destinatário e do objetivo. Hi e Thanks funcionam em muitos contatos informais; Dear… e Kind regards ajudam em mensagens mais formais. Clareza, cortesia e pedido específico importam mais do que usar palavras difíceis.",
        example: "I am writing to ask about your evening course.",
        translation: "Escrevo para perguntar sobre o curso noturno.",
        vocabulary:
          "kind regards — atenciosamente\nrequest — pedido\nrecipient — destinatário",
        pitfall:
          "Dear não significa necessariamente intimidade: é uma abertura convencional de e-mail formal. Evite gírias abreviadas quando o destinatário não as conhece.",
        dialogue:
          "Draft A: Hey, send prices asap.\nDraft B: Hello, could you send me the course prices when possible? Thank you.",
        dialogueTranslation:
          "Rascunho A: Ei, mande os preços o quanto antes.\nRascunho B: Olá, poderia me enviar os preços do curso quando possível? Obrigado(a).",
        question:
          "Qual rascunho é mais adequado para um primeiro contato cortês?",
        choices: ["Draft B", "Draft A", "Neither contains a request"],
        explanation:
          "B mantém o pedido e usa uma formulação cortês, sem presumir urgência imposta ao destinatário.",
        gap: "Kind ___, Ana.",
        fills: ["regards", "regardings", "regarded"],
        gapExplanation:
          "Kind regards é um encerramento convencional de e-mail.",
        production:
          "Escreva o mesmo pedido a um amigo e a uma escola. Mantenha a informação, mas ajuste saudação, tom e encerramento.",
      },
      {
        id: "b1-leitura-05",
        title: "Construir um parágrafo coeso",
        rule: "Um parágrafo pode apresentar uma ideia central, explicá-la, dar exemplo e concluir. Conectores devem mostrar relações reais: for example ilustra; therefore apresenta consequência. Evite repetir o mesmo substantivo quando um pronome tiver referência clara.",
        example: "Regular practice helps because it builds familiarity.",
        translation: "A prática regular ajuda porque cria familiaridade.",
        vocabulary:
          "therefore — portanto\nparagraph — parágrafo\nsupport — sustentar/apoiar",
        pitfall:
          "Adicionar however a toda frase não cria coesão. Use contraste apenas quando as ideias realmente contrastam.",
        dialogue:
          "Paragraph: I prefer a small study group. Everyone has time to ask questions. For example, in our last session each person explained one problem. This made the discussion easier to follow.",
        dialogueTranslation:
          "Parágrafo: Prefiro um grupo pequeno de estudo. Todos têm tempo de fazer perguntas. Por exemplo, na última sessão cada pessoa explicou um problema. Isso tornou a discussão mais fácil de acompanhar.",
        question: "Qual frase apresenta a preferência central?",
        choices: [
          "I prefer a small study group.",
          "Each person explained one problem.",
          "This made the discussion easier to follow.",
        ],
        explanation:
          "A primeira frase anuncia a ideia; as seguintes justificam e exemplificam.",
        gap: "___ example, we can practise in pairs.",
        fills: ["For", "By", "At"],
        gapExplanation:
          "For example é a expressão que introduz uma ilustração.",
        production:
          "Escreva um parágrafo de 60–80 palavras sobre sua forma preferida de estudar: ideia, razão, exemplo e conclusão. Faça uma auto-revisão; não há correção automática deste texto.",
      },
      {
        id: "b1-leitura-06",
        title: "Projeto final: planejar e justificar",
        rule: "Um plano completo informa objetivo, restrições, escolha e próximos passos. Combine comparações, razões e condições sem empilhar estruturas desnecessárias. Revise se cada promessa tem responsável e prazo. Um bom texto permite ao leitor agir com as informações fornecidas.",
        example: "We chose the library because it is quiet and free.",
        translation: "Escolhemos a biblioteca porque é silenciosa e gratuita.",
        vocabulary:
          "goal — objetivo\nconstraint — restrição\nnext step — próximo passo",
        pitfall:
          "Uma conclusão de nível no app não equivale a certificação CEFR. Esta tarefa pratica leitura e escrita; ouvir e falar exigem outras atividades.",
        dialogue:
          "Plan: We need a quiet place for six people on Saturday. The café costs more and gets noisy. We chose the library because it is free. Ana will check room availability by Thursday. If no room is available, we'll meet online.",
        dialogueTranslation:
          "Plano: Precisamos de um lugar silencioso para seis pessoas no sábado. O café custa mais e fica barulhento. Escolhemos a biblioteca porque é gratuita. Ana conferirá a disponibilidade de sala até quinta. Se não houver sala, nos reuniremos on-line.",
        question: "Qual é o plano alternativo se não houver sala?",
        choices: [
          "Meet online",
          "Pay for the café immediately",
          "Cancel all future meetings",
        ],
        explanation:
          "A condição final define meet online como alternativa; o café não foi escolhido.",
        gap: "Ana will check availability ___ Thursday. (prazo limite)",
        fills: ["by", "since", "during"],
        gapExplanation: "By Thursday indica o limite para concluir a checagem.",
        production:
          "Escreva um plano de 80–100 palavras para um encontro de estudos: compare dois lugares, justifique a escolha, distribua uma tarefa e crie alternativa com if. Auto-revise clareza, tempos e conectores.",
      },
    ],
  },
];
