import type { ModuleDraft } from "./types";
export const c1Modules: ModuleDraft[] = [
  {
    "id": "c1-sintese",
    "title": "Síntese, evidência e escrita analítica",
    "level": "C1",
    "description": "Integrar fontes, calibrar certeza e produzir argumentos estruturados para públicos exigentes.",
    "lessons": [
      {
        "title": "Sintetizar fontes em tensão",
        "rule": "Uma síntese organiza fontes por questões, não apenas por autor. Identify agreement, divergence and scope: duas fontes podem divergir porque medem grupos ou períodos diferentes. Both accounts suggest estabelece convergência; whereas marca contraste. Preserve as reservas de cada fonte e identifique claramente quando a conclusão é uma inferência sua.",
        "example": "Both reports suggest that access matters, although they measure different outcomes.",
        "translation": "Ambos os relatórios sugerem que o acesso importa, embora meçam resultados diferentes.",
        "vocabulary": "convergence — convergência\nscope — abrangência\noutcome — resultado",
        "pitfall": "A síntese não deve produzir consenso fictício. Se uma fonte mede satisfação e outra mede conclusão, não as apresente como medidas idênticas.",
        "dialogue": "Report A examined a city's online training programme and found higher satisfaction among participants who received loaned laptops. Report B studied a different programme and found no increase in completion rates after devices were distributed. However, it noted that participants with caring responsibilities still lacked uninterrupted study time. Neither report claimed that hardware was irrelevant. Read together, they suggest that equipment may improve the experience without removing every barrier to completion. The programmes also differed in duration and subject, so direct numerical comparison would require further information.",
        "dialogueTranslation": "O relatório A encontrou maior satisfação entre participantes que receberam laptops emprestados. O B analisou outro programa e não encontrou aumento nas conclusões após distribuir equipamentos; observou que cuidadores continuavam sem tempo contínuo para estudar. Nenhum considerou o equipamento irrelevante. Em conjunto, sugerem melhora na experiência sem remoção de todas as barreiras. Duração e assunto também diferiam, limitando comparação numérica.",
        "question": "Qual síntese respeita o alcance dos dois relatórios?",
        "choices": [
          "Equipment may improve satisfaction without resolving all barriers to completion.",
          "The reports prove that laptops never help learning.",
          "The reports measured identical programmes and identical outcomes."
        ],
        "explanation": "A síntese preserva resultados distintos e limitações de comparabilidade, sem criar consenso mais forte do que as fontes permitem.",
        "gap": "Report A measured satisfaction, ___ Report B focused on completion.",
        "fills": [
          "whereas",
          "because of",
          "despite"
        ],
        "gapExplanation": "Whereas contrasta duas orações completas. Despite e because of precisariam de complementos nominais nessa posição.",
        "production": "Escreva uma síntese de 250–300 palavras para gestores. Organize por acesso e participação, distinga os resultados medidos e formule uma recomendação proporcional às evidências.",
        "productionChecklist": [
          "Integrei as fontes por tema?",
          "Preservei diferenças de medidas e população?",
          "Marquei minha inferência como inferência?"
        ],
        "speakingTask": "Explique em três minutos por que resultados aparentemente contraditórios podem coexistir.",
        "id": "c1-sintese-01"
      },
      {
        "title": "Calibrar o grau de certeza",
        "rule": "Hedging expressa limites de conhecimento com precisão: appears to, is likely to e cannot rule out indicam posições diferentes. Empilhar talvez, possivelmente e aparentemente pode tornar o argumento vago. Escolha um marcador proporcional à evidência e diga o que permanece incerto; cautela é mais útil quando aponta a razão da limitação.",
        "example": "The decline appears to reflect a change in reporting rather than demand.",
        "translation": "A queda parece refletir uma mudança no registro, e não na demanda.",
        "vocabulary": "plausible — plausível\nreporting — registro de informações\nrule out — descartar",
        "pitfall": "Cannot rule out não equivale a is likely. Uma possibilidade não descartada pode ser improvável; não aumente sua probabilidade na paráfrase.",
        "dialogue": "A museum recorded fewer enquiries after introducing a new booking platform. Staff initially interpreted the change as declining public interest. An audit found that telephone enquiries had stopped being entered in the same database. Attendance remained stable, but the museum had no comparable count of telephone calls for the period. The analyst concluded that the apparent decline might partly reflect the reporting change. She could not rule out a real fall in interest, yet the available evidence did not justify treating it as the main explanation.",
        "dialogueTranslation": "Um museu registrou menos consultas após mudar a plataforma. A equipe pensou em queda de interesse, mas uma auditoria encontrou telefonemas que deixaram de entrar no banco. A frequência estava estável e faltava contagem comparável de chamadas. A analista concluiu que parte da queda aparente podia refletir o registro, sem descartar uma queda real nem considerá-la a explicação principal.",
        "question": "Qual afirmação mantém o grau de certeza da analista?",
        "choices": [
          "A reporting change may explain part of the decline; demand remains uncertain.",
          "Demand definitely fell and caused every missing enquiry.",
          "Stable attendance proves that every enquiry was recorded."
        ],
        "explanation": "A analista apresenta uma explicação parcial plausível e incerteza residual; ela não demonstra queda real nem cobertura completa.",
        "gap": "The available data do not allow us to rule ___ a genuine decline.",
        "fills": [
          "out",
          "off",
          "away"
        ],
        "gapExplanation": "Rule out significa descartar uma possibilidade. A negativa mantém a possibilidade aberta, sem afirmar que seja provável.",
        "production": "Redija uma nota analítica de 220–260 palavras distinguindo observação, hipótese e informação faltante. Use três graus de certeza diferentes com justificativa.",
        "productionChecklist": [
          "Cada marcador corresponde à evidência?",
          "Expliquei o que falta saber?",
          "Evitei usar possibilidade como prova?"
        ],
        "speakingTask": "Responda em dois minutos a um gestor que pede uma resposta definitiva, mantendo clareza sobre o que é conhecido.",
        "id": "c1-sintese-02"
      },
      {
        "title": "Construir coesão sem excesso de conectores",
        "rule": "Coesão também depende de referentes claros, progressão temática e repetição seletiva. This finding pode retomar um resultado específico; this situation é vago quando há vários candidatos. Em textos densos, dê ao leitor uma ponte explícita entre o conhecido e a informação nova. Conectores não consertam uma relação lógica que você não explicou.",
        "example": "This discrepancy prompted the team to examine how the figures were collected.",
        "translation": "Essa discrepância levou a equipe a examinar como os números foram coletados.",
        "vocabulary": "discrepancy — discrepância\nreferent — referente\nunderlying — subjacente",
        "pitfall": "This sozinho pode apontar para mais de uma ideia. Acrescente um substantivo preciso, como this discrepancy ou this assumption.",
        "dialogue": "Two departments reported different totals for the same volunteer programme. One counted each person once; the other counted every shift. This discrepancy initially looked like a missing-data problem. Once the counting methods were compared, the team realised that both totals could be accurate under their respective definitions. The report therefore separated the number of volunteers from the number of shifts. This distinction made the workload visible without inflating the number of people involved, and future reports were required to state which measure they used.",
        "dialogueTranslation": "Dois departamentos deram totais diferentes para o voluntariado: um contava pessoas, outro turnos. A discrepância parecia falta de dados, mas as contagens podiam estar corretas nas respectivas definições. O relatório separou voluntários e turnos. A distinção mostrou a carga de trabalho sem inflar pessoas, e os futuros relatórios passaram a identificar a medida.",
        "question": "A que se refere This distinction no texto?",
        "choices": [
          "Separating the count of volunteers from the count of shifts.",
          "Treating every shift as a different person.",
          "Assuming that one department lost all its data."
        ],
        "explanation": "O referente é a separação das duas medidas, explicitada na frase anterior, não a hipótese inicial de dados perdidos.",
        "gap": "This ___ between people and shifts improves the report's clarity.",
        "fills": [
          "distinction",
          "distinct",
          "distinctly"
        ],
        "gapExplanation": "Depois de this, a frase pede o substantivo distinction. Distinct é adjetivo e distinctly é advérbio.",
        "production": "Escreva uma explicação de 220 palavras para leitores não técnicos. Revise cada this e it para garantir referente inequívoco e descreva por que as contagens não são intercambiáveis.",
        "productionChecklist": [
          "Todo pronome tem referente claro?",
          "A sequência leva do problema à resolução?",
          "Usei repetição útil sem redundância?"
        ],
        "speakingTask": "Explique a diferença usando um exemplo de três voluntários e cinco turnos, sem depender de um gráfico.",
        "id": "c1-sintese-03"
      },
      {
        "title": "Parafrasear com responsabilidade",
        "rule": "Paráfrase exige reconstruir a ideia sem mudar as relações originais. Preserve quantificadores, condições e atribuição. Some participants é diferente de participants em geral. Uma síntese curta pode omitir exemplos, mas não a limitação central que impede generalização. Se você inclui interpretação, sinalize que ela não é uma fala literal da fonte.",
        "example": "The authors caution that the findings may not apply to smaller organisations.",
        "translation": "Os autores alertam que os resultados podem não se aplicar a organizações menores.",
        "vocabulary": "attribution — atribuição\nqualification — ressalva\ngeneralise — generalizar",
        "pitfall": "Substituir may por will muda o compromisso epistemológico. Sinônimos superficiais não garantem fidelidade à fonte.",
        "dialogue": "A study of large organisations found that structured mentoring was associated with improved staff retention in several departments. The authors emphasised that managers had volunteered to join the study, so the sample might favour teams already committed to development. They also warned that smaller organisations could lack the resources needed for the same programme. A newsletter headline claimed that mentoring would stop staff from leaving any business. The editor requested a revision that retained the positive association while restoring the authors' reservations.",
        "dialogueTranslation": "Um estudo de organizações grandes associou mentoria estruturada à retenção em alguns departamentos. Os gestores participaram voluntariamente, o que podia favorecer equipes já comprometidas com desenvolvimento. Organizações pequenas talvez não tivessem os mesmos recursos. Uma manchete prometeu impedir saídas em qualquer empresa. O editor pediu preservar a associação positiva e recuperar as ressalvas.",
        "question": "Qual mudança é essencial na manchete?",
        "choices": [
          "Replace a universal causal promise with a qualified association.",
          "Claim that every small business participated.",
          "Remove all mention of the study's limitations."
        ],
        "explanation": "O estudo relata associação em amostra limitada; uma promessa causal universal elimina condições essenciais.",
        "gap": "The findings may not ___ to smaller organisations.",
        "fills": [
          "apply",
          "applies",
          "applying"
        ],
        "gapExplanation": "Após may usamos a forma base apply. A frase preserva a incerteza sobre a transferência dos resultados.",
        "production": "Escreva um resumo de 200–250 palavras e uma manchete de até 15 palavras. Preserve associação, seleção da amostra e limite de aplicabilidade.",
        "productionChecklist": [
          "Mantive quantificadores e modais?",
          "Atribuí as conclusões aos autores?",
          "A manchete representa o texto?"
        ],
        "speakingTask": "Explique a um editor, em dois minutos, por que uma manchete mais atraente pode distorcer o estudo.",
        "id": "c1-sintese-04"
      },
      {
        "title": "Integrar contraexemplos ao argumento",
        "rule": "Um contraexemplo testa o alcance de uma afirmação. Se a tese diz always, um caso contrário pode exigir sua revisão; se diz often under these conditions, o caso precisa ser comparado às condições. Reformule a tese para refletir a evidência, sem criar exceções arbitrárias apenas para torná-la impossível de contestar.",
        "example": "The exception suggests that the claim needs to be narrowed.",
        "translation": "A exceção sugere que a afirmação precisa ser delimitada.",
        "vocabulary": "counterexample — contraexemplo\nnarrow — restringir\nassumption — pressuposto",
        "pitfall": "Exception e refutation não são equivalentes em todos os argumentos. Primeiro identifique se a tese era universal ou condicionada.",
        "dialogue": "An article argued that public workshops always attract more participants when they are free. A neighbourhood project challenged the claim: attendance fell after fees were removed because the organiser also changed the venue to a less accessible building. The case did not establish that charging fees increased attendance. It showed that price was not the only relevant factor and that the article's universal wording was too strong. A revised claim linked participation to affordability, location, scheduling and the needs of the intended audience.",
        "dialogueTranslation": "Um artigo dizia que oficinas públicas sempre atraíam mais gente quando gratuitas. Um projeto registrou queda após retirar taxas, mas também mudou para prédio menos acessível. O caso não provou que cobrar aumentava frequência; mostrou que preço não era o único fator e que always era forte demais. A tese revisada considerou preço, local, horários e público.",
        "question": "O que o contraexemplo justifica?",
        "choices": [
          "Narrowing the universal claim and considering other access factors.",
          "Concluding that fees always increase attendance.",
          "Ignoring the venue change because price is the only cause."
        ],
        "explanation": "O caso limita a universalidade da tese, mas não estabelece a universalidade oposta nem isola o efeito do preço.",
        "gap": "The evidence suggests that the original claim ___ to be narrowed.",
        "fills": [
          "needs",
          "need",
          "needing"
        ],
        "gapExplanation": "Claim é singular, portanto needs no presente simples. A expressão needs to be narrowed indica necessidade de delimitação.",
        "production": "Redija 240–280 palavras avaliando a tese original, o contraexemplo e uma reformulação defensável. Identifique uma informação que ainda seria necessária.",
        "productionChecklist": [
          "Avaliei a tese que realmente foi feita?",
          "Evitei concluir o oposto sem evidência?",
          "Minha nova tese pode ser testada?"
        ],
        "speakingTask": "Defenda a tese revisada por dois minutos e explique em que condições você a abandonaria.",
        "id": "c1-sintese-05"
      },
      {
        "title": "Projeto C1: produzir um parecer",
        "rule": "Um parecer conecta evidência heterogênea a uma decisão situada. Comece pelo problema decisório e diferencie fatos, interesses e critérios. Sua conclusão pode ser condicional sem ser evasiva: especifique o que fazer agora e o que dependerá de dados futuros. Um leitor ocupado deve conseguir localizar recomendação, justificativa e risco principal.",
        "example": "On balance, a phased introduction would allow the policy to be evaluated.",
        "translation": "Considerando o conjunto, uma introdução gradual permitiria avaliar a política.",
        "vocabulary": "phased — gradual\non balance — considerando o conjunto\nimplementation — implementação",
        "pitfall": "On balance não substitui a comparação dos argumentos. Use a expressão após expor o que foi ponderado e qual critério orienta a escolha.",
        "dialogue": "A university is considering extending library hours. Student representatives cite demand during examinations; staff representatives raise concerns about transport home and unsocial working hours. A usage report shows that late attendance is concentrated in two weeks, but it excludes students who currently leave early to catch the last bus. The budget can fund either a year-round extension on two nights or a shorter daily extension during examinations. The decision also depends on staffing agreements and transport access. A useful recommendation must recognise both the recorded demand and what the data fail to capture.",
        "dialogueTranslation": "Uma universidade considera ampliar o horário da biblioteca. Estudantes citam demanda nas provas; funcionários levantam transporte e horários de trabalho. O uso noturno concentra-se em duas semanas, mas o relatório exclui quem sai cedo para pegar o último ônibus. O orçamento permite duas noites o ano todo ou ampliação diária menor nas provas. A decisão depende também de acordos de trabalho e acesso ao transporte.",
        "question": "Qual elemento o parecer deve preservar?",
        "choices": [
          "Recorded demand is incomplete because current constraints affect attendance.",
          "The existing attendance data capture all potential demand.",
          "Staffing agreements are irrelevant to implementation."
        ],
        "explanation": "A restrição atual de transporte pode esconder demanda; o parecer deve considerar esse limite junto às condições de implementação.",
        "gap": "A phased introduction would allow the policy ___ evaluated.",
        "fills": [
          "to be",
          "being",
          "be"
        ],
        "gapExplanation": "Allow + objeto + to be + particípio forma a construção passiva: allow the policy to be evaluated.",
        "production": "Produza um parecer de 350–450 palavras: questão decisória, síntese das posições, avaliação dos dados, recomendação e critérios de revisão. Inclua um resumo executivo de até 70 palavras.",
        "productionChecklist": [
          "Integrei interesses sem confundi-los com fatos?",
          "Minha decisão é executável?",
          "Expliquei o que os dados não capturam?"
        ],
        "speakingTask": "Apresente o parecer em três minutos e responda a perguntas de um estudante e de um funcionário.",
        "id": "c1-sintese-06"
      }
    ]
  },
  {
    "id": "c1-interacao",
    "title": "Interação profissional e expressão precisa",
    "level": "C1",
    "description": "Mediar conflitos, ajustar registro, compreender implicações e defender projetos complexos.",
    "lessons": [
      {
        "title": "Adequar registro sem mudar a mensagem",
        "rule": "Registro depende de relação, propósito e canal. Uma solicitação formal pode usar would appreciate, enquanto uma conversa entre colegas admite could you. Formalidade não exige frases obscuras. Preserve ação e prazo ao mudar o tom; tornar um pedido mais polido não deve torná-lo impossível de localizar.",
        "example": "We would appreciate receiving your comments by Thursday.",
        "translation": "Agradeceríamos receber seus comentários até quinta-feira.",
        "vocabulary": "register — registro de linguagem\nrecipient — destinatário\ncourteous — cortês",
        "pitfall": "Polidez excessiva pode apagar o prazo. Talvez quando for possível não preserva um pedido que precisa ser atendido até quinta.",
        "dialogue": "A coordinator needed feedback on a funding proposal by Thursday. Her message to a close colleague was brief: could you check the budget section today? Her message to an external reviewer gave the project context, specified which sections required comment and stated the Thursday deadline. Both messages were polite, but they provided different amounts of background because the recipients had different knowledge. The external message also invited the reviewer to say promptly if the deadline was not feasible, so another arrangement could be made.",
        "dialogueTranslation": "Uma coordenadora precisava de feedback até quinta. Ao colega próximo, pediu brevemente conferir o orçamento naquele dia. Ao revisor externo, deu contexto, indicou seções e prazo. Ambas eram educadas, mas ofereciam contexto diferente conforme o conhecimento do destinatário. A mensagem externa também pedia aviso imediato se o prazo fosse inviável.",
        "question": "Por que as mensagens contêm quantidades diferentes de contexto?",
        "choices": [
          "The recipients have different prior knowledge of the project.",
          "External reviewers should never receive a deadline.",
          "Polite messages must hide the requested action."
        ],
        "explanation": "A adaptação considera o conhecimento do destinatário, preservando ação e prazo em vez de confundir polidez com omissão.",
        "gap": "We would appreciate ___ your comments by Thursday.",
        "fills": [
          "receiving",
          "to receive",
          "receive"
        ],
        "gapExplanation": "Appreciate recebe objeto nominal ou gerúndio: receiving. O infinitivo com to não é o padrão usado aqui.",
        "production": "Escreva duas versões do mesmo pedido, com 130–170 palavras cada: uma para colega e outra para parceiro externo. Preserve ação, motivo e prazo, ajustando contexto e registro.",
        "productionChecklist": [
          "As duas versões pedem a mesma ação?",
          "O contexto é adequado ao destinatário?",
          "A formalidade preserva clareza?"
        ],
        "speakingTask": "Faça o pedido em uma conversa informal e depois em uma reunião externa, explicando como mudou o tom.",
        "id": "c1-interacao-01"
      },
      {
        "title": "Mediar posições incompatíveis",
        "rule": "Mediação começa distinguindo posições declaradas de interesses subjacentes. O objetivo de one concern is… não é neutralizar o conflito, mas torná-lo tratável. Reformule cada posição com fidelidade, verifique a compreensão e procure critérios comuns. Não apresente uma solução como consenso enquanto alguma parte não a aceitou.",
        "example": "What both teams need is a predictable process for handling urgent requests.",
        "translation": "O que ambas as equipes precisam é de um processo previsível para lidar com pedidos urgentes.",
        "vocabulary": "underlying interest — interesse subjacente\nmediate — mediar\npredictable — previsível",
        "pitfall": "Both sides agree não pode ser inferido de silêncio. Relate como proposta aquilo que ainda não recebeu aceitação explícita.",
        "dialogue": "The support team wanted every urgent customer request handled immediately. The development team wanted uninterrupted work blocks to prevent recurring defects. A mediator asked each group to describe the consequences of its current difficulties. They identified a shared need for reliable expectations. The proposed arrangement reserved one developer for urgent requests while protecting the others' focus time, with a written definition of urgency. Support accepted the definition, but development requested a workload trial before committing to permanent rotation. The mediator recorded this as partial agreement, not a settled policy.",
        "dialogueTranslation": "Suporte queria resposta imediata a urgências; desenvolvimento queria blocos de foco para evitar defeitos. A mediadora explorou consequências e identificou necessidade comum de previsibilidade. Propôs um desenvolvedor para urgências e definição escrita de urgência. Suporte aceitou a definição; desenvolvimento pediu teste de carga antes de rotação permanente. Ela registrou acordo parcial.",
        "question": "Qual ponto permanece aberto?",
        "choices": [
          "Whether a permanent developer rotation is sustainable.",
          "Whether urgent requests exist at all.",
          "Whether support accepted the definition of urgency."
        ],
        "explanation": "O teste de carga condiciona o compromisso com rotação permanente; a definição já foi aceita pelo suporte.",
        "gap": "What both teams need ___ a predictable process.",
        "fills": [
          "is",
          "are",
          "be"
        ],
        "gapExplanation": "A oração what both teams need funciona como unidade singular nessa construção, seguida por is.",
        "production": "Redija um registro de mediação de 250–300 palavras distinguindo interesses, proposta, pontos aceitos e pendências. Termine com um próximo passo verificável.",
        "productionChecklist": [
          "Representei os dois interesses com fidelidade?",
          "Evitei apresentar proposta como consenso?",
          "Delimitei a questão ainda aberta?"
        ],
        "speakingTask": "Conduza uma mediação de três minutos, pedindo a cada lado que confirme sua reformulação antes de propor a solução.",
        "id": "c1-interacao-02"
      },
      {
        "title": "Interpretar pedidos implícitos",
        "rule": "Uma pergunta sobre possibilidade pode funcionar como pedido, mas a inferência depende do contexto. Is there any chance… frequentemente suaviza uma solicitação; não torna toda pergunta uma ordem. Identifique a ação sugerida, a relação entre pessoas e a possibilidade de recusa. Confirme intenções quando houver mais de uma leitura plausível.",
        "example": "Is there any chance we could revisit the final paragraph?",
        "translation": "Será que poderíamos reconsiderar o último parágrafo?",
        "vocabulary": "implied — implícito\nrevisit — reconsiderar\ntentative — cauteloso",
        "pitfall": "Uma inferência plausível não é leitura de mente. Use seems to be asking quando o texto não confirma explicitamente a intenção.",
        "dialogue": "After reading a draft announcement, a colleague said, 'The final paragraph sounds rather definite, given that the funding is still pending. Is there any chance we could revisit it?' The writer understood this as a request to soften the promise, not simply as a question about whether editing was technically possible. She asked which sentence was most problematic. The colleague pointed to the guarantee of a September opening and suggested wording that made the date conditional on funding. The exchange clarified the intended change without treating every part of the draft as unacceptable.",
        "dialogueTranslation": "Após ler um anúncio, um colega observou que o último parágrafo parecia definitivo apesar de financiamento pendente e perguntou se poderiam revisitá-lo. A autora interpretou pedido de suavizar promessa e perguntou qual frase. Ele indicou a garantia de abertura em setembro e sugeriu condicionar a data ao financiamento, sem rejeitar o texto inteiro.",
        "question": "Que mudança o colega provavelmente solicita?",
        "choices": [
          "Make the opening date conditional on funding.",
          "Delete the entire announcement without discussion.",
          "Explain whether the software permits editing."
        ],
        "explanation": "O comentário sobre certeza e financiamento sustenta a leitura de pedido para condicionar a data; a confirmação posterior reforça isso.",
        "gap": "The opening date should be conditional ___ funding approval.",
        "fills": [
          "on",
          "at",
          "by"
        ],
        "gapExplanation": "Conditional on expressa dependência de uma condição. At e by não formam essa combinação.",
        "production": "Escreva uma análise de 220 palavras da intenção implícita e duas respostas possíveis: uma que confirma a leitura e outra que pede esclarecimento sem confronto.",
        "productionChecklist": [
          "Baseei a inferência em pistas textuais?",
          "Diferenciei intenção provável e certeza?",
          "Minha resposta verifica o pedido concreto?"
        ],
        "speakingTask": "Pratique responder ao pedido indireto em 90 segundos e negociar uma formulação aceitável.",
        "id": "c1-interacao-03"
      },
      {
        "title": "Usar ênfase e inversão com controle",
        "rule": "Expressões restritivas iniciais podem desencadear inversão para dar ênfase: only after the review did we understand. O auxiliar vem antes do sujeito na oração principal, não dentro da expressão introdutória. Use esse recurso quando a ordem da descoberta importa, evitando transformá-lo em ornamento em todas as frases.",
        "example": "Only after the review did we understand the scale of the problem.",
        "translation": "Só depois da revisão entendemos a dimensão do problema.",
        "vocabulary": "scale — dimensão\nrestrictive — restritivo\noversight — falha de supervisão",
        "pitfall": "Only after we reviewed não exige inverter we reviewed dentro da oração temporal. A inversão ocorre na principal: did we understand.",
        "dialogue": "A small archive believed its digitisation project was nearly complete because most boxes had been scanned. Only after a quality review did staff discover that many files lacked searchable descriptions. The images existed, but researchers could not reliably find them. The project leader revised the completion criteria to include both image quality and usable metadata. She explained that the review had changed their understanding of completion rather than erased the work already done. The next phase focused on descriptions and retrieval tests with actual users.",
        "dialogueTranslation": "Um arquivo achava a digitalização quase concluída porque escaneara caixas. Só após revisão descobriu descrições ausentes: imagens existiam, mas pesquisadores não as localizavam bem. A líder incluiu qualidade e metadados utilizáveis nos critérios. A revisão redefiniu conclusão sem apagar o trabalho feito. A etapa seguinte focou descrições e testes com usuários.",
        "question": "O que a revisão mudou principalmente?",
        "choices": [
          "The criteria for considering the project complete.",
          "The fact that images had already been scanned.",
          "The decision to stop all access to the archive."
        ],
        "explanation": "A revisão mostrou que escanear não bastava para recuperação utilizável, levando a novos critérios de conclusão.",
        "gap": "Only after the audit ___ they notice the missing descriptions.",
        "fills": [
          "did",
          "had",
          "were"
        ],
        "gapExplanation": "A inversão com only after usa did antes do sujeito e verbo base notice; had exigiria noticed.",
        "production": "Escreva um relato de 240–280 palavras sobre a mudança de critérios. Use uma inversão com função clara e depois reescreva-a em ordem neutra, explicando a diferença de ênfase.",
        "productionChecklist": [
          "A inversão está na oração principal?",
          "Expliquei o efeito de ênfase?",
          "Evitei confundir trabalho realizado com utilidade final?"
        ],
        "speakingTask": "Apresente a descoberta por dois minutos, enfatizando a diferença entre quantidade digitalizada e acesso efetivo.",
        "id": "c1-interacao-04"
      },
      {
        "title": "Gerir perguntas difíceis",
        "rule": "Responder a uma pergunta difícil envolve reconhecer o ponto, delimitar o que você sabe e responder diretamente à parte possível. Let me distinguish between… separa questões misturadas. Adiar um detalhe exige dizer quando ou como será verificado. Repetir mensagens preparadas sem responder à pergunta enfraquece a credibilidade.",
        "example": "Let me distinguish between the initial estimate and the approved budget.",
        "translation": "Deixe-me distinguir a estimativa inicial do orçamento aprovado.",
        "vocabulary": "accountability — prestação de contas\nestimate — estimativa\napproved — aprovado",
        "pitfall": "I cannot comment não deve substituir uma resposta que você possui. Delimite a informação realmente indisponível e responda ao restante.",
        "dialogue": "At a public meeting, a resident asked why a renovation had 'doubled its budget'. The project officer explained that the early estimate excluded accessibility works, while the approved budget included them. She acknowledged that the initial communication had not made this clear. When asked for the exact contingency remaining, she did not invent a figure: she committed to publishing the verified amount with the next update on Tuesday. Her answer distinguished a misleading comparison from a separate question that still required checking.",
        "dialogueTranslation": "Em reunião pública, um morador perguntou por que a reforma dobrara o orçamento. A responsável explicou que a estimativa inicial excluía acessibilidade, incluída no aprovado, e reconheceu comunicação falha. Sem saber a contingência exata, prometeu publicar o valor verificado na atualização de terça. Separou comparação enganosa de questão ainda a conferir.",
        "question": "Como a responsável lida com o número que desconhece?",
        "choices": [
          "She gives a specific plan for publishing a verified figure.",
          "She invents an approximate figure and calls it exact.",
          "She refuses to address any question about the project."
        ],
        "explanation": "Ela não inventa o número: assume um compromisso específico de verificação e publicação, sem fugir das demais questões.",
        "gap": "Let me distinguish ___ the estimate and the approved budget.",
        "fills": [
          "between",
          "among",
          "across"
        ],
        "gapExplanation": "Distinguish between A and B apresenta a diferença entre os dois elementos nomeados.",
        "production": "Elabore três respostas de 80–100 palavras: a uma premissa equivocada, a uma crítica válida e a uma pergunta cujo dado falta. Preserve responsabilidade e clareza.",
        "productionChecklist": [
          "Respondi ao ponto principal?",
          "Reconheci a falha real?",
          "Ofereci prazo verificável quando faltava informação?"
        ],
        "speakingTask": "Peça a alguém três perguntas inesperadas sobre o caso e pratique respostas de até um minuto cada.",
        "id": "c1-interacao-05"
      },
      {
        "title": "Projeto C1: negociar e registrar um acordo",
        "rule": "Ao fechar uma negociação complexa, diferencie compromissos, dependências e mecanismos de revisão. Subject to indica condicionamento; pending mantém a questão aguardando decisão. Uma ata final precisa permitir que alguém ausente execute o combinado sem deduzir obrigações implícitas. Registre também como resolver divergências futuras.",
        "example": "The agreement remains subject to a successful accessibility review.",
        "translation": "O acordo continua condicionado a uma avaliação de acessibilidade satisfatória.",
        "vocabulary": "subject to — condicionado a\nmilestone — marco\npending — pendente",
        "pitfall": "Subject to approval significa que a aprovação ainda condiciona o acordo. Não resuma como approved se ela não ocorreu.",
        "dialogue": "A cultural centre and a community group negotiated shared use of a hall. They agreed on weekly sessions and a three-month trial, but permanent access depended on an accessibility review and confirmation of staffing costs. The community group would collect participant feedback; the centre would publish usage figures. Both accepted a review meeting after six weeks to address problems before the trial ended. Their written record avoided promising permanent access and specified that any schedule changes required notice to both coordinators.",
        "dialogueTranslation": "Um centro cultural e um grupo negociaram uso de salão: sessões semanais e teste de três meses, com acesso permanente dependente de acessibilidade e custos de equipe. O grupo recolheria feedback; o centro publicaria uso. Acordaram revisão em seis semanas e aviso aos dois coordenadores para mudanças de horário. O registro não prometeu acesso permanente.",
        "question": "Qual compromisso já foi assumido?",
        "choices": [
          "A three-month trial with a review meeting after six weeks.",
          "Permanent access regardless of staffing costs.",
          "Schedule changes without notifying either coordinator."
        ],
        "explanation": "O teste e a reunião são acordos explícitos; o acesso permanente permanece condicionado a verificações.",
        "gap": "Permanent access is subject ___ the accessibility review.",
        "fills": [
          "to",
          "for",
          "with"
        ],
        "gapExplanation": "Subject to é a locução que expressa condicionamento; o acordo depende da avaliação citada.",
        "production": "Escreva um acordo de 300–400 palavras com compromissos, responsabilidades, condições pendentes e revisão. Acrescente um resumo de 80 palavras para participantes.",
        "productionChecklist": [
          "Separei obrigação e condição pendente?",
          "Atribuí responsabilidades corretamente?",
          "Um terceiro conseguiria executar o acordo?"
        ],
        "speakingTask": "Negocie o acordo por quatro minutos e faça um fechamento oral que peça confirmação das duas partes.",
        "id": "c1-interacao-06"
      }
    ]
  }
];
