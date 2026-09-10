# Expansão avançada — registro de implementação

Atualizado em 10 de setembro de 2026. Especificação: 36 lições B2–C2, 48 conversas multilocutor, loja ampliada e avaliações internas verificáveis. Este documento registra trabalho efetivo, não uma declaração de lançamento concluído.

## Conteúdo e listening

- Escritas as 36 lições em seis módulos de seis: vida prática sob pressão, narrativas e mídia, mediação, escuta longa, nuance intercultural e intervenção precisa.
- Cada candidata inclui diálogo Sparky/Pinky, tradução, compreensão global/detalhe/inferência, cinco exercícios objetivos, escrita, fala livre e mediação. Scripts com extensão progressiva e IDs distintos.
- Currículo publicado: 176 lições, 31 módulos, 528 exercícios. Candidatas: 36 lições e 180 exercícios. Depois da aceitação: 212 lições, 37 módulos, 708 exercícios. A meta original de 204 precede as oito lições publicadas em paralelo.
- Candidatas fora do currículo ativo e do ledger de conclusões. Texto sem áudio não é contabilizado como listening publicado.
- Player de conversas preparado com reprodução natural/0,75, transcrição após tentativa e alternativa acessível que registra uso de apoio. Manifesto vazio: **0 de 36 áudios de lições aprovados**; 12 diálogos extras da loja também pendentes.
- Primeiro WAV do AI Studio: conversa esperada segundo triagem por transcrição local, mas duração de 52,32 segundos, abaixo dos 75–120 segundos previstos para B2. Não aprovado nem incluído no app. Triagem automática não substitui audição humana.
- Os 36 roteiros estão exportáveis para o Composer do AI Studio, mantendo exatamente gemini-3.1-flash-tts-preview, Achird/Sparky e Zephyr/Pinky. O usuário já ativou downloads automáticos; não solicitar essa alteração novamente. A importação valida RIFF, PCM, silêncio e duração, grava hashes e mantém revisão pendente. Conferir o modelo no painel: um WAV não comprova sua origem. Consulte `docs/listening-audio-workflow.md`.
- O WAV antigo de Downloads tem cabeçalho inconsistente: PCM16 mono a 24 kHz, mas byteRate declarado de 96000 em vez de 48000. Foi rejeitado sem alteração do original. Nova geração e audição continuam necessárias.
- Dois professores e um especialista em avaliação ainda não revisaram o material. Não alegar validação pedagógica externa ou acreditação.

## Loja e interface implementadas localmente

- Doze trajes e dezesseis acessórios compartilhados estão integrados, com variantes PNG 640×640 próprias para cada mascote. A combinação usa slots separados para traje, cabeça, rosto, pescoço e bolsas.
- Os oito cenários foram aposentados na migração v4 da loja; compras antigas são reembolsadas integralmente uma única vez, até 650 moedas. IDs históricos continuam reservados no ledger para não alterar compras existentes.
- Quatro temas de Caderno funcionais: menta, meia-noite, papel clássico e frutas vermelhas, por 25/40/55/70 moedas. Compra permanente, prévia gratuita, seleção validada pelo servidor e retorno gratuito ao original. Textos não são modificados pela troca.
- RewardState v4 usa bitset de propriedade e `store-ledger.ts` com posições permanentes. Migra arrays v1 e estados v3, saldo, reembolsos e equipamentos; não repete reembolso nem débito de compra já adquirida. A API pública continua fornecendo IDs legíveis.
- Catálogo distingue trajes, acessórios, pacotes de prática e temas. Álbuns de listening ainda não são vendidos porque conteúdo e áudio não estão prontos.
- Convite de instalação dispensado fica oculto durante a sessão, inclusive após recarregar. Rolagem móvel reserva espaço para navegação inferior.
- As 46 artes do guarda-roupa foram empacotadas em 640×640 com transparência, hash e manifesto. Três trajes do Sparky e sua base receberam correções adicionais de transparência; as combinações completas foram inspecionadas em folhas de contato para os dois mascotes.

## Supabase e avaliações

- Projeto confirmado: sparky-english, São Paulo, URL pública https://pqtlsrmzciriabzzgmzc.supabase.co.
- Bootstrap das três primeiras migrações executado no banco inicialmente vazio; 22 tabelas com RLS verificadas e rubrica beta inserida. Não executar novamente o bootstrap em banco preenchido.
- Migração adicional de privilégios de serviço foi aplicada. Um teste transacional no Supabase real confirmou RLS, acesso exclusivo do serviço, leitura/escrita do estado v4 e rejeição de atualização com revisão desatualizada; as linhas do teste foram desfeitas ao final.
- Vercel Production recebeu URL pública, chave publicável e segredo de serviço Supabase. O segredo não está no código. Leitura server-side pelo SDK e leitura da rubrica foram verificadas.
- Conferência final pelo Vercel CLI confirmou OPENAI_API_KEY já cadastrada como Secret em Production. Não pedir nova chave nem reutilizar chaves antigas expostas na conversa. Existência da variável foi verificada; chamadas aos modelos ainda não foram validadas.
- Política de pisos por habilidade, rubrica versionada, reconciliação de dois avaliadores e provedor estrito preparados. Indisponibilidade não produz aprovação/reprovação. Modelos não são substituídos silenciosamente.
- Faltam fluxos completos de tentativa/resultado, simulados, revisão humana, sincronização de textos, emissão/QR/verificação/revogação de certificados e validação ponta a ponta desses serviços. Nenhum certificado foi emitido.

## Validação e publicação

- A suíte automatizada inclui migração v4, comparação de revisão no armazenamento, 46 assets verificados e regressões da instalação, das lições e da loja.
- Playwright com conta fictícia em localhost: trajes e acessórios nos dois mascotes, prévia, compra, cancelamento, remoção por slot, retorno ao básico e recarga passam em desktop/iPhone/Android emulados.
- Quatro temas nas três telas: propriedade, compra, aplicação, preservação da meta escrita, contraste do corpo/título e retorno ao original passaram. Inspeção visual detectou e corrigiu título sem contraste no tema meia-noite.
- Emulações usam Chromium; não equivalem a teste em hardware iOS/Safari real.
- Exportação editorial e auditoria: node scripts/audit-advanced-expansion.mjs --out=<diretorio>. --release falha enquanto houver áudio ausente/reprovado.
- Não anunciar 204 lições disponíveis, 48 áudios revisados ou certificados ativos: essas entregas continuam sujeitas aos critérios editoriais e de áudio descritos acima.

## Próximas entregas necessárias

1. Restabelecer Computer Use e produzir/revisar os 48 áudios; concluir os 12 diálogos extras.
2. Produzir, integrar e testar os álbuns de listening.
3. Concluir avaliações, simulados autorais e certificados com autorização, consentimento e evidência de todas as habilidades.
4. Continuar acompanhando sincronização e conflitos em contas de teste controladas após a publicação.
5. Revisão editorial/docente, testes de listening e avaliações nos três formatos de tela, auditoria de bundle e publicação beta após os critérios aplicáveis.

Antes de qualquer rollback do estado v4, preservar cópia dos dados: versões antigas não entendem todos os campos de migração e equipamentos.
