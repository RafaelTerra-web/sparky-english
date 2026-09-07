import type { ModuleDraft } from "./types";
export const b2Modules: ModuleDraft[] = [
  {
    "id": "b2-argumentacao",
    "title": "Sustentar e discutir posições",
    "level": "B2",
    "description": "Avaliar evidências, formular ressalvas e negociar soluções em debates e decisões.",
    "lessons": [
      {
        "title": "Defender uma posição com ressalvas",
        "rule": "Um argumento equilibrado distingue a posição principal das suas condições. Although introduz uma oração de concessão; nevertheless conecta uma conclusão que se mantém apesar da objeção. Prefira uma afirmação delimitada a uma promessa universal e explique por que a ressalva não elimina sua proposta.",
        "example": "Although the trial was short, it provided useful evidence.",
        "translation": "Embora o teste tenha sido curto, ele forneceu evidências úteis.",
        "vocabulary": "trial — teste piloto\nnevertheless — mesmo assim\ntrade-off — escolha com vantagens e perdas",
        "pitfall": "Despite recebe substantivo ou forma em -ing; although recebe oração. Não escreva despite the trial was short.",
        "dialogue": "A town tested a pedestrian zone for four weekends. Shop owners reported higher Saturday sales, but deliveries took longer and two accessible parking spaces were removed. The council suggested making the scheme permanent immediately. A residents' group supported a longer trial instead: it wanted weekday evidence and replacement accessible spaces before a final decision. Its spokesperson said that the early results were encouraging, although they did not yet show how the scheme would work throughout the year.",
        "dialogueTranslation": "Uma cidade testou uma área de pedestres por quatro fins de semana. Lojistas relataram vendas maiores aos sábados, mas as entregas demoraram e duas vagas acessíveis foram retiradas. O conselho sugeriu tornar o projeto permanente imediatamente. Um grupo de moradores preferiu um teste mais longo: queria dados de dias úteis e vagas acessíveis substitutas antes da decisão. A representante considerou os resultados promissores, mas insuficientes para prever o ano inteiro.",
        "question": "Qual posição melhor representa o grupo de moradores?",
        "choices": [
          "Extend the trial and address access before deciding.",
          "Make the scheme permanent without further changes.",
          "Reject pedestrian zones regardless of the evidence."
        ],
        "explanation": "O grupo apoia a continuidade condicionada a dados e acessibilidade; não pede aprovação imediata nem rejeita a ideia.",
        "gap": "___ the sales increased, delivery problems remained.",
        "fills": [
          "Although",
          "Despite",
          "Because of"
        ],
        "gapExplanation": "Although introduz sales increased, uma oração com sujeito e verbo. As outras opções exigem outra construção.",
        "production": "Escreva 180–220 palavras recomendando manter, ampliar ou encerrar o teste. Use os dados apresentados, reconheça duas limitações e explique qual informação mudaria sua decisão.",
        "productionChecklist": [
          "Minha recomendação é explícita?",
          "Separei resultados observados de previsões?",
          "Respondi à questão de acessibilidade?"
        ],
        "speakingTask": "Defenda sua recomendação em dois minutos; em seguida, responda à objeção de um lojista sem repetir o texto.",
        "id": "b2-argumentacao-01"
      },
      {
        "title": "Distinguir correlação de causa",
        "rule": "Ao comentar dados, increased after descreve sequência temporal; caused afirma causalidade. May have contributed apresenta uma hipótese com cautela. Compare grupos, considere explicações alternativas e ajuste o grau de certeza ao desenho do estudo, em vez de usar palavras fortes para preencher uma lacuna na evidência.",
        "example": "The new schedule may have contributed to the improvement.",
        "translation": "O novo horário pode ter contribuído para a melhora.",
        "vocabulary": "contribute — contribuir\ncomparison group — grupo de comparação\naccount for — explicar",
        "pitfall": "Must have causado algo não expressa prova; é uma inferência forte. Não confunda confiança gramatical com evidência suficiente.",
        "dialogue": "After a company introduced flexible starting times, staff reported less stress. During the same month, a large project ended and temporary assistants joined the team. The manager credited the new schedule with the entire improvement. The analyst was more cautious: there was no comparison group, and all three changes could have affected the results. She recommended repeating the survey during a busy period before drawing a firm conclusion, while keeping the popular schedule in place.",
        "dialogueTranslation": "Depois que uma empresa flexibilizou horários, a equipe relatou menos estresse. No mesmo mês, terminou um grande projeto e chegaram assistentes temporários. O gerente atribuiu toda a melhora ao horário. A analista foi cautelosa: não havia grupo de comparação e as três mudanças poderiam ter afetado os resultados. Ela recomendou repetir a pesquisa em um período intenso antes de concluir, mantendo o horário popular.",
        "question": "Por que a analista evita uma conclusão causal forte?",
        "choices": [
          "Several changes occurred without a comparison group.",
          "The staff refused to answer the survey.",
          "Flexible schedules always increase stress."
        ],
        "explanation": "A coincidência de mudanças e a falta de comparação impedem isolar o efeito do horário; isso não prova que ele foi inútil.",
        "gap": "The assistants may have ___ to the lower stress levels.",
        "fills": [
          "contributed",
          "contribute",
          "contributing"
        ],
        "gapExplanation": "May have pede particípio passado: contributed. O modal indica possibilidade, sem estabelecer causalidade.",
        "production": "Redija 180–220 palavras para o gerente: resuma a melhora, apresente duas explicações alternativas e proponha uma comparação viável sem alegar prova definitiva.",
        "productionChecklist": [
          "Evitei transformar sequência em causa?",
          "Expliquei a limitação da comparação?",
          "Propus como obter dados melhores?"
        ],
        "speakingTask": "Explique em 90 segundos a diferença entre um resultado promissor e uma conclusão comprovada, usando esse caso.",
        "id": "b2-argumentacao-02"
      },
      {
        "title": "Discordar sem encerrar o diálogo",
        "rule": "Discordância produtiva reconhece uma preocupação antes de questionar a conclusão. I see your point, but… e I would question whether… permitem discordar sem atribuir intenções ao interlocutor. Acrescente uma alternativa concreta; suavizar a frase não deve esconder o problema que você precisa discutir.",
        "example": "I see your point, but we need a more reliable estimate.",
        "translation": "Entendo seu ponto, mas precisamos de uma estimativa mais confiável.",
        "vocabulary": "estimate — estimativa\nconcern — preocupação\nreliable — confiável",
        "pitfall": "I disagree with you refere-se à pessoa ou opinião; I disagree about the deadline indica o assunto. Evite I am disagree.",
        "dialogue": "Lia wanted to promise customers delivery within two days, arguing that competitors already did so. Ben understood the commercial pressure but questioned whether the current warehouse could support that promise. He suggested testing the service in one region and publishing a longer standard delivery window elsewhere. Lia accepted the regional trial, provided the website clearly distinguished the two services. Neither person abandoned the goal of faster delivery; they changed the scope of the promise.",
        "dialogueTranslation": "Lia queria prometer entrega em dois dias porque concorrentes já faziam isso. Ben compreendia a pressão comercial, mas questionava a capacidade do depósito. Sugeriu testar o serviço em uma região e divulgar um prazo padrão maior nas demais. Lia aceitou, desde que o site distinguisse os serviços. Ninguém abandonou o objetivo de rapidez; eles mudaram o alcance da promessa.",
        "question": "Como Ben torna a discordância construtiva?",
        "choices": [
          "He acknowledges the pressure and proposes a limited trial.",
          "He accuses Lia of deliberately misleading customers.",
          "He rejects every attempt to improve delivery."
        ],
        "explanation": "Ben reconhece o motivo comercial e oferece um teste limitado; ele contesta o alcance da promessa, não a intenção de Lia.",
        "gap": "I disagree ___ the claim that every order can arrive tomorrow.",
        "fills": [
          "with",
          "to",
          "for"
        ],
        "gapExplanation": "Disagree with é a combinação usada para discordar de uma afirmação; to e for não completam esse padrão.",
        "production": "Escreva uma resposta de 160–200 palavras à proposta de entrega: reconheça a motivação, questione uma premissa e negocie uma alternativa com um critério de sucesso.",
        "productionChecklist": [
          "A discordância está clara e respeitosa?",
          "Questionei uma premissa específica?",
          "Ofereci uma alternativa testável?"
        ],
        "speakingTask": "Pratique a reunião em duas vozes por dois minutos. Responda a uma objeção inesperada e confirme o acordo.",
        "id": "b2-argumentacao-03"
      },
      {
        "title": "Comparar alternativas por critérios",
        "rule": "Uma comparação útil mantém os mesmos critérios para todas as opções. Whereas contrasta orações; in terms of delimita o aspecto avaliado. Uma opção pode ter o menor custo inicial e o maior custo de manutenção. Explicite o peso dos critérios antes de anunciar o melhor resultado para evitar uma comparação seletiva.",
        "example": "The first option is cheaper, whereas the second is easier to maintain.",
        "translation": "A primeira opção é mais barata, enquanto a segunda é mais fácil de manter.",
        "vocabulary": "upfront cost — custo inicial\nmaintenance — manutenção\nweigh up — ponderar",
        "pitfall": "Cheaper não equivale a better value: preço e benefício total são critérios diferentes. Nomeie o critério em vez de usar better sem explicação.",
        "dialogue": "A library compared two booking systems. System A cost less to install and worked on older computers, but staff had to create weekly reports manually. System B automated the reports and offered better accessibility features, though it required new equipment. The library had a limited equipment budget and only one administrator. Rather than declaring a universal winner, the committee asked suppliers for a three-year cost estimate and a demonstration with users who relied on screen readers.",
        "dialogueTranslation": "Uma biblioteca comparou dois sistemas. A custava menos para instalar e funcionava em computadores antigos, mas relatórios semanais eram manuais. B automatizava relatórios e oferecia melhor acessibilidade, embora exigisse equipamentos novos. Com orçamento limitado e apenas um administrador, a comissão pediu estimativas de três anos e demonstrações com usuários de leitores de tela antes de escolher.",
        "question": "Qual informação ainda é necessária para uma comparação adequada?",
        "choices": [
          "Long-term costs and observed accessibility performance.",
          "Only the colour of each system's logo.",
          "A promise that the cheapest system is always best."
        ],
        "explanation": "Custos de três anos e demonstração de acessibilidade permitem comparar critérios relevantes; preço inicial sozinho não resolve a decisão.",
        "gap": "___ terms of maintenance, the second system may save staff time.",
        "fills": [
          "In",
          "On",
          "At"
        ],
        "gapExplanation": "In terms of é a expressão que introduz o critério da comparação; on e at não são usados nessa locução.",
        "production": "Produza uma recomendação de 180–220 palavras para a biblioteca. Compare custo inicial, tempo da equipe e acessibilidade usando os mesmos critérios para A e B.",
        "productionChecklist": [
          "Comparei as duas opções pelos mesmos critérios?",
          "Declarei o peso das prioridades?",
          "Reconheci o que ainda não foi demonstrado?"
        ],
        "speakingTask": "Faça uma apresentação de dois minutos explicando por que a opção mais barata inicialmente pode não ser a melhor decisão.",
        "id": "b2-argumentacao-04"
      },
      {
        "title": "Negociar condições realistas",
        "rule": "Provided that e as long as estabelecem condições para aceitar uma proposta. Na referência futura, a oração com if normalmente usa presente, mesmo quando a principal traz will. Distingua condição essencial de preferência; negociações ficam mais claras quando cada pessoa sabe o que pode mudar e o que precisa ser cumprido.",
        "example": "We can extend the deadline provided that the scope stays the same.",
        "translation": "Podemos ampliar o prazo desde que o escopo continue o mesmo.",
        "vocabulary": "scope — escopo\ncondition — condição\nextension — prorrogação",
        "pitfall": "Provided that introduz uma condição, não uma justificativa já confirmada. Não trate a aceitação condicional como acordo incondicional.",
        "dialogue": "A designer offered to deliver a brochure on Friday instead of Wednesday if the client approved the final text by Monday. The client agreed to Monday but asked for three extra pages. The designer explained that the extension covered the existing eight pages only; extra pages would require a revised quote. They agreed to keep the eight-page brochure for Friday and discuss a separate supplement later. The deadline changed, but the amount of work in the current agreement did not.",
        "dialogueTranslation": "Uma designer ofereceu entregar o folheto na sexta em vez de quarta se o cliente aprovasse o texto até segunda. O cliente aceitou segunda, mas pediu três páginas extras. Ela explicou que a prorrogação cobria apenas as oito páginas atuais; extras exigiriam novo orçamento. Acordaram oito páginas para sexta e um suplemento separado depois. O prazo mudou; a quantidade de trabalho atual, não.",
        "question": "Qual é o acordo final?",
        "choices": [
          "Eight pages on Friday, with a possible supplement discussed later.",
          "Eleven pages on Friday for the original price.",
          "Eight pages on Wednesday without text approval."
        ],
        "explanation": "O acordo preserva oito páginas e transfere a entrega para sexta; o suplemento continua fora do trabalho contratado.",
        "gap": "We will finish on Friday if the client ___ the text on Monday.",
        "fills": [
          "approves",
          "will approve",
          "approving"
        ],
        "gapExplanation": "Na condição futura com if usamos presente simples: approves. O futuro está na oração principal com will.",
        "production": "Escreva um e-mail de 160–200 palavras confirmando prazo, escopo, condição de aprovação e procedimento para pedidos adicionais. Evite promessas não negociadas.",
        "productionChecklist": [
          "Separei condição de preferência?",
          "Fixei prazo e escopo?",
          "Expliquei como lidar com mudanças?"
        ],
        "speakingTask": "Negocie por dois minutos um prazo com outra pessoa e encerre repetindo os pontos que realmente foram acordados.",
        "id": "b2-argumentacao-05"
      },
      {
        "title": "Responder a uma objeção forte",
        "rule": "Responder bem a uma objeção exige representá-la fielmente antes de contestá-la. The main concern is… resume o argumento contrário; this could be addressed by… propõe uma resposta. Se a objeção revela uma limitação real, ajuste sua proposta. Conceder um ponto pode fortalecer o argumento sem abandonar sua conclusão.",
        "example": "This concern could be addressed by offering an offline option.",
        "translation": "Essa preocupação poderia ser atendida oferecendo uma opção sem internet.",
        "vocabulary": "objection — objeção\nexclude — excluir\naddress — tratar de um problema",
        "pitfall": "Address a concern não significa provar que ela é falsa. A expressão indica que você enfrenta a questão e oferece uma resposta.",
        "dialogue": "A school proposed moving all homework notices to an app. One parent objected because some families shared a single phone and had unreliable internet access. The head teacher initially pointed to the app's convenience, but that did not answer the access problem. The revised proposal kept printed weekly notices available without requiring families to justify their request. The parent supported the revision, while asking the school to check whether families actually received the information.",
        "dialogueTranslation": "Uma escola propôs publicar todos os avisos de deveres em um app. Um responsável objetou que algumas famílias dividiam um telefone e tinham internet instável. A diretora primeiro falou da conveniência, sem resolver o acesso. A proposta revisada manteve avisos impressos semanais sem exigir justificativa. O responsável apoiou a revisão, pedindo que a escola verificasse se a informação realmente chegava.",
        "question": "Por que a proposta revisada responde melhor à objeção?",
        "choices": [
          "It offers another way to receive the same information.",
          "It assumes every family has a private phone.",
          "It asks families to stop raising concerns."
        ],
        "explanation": "O impresso atende à limitação de acesso; apenas repetir a conveniência do app não resolveria a objeção.",
        "gap": "The access problem could be addressed ___ keeping printed notices.",
        "fills": [
          "by",
          "from",
          "of"
        ],
        "gapExplanation": "By seguido de forma em -ing indica o meio de resolver o problema: by keeping. As outras preposições não indicam esse procedimento.",
        "production": "Escreva 180–220 palavras defendendo uma política digital inclusiva. Apresente a objeção em sua versão mais forte, responda e inclua um mecanismo de verificação.",
        "productionChecklist": [
          "Descrevi a objeção sem distorcê-la?",
          "Minha resposta resolve o problema levantado?",
          "Incluí como avaliar o acesso real?"
        ],
        "speakingTask": "Resuma a objeção em 30 segundos e responda em 90 segundos, admitindo uma limitação da sua solução.",
        "id": "b2-argumentacao-06"
      }
    ]
  },
  {
    "id": "b2-autonomia",
    "title": "Autonomia em textos e interações",
    "level": "B2",
    "description": "Relatar, reformular, apresentar e resolver problemas com adequação ao público.",
    "lessons": [
      {
        "title": "Relatar uma decisão com precisão",
        "rule": "Ao relatar uma reunião, diferencie o que foi decidido, sugerido e adiado. Agreed to indica compromisso; suggested é proposta e pode receber verbo em -ing. O relato indireto frequentemente desloca o tempo verbal, mas datas concretas são mais seguras que tomorrow quando o leitor verá o texto em outro dia.",
        "example": "They agreed to review the proposal before making a decision.",
        "translation": "Eles concordaram em revisar a proposta antes de tomar uma decisão.",
        "vocabulary": "minutes — ata\npostpone — adiar\ncommitment — compromisso",
        "pitfall": "Suggested doing e agreed to do seguem padrões diferentes. Suggested to do não é o padrão esperado para apresentar a ação sugerida.",
        "dialogue": "On Monday, the team discussed replacing its supplier. Nina suggested inviting two alternatives to present their services. Omar agreed to compare their support arrangements but did not promise to choose a supplier that week. The team decided to keep the current contract until the comparison was complete. A draft summary incorrectly said that a new supplier would be appointed on Friday. Nina corrected it: Friday was the date for collecting proposals, not for making the final choice.",
        "dialogueTranslation": "Na segunda, a equipe discutiu trocar de fornecedor. Nina sugeriu convidar duas alternativas. Omar aceitou comparar o suporte, mas não prometeu escolher naquela semana. Decidiram manter o contrato até concluir a comparação. Um resumo dizia erroneamente que o novo fornecedor seria nomeado na sexta. Nina corrigiu: sexta era a data para receber propostas, não decidir.",
        "question": "O que deve ocorrer na sexta-feira?",
        "choices": [
          "Proposals should be collected.",
          "A new supplier must be appointed.",
          "The existing contract must be cancelled."
        ],
        "explanation": "A correção distingue o prazo para reunir propostas da decisão final; cancelar o contrato também não foi acordado.",
        "gap": "Nina suggested ___ two alternative suppliers.",
        "fills": [
          "inviting",
          "to invite",
          "invite"
        ],
        "gapExplanation": "Suggested aceita a forma em -ing quando apresenta uma ação proposta: suggested inviting.",
        "production": "Escreva uma ata de 180 palavras separando decisões, propostas e pendências. Use datas claras e atribua responsáveis apenas quando o relato os identifica.",
        "productionChecklist": [
          "Diferenciei sugestão de compromisso?",
          "Corrigi a ambiguidade da sexta-feira?",
          "Evitei inventar responsáveis?"
        ],
        "speakingTask": "Dê uma atualização oral de 90 segundos a alguém que não participou da reunião.",
        "id": "b2-autonomia-01"
      },
      {
        "title": "Reformular sem perder o sentido",
        "rule": "Reformular não é trocar todas as palavras por sinônimos. Preserve o agente, as condições, o grau de certeza e a relação entre ideias. In other words introduz uma explicação equivalente; to put it simply pode simplificar linguagem, mas não autoriza remover uma condição que muda o compromisso assumido.",
        "example": "In other words, the discount applies only to annual subscriptions.",
        "translation": "Em outras palavras, o desconto se aplica apenas a assinaturas anuais.",
        "vocabulary": "apply — aplicar-se\nsubscription — assinatura\neligible — elegível",
        "pitfall": "Only pode mudar o alcance da frase. Excluir only to annual subscriptions transforma uma oferta restrita em promessa geral.",
        "dialogue": "A service announced that existing customers could receive a discount if they switched to an annual plan before the end of the month. Monthly customers who kept their plans would continue paying the usual price. A colleague summarised the announcement as a discount for everyone. The support manager asked her to rewrite it, keeping the eligibility condition and the deadline. Clearer wording was welcome, but the simplified version had to describe the same offer.",
        "dialogueTranslation": "Um serviço anunciou desconto para clientes atuais que mudassem para plano anual até o fim do mês. Clientes mensais que mantivessem seus planos pagariam o valor habitual. Uma colega resumiu como desconto para todos. O gerente pediu revisão preservando condição e prazo. A linguagem podia ficar mais simples, mas precisava descrever a mesma oferta.",
        "question": "Qual resumo preserva as condições?",
        "choices": [
          "Existing customers qualify by switching to an annual plan this month.",
          "Every customer receives a discount automatically.",
          "Only new customers can keep monthly plans."
        ],
        "explanation": "A primeira opção conserva público, ação e prazo. As demais ampliam a oferta ou introduzem restrições inexistentes.",
        "gap": "The discount applies ___ annual plans, not monthly ones.",
        "fills": [
          "to",
          "at",
          "by"
        ],
        "gapExplanation": "Apply to indica a quem ou a que uma regra se aplica. At e by não completam esse padrão.",
        "production": "Reescreva o anúncio em 120–160 palavras para um leitor sem familiaridade com contratos. Mantenha público, prazo e condição; depois explique duas escolhas de simplificação.",
        "productionChecklist": [
          "Mantive todas as condições?",
          "Usei palavras familiares?",
          "A simplificação promete exatamente a mesma coisa?"
        ],
        "speakingTask": "Explique a oferta em um minuto e responda à pergunta: se eu não mudar de plano, pago menos?",
        "id": "b2-autonomia-02"
      },
      {
        "title": "Resolver uma reclamação objetiva",
        "rule": "Uma reclamação eficaz descreve o ocorrido, compara-o ao que foi combinado e solicita uma solução proporcional. Was supposed to indica expectativa anterior. Use fatos verificáveis e diferencie pedido de ameaça; a clareza sobre o resultado desejado ajuda o destinatário a responder de modo útil.",
        "example": "The replacement was supposed to arrive last week.",
        "translation": "O produto de substituição deveria ter chegado na semana passada.",
        "vocabulary": "replacement — substituição\nrefund — reembolso\ntracking number — código de rastreio",
        "pitfall": "Complain about refere-se ao problema, enquanto complain to identifica o destinatário. Evite misturar quem recebe a reclamação com o motivo.",
        "dialogue": "A customer returned a damaged lamp and was promised a replacement within five working days. Eight working days later, no tracking number had arrived. The support agent apologised and offered either an immediate refund or a replacement dispatched the next morning. The customer chose the refund because the lamp was needed for an event that had already taken place. She asked for written confirmation of the refund amount and the expected processing time.",
        "dialogueTranslation": "Uma cliente devolveu uma luminária danificada e recebeu promessa de troca em cinco dias úteis. Após oito, não tinha rastreio. O atendente ofereceu reembolso imediato ou envio na manhã seguinte. Ela escolheu reembolso porque o evento já ocorrera e pediu confirmação escrita do valor e do prazo de processamento.",
        "question": "Por que a cliente prefere reembolso?",
        "choices": [
          "The occasion for using the lamp has already passed.",
          "The agent refused to send another lamp.",
          "She never returned the damaged lamp."
        ],
        "explanation": "O evento já passou; a opção de troca existe, mas não resolve a necessidade original da cliente.",
        "gap": "The customer complained ___ the delayed replacement.",
        "fills": [
          "about",
          "to",
          "with"
        ],
        "gapExplanation": "About introduz o motivo da reclamação. To seria usado antes da pessoa ou empresa que a recebe.",
        "production": "Redija uma reclamação de 160–200 palavras com cronologia, compromisso não cumprido e solução desejada. Termine solicitando confirmação verificável.",
        "productionChecklist": [
          "Relatei fatos sem atribuir intenção?",
          "Meu pedido está explícito?",
          "Pedi confirmação de prazo e valor?"
        ],
        "speakingTask": "Simule uma ligação de dois minutos, reformulando sua necessidade depois de ouvir uma alternativa.",
        "id": "b2-autonomia-03"
      },
      {
        "title": "Conduzir uma apresentação clara",
        "rule": "Sinalizadores ajudam o ouvinte a acompanhar a organização: first, turning to e to sum up. Diferencie uma transição de uma conclusão. Em fala, frases mais curtas e retomadas explícitas podem facilitar compreensão sem perder precisão; gráficos exigem que você explique o ponto principal e a limitação dos dados.",
        "example": "Turning to the survey results, most respondents preferred evening classes.",
        "translation": "Passando aos resultados da pesquisa, a maioria dos participantes preferiu aulas à noite.",
        "vocabulary": "respondent — participante da pesquisa\nhighlight — destacar\nsample — amostra",
        "pitfall": "Most respondents não significa most residents quando só algumas pessoas responderam. Não amplie o público da conclusão silenciosamente.",
        "dialogue": "A community centre surveyed people who already attended its classes. Most respondents preferred evening sessions, and several asked for childcare. During her presentation, the coordinator highlighted both findings before discussing costs. She also explained that people unable to attend current classes were not represented in the survey. Her recommendation was to test an evening session with childcare and advertise it beyond the existing mailing list, then compare who attended.",
        "dialogueTranslation": "Um centro pesquisou quem já frequentava suas aulas. A maioria preferiu sessões noturnas e alguns pediram cuidado infantil. A coordenadora destacou ambos os achados e os custos. Explicou também que quem não conseguia frequentar não estava representado. Recomendou testar uma sessão noturna com cuidado infantil e divulgação além da lista atual, comparando depois os participantes.",
        "question": "Que limitação a coordenadora reconhece?",
        "choices": [
          "The survey excludes people who do not attend current classes.",
          "Nobody expressed a preference for evening classes.",
          "The survey proves that childcare is unnecessary."
        ],
        "explanation": "A amostra inclui frequentadores atuais; a recomendação tenta alcançar pessoas ausentes dessa amostra.",
        "gap": "___ sum up, we recommend a limited evening trial.",
        "fills": [
          "To",
          "For",
          "By"
        ],
        "gapExplanation": "To sum up é um sinalizador de resumo ou conclusão, adequado para retomar a recomendação principal.",
        "production": "Prepare um roteiro de apresentação de 200 palavras com abertura, dois resultados, limitação da amostra e recomendação final. Evite ler percentuais inexistentes.",
        "productionChecklist": [
          "Minha estrutura pode ser acompanhada sem slides?",
          "Expliquei a amostra?",
          "Conectei a recomendação aos resultados?"
        ],
        "speakingTask": "Apresente por dois minutos olhando apenas três palavras-chave e responda a uma pergunta sobre quem ficou fora da pesquisa.",
        "id": "b2-autonomia-04"
      },
      {
        "title": "Explicar consequências hipotéticas",
        "rule": "O terceiro condicional relaciona condição passada não realizada a um resultado imaginado: if + past perfect, would have + particípio. Use-o para analisar alternativas, sem confundir o cenário hipotético com fatos do relato. Could have indica possibilidade, enquanto would have costuma apresentar a consequência como mais definida.",
        "example": "If we had checked the file, we would have noticed the missing page.",
        "translation": "Se tivéssemos conferido o arquivo, teríamos percebido a página ausente.",
        "vocabulary": "overlook — deixar passar\nprevent — evitar\nbackup — cópia de segurança",
        "pitfall": "If we would have checked não é a forma padrão dessa condição. Coloque had checked na oração com if.",
        "dialogue": "A volunteer group printed a booklet before checking the final file. One page of emergency contacts was missing. Fortunately, the error was noticed before distribution, and the printer added a separate sheet at no extra charge. The group decided that two people would check future files against a page list. They agreed that checking earlier would have prevented the delay, but did not claim that the missing page had already caused an emergency.",
        "dialogueTranslation": "Um grupo imprimiu um livreto sem conferir o arquivo final. Faltava uma página de contatos de emergência. O erro foi visto antes da distribuição e a gráfica adicionou uma folha sem custo. Decidiram que duas pessoas confeririam os próximos arquivos com uma lista. Reconheceram que a conferência antecipada evitaria o atraso, sem afirmar que o erro causou uma emergência.",
        "question": "Qual consequência realmente ocorreu?",
        "choices": [
          "The missing page delayed preparation before distribution.",
          "The missing page caused a confirmed emergency.",
          "Every booklet was distributed without contact details."
        ],
        "explanation": "Houve correção antes da distribuição e um atraso; o texto explicitamente não relata uma emergência causada pela falha.",
        "gap": "If they ___ checked the file, the delay would have been avoided.",
        "fills": [
          "had",
          "have",
          "would"
        ],
        "gapExplanation": "Had checked é o past perfect usado na condição passada irreal. Would pertence à oração do resultado.",
        "production": "Escreva uma análise de 180–220 palavras separando fatos, consequência hipotética e melhoria de processo. Inclua um terceiro condicional e evite atribuir culpa sem evidência.",
        "productionChecklist": [
          "Separei ocorrido e imaginado?",
          "Usei o terceiro condicional corretamente?",
          "Propus uma prevenção concreta?"
        ],
        "speakingTask": "Relate a falha em um minuto e use o minuto seguinte para explicar como evitá-la.",
        "id": "b2-autonomia-05"
      },
      {
        "title": "Projeto B2: recomendar uma mudança",
        "rule": "Uma recomendação extensa precisa conectar diagnóstico, alternativas e implementação. Use evidência para sustentar a escolha e concessão para lidar com o custo. Uma conclusão eficaz define o próximo passo, o responsável e como revisar a decisão; repetir a opinião inicial sem esses elementos não transforma um argumento em plano.",
        "example": "We recommend a trial before committing to a permanent change.",
        "translation": "Recomendamos um teste antes de assumir uma mudança permanente.",
        "vocabulary": "feasibility — viabilidade\nstakeholder — parte interessada\nmonitor — acompanhar",
        "pitfall": "Recommend doing e recommend that someone do são padrões possíveis. Não use recommend someone to do para formular a ação aqui.",
        "dialogue": "A college wants to reduce queues at lunchtime. One proposal adds a second food counter; another staggers class finishing times. The first requires equipment and staffing, while the second could affect students who travel together. Current waiting times were measured on only two unusually busy days. The student committee must recommend a practical next step, consult affected groups and define what evidence would justify keeping the change. It cannot assume that faster service automatically benefits every student equally.",
        "dialogueTranslation": "Uma faculdade quer reduzir filas no almoço. Uma proposta acrescenta balcão; outra alterna o fim das aulas. A primeira exige equipamentos e equipe; a segunda afeta quem viaja junto. As filas só foram medidas em dois dias muito cheios. A comissão deve recomendar um próximo passo, consultar afetados e definir evidência para manter a mudança, sem presumir benefício igual para todos.",
        "question": "Qual recomendação reconhece melhor a incerteza?",
        "choices": [
          "Measure typical days and trial a solution with affected students.",
          "Buy equipment immediately because two days prove the full pattern.",
          "Change every timetable without consulting students."
        ],
        "explanation": "Medir dias típicos e testar com alunos responde à amostra limitada e aos impactos diferentes de cada alternativa.",
        "gap": "The committee recommends ___ waiting times on typical days.",
        "fills": [
          "measuring",
          "to measure",
          "measured"
        ],
        "gapExplanation": "Recommend seguido diretamente de ação admite a forma em -ing: recommends measuring.",
        "production": "Produza um relatório de 250–300 palavras com problema, comparação de duas opções, recomendação, consulta e critério de avaliação. Depois reescreva o resumo em até 60 palavras para estudantes.",
        "productionChecklist": [
          "Comparei custos e benefícios para grupos diferentes?",
          "Defini um teste e um critério de decisão?",
          "O resumo conserva a conclusão e a principal ressalva?"
        ],
        "speakingTask": "Apresente a proposta por três minutos e responda a duas objeções: custo e impacto no transporte.",
        "id": "b2-autonomia-06"
      }
    ]
  }
];
