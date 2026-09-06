import type { ModuleDraft } from "./types";

/**
 * An optional A2 extension. Its published IDs are appended to the ledger so
 * existing progress cookies keep their original bit positions.
 */
export const a2CommunicationModules: ModuleDraft[] = [
  {
    id: "a2-comunicacao",
    title: "Comunicação em situações reais",
    level: "A2",
    prerequisiteId: "a2-textos",
    description:
      "Resolver trajetos, pedidos, recados e pequenos imprevistos com clareza.",
    lessons: [
      {
        id: "a2-comunicacao-01",
        title: "Pedir e confirmar direções",
        rule: "Para pedir uma direção com educação, use Could you tell me how to get to…? Depois de how to, o verbo fica na forma base: how to get, não how to getting. A resposta pode trazer imperativos curtos como go straight e turn left. Repita o ponto principal com So I turn…? para confirmar antes de sair.",
        example: "Could you tell me how to get to the library?",
        translation: "Você poderia me dizer como chegar à biblioteca?",
        vocabulary:
          "go straight — siga em frente\nturn left — vire à esquerda\ncorner — esquina",
        pitfall:
          "Em uma pergunta indireta, não inverta get e to: how to get to the library é a ordem esperada depois de tell me.",
        dialogue:
          "Ana: Excuse me, could you tell me how to get to the library?\nJo: Go straight for two blocks, then turn left at the bank.\nAna: So I turn left at the bank?\nJo: That's right. The library is on the corner.",
        dialogueTranslation:
          "Ana: Com licença, você poderia me dizer como chegar à biblioteca?\nJo: Siga em frente por dois quarteirões e vire à esquerda no banco.\nAna: Então viro à esquerda no banco?\nJo: Isso mesmo. A biblioteca fica na esquina.",
        question: "Em qual ponto Ana deve virar à esquerda?",
        choices: ["At the bank.", "At the library.", "After one block."],
        explanation:
          "Jo diz claramente then turn left at the bank. A biblioteca vem depois, na esquina, e não é o ponto da curva.",
        gap: "Could you tell me how to ___ to the library?",
        fills: ["get", "getting", "got"],
        gapExplanation:
          "Depois de how to usamos o verbo base get. Getting exigiria outra estrutura, e got coloca a pergunta no passado sem motivo.",
        production:
          "Escreva um diálogo de quatro falas: peça orientação para um lugar, dê duas instruções e faça uma pergunta para confirmar o caminho.",
      },
      {
        id: "a2-comunicacao-02",
        title: "Checar a rota no transporte",
        rule: "Ao entrar em um ônibus ou trem, use Does this bus go to…? para confirmar o destino antes de pagar ou sentar. Para indicar onde sair, use get off at + parada: get off at Market Street. Change pode significar trocar de linha. Perguntar Is it the next stop? ajuda a confirmar a sequência sem presumir que a primeira parada é a certa.",
        example: "Does this bus go to Central Station?",
        translation: "Este ônibus vai para a Estação Central?",
        vocabulary:
          "stop — parada\nget off — descer\nchange — trocar de linha",
        pitfall:
          "Go to mostra destino; get off indica onde sair. Dizer go off para descer mistura duas ações diferentes em uma situação de transporte.",
        dialogue:
          "Luca: Excuse me, does this bus go to Central Station?\nDriver: Yes, but you need to get off at Market Street and change there.\nLuca: Thanks. Is Market Street the next stop?\nDriver: It is the second stop.",
        dialogueTranslation:
          "Luca: Com licença, este ônibus vai para a Estação Central?\nMotorista: Vai, mas você precisa descer na Market Street e trocar lá.\nLuca: Obrigado. Market Street é a próxima parada?\nMotorista: É a segunda parada.",
        question: "Onde Luca precisa trocar de linha?",
        choices: ["At Market Street.", "At Central Station.", "At the first stop."],
        explanation:
          "O motorista orienta Luca a descer em Market Street e change there. A Estação Central é o destino final, não o ponto da troca.",
        gap: "You need to ___ off at Market Street.",
        fills: ["get", "go", "take"],
        gapExplanation:
          "A expressão fixa para descer de um transporte é get off. Go e take podem aparecer em outros contextos, mas não formam esta instrução.",
        production:
          "Escreva uma mensagem para alguém que visitará sua cidade: diga qual linha pegar, em que parada descer e onde trocar de transporte.",
      },
      {
        id: "a2-comunicacao-03",
        title: "Fazer um pedido com uma alteração",
        rule: "Could I have…? é uma forma educada de pedir algo em um café ou balcão. Acrescente without + item para retirar um ingrediente: without onions. Se precisar confirmar, use So it comes without…? A frase deixa claro o pedido e reduz a chance de a alteração se perder entre outros detalhes do cardápio.",
        example: "Could I have the soup without cheese, please?",
        translation: "Eu poderia pedir a sopa sem queijo, por favor?",
        vocabulary:
          "without — sem\norder — pedido\ncontains — contém",
        pitfall:
          "Sem queijo é without cheese, não no cheese quando você descreve o item desejado. No cheese pode soar como uma resposta curta, não como pedido completo.",
        dialogue:
          "Mia: Could I have the vegetable sandwich without onions, please?\nServer: Of course. It comes with salad and tomato.\nMia: Great. So it comes without onions?\nServer: Yes, I noted that on your order.",
        dialogueTranslation:
          "Mia: Eu poderia pedir o sanduíche de legumes sem cebola, por favor?\nAtendente: Claro. Ele vem com salada e tomate.\nMia: Ótimo. Então ele vem sem cebola?\nAtendente: Sim, anotei isso no seu pedido.",
        question: "Qual alteração Mia confirmou no pedido?",
        choices: ["No onions.", "No tomato.", "No salad."],
        explanation:
          "Mia pede o sanduíche without onions e repete essa mudança ao confirmar. Salada e tomate continuam no item descrito pelo atendente.",
        gap: "Could I have the sandwich ___ onions, please?",
        fills: ["without", "not", "except"],
        gapExplanation:
          "Without introduz o ingrediente que deve ficar de fora. Not precisa de outra estrutura, e except não é a forma natural para este pedido.",
        production:
          "Monte um pedido de três frases em um café: escolha um item, peça uma alteração e confirme o detalhe mais importante antes de encerrar.",
      },
      {
        id: "a2-comunicacao-04",
        title: "Pedir para repetir uma informação",
        rule: "Quando uma informação chega rápido demais, Could you say that more slowly, please? pede repetição de forma direta e educada. Use say para repetir palavras, números ou uma frase; tell geralmente vem com pessoa ou informação, como tell me the number. Anotar e repetir a sequência no fim ajuda a conferir o que foi entendido sem fingir que tudo ficou claro.",
        example: "Could you say that more slowly, please?",
        translation: "Você poderia dizer isso mais devagar, por favor?",
        vocabulary:
          "slowly — devagar\nreference number — número de referência\nwrite down — anotar",
        pitfall:
          "More slower é incorreto porque more e -er não se combinam aqui. Use more slowly: slowly é um advérbio formado com -ly.",
        dialogue:
          "Receptionist: Your reference number is B-4-7-9.\nAna: Could you say that more slowly, please?\nReceptionist: Certainly: B as in Bruno, four, seven, nine.\nAna: Thank you. I wrote it down.",
        dialogueTranslation:
          "Recepcionista: Seu número de referência é B-4-7-9.\nAna: Você poderia dizer isso mais devagar, por favor?\nRecepcionista: Claro: B de Bruno, quatro, sete, nove.\nAna: Obrigada. Eu anotei.",
        question: "Qual número Ana anotou?",
        choices: ["B-4-7-9", "B-7-4-9", "D-4-7-9"],
        explanation:
          "Depois do pedido de Ana, a recepcionista repete B, four, seven, nine. A ordem dos dois números do meio não foi invertida.",
        gap: "Could you ___ that again, please?",
        fills: ["say", "says", "saying"],
        gapExplanation:
          "Após could, o verbo fica na forma base: say. Says é terceira pessoa no presente, e saying precisaria de uma estrutura diferente.",
        production:
          "Escreva quatro falas de uma ligação: peça que uma informação seja repetida, registre um número ou horário e confirme o que anotou.",
      },
      {
        id: "a2-comunicacao-05",
        title: "Pedir um favor com respeito",
        rule: "Would you mind + verbo com -ing faz um pedido cuidadoso quando a ação depende de outra pessoa: Would you mind closing the window? Respostas comuns são Not at all ou Of course not. Explique o motivo em uma frase simples quando isso ajudar a pessoa a decidir, mas evite transformar o motivo em uma ordem disfarçada.",
        example: "Would you mind closing the window?",
        translation: "Você se importaria de fechar a janela?",
        vocabulary:
          "mind — se importar\nwind — vento\npapers — papéis",
        pitfall:
          "Depois de would you mind, use closing, não to close. A resposta Yes pode parecer que a pessoa se importa; Not at all deixa a aceitação mais clara.",
        dialogue:
          "Noa: Would you mind closing the window? The wind is moving the papers.\nLeo: Not at all. Is this better?\nNoa: Yes, thanks. Could you leave the door open?\nLeo: Sure, that is fine.",
        dialogueTranslation:
          "Noa: Você se importaria de fechar a janela? O vento está mexendo nos papéis.\nLeo: Claro que não. Assim está melhor?\nNoa: Sim, obrigada. Você poderia deixar a porta aberta?\nLeo: Claro, tudo bem.",
        question: "Qual favor Noa pede primeiro?",
        choices: ["Close the window.", "Open the door.", "Move the papers."],
        explanation:
          "A primeira pergunta é about closing the window. A porta só aparece depois, quando Noa pede que ela continue aberta.",
        gap: "Would you mind ___ the door?",
        fills: ["closing", "close", "closed"],
        gapExplanation:
          "Mind é seguido por verbo em -ing nesta estrutura: mind closing. Close e closed não completam a pergunta com a forma pedida.",
        production:
          "Escreva um pedido respeitoso para alguém ao seu lado, dê uma razão breve e acrescente uma resposta educada que aceite ou recuse o favor.",
      },
      {
        id: "a2-comunicacao-06",
        title: "Avisar atraso e negociar um horário",
        rule: "I'm running late avisa que você vai se atrasar sem precisar explicar cada detalhe. Para propor uma alternativa, use could we meet at… instead? e confirme com Would six thirty work for you? Aqui would deixa a pergunta mais gentil; não fala de um passado. Finalize com uma ação concreta, como I'll text you when I arrive, para manter a outra pessoa informada.",
        example: "I'm running late, so could we meet at six thirty instead?",
        translation: "Estou atrasado(a), então poderíamos nos encontrar às seis e meia em vez disso?",
        vocabulary:
          "running late — atrasado(a)\ninstead — em vez disso\narrive — chegar",
        pitfall:
          "Running late descreve um atraso em andamento; não use I am late running. Em horários, six thirty significa seis e meia, não seis horas exatas.",
        dialogue:
          "Ana: I'm running late because the train stopped.\nBen: No problem. Would six thirty work for you?\nAna: Yes, that would be perfect. I'll text you when I arrive.\nBen: Great, see you then.",
        dialogueTranslation:
          "Ana: Estou atrasada porque o trem parou.\nBen: Sem problema. Seis e meia funciona para você?\nAna: Sim, seria perfeito. Vou mandar mensagem quando eu chegar.\nBen: Ótimo, até lá.",
        question: "Que horário Ana e Ben confirmam?",
        choices: ["Six thirty.", "Six o'clock.", "Seven thirty."],
        explanation:
          "Ben propõe six thirty e Ana aceita dizendo that would be perfect. Não há outra mudança de horário depois dessa confirmação.",
        gap: "Would six thirty ___ for you?",
        fills: ["work", "works", "working"],
        gapExplanation:
          "Depois de would usamos a forma base work. Works seria presente de terceira pessoa, e working exigiria outro auxiliar ou uma construção diferente.",
        production:
          "Escreva uma mensagem curta avisando que você vai se atrasar, proponha dois horários alternativos e termine confirmando como atualizará a outra pessoa.",
      },
    ],
  },
];
