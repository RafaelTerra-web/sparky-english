import type { ModuleDraft } from "./types";
export const c2Modules: ModuleDraft[] = [
  {
    "id": "c2-nuance",
    "title": "Nuance, subtexto e precisão",
    "level": "C2",
    "description": "Interpretar ambiguidade, pressupostos e efeitos retóricos sem extrapolar o que o texto sustenta.",
    "lessons": [
      {
        "title": "Distinguir concessão de endosso",
        "rule": "Em argumentação sofisticada, reconhecer um mérito pode preparar uma crítica maior. To grant that não implica aceitar a conclusão que outra pessoa deriva desse mérito. Observe a hierarquia das orações, o contraste posterior e o critério decisivo. Uma concessão pode ser sincera e, ainda assim, insuficiente para sustentar a proposta avaliada.",
        "example": "To grant that the scheme is efficient is not to endorse its underlying assumptions.",
        "translation": "Reconhecer que o projeto é eficiente não significa endossar seus pressupostos.",
        "vocabulary": "grant — reconhecer para fins de argumento\nendorse — endossar\nunderlying assumption — pressuposto subjacente",
        "pitfall": "Não transforme uma concessão localizada em concordância global. O autor pode reconhecer eficiência e rejeitar o critério pelo qual ela foi medida.",
        "dialogue": "The editorial concedes that the new allocation system processes applications more quickly. It even acknowledges that staff find the interface easier to use. Yet speed, it argues, is being treated as a proxy for fairness, although applicants with complicated circumstances are more likely to require manual review. The writer does not advocate abandoning digital systems. Rather, she questions a success measure that rewards rapid decisions without examining whose cases are delayed or rejected. Her recommendation is to retain the system while auditing outcomes across different types of application, making efficiency one criterion among several rather than the decisive one.",
        "dialogueTranslation": "O editorial admite que o sistema processa pedidos mais rápido e facilita o trabalho. Mas critica usar rapidez como substituta de justiça, já que casos complexos exigem análise manual. A autora não propõe abandonar sistemas digitais: questiona uma medida que recompensa rapidez sem examinar quem espera ou é rejeitado. Recomenda manter o sistema auditando resultados entre tipos de pedido, com eficiência como um de vários critérios.",
        "question": "Qual leitura preserva a estrutura argumentativa?",
        "choices": [
          "The writer accepts a practical benefit while challenging its use as a sufficient measure of success.",
          "The writer's praise establishes unconditional support for the allocation policy.",
          "The writer denies that processing speed has improved at all."
        ],
        "explanation": "A concessão sobre rapidez é real, mas subordinada à crítica da suficiência desse critério; benefício prático não implica endosso global.",
        "gap": "The editorial ___ the speed improvement without endorsing the fairness claim.",
        "fills": [
          "concedes",
          "retracts",
          "conceals"
        ],
        "gapExplanation": "Concedes expressa reconhecimento limitado de um ponto. Retracts retiraria a afirmação; conceals indicaria ocultação, ausente no texto.",
        "production": "Escreva 350–450 palavras analisando a concessão, o critério criticado e a recomendação. Depois reformule a conclusão para um público administrativo sem perder a nuance.",
        "productionChecklist": [
          "Distingui mérito local e endosso global?",
          "Reconstruí a hierarquia dos argumentos?",
          "Preservei o critério de avaliação na reformulação?"
        ],
        "speakingTask": "Defenda por três minutos a crítica da autora diante de alguém que interpreta qualquer elogio como aprovação.",
        "id": "c2-nuance-01"
      },
      {
        "title": "Interpretar ironia com evidência",
        "rule": "Ironia pode criar distância entre o sentido literal e a avaliação pretendida. Procure incongruência com fatos próximos, contraste de registro e resposta dos interlocutores. Uma frase elogiosa após um fracasso pode ser irônica, mas o contexto precisa sustentar essa leitura. Identificar ironia não autoriza inventar hostilidade, intenção secreta ou traços de personalidade.",
        "example": "Calling the delay a triumph of efficiency was hardly an unqualified compliment.",
        "translation": "Chamar o atraso de triunfo da eficiência dificilmente foi um elogio sem ressalvas.",
        "vocabulary": "understatement — atenuação expressiva\nincongruity — incongruência\nunqualified — sem ressalvas",
        "pitfall": "Nem todo elogio inesperado é sarcasmo. Justifique a leitura com o contraste textual e deixe abertas interpretações que o texto não elimina.",
        "dialogue": "After waiting forty minutes for a supposedly instant approval, a reviewer wrote, 'A remarkable triumph of efficiency.' The next sentence described three duplicate forms and a confirmation email that arrived after the event had ended. In isolation, the opening might look complimentary; the surrounding details reverse that reading. The reviewer nevertheless praised a staff member who eventually resolved the problem, separating criticism of the process from criticism of every person involved. A faithful summary would retain both the ironic evaluation of the procedure and the genuine appreciation of the individual response, rather than flattening the entire review into either praise or abuse.",
        "dialogueTranslation": "Depois de quarenta minutos esperando aprovação supostamente instantânea, um revisor escreveu um elogio à eficiência. Em seguida descreveu formulários duplicados e confirmação após o evento, invertendo a leitura literal. Ainda assim, elogiou sinceramente quem resolveu o problema. Um resumo fiel preservaria ironia sobre o procedimento e reconhecimento da resposta individual, sem reduzir tudo a elogio ou ataque.",
        "question": "O que sustenta a leitura irônica da abertura?",
        "choices": [
          "The contrast between literal praise and the documented delays and duplication.",
          "A rule that every positive adjective must be read negatively.",
          "Proof that the reviewer dislikes every member of staff."
        ],
        "explanation": "O contraste textual fundamenta a ironia; o elogio individual posterior impede interpretar o texto inteiro como rejeição indiscriminada.",
        "gap": "The details ___ the apparently complimentary opening.",
        "fills": [
          "undercut",
          "corroborate",
          "duplicate"
        ],
        "gapExplanation": "Undercut indica enfraquecer ou contrariar o efeito do elogio literal. Corroborate confirmaria esse elogio; duplicate não descreve a relação.",
        "production": "Analise o texto em 300–400 palavras distinguindo ironia e elogio literal. Reescreva a crítica sem ironia e explique o que muda no efeito sobre o leitor.",
        "productionChecklist": [
          "Apontei evidência para a leitura irônica?",
          "Mantive o elogio individual como sincero?",
          "Comparei efeitos sem atribuir intenções não demonstradas?"
        ],
        "speakingTask": "Leia a frase com duas entonações e explique por que o contexto, além da voz, determina a interpretação.",
        "id": "c2-nuance-02"
      },
      {
        "title": "Identificar pressupostos embutidos",
        "rule": "Certas formulações apresentam uma ideia como já aceita: when the policy fails pressupõe falha futura mais fortemente que if it fails. Verbos como stop e resume também carregam informação sobre um estado anterior. Analise o que é afirmado, o que é pressuposto e o que permanece contestável; uma pergunta pode impor uma premissa que o destinatário não aceita.",
        "example": "The question presupposes a failure that the report has not established.",
        "translation": "A pergunta pressupõe uma falha que o relatório não estabeleceu.",
        "vocabulary": "presuppose — pressupor\npremise — premissa\ncontested — contestado",
        "pitfall": "Responder diretamente pode aceitar uma premissa indevida. Reformule a pergunta antes de discutir consequências que ainda são hipotéticas.",
        "dialogue": "During a consultation, a moderator asked how the organisation would compensate residents 'when the new service fails'. The available report described several risks but did not predict inevitable failure. A representative challenged the wording, proposing two separate questions: how risks would be reduced, and what remedies would apply if a failure occurred. This did not deny the possibility of harm. It prevented an uncertain outcome from being treated as a settled fact while preserving the legitimate demand for accountability. The subsequent discussion became more specific because participants could examine prevention and remedies without first agreeing that failure was unavoidable.",
        "dialogueTranslation": "Numa consulta, o moderador perguntou como compensariam moradores quando o serviço falhasse. O relatório descrevia riscos, sem prever falha inevitável. A representante propôs separar redução de riscos e reparação caso houvesse falha. Não negou dano possível; impediu tratar resultado incerto como fato, preservando prestação de contas e tornando a discussão mais específica.",
        "question": "Qual é o efeito principal da reformulação?",
        "choices": [
          "It removes inevitability while retaining questions about prevention and remedies.",
          "It denies every possibility of harm.",
          "It establishes that the service has already failed."
        ],
        "explanation": "A reformulação substitui inevitabilidade por condição, sem eliminar a questão legítima de prevenção e reparação.",
        "gap": "The wording presents a ___ outcome as inevitable.",
        "fills": [
          "contingent",
          "foregone",
          "settled"
        ],
        "gapExplanation": "Contingent indica algo dependente de condições. Foregone e settled reforçariam certeza, contrariando a crítica central.",
        "production": "Escreva 350 palavras analisando a premissa e proponha três perguntas de consulta que cobrem responsabilidade sem impor conclusões. Explique a diferença entre if e when no caso.",
        "productionChecklist": [
          "Separei afirmação e pressuposto?",
          "Preservei a cobrança legítima?",
          "Minhas perguntas permitem respostas contestáveis?"
        ],
        "speakingTask": "Responda a uma pergunta com premissa indevida em dois minutos, contestando a premissa sem evitar o tema central.",
        "id": "c2-nuance-03"
      },
      {
        "title": "Resolver ambiguidade de escopo",
        "rule": "O alcance de only, all e not altera quem ou o que a frase inclui. Not all requests were rejected nega uma totalidade; não afirma que nenhum foi rejeitado. Em textos delicados, reformule para tornar o escopo inequívoco. Use contexto para resolver ambiguidades, mas reconheça quando mais de uma leitura permanece possível.",
        "example": "Not all applicants were excluded, but the criteria remained unclear.",
        "translation": "Nem todos os candidatos foram excluídos, mas os critérios continuaram pouco claros.",
        "vocabulary": "scope — escopo lógico\nambiguity — ambiguidade\nentail — implicar logicamente",
        "pitfall": "Not all não equivale a none. Da negação da totalidade não se deduz automaticamente uma quantidade específica.",
        "dialogue": "A committee statement said that not all late applications had been rejected. Commentators immediately translated this into a claim that every late application had been accepted. The statement supported no such conclusion: it established only that at least some had avoided rejection. Nor did it explain whether they had been accepted, deferred or returned for clarification. A revised statement separated those outcomes and described the criteria used in each case. The correction mattered because applicants were making decisions based on an apparent guarantee that the original wording had never supplied.",
        "dialogueTranslation": "Uma comissão disse que nem todos os pedidos atrasados foram rejeitados. Comentadores transformaram isso em aceitação de todos. O texto só permitia dizer que alguns evitaram rejeição, sem indicar se foram aceitos, adiados ou devolvidos para esclarecimento. A versão revisada separou resultados e critérios, pois candidatos agiam com base em garantia inexistente.",
        "question": "O que a afirmação original permite concluir?",
        "choices": [
          "At least some late applications were not rejected, but their final status is unspecified.",
          "Every late application was accepted immediately.",
          "No late application was considered."
        ],
        "explanation": "Not all nega rejeição universal. Evitar rejeição não implica aceitação imediata, pois o texto admite outros estados.",
        "gap": "The claim that all were accepted is not ___ by the original statement.",
        "fills": [
          "entailed",
          "refuted",
          "requested"
        ],
        "gapExplanation": "Entailed refere-se a uma conclusão que decorre logicamente da afirmação. Não decorrer não significa ser necessariamente refutada.",
        "production": "Analise a inferência em 300–400 palavras e redija uma nova declaração com categorias explícitas, usando dados hipotéticos identificados como exemplo.",
        "productionChecklist": [
          "Distingui não implicado de refutado?",
          "Preservei categorias de resultado?",
          "Marquei dados inventados como hipotéticos?"
        ],
        "speakingTask": "Explique a diferença entre not all e none em 90 segundos, depois mostre por que not rejected não garante accepted.",
        "id": "c2-nuance-04"
      },
      {
        "title": "Avaliar metáforas que orientam decisões",
        "rule": "Metáforas destacam alguns aspectos e deixam outros menos visíveis. Chamar um serviço de pipeline pode favorecer etapas e eficiência; chamá-lo de network pode destacar relações e retornos. Analise as consequências da moldura sem supor que toda metáfora é manipulação deliberada. Compare o que ela ajuda a perceber e o que pode ocultar.",
        "example": "The metaphor foregrounds speed while obscuring the need for ongoing support.",
        "translation": "A metáfora destaca a rapidez enquanto obscurece a necessidade de apoio contínuo.",
        "vocabulary": "foreground — colocar em destaque\nframe — enquadramento\nobscure — tornar menos visível",
        "pitfall": "Criticar uma metáfora não refuta automaticamente os dados de um projeto. Separe linguagem, pressupostos e evidência empírica.",
        "dialogue": "A training programme described itself as a conveyor belt carrying learners into employment. The phrase conveyed momentum and a clear destination, but a reviewer argued that it understated the need for learners to pause, change direction or return for support. The programme's completion figures were not disputed. The disagreement concerned what counted as a successful journey and whether ongoing assistance was treated as an exception or part of the service. Replacing the metaphor alone would not improve provision, yet examining it exposed assumptions that could influence funding and the way staff responded to non-linear progress.",
        "dialogueTranslation": "Um programa se descreveu como esteira que levava alunos ao emprego. A imagem transmitia movimento e destino, mas minimizava pausas, mudanças e retorno por apoio. Os números de conclusão não foram contestados; discutia-se o que contava como trajetória bem-sucedida. Mudar a metáfora sozinha não melhoraria o serviço, mas analisá-la expôs pressupostos relevantes para financiamento e progresso não linear.",
        "question": "Qual crítica é sustentada pelo texto?",
        "choices": [
          "The metaphor may narrow the programme's conception of successful progress.",
          "The completion figures are demonstrably fabricated.",
          "Changing a metaphor automatically guarantees better outcomes."
        ],
        "explanation": "A crítica trata do enquadramento de sucesso e apoio; não contesta os dados nem promete efeito automático da troca de palavras.",
        "gap": "The metaphor ___ a linear journey through the programme.",
        "fills": [
          "foregrounds",
          "disproves",
          "interrupts"
        ],
        "gapExplanation": "Foregrounds significa tornar saliente. A metáfora enfatiza linearidade, sem disprovar ou interromper a trajetória.",
        "production": "Produza uma análise de 350–450 palavras e proponha uma metáfora alternativa, avaliando também suas limitações. Relacione linguagem a uma decisão concreta de serviço.",
        "productionChecklist": [
          "Separei enquadramento e dados?",
          "Identifiquei o que cada metáfora destaca e oculta?",
          "Evitei presumir manipulação intencional?"
        ],
        "speakingTask": "Compare duas metáforas em três minutos e responda a quem afirma que a discussão é apenas uma questão de palavras.",
        "id": "c2-nuance-05"
      },
      {
        "title": "Projeto C2: reconstruir um argumento ambíguo",
        "rule": "Leitura avançada reconstrói a versão mais defensável de um argumento sem apagar tensões internas. Distingua ambiguidade produtiva, contradição e informação ausente. Uma interpretação deve explicar mais detalhes textuais com menos suposições gratuitas. Compare leituras rivais e diga que passagem favorece cada uma antes de escolher sua conclusão.",
        "example": "The passage permits two readings, but the final qualification favours the narrower one.",
        "translation": "A passagem permite duas leituras, mas a ressalva final favorece a mais restrita.",
        "vocabulary": "qualification — ressalva\nrival reading — leitura alternativa\nwarrant — fundamento",
        "pitfall": "A interpretação mais interessante nem sempre é a mais sustentada. Não preencha lacunas com uma história que o texto não fornece.",
        "dialogue": "An essay declares that institutions should listen to every complaint, then warns against allowing the loudest voices to set every priority. One reader sees a contradiction: how can an institution listen without acting? Another distinguishes acknowledgement from automatic compliance. The essay's closing paragraph supports that distinction by calling for published reasons when a request is declined, rather than promising that all requests will be granted. It leaves unresolved how competing needs should be weighted. A careful response can defend the coherence of the listening principle while criticising the absence of a sufficiently explicit decision procedure.",
        "dialogueTranslation": "Um ensaio defende ouvir toda reclamação, mas alerta contra dar todas as prioridades às vozes mais altas. Um leitor vê contradição; outro distingue reconhecimento de atendimento automático. O final pede razões públicas para recusar pedidos, sem prometer aceitar todos. O peso de necessidades concorrentes fica aberto. É possível defender a coerência do princípio e criticar a falta de procedimento decisório explícito.",
        "question": "Qual avaliação melhor acomoda o texto inteiro?",
        "choices": [
          "Listening need not mean compliance, but the procedure for weighing needs remains underspecified.",
          "The essay explicitly promises to grant every request.",
          "The final paragraph proves that complaints should never be acknowledged."
        ],
        "explanation": "O final sustenta a distinção entre ouvir e atender; a lacuna restante é procedimental, não necessariamente uma contradição.",
        "gap": "The final qualification ___ the distinction between listening and compliance.",
        "fills": [
          "supports",
          "obliterates",
          "precludes"
        ],
        "gapExplanation": "Supports descreve o fundamento oferecido pelo final. As outras opções implicariam eliminar ou impedir a distinção.",
        "production": "Escreva 450–550 palavras comparando duas leituras, justificando sua preferência e formulando uma crítica que permaneça válida nessa leitura. Inclua uma resposta possível do autor.",
        "productionChecklist": [
          "Apresentei leituras rivais de forma justa?",
          "Usei a ressalva final como evidência?",
          "Minha crítica sobrevive à interpretação mais forte?"
        ],
        "speakingTask": "Defenda sua leitura por quatro minutos e depois argumente, por um minuto, pela melhor objeção a ela.",
        "id": "c2-nuance-06"
      }
    ]
  },
  {
    "id": "c2-producao",
    "title": "Produção, mediação e domínio discursivo",
    "level": "C2",
    "description": "Adaptar argumentos complexos, preservar vozes e responder a objeções com precisão e flexibilidade.",
    "lessons": [
      {
        "title": "Editar para precisão e economia",
        "rule": "Concissão elimina peso verbal, não condições relevantes. Nominalizações podem comprimir conceitos conhecidos, mas também esconder quem age. Compare a necessidade de abstração com a clareza de verbos diretos. Uma edição responsável preserva autoria, causalidade e certeza, além de melhorar ritmo e legibilidade.",
        "example": "The revision removes repetition without sacrificing the argument's qualifications.",
        "translation": "A revisão remove repetição sem sacrificar as ressalvas do argumento.",
        "vocabulary": "redundancy — redundância\nagency — responsabilidade pela ação\nqualification — ressalva",
        "pitfall": "Cortar apparently ou in this sample pode transformar uma hipótese limitada em fato geral. Nem toda palavra curta é dispensável.",
        "dialogue": "The draft read: 'The implementation of an assessment of the possibility of an extension was undertaken by the committee.' An editor replaced it with: 'The committee assessed whether an extension was possible.' The revision made the actor and action visible without changing the claim. In the next sentence, however, she retained 'subject to staffing approval', because removing it would turn a conditional recommendation into an unconditional promise. Her aim was not to minimise word count at any cost. It was to distinguish verbal bulk from information that constrained the reader's legitimate interpretation.",
        "dialogueTranslation": "Uma editora substituiu uma frase carregada de nominalizações por uma oração direta em que a comissão avaliou a possibilidade de prorrogação. Preservou, porém, a condição de aprovação de equipe, pois removê-la mudaria recomendação condicionada para promessa absoluta. O objetivo era separar peso verbal de informação que limita legitimamente a interpretação.",
        "question": "Qual princípio orienta a edição?",
        "choices": [
          "Remove avoidable verbal weight while preserving conditions and agency.",
          "Delete every qualification to make the text more decisive.",
          "Keep all nominalisations regardless of their effect on clarity."
        ],
        "explanation": "A revisão explicita quem age e preserva a condição que afeta o compromisso; economia não justifica mudança de sentido.",
        "gap": "The staffing condition is ___ to the meaning and should remain.",
        "fills": [
          "integral",
          "incidental",
          "redundant"
        ],
        "gapExplanation": "Integral indica elemento essencial ao sentido. Incidental e redundant sugeririam que a condição é secundária ou dispensável.",
        "production": "Escreva um memorando de 300 palavras, depois reduza-o a 180 sem perder compromissos, condições e agentes. Anote cinco cortes e justifique uma expressão que decidiu manter.",
        "productionChecklist": [
          "Preservei condições materiais?",
          "O responsável por cada ação continua claro?",
          "Os cortes melhoraram ritmo sem ampliar promessas?"
        ],
        "speakingTask": "Explique em três minutos duas escolhas de edição e defenda uma ressalva que alguém quer retirar.",
        "id": "c2-producao-01"
      },
      {
        "title": "Reexpressar uma ideia para públicos distintos",
        "rule": "Mediação para públicos diferentes altera exemplos, pressupostos de conhecimento e densidade, preservando o núcleo conceitual. Uma versão acessível pode explicar termos antes de usá-los; uma técnica pode condensá-los. Não infantilize leitores nem elimine a incerteza por supor que só especialistas conseguem entendê-la.",
        "example": "A simpler explanation need not imply a less accurate one.",
        "translation": "Uma explicação mais simples não precisa ser menos precisa.",
        "vocabulary": "recast — reformular\naccessible — acessível\nconceptual — conceitual",
        "pitfall": "Adaptar não significa trocar uma conclusão probabilística por certeza. Incerteza também pode ser comunicada em linguagem familiar.",
        "dialogue": "An environmental team reported that a model's projections were sensitive to assumptions about future land use. For specialists, the briefing compared scenarios and parameter ranges. For residents, it explained that different building plans could lead to different projected flood patterns, and that the maps were not forecasts for a particular storm. The public version used a familiar street example but kept the central uncertainty. Both versions supported discussion of planning choices; neither claimed that the model could tell an individual household exactly what would happen next winter.",
        "dialogueTranslation": "Uma equipe relatou projeções sensíveis a pressupostos de uso do solo. Para especialistas, comparou cenários e parâmetros. Para moradores, explicou que planos de construção diferentes produziriam padrões projetados distintos e que mapas não previam uma tempestade específica. A versão pública usou uma rua conhecida e manteve a incerteza, sem prever exatamente o próximo inverno de cada casa.",
        "question": "O que deve permanecer nas duas versões?",
        "choices": [
          "The dependence on assumptions and the limits of what the projections establish.",
          "Every specialist term without explanation.",
          "A guarantee about each household's next winter."
        ],
        "explanation": "Pressupostos e limites são centrais; exemplos e densidade técnica podem mudar sem transformar projeção em garantia.",
        "gap": "The public explanation ___ the uncertainty rather than eliminating it.",
        "fills": [
          "retains",
          "overrules",
          "settles"
        ],
        "gapExplanation": "Retains indica preservar. Overrules ou settles sugeririam resolver ou afastar a incerteza, o que o texto evita.",
        "production": "Crie duas versões de 220–280 palavras do informe: uma para técnicos e outra para moradores. Acrescente 100 palavras explicando o que mudou e o que precisou permanecer.",
        "productionChecklist": [
          "O núcleo conceitual é o mesmo?",
          "A versão pública preserva incerteza?",
          "Os exemplos esclarecem sem prometer previsão individual?"
        ],
        "speakingTask": "Explique o modelo para um morador em dois minutos; depois responda à mesma pergunta diante de um especialista.",
        "id": "c2-producao-02"
      },
      {
        "title": "Preservar perspectivas em discurso relatado",
        "rule": "Relatar múltiplas vozes exige distinguir a posição do narrador das avaliações atribuídas. Allegedly, reportedly e according to não são equivalentes: podem marcar alegação contestada, relato indireto ou simples fonte. Escolha verbos de atribuição proporcionais ao que ocorreu, sem transformar reclamação em confissão ou crítica em admissão.",
        "example": "The report attributes the criticism to residents without adopting every allegation.",
        "translation": "O relatório atribui a crítica aos moradores sem assumir cada alegação.",
        "vocabulary": "allegation — alegação\nattribute — atribuir\nstance — posicionamento",
        "pitfall": "Admitted sugere reconhecer algo frequentemente desfavorável. Said ou stated pode ser mais fiel quando a fonte apenas apresenta sua posição.",
        "dialogue": "Residents described the consultation as rushed, while the organising team said that the timetable complied with its published rules. An independent observer noted that formal compliance did not establish whether participants had enough time to understand the documents. The observer did not confirm every resident's allegation or accuse organisers of deliberate exclusion. Her report separated the parties' claims from its own assessment: the process met the stated timetable, but the adequacy of that timetable remained open to criticism. A headline saying that organisers had 'admitted excluding residents' would collapse these distinct voices into an unsupported confession.",
        "dialogueTranslation": "Moradores consideraram a consulta apressada; organizadores disseram cumprir regras de prazo. Uma observadora distinguiu conformidade formal e tempo suficiente para compreender documentos. Ela não confirmou todas as alegações nem acusou exclusão deliberada. Seu relatório separou posições e avaliação: prazo cumprido, adequação ainda criticável. Uma manchete sobre confissão de exclusão confundiria as vozes.",
        "question": "Qual atribuição é fiel ao relato?",
        "choices": [
          "The observer questioned the timetable's adequacy without alleging deliberate exclusion.",
          "The organisers confessed to deliberately excluding residents.",
          "Every resident's allegation was independently confirmed."
        ],
        "explanation": "A observadora questiona adequação sem atribuir intenção; a alegada confissão não existe no relato.",
        "gap": "The headline ___ a confession that the organisers never made.",
        "fills": [
          "imputes",
          "verifies",
          "retracts"
        ],
        "gapExplanation": "Imputes indica atribuir algo a alguém. Verifies afirmaria confirmação, e retracts retiraria uma atribuição anterior.",
        "production": "Escreva uma reportagem de 350–450 palavras preservando as três perspectivas. Destaque os verbos de atribuição e justifique por que não sugerem confissões ou confirmações inexistentes.",
        "productionChecklist": [
          "Distingui fonte e voz do narrador?",
          "Os verbos de atribuição são proporcionais?",
          "Evitei converter crítica em acusação de intenção?"
        ],
        "speakingTask": "Resuma a controvérsia em três minutos e esclareça, quando questionado, o que é alegação e o que foi observado.",
        "id": "c2-producao-03"
      },
      {
        "title": "Responder à objeção mais forte",
        "rule": "Um argumento resistente responde à melhor versão da objeção, não à mais fácil. Mesmo uma crítica legítima pode não ser decisiva se outro critério prevalece; explique essa comparação. Se a objeção muda sua recomendação, declare a revisão com transparência. Concessões específicas são mais informativas que uma fórmula genérica de equilíbrio.",
        "example": "The objection is well founded, but it does not by itself settle the question.",
        "translation": "A objeção é bem fundamentada, mas não resolve por si só a questão.",
        "vocabulary": "decisive — decisivo\nwell founded — bem fundamentado\nrebuttal — contestação argumentada",
        "pitfall": "Reconhecer uma objeção não é refutá-la. Explique por que ela muda ou não o peso da conclusão, sem apenas acrescentar however.",
        "dialogue": "A proposal to publish detailed service data promised greater accountability. Its strongest critic did not oppose transparency; she argued that small categories could allow individuals to be identified indirectly. Supporters initially replied that openness was valuable, which failed to address her concern. The revised proposal combined broader categories with a documented process for requesting more detailed analysis under controlled conditions. This reduced the risk without claiming to eliminate it. The remaining disagreement concerned how much detail could be withheld before the public figures stopped being useful for scrutiny.",
        "dialogueTranslation": "Uma proposta de dados detalhados prometia prestação de contas. A crítica mais forte apoiava transparência, mas apontava identificação indireta em categorias pequenas. Dizer apenas que abertura era valiosa não respondia. A revisão agrupou categorias e criou análise detalhada sob condições controladas, reduzindo sem eliminar risco. Restou discutir quanta informação poderia ser retirada sem perder utilidade pública.",
        "question": "Qual resposta enfrenta a objeção real?",
        "choices": [
          "Modify disclosure detail while examining the remaining trade-off between privacy and scrutiny.",
          "Repeat that transparency is valuable without addressing identifiability.",
          "Describe the critic as opposed to all public accountability."
        ],
        "explanation": "A objeção trata de identificabilidade, não rejeição da transparência; a resposta precisa lidar com esse risco e o custo de reduzir detalhes.",
        "gap": "The initial response failed to ___ the substance of the objection.",
        "fills": [
          "engage with",
          "dispense with",
          "coincide with"
        ],
        "gapExplanation": "Engage with significa enfrentar seriamente o conteúdo. Dispense with é dispensar; coincide with é coincidir.",
        "production": "Redija 400–500 palavras defendendo uma política de divulgação e apresentando a objeção em sua forma mais forte. Explique a revisão adotada e uma discordância que permanece.",
        "productionChecklist": [
          "Representei corretamente o valor defendido pela crítica?",
          "Minha resposta enfrenta o risco específico?",
          "Preservei o custo residual da solução?"
        ],
        "speakingTask": "Defenda a política por quatro minutos; então assuma o papel de crítico e formule a melhor réplica.",
        "id": "c2-producao-04"
      },
      {
        "title": "Controlar tom e implicatura na revisão",
        "rule": "Uma frase pode comunicar mais que sua proposição explícita. Even, merely e at least orientam expectativas; sua remoção altera atitude ou implicatura. Revisar tom requer observar a relação entre avaliação, evidência e destinatário. Tornar um texto profissional não significa neutralizar toda voz autoral, mas alinhar seu efeito ao propósito.",
        "example": "Describing the improvement as merely adequate introduces a judgement beyond the figures.",
        "translation": "Descrever a melhora como apenas adequada introduz um julgamento além dos números.",
        "vocabulary": "implicature — implicatura\nstance marker — marcador de posicionamento\ndismissive — desdenhoso",
        "pitfall": "Merely pode minimizar um resultado sem acrescentar dado factual. Identifique esse efeito antes de tratá-lo como descrição neutra.",
        "dialogue": "A draft review stated that the team had 'at least managed to meet the revised deadline'. The delivery date was accurate, but the phrasing suggested a history of low expectations that the report had not documented. Elsewhere, 'merely adequate support' expressed dissatisfaction without specifying which needs were unmet. The editor asked for concrete evaluation criteria and kept criticism where it could be supported. The final version reported that delivery met the revised deadline and that support lacked a weekend response channel. It was less insinuating yet more useful, because readers could distinguish the facts from the criteria used to judge them.",
        "dialogueTranslation": "Uma revisão dizia que a equipe ao menos conseguira cumprir o prazo revisado, sugerindo expectativas baixas não documentadas. Outra expressão minimizava o suporte sem indicar necessidades não atendidas. A editora pediu critérios e manteve críticas sustentadas. A versão final registrou prazo cumprido e ausência de canal no fim de semana: menos insinuante e mais útil por separar fatos e avaliação.",
        "question": "Por que a versão final é mais informativa?",
        "choices": [
          "It replaces unsupported insinuation with explicit facts and evaluation criteria.",
          "It removes every criticism regardless of evidence.",
          "It proves that the original delivery date was met."
        ],
        "explanation": "A edição torna a crítica verificável, sem apagá-la. O prazo mencionado continua sendo o revisado, não necessariamente o original.",
        "gap": "The phrase carries a ___ implication not supported by the report.",
        "fills": [
          "dismissive",
          "numerical",
          "chronological"
        ],
        "gapExplanation": "Dismissive descreve o efeito depreciativo da expressão. Os outros adjetivos não representam a atitude implícita criticada.",
        "production": "Crie e revise um parecer de 350 palavras sobre um serviço. Identifique quatro marcadores de tom, explicite seus efeitos e substitua insinuações por critérios quando necessário.",
        "productionChecklist": [
          "Distingui conteúdo factual e atitude?",
          "Mantive críticas sustentadas?",
          "Meu tom serve ao propósito e ao destinatário?"
        ],
        "speakingTask": "Diga a mesma crítica em três registros e explique como mudou a implicatura sem alterar o fato central.",
        "id": "c2-producao-05"
      },
      {
        "title": "Projeto C2: síntese e defesa sob contestação",
        "rule": "Uma produção de domínio discursivo integra perspectivas, controla pressupostos e responde a mudanças de contexto sem perder o fio. Planeje a hierarquia do argumento e as condições sob as quais ele seria revisto. Uma boa defesa oral não é recitação: reformula, esclarece ambiguidades e responde à objeção específica que acabou de ser feita.",
        "example": "A defensible conclusion must accommodate uncertainty without surrendering judgement.",
        "translation": "Uma conclusão defensável deve incorporar a incerteza sem abrir mão do julgamento.",
        "vocabulary": "defensible — defensável\naccommodate — incorporar\nscrutiny — exame crítico",
        "pitfall": "Confiança retórica não substitui justificativa. Também não use incerteza como motivo para evitar qualquer decisão quando o caso exige uma ação.",
        "dialogue": "A city must decide whether to retain a pilot transport service. Operators report reliable journeys, residents value access to evening activities, and an audit questions whether the subsidy reaches people with the greatest need. Usage data exclude residents who could not reach the current stops, while interviews mainly represent frequent passengers. Cancelling the service would remove an existing benefit; retaining it unchanged could preserve an inequitable design. The decision cannot wait for perfect evidence, but the council can alter routes, set a review date and publish reasons for its choice. A rigorous recommendation must compare these possibilities without treating any stakeholder's account as the whole picture.",
        "dialogueTranslation": "Uma cidade deve decidir sobre transporte piloto. Operadores relatam confiabilidade, moradores valorizam atividades noturnas e auditoria questiona a distribuição do subsídio. Dados excluem quem não chega aos pontos; entrevistas representam usuários frequentes. Cancelar remove benefício, manter igual pode preservar desigualdade. Sem poder esperar evidência perfeita, o conselho pode mudar rotas, fixar revisão e publicar razões. A recomendação deve integrar perspectivas parciais.",
        "question": "Qual abordagem atende melhor ao problema decisório?",
        "choices": [
          "Make a reasoned, revisable choice that addresses both evidence gaps and existing benefits.",
          "Wait indefinitely for perfect evidence while making no decision.",
          "Treat frequent passengers' interviews as a complete account of every resident's needs."
        ],
        "explanation": "A decisão exige julgamento sob incerteza, atenção aos benefícios e excluídos, e condições de revisão; nenhum relato isolado basta.",
        "gap": "The recommendation should remain ___ in light of new evidence.",
        "fills": [
          "revisable",
          "irrevocable",
          "incontrovertible"
        ],
        "gapExplanation": "Revisable mantém possibilidade de ajuste com novos dados. As demais opções eliminariam justamente a abertura necessária.",
        "production": "Escreva 500–650 palavras com síntese, avaliação das fontes, decisão, melhor objeção e resposta, critérios de revisão e resumo executivo de 90 palavras. Refaça o resumo para moradores em linguagem acessível.",
        "productionChecklist": [
          "Integrei fontes sem apagar seus limites?",
          "Decidi sem fingir certeza absoluta?",
          "Minha resposta enfrenta a melhor objeção?",
          "O texto funciona para especialistas e moradores?",
          "Defini evidência capaz de mudar a decisão?"
        ],
        "speakingTask": "Faça uma defesa de cinco minutos, responda a três perguntas não preparadas e termine com uma síntese de 45 segundos. Peça feedback sobre precisão, coerência, flexibilidade e fluidez.",
        "id": "c2-producao-06"
      }
    ]
  }
];
