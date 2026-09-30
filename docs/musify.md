# Musify — 30 de setembro de 2026

Musify amplia o Music Lab com as sete faixas fornecidas pelo usuário, além das quatro já existentes. Cada faixa tem letra com marcações acústicas, tradução em português, vocabulário com exemplos próprios, identidade visual e uma animação discreta. Still Into You mostra borboletas quando a palavra é cantada; as outras faixas usam ondas, halos, brilho disco, coroas, fitas e tempestade. Movimento reduzido e economia de dados suprimem o vídeo decorativo.

## Jogo de escuta

Cada pergunta pede uma única palavra, com alternativas distintas. Palavras sem confirmação suficiente, falas introdutórias, grupos corrigidos sem tempo individual, ad-libs e termos explícitos ficam fora das perguntas. Distratores homófonos conhecidos também são excluídos. A quantidade de trechos apresentada no seletor corresponde ao que a faixa realmente permite, preservando intervalos separados para responder.

O jogador começa com três vidas. Errar ou deixar o tempo acabar consome uma vida uma única vez; acertar mantém as vidas. Sem vidas, o áudio pausa e o jogador pode reiniciar ou apenas ouvir. Uma partida encerrada por falta de vidas preserva o recorde parcial e não registra conclusão. Durante a resposta, o apoio em português mostra a tradução com apenas o equivalente da palavra pedida oculto; a frase completa aparece depois da tentativa. O equivalente é alinhado editorialmente, inclusive expressões e repetições; palavras sem alinhamento confiável não viram perguntas. No apoio em inglês, o português continua sob demanda. Não há botão de pausa, avanço ou mudança de velocidade durante a partida; a velocidade é escolhida antes de começar. Ao ir para segundo plano, o app pausa automaticamente e retoma ao voltar.

Os cinco vídeos preparados são H.264 640×360, sem áudio, sincronizados ao relógio do áudio e com transparência visual. A falha do vídeo não interrompe o jogo. **I Was Made for Lovin’ You usa somente áudio**, conforme pedido do usuário; seu vídeo com legendas em espanhol não é publicado. Out of Order é uma fonte MP3 e também usa somente áudio. As capas dos cinco vídeos são quadros extraídos das fontes fornecidas; as duas faixas sem vídeo têm arte vetorial abstrata.

## Compatibilidade e recuperação

Os acessórios da loja passam a carregar diretamente os PNGs calibrados, com uma revisão baseada no conteúdo. Isso corrige a resposta `400 INVALID_IMAGE_OPTIMIZE_REQUEST` encontrada no otimizador da produção. IDs de compras e equipamentos permanecem estáveis; as camadas da mochila e da bolsa respeitam rosto, pescoço e cabeça. A auditoria cobre as bases dos dois mascotes, todos os trajes e combinações simultâneas.

A interface e a língua de apoio são independentes. O inglês alvo permanece imutável; explicações seguem a preferência, e traduções/significados em português ficam disponíveis sob demanda na imersão. O idioma foi verificado nos 1.056 exercícios da trilha e nas aulas narradas.

O pacote de prática offline contém 12 lições reais A1–C2. Ele exige uma visita online prévia com instalação bem-sucedida do service worker, salva um rascunho anônimo separado e não concede moedas nem conclusão oficial. Música, recibos e dados de conta continuam privados e dependem de conexão. [Detalhes e origem da ilustração GPT Image](musify-offline.md).

## Validação e publicação

As transcrições e mídias ficam no armazenamento privado, sem letras no Git. A revisão combina três reconhecimentos locais e correções editoriais; palavras com tempos sobrepostos ou duração nula são agrupadas sem inventar marcações individuais. Os scripts `review-musify-finalize.py`, `review-musify-audit.mjs`, `build-musify-translation-support.mjs` e `review-musify-translation-audit.mjs` regeneram e validam o bundle privado. Os equivalentes bilíngues revisados ficam junto às fontes privadas. `audit-musify-release.mjs` verifica 100 sementes nos oito modos das onze faixas, palavras únicas, máscaras de tradução, alternativas, janelas e conclusão com três vidas. Os quatro manifests anteriores ganham cópias em caminhos novos, preservando letras, tempos, versões e progresso.

O build verifica hashes de todos os arquivos aprovados e regenera o pacote offline. Os testes Playwright cobrem jogo, três vidas, reinício, imersão, movimento reduzido, decodificação real do vídeo, acessórios, perda de rede e reconexão em perfis móveis e desktop. O fluxo de publicação permanece GitHub → Vercel; a conclusão da publicação exige conferir o SHA do domínio principal e o nome Musify em `/api/release`.
