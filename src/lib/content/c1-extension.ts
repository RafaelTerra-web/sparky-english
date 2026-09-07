import type { ModuleDraft } from "./types";

export const c1ExtensionModules: ModuleDraft[] = [
  {
    id: "c1-evidencias",
    title: "Evidência, explicação e comunicação pública",
    level: "C1",
    description: "Avaliar fontes, explicar incerteza e transformar pesquisa em comunicação rigorosa para públicos diferentes.",
    lessons: [
      {
        id: "c1-evidencias-01",
        title: "Avaliar a força de uma fonte",
        rule: "Ao avaliar uma fonte, separe autoridade, método e pertinência. Peer-reviewed descreve um processo editorial, mas não garante que toda conclusão seja definitiva. Pergunte quem produziu o dado, como a amostra foi formada, quais limitações foram declaradas e se a evidência realmente responde à questão em debate.",
        example: "The study is relevant, but its narrow sample limits the reach of its conclusions.",
        translation: "O estudo é relevante, mas sua amostra restrita limita o alcance das conclusões.",
        vocabulary: "peer-reviewed — revisado por pares\nrepresentative sample — amostra representativa\nreach — alcance",
        pitfall: "Credibilidade institucional não elimina limites metodológicos. Evite rejeitar uma fonte inteira por uma limitação ou tratá-la como prova final por causa do prestígio.",
        dialogue: "A council cited a university survey to justify extending library hours. The survey was carefully reviewed and its questions were published, yet only current library members received the questionnaire. It offers strong evidence about the preferences of existing users, especially evening visitors. It says much less about residents who do not hold a library card. The committee can use the findings, provided that it describes the sample accurately and gathers additional evidence before claiming that the schedule represents the whole neighbourhood.",
        dialogueTranslation: "Um conselho citou uma pesquisa universitária para ampliar o horário da biblioteca. O estudo foi revisado e publicou as perguntas, mas consultou apenas usuários cadastrados. Ele sustenta bem as preferências dos usuários atuais, especialmente os noturnos, e diz pouco sobre outros moradores. O comitê pode usá-lo se descrever corretamente a amostra e buscar evidência adicional antes de falar por todo o bairro.",
        question: "Qual avaliação representa melhor a utilidade da pesquisa?",
        choices: [
          "It is useful for understanding current members, but it cannot by itself represent every resident.",
          "Its university affiliation makes the sample representative of the entire neighbourhood.",
          "Because non-members were absent, none of the responses can inform the decision."
        ],
        explanation: "A resposta delimita a conclusão ao grupo observado e preserva a utilidade da fonte, sem generalizar a amostra nem descartar os dados existentes.",
        gap: "The findings are informative, ___ they should not be generalised beyond the sampled group.",
        fills: ["although", "therefore", "unless"],
        gapExplanation: "Although introduz a concessão correta: os achados informam, apesar de não autorizarem a generalização pretendida.",
        production: "Compare duas fontes sobre uma decisão pública em 280–350 palavras. Avalie autoria, método, população observada, limites e contribuição específica de cada uma.",
        productionChecklist: [
          "Distingui prestígio institucional e qualidade do método?",
          "Limitei cada conclusão à população observada?",
          "Expliquei o que cada fonte ainda permite afirmar?"
        ],
        speakingTask: "Apresente em três minutos qual fonte é mais útil para a decisão e responda a uma objeção sobre a amostra."
      },
      {
        id: "c1-evidencias-02",
        title: "Delimitar afirmações para públicos distintos",
        rule: "Uma afirmação responsável pode mudar de forma sem mudar de força. Hedging com suggests, appears to e is consistent with sinaliza o alcance da evidência. Ao adaptar o texto, preserve quem foi observado, o período e o grau de certeza; simplificar vocabulário não autoriza transformar associação em causa ou tendência em regra.",
        example: "The figures suggest a short-term shift rather than a permanent change in behaviour.",
        translation: "Os números sugerem uma mudança de curto prazo, e não uma alteração permanente de comportamento.",
        vocabulary: "hedging — linguagem de ressalva\nshort-term shift — mudança de curto prazo\naccount for — explicar ou representar",
        pitfall: "Palavras simples podem continuar precisas. O problema surge quando likely vira certainly, linked to vira caused by ou some participants vira people in general.",
        dialogue: "An internal report found that remote staff attended more optional training sessions during a twelve-week trial. Managers received the technical sentence, 'Participation was positively associated with flexible scheduling during the observation period.' A public newsletter initially rewrote it as, 'Working from home makes everyone learn more.' The editor revised that claim because the trial was brief, attendance was not the same as learning, and employees had chosen whether to join. The final version said that flexible schedules may have helped participating staff attend more sessions during the trial.",
        dialogueTranslation: "Um relatório encontrou maior presença de funcionários remotos em treinamentos opcionais durante um teste de doze semanas. Um boletim transformou a associação em 'trabalhar de casa faz todos aprenderem mais'. A editora corrigiu porque o período era curto, presença não equivalia a aprendizagem e a participação era voluntária. A versão final disse que horários flexíveis podem ter ajudado os participantes a comparecer mais.",
        question: "Por que a primeira versão do boletim era imprecisa?",
        choices: [
          "It turned a limited association about attendance into a universal causal claim about learning.",
          "It retained too many details about the observation period and voluntary participation.",
          "It refused to mention any possible relationship between scheduling and attendance."
        ],
        explanation: "A versão ampliava população, causalidade e resultado: o estudo tratava de participantes, associação e presença, não de todos, causa e aprendizagem.",
        gap: "The pattern is consistent ___ flexible schedules helping some employees attend.",
        fills: ["with", "to", "for"],
        gapExplanation: "Consistent with apresenta uma explicação compatível com os dados sem declará-la como causa definitivamente demonstrada.",
        production: "Escreva a mesma conclusão em três versões: uma nota técnica, um e-mail para gestores e um comunicado público. Mantenha escopo e certeza equivalentes.",
        productionChecklist: [
          "Preservei população, período e resultado medido?",
          "Mantive o mesmo grau de certeza nas três versões?",
          "Evitei confundir associação com causalidade?"
        ],
        speakingTask: "Explique o resultado por dois minutos a alguém sem formação estatística e responda à pergunta: 'Então isso prova que funciona?'."
      },
      {
        id: "c1-evidencias-03",
        title: "Explicar método e incerteza",
        rule: "Explique incerteza como parte do conhecimento, não como defeito automático. Margin of error, confidence interval e missing data respondem a problemas diferentes. Uma explicação clara informa o que foi medido, por que o valor pode variar e quais decisões continuam razoáveis, sem usar jargão como escudo nem prometer precisão inexistente.",
        example: "The estimate is sufficiently precise for planning, though not for ranking small differences.",
        translation: "A estimativa é precisa o bastante para planejamento, embora não para classificar diferenças pequenas.",
        vocabulary: "margin of error — margem de erro\nconfidence interval — intervalo de confiança\nmissing data — dados ausentes",
        pitfall: "Incerteza não significa que qualquer resultado seja possível. Mostre a faixa relevante e o efeito prático, em vez de dizer apenas que os números podem estar errados.",
        dialogue: "A regional survey estimated that between 62 and 68 percent of commuters supported later evening buses. One newspaper announced support of exactly 65 percent, while another claimed that uncertainty made the survey useless. The research lead rejected both accounts. The interval was narrow enough to show majority support and guide capacity planning, but it could not establish whether support was two points higher in one small district than another. She recommended planning for the regional demand while collecting larger local samples before ranking districts.",
        dialogueTranslation: "Uma pesquisa regional estimou apoio entre 62% e 68% a ônibus mais tarde. Um jornal anunciou exatamente 65%; outro disse que a incerteza inutilizava o estudo. A pesquisadora explicou que a faixa mostrava maioria e orientava capacidade, mas não permitia classificar diferenças pequenas entre distritos. Recomendou planejar a demanda regional e ampliar amostras locais.",
        question: "O que o intervalo permite concluir?",
        choices: [
          "Regional majority support is plausible enough for planning, while small district rankings remain unsupported.",
          "Support is known to be exactly 65 percent in every district.",
          "No transport decision can be made until all uncertainty disappears."
        ],
        explanation: "A faixa sustenta uma maioria regional para planejamento, mas sua resolução e as amostras locais não sustentam ordenar diferenças pequenas.",
        gap: "The interval is narrow enough ___ support regional planning.",
        fills: ["to", "for", "that"],
        gapExplanation: "Enough to + verbo expressa suficiência para uma ação: narrow enough to support, sem prometer precisão para outros usos.",
        production: "Produza uma explicação de 250–320 palavras sobre uma estimativa incerta. Inclua faixa, fonte da incerteza, conclusão possível e decisão que exigiria mais dados.",
        productionChecklist: [
          "Traduzi a incerteza em consequência prática?",
          "Disse o que os dados sustentam e o que não sustentam?",
          "Evitei precisão falsa e ceticismo absoluto?"
        ],
        speakingTask: "Dê uma entrevista de três minutos em que você explica por que uma estimativa pode ser útil mesmo sem ser exata."
      },
      {
        id: "c1-evidencias-04",
        title: "Transformar dados em narrativa responsável",
        rule: "Uma narrativa de dados seleciona ordem, comparação e escala; por isso, nunca é neutra. Comece pela pergunta e pelo denominador relevante. Destaque mudança absoluta e relativa quando produzirem impressões diferentes, explique a linha de base e não faça um caso isolado carregar uma tendência que o conjunto não mostra.",
        example: "The rate doubled, but the increase represented only four additional cases.",
        translation: "A taxa dobrou, mas o aumento representou apenas quatro casos adicionais.",
        vocabulary: "baseline — linha de base\ndenominator — denominador\nabsolute increase — aumento absoluto",
        pitfall: "Dobrou pode soar enorme quando a base é pequena. Apenas quatro também pode minimizar um risco sério. Ofereça as duas escalas e o contexto decisório.",
        dialogue: "A safety report recorded eight bicycle incidents this year, compared with four last year. A campaign described a 100 percent increase; an official response called it only four extra cases. Both statements were mathematically correct and rhetorically selective. The number of journeys had also risen by 60 percent, so incidents per thousand journeys increased more modestly. The analyst presented counts, percentage change and exposure rate together. She then noted that two junctions accounted for most incidents, making targeted changes more informative than a dramatic citywide headline.",
        dialogueTranslation: "Um relatório registrou oito incidentes com bicicletas, contra quatro no ano anterior. Uma campanha falou em aumento de 100%; a resposta oficial, em apenas quatro casos extras. Ambas selecionavam uma escala. Como as viagens também cresceram 60%, a taxa por mil viagens subiu menos. A analista mostrou contagens, percentual e exposição, observando concentração em dois cruzamentos.",
        question: "Qual apresentação é mais responsável?",
        choices: [
          "Report the counts, relative change and journey-adjusted rate, then identify where incidents were concentrated.",
          "Use only the 100 percent increase because it produces the strongest warning.",
          "Use only four additional cases because absolute numbers are always more truthful."
        ],
        explanation: "As três medidas respondem a perguntas diferentes e, juntas, mostram magnitude, crescimento, exposição e concentração sem escolher uma impressão conveniente.",
        gap: "Most incidents were concentrated ___ two junctions.",
        fills: ["at", "into", "over"],
        gapExplanation: "Concentrated at localiza a concentração nos dois cruzamentos; as outras preposições não expressam essa relação espacial.",
        production: "Crie uma narrativa de 300–380 palavras a partir de um conjunto de números com base pequena. Apresente escalas concorrentes e justifique a comparação principal.",
        productionChecklist: [
          "Informei a linha de base e o denominador?",
          "Mostrei valores absolutos e relativos relevantes?",
          "A conclusão responde à decisão em vez de buscar impacto?"
        ],
        speakingTask: "Apresente os mesmos dados em noventa segundos e depois corrija oralmente uma manchete que exagera o resultado."
      },
      {
        id: "c1-evidencias-05",
        title: "Responder à desinformação sem amplificá-la",
        rule: "Uma correção eficaz começa pelo fato verificável, explica a lacuna e repete a conclusão correta. Evite transformar o boato no título ou repeti-lo muitas vezes. Se houver parte verdadeira, reconheça-a com precisão antes de mostrar por que ela não sustenta a conclusão enganosa. Inclua uma fonte que o público possa conferir.",
        example: "The verified record shows a schedule change, not the cancellation described online.",
        translation: "O registro verificado mostra uma mudança de horário, e não o cancelamento descrito na internet.",
        vocabulary: "verified record — registro verificado\nmisleading claim — afirmação enganosa\ninformation gap — lacuna de informação",
        pitfall: "Ridicularizar quem acreditou no boato pode aumentar resistência. Corrija a afirmação e ofereça um caminho verificável sem atribuir má-fé sem evidência.",
        dialogue: "A widely shared post claimed that the town clinic was closing permanently. The clinic had actually cancelled Saturday appointments for one month while electrical work was completed; weekday services and emergency referrals continued. Its first response repeated the false claim in capital letters before denying it, which helped screenshots circulate without the correction. The revised notice led with the current opening hours, explained the temporary Saturday change, linked to the works schedule and gave a telephone number for patients whose appointments were affected.",
        dialogueTranslation: "Uma publicação dizia que a clínica fecharia para sempre. Na realidade, consultas de sábado foram suspensas por um mês durante obra elétrica; dias úteis e encaminhamentos continuaram. A primeira resposta repetiu o boato em destaque e circulou sem a negativa. O aviso revisto começou pelos horários, explicou a mudança temporária, vinculou o cronograma e ofereceu telefone aos afetados.",
        question: "Por que o aviso revisto reduz melhor a confusão?",
        choices: [
          "It leads with verified service information and supplies context and a checkable source.",
          "It repeats the alarming claim more prominently so that nobody can miss it.",
          "It assumes that everyone sharing the post intended to deceive patients."
        ],
        explanation: "A correção torna o fato principal mais memorável, explica a origem da confusão e oferece verificação sem ampliar o boato ou inventar intenção.",
        gap: "The notice clarified that weekday services would carry ___.",
        fills: ["on", "out", "over"],
        gapExplanation: "Carry on significa continuar. Carry out seria executar uma tarefa; carry over indicaria transferência para outro período.",
        production: "Redija uma correção pública de 180–240 palavras: fato principal, contexto que explica o erro, fonte verificável e ação para pessoas afetadas.",
        productionChecklist: [
          "Comecei pelo fato correto e útil?",
          "Evitei repetir desnecessariamente a afirmação falsa?",
          "Ofereci fonte e próxima ação verificáveis?"
        ],
        speakingTask: "Grave mentalmente um esclarecimento de dois minutos para rádio, com o fato primeiro e uma resposta calma a uma pergunta desconfiada."
      },
      {
        id: "c1-evidencias-06",
        title: "Projeto C1: produzir um briefing baseado em evidências",
        rule: "Um briefing transforma análise em decisão sem esconder dissenso. Declare a pergunta, sintetize evidências convergentes e conflitantes, indique limites e apresente opções com consequências. A recomendação deve seguir critérios explícitos e incluir sinais que justificariam revisão, para que confiança não seja confundida com inflexibilidade.",
        example: "On balance, a limited pilot is justified, provided that access and outcomes are independently reviewed.",
        translation: "Considerando o conjunto, um projeto-piloto limitado se justifica, desde que acesso e resultados sejam avaliados de forma independente.",
        vocabulary: "on balance — considerando o conjunto\ntrade-off — relação de ganhos e perdas\nreview trigger — condição de revisão",
        pitfall: "Listar prós e contras não basta. Pondere a qualidade das evidências e mostre por que seus critérios tornam uma opção preferível nas condições atuais.",
        dialogue: "A district is considering free evening classes. Attendance records show unmet demand, interviews reveal transport barriers, and a small pilot suggests improved retention when travel vouchers are offered. The pilot lacks a comparison group and involved only two centres. Funding can support either a six-month expansion with vouchers or a larger evaluation before any expansion. The briefing recommends a limited four-centre pilot, publishes eligibility rules, compares attendance with similar centres and sets review points after eight and twenty-four weeks. This option serves more learners while generating evidence that can change the next decision.",
        dialogueTranslation: "Um distrito considera aulas noturnas gratuitas. Registros mostram demanda, entrevistas revelam barreiras de transporte e um teste pequeno sugere melhor permanência com vales. O teste não teve grupo de comparação e cobriu dois centros. O briefing recomenda piloto em quatro centros, regras públicas, comparação com centros semelhantes e revisões em oito e vinte e quatro semanas, atendendo mais alunos enquanto melhora a evidência.",
        question: "O que torna a recomendação defensável?",
        choices: [
          "It links a proportionate action to stated evidence limits, comparison and scheduled review.",
          "It treats the small pilot as conclusive proof that expansion will work everywhere.",
          "It postpones all support until a perfectly controlled study becomes possible."
        ],
        explanation: "A opção responde à necessidade atual, limita escala, melhora a comparação e define revisão; assim, ação e aprendizagem avançam juntas.",
        gap: "The pilot should proceed, provided ___ its outcomes are independently reviewed.",
        fills: ["that", "which", "whether"],
        gapExplanation: "Provided that introduz uma condição explícita para a recomendação: avançar depende da avaliação independente dos resultados.",
        production: "Produza um briefing de 450–550 palavras com pergunta, síntese de três fontes, opções, recomendação, riscos, indicadores e condições de revisão. Acrescente um resumo executivo de 80 palavras.",
        productionChecklist: [
          "Ponderei qualidade, convergência e limites das fontes?",
          "Liguei a recomendação a critérios explícitos?",
          "Defini indicadores, responsáveis e condições de revisão?",
          "O resumo permite compreender a decisão sem ler o anexo?"
        ],
        speakingTask: "Defenda o briefing por quatro minutos, responda a duas objeções e encerre dizendo que evidência faria você revisar a recomendação."
      }
    ]
  }
];
