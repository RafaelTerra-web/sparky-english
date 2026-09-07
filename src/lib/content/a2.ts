import type { ModuleDraft } from "./types";

export const a2Modules: ModuleDraft[] = [
  {
    id: "a2-passado",
    title: "Histórias no passado",
    level: "A2",
    legacyId: "a2-4-1",
    description: "Relatar acontecimentos, perguntar e organizar uma narrativa.",
    lessons: [
      {
        id: "a2-passado-01",
        title: "Was e were",
        rule: "O passado de be é was com I/he/she/it e were com you/we/they. Use para estados, lugares e características em um momento encerrado. Para perguntar, inverta verbo e sujeito; para negar, use wasn't/weren't, sem did.",
        example: "We were at home last night.",
        translation: "Estávamos em casa ontem à noite.",
        vocabulary:
          "last night — ontem à noite\nyesterday — ontem\nago — atrás",
        pitfall:
          "Did you were there? mistura auxiliares. Com be, a pergunta é Were you there?",
        dialogue:
          "Ana: Were you at the concert?\nBen: No, I was at home. My friends were there.",
        dialogueTranslation:
          "Ana: Você estava no show?\nBen: Não, estava em casa. Meus amigos estavam lá.",
        question: "Quem estava no show?",
        choices: ["Ben's friends", "Ben", "Nobody"],
        explanation:
          "My friends were there retoma o show. Ben afirma que ficou em casa.",
        gap: "The museum ___ closed yesterday.",
        fills: ["was", "were", "did"],
        gapExplanation:
          "The museum é singular. O passado de is é was, enquanto were acompanha sujeitos plurais.",
        production:
          "Escreva onde você e duas pessoas fictícias estavam ontem. Use was e were e inclua uma negativa.",
      },
      {
        id: "a2-passado-02",
        title: "Passado dos verbos regulares",
        rule: "Verbos regulares recebem -ed no passado: worked, visited. Se já terminam em e, acrescente só d: lived. Consoante + y costuma virar -ied: studied. O passado afirmativo tem a mesma forma para todos os sujeitos.",
        example: "She visited her aunt last weekend.",
        translation: "Ela visitou a tia no fim de semana passado.",
        vocabulary: "visit — visitar\nfinish — terminar\nstay — ficar",
        pitfall:
          "He visiteds não existe: -ed já indica passado e não recebe -s de terceira pessoa. Ouça visited no exemplo: depois do som /t/, -ed acrescenta a sílaba /ɪd/. Compare com worked, que termina em /t/, e cleaned, que termina em /d/.",
        dialogue:
          "Lia: What did you do on Saturday?\nAna: I cleaned the kitchen and watched a film.",
        dialogueTranslation:
          "Lia: O que você fez no sábado?\nAna: Limpei a cozinha e assisti a um filme.",
        question: "Qual tarefa doméstica Ana fez?",
        choices: [
          "She cleaned the kitchen.",
          "She visited her aunt.",
          "She washed the car.",
        ],
        explanation:
          "Cleaned the kitchen é a tarefa relatada. O exemplo inicial sobre a tia é outra situação.",
        gap: "Last year, he ___ in Porto.",
        fills: ["lived", "lives", "living"],
        gapExplanation:
          "Last year encerra o período; live recebe apenas d porque já termina em e.",
        production:
          "Relate três ações de ontem com verbos regulares. Confira a terminação e acrescente um marcador de tempo.",
      },
      {
        id: "a2-passado-03",
        title: "Passados irregulares frequentes",
        rule: "Alguns verbos não formam o passado com -ed: eat → ate, buy → bought, see → saw, take → took. Aprenda a forma junto de um contexto. Na afirmação, todos os sujeitos usam o mesmo passado: I bought, she bought.",
        example: "We bought fresh fruit at the market.",
        translation: "Compramos frutas frescas no mercado.",
        vocabulary:
          "bought — comprou/compramos\nate — comeu/comemos\nsaw — viu/vimos",
        pitfall:
          "Buyed e eated não são os passados padrão. Ao estudar, associe buy/bought a uma frase, não só a uma lista solta.",
        dialogue:
          "Ben: Did you eat at home yesterday?\nAna: No, I ate at the market and bought some fruit.",
        dialogueTranslation:
          "Ben: Você comeu em casa ontem?\nAna: Não, comi no mercado e comprei frutas.",
        question: "Onde Ana comeu?",
        choices: ["At the market", "At home", "At school"],
        explanation:
          "I ate at the market informa o local. Bought descreve a segunda ação.",
        gap: "Yesterday, I ___ an old friend.",
        fills: ["saw", "see", "seed"],
        gapExplanation:
          "Saw é o passado de see; seed não é uma forma passada desse verbo.",
        production:
          "Crie uma pequena história com bought, ate e saw. Mantenha as ações em um período passado definido.",
      },
      {
        id: "a2-passado-04",
        title: "Negar e perguntar com did",
        rule: "No passado simples de verbos comuns, use did para perguntas e didn't para negativas. O verbo principal volta à forma base: Did she buy? She didn't buy. Did já carrega a marca do passado e não muda conforme o sujeito.",
        example: "They did not travel last month.",
        translation: "Eles não viajaram no mês passado.",
        vocabulary:
          "travel — viajar\nlast month — mês passado\nmiss — perder/faltar",
        pitfall:
          "Didn't went está incorreto; use didn't go. Wasn't é para be, não substitui didn't com travel.",
        dialogue:
          "Ana: Did Leo catch the train?\nBen: No, he didn't. He took a bus instead.",
        dialogueTranslation:
          "Ana: Leo pegou o trem?\nBen: Não. Pegou um ônibus em vez disso.",
        question: "Qual transporte Leo usou?",
        choices: ["A bus", "A train", "A taxi"],
        explanation:
          "Didn't nega a primeira opção; took a bus instead apresenta a alternativa usada.",
        gap: "Did she ___ the tickets?",
        fills: ["buy", "bought", "buys"],
        gapExplanation:
          "Depois de did, buy fica na forma base, mesmo que a ação seja passada.",
        production:
          "Escreva uma pergunta e uma negativa sobre uma viagem passada. Revise se o verbo depois de did/didn't está na base.",
      },
      {
        id: "a2-passado-05",
        title: "Organizar uma sequência",
        rule: "First, then, after that e finally guiam a ordem de uma narrativa. Use passado simples para ações concluídas em sequência. After pode vir antes de um substantivo: after lunch. After that funciona sozinho como conector: depois disso.",
        example: "First we ate, then we visited the museum.",
        translation: "Primeiro comemos, depois visitamos o museu.",
        vocabulary:
          "first — primeiro\nafter that — depois disso\nfinally — por fim",
        pitfall:
          "Finally é 'por fim', não 'finalmente' em qualquer contexto de alívio. Para organizar etapas, deixe explícita a ordem, não apenas os horários.",
        dialogue:
          "Ana: First, we checked in. Then we had lunch. After that, we explored the city. Finally, we went back to the hotel.",
        dialogueTranslation:
          "Ana: Primeiro fizemos check-in. Depois almoçamos. Em seguida exploramos a cidade. Por fim voltamos ao hotel.",
        question: "O que aconteceu imediatamente depois do almoço?",
        choices: [
          "They explored the city.",
          "They checked in.",
          "They returned to the hotel.",
        ],
        explanation:
          "After that retoma o almoço e introduz a exploração da cidade.",
        gap: "We had breakfast. ___ that, we left.",
        fills: ["After", "Before", "During"],
        gapExplanation:
          "After that é 'depois disso' e mantém a sequência café da manhã → saída.",
        production:
          "Conte um passeio em quatro frases usando first, then, after that e finally. Mantenha os verbos no passado.",
      },
      {
        id: "a2-passado-06",
        title: "Uma ação em andamento no passado",
        rule: "Was/were + -ing descreve uma ação em andamento num momento passado. O passado simples pode marcar um evento durante essa ação: I was cooking when the phone rang. When introduz aqui o acontecimento mais pontual.",
        example: "I was studying when the phone rang.",
        translation: "Eu estava estudando quando o telefone tocou.",
        vocabulary:
          "ring / rang — tocar/tocou\nwhile — enquanto\nsuddenly — de repente",
        pitfall:
          "I was study omite -ing. Nem toda ação longa pede contínuo: escolha essa forma quando quiser mostrar o processo em andamento.",
        dialogue:
          "Ben: What were you doing at eight?\nAna: I was cooking when the lights went out.",
        dialogueTranslation:
          "Ben: O que você estava fazendo às oito?\nAna: Estava cozinhando quando as luzes apagaram.",
        question: "O que já estava em andamento quando faltou luz?",
        choices: ["Cooking", "Turning off the lights", "Going to bed"],
        explanation:
          "Was cooking é o pano de fundo. Went out é o acontecimento que ocorreu durante ele.",
        gap: "They ___ waiting when the bus arrived.",
        fills: ["were", "was", "did"],
        gapExplanation: "They exige were; waiting fornece a ação em andamento.",
        production:
          "Escreva uma frase combinando uma ação em andamento e um acontecimento. Use was/were + -ing e when.",
      },
    ],
  },
  {
    id: "a2-escolhas",
    title: "Comparações e quantidades",
    level: "A2",
    description: "Comparar opções, avaliar limites e especificar quantidades.",
    lessons: [
      {
        id: "a2-escolhas-01",
        title: "Comparar duas opções",
        rule: "Adjetivos curtos geralmente recebem -er no comparativo: cheaper. Adjetivos mais longos costumam usar more: more comfortable. Than introduz o segundo termo da comparação. Better e worse são formas irregulares de good e bad.",
        example: "This train is cheaper than the bus.",
        translation: "Este trem é mais barato que o ônibus.",
        vocabulary:
          "cheaper — mais barato\ncomfortable — confortável\nbetter — melhor",
        pitfall:
          "Não combine more e -er em more cheaper. Use cheaper ou more expensive, conforme o adjetivo.",
        dialogue:
          "Ana: Which room should we choose?\nBen: Room A is cheaper, but room B is quieter.",
        dialogueTranslation:
          "Ana: Qual quarto devemos escolher?\nBen: O quarto A é mais barato, mas o B é mais silencioso.",
        question: "Qual quarto custa menos?",
        choices: ["Room A", "Room B", "Both cost the same"],
        explanation:
          "Cheaper descreve o quarto A; quieter avalia barulho, não preço.",
        gap: "This chair is more comfortable ___ that one.",
        fills: ["than", "then", "that"],
        gapExplanation:
          "Than liga os elementos comparados; then indica sequência temporal.",
        production:
          "Compare dois meios de transporte usando um comparativo com -er e outro com more.",
      },
      {
        id: "a2-escolhas-02",
        title: "Destacar uma opção no grupo",
        rule: "Superlativos destacam um item em um conjunto: the cheapest, the most useful. Normalmente incluem the. Good vira the best; bad vira the worst. Especifique o conjunto quando necessário: the best option for us.",
        example: "This is the quietest room in the hotel.",
        translation: "Este é o quarto mais silencioso do hotel.",
        vocabulary:
          "the best — o melhor\nthe worst — o pior\nthe most useful — o mais útil",
        pitfall:
          "The most cheapest duplica a marca do superlativo. Use the cheapest.",
        dialogue:
          "Ben: A is cheap, B is cheaper, and C is the cheapest.\nAna: Let's choose C, then.",
        dialogueTranslation:
          "Ben: A é barato, B é mais barato e C é o mais barato.\nAna: Então vamos escolher C.",
        question: "Qual opção custa menos entre todas?",
        choices: ["C", "B", "A"],
        explanation:
          "The cheapest coloca C na posição de menor preço de todo o grupo.",
        gap: "It is the ___ option for our budget. (good)",
        fills: ["best", "better", "goodest"],
        gapExplanation:
          "Best é o superlativo irregular de good. Better compara, mas não é a forma pedida.",
        production:
          "Escolha três lugares fictícios e atribua a cada um um superlativo diferente, indicando o grupo comparado.",
      },
      {
        id: "a2-escolhas-03",
        title: "Dizer que são tão bons quanto",
        rule: "As + adjetivo + as expressa igualdade numa característica: as fast as. Not as…as indica que o primeiro elemento tem menos dessa característica. Entre os dois as, use o adjetivo básico, não o comparativo.",
        example: "The bus is not as fast as the train.",
        translation: "O ônibus não é tão rápido quanto o trem.",
        vocabulary: "fast — rápido\nas…as — tão…quanto\nsimilar — parecido",
        pitfall:
          "As faster as mistura duas estruturas. Escreva as fast as ou faster than.",
        dialogue:
          "Ana: Is the small room as bright as the large one?\nBen: Yes, but it isn't as quiet.",
        dialogueTranslation:
          "Ana: O quarto pequeno é tão iluminado quanto o grande?\nBen: Sim, mas não é tão silencioso.",
        question: "Em qual característica os quartos são equivalentes?",
        choices: ["Brightness", "Quietness", "Size"],
        explanation:
          "Yes confirma as bright as. A continuação nega igualdade no silêncio.",
        gap: "This bag is as ___ as mine.",
        fills: ["heavy", "heavier", "heaviest"],
        gapExplanation:
          "As…as exige heavy na forma básica. Heavier e heaviest pertencem a outras estruturas de comparação.",
        production:
          "Compare duas cidades com uma igualdade e uma desigualdade usando as…as e not as…as.",
      },
      {
        id: "a2-escolhas-04",
        title: "Too e enough",
        rule: "Too + adjetivo indica excesso que cria um limite: too expensive. Enough vem depois do adjetivo: warm enough, mas antes do substantivo: enough money. Not enough indica insuficiência. Enough to + verbo explica a ação possível.",
        example: "This bag is too heavy to carry.",
        translation: "Esta bolsa é pesada demais para carregar.",
        vocabulary:
          "heavy — pesado\nenough — suficiente\nafford — ter condições de pagar",
        pitfall:
          "Enough big inverte a ordem. Diga big enough. Too não é sinônimo neutro de very: sugere 'demais'.",
        dialogue:
          "Ben: Can we buy this laptop?\nAna: No, it's too expensive. We don't have enough money.",
        dialogueTranslation:
          "Ben: Podemos comprar este notebook?\nAna: Não, está caro demais. Não temos dinheiro suficiente.",
        question: "Por que eles não compram o notebook?",
        choices: [
          "They do not have enough money.",
          "It is too heavy.",
          "It is not big enough.",
        ],
        explanation:
          "O diálogo menciona preço e dinheiro insuficiente, não tamanho ou peso.",
        gap: "The room is warm ___ now.",
        fills: ["enough", "too", "many"],
        gapExplanation:
          "Enough vem depois de warm. Too teria de vir antes do adjetivo.",
        production:
          "Descreva um problema com too e uma solução com enough. Exemplo de tema: tamanho de mala ou tempo disponível.",
      },
      {
        id: "a2-escolhas-05",
        title: "Much, many e a lot of",
        rule: "Many acompanha contáveis plurais; much acompanha não contáveis. Ambos são comuns em perguntas e negativas. A lot of funciona com os dois tipos e é frequente em afirmações. O verbo concorda com o nome: a lot of people are; a lot of water is.",
        example: "We do not have much time.",
        translation: "Não temos muito tempo.",
        vocabulary: "time — tempo\npeople — pessoas\na lot of — muito/muitos",
        pitfall:
          "Much people está incorreto no padrão: people é plural contável. Use many people ou a lot of people.",
        dialogue:
          "Ana: Were there many people at the event?\nBen: Yes, a lot of people, but there wasn't much food.",
        dialogueTranslation:
          "Ana: Havia muitas pessoas no evento?\nBen: Sim, muitas pessoas, mas não havia muita comida.",
        question: "O que havia em pouca quantidade no evento?",
        choices: ["Food", "People", "Events"],
        explanation:
          "Wasn't much food indica quantidade reduzida de comida; havia muitas pessoas.",
        gap: "How ___ chairs do we need?",
        fills: ["many", "much", "a lot"],
        gapExplanation:
          "Chairs é contável plural e pede many na pergunta de quantidade.",
        production:
          "Descreva uma festa usando many, much e a lot of. Use pelo menos uma negativa.",
      },
      {
        id: "a2-escolhas-06",
        title: "A few e a little",
        rule: "A few significa alguns/poucos com nomes contáveis: a few minutes. A little indica uma pequena quantidade não contável: a little water. Sem a, few/little tendem a enfatizar escassez. O contexto define se a quantidade basta.",
        example: "We have a few minutes before the class.",
        translation: "Temos alguns minutos antes da aula.",
        vocabulary:
          "a few — alguns/poucos\na little — um pouco\nspace — espaço",
        pitfall:
          "A little chairs mistura não contável com plural contável. Diga a few chairs.",
        dialogue:
          "Ben: Do we have time for coffee?\nAna: Yes, we have a few minutes. There's a little milk too.",
        dialogueTranslation:
          "Ben: Temos tempo para um café?\nAna: Sim, temos alguns minutos. Também há um pouco de leite.",
        question:
          "Qual item é apresentado como uma pequena quantidade não contável?",
        choices: ["Milk", "Minutes", "Cups"],
        explanation:
          "A little acompanha milk. Minutes é contável e aparece com a few.",
        gap: "Please add a ___ sugar.",
        fills: ["little", "few", "many"],
        gapExplanation:
          "Sugar é não contável nessa situação; use a little sugar.",
        production:
          "Prepare uma lista com a few antes de dois itens contáveis e a little antes de dois não contáveis.",
      },
    ],
  },
  {
    id: "a2-experiencias",
    title: "Experiências e resultados",
    level: "A2",
    description: "Introdução ao present perfect e sua relação com o presente.",
    lessons: [
      {
        id: "a2-experiencias-01",
        title: "Experiências sem data definida",
        rule: "Have/has + particípio forma o present perfect. Ele pode relatar uma experiência sem dizer quando: I have visited Rome. O particípio pode ser regular, visited, ou irregular, seen. Com um período passado encerrado como yesterday, prefira o passado simples.",
        example: "I have visited three different countries.",
        translation: "Eu já visitei três países diferentes.",
        vocabulary:
          "experience — experiência\nvisited — visitado\nseen — visto",
        pitfall:
          "Have visited não equivale sempre a 'tenho visitado'. Nesse uso, 'já visitei' traduz a experiência acumulada até agora.",
        dialogue:
          "Ana: Have you visited Peru?\nBen: Yes, I have. I went there in 2022.\nAna: I'd like to go too.",
        dialogueTranslation:
          "Ana: Você já visitou o Peru?\nBen: Sim. Fui lá em 2022.\nAna: Também gostaria de ir.",
        question: "Quando Ben especifica a viagem?",
        choices: ["In 2022", "Next year", "Yesterday"],
        explanation:
          "Went acompanha a data encerrada in 2022. A pergunta de experiência usa have visited.",
        gap: "She ___ visited Canada.",
        fills: ["has", "have", "is"],
        gapExplanation:
          "She combina com has no present perfect; visited é o particípio.",
        production:
          "Escreva duas experiências sem datas com have/has + particípio. Não use yesterday nessas frases.",
      },
      {
        id: "a2-experiencias-02",
        title: "Ever e never",
        rule: "Ever pergunta se algo aconteceu em algum momento até agora: Have you ever…? Never afirma que isso não aconteceu: I have never… Coloque-os entre have/has e o particípio. Never já torna a afirmação negativa em sentido.",
        example: "Have you ever tried Korean food?",
        translation: "Você já experimentou comida coreana?",
        vocabulary:
          "ever — alguma vez\nnever — nunca\ntry — experimentar/tentar",
        pitfall:
          "I haven't never tried usa duas marcas negativas. No padrão ensinado, diga I have never tried ou I haven't tried.",
        dialogue:
          "Ben: Have you ever ridden a horse?\nAna: No, never. But I have ridden a bicycle many times.",
        dialogueTranslation:
          "Ben: Você já andou a cavalo?\nAna: Não, nunca. Mas já andei de bicicleta muitas vezes.",
        question: "Qual experiência Ana nunca teve?",
        choices: ["Riding a horse", "Riding a bicycle", "Travelling by bus"],
        explanation:
          "No, never responde à pergunta sobre cavalo. Ela afirma experiência com bicicleta.",
        gap: "I have ___ seen snow. (nunca)",
        fills: ["never", "ever", "always"],
        gapExplanation: "Never expressa ausência dessa experiência até agora.",
        production:
          "Faça uma pergunta com Have you ever e responda usando never. Depois acrescente uma experiência diferente que você já teve.",
      },
      {
        id: "a2-experiencias-03",
        title: "Just, already e yet",
        rule: "Just indica algo que acabou de acontecer; already, algo já realizado. Geralmente ficam entre have/has e o particípio. Yet aparece com frequência no fim de perguntas e negativas: Have you finished yet? I haven't finished yet.",
        example: "I have just finished my homework.",
        translation: "Acabei de terminar minha tarefa.",
        vocabulary:
          "just — acabou de\nalready — já\nyet — já/ainda, em perguntas ou negativas",
        pitfall:
          "Yet não é 'ainda' em toda frase afirmativa. Para 'ainda estou trabalhando', use still, não yet.",
        dialogue:
          "Ana: Have you sent the email yet?\nBen: Yes, I've already sent it, but I haven't received a reply yet.",
        dialogueTranslation:
          "Ana: Você já enviou o e-mail?\nBen: Sim, já enviei, mas ainda não recebi resposta.",
        question: "O que ainda não aconteceu?",
        choices: [
          "Receiving a reply",
          "Sending the email",
          "Writing the email",
        ],
        explanation:
          "Haven't received a reply yet indica a ação pendente. O envio já aconteceu.",
        gap: "Have you finished ___?",
        fills: ["yet", "never", "ago"],
        gapExplanation:
          "Yet pode ficar no fim de uma pergunta para saber se a ação já terminou.",
        production:
          "Escreva uma atualização com algo já feito e algo ainda pendente. Use already e not…yet.",
      },
      {
        id: "a2-experiencias-04",
        title: "For e since",
        rule: "Com present perfect, for indica duração: for two years. Since indica o ponto inicial: since 2020. A situação pode continuar agora: I've lived here for two years. How long pergunta a duração dessa situação.",
        example: "She has lived here since 2020.",
        translation: "Ela mora aqui desde 2020.",
        vocabulary:
          "since — desde\nfor two years — há dois anos/por dois anos\nhow long — há quanto tempo",
        pitfall:
          "Since two years confunde início com duração. Use for two years e since 2020.",
        dialogue:
          "Ben: How long have you worked here?\nAna: Since March. Lia has worked here for five years.",
        dialogueTranslation:
          "Ben: Há quanto tempo você trabalha aqui?\nAna: Desde março. Lia trabalha aqui há cinco anos.",
        question: "Há quanto tempo Lia trabalha no local?",
        choices: ["For five years", "Since March", "For five months"],
        explanation:
          "For five years se refere à Lia. Since March se refere à Ana.",
        gap: "We have known each other ___ ten years.",
        fills: ["for", "since", "ago"],
        gapExplanation:
          "Ten years é uma duração, portanto pede for. Since exigiria um ponto de início, como 2016.",
        production:
          "Descreva duas situações que continuam no presente: uma com for + duração e outra com since + início.",
      },
      {
        id: "a2-experiencias-05",
        title: "Been e gone",
        rule: "Have been to normalmente expressa visita com retorno ou experiência de conhecer um lugar. Have gone to indica que a pessoa foi e ainda não voltou no contexto atual. A escolha informa se ela está disponível aqui agora.",
        example: "Lia has gone to the supermarket.",
        translation: "Lia foi ao supermercado e ainda não voltou.",
        vocabulary:
          "been to — esteve em/já visitou\ngone to — foi para, ainda está fora\nback — de volta",
        pitfall:
          "I have been in London também existe, mas não é a mesma construção de visita com to. Nesta lição, compare been to e gone to.",
        dialogue:
          "Ana: Is Leo here?\nBen: No, he's gone to the bank. I've been there already today.",
        dialogueTranslation:
          "Ana: Leo está aqui?\nBen: Não, ele foi ao banco. Eu já fui lá hoje.",
        question: "Quem está fora no momento?",
        choices: ["Leo", "Ben", "Both are at the bank"],
        explanation:
          "He's gone explica a ausência de Leo. Ben usa been para a visita que já fez.",
        gap: "She's ___ to Paris twice and returned home each time.",
        fills: ["been", "gone", "went"],
        gapExplanation:
          "Been to expressa duas visitas com retorno; went não combina diretamente com has.",
        production:
          "Escreva duas mensagens: uma sobre alguém que saiu e outra sobre um lugar que você já visitou.",
      },
      {
        id: "a2-experiencias-06",
        title: "Experiência ou passado encerrado?",
        rule: "O present perfect conecta uma experiência ou resultado ao presente. O passado simples localiza uma ação em um período encerrado: last week, in 2019. Uma conversa pode começar com experiência e passar a detalhes no passado simples.",
        example: "I saw that film last Friday.",
        translation: "Eu vi esse filme na sexta-feira passada.",
        vocabulary:
          "last Friday — sexta-feira passada\nso far — até agora\nrecently — recentemente",
        pitfall:
          "I have seen it yesterday mistura o present perfect com yesterday. Use I saw it yesterday.",
        dialogue:
          "Ana: Have you seen this film?\nBen: Yes, I saw it last Friday.\nAna: Did you enjoy it?",
        dialogueTranslation:
          "Ana: Você já viu este filme?\nBen: Sim, vi na sexta passada.\nAna: Você gostou?",
        question:
          "Qual fala situa a experiência em um momento passado definido?",
        choices: [
          "I saw it last Friday.",
          "Have you seen this film?",
          "Did you enjoy it?",
        ],
        explanation: "Last Friday é o marcador explícito de tempo encerrado.",
        gap: "She ___ her friend yesterday.",
        fills: ["called", "has called", "have called"],
        gapExplanation:
          "Yesterday pede passado simples aqui: called. O período de ontem já está encerrado.",
        production:
          "Escreva uma pergunta de experiência e uma resposta com data. Troque do present perfect para o passado simples ao detalhar.",
      },
    ],
  },
  {
    id: "a2-planos",
    title: "Planos e compromissos",
    level: "A2",
    legacyId: "a2-3-1",
    description: "Futuro, convites, compromissos e consequências possíveis.",
    lessons: [
      {
        id: "a2-planos-01",
        title: "Intenções com going to",
        rule: "Be going to + verbo expressa uma intenção ou plano. Ajuste be ao sujeito: I'm going to study; they're going to travel. A forma também pode indicar previsão baseada em evidência visível. Aqui o foco é um plano já pensado.",
        example: "We are going to visit our cousins.",
        translation: "Vamos visitar nossos primos.",
        vocabulary:
          "plan — plano/planejar\nnext weekend — próximo fim de semana\nvisit — visitar",
        pitfall:
          "I'm going visit omite to. I going to visit omite am. Going to precisa das duas partes na escrita padrão.",
        dialogue:
          "Ana: What are you going to do on holiday?\nBen: I'm going to visit my cousins in Bahia.",
        dialogueTranslation:
          "Ana: O que você vai fazer nas férias?\nBen: Vou visitar meus primos na Bahia.",
        question: "Qual é o plano de Ben?",
        choices: ["Visit his cousins", "Move to Bahia", "Work all holiday"],
        explanation:
          "Visit my cousins é uma visita planejada; não há informação de mudança definitiva.",
        gap: "She is going ___ study tonight.",
        fills: ["to", "for", "at"],
        gapExplanation:
          "A estrutura é be going to + verbo base. To conecta going à ação planejada, study.",
        production:
          "Escreva duas intenções para a semana e uma pergunta sobre os planos de alguém.",
      },
      {
        id: "a2-planos-02",
        title: "Decisões e ofertas com will",
        rule: "Will + verbo pode expressar uma decisão tomada na hora ou uma oferta. I'll é a contração de I will. Para negar, use won't. O verbo fica na forma base, sem to, e will não recebe -s com he/she.",
        example: "I will help you with those bags.",
        translation: "Vou ajudar você com essas bolsas.",
        vocabulary: "help — ajudar\ncarry — carregar\nwon't — não vai/não irá",
        pitfall:
          "I'll to help acrescenta um to desnecessário. I'll help é uma oferta, não precisa significar um plano antigo.",
        dialogue:
          "Ana: These boxes are heavy.\nBen: I'll carry one for you.\nAna: Thanks! That will help a lot.",
        dialogueTranslation:
          "Ana: Estas caixas estão pesadas.\nBen: Vou carregar uma para você.\nAna: Obrigada! Isso vai ajudar muito.",
        question: "O que Ben oferece?",
        choices: ["To carry a box", "To buy new boxes", "To open every box"],
        explanation: "I'll carry one for you é uma oferta imediata de ajuda.",
        gap: "Don't worry. I ___ forget.",
        fills: ["won't", "don't", "am not"],
        gapExplanation:
          "Won't + forget é uma promessa sobre o futuro. As outras opções não formam essa construção.",
        production:
          "Escreva uma oferta de ajuda e uma promessa negativa com I'll e won't.",
      },
      {
        id: "a2-planos-03",
        title: "Compromissos já combinados",
        rule: "O presente contínuo também pode indicar um compromisso futuro combinado: I'm meeting Ana tomorrow. Uma expressão de tempo deixa clara a referência futura. Esse uso destaca uma organização concreta, como uma consulta marcada.",
        example: "I am meeting my tutor on Thursday.",
        translation: "Vou me encontrar com meu tutor na quinta-feira.",
        vocabulary:
          "appointment — compromisso/consulta marcada\ntutor — tutor/professor particular\nThursday — quinta-feira",
        pitfall:
          "I'm meeting não precisa estar acontecendo agora. Leia o marcador tomorrow/on Thursday para interpretar o tempo.",
        dialogue:
          "Ben: Are you free tomorrow morning?\nAna: No, I'm seeing the dentist at nine.",
        dialogueTranslation:
          "Ben: Você está livre amanhã de manhã?\nAna: Não, vou ao dentista às nove.",
        question: "Por que Ana não está livre?",
        choices: [
          "She has a dentist appointment.",
          "She is working all night.",
          "She is meeting Ben.",
        ],
        explanation:
          "I'm seeing the dentist at nine apresenta a consulta marcada para amanhã.",
        gap: "We are ___ our teacher tomorrow.",
        fills: ["meeting", "meet", "met"],
        gapExplanation:
          "Are + meeting forma o contínuo com sentido de compromisso futuro nesse contexto.",
        production:
          "Escreva duas entradas de uma agenda usando presente contínuo e datas futuras explícitas.",
      },
      {
        id: "a2-planos-04",
        title: "Convidar, aceitar e recusar",
        rule: "Would you like to + verbo faz um convite cortês. I'd love to aceita com entusiasmo. Para recusar, agradeça e explique brevemente: Thanks, but I can't. Uma alternativa com How about…? ajuda a manter o convite aberto.",
        example: "Would you like to join us for dinner?",
        translation: "Você gostaria de jantar com a gente?",
        vocabulary:
          "join — juntar-se a\nI'd love to — eu adoraria\nmaybe — talvez",
        pitfall:
          "Would you like going? não é o modelo deste convite; use would like to go. Recusar não exige expor detalhes pessoais.",
        dialogue:
          "Ana: Would you like to have lunch on Friday?\nBen: Thanks, but I can't. How about Saturday?\nAna: Saturday works.",
        dialogueTranslation:
          "Ana: Você gostaria de almoçar na sexta?\nBen: Obrigado, mas não posso. Que tal sábado?\nAna: Sábado funciona.",
        question: "Para qual dia eles mudam o almoço?",
        choices: ["Saturday", "Friday", "Sunday"],
        explanation:
          "How about Saturday propõe a alternativa e Saturday works a confirma.",
        gap: "Would you like ___ come?",
        fills: ["to", "for", "of"],
        gapExplanation:
          "Would like é seguido de to + verbo quando o convite envolve uma ação.",
        production:
          "Escreva um convite, uma recusa cortês e uma proposta alternativa de dia.",
      },
      {
        id: "a2-planos-05",
        title: "Condições possíveis no futuro",
        rule: "Para uma condição futura possível, use if + presente e will + verbo no resultado: If it rains, we'll stay home. Não use will depois de if nesse modelo. A ordem das partes pode mudar sem alterar a condição.",
        example: "If it rains, we will stay at home.",
        translation: "Se chover, vamos ficar em casa.",
        vocabulary: "if — se\nstay — ficar\nweather — clima/tempo",
        pitfall:
          "If it will rain é inadequado para essa condição padrão. O português usa 'se chover', mas o inglês usa presente depois de if.",
        dialogue:
          "Ana: Will we have a picnic tomorrow?\nBen: If it's sunny, we'll go to the park. If it rains, we'll eat at home.",
        dialogueTranslation:
          "Ana: Vamos fazer um piquenique amanhã?\nBen: Se estiver ensolarado, iremos ao parque. Se chover, comeremos em casa.",
        question: "Qual será o plano se chover?",
        choices: ["Eat at home", "Go to the park", "Skip lunch"],
        explanation:
          "A segunda condição liga chuva a comer em casa, não ao parque.",
        gap: "If she calls, I ___ answer.",
        fills: ["will", "would", "am"],
        gapExplanation:
          "Will answer apresenta o resultado possível da condição presente calls.",
        production:
          "Escreva dois planos dependentes de condições reais para amanhã. Use if + presente e will no resultado.",
      },
      {
        id: "a2-planos-06",
        title: "Regras gerais com if e when",
        rule: "Para fatos gerais ou hábitos condicionais, use presente nas duas partes: If I work late, I take a taxi. When pode destacar algo esperado ou habitual. Isso difere de uma previsão única com will no resultado.",
        example: "When I finish work late, I take a taxi.",
        translation: "Quando termino o trabalho tarde, pego um táxi.",
        vocabulary: "whenever — sempre que\nrule — regra\nusually — geralmente",
        pitfall:
          "Nem toda frase com if é sobre o futuro. Observe se a frase descreve uma regra repetida ou um evento específico.",
        dialogue:
          "Ana: What do you do if you miss the bus?\nBen: I walk to the station and take the train.",
        dialogueTranslation:
          "Ana: O que você faz se perde o ônibus?\nBen: Vou a pé até a estação e pego o trem.",
        question: "Qual é a alternativa habitual de Ben?",
        choices: ["Taking the train", "Calling a taxi", "Going home"],
        explanation:
          "A resposta no presente descreve o procedimento habitual de Ben nessa condição.",
        gap: "If I ___ tired, I go to bed early.",
        fills: ["feel", "felt", "feeling"],
        gapExplanation:
          "Feel está no presente, combinando com go numa relação habitual.",
        production:
          "Escreva uma regra da sua rotina com if e outra com when. Mantenha presente nas duas partes.",
      },
    ],
  },
  {
    id: "a2-servicos",
    title: "Pedidos e serviços",
    level: "A2",
    description:
      "Conselhos, obrigações, reservas e resolução de problemas cotidianos.",
    lessons: [
      {
        id: "a2-servicos-01",
        title: "Dar conselhos com should",
        rule: "Should + verbo sugere uma ação; shouldn't sugere evitá-la. É uma recomendação, não uma obrigação automática. Você pode acrescentar because para explicar o motivo. Should não recebe -s nem exige to.",
        example: "You should check the timetable first.",
        translation: "Você deveria conferir os horários primeiro.",
        vocabulary:
          "advice — conselho/conselhos\ntimetable — tabela de horários\ncheck — conferir",
        pitfall:
          "Advice é não contável: use some advice ou a piece of advice, não an advice. Should to check acrescenta to indevidamente.",
        dialogue:
          "Ana: I keep missing the bus.\nBen: You should check the timetable and leave earlier.",
        dialogueTranslation:
          "Ana: Vivo perdendo o ônibus.\nBen: Você deveria conferir os horários e sair mais cedo.",
        question: "Qual conselho Ben oferece?",
        choices: ["Check the timetable", "Stop taking buses", "Leave later"],
        explanation:
          "Ben recomenda conferir horários e sair mais cedo. Leave later seria o contrário.",
        gap: "You shouldn't ___ your password.",
        fills: ["share", "shares", "to share"],
        gapExplanation:
          "Depois de shouldn't, use a forma base share, sem -s e sem to. A recomendação é não compartilhar.",
        production:
          "Dê dois conselhos sobre organização dos estudos, um com should e outro com shouldn't, explicando um motivo.",
      },
      {
        id: "a2-servicos-02",
        title: "Obrigações com have to",
        rule: "Have to expressa necessidade ou obrigação: I have to leave. Com he/she, use has to. Em perguntas, use do/does: Does she have to work? Na pergunta com does, have volta à forma base.",
        example: "We have to show our tickets.",
        translation: "Temos que mostrar nossas passagens.",
        vocabulary:
          "show — mostrar\nrequired — obrigatório\nentrance — entrada",
        pitfall:
          "Does she has to? marca a terceira pessoa duas vezes. Use Does she have to?",
        dialogue:
          "Visitor: Do I have to print the ticket?\nClerk: No, but you have to show it on your phone.",
        dialogueTranslation:
          "Visitante: Preciso imprimir o ingresso?\nAtendente: Não, mas precisa mostrá-lo no celular.",
        question: "O que é obrigatório?",
        choices: [
          "Showing the ticket",
          "Printing the ticket",
          "Buying a new phone",
        ],
        explanation:
          "O atendente dispensa a impressão, mas mantém a exigência de mostrar o ingresso.",
        gap: "She ___ to wear a uniform.",
        fills: ["has", "have", "having"],
        gapExplanation:
          "She pede has na afirmação: has to wear. Have é usado com I, you e sujeitos plurais.",
        production:
          "Descreva duas regras de um evento fictício com have to/has to e faça uma pergunta sobre outra regra.",
      },
      {
        id: "a2-servicos-03",
        title: "Proibido ou desnecessário?",
        rule: "Mustn't indica proibição. Don't have to indica ausência de obrigação: você pode fazer, mas não precisa. A diferença importa em regras de locais e serviços. Must + verbo é forte e comum em instruções obrigatórias.",
        example: "You must not park in front of the gate.",
        translation: "Você não pode estacionar em frente ao portão.",
        vocabulary: "forbidden — proibido\noptional — opcional\ngate — portão",
        pitfall:
          "Traduzir don't have to como 'não pode' muda a regra. Significa 'não precisa'.",
        dialogue:
          "Guide: You mustn't take photos here. You don't have to leave your bag outside; you can carry it.",
        dialogueTranslation:
          "Guia: Vocês não podem tirar fotos aqui. Não precisam deixar a bolsa lá fora; podem carregá-la.",
        question: "Qual ação é proibida?",
        choices: ["Taking photos", "Carrying a bag", "Leaving a bag outside"],
        explanation:
          "Mustn't marca a proibição de fotografar. Levar a bolsa é permitido.",
        gap: "It's optional. You ___ bring a notebook.",
        fills: ["don't have to", "mustn't", "can't"],
        gapExplanation: "Optional indica que não é obrigatório: don't have to.",
        production:
          "Escreva uma regra de proibição e uma informação opcional para um museu fictício. Não trate as duas como equivalentes.",
      },
      {
        id: "a2-servicos-04",
        title: "Reservar um quarto",
        rule: "I'd like to book… solicita uma reserva. For two nights indica a duração da hospedagem. From…to… delimita datas. Pergunte Is breakfast included? para conferir serviços. Double room costuma ser um quarto com cama de casal; twin room costuma ter duas camas individuais.",
        example: "I would like to book a room for two nights.",
        translation: "Gostaria de reservar um quarto por duas noites.",
        vocabulary:
          "book — reservar\nincluded — incluído\ntwin room — quarto com duas camas individuais",
        pitfall:
          "Book é verbo 'reservar' neste contexto, não o substantivo livro. Two nights informa noites de estadia, não número de quartos.",
        dialogue:
          "Ana: A twin room for two nights, please. Is breakfast included?\nClerk: No, breakfast costs eight pounds per person.",
        dialogueTranslation:
          "Ana: Um quarto com duas camas individuais por duas noites, por favor. O café está incluído?\nAtendente: Não, custa oito libras por pessoa.",
        question: "O café da manhã está incluído na reserva?",
        choices: [
          "No, it costs extra.",
          "Yes, for everyone.",
          "Only on the second night.",
        ],
        explanation:
          "O atendente responde No e informa o preço adicional por pessoa.",
        gap: "I'd like a room ___ three nights.",
        fills: ["for", "since", "at"],
        gapExplanation:
          "For indica a duração planejada da estadia: for three nights, por três noites. Since indicaria início.",
        production:
          "Escreva um pedido de reserva com tipo de quarto, duração e uma pergunta sobre um serviço.",
      },
      {
        id: "a2-servicos-05",
        title: "Relatar um problema numa compra",
        rule: "Explique o item e o problema antes do pedido: I bought these headphones yesterday. They don't work. Could I have a refund? pede reembolso; exchange pede troca. Mantenha datas, quantidade e descrição consistentes.",
        example: "These headphones do not work.",
        translation: "Estes fones de ouvido não funcionam.",
        vocabulary:
          "receipt — recibo/comprovante\nrefund — reembolso\nexchange — troca/trocar",
        pitfall:
          "Receipt não é receita culinária: recipe é receita. Uma frase cortês não estabelece direitos de troca; as condições dependem da loja e da legislação.",
        dialogue:
          "Ana: These headphones don't work. Could I exchange them?\nClerk: Do you have the receipt?\nAna: Yes, here it is.",
        dialogueTranslation:
          "Ana: Estes fones não funcionam. Posso trocá-los?\nAtendente: Tem o comprovante?\nAna: Sim, aqui está.",
        question: "O que Ana solicita?",
        choices: ["An exchange", "A recipe", "A new receipt only"],
        explanation:
          "Could I exchange them? pede troca do produto, não apenas outro comprovante.",
        gap: "Do you have the ___? (comprovante)",
        fills: ["receipt", "recipe", "reception"],
        gapExplanation:
          "Receipt é o comprovante de compra. Recipe é uma receita de cozinha.",
        production:
          "Escreva três frases para uma loja: quando comprou, qual é o defeito e qual solução gostaria de pedir.",
      },
      {
        id: "a2-servicos-06",
        title: "Marcar e alterar uma consulta",
        rule: "I'd like to make an appointment solicita um horário. Reschedule significa remarcar; cancel significa cancelar. Are you available…? verifica disponibilidade. Ao confirmar, repita dia e hora para evitar mal-entendidos.",
        example: "Could we reschedule my appointment?",
        translation: "Poderíamos remarcar meu horário?",
        vocabulary:
          "reschedule — remarcar\navailable — disponível\ncancel — cancelar",
        pitfall:
          "Appointment não é necessariamente encontro romântico; date pode ter esse sentido. O objetivo aqui é comunicação de agenda, não orientação médica.",
        dialogue:
          "Ana: Could we move my appointment from Tuesday to Thursday?\nReceptionist: Thursday at ten is available.\nAna: That works, thank you.",
        dialogueTranslation:
          "Ana: Poderíamos mudar meu horário de terça para quinta?\nRecepcionista: Quinta às dez está disponível.\nAna: Funciona, obrigada.",
        question: "Qual é o novo horário confirmado?",
        choices: ["Thursday at ten", "Tuesday at ten", "Thursday at two"],
        explanation: "Thursday at ten é oferecido e aceito com That works.",
        gap: "Are you ___ on Friday? (disponível)",
        fills: ["available", "cancelled", "closed"],
        gapExplanation:
          "Available pergunta se a pessoa tem disponibilidade naquele dia.",
        production:
          "Escreva um pedido de remarcação indicando o horário antigo e duas alternativas. Finalize confirmando uma delas.",
      },
    ],
  },
  {
    id: "a2-textos",
    title: "Leitura e escrita prática",
    level: "A2",
    description:
      "Conectar ideias, entender instruções e escrever mensagens úteis.",
    lessons: [
      {
        id: "a2-textos-01",
        title: "Retomar pessoas e coisas",
        rule: "Pronomes de objeto vêm depois de verbos ou preposições: help me, call her, with them. Eles evitam repetir nomes. It retoma singular; them retoma plural. Leia a frase anterior para identificar a referência correta.",
        example: "Please send them the address.",
        translation: "Por favor, envie o endereço a eles.",
        vocabulary:
          "me — me/mim\nthem — os/as/eles/elas como objeto\naddress — endereço",
        pitfall:
          "Call she usa um pronome de sujeito onde se exige objeto. Use call her. O referente de it depende do contexto, não da proximidade visual apenas.",
        dialogue:
          "Ana: Lia and Ben need the address. Can you send it to them?\nLeo: Sure, I'll message them now.",
        dialogueTranslation:
          "Ana: Lia e Ben precisam do endereço. Pode enviá-lo a eles?\nLeo: Claro, vou mandar mensagem para eles agora.",
        question: "A quem them se refere?",
        choices: ["Lia and Ben", "The address", "Ana and Leo"],
        explanation:
          "Them retoma as duas pessoas que precisam do endereço. It retoma address.",
        gap: "I know Ana. I can call ___.",
        fills: ["her", "she", "hers"],
        gapExplanation:
          "Depois de call, use o pronome de objeto her. She é sujeito e hers indica posse sem substantivo.",
        production:
          "Escreva duas frases com nomes e reescreva a segunda usando it ou them para evitar repetição.",
      },
      {
        id: "a2-textos-02",
        title: "Explicar causa e resultado",
        rule: "Because introduz uma causa; so introduz um resultado. Compare I stayed home because it rained com It rained, so I stayed home. But marca contraste. Escolha o conector pela relação de sentido, não por uma tradução isolada.",
        example: "The shop was closed, so we went home.",
        translation: "A loja estava fechada, então fomos para casa.",
        vocabulary: "because — porque\nso — então/por isso\nbut — mas",
        pitfall:
          "No padrão simples, evite combinar because e so para a mesma relação: Because it rained, so… Use apenas um deles nessa construção.",
        dialogue:
          "Ana: Why did you walk?\nBen: The buses weren't running, so I walked to work.",
        dialogueTranslation:
          "Ana: Por que você foi a pé?\nBen: Os ônibus não estavam circulando, então fui a pé ao trabalho.",
        question: "Qual foi a causa de Ben ir a pé?",
        choices: [
          "The buses were not running.",
          "He missed a train.",
          "His workplace was closed.",
        ],
        explanation:
          "A primeira parte fornece a causa; so introduz a consequência de caminhar.",
        gap: "I brought a coat ___ it was cold.",
        fills: ["because", "so", "but"],
        gapExplanation:
          "It was cold explica a causa de trazer um casaco; because liga essa causa à ação.",
        production:
          "Descreva um imprevisto em duas versões: uma usando because e outra usando so, invertendo a ordem das informações.",
      },
      {
        id: "a2-textos-03",
        title: "Ler um e-mail de confirmação",
        rule: "Num e-mail de confirmação, identifique serviço, data, hora, local e ação exigida. Booked confirma a reserva; please arrive informa uma instrução. Não confunda o horário de chegada solicitado com o horário de início.",
        example: "Please arrive fifteen minutes before the tour.",
        translation: "Chegue quinze minutos antes do passeio, por favor.",
        vocabulary:
          "confirmation — confirmação\nbooking — reserva\narrive — chegar",
        pitfall:
          "Before é antes; after é depois. Ler apenas os números sem os conectores pode levar ao horário errado.",
        dialogue:
          "Email: Your walking tour is booked for Saturday at 10:00. Please arrive at the museum entrance at 9:45. Bring your booking email.",
        dialogueTranslation:
          "E-mail: Seu passeio a pé está reservado para sábado às 10h. Chegue à entrada do museu às 9h45. Leve seu e-mail de reserva.",
        question: "A que horas a pessoa deve chegar?",
        choices: ["9:45", "10:00", "10:15"],
        explanation:
          "O início é às 10h, mas a instrução de chegada é 9h45, quinze minutos antes.",
        gap: "Bring your booking ___.",
        fills: ["email", "meal", "weather"],
        gapExplanation:
          "A instrução pede o e-mail de reserva, que funciona como confirmação do serviço.",
        production:
          "Escreva um e-mail de confirmação fictício com hora de início, hora de chegada, local e item necessário.",
      },
      {
        id: "a2-textos-04",
        title: "Interpretar uma avaliação",
        rule: "Avaliações combinam fatos e opiniões. Was clean descreve uma avaliação positiva; however/but pode introduzir um problema. Procure o balanço completo antes de concluir se a recomendação é favorável. Uma ressalva não apaga automaticamente os elogios.",
        example: "The room was clean, but the street was noisy.",
        translation: "O quarto estava limpo, mas a rua era barulhenta.",
        vocabulary:
          "review — avaliação\nnoisy — barulhento\nfriendly — simpático",
        pitfall:
          "Actually significa 'na verdade', não 'atualmente'. Em avaliações, pode corrigir uma expectativa.",
        dialogue:
          "Review: The staff were friendly and the room was clean. However, the street was noisy at night. I'd recommend it for a short stay, not for a quiet holiday.",
        dialogueTranslation:
          "Avaliação: A equipe era simpática e o quarto estava limpo. Porém, a rua era barulhenta à noite. Recomendaria para uma estadia curta, não para férias tranquilas.",
        question: "Para qual objetivo o autor NÃO recomenda o local?",
        choices: ["A quiet holiday", "A short stay", "Meeting friendly staff"],
        explanation:
          "Not for a quiet holiday limita a recomendação por causa do barulho.",
        gap: "The staff were very ___. (simpáticos)",
        fills: ["friendly", "expensive", "closed"],
        gapExplanation:
          "Friendly descreve pessoas simpáticas; expensive trata de preço e closed de fechamento.",
        production:
          "Escreva uma avaliação curta de um lugar fictício com dois pontos positivos e uma ressalva.",
      },
      {
        id: "a2-textos-05",
        title: "Escrever um pedido por e-mail",
        rule: "Um pedido simples deve dizer o motivo do contato, a informação necessária e um encerramento cortês. Could you send me…? faz uma solicitação. I look forward to your reply expressa expectativa de resposta; não é exigência de retorno imediato.",
        example: "Could you send me the course timetable?",
        translation: "Você poderia me enviar os horários do curso?",
        vocabulary:
          "reply — resposta\nsubject — assunto do e-mail\ndetails — detalhes",
        pitfall:
          "Information é não contável: some information, não informations. Para pedir detalhes, details pode ser plural.",
        dialogue:
          "Email: Hello, I'm interested in your evening classes. Could you send me the timetable and prices? Thank you, Ana.",
        dialogueTranslation:
          "E-mail: Olá, tenho interesse nas aulas noturnas. Poderia me enviar os horários e preços? Obrigada, Ana.",
        question: "Quais informações Ana solicita?",
        choices: [
          "Timetable and prices",
          "The teacher's home address",
          "A refund",
        ],
        explanation:
          "O pedido explícito é the timetable and prices; não há solicitação de dados pessoais.",
        gap: "Could you send me some ___?",
        fills: ["information", "informations", "an information"],
        gapExplanation: "Information não recebe plural nem a/an nesse uso.",
        production:
          "Escreva um e-mail de quatro linhas pedindo informações sobre um curso: saudação, interesse, pedido e agradecimento.",
      },
      {
        id: "a2-textos-06",
        title: "Entender regras de um evento",
        rule: "Em instruções, diferencie obrigação, recomendação e possibilidade. Must indica exigência, should recomenda e can permite. Leia exceções e horários juntos: after 18:00 muda quando uma condição vale. Don't have to retira uma obrigação.",
        example: "You can enter after six with your ticket.",
        translation: "Você pode entrar depois das seis com seu ingresso.",
        vocabulary: "entry — entrada\nvalid — válido\nbring — trazer/levar",
        pitfall:
          "Can e must não são equivalentes: uma possibilidade não é necessariamente uma obrigação. Preserve essa diferença ao resumir regras.",
        dialogue:
          "Event notice: Doors open at 18:00. You must show a valid ticket. You can bring water, but you mustn't bring glass bottles. You don't have to print your ticket.",
        dialogueTranslation:
          "Aviso do evento: As portas abrem às 18h. É obrigatório mostrar ingresso válido. Pode levar água, mas não garrafas de vidro. Não é necessário imprimir o ingresso.",
        question: "O que a pessoa pode levar?",
        choices: [
          "Water in a non-glass bottle",
          "A glass bottle",
          "Only a printed ticket",
        ],
        explanation:
          "Água é permitida, mas vidro é proibido; a impressão do ingresso é opcional.",
        gap: "You ___ show a valid ticket. (obrigação)",
        fills: ["must", "might", "don't have to"],
        gapExplanation:
          "Must expressa a exigência indicada no aviso. Might seria possibilidade; don't have to negaria a obrigação.",
        production:
          "Resuma as regras em português e depois escreva três instruções em inglês: uma obrigação, uma permissão e uma proibição.",
      },
    ],
  },
];
