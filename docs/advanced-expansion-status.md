# Expansão avançada — registro de implementação

Atualizado em 7 de setembro de 2026. Especificação: 36 lições B2–C2, 48 conversas multilocutor, loja ampliada e avaliações internas verificáveis. Este documento registra trabalho efetivo, não uma declaração de lançamento concluído.

## Conteúdo e listening

- Escritas as 36 lições em seis módulos de seis: vida prática sob pressão, narrativas e mídia, mediação, escuta longa, nuance intercultural e intervenção precisa.
- Cada candidata inclui diálogo Sparky/Pinky, tradução, compreensão global/detalhe/inferência, cinco exercícios objetivos, escrita, fala livre e mediação. Scripts com extensão progressiva e IDs distintos.
- Currículo publicado: 168 lições, 27 módulos, 504 exercícios. Candidatas: 36 lições e 180 exercícios. Depois da aceitação: 204 lições, 33 módulos, 684 exercícios; B2 24, C1 30, C2 30.
- Candidatas fora do currículo ativo e do ledger de conclusões. Texto sem áudio não é contabilizado como listening publicado.
- Player de conversas preparado com reprodução natural/0,75, transcrição após tentativa e alternativa acessível que registra uso de apoio. Manifesto vazio: **0 de 36 áudios de lições aprovados**; 12 diálogos extras da loja também pendentes.
- Primeiro WAV do AI Studio: conversa esperada segundo triagem por transcrição local, mas duração de 52,32 segundos, abaixo dos 75–120 segundos previstos para B2. Não aprovado nem incluído no app. Triagem automática não substitui audição humana.
- Controle do Opera/AI Studio deixou de responder. O usuário já ativou downloads automáticos; não solicitar essa alteração novamente. Retomar geração quando o Computer Use voltar, mantendo exatamente gemini-3.1-flash-tts-preview, Achird/Sparky e Zephyr/Pinky.
- Dois professores e um especialista em avaliação ainda não revisaram o material. Não alegar validação pedagógica externa ou acreditação.

## Loja e interface implementadas localmente

- Oito cenários ilustrados integrados: os três antigos preservam IDs e preços, com nova arte; canto de estudos, café, trem, biblioteca e aurora acrescentados por 45/70/95/120/160 moedas.
- Dezesseis WebPs em larguras 480 e 960; hashes e prompts em advanced-scene-generation.json. Prévia e equipamento funcionam com os dois mascotes.
- Quatro temas de Caderno funcionais: menta, meia-noite, papel clássico e frutas vermelhas, por 25/40/55/70 moedas. Compra permanente, prévia gratuita, seleção validada pelo servidor e retorno gratuito ao original. Textos não são modificados pela troca.
- RewardState v3 usa bitset de propriedade e store-ledger.ts com posições permanentes. Migra arrays v1, saldo, reembolsos e equipamentos; não repete reembolso nem débito de compra já adquirida. API pública continua fornecendo IDs legíveis.
- Catálogo distingue looks, cenas, pacotes de prática e temas. Álbuns de listening ainda não são vendidos porque conteúdo e áudio não estão prontos.
- Convite de instalação dispensado fica oculto durante a sessão, inclusive após recarregar. Rolagem móvel reserva espaço para navegação inferior.
- Quatro sprites novos do Sparky gerados e empacotados em 640×640 com alpha. Permanecem fora do catálogo enquanto passam por limpeza de bordas e inspeção no app. Variantes campus/apresentadora da Pinky com fundo quadriculado foram rejeitadas. Os oito looks novos ainda não estão concluídos. Prompts, arquivos e rejeições em advanced-art-generation.json.

## Supabase e avaliações

- Projeto confirmado: sparky-english, São Paulo, URL pública https://pqtlsrmzciriabzzgmzc.supabase.co.
- Bootstrap das três primeiras migrações executado no banco inicialmente vazio; 22 tabelas com RLS verificadas e rubrica beta inserida. Não executar novamente o bootstrap em banco preenchido.
- Migração adicional de privilégios de serviço enviada pelo SQL Editor; confirmação final e teste SQL transacional pendentes após falha do navegador.
- Vercel Production recebeu URL pública, chave publicável e segredo de serviço Supabase. Segredo não está no código. Leitura server-side pelo SDK e leitura da rubrica verificadas. SPARKY_DURABLE_PROGRESS ainda não foi ativado.
- Conferência final pelo Vercel CLI confirmou OPENAI_API_KEY já cadastrada como Secret em Production. Não pedir nova chave nem reutilizar chaves antigas expostas na conversa. Existência da variável foi verificada; chamadas aos modelos ainda não foram validadas.
- Política de pisos por habilidade, rubrica versionada, reconciliação de dois avaliadores e provedor estrito preparados. Indisponibilidade não produz aprovação/reprovação. Modelos não são substituídos silenciosamente.
- Faltam fluxos completos de tentativa/resultado, simulados, revisão humana, sincronização de textos, emissão/QR/verificação/revogação de certificados e validação ponta a ponta desses serviços. Nenhum certificado foi emitido.

## Validação e publicação

- 54 testes unitários, lint e build de produção passaram. Auditoria de dependências de produção: zero vulnerabilidades reportadas. Regressões da loja anterior e da instalação PWA também passaram.
- Playwright com conta fictícia em localhost: oito cenários × dois mascotes em desktop/iPhone/Android emulados; prévia, compra, duplicidade, equipamento e recarga passaram.
- Quatro temas nas três telas: propriedade, compra, aplicação, preservação da meta escrita, contraste do corpo/título e retorno ao original passaram. Inspeção visual detectou e corrigiu título sem contraste no tema meia-noite.
- Emulações usam Chromium; não equivalem a teste em hardware iOS/Safari real.
- Exportação editorial e auditoria: node scripts/audit-advanced-expansion.mjs --out=<diretorio>. --release falha enquanto houver áudio ausente/reprovado.
- Sem commit, push ou implantação desta expansão até este ponto. Trabalho revisável no checkout. Não anunciar 204 lições disponíveis, oito looks prontos, 48 áudios revisados ou certificados ativos.

## Próximas entregas necessárias

1. Restabelecer Computer Use e produzir/revisar os 48 áudios; concluir os 12 diálogos extras.
2. Corrigir transparência/bordas e concluir os oito looks; integrar e testar álbuns.
3. Concluir avaliações, simulados autorais e certificados com autorização, consentimento e evidência de todas as habilidades.
4. Verificar privilégios/migrações no Supabase, ativar persistência e testar sincronização/conflitos com contas de teste controladas.
5. Revisão editorial/docente, testes de listening e avaliações nos três formatos de tela, auditoria de bundle e publicação beta após os critérios aplicáveis.

Ao implantar v3, preservar cópia dos dados antes de qualquer rollback: a versão antiga não entende o novo bitset de propriedade.
