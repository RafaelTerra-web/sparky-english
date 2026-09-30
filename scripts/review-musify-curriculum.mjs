import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
// Original teaching material. Song transcriptions and translations live only in
// the ignored .music-assets store; this file contains no lyric corpus.
const vocab = (id, word, meaning, ipa, usage, example) => ({ id, word, meaning, ipa, usage, example });
const question = (id, prompt, options, answer, explanation) => ({ id, prompt, options, answer, explanation });

export const musifyCurriculum = {
  'still-into-you': {
    topic: 'Relacionamentos, sentimentos e expressões figuradas',
    vocabulary: [
      vocab('into', 'be into someone', 'Estar a fim de alguém; sentir atração.', '/bi ˈɪntu ˈsʌmwʌn/', 'Expressão informal. Be into também pode indicar interesse por um hobby.', 'I am really into photography these days.'),
      vocab('butterflies', 'butterflies', 'Frio na barriga; nervosismo ou empolgação.', '/ˈbʌtərflaɪz/', 'Em sentimentos, butterflies é uma metáfora; não se refere a insetos reais.', 'I had butterflies before my first presentation.'),
      vocab('worth', 'worth it', 'Valer a pena.', '/ˈwɜrθ ɪt/', 'Use be worth it para dizer que o resultado compensa o esforço.', 'The long trip was worth it.'),
      vocab('interlock', 'interlock', 'Entrelaçar ou encaixar uma coisa na outra.', '/ˌɪntərˈlɑk/', 'Pode descrever dedos, peças e mecanismos que se conectam.', 'The two puzzle pieces interlock perfectly.'),
      vocab('sense', 'make sense', 'Fazer sentido; ser compreensível.', '/meɪk sens/', 'Expressão frequente para avaliar uma explicação ou decisão.', 'Your explanation makes sense now.'),
      vocab('by', 'go by', 'Passar, quando o assunto é o tempo.', '/ɡoʊ baɪ/', 'Days go by descreve a passagem dos dias, não movimento físico.', 'The afternoon went by quickly.'),
    ],
    questions: [
      question('q-into', 'Quando be into someone descreve um relacionamento, o que a expressão indica?', ['Sentir atração pela pessoa.', 'Entrar na casa da pessoa.', 'Esquecer a pessoa.'], 0, 'Be into someone expressa interesse ou atração em linguagem informal.'),
      question('q-butterflies', 'Em um contexto emocional, butterflies corresponde melhor a qual ideia?', ['Dor nas pernas.', 'Frio na barriga.', 'Cansaço de viajar.'], 1, 'É uma metáfora para o nervosismo ou a empolgação sentidos no estômago.'),
      question('q-worth', 'Qual frase usa worth it corretamente?', ['The effort was worth it.', 'The effort worth to it.', 'The effort was worthing it.'], 0, 'Be worth it é a estrutura usada para dizer que algo vale a pena.'),
      question('q-sense', 'O que Your explanation makes sense comunica?', ['A explicação está muito alta.', 'A explicação é compreensível.', 'A explicação chegou atrasada.'], 1, 'Make sense indica coerência ou compreensão, sem relação com o volume da voz.'),
    ],
  },
  'do-i-wanna-know': {
    topic: 'Dúvidas, perguntas e interesse por alguém',
    vocabulary: [
      vocab('deep', 'in deep', 'Muito envolvido em uma situação.', '/ɪn dip/', 'Pode ser figurado: estar emocionalmente envolvido ou em dificuldades.', 'By then, she was in deep with the project.'),
      vocab('repeat', 'on repeat', 'Repetidamente; em reprodução contínua.', '/ɑn rɪˈpit/', 'É comum ao falar de uma música reproduzida várias vezes.', 'I played that podcast episode on repeat.'),
      vocab('asleep', 'fall asleep', 'Adormecer.', '/fɔl əˈslip/', 'Fall asleep descreve o início do sono; be asleep descreve o estado.', 'I fell asleep on the bus.'),
      vocab('crawling', 'crawl', 'Engatinhar ou rastejar; figuradamente, voltar com humildade.', '/krɔl/', 'O sentido figurado depende do contexto; não é necessariamente um movimento físico.', 'The baby learned to crawl last month.'),
      vocab('cusp', 'on the cusp of', 'À beira de; prestes a passar por uma mudança.', '/ɑn ðə kʌsp əv/', 'Use of antes de um substantivo ou de um verbo em -ing.', 'The team is on the cusp of a major discovery.'),
      vocab('interrupt', 'interrupt', 'Interromper.', '/ˌɪntəˈrʌpt/', 'Sorry to interrupt é uma maneira cortês de entrar em uma conversa.', 'Please do not interrupt while she is speaking.'),
      vocab('simmer', 'simmer down', 'Acalmar-se.', '/ˈsɪmər daʊn/', 'Phrasal verb informal. O verbo simmer sozinho também pode indicar cozinhar em fogo baixo.', 'Everyone needed a minute to simmer down.'),
    ],
    questions: [
      question('q-question', 'Qual é a forma escrita padrão correspondente a wanna?', ['Want to.', 'Went to.', 'Won the.'], 0, 'Wanna é uma representação informal da pronúncia reduzida de want to.'),
      question('q-repeat', 'Se alguém toca uma faixa on repeat, o que está fazendo?', ['Tocando a faixa várias vezes.', 'Diminuindo a velocidade.', 'Trocando de instrumento.'], 0, 'On repeat indica reprodução repetida.'),
      question('q-sleep', 'Qual frase descreve o momento de adormecer?', ['I am asleep.', 'I fell asleep.', 'I have an asleep.'], 1, 'Fall asleep indica a mudança para o estado de sono; o passado é fell asleep.'),
      question('q-cusp', 'O que on the cusp of a change sugere?', ['Uma mudança prestes a acontecer.', 'Uma mudança já esquecida.', 'Uma mudança impossível.'], 0, 'On the cusp of descreve proximidade de uma transição.'),
    ],
  },
  'she-knows': {
    topic: 'Conflitos, consciência e inglês informal',
    vocabulary: [
      vocab('deep-down', 'deep down', 'No fundo; em seu íntimo.', '/dip daʊn/', 'Aponta para um sentimento ou conhecimento interior, mesmo quando não é admitido.', 'Deep down, I knew I needed more practice.'),
      vocab('pass-up', 'pass up', 'Deixar passar uma oportunidade; recusar.', '/pæs ʌp/', 'Phrasal verb separável: pass up an offer ou pass an offer up.', 'I could not pass up the chance to travel.'),
      vocab('suppose', 'suppose', 'Supor; imaginar que algo seja verdade.', '/səˈpoʊz/', 'I suppose pode suavizar uma opinião ou indicar uma conclusão incerta.', 'I suppose the meeting will finish soon.'),
      vocab('forever', 'forever', 'Para sempre.', '/fərˈevər/', 'Pode ser literal ou um exagero emocional, dependendo do contexto.', 'The museum will preserve these records forever.'),
      vocab('guide', 'guide', 'Guiar; orientar.', '/ɡaɪd/', 'Como verbo, indica mostrar um caminho ou ajudar em uma decisão.', 'A local expert will guide us through the city.'),
      vocab('protect', 'protect', 'Proteger.', '/prəˈtekt/', 'Use protect someone from something para mencionar um risco.', 'This case protects the phone from scratches.'),
    ],
    questions: [
      question('q-knows', 'Por que o verbo know recebe -s depois de she no presente simples?', ['Porque she é terceira pessoa do singular.', 'Porque a frase está no passado.', 'Porque know é sempre plural.'], 0, 'No presente simples afirmativo, he, she e it normalmente pedem -s no verbo.'),
      question('q-deep', 'Qual tradução combina com deep down em um contexto de sentimentos?', ['Lá no porão.', 'No fundo, em seu íntimo.', 'Debaixo da mesa.'], 1, 'Deep down é uma expressão figurada para sentimentos ou convicções interiores.'),
      question('q-pass', 'O que pass up an opportunity significa?', ['Agarrar toda oportunidade.', 'Deixar a oportunidade passar.', 'Repetir a oportunidade.'], 1, 'Pass up é recusar ou não aproveitar algo.'),
      question('q-cannot', 'Qual é a forma sem contração de can’t?', ['Can nots.', 'Cannot.', 'Could not.'], 1, 'Cannot é a forma completa de can’t; could not corresponde a couldn’t.'),
    ],
  },
  'made-for-loving-you': {
    topic: 'Desejo, promessas e expressões de intensidade',
    vocabulary: [
      vocab('darkness', 'darkness', 'Escuridão.', '/ˈdɑrknəs/', 'O sufixo -ness transforma dark em um substantivo de estado.', 'We could see the stars clearly in the darkness.'),
      vocab('enough', 'get enough of', 'Ter o bastante de; em uma negativa, nunca se cansar de algo.', '/ɡet ɪˈnʌf əv/', 'Can’t get enough of algo indica grande entusiasmo ou desejo por mais.', 'I cannot get enough of this new book.'),
      vocab('true', 'come true', 'Tornar-se realidade.', '/kʌm tru/', 'É frequente com dream, wish e hope.', 'Her dream of opening a bakery came true.'),
      vocab('made', 'be made for', 'Ser feito para; combinar especialmente com algo ou alguém.', '/bi meɪd fər/', 'Pode indicar finalidade literal ou compatibilidade figurada.', 'These boots were made for long walks.'),
      vocab('give', 'give', 'Dar; oferecer.', '/ɡɪv/', 'É um verbo irregular: give, gave, given.', 'I gave my friend a useful travel guide.'),
      vocab('wild', 'drive someone wild', 'Deixar alguém muito empolgado ou fora de si.', '/draɪv ˈsʌmwʌn waɪld/', 'Expressão figurada; o contexto distingue entusiasmo de irritação.', 'The final goal drove the crowd wild.'),
    ],
    questions: [
      question('q-made', 'Em be made for, o que a expressão pode indicar além de fabricação literal?', ['Uma boa combinação ou finalidade.', 'Uma compra obrigatória.', 'Uma pergunta sobre o passado.'], 0, 'A expressão também descreve algo ou alguém especialmente adequado a uma situação.'),
      question('q-enough', 'O que can’t get enough of something normalmente comunica?', ['Grande entusiasmo e vontade de ter mais.', 'Vontade de abandonar a atividade.', 'Falta de dinheiro necessariamente.'], 0, 'A expressão negativa enfatiza que a pessoa gosta muito de algo.'),
      question('q-true', 'Qual frase significa que um sonho se tornou realidade?', ['My dream came true.', 'My dream did truth.', 'My dream came truly.'], 0, 'Come true é a expressão; seu passado é came true.'),
      question('q-gonna', 'Qual expressão padrão corresponde a gonna?', ['Going to.', 'Gone of.', 'Good enough.'], 0, 'Gonna representa uma pronúncia informal de going to.'),
    ],
  },
  'savage': {
    topic: 'Adjetivos, atitude e registro informal',
    vocabulary: [
      vocab('exclusive', 'exclusive', 'Exclusivo; restrito a um grupo.', '/ɪkˈsklusɪv/', 'Pode descrever acesso limitado ou uma imagem de distinção.', 'The gallery held an exclusive preview for members.'),
      vocab('classy', 'classy', 'Elegante; de bom gosto.', '/ˈklæsi/', 'Adjetivo informal para estilo ou comportamento considerado sofisticado.', 'She chose a simple, classy jacket.'),
      vocab('moody', 'moody', 'De humor instável; sujeito a mudanças de humor.', '/ˈmudi/', 'Não significa apenas triste: descreve oscilações de humor.', 'I tend to get moody when I do not sleep enough.'),
      vocab('ignore', 'ignore', 'Ignorar; não dar atenção.', '/ɪɡˈnɔr/', 'Ignore é uma ação, diferente de não perceber algo por acidente.', 'Please do not ignore the instructions.'),
      vocab('private', 'private', 'Privado; reservado.', '/ˈpraɪvət/', 'A sílaba final é reduzida; evite pronunciar como o português privado.', 'I prefer to keep my personal life private.'),
      vocab('record', 'record', 'Gravar.', '/rɪˈkɔrd/', 'Como verbo, a sílaba forte é a segunda; o substantivo record tem outra tonicidade.', 'We will record the interview tomorrow.'),
    ],
    questions: [
      question('q-adjectives', 'Classy e moody pertencem principalmente a qual categoria gramatical?', ['Adjetivos.', 'Artigos.', 'Pronomes pessoais.'], 0, 'São palavras que descrevem características ou estados.'),
      question('q-moody', 'Uma pessoa moody tende a apresentar qual característica?', ['Mudanças de humor.', 'Uma habilidade musical específica.', 'Pontualidade perfeita.'], 0, 'Moody descreve alguém cujo humor varia com facilidade.'),
      question('q-register', 'Que cuidado ajuda a aprender com rap e linguagem informal?', ['Tratar toda expressão como apropriada em qualquer conversa.', 'Distinguir gírias e insultos do vocabulário neutro.', 'Trocar todos os verbos pelo passado.'], 1, 'Reconhecer o registro ajuda a compreender a música e escolher expressões adequadas em outras situações.'),
      question('q-ignore', 'Qual frase usa ignore como verbo?', ['Please ignore that old message.', 'Please be ignore that message.', 'Please an ignore message.'], 0, 'Ignore é o verbo diretamente após please no imperativo.'),
    ],
  },
  'out-of-order': {
    topic: 'Ciúme, conexões e metáforas do cotidiano',
    vocabulary: [
      vocab('defense', 'defense', 'Defesa.', '/dɪˈfens/', 'Pode referir-se a esportes, proteção ou argumentos.', 'Our team needs to improve its defense.'),
      vocab('deny', 'deny', 'Negar.', '/dɪˈnaɪ/', 'Use deny something ou deny doing something; não deny to do.', 'He denied knowing about the surprise.'),
      vocab('longer', 'any longer', 'Por mais tempo; mais.', '/ˌeni ˈlɔŋɡər/', 'É comum em negativas para dizer que uma situação não continua.', 'I cannot wait any longer.'),
      vocab('connection', 'connection', 'Conexão; vínculo.', '/kəˈnekʃən/', 'Pode ser uma ligação técnica, social ou emocional.', 'We felt a connection after our first conversation.'),
      vocab('blessing', 'blessing', 'Bênção; algo valioso ou afortunado.', '/ˈblesɪŋ/', 'Pode ser religioso ou figurado, com sentido de benefício.', 'Having extra time to study was a blessing.'),
      vocab('order', 'out of order', 'Fora de funcionamento ou fora da ordem adequada.', '/ˌaʊt əv ˈɔrdər/', 'O contexto pode explorar a expressão como metáfora; não force uma tradução literal única.', 'The ticket machine is out of order.'),
    ],
    questions: [
      question('q-order', 'Uma placa out of order em uma máquina normalmente informa o quê?', ['A máquina está quebrada ou indisponível.', 'A máquina foi encomendada.', 'A máquina está mais rápida.'], 0, 'Nesse uso cotidiano, out of order indica que o equipamento não funciona.'),
      question('q-longer', 'Qual sentido any longer assume em I cannot wait any longer?', ['Nunca na vida.', 'Por mais tempo.', 'Durante mais pessoas.'], 1, 'A expressão indica que a espera não pode continuar.'),
      question('q-deny', 'Qual construção com deny é adequada?', ['He denied knowing.', 'He denied to knowing.', 'He denied to know.'], 0, 'Deny pode ser seguido de um verbo em -ing, como knowing.'),
      question('q-metaphor', 'Como interpretar uma metáfora esportiva em um contexto de relacionamento?', ['Considerando o sentido figurado no contexto.', 'Assumindo que o narrador descreve apenas uma partida real.', 'Ignorando todo o restante da frase.'], 0, 'O vocabulário de esporte pode representar proteção, competição ou ciúme fora de uma partida.'),
    ],
  },
  'king-for-a-day': {
    topic: 'Frustração, desejos e expressão intensa',
    vocabulary: [
      vocab('begging', 'beg', 'Implorar; pedir com insistência.', '/beɡ/', 'Beg for something pede por algo; beg someone to do something pede uma ação.', 'He begged for one more chance.'),
      vocab('imagine', 'imagine', 'Imaginar.', '/ɪˈmædʒɪn/', 'Antes de uma ação, use imagine doing, e não imagine to do.', 'Imagine studying abroad for a year.'),
      vocab('anymore', 'anymore', 'Mais; daqui em diante, geralmente em negativas.', '/ˌeniˈmɔr/', 'A expressão indica que algo não continua como antes.', 'I do not work at that company anymore.'),
      vocab('forgive', 'forgive', 'Perdoar.', '/fərˈɡɪv/', 'Verbo irregular: forgive, forgave, forgiven.', 'Please forgive me for arriving late.'),
      vocab('paranoia', 'paranoia', 'Paranoia; desconfiança extrema.', '/ˌpærəˈnɔɪə/', 'Na música pode descrever um estado emocional; a palavra não estabelece um diagnóstico.', 'The story explores fear and paranoia.'),
      vocab('enough', 'enough is enough', 'Já chega; a situação passou do limite.', '/ɪˈnʌf ɪz ɪˈnʌf/', 'Expressão enfática de limite ou frustração.', 'After three delays, she said enough is enough.'),
    ],
    questions: [
      question('q-imagine', 'Qual frase usa imagine corretamente antes de uma ação?', ['Imagine living near the beach.', 'Imagine to live near the beach.', 'Imagine live near the beach.'], 0, 'Imagine pode ser seguido de uma ação em -ing.'),
      question('q-anymore', 'O que anymore acrescenta em I do not work there anymore?', ['A situação não continua no presente.', 'A situação ocorrerá todos os dias.', 'A situação depende de outra pessoa.'], 0, 'Anymore indica que o estado anterior terminou.'),
      question('q-enough', 'Qual ideia enough is enough comunica?', ['Um limite foi atingido.', 'Ainda não existe nenhum limite.', 'Uma pessoa está satisfeita com qualquer quantidade.'], 0, 'É uma expressão enfática equivalente a já chega.'),
      question('q-forgive', 'Qual é o passado simples de forgive?', ['Forgived.', 'Forgave.', 'Forgiving.'], 1, 'Forgive é irregular: forgive, forgave, forgiven.'),
    ],
  },
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await mkdir('.music-assets', { recursive: true });
  await writeFile('.music-assets/musify-curriculum.json', JSON.stringify(musifyCurriculum, null, 2) + '\n');
  console.log(`Prepared original curriculum for ${Object.keys(musifyCurriculum).length} tracks.`);
}
