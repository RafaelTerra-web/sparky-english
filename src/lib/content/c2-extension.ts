import type { ModuleDraft } from "./types";

export const c2ExtensionModules: ModuleDraft[] = [
  {
    id: "c2-estilo-cultura",
    title: "Estilo, cultura e intervenção crítica",
    level: "C2",
    description: "Interpretar vozes, alusões e enquadramentos; recriar efeitos entre culturas e editar prosa de alta precisão.",
    lessons: [
      {
        id: "c2-estilo-cultura-01",
        title: "Ler alusões e ecos intertextuais",
        rule: "Uma alusão convoca outro texto, evento ou fórmula cultural sem explicá-lo por inteiro. Identifique o eco lexical, teste o conhecimento necessário e pergunte que contraste ele cria no novo contexto. Uma leitura sólida distingue efeito provável de origem comprovada e continua compreensível mesmo quando a referência permanece incerta.",
        example: "The headline echoes a familiar promise only to expose how little has changed.",
        translation: "A manchete ecoa uma promessa conhecida justamente para revelar quão pouco mudou.",
        vocabulary: "allusion — alusão\nintertextual echo — eco intertextual\nresonance — ressonância",
        pitfall: "Sem evidência textual ou histórica, semelhança não prova intenção autoral. Apresente uma origem incerta como possibilidade interpretativa, não como fato biográfico.",
        dialogue: "An essay on urban redevelopment is titled 'A Room of One's Own, at Market Rate'. Readers familiar with the earlier phrase hear a claim about space, independence and exclusion before the argument begins. The added commercial qualifier changes aspiration into a question about affordability. The essay never names its source, so the critic cannot prove that every reader will recognise it or that the author intended every association attached to the original. Still, the altered phrase clearly frames private space as both an ideal and a commodity, a tension developed throughout the essay.",
        dialogueTranslation: "Um ensaio sobre urbanismo se chama 'Um teto todo seu, pelo preço de mercado'. Quem reconhece a frase anterior antecipa espaço, independência e exclusão; o complemento comercial transforma aspiração em questão de acesso. Como a fonte não é nomeada, não se pode provar reconhecimento universal nem toda intenção. Ainda assim, a frase enquadra espaço privado como ideal e mercadoria, tensão desenvolvida no texto.",
        question: "Qual interpretação mantém força sem ultrapassar a evidência?",
        choices: [
          "The altered phrase activates ideas of independence and access while the commercial addition redirects them toward affordability.",
          "Every reader must identify the source and recover exactly the same associations.",
          "The title proves the author intended to reproduce every argument of the earlier work."
        ],
        explanation: "A leitura relaciona forma e argumento observáveis, mas não transforma reconhecimento, repertório do leitor ou intenção total em certezas.",
        gap: "The commercial qualifier casts the familiar aspiration ___ a question of affordability.",
        fills: ["as", "by", "from"],
        gapExplanation: "Cast something as enquadra ou apresenta algo de determinada maneira; aqui, a aspiração passa a ser lida como questão de acesso econômico.",
        production: "Analise em 400–500 palavras uma alusão em título, discurso ou campanha. Explique o eco, sua transformação, públicos possíveis e limites da atribuição de intenção.",
        productionChecklist: [
          "Mostrei elementos linguísticos que sustentam o eco?",
          "Expliquei o novo efeito no contexto atual?",
          "Distingui interpretação plausível e intenção comprovada?"
        ],
        speakingTask: "Apresente duas leituras da alusão em quatro minutos e explique qual depende menos de conhecimento externo."
      },
      {
        id: "c2-estilo-cultura-02",
        title: "Distinguir narrador, voz citada e autor",
        rule: "Textos polifônicos distribuem posições entre narrador, personagens, fontes citadas e autor implícito. Marcas de distância, discurso indireto livre e contradições internas podem impedir que uma frase seja atribuída diretamente ao autor. Reconstrua quem enuncia, quem focaliza e quem é responsabilizado antes de descrever a posição global da obra.",
        example: "The narrator reproduces the committee's certainty without necessarily sharing it.",
        translation: "O narrador reproduz a certeza do comitê sem necessariamente compartilhá-la.",
        vocabulary: "free indirect discourse — discurso indireto livre\nfocalisation — focalização\nreported voice — voz relatada",
        pitfall: "Primeira pessoa não garante autobiografia, e uma frase sem aspas pode continuar filtrada por uma personagem. Fundamente atribuições no funcionamento do texto.",
        dialogue: "The report had solved everything, naturally. No one would object to the new route once they understood the elegant model behind it. Mara closed the document and looked through the window at the queue forming beside the old stop. The passage slips from an official claim into language coloured by Mara's scepticism. 'Naturally' may mimic the committee's confidence, while the visible queue quietly resists it. Treating the first two sentences as the novelist's direct policy view would erase the tension among institutional language, character perspective and narrated scene.",
        dialogueTranslation: "'O relatório resolvera tudo, naturalmente. Ninguém se oporia à rota ao entender o modelo elegante.' Mara fecha o documento e vê a fila no ponto antigo. A passagem mistura discurso oficial e ceticismo da personagem: 'naturalmente' pode imitar a certeza do comitê, enquanto a fila a contesta. Atribuir as primeiras frases diretamente ao autor apagaria a tensão entre instituição, personagem e cena.",
        question: "Que leitura explica melhor a polifonia da passagem?",
        choices: [
          "Institutional certainty is filtered through Mara's perspective and quietly challenged by the observed queue.",
          "The novelist directly guarantees that the route has solved every practical problem.",
          "Mara fully endorses the report because the first sentences contain no quotation marks."
        ],
        explanation: "O vocabulário avaliativo e o contraste da cena criam distância; ausência de aspas não elimina a filtragem da voz institucional pela personagem.",
        gap: "The final image is at odds ___ the committee's confident prediction.",
        fills: ["with", "to", "against"],
        gapExplanation: "At odds with expressa incompatibilidade ou tensão. A fila observada contrasta com a previsão de aceitação sem resistência.",
        production: "Escreva uma análise de 450–550 palavras atribuindo cada posição a narrador, personagem ou instituição. Inclua uma interpretação alternativa e teste-a contra o texto.",
        productionChecklist: [
          "Atribuí cada enunciado à voz mais plausível?",
          "Usei forma linguística e cena como evidência?",
          "Testei uma leitura alternativa sem caricaturá-la?"
        ],
        speakingTask: "Explique a passagem a um seminário por quatro minutos e responda a alguém que iguala narrador e autor."
      },
      {
        id: "c2-estilo-cultura-03",
        title: "Recriar humor, ironia e registro entre culturas",
        rule: "Tradução pragmática preserva função, relação e efeito, mesmo quando a forma literal precisa mudar. Para humor ou ironia, identifique o alvo, o mecanismo e o risco social. Escolha entre recriar o efeito, explicitar a referência ou aceitar uma perda controlada; depois verifique se a nova versão mantém o registro e não muda quem é ridicularizado.",
        example: "A literal translation preserved the words but misplaced the joke's target.",
        translation: "Uma tradução literal preservou as palavras, mas deslocou o alvo da piada.",
        vocabulary: "pragmatic effect — efeito pragmático\ncomic timing — tempo cômico\ncompensate — compensar",
        pitfall: "Adaptar não é licença para inventar qualquer piada. Preserve a função discursiva e declare perdas quando referência, som e sentido não puderem coexistir.",
        dialogue: "In a workplace comedy, a manager responds to a disastrous presentation with, 'Well, that was reassuring.' The humour rests on understated irony and on the manager's habit of avoiding direct criticism. A subtitle that translates only the dictionary meaning can sound sincerely positive; one that says 'That was terrible' preserves the verdict but destroys the character's evasive register. The translator chooses an apparently mild compliment that sounds implausible after the scene, allowing image and timing to reverse its literal force. A translator's note would explain the joke but interrupt the performance.",
        dialogueTranslation: "Numa comédia de trabalho, após uma apresentação desastrosa, o gerente diz algo literalmente positivo. O humor depende de ironia atenuada e do hábito de evitar crítica direta. Uma tradução literal pode soar sincera; 'foi terrível' preserva o julgamento, mas destrói o registro evasivo. A legenda escolhe elogio brando e implausível diante da cena, deixando imagem e tempo inverterem o sentido; uma nota interromperia a atuação.",
        question: "Qual princípio orienta melhor a legenda?",
        choices: [
          "Preserve the understated ironic function and the manager's evasive characterisation, using the scene to reverse the literal praise.",
          "Replace the line with an explicit insult because only the negative judgement matters.",
          "Add a long explanatory note during the exchange so every mechanism is named."
        ],
        explanation: "A solução mantém avaliação, modo indireto e caracterização, confiando no contexto audiovisual para realizar a inversão irônica sem interromper o ritmo.",
        gap: "The translator opted ___ a mild phrase whose literal meaning the scene overturns.",
        fills: ["for", "to", "with"],
        gapExplanation: "Opt for significa escolher entre alternativas. Opt to exigiria um verbo; opt with não forma a combinação idiomática adequada.",
        production: "Crie duas traduções de uma fala humorística: uma para legenda e outra para artigo. Compare alvo, registro, ritmo, referência cultural e perda residual em 400 palavras.",
        productionChecklist: [
          "Identifiquei mecanismo e alvo do humor?",
          "Preservei relação social e caracterização?",
          "Justifiquei ganhos e perdas de cada meio?"
        ],
        speakingTask: "Interprete a fala em dois registros, explique o efeito de cada versão e proponha uma adaptação para outro público."
      },
      {
        id: "c2-estilo-cultura-04",
        title: "Analisar enquadramento lexical no debate público",
        rule: "Escolhas lexicais distribuem agência, normalidade e valor antes que o argumento explícito comece. Tax relief e public expenditure podem apontar para o mesmo fluxo por perspectivas diferentes. Analise verbos, nominalizações, metáforas e sujeitos ausentes; depois compare enquadramentos sem presumir que uma palavra isolada determina automaticamente a opinião do leitor.",
        example: "The two accounts describe the same transfer while assigning agency and benefit differently.",
        translation: "Os dois relatos descrevem a mesma transferência, mas distribuem agência e benefício de maneiras diferentes.",
        vocabulary: "framing — enquadramento\nnominalisation — nominalização\nagency — agência ou autoria da ação",
        pitfall: "Enquadramento não equivale a mentira. Uma descrição pode ser factual e ainda selecionar perspectiva; demonstre o que ganha destaque e o que fica periférico.",
        dialogue: "One headline reads, 'City rescues failing market with taxpayer funds.' Another says, 'Public investment protects two hundred local jobs.' Both refer to the same grant, amount and council vote. The first makes the city an active rescuer, characterises the market as failing and foregrounds the source of money. The second nominalises the decision as investment, foregrounds employment and leaves the recipient less visible. Neither wording alone settles whether the grant is justified. Their frames guide attention toward different costs, beneficiaries and standards of success that a critical comparison must make explicit.",
        dialogueTranslation: "Uma manchete diz que a cidade resgata mercado em crise com dinheiro público; outra, que investimento público protege duzentos empregos. Ambas tratam do mesmo subsídio. A primeira destaca resgate, fracasso e origem do dinheiro; a segunda chama a decisão de investimento, destaca empregos e reduz a visibilidade do beneficiário. Nenhuma decide sozinha se a medida se justifica; cada uma orienta atenção para custos e critérios diferentes.",
        question: "O que uma comparação crítica deve concluir?",
        choices: [
          "The headlines share core facts but foreground different agents, costs, beneficiaries and standards of success.",
          "Only one headline can be factually true because their evaluative language differs.",
          "Framing guarantees that all readers will adopt the position implied by a headline."
        ],
        explanation: "Os fatos centrais coexistem com seleções lexicais distintas; analisar o enquadramento revela prioridades sem pressupor falsidade ou efeito inevitável.",
        gap: "The second headline foregrounds jobs while leaving the recipient less ___.",
        fills: ["salient", "solvent", "literal"],
        gapExplanation: "Salient significa perceptível ou destacado no discurso. Solvent trata de capacidade financeira; literal não descreve visibilidade informacional.",
        production: "Compare três manchetes sobre o mesmo evento em 450–550 palavras. Mapeie agência, pressupostos, metáforas, ausências e critérios de sucesso, e proponha uma versão informativa.",
        productionChecklist: [
          "Separei fato compartilhado e avaliação lexical?",
          "Mostrei como agência e benefício foram distribuídos?",
          "Evitei afirmar efeitos inevitáveis sobre o público?"
        ],
        speakingTask: "Conduza uma análise oral de quatro minutos e responda à acusação de que reconhecer enquadramento torna todos os relatos equivalentes."
      },
      {
        id: "c2-estilo-cultura-05",
        title: "Editar ritmo, paralelismo e ênfase",
        rule: "Edição avançada decide onde o leitor desacelera, o que permanece paralelo e qual informação recebe o fechamento. Coordene elementos de mesma função, quebre o paralelismo apenas com propósito e use comprimento de frase, pontuação e posição final para modelar ênfase. Elegância deve tornar a arquitetura do raciocínio mais visível.",
        example: "The revision clarifies the sequence, balances the clauses and reserves the final stress for the consequence.",
        translation: "A revisão esclarece a sequência, equilibra as orações e reserva a ênfase final para a consequência.",
        vocabulary: "parallelism — paralelismo\nend-weight — peso no fim da frase\ncadence — cadência",
        pitfall: "Variar frases mecanicamente pode fragmentar o argumento. Leia em voz alta e relacione cada escolha rítmica à hierarquia real das ideias.",
        dialogue: "The draft read: 'The team reviewed the records, interviews were conducted, and deciding to delay the launch.' The list confuses an active clause, a passive clause and a gerund. A first edit restores parallelism: 'The team reviewed the records, conducted interviews and delayed the launch.' Yet this makes three actions sound equally important. The final version reads: 'After reviewing the records and conducting interviews, the team delayed the launch.' Subordination turns the first two actions into grounds for the decision and places the consequential act at the end, where it receives the greatest weight.",
        dialogueTranslation: "O rascunho mistura oração ativa, passiva e gerúndio. Uma edição restaura o paralelismo com três verbos, mas faz as ações parecerem igualmente importantes. A versão final subordina revisão e entrevistas como fundamento e coloca o adiamento no fim. Assim, gramática e ritmo revelam a hierarquia causal em vez de apenas deixar a lista simétrica.",
        question: "O que a versão final acrescenta à correção gramatical?",
        choices: [
          "It subordinates the investigative actions and gives final emphasis to the resulting decision.",
          "It proves that every sentence should avoid coordination and contain only one verb.",
          "It removes the relationship between the evidence-gathering and the delayed launch."
        ],
        explanation: "A edição final organiza ações preparatórias como circunstância e reserva a posição enfática para a decisão, refletindo a lógica do episódio.",
        gap: "The editor brought the consequence ___ the fore by placing it at the end.",
        fills: ["to", "at", "on"],
        gapExplanation: "Bring to the fore significa destacar. A posição final torna a consequência o ponto de maior peso informacional e rítmico.",
        production: "Edite um parágrafo de 180 palavras em três versões: neutra, urgente e reflexiva. Anote decisões sobre paralelismo, subordinação, pontuação e peso final.",
        productionChecklist: [
          "A sintaxe mostra a hierarquia lógica?",
          "O paralelismo agrupa funções realmente equivalentes?",
          "Ritmo e ênfase combinam com o efeito declarado?"
        ],
        speakingTask: "Leia as três versões em voz alta e explique como pausas e posição final alteram o foco sem mudar os fatos."
      },
      {
        id: "c2-estilo-cultura-06",
        title: "Projeto C2: crítica comparativa e defesa oral",
        rule: "Uma crítica comparativa de nível C2 formula um critério produtivo, aproxima textos sem apagar diferenças de gênero e revê sua tese diante da melhor objeção. Integre análise microscópica da linguagem e consequências mais amplas. Na defesa oral, responda ao ponto exato, reformule sob pressão e reconheça uma limitação sem abandonar o julgamento sustentado.",
        example: "The comparison is illuminating precisely where the texts pursue similar ends through incompatible rhetorical means.",
        translation: "A comparação é esclarecedora justamente onde os textos buscam fins semelhantes por meios retóricos incompatíveis.",
        vocabulary: "comparative lens — lente comparativa\nclose reading — leitura minuciosa\ncounter-reading — leitura alternativa",
        pitfall: "Sem um eixo comum, a comparação vira dois resumos paralelos. Sem diferenças, vira equivalência forçada. Faça o critério trabalhar nos dois sentidos.",
        dialogue: "Two public letters argue for preserving a riverside district. The first adopts legal precision, defines obligations and names the authority responsible for enforcement. The second uses family memories, sensory detail and an inclusive 'we' to make loss imaginable. A weak comparison calls one factual and the other emotional. A stronger account asks how each constructs public responsibility: one through enforceable duty, the other through shared belonging. It also notices their limits. The legal letter narrows the people who can speak with authority, while the memoir risks treating one family's history as the district's collective memory.",
        dialogueTranslation: "Duas cartas defendem um bairro ribeirinho. A primeira usa precisão jurídica, obrigações e autoridade; a segunda, memórias, detalhes sensoriais e 'nós'. Em vez de opor fato e emoção, uma análise forte pergunta como ambas constroem responsabilidade pública: por dever exigível ou pertencimento. Também vê limites: o texto jurídico restringe vozes autorizadas; a memória familiar pode se apresentar como memória coletiva.",
        question: "Qual eixo comparativo produz a análise mais rica?",
        choices: [
          "How each text constructs public responsibility through different resources, and what each construction excludes.",
          "Which text contains more adjectives, regardless of their function in the argument.",
          "Whether legal prose is factual and personal prose is therefore incapable of making a claim."
        ],
        explanation: "O eixo conecta propósito, recursos retóricos e limites nos dois textos, permitindo comparação recíproca em vez de contagem ou oposição simplista.",
        gap: "The analysis brings the two letters ___ conversation without collapsing their differences.",
        fills: ["into", "under", "across"],
        gapExplanation: "Bring into conversation significa colocar textos em relação analítica; a expressão permite diálogo comparativo sem exigir equivalência.",
        production: "Escreva uma crítica comparativa de 650–800 palavras com tese, leitura minuciosa dos dois textos, contexto, melhor leitura alternativa e conclusão revista. Prepare também uma síntese oral de cinco minutos.",
        productionChecklist: [
          "Meu eixo revela semelhanças e diferenças relevantes?",
          "Analisei escolhas linguísticas específicas em ambos os textos?",
          "Enfrentei a melhor leitura alternativa de forma justa?",
          "A conclusão mostra o que a comparação tornou visível?",
          "Consigo reformular a tese para públicos diferentes?"
        ],
        speakingTask: "Defenda a crítica em cinco minutos, responda a três perguntas imprevistas e encerre com uma tese reformulada em trinta segundos."
      }
    ]
  }
];
