# Music Lab: cena 3D e segunda música

## Experiência

A biblioteca passa a ter um disco 3D em Three.js, órbitas luminosas e partículas. Perfect usa tons esmeralda; Heartless usa violeta. As capas mostram a duração completa e cada faixa abre seu próprio progresso.

A contagem de três segundos fica em um indicador discreto no canto, mantendo a letra ambiental em 30% de opacidade. A letra acompanha o relógio corrigido, sem destacar palavras. Durante a resposta ativa, o fundo é ocultado para preservar o desafio. O motor mantém 24 rodadas e as velocidades 1×, 0,75× e 0,5×.

Three.js é carregado sob demanda. A cena usa no máximo 30 quadros por segundo e escala de pixels de 1,5; pausa quando fica fora da tela, quando a aba é ocultada ou com movimento reduzido. Geometrias, materiais e contexto são liberados ao desmontar. Uma capa CSS permanece disponível sem WebGL. A cena nunca se conecta ao áudio nem altera seu volume.

## Heartless

- Origem: MP4 fornecido pelo usuário. A trilha AAC foi extraída sem recodificação para uma cópia local; o player recebe uma cópia MP3 com volume reduzido, compatível com a experiência existente.
- Duração completa: 223,237 segundos, sem cortes; 84 trechos, 435 ocorrências de palavras e 196 entradas de vocabulário.
- Identificador `heartless-local`, versão `heartless-timing-1`, nível editorial B1, quatro perguntas de compreensão.
- Transcrição local revisada contra quadros do lyric video, com traduções, pronúncia e exemplos. Alinhamento de palavras feito somente para a nova faixa. Dois resultados de duração zero foram substituídos pelos timestamps independentes da transcrição inicial; sobreposições curtas foram conciliadas nas fronteiras.
- O alinhamento automático pode absorver silêncio em palavras de fronteira. A revisão visual não equivale a uma aprovação auditiva independente de cada timestamp. Evidências e relatórios locais permanecem em `.music-lab/heartless/`.

Os bytes do áudio e do manifesto de Perfect permanecem idênticos à release aprovada: 49 linhas, 127 vocábulos e versão de runtime `full-song-timing-2`. Seu endpoint sem query continua válido. A seleção de arquivos usa uma lista explícita de identificadores; parâmetros não viram caminhos no sistema de arquivos. Dados salvos, login, loja e sequência diária são preservados; o Caderno continua removido.

Os quatro arquivos privados das duas músicas entram no upload da release e no rastreamento das funções Next.js. O prebuild na Vercel verifica seus SHA-256; áudio e letras não são versionados no Git.

## Verificação

- 146 testes unitários, TypeScript, ESLint dos arquivos alterados e build otimizada.
- Smokes `music-room`, `music-full`, `music-remaster` e `music-authenticated`: Perfect completo, 24 desafios, sincronização, velocidades, seek, pausa, progresso, Range 206 e layout compacto para typing.
- `smoke-music-multitrack.mjs`: duas músicas, versões e contagens, respostas Range 206, progresso independente, identificador inválido rejeitado, 24 rodadas em todos os níveis, reprodução completa de Heartless, letra visível durante contagem e sem scroll em 320×568, 390×844 e 430×932.
- A instrumentação de WebGL confirma ausência de desenho com movimento reduzido enquanto o relógio avança. A perda forçada de contexto ativa o fallback sem interromper a reprodução.
- Na preparação editorial, 1.000 sementes por dificuldade de Heartless produziram 24 rodadas sem colisões. O smoke conserva uma amostra menor de regressão para ambas as músicas.
- Capturas desktop e mobile revisadas em `.music-lab/observatory-review/`.

Os smokes autenticados desta revisão usam o laboratório isolado local. A sessão real autenticada de produção e o teclado nativo de um telefone continuam sem validação. A autorização anterior do usuário permite promoção direta após os testes locais; nenhuma proteção da Vercel é contornada.
