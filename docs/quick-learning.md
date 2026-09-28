# Jornada rápida do Sparky

O curso publicado mantém 176 IDs, 31 módulos e as posições do ledger. Cada lição agora usa seis exercícios obrigatórios, alternando três escolhas e três ordenações. São 1.056 questões: 528 de cada formato. A estimativa é 2–4 minutos; o modo Normal tem duração livre.

## Conteúdo e motor

- As 176 entradas de src/lib/content/quick-lessons.json definem a intenção, três frases distintas, uma situação curta, três respostas contextualizadas e feedback em português e inglês. A questão de completar reutiliza a estrutura gramatical revisada da lição.
- Lesson.exercises é a sequência obrigatória. Lesson.support contém teoria, vocabulário, exemplos com áudio, pronúncia, diálogos, análise de erros e produção opcional. Lesson.steps mantém o material histórico que identifica gravações e referências.
- IDs mc-1, order-1, mc-2, order-2, mc-3, order-3 são prefixados pelo ID da lição no servidor.
- /api/study action=start devolve os IDs autorizados e um comprovante criptografado por conta, com validade de oito horas. Cada resposta é validada em ordem. Uma resposta errada deve ser corrigida antes da seguinte.
- A auditoria verifica instruções de até 12 palavras, contextos de até 25/45 e os limites de palavras nas ordenações. Alternativas equivalentes de ordem são aceitas para posições de tempo, algumas subordinadas e coordenações revisadas; não se aceita qualquer permutação. Palavras repetidas usam índices de token distintos.
- Conteúdo 2026-09-28.quick-1, fluxo 3, avaliação closed-exact-3 e revisão 3 substituem sessões pendentes antigas. Conclusões, moedas, roupas, sequência, revisões e rascunhos existentes continuam independentes do checkpoint.

## Jornada

Hoje mostra uma recomendação e a faixa de tempo, meta e sequência. Trilha abre o módulo atual; a busca por assunto e os filtros adicionais ficam disponíveis na prática livre. Praticar reúne revisão, conversação habilitada, aulas, histórias, músicas e simulados. Perfil contém a loja e a configuração da pronúncia do nome. O saldo mantém acesso direto à loja.

O cadastro tem três telas: nome/idade/consentimento, nível com diagnóstico opcional e mascote/início. O padrão é Sparky e nome em texto. Ajustes de pronúncia continuam no Perfil. Perfis concluídos permanecem válidos; cadastros incompletos começam na primeira etapa pendente.

Revisões usam duas escolhas e uma ordenação, com seleção diária rotativa que permanece fixa no comprovante. Continuam o limite de três revisões por dia e os intervalos de 3, 7, 14, 30 e 60 dias. Erros ou ajuda reiniciam o intervalo.

Desafio usa 120/180/240 segundos para A1–A2/B1–B2/C1–C2. Conta somente resposta ativa, pausando dicas, feedback, rede e segundo plano. A pontuação vem dos bits de evidência: 100 de primeira sem ajuda, 50 após ajuda/correção. Tentativas repetidas não acumulam. Ao expirar, continuar no modo Normal mantém as respostas aceitas. Recordes são locais, separados por conta e conteúdo; empate usa menor tempo. A recompensa permanece a mesma, validada e deduplicada no servidor.

## Atualização de versões

A investigação encontrou a produção em main e o domínio sparky-english-iota.vercel.app no commit 8c74635e9ce196bb284d97e65654d8b7d45602d5. O alias sparky-english-rafaelterra-webs-projects.vercel.app apontava para um deploy antigo de codex/music-lab, commit a6f240fe01958e621b7a40d7e4eeb7a6fa8d8f57. Os aliases explícitos de branches são previews e não devem ser usados como endereço de produção.

A publicação deve apontar os dois endereços principais ao mesmo deploy. O endereço alternativo passa a redirecionar a página inicial para o domínio canônico. Branches e previews históricos são preservados.

As traduções carregam com uma URL vinculada à versão para evitar textos antigos no cache HTTP. A PWA usa sparky-public-v13, limpa caches antigos ao ativar, avisa abas abertas e mantém navegação pela rede. /api/release não pode ser armazenado por navegador/CDN. A interface compara versões ao abrir, recuperar conexão/foco e periodicamente; aplica a atualização quando não há lição, cadastro, diálogo ou atividade de mídia em andamento. Um marcador por versão evita recargas repetidas. Checkpoints são salvos antes de fechar ou sair de primeiro plano.

## Métricas

/api/learning-events grava snapshots mínimos no Blob privado existente: identificador derivado da conta, UUID de sessão, versão, questão, estado de acertos/erros/ajuda e duração ativa. Não inclui nome, e-mail, resposta escrita, transcrição ou áudio. A coleta não bloqueia o estudo quando falha. Produção, preview e ambiente local têm prefixos separados; o relatório lê apenas produção.

npm run audit:engagement gera um relatório dos últimos 30 dias, por conteúdo e modo, com inícios, conclusões, abandono após 30 minutos, mediana ativa e retorno D1/D7 por dia de São Paulo. A coorte é o primeiro dia ativo observado na janela. Os eventos operacionais não são expostos na interface pública. O relatório só lê o armazenamento.

Não existe histórico de eventos de início/abandono para a versão anterior. A comparação por versão começa com esta coleta. A estimativa de 2–4 minutos precisa ser validada com uso real; testes automatizados não medem o tempo humano de aprendizagem.

## Validação

npm run lint
npm test
npm run audit:curriculum
npm run audit:experience
npm run audit:coverage
npm run build
npm run test:e2e:quick

O Playwright usa o build de produção em uma conta exclusivamente local, sem credenciais de produção nem escrita em Blob, Supabase ou serviços de IA. A suíte cobre Chromium desktop/Android e WebKit iPhone, os seis níveis, teclado, semântica ARIA, texto ampliado, movimento reduzido, inglês, correção, retomada, desafio, revisão, migração, cadastro e atualização segura. A leitura de tela é conferida pela árvore de acessibilidade; não substitui uma sessão manual com NVDA ou VoiceOver.

Validação da entrega: 174 testes unitários e 66 cenários Playwright aprovados, incluindo duas lições completas de cada nível em desktop, Android e iPhone. Lint, auditorias editoriais/de experiência/cobertura e build de produção aprovados.
