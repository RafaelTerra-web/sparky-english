# Sparky English: revisão do produto e melhorias implementadas

7 de setembro de 2026. Escopo: identidade do app, jornada de estudo, construção das atividades e amostra editorial de A1 a C2. Inspeção do código e dos dados de todas as lições, leitura detida das tarefas selecionadas e testes de navegador. Não houve observação de alunos reais nem validação independente de proficiência.

## Avaliação principal

O produto tem uma base funcional útil: progressão persistente, retomada, revisão agendada, explicações em português, exemplos em inglês, prática oral com duas vozes e conteúdo autoral. A identidade visual do mascote é mais forte que o ícone vetorial anterior, que não reproduzia bem sua expressão.

A lacuna maior está na distância entre reconhecer uma resposta e usar inglês com autonomia. Os 504 exercícios avaliados são interpretação com alternativas, preenchimento por seleção e reconstrução de uma frase já apresentada. As produções livres não recebem avaliação. É possível completar o percurso sem demonstrar que se consegue sustentar uma conversa ou revisar um texto com feedback. O objetivo de fluência exige desenvolver essas evidências, além de ampliar o catálogo.

Os níveis C1/C2 são úteis como oficinas introdutórias de síntese e estilo. A amostra examinada concentra situações acadêmicas, institucionais e profissionais; isso não demonstra cobertura integral desses níveis. Os descritores de fala do Conselho da Europa incluem fluidez, interação, coerência, alcance e precisão, dimensões que a simples comparação de transcrições não mede. [Referência oficial](https://www.coe.int/en/web/common-european-framework-reference-languages/table-3-cefr-3.3-common-reference-levels-qualitative-aspects-of-spoken-language-use).

## Evidências do catálogo

Contagem dos textos da etapa `dialogue`, separando palavras por espaços. Comprimento é apenas um indicador de exposição, não uma medida de nível.

| Nível | Lições | Palavras por leitura: mínimo / média / máximo |
|---|---:|---:|
| A1 | 38 | 13 / 17 / 21 |
| A2 | 44 | 14 / 21 / 42 |
| B1 | 38 | 14 / 22 / 41 |
| B2 | 12 | 69 / 75 / 80 |
| C1 | 18 | 81 / 86 / 93 |
| C2 | 18 | 87 / 95 / 106 |

Há 27 módulos, 168 exemplos-alvo com dois áudios cada e 162 lições autorais além das seis introduções preservadas. Os MP3 atuais cobrem frases-modelo, não a íntegra das leituras. A média de leitura de B1 permanece próxima da de A2. Em C2, textos curtos servem para análise localizada, mas não exercitam sozinhos leitura extensa, integração de fontes completas ou acompanhamento de discurso prolongado.

As oito sequências e 168 textos de missão distintos resultam majoritariamente de seis modelos de montagem. A auditoria automatizada verifica presença e variedade de strings; não prova que cada aula tenha uma mecânica pedagógica própria. O relatório da reorganização anterior foi explicitamente marcado como histórico e limitado à estrutura.

## Corrigido nesta atualização

### Identidade e interface

- Ícone redesenhado com GPT Image usando o Sparky original como referência: rosto com expressão suave, cachecol coral e fundo verde. A ilustração substitui o SVG no favicon, cabeçalho e convite de instalação.
- Variantes para iPhone, Android e recorte adaptativo; nomes v2 e cache público v5 evitam reaproveitar os recursos antigos. O master e o script de empacotamento estão no repositório.
- Vocabulário apresentado em cartões com termo em inglês e significado separado. A pista abstrata da abertura fica em uma seção expansível, reduzindo o texto simultâneo.
- Ao trocar de área, a tela volta ao topo e o foco vai para o conteúdo. Isso corrige a navegação que preservava uma rolagem distante no celular.
- Apoios opcionais usam `details/summary`, com foco visível e controles de pelo menos 44 px. A resposta de retomada, o ajuste do contraste e o modelo de escrita começam ocultos.

### Pronúncia e didática

- Removidos os separadores automáticos `·`, `|` e `‿`. A antiga heurística inseria ligações por letras e palavras funcionais, sem considerar o áudio. A etapa agora mantém a frase real e orienta a escuta, sem fingir oferecer transcrição fonética.
- O alvo sonoro é escolhido a partir da frase gravada. Menções a palavras em regras e exemplos de erro não acionam mais uma habilidade ausente do áudio.
- Uma lição sobre passado irregular ou `used to` deixou de receber automaticamente a regra de `-ed`. Formas regulares selecionadas continuam com orientação de /t/, /d/ e /ɪd/.
- Contrações negativas agora explicam a união de verbo e `not`; o texto anterior descrevia todas como sujeito + auxiliar. Os três trechos da escada de repetição são distintos e terminam na frase exata do MP3.
- 135 lições têm aquecimento de memória baseado em uma frase anterior do mesmo módulo, com intenção em português e modelo oculto. A interface não pressupõe que o aluno já tenha concluído a lição anterior nem atribui nota a essa recuperação.
- Os contrastes apresentam o contexto e a justificativa do exercício. A correção fica oculta até o aluno solicitar. Foi removida a classificação indiscriminada de exemplos como “muito naturais”.
- O resumo diz o que foi praticado e pede outra tentativa sem modelo; deixou de afirmar domínio apenas porque o aluno avançou.

Essas decisões usam como referência a relação entre contexto, formas fracas, ritmo e inteligibilidade descrita pelo British Council. A aplicação ao Sparky é uma decisão editorial nossa; não houve análise fonética dos 336 arquivos. [Connected speech — British Council](https://www.teachingenglish.org.uk/professional-development/teachers/knowing-subject/connected-speech-part-1).

### Conteúdo e produção

Doze tarefas receberam planejamento em três passos, exemplo comentado e proposta de adaptação. Nos níveis avançados, o modelo é identificado como trecho, não como resposta completa ao limite de palavras.

| Nível | Lições com novo apoio editorial |
|---|---|
| A1 | Perguntar o nome; Dizer de onde você é |
| A2 | Was e were; Passado dos verbos regulares |
| B1 | Hábitos antigos com used to; Anterior a outro momento passado |
| B2 | Defender uma posição com ressalvas; Distinguir correlação de causa |
| C1 | Sintetizar fontes em tensão; Calibrar o grau de certeza |
| C2 | Ler alusões e ecos intertextuais; Distinguir narrador, voz citada e autor |

Os apoios aparecem junto ao rascunho e continuam disponíveis sem apagar a escrita. A tarefa de passado regular também deixou de afirmar, incorretamente, que não havia treino por áudio.

As estimativas somam tempo de rascunho e revisão quando a proposta contém uma quantidade de palavras, inclusive metas sem intervalo. Uma tarefa C2 de 650–800 palavras passa de 20 para aproximadamente 90 minutos. É uma estimativa editorial, a calibrar com alunos; tarefas com múltiplas versões ainda podem demandar mais tempo.

## Próximas melhorias, em ordem

| Prioridade | Lacuna observada | Próxima entrega e critério de avaliação |
|---|---|---|
| P1 | Escuta restrita a frases-modelo | Diálogos completos A2/B1 e exposições B2/C1, com perguntas de ideia geral e detalhe antes da transcrição. Medir compreensão independente em um áudio novo. |
| P1 | Produção sem feedback | Rubricas por tarefa e exemplos de revisão, começando pelas 12 tarefas apoiadas. Comparar primeira versão e reescrita; separar correção, adequação e organização. |
| P1 | Repetição confundida com speaking livre | Simulações com papéis, informação que falta e pedidos de esclarecimento. Avaliar se o interlocutor consegue realizar a ação proposta, sem usar igualdade textual como nota de pronúncia. |
| P1 | B1 tem pouca ampliação de leitura | Expandir narrativas, mensagens e textos com referências distribuídas. Acrescentar uma tarefa inédita que exija ligar pistas entre parágrafos. |
| P2 | Cobertura avançada concentrada | Ampliar gêneros e interlocutores: conversa informal, entrevista, relato oral, crítica cultural e textos longos com posições concorrentes. Mapear objetivos por habilidade, não só pelo rótulo C2. |
| P2 | Conclusão mistura exposição e domínio | Mostrar separadamente prática concluída, revisão independente e produção revisada. Testar tarefas de transferência depois de alguns dias. |
| P2 | Convite de instalação reaparece ao recarregar | Persistir a dispensa por um período e oferecer acesso no Perfil. Observar abandono e sobreposição em aparelhos reais antes de alterar a frequência. |
| P2 | Offline só oferece reconexão | Permitir baixar uma lição escolhida, incluindo áudio, e explicitar o que fica disponível. Testar perda de conexão, retomada e atualização sem expor dados privados. |

O próximo lote de conteúdo deveria fechar a passagem A2→B1 e ampliar a escuta, antes de aumentar novamente o número de lições C2. Essa priorização é uma inferência da distribuição e dos fluxos observados, não resultado de um estudo de aprendizagem.

## Validação e limites

- 35 testes unitários passaram, incluindo alvos sonoros, correspondência do áudio, aquecimentos do mesmo módulo, preservação dos IDs, avaliação, retomada e modelos das duas vozes.
- Lint, build e auditorias de currículo/estrutura passaram; auditoria das dependências de produção sem vulnerabilidades reportadas.
- Navegador: áudio natural/lento, reconhecimento simulado Ana/Anna e rejeição de palavras extras, revisões, navegação para trás, rascunho longo, modelos A1/B2/C2 ocultos, vocabulário e contrastes, foco e rolagem. Sem erros de execução ou transbordamento horizontal nos cenários testados.
- PWA: manifesto, ícones, escopo do service worker, aceitação/cancelamento simulados e fallback offline real. iPhone/Android foram simulados em Chromium; instalação física e microfone real continuam dependendo de aparelhos.

Não foram alterados IDs, gabaritos, ordem das etapas ou frases dos áudios. A versão de checkpoint permanece compatível; as mudanças são adições de apoio e correções de apresentação. Esta revisão não equivale à validação linguística individual de todas as alternativas, à certificação CEFR ou à demonstração de fluência dos alunos.

## Proveniência da imagem

Gerada com a ferramenta integrada `image_gen`, sem CLI de API. Referência: `public/visuals/sparky-panda.png`. Arquivo final: `public/visuals/sparky-app-icon.png`. Empacotamento: `scripts/build-app-icons.mjs`.

Prompt utilizado:

> Create a single finished square app icon for Sparky English using the reference as the strict mascot identity. A charming sophisticated illustrated panda with this exact cream face, dark charcoal ears and asymmetric eye patches, soft expressive eyes that look coherently in one direction, small nose, tiny closed-mouth smile, tuft of cream hair, coral red scarf. Head and small shoulders close-up, gentle three-quarter tilt like the original. Warm and intelligent friendly expression. Clean professional 2.5D illustration with soft subtle shading, broad readable silhouettes at 48 pixels, no skinny elongated face, no crossed eyes, no creepy stare, no symmetrical clipart. Deep pine green solid background (#173e36), full bleed opaque square, no rounded corners pre-applied, no lettering, no border, no books, no hands, no additional symbols. Keep entire ears and scarf contained with comfortable margin; essential face inside central 70% for adaptive icon cropping. Produce only the single icon artwork, not a mockup, grid or phone scene.
