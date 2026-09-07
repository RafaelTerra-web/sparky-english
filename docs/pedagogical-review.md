# Revisão da estrutura pedagógica — 7 de setembro de 2026

Registro da primeira reorganização. A [revisão posterior do produto](product-review-2026-09-07.md) corrige as marcações automáticas de fala, a retomada apenas nominal e o apoio à produção. Variedade de textos gerados e de sequências não comprova diversidade pedagógica nem domínio do aluno. Este documento não representa uma revisão linguística individual das 168 lições.

## Diagnóstico do curso anterior

O conteúdo-base era consistente, mas o construtor aplicava a mesma ordem às 162 lições autorais: explicação, exemplo, vocabulário, alerta, leitura, três exercícios, produção e resumo. As seis introduções seguiam uma variação menor da mesma sequência. O texto da frase aparecia antes do áudio; não havia uma etapa explícita de pronúncia, comparação entre fala cuidadosa e conectada, treino em velocidade reduzida ou identidade pedagógica registrada. Speaking estruturado aparecia sobretudo nos níveis avançados.

Essa regularidade tornava previsível até um bom texto. A revisão preservou regras, exemplos, leituras, gabaritos e IDs que já funcionavam, mas mudou a experiência que os organiza.

## Sistema publicado

Cada uma das 168 lições agora recebe um perfil com seis decisões: personalidade, mecânica, missão, descoberta central, desafio adequado ao nível e aplicação real. Os 27 módulos funcionam como ambientes coerentes — por exemplo, Detetive do tempo, Clínica de clareza, Sala de análise e Laboratório de estilo — e as seis novas lições de cada módulo alternam Cena primeiro, Detetive de erros, Pista sonora, Laboratório de contraste, Escolha com consequência e Construção em camadas. As seis introduções preservadas também entram nessa variação.

As atividades são organizadas em oito sequências. Algumas começam pelo áudio; outras, por diálogo, erro, contraste ou decisão. A explicação pode vir antes ou depois de uma primeira hipótese, mas toda sequência mantém progressão suficiente para concluir os três exercícios avaliados e chegar à produção. Cada lição fecha dizendo o que o aluno passou a conseguir fazer e recupera o título anterior como pista discreta de continuidade.

Toda lição contém:

- uma missão contextual e uma pergunta de descoberta própria;
- um alvo de escuta que começa sem transcrição visível;
- áudio natural e o mesmo áudio a 75% da velocidade, com preservação de altura;
- um microtreino de pronúncia com gesto articulatório, forma cuidadosa, agrupamento natural, escada de três repetições e os controles de áudio/microfone no próprio treino;
- contrast drill quando o conteúdo contém uma oposição útil, como TH/T, V/W, /ɪ//iː/, H/ausência de H ou terminações de `-ed`;
- instrução de shadowing com foco em ritmo, tonicidade, ligação e entonação;
- comparação explícita entre forma muito natural, armadilha e correção;
- feedback específico já vinculado a cada alternativa avaliada;
- transferência escrita e oral para uma situação diferente do exemplo.

O aluno pode revelar a frase sem ouvir para preservar acessibilidade e funcionamento sem áudio. O botão informa que ouvir primeiro é a estratégia recomendada. O modo lento reaproveita o MP3 publicado e não faz uma nova chamada de TTS.

## Progressão e segurança do progresso

Os três exercícios objetivos continuam identificados pelo ID imutável da lição e pelo tipo de atividade. A versão editorial mudou para `2026-09-07.2`, portanto comprovantes e checkpoints incompletos da estrutura anterior não são misturados com a nova ordem; rascunhos antigos continuam recuperados pelo Caderno. Conclusões, moedas e posições no ledger permanecem preservadas.

O novo checkpoint guarda se o aluno ouviu ou revelou a frase, além de resposta, tradução, apoio e posição. Voltar uma etapa restaura esse estado sem reenviar uma tentativa já aprovada.

## Auditoria

`npm run audit:experience` impede que uma lição seja publicada sem missão, descoberta, desafio, escuta, microtreino articulatório, análise de erro, três exercícios, produção escrita e transferência oral. Também limita cada percurso a 11–13 etapas, exige ao menos seis ritmos em cada módulo e verifica variedade de habilidades de pronúncia. A auditoria atual confirma 168 missões, 168 descobertas e 168 desafios únicos, oito sequências e habilidades segmentais e de fala conectada.

A conferência automatizada verifica estrutura, identidade e cobertura dos recursos. Ela não substitui sessões de observação com estudantes nem avaliação independente por professor ou foneticista; esses testes são a próxima fonte adequada para calibrar tempo, dificuldade e clareza das instruções físicas.
