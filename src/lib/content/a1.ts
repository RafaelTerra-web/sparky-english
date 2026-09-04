import type { ModuleDraft } from "./types";

export const a1Modules: ModuleDraft[] = [
  {
    id: "a1-identidade",
    title: "Identidade e primeiro contato",
    level: "A1",
    legacyId: "a1-1-1",
    description: "Nome, origem, idade e perguntas com o verbo be.",
    lessons: [
      {
        title: "Perguntar o nome",
        rule: "What pergunta 'o quê/qual'. Para perguntar o nome, use What is your name? Your significa seu/sua e vem antes de name. Na conversa, What is costuma aparecer como What's; a contração não muda a pergunta.",
        example: "What is your name?",
        translation: "Qual é o seu nome?",
        vocabulary:
          "name — nome\nfirst name — primeiro nome\nlast name — sobrenome",
        pitfall:
          "Não use How is your name: em inglês essa pergunta começa com What. Your não muda quando falamos com uma mulher ou um homem.",
        dialogue:
          "Ana: What's your name?\nOmar: My name is Omar.\nAna: Nice to meet you, Omar.",
        dialogueTranslation:
          "Ana: Qual é seu nome?\nOmar: Meu nome é Omar.\nAna: Prazer em conhecer você, Omar.",
        question: "Qual é o nome da pessoa que responde à Ana?",
        choices: ["Omar", "Ana", "Name"],
        explanation:
          "My name is Omar identifica quem responde. Ana é quem fez a pergunta.",
        gap: "What is ___ name? (seu nome)",
        fills: ["your", "you", "I"],
        gapExplanation:
          "Your indica posse antes de name. You é o pronome 'você', não 'seu'.",
        production:
          "Pergunte o nome de alguém e responda com seu próprio nome. Confira se usou your na pergunta e my na resposta.",
      },
      {
        title: "Dizer de onde você é",
        rule: "Be from informa origem: I am from Brazil. Use am com I, is com he/she/it e are com you/we/they. Where significa 'onde'; Where are you from? pergunta a origem, não o endereço atual.",
        example: "I am from Brazil.",
        translation: "Eu sou do Brasil.",
        vocabulary: "from — de, origem\ncountry — país\ncity — cidade",
        pitfall:
          "I have from Brazil não expressa origem. Em inglês, nomes de países e nacionalidades começam com maiúscula.",
        dialogue:
          "Luis: Where are you from?\nMei: I'm from China, but I live in Recife.\nLuis: Welcome to the class!",
        dialogueTranslation:
          "Luis: De onde você é?\nMei: Sou da China, mas moro em Recife.\nLuis: Bem-vinda à turma!",
        question: "Qual é o país de origem de Mei?",
        choices: ["China", "Brazil", "Recife"],
        explanation:
          "From China indica a origem; live in Recife indica onde ela mora atualmente.",
        gap: "Where ___ you from?",
        fills: ["are", "is", "am"],
        gapExplanation: "O sujeito you combina com are; am é usado com I.",
        production:
          "Escreva sua cidade e seu país de origem em duas frases com I'm from. Use maiúsculas nos nomes próprios.",
      },
      {
        title: "Falar da idade",
        rule: "Para idade, o inglês usa be, não have: I am twenty. Years old pode completar a frase, mas é opcional. How old are you? pergunta a idade. Em situações pessoais, só faça essa pergunta quando houver contexto e abertura.",
        example: "I am twenty years old.",
        translation: "Eu tenho vinte anos.",
        vocabulary:
          "twenty — vinte\nthirty — trinta\nyears old — anos de idade",
        pitfall:
          "A tradução literal I have twenty years não informa idade naturalmente. A estrutura é I am + número.",
        dialogue:
          "Ben: How old is your sister?\nAna: She's eighteen. I'm twenty.\nBen: My sister is eighteen too.",
        dialogueTranslation:
          "Ben: Quantos anos sua irmã tem?\nAna: Ela tem dezoito. Eu tenho vinte.\nBen: Minha irmã também tem dezoito.",
        question: "Quantos anos tem a irmã de Ana?",
        choices: ["Eighteen", "Twenty", "Thirty"],
        explanation:
          "She's eighteen se refere à irmã. I'm twenty informa a idade de Ana.",
        gap: "My brother ___ thirty years old.",
        fills: ["is", "has", "are"],
        gapExplanation:
          "My brother é terceira pessoa singular e pede is para idade.",
        production:
          "Escreva a idade de uma pessoa fictícia com is. Depois escreva a pergunta que você faria para saber essa idade.",
      },
      {
        title: "Apresentar outra pessoa",
        rule: "This is apresenta alguém próximo: This is my friend. He e she podem retomar uma pessoa quando seus pronomes são conhecidos. It pode retomar um objeto. A frase afirmativa precisa de sujeito e verbo: She is a teacher.",
        example: "This is my friend Clara.",
        translation: "Esta é minha amiga Clara.",
        vocabulary:
          "friend — amigo/amiga\nteacher — professor/professora\ncolleague — colega de trabalho",
        pitfall:
          "Não omita is em This my friend. Em inglês, teacher não muda de forma conforme o gênero da pessoa.",
        dialogue:
          "Ana: This is my friend Clara.\nClara: Hello, I'm a teacher.\nJo: Nice to meet you.",
        dialogueTranslation:
          "Ana: Esta é minha amiga Clara.\nClara: Olá, sou professora.\nJo: Prazer em conhecer você.",
        question: "Qual é a profissão de Clara?",
        choices: ["Teacher", "Doctor", "Driver"],
        explanation:
          "Clara diz I'm a teacher. Friend explica sua relação com Ana, não sua profissão.",
        gap: "This ___ my colleague.",
        fills: ["is", "are", "am"],
        gapExplanation: "This funciona como sujeito singular e combina com is.",
        production:
          "Apresente uma pessoa fictícia pelo nome e pela profissão. Faça duas frases, ambas com o verbo be.",
      },
      {
        title: "Negar e confirmar com be",
        rule: "Coloque not depois de be para negar: I am not, she is not, they are not. Is not pode virar isn't; are not pode virar aren't. Nas perguntas, be vem antes do sujeito: Are you ready? Na resposta curta, mantenha o sujeito e o verbo.",
        example: "We are not late.",
        translation: "Nós não estamos atrasados.",
        vocabulary: "late — atrasado\nready — pronto\nright — certo",
        pitfall:
          "Não use don't com be: We don't are late está incorreto. Para negar are, use are not ou aren't.",
        dialogue:
          "Jo: Are we late?\nBen: No, we aren't. The class starts at ten.\nJo: Great, we have time.",
        dialogueTranslation:
          "Jo: Estamos atrasados?\nBen: Não. A aula começa às dez.\nJo: Ótimo, temos tempo.",
        question: "Segundo Ben, os dois estão atrasados?",
        choices: ["No, they aren't.", "Yes, they are.", "The class is over."],
        explanation:
          "No, we aren't nega que estejam atrasados. They retoma as duas pessoas na resposta à pergunta sobre elas.",
        gap: "She ___ not ready.",
        fills: ["is", "does", "are"],
        gapExplanation:
          "A negação de she is é she is not. Does não acompanha be nessa estrutura.",
        production:
          "Escreva uma pergunta com Are you e duas respostas curtas, uma afirmativa e outra negativa.",
      },
      {
        title: "Soletrar e confirmar dados",
        rule: "How do you spell…? pede a sequência de letras de uma palavra. Em um cadastro, first name é o nome e last name é o sobrenome. Use That's right para confirmar e No, it's… para corrigir uma informação de modo direto.",
        example: "How do you spell your surname?",
        translation: "Como você soletra seu sobrenome?",
        vocabulary: "spell — soletrar\nsurname — sobrenome\nform — formulário",
        pitfall:
          "Surname não é apelido: nickname é apelido. Ler letras não é treinar sua pronúncia; nesta lição o foco é compreender pedidos de confirmação por escrito.",
        dialogue:
          "Clerk: Is your surname Lima?\nAna: Yes. L-I-M-A.\nClerk: Thank you. Please check the form.",
        dialogueTranslation:
          "Atendente: Seu sobrenome é Lima?\nAna: Sim. L-I-M-A.\nAtendente: Obrigado(a). Confira o formulário, por favor.",
        question: "Qual sobrenome Ana confirma?",
        choices: ["Lima", "Ana", "Clerk"],
        explanation:
          "Ana confirma Lima e fornece as quatro letras. Clerk identifica o atendente.",
        gap: "How do you ___ your name?",
        fills: ["spell", "spelling", "spells"],
        gapExplanation:
          "Depois de do you, use a forma base spell, sem -s nem -ing. A pergunta pede as letras do nome.",
        production:
          "Monte um pequeno cadastro fictício com First name e Last name. Escreva uma frase pedindo a soletração do sobrenome.",
      },
    ],
  },
  {
    id: "a1-pessoas",
    title: "Pessoas e objetos",
    level: "A1",
    description: "Artigos, plurais, família, posse e descrição.",
    lessons: [
      {
        title: "Escolher a ou an",
        rule: "A e an acompanham um substantivo contável singular quando ele não é específico. A escolha depende do som inicial da palavra seguinte: a book, an apple. Use também artigo ao dizer profissão: She's a nurse.",
        example: "She is an engineer.",
        translation: "Ela é engenheira.",
        vocabulary:
          "engineer — engenheiro/engenheira\nnurse — enfermeiro/enfermeira\napple — maçã",
        pitfall:
          "A letra sozinha não decide: an hour começa com som de vogal; a university começa com som de 'y'. Não se usa an antes de todo u.",
        dialogue:
          "Ana: What do you do?\nLia: I'm an engineer. My brother is a nurse.\nAna: Do you work nearby?",
        dialogueTranslation:
          "Ana: Qual é sua profissão?\nLia: Sou engenheira. Meu irmão é enfermeiro.\nAna: Você trabalha por perto?",
        question: "Qual é a profissão do irmão de Lia?",
        choices: ["Nurse", "Engineer", "Teacher"],
        explanation:
          "My brother is a nurse se refere ao irmão; engineer é a profissão de Lia.",
        gap: "There is ___ apple on the table.",
        fills: ["an", "a", "are"],
        gapExplanation:
          "Apple começa com som de vogal e é contável singular: an apple.",
        production:
          "Liste três objetos com a e três com an. Confira o som inicial, não apenas a letra.",
      },
      {
        title: "Contar no plural",
        rule: "Muitos substantivos recebem -s no plural: books. Depois de sons como os finais de bus e box, a escrita costuma receber -es: buses, boxes. Alguns plurais são irregulares, como child → children. O artigo a/an não acompanha plural.",
        example: "There are two boxes here.",
        translation: "Há duas caixas aqui.",
        vocabulary:
          "box / boxes — caixa/caixas\nchild / children — criança/crianças\nbook / books — livro/livros",
        pitfall:
          "Two box deixa de marcar o plural. Em inglês padrão, children já é plural; não escreva childrens.",
        dialogue:
          "Ben: How many boxes do we have?\nLia: Two boxes and three bags.\nBen: Let's put them in the car.",
        dialogueTranslation:
          "Ben: Quantas caixas temos?\nLia: Duas caixas e três bolsas.\nBen: Vamos colocá-las no carro.",
        question: "Quantas bolsas Lia menciona?",
        choices: ["Three", "Two", "Five"],
        explanation: "Three bags são três bolsas; two boxes são duas caixas.",
        gap: "The two ___ are at school.",
        fills: ["children", "child", "childs"],
        gapExplanation:
          "O plural irregular de child é children. Two exige plural.",
        production:
          "Descreva quantos livros, caixas e bolsas há numa sala fictícia. Use um número antes de cada substantivo plural.",
      },
      {
        title: "Falar da família",
        rule: "Have expressa posse ou relações: I have a sister. Com he, she e it, use has. My, your, his e her vêm antes do substantivo para indicar relação ou posse. Em inglês, cousin pode ser primo ou prima.",
        example: "My sister has two children.",
        translation: "Minha irmã tem dois filhos.",
        vocabulary: "sister — irmã\nbrother — irmão\ncousin — primo/prima",
        pitfall:
          "Parents significa pais, não parentes em geral. Relatives é a palavra para parentes.",
        dialogue:
          "Ana: Do you have siblings?\nBen: Yes, I have a brother. He has two children.",
        dialogueTranslation:
          "Ana: Você tem irmãos?\nBen: Sim, tenho um irmão. Ele tem dois filhos.",
        question: "Quem tem dois filhos?",
        choices: ["Ben's brother", "Ana", "Ben's sister"],
        explanation:
          "He retoma a brother. Não há uma irmã mencionada no diálogo.",
        gap: "She ___ a cousin in Salvador.",
        fills: ["has", "have", "having"],
        gapExplanation: "She é terceira pessoa singular: use has, não have.",
        production:
          "Descreva uma família real ou fictícia com have e has. Não é necessário fornecer dados pessoais.",
      },
      {
        title: "Indicar de quem é",
        rule: "Para indicar o dono, acrescente 's a um nome: Ana's bag. My/your/her/his acompanham um substantivo; mine/yours/hers/his podem substituí-lo. Em This is mine, mine já significa 'meu/minha' sem repetir o objeto.",
        example: "This is Ana's bag.",
        translation: "Esta é a bolsa da Ana.",
        vocabulary:
          "bag — bolsa\nkeys — chaves\nmine — meu/minha, sem substantivo",
        pitfall:
          "Não escreva mine bag. Use my bag ou apenas mine. Ana's aqui indica posse; não é a contração de Ana is.",
        dialogue:
          "Ben: Is this your bag?\nAna: No, mine is green. This is Lia's.\nBen: I'll give it to her.",
        dialogueTranslation:
          "Ben: Esta bolsa é sua?\nAna: Não, a minha é verde. Esta é da Lia.\nBen: Vou entregar a ela.",
        question: "De quem é a bolsa que Ben encontrou?",
        choices: ["Lia's", "Ana's", "Ben's"],
        explanation:
          "This is Lia's atribui a bolsa à Lia; mine is green descreve a bolsa de Ana.",
        gap: "These are ___ keys. (minhas chaves)",
        fills: ["my", "mine", "me"],
        gapExplanation: "Antes do substantivo keys, o possessivo correto é my.",
        production:
          "Escreva duas frases sobre o mesmo objeto: uma com nome + 's e outra com um possessivo como my ou her.",
      },
      {
        title: "Apontar perto e longe",
        rule: "This indica um item próximo; that, um item mais distante. No plural, use these e those. Combine this/that com is e these/those com are. A distância pode ser física ou a forma como você aponta algo na conversa.",
        example: "These shoes are new.",
        translation: "Estes sapatos são novos.",
        vocabulary:
          "these — estes/estas\nthose — aqueles/aquelas\nshoes — sapatos",
        pitfall:
          "These is mistura plural e singular. Shoes é plural: these shoes are.",
        dialogue:
          "Clerk: Do you want these shoes here?\nAna: No, those black shoes over there.",
        dialogueTranslation:
          "Atendente: Você quer estes sapatos aqui?\nAna: Não, aqueles sapatos pretos ali.",
        question: "Quais sapatos Ana quer?",
        choices: ["The black shoes over there", "The shoes here", "No shoes"],
        explanation:
          "Those e over there apontam para os sapatos mais distantes.",
        gap: "___ books here are mine.",
        fills: ["These", "This", "That"],
        gapExplanation:
          "Books está no plural e here indica proximidade; use these.",
        production:
          "Imagine uma loja e escreva uma frase com this e outra com those. Ajuste is/are ao número de objetos.",
      },
      {
        title: "Descrever sem mudar o adjetivo",
        rule: "Adjetivos geralmente vêm antes do substantivo: a small room. Também podem vir depois de be: The room is small. Eles não recebem plural nem flexão de gênero: two small rooms. Very intensifica uma característica.",
        example: "They have a small garden.",
        translation: "Eles têm um jardim pequeno.",
        vocabulary:
          "small — pequeno\nquiet — silencioso/tranquilo\ngarden — jardim",
        pitfall:
          "Não escreva smalls gardens. O plural fica em gardens, não no adjetivo small.",
        dialogue:
          "Lia: Is your new home big?\nBen: No, it's small, but the garden is beautiful.",
        dialogueTranslation:
          "Lia: Sua casa nova é grande?\nBen: Não, é pequena, mas o jardim é bonito.",
        question: "Como Ben descreve o jardim?",
        choices: ["Beautiful", "Very big", "Noisy"],
        explanation: "Beautiful descreve o jardim; small descreve a casa.",
        gap: "We have two ___ rooms.",
        fills: ["small", "smalls", "small's"],
        gapExplanation:
          "Adjetivos não variam em número. Rooms recebe -s; small permanece igual.",
        production:
          "Descreva dois objetos usando um adjetivo antes do nome. Reescreva uma descrição com o adjetivo depois de is.",
      },
    ],
  },
  {
    id: "a1-rotina",
    title: "Rotina e tempo",
    level: "A1",
    legacyId: "a1-2-1",
    description: "Presente simples, frequência, perguntas e horários.",
    lessons: [
      {
        title: "Hábitos com he e she",
        rule: "No presente simples afirmativo, he/she/it normalmente pedem -s no verbo: she works. Alguns verbos recebem -es: goes, watches. Verbos terminados em consoante + y trocam y por -ies: studies. O presente simples descreve hábitos, não só o que ocorre agora.",
        example: "She studies English every evening.",
        translation: "Ela estuda inglês todas as noites.",
        vocabulary:
          "study — estudar\nevery evening — todas as noites\nwatch — assistir",
        pitfall:
          "She study esquece a marca da terceira pessoa. I studies aplica essa marca ao sujeito errado.",
        dialogue:
          "Ana: What does Bruno do after work?\nLia: He studies English and watches a film.",
        dialogueTranslation:
          "Ana: O que Bruno faz depois do trabalho?\nLia: Ele estuda inglês e assiste a um filme.",
        question: "O que Bruno estuda?",
        choices: ["English", "History", "Films"],
        explanation:
          "He studies English identifica a matéria; watches a film é outra atividade.",
        gap: "My friend ___ to work by bus.",
        fills: ["goes", "go", "going"],
        gapExplanation:
          "My friend equivale a he/she. Go passa a goes na terceira pessoa singular.",
        production:
          "Escreva três hábitos de uma pessoa fictícia. Use um verbo com -s, um com -es e studies.",
      },
      {
        title: "Dizer o que você não faz",
        rule: "Para negar verbos comuns no presente simples, use don't com I/you/we/they e doesn't com he/she/it. Depois desses auxiliares, o verbo fica na forma base: she doesn't drive. Don't é a contração de do not.",
        example: "I do not drink coffee.",
        translation: "Eu não tomo café.",
        vocabulary: "drink — beber/tomar\ndrive — dirigir\ncoffee — café",
        pitfall:
          "She doesn't drinks marca a terceira pessoa duas vezes. Doesn't já faz esse trabalho: doesn't drink.",
        dialogue:
          "Ben: Does Lia drive to work?\nAna: No, she doesn't drive. She takes the bus.",
        dialogueTranslation:
          "Ben: Lia dirige para o trabalho?\nAna: Não, ela não dirige. Ela pega ônibus.",
        question: "Como Lia vai ao trabalho?",
        choices: ["By bus", "By car", "On foot"],
        explanation:
          "Takes the bus significa pega ônibus; doesn't drive exclui a opção de dirigir.",
        gap: "He doesn't ___ coffee.",
        fills: ["drink", "drinks", "drinking"],
        gapExplanation: "Depois de doesn't, use o infinitivo sem to: drink.",
        production:
          "Escreva duas coisas que você não faz e uma que outra pessoa não faz. Compare don't e doesn't.",
      },
      {
        title: "Perguntar sobre hábitos",
        rule: "Use Do + sujeito + verbo para perguntas com I/you/we/they. Com he/she/it, use Does. O verbo principal fica na forma base. Nas respostas curtas, repita o auxiliar: Yes, I do; No, she doesn't.",
        example: "Do you work on Sundays?",
        translation: "Você trabalha aos domingos?",
        vocabulary:
          "weekend — fim de semana\nSunday — domingo\nweekday — dia útil da semana",
        pitfall:
          "Does she works? está incorreto: depois de does, escreva work. Não confunda Do you work? com Are you a teacher?, que usa be.",
        dialogue:
          "Lia: Do you work on Sundays?\nBen: No, I don't. I work from Monday to Friday.",
        dialogueTranslation:
          "Lia: Você trabalha aos domingos?\nBen: Não. Trabalho de segunda a sexta.",
        question: "Ben trabalha aos domingos?",
        choices: ["No, he doesn't.", "Yes, he does.", "Only on Sundays."],
        explanation:
          "No, I don't nega o trabalho aos domingos; de segunda a sexta é sua rotina.",
        gap: "___ your sister study here?",
        fills: ["Does", "Do", "Is"],
        gapExplanation:
          "Your sister é singular; perguntas com study no presente usam does.",
        production:
          "Faça duas perguntas sobre hábitos, uma com Do you e outra com Does your friend. Escreva respostas curtas.",
      },
      {
        title: "Dizer com que frequência",
        rule: "Always, usually, sometimes e never indicam frequência. Em frases simples, costumam vir antes do verbo principal: I usually walk. Com be, normalmente vêm depois: She is always early. Never já tem sentido negativo.",
        example: "I usually walk to school.",
        translation: "Eu geralmente vou a pé para a escola.",
        vocabulary: "always — sempre\nusually — geralmente\nnever — nunca",
        pitfall:
          "I don't never walk cria uma dupla negação fora do padrão ensinado. Use I never walk ou I don't walk.",
        dialogue:
          "Ana: Do you cycle every day?\nLeo: No, I usually walk. I sometimes cycle.",
        dialogueTranslation:
          "Ana: Você pedala todos os dias?\nLeo: Não, geralmente vou a pé. Às vezes vou de bicicleta.",
        question: "Qual é o meio de transporte mais habitual de Leo?",
        choices: ["Walking", "Cycling", "Driving"],
        explanation:
          "Usually indica a rotina mais frequente; sometimes indica uma atividade ocasional.",
        gap: "She is ___ early. (sempre)",
        fills: ["always", "never", "sometimes"],
        gapExplanation:
          "Always significa sempre e, com is, vem depois do verbo.",
        production:
          "Descreva quatro hábitos usando quatro frequências diferentes. Coloque uma delas depois de be.",
      },
      {
        title: "Ler horas e agendas",
        rule: "Para informar horas, use It's + horário. Half past six é seis e meia; quarter past six é seis e quinze. At introduz a hora de um evento: at six thirty. Em uma agenda com AM/PM, PM indica o período do meio-dia até antes da meia-noite.",
        example: "The lesson starts at half past six.",
        translation: "A lição começa às seis e meia.",
        vocabulary:
          "half past — meia hora depois\nquarter past — quinze minutos depois\nnoon — meio-dia",
        pitfall:
          "6:30 PM é 18h30, não 6h30 da manhã. Para evitar confusão, diga six thirty in the evening.",
        dialogue:
          "Ben: Is the class at six?\nAna: No, at six thirty in the evening.\nBen: Thanks, I'll write it down.",
        dialogueTranslation:
          "Ben: A aula é às seis?\nAna: Não, às seis e meia da tarde/noite.\nBen: Obrigado, vou anotar.",
        question: "Qual horário aparece na agenda em formato de 24 horas?",
        choices: ["18:30", "06:00", "18:00"],
        explanation:
          "Six thirty in the evening corresponde a 18h30, e não a seis horas exatas nem ao período da manhã.",
        gap: "The meeting is ___ noon.",
        fills: ["at", "on", "in"],
        gapExplanation:
          "Use at com horários e com noon: at noon significa ao meio-dia, um ponto específico do dia.",
        production:
          "Escreva dois horários de uma agenda em números e por extenso. Inclua morning ou evening para esclarecer o período.",
      },
      {
        title: "Dias, meses e datas",
        rule: "Use on com dias da semana e datas; in com meses e anos; at com horas. Os dias e meses começam com maiúscula em inglês. Escrever o mês por extenso evita ambiguidades entre padrões de data britânico e americano.",
        example: "My birthday is in October.",
        translation: "Meu aniversário é em outubro.",
        vocabulary:
          "Monday — segunda-feira\nOctober — outubro\nbirthday — aniversário",
        pitfall:
          "Uma data como 04/05 pode ser interpretada como 4 de maio ou 5 de abril. Escreva 4 May ou May 4 quando houver dúvida.",
        dialogue:
          "Lia: Is your birthday on Monday?\nBen: Yes, on 4 May. The party is at seven.",
        dialogueTranslation:
          "Lia: Seu aniversário é na segunda?\nBen: Sim, em 4 de maio. A festa é às sete.",
        question: "A que horas será a festa?",
        choices: ["At seven", "On Monday morning", "At four"],
        explanation:
          "At seven informa a hora. On 4 May informa a data, não a hora.",
        gap: "We have a class ___ Tuesday.",
        fills: ["on", "in", "at"],
        gapExplanation:
          "Tuesday é um dia da semana; use on Tuesday. In é usado com meses e at com horários.",
        production:
          "Escreva um convite curto com mês, dia da semana e hora. Revise in, on e at.",
      },
    ],
  },
  {
    id: "a1-casa",
    title: "Casa e cidade",
    level: "A1",
    description: "Existência, localização, lugares e instruções.",
    lessons: [
      {
        title: "Dizer o que há em um lugar",
        rule: "There is apresenta um item singular; there are apresenta itens plurais. A estrutura expressa existência, como 'há' ou 'tem' no português informal. Nas perguntas, inverta be: Is there a bank? Are there shops?",
        example: "There is a library near my home.",
        translation: "Há uma biblioteca perto da minha casa.",
        vocabulary: "library — biblioteca\nnear — perto de\nshop — loja",
        pitfall:
          "Library não significa livraria; livraria é bookshop/bookstore. Para existência, não use have a library sem sujeito.",
        dialogue:
          "Ana: Is there a library here?\nBen: Yes, next to the school. There are two shops too.",
        dialogueTranslation:
          "Ana: Há uma biblioteca aqui?\nBen: Sim, ao lado da escola. Também há duas lojas.",
        question: "Quantas lojas há no local?",
        choices: ["Two", "One", "Three"],
        explanation: "There are two shops informa explicitamente duas lojas.",
        gap: "There ___ three chairs in the room.",
        fills: ["are", "is", "am"],
        gapExplanation:
          "Three chairs é plural, por isso a estrutura é there are.",
        production:
          "Descreva seu bairro, real ou fictício, com uma frase usando there is e outra usando there are.",
      },
      {
        title: "Localizar objetos",
        rule: "In indica dentro; on indica sobre uma superfície; under indica embaixo. A estrutura The keys are on the table localiza um objeto conhecido. Compare com There are keys on the table, que apresenta a existência de chaves.",
        example: "The keys are under the chair.",
        translation: "As chaves estão embaixo da cadeira.",
        vocabulary: "under — embaixo de\nchair — cadeira\nshelf — prateleira",
        pitfall:
          "Em inglês, diga on the table para algo apoiado na mesa, não in the table. In sugeriria dentro dela.",
        dialogue:
          "Lia: Are my keys on the shelf?\nAna: No, they're under the chair, next to your bag.",
        dialogueTranslation:
          "Lia: Minhas chaves estão na prateleira?\nAna: Não, estão embaixo da cadeira, ao lado da sua bolsa.",
        question: "Onde estão as chaves?",
        choices: ["Under the chair", "On the shelf", "Inside the bag"],
        explanation:
          "Under the chair é a localização indicada; next to your bag não significa dentro da bolsa.",
        gap: "The picture is ___ the wall.",
        fills: ["on", "in", "under"],
        gapExplanation:
          "Um quadro pendurado na superfície da parede fica on the wall.",
        production:
          "Imagine três objetos numa sala. Escreva onde estão usando in, on e under.",
      },
      {
        title: "Descrever cômodos",
        rule: "Use there is/are para listar móveis e be + adjetivo para descrever cômodos. Bedroom é quarto; bathroom é banheiro. Em uma descrição, primeiro apresente o lugar e depois use the para retomar algo já mencionado.",
        example: "The kitchen is small but bright.",
        translation: "A cozinha é pequena, mas iluminada.",
        vocabulary: "kitchen — cozinha\nbedroom — quarto\nbright — iluminado",
        pitfall:
          "Room pode significar cômodo, não apenas quarto de dormir. Para deixar claro que é quarto, use bedroom.",
        dialogue:
          "Ben: Is there a desk in your bedroom?\nLia: No, the desk is in the living room.",
        dialogueTranslation:
          "Ben: Há uma escrivaninha no seu quarto?\nLia: Não, a escrivaninha fica na sala de estar.",
        question: "Em qual cômodo fica a escrivaninha?",
        choices: ["The living room", "The bedroom", "The kitchen"],
        explanation: "Lia corrige a suposição: the desk is in the living room.",
        gap: "We cook in the ___.",
        fills: ["kitchen", "bedroom", "bathroom"],
        gapExplanation:
          "Kitchen é o cômodo onde normalmente se cozinha; bedroom e bathroom têm outras funções.",
        production:
          "Descreva um apartamento em três frases: número de cômodos, um móvel e uma característica da cozinha.",
      },
      {
        title: "Pedir e dar direções",
        rule: "Where is…? pergunta a localização. Para orientar, use o imperativo sem sujeito: Go straight, turn left, turn right. Next to significa ao lado; opposite significa em frente, do outro lado. Acrescente please a um pedido para torná-lo mais cortês.",
        example: "Turn left at the bank.",
        translation: "Vire à esquerda no banco.",
        vocabulary: "left — esquerda\nright — direita\nstraight — em frente",
        pitfall:
          "Go straight não significa virar. Para um ponto de referência, at the bank indica onde executar a virada.",
        dialogue:
          "Ana: Where is the station?\nBen: Go straight and turn right at the bank. It's opposite the park.",
        dialogueTranslation:
          "Ana: Onde fica a estação?\nBen: Siga em frente e vire à direita no banco. Fica em frente ao parque.",
        question: "Para qual lado Ana deve virar no banco?",
        choices: ["Right", "Left", "Back"],
        explanation:
          "Turn right é a instrução explícita; opposite the park localiza a estação depois da virada.",
        gap: "___ straight for two blocks.",
        fills: ["Go", "Goes", "Going"],
        gapExplanation:
          "O imperativo usa a forma base Go e não exige you antes dela.",
        production:
          "Crie um percurso de duas instruções até uma loja fictícia. Use um ponto de referência e uma direção.",
      },
      {
        title: "Usar transporte público",
        rule: "By + transporte indica o meio: by bus, by train. Para ir a pé, a expressão é on foot. Take pode indicar pegar um transporte: take the bus. Em bilhetes, single é só ida; return costuma indicar ida e volta no inglês britânico.",
        example: "I go to college by train.",
        translation: "Eu vou à faculdade de trem.",
        vocabulary:
          "ticket — passagem/bilhete\nstation — estação\nreturn ticket — passagem de ida e volta",
        pitfall:
          "Não traduza a pé como by foot na expressão padrão ensinada: use on foot. By bus não leva artigo entre by e bus.",
        dialogue:
          "Clerk: A single or a return ticket?\nLia: A return to Oxford, please.\nClerk: The next train is at ten.",
        dialogueTranslation:
          "Atendente: Só ida ou ida e volta?\nLia: Ida e volta para Oxford, por favor.\nAtendente: O próximo trem é às dez.",
        question: "Que tipo de passagem Lia compra?",
        choices: ["A return ticket", "A single ticket", "A bus pass"],
        explanation:
          "A return inclui a volta. O diálogo informa que o próximo transporte é um trem.",
        gap: "I walk to school. I go on ___.",
        fills: ["foot", "feet", "bus"],
        gapExplanation: "On foot é uma expressão fixa, com foot no singular.",
        production:
          "Diga como você vai a dois lugares. Use by com um transporte e on foot para o outro.",
      },
      {
        title: "Ler avisos de um lugar",
        rule: "O imperativo também aparece em avisos: Keep the door closed. A forma negativa usa Don't + verbo: Don't enter. No + substantivo ou -ing é comum em placas: No parking. Observe quem deve agir e qual ação é permitida ou proibida.",
        example: "Please keep the door closed.",
        translation: "Por favor, mantenha a porta fechada.",
        vocabulary: "closed — fechado\nentrance — entrada\nexit — saída",
        pitfall:
          "No parking proíbe estacionar; não diz que o estacionamento está cheio. Não confunda exit, saída, com exist, existir.",
        dialogue:
          "Notice: Please use the side entrance. The main door is closed today.\nAna: We need to go around the building.",
        dialogueTranslation:
          "Aviso: Use a entrada lateral. A porta principal está fechada hoje.\nAna: Precisamos contornar o prédio.",
        question: "Qual entrada deve ser usada hoje?",
        choices: ["The side entrance", "The main door", "The garage exit"],
        explanation:
          "Please use the side entrance é a instrução; main door is closed explica o motivo.",
        gap: "Don't ___ here.",
        fills: ["park", "parks", "parking"],
        gapExplanation:
          "Depois de Don't, use a forma base park. No parking é outra construção de aviso.",
        production:
          "Escreva dois avisos para uma biblioteca: um pedido positivo e uma proibição. Use Please e Don't.",
      },
    ],
  },
  {
    id: "a1-consumo",
    title: "Comida, compras e preferências",
    level: "A1",
    description: "Pedidos, quantidades, preços e necessidades.",
    lessons: [
      {
        title: "Pedir comida com educação",
        rule: "I'd like significa 'eu gostaria' e serve para pedidos. Pode vir antes de um substantivo: I'd like a sandwich. Please suaviza o pedido. Can I have…? também é comum ao pedir algo em um café ou restaurante.",
        example: "I would like a sandwich, please.",
        translation: "Eu gostaria de um sanduíche, por favor.",
        vocabulary: "sandwich — sanduíche\nmenu — cardápio\nplease — por favor",
        pitfall:
          "I like a sandwich descreve gosto, não um pedido específico. Para pedir, use I'd like ou Can I have.",
        dialogue:
          "Server: What would you like?\nAna: A cheese sandwich and water, please.\nServer: Still or sparkling?\nAna: Still, please.",
        dialogueTranslation:
          "Atendente: O que você gostaria?\nAna: Um sanduíche de queijo e água, por favor.\nAtendente: Sem gás ou com gás?\nAna: Sem gás, por favor.",
        question: "Qual água Ana escolheu?",
        choices: ["Still water", "Sparkling water", "No water"],
        explanation:
          "Still water é água sem gás. Sparkling é a opção com gás que ela não escolheu.",
        gap: "I'd ___ a coffee, please.",
        fills: ["like", "likes", "liking"],
        gapExplanation:
          "I'd contrai I would; depois de would, use a forma base like.",
        production:
          "Escreva um pedido com uma bebida e um alimento. Inclua uma expressão cortês e não use apenas I want.",
      },
      {
        title: "Gostar e não gostar",
        rule: "Like e love podem ser seguidos por um substantivo ou por um verbo com -ing: I like music; I like cooking. Para negar uma preferência, use don't/doesn't like. Preferências gerais normalmente usam plural sem the: I like apples.",
        example: "I like cooking with my friends.",
        translation: "Eu gosto de cozinhar com meus amigos.",
        vocabulary:
          "cook — cozinhar\nenjoy — gostar de/aproveitar\nvegetables — legumes e verduras",
        pitfall:
          "I like of music copia a preposição do português. Like não exige of antes do objeto.",
        dialogue:
          "Ben: Do you like cooking?\nLia: Yes, but I don't like washing dishes.\nBen: I can help with that.",
        dialogueTranslation:
          "Ben: Você gosta de cozinhar?\nLia: Sim, mas não gosto de lavar louça.\nBen: Posso ajudar com isso.",
        question: "Qual atividade Lia não gosta de fazer?",
        choices: ["Washing dishes", "Cooking", "Eating"],
        explanation:
          "Don't like se aplica a washing dishes. A resposta Yes confirma que ela gosta de cozinhar.",
        gap: "She likes ___ books.",
        fills: ["reading", "read", "reads"],
        gapExplanation:
          "Reading é a forma -ing que pode ser usada depois de likes.",
        production:
          "Escreva uma preferência com substantivo e outra com verbo em -ing. Acrescente algo de que você não gosta.",
      },
      {
        title: "Contáveis e não contáveis",
        rule: "Contáveis podem ser numerados: one apple, two apples. Não contáveis, como water e rice, normalmente não recebem a/an nem plural nesse sentido. Para contar porções, use uma unidade: a glass of water, two bags of rice.",
        example: "We need two bottles of water.",
        translation: "Precisamos de duas garrafas de água.",
        vocabulary:
          "bottle — garrafa\nrice — arroz\nbread — pão, como alimento",
        pitfall:
          "Two waters pode aparecer como pedido abreviado de duas porções, mas a estrutura explícita para começar é two bottles of water. Bread não vira breads para contar fatias.",
        dialogue:
          "Ana: Do we need bread?\nBen: Yes, and three bottles of water. We already have rice.",
        dialogueTranslation:
          "Ana: Precisamos de pão?\nBen: Sim, e três garrafas de água. Já temos arroz.",
        question: "Qual item já está disponível?",
        choices: ["Rice", "Bread", "Three bottles of water"],
        explanation:
          "We already have rice indica que não é necessário comprá-lo agora.",
        gap: "I'd like a ___ of bread.",
        fills: ["slice", "many", "breads"],
        gapExplanation:
          "A slice of bread conta uma fatia. Slice funciona como unidade contável.",
        production:
          "Faça uma lista com dois alimentos contáveis e duas porções de alimentos não contáveis.",
      },
      {
        title: "Some e any na despensa",
        rule: "Some costuma aparecer em afirmações com plural ou não contáveis: some eggs, some milk. Any é frequente em perguntas e negativas: Do we have any milk? We don't have any eggs. Em ofertas, some também é comum: Would you like some tea?",
        example: "There is some milk in the fridge.",
        translation: "Há um pouco de leite na geladeira.",
        vocabulary: "fridge — geladeira\neggs — ovos\ntea — chá",
        pitfall:
          "Some não serve apenas para plural: some milk é correto porque milk é não contável. Em ofertas, a pergunta pode usar some.",
        dialogue:
          "Ben: Do we have any eggs?\nAna: No, but we have some milk.\nBen: Let's buy eggs.",
        dialogueTranslation:
          "Ben: Temos ovos?\nAna: Não, mas temos leite.\nBen: Vamos comprar ovos.",
        question: "O que eles precisam comprar?",
        choices: ["Eggs", "Milk", "A fridge"],
        explanation:
          "No responde à pergunta sobre ovos. O leite já está disponível.",
        gap: "We don't have ___ sugar.",
        fills: ["any", "a", "an"],
        gapExplanation:
          "Any combina com a negativa e com sugar não contável. A/an não acompanham sugar nesse sentido.",
        production:
          "Descreva uma geladeira fictícia: duas coisas que há com some e uma que não há com any.",
      },
      {
        title: "Perguntar preços e quantidades",
        rule: "How much pergunta o preço ou a quantidade de algo não contável. How many pergunta quantos itens contáveis há. Compare How much is this shirt? e How many shirts do you need? A escolha muda a informação solicitada.",
        example: "How much is this blue shirt?",
        translation: "Quanto custa esta camisa azul?",
        vocabulary: "price — preço\nshirt — camisa\npound — libra esterlina",
        pitfall:
          "How many money está incorreto: money é não contável. Para preço, use How much.",
        dialogue:
          "Ana: How much is this shirt?\nClerk: Fifteen pounds.\nAna: I'll take two.",
        dialogueTranslation:
          "Ana: Quanto custa esta camisa?\nAtendente: Quinze libras.\nAna: Vou levar duas.",
        question: "Qual é o preço de uma camisa?",
        choices: ["Fifteen pounds", "Two pounds", "Thirty pounds"],
        explanation:
          "Fifteen pounds é o preço informado por unidade; thirty seria o total de duas.",
        gap: "How ___ apples do you need?",
        fills: ["many", "much", "any"],
        gapExplanation:
          "Apples é contável plural, então a pergunta de quantidade usa many.",
        production:
          "Escreva uma pergunta de preço, uma de quantidade contável e uma de quantidade não contável.",
      },
      {
        title: "Comprar o tamanho certo",
        rule: "Em uma loja, Can I try this on? pede para experimentar uma peça. Too + adjetivo indica excesso: too small é pequeno demais. Para solicitar outra opção, use Do you have this in a larger size? Large, medium e small aparecem em etiquetas.",
        example: "This jacket is too small.",
        translation: "Esta jaqueta é pequena demais.",
        vocabulary:
          "size — tamanho\ntry on — experimentar roupa\njacket — jaqueta",
        pitfall:
          "Large é grande; long é comprido. Uma peça pode ser large sem ser long. Too small indica um problema de tamanho, não apenas tamanho pequeno.",
        dialogue:
          "Clerk: Does the jacket fit?\nAna: No, it's too small. Do you have a medium?\nClerk: Yes, here you are.",
        dialogueTranslation:
          "Atendente: A jaqueta serve?\nAna: Não, está pequena demais. Tem uma média?\nAtendente: Sim, aqui está.",
        question: "Qual tamanho Ana pede agora?",
        choices: ["Medium", "Small", "Extra small"],
        explanation:
          "Ana pede a medium depois de dizer que a peça atual está pequena demais.",
        gap: "Can I try this jacket ___?",
        fills: ["on", "at", "of"],
        gapExplanation: "Try on é a expressão usada para experimentar roupa.",
        production:
          "Monte uma conversa de três falas: pedir para experimentar, dizer um problema e solicitar outro tamanho.",
      },
    ],
  },
  {
    id: "a1-interacao",
    title: "Ações e interações do dia a dia",
    level: "A1",
    description: "Habilidades, pedidos, ações em andamento e mensagens curtas.",
    lessons: [
      {
        title: "Falar de habilidades com can",
        rule: "Can + verbo na forma base expressa habilidade: I can swim. Can não recebe -s com he/she. Para negar, use can't ou cannot; para perguntar, coloque can antes do sujeito. Não use to depois de can.",
        example: "My brother can play the guitar.",
        translation: "Meu irmão sabe tocar violão.",
        vocabulary:
          "swim — nadar\nplay the guitar — tocar violão/guitarra\nspeak — falar",
        pitfall:
          "He can to swim e he cans swim estão incorretos. O padrão é can swim para todos os sujeitos.",
        dialogue:
          "Lia: Can you swim?\nBen: Yes, but I can't dive. I want to learn.\nLia: There's a class here.",
        dialogueTranslation:
          "Lia: Você sabe nadar?\nBen: Sim, mas não sei mergulhar. Quero aprender.\nLia: Há uma aula aqui.",
        question: "O que Ben sabe fazer?",
        choices: ["Swim", "Dive", "Both swim and dive"],
        explanation:
          "Can swim é afirmativo; can't dive nega a outra habilidade.",
        gap: "She can ___ English.",
        fills: ["speak", "speaks", "to speak"],
        gapExplanation:
          "Can pede o verbo sem to e sem -s: speak. A forma não muda quando o sujeito é she.",
        production:
          "Escreva duas habilidades e uma limitação com can/can't. Faça uma pergunta sobre a habilidade de outra pessoa.",
      },
      {
        title: "Pedir permissão",
        rule: "Can I…? pede permissão para uma ação sua. Can you…? pede que outra pessoa faça algo. Sure e Of course podem conceder permissão. Sorry, you can't pode negá-la; acrescentar uma razão torna a resposta mais clara.",
        example: "Can I open the window?",
        translation: "Posso abrir a janela?",
        vocabulary: "open — abrir\nwindow — janela\nsure — claro",
        pitfall:
          "Can I help you? oferece sua ajuda; Can you help me? pede ajuda. A mudança de sujeito muda quem age.",
        dialogue:
          "Ana: Can I sit here?\nBen: Sorry, this seat is taken. That seat is free.",
        dialogueTranslation:
          "Ana: Posso sentar aqui?\nBen: Desculpe, este lugar está ocupado. Aquele está livre.",
        question: "Onde Ana pode sentar segundo Ben?",
        choices: [
          "In the other seat",
          "In this occupied seat",
          "Nowhere in the room",
        ],
        explanation:
          "That seat is free oferece a alternativa; a negativa vale apenas para this seat.",
        gap: "Can ___ use your pen? (eu)",
        fills: ["I", "me", "my"],
        gapExplanation:
          "I é o sujeito que vai usar a caneta. Me é objeto; my é possessivo.",
        production:
          "Escreva um pedido de permissão com Can I e um pedido de ajuda com Can you. Confira quem executará cada ação.",
      },
      {
        title: "Descrever o que acontece agora",
        rule: "O presente contínuo combina be + verbo em -ing: I am reading. Use am/is/are conforme o sujeito. Essa estrutura pode descrever uma ação em andamento. Compare a rotina I read every day com a ação atual I am reading now.",
        example: "They are waiting for the bus.",
        translation: "Eles estão esperando o ônibus.",
        vocabulary: "wait — esperar\nnow — agora\nread — ler",
        pitfall:
          "They waiting omite are. They are wait omite -ing. As duas partes são necessárias no presente contínuo.",
        dialogue:
          "Ana: Where is Leo?\nBen: He's waiting outside. He's talking to Lia.\nAna: I'll wait here.",
        dialogueTranslation:
          "Ana: Onde está Leo?\nBen: Está esperando lá fora. Está conversando com Lia.\nAna: Vou esperar aqui.",
        question: "Com quem Leo está conversando?",
        choices: ["Lia", "Ana", "Ben"],
        explanation:
          "He's talking to Lia informa a pessoa com quem Leo está falando agora.",
        gap: "I ___ reading now.",
        fills: ["am", "is", "are"],
        gapExplanation: "I combina com am. Reading fornece a forma -ing.",
        production:
          "Descreva três ações em uma foto imaginária usando is/are + -ing. Inclua um sujeito plural.",
      },
      {
        title: "Perguntar sobre ações atuais",
        rule: "Em perguntas no presente contínuo, be vem antes do sujeito: Are you working? Para negar, use not depois de be. Perguntas com What mantêm essa inversão: What is she doing? Não acrescente do/does à construção.",
        example: "Are you listening to the teacher?",
        translation: "Você está ouvindo o professor?",
        vocabulary:
          "listen to — ouvir com atenção\nwork — trabalhar\nmessage — mensagem",
        pitfall:
          "Do you are listening? mistura dois modelos. Para presente contínuo, use Are you listening? Observe também o to em listen to.",
        dialogue:
          "Ben: Are you studying?\nAna: No, I'm not. I'm writing a message.\nBen: I'll come back later.",
        dialogueTranslation:
          "Ben: Você está estudando?\nAna: Não. Estou escrevendo uma mensagem.\nBen: Volto mais tarde.",
        question: "O que Ana está fazendo?",
        choices: ["Writing a message", "Studying", "Reading a book"],
        explanation:
          "I'm writing a message é a ação afirmada. A pergunta sobre estudar recebe resposta negativa.",
        gap: "What ___ they doing?",
        fills: ["are", "do", "is"],
        gapExplanation:
          "Doing combina com are para they. Do não substitui be no contínuo.",
        production:
          "Escreva uma pergunta com What are you doing? e uma resposta negativa seguida da atividade real.",
      },
      {
        title: "Clima e roupas",
        rule: "Para o clima, use it como sujeito: It's cold, it's sunny. Mesmo sem um 'ele' em português, o inglês pede esse sujeito. It's raining descreve chuva em andamento. Wear é usar roupa; carry é carregar um objeto.",
        example: "It is cold and windy today.",
        translation: "Hoje está frio e ventando.",
        vocabulary: "windy — com vento\ncoat — casaco\numbrella — guarda-chuva",
        pitfall:
          "Não diga Is cold sem sujeito. Use It's cold. Wear an umbrella não é natural: você carrega ou usa como proteção um guarda-chuva, carry an umbrella é a opção aqui.",
        dialogue:
          "Ana: Is it sunny outside?\nBen: No, it's raining. Take an umbrella.\nAna: Thanks for telling me.",
        dialogueTranslation:
          "Ana: Está ensolarado lá fora?\nBen: Não, está chovendo. Leve um guarda-chuva.\nAna: Obrigada por avisar.",
        question: "Por que Ben recomenda o guarda-chuva?",
        choices: ["It is raining.", "It is sunny.", "It is snowing."],
        explanation:
          "It's raining informa a condição que justifica a recomendação.",
        gap: "___ is very hot today.",
        fills: ["It", "There", "He"],
        gapExplanation:
          "It funciona como sujeito impessoal ao descrever o clima.",
        production:
          "Escreva uma previsão de duas frases para uma cidade fictícia e indique uma roupa adequada.",
      },
      {
        title: "Entender uma mensagem curta",
        rule: "Em mensagens práticas, procure quem escreve, onde acontecerá algo e a que horas. Sorry pode introduzir uma mudança de plano. See you… encerra uma mensagem combinando o próximo contato. Uma informação explícita vale mais que uma suposição.",
        example: "See you at the library at four.",
        translation: "Vejo você na biblioteca às quatro.",
        vocabulary:
          "see you — até mais/vejo você\noutside — do lado de fora\nmessage — mensagem",
        pitfall:
          "At four informa a hora; at the library informa o lugar. A mesma preposição pode cumprir funções diferentes.",
        dialogue:
          "Message from Lia: Hi Ana! The café is closed. Let's meet outside the library at four, not at three. See you!",
        dialogueTranslation:
          "Mensagem da Lia: Oi, Ana! O café está fechado. Vamos nos encontrar do lado de fora da biblioteca às quatro, não às três. Até!",
        question: "Onde e quando elas devem se encontrar?",
        choices: [
          "Outside the library at four",
          "Inside the café at three",
          "Outside the library at three",
        ],
        explanation:
          "A mensagem corrige tanto o local quanto o horário: outside the library e at four.",
        gap: "See you ___ four.",
        fills: ["at", "on", "in"],
        gapExplanation:
          "Horários exatos usam at: at four. On acompanha dias; in costuma acompanhar meses ou partes do dia.",
        production:
          "Escreva uma mensagem curta mudando um encontro. Informe o novo local e horário, e diga qual plano foi substituído.",
      },
    ],
  },
];
