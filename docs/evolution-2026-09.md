# Evolução de setembro de 2026

Esta entrega implementa a fundação de estudo do roadmap sem substituir o curso existente. Mantém as 114 lições, o login Google privado e o guarda-roupa.

## Comportamento entregue

- Os 108 novos rascunhos editoriais têm IDs explícitos. Os seis IDs anteriores permanecem. `content/ledger.ts` congela as posições do cookie publicado: acrescente IDs no fim; nunca reordene, remova ou reutilize posições. A ordem do catálogo não identifica progresso.
- O player, o catálogo e o Caderno são módulos carregados sob demanda. O catálogo de conteúdo ainda entra no bundle compartilhado; esta é uma extração incremental, não a conclusão de toda a otimização de conteúdo.
- A etapa, a resposta em andamento e o texto são salvos por conta no dispositivo. A home prioriza retomada, depois revisões vencidas e depois a próxima lição. Uma validação expirada exige refazer exercícios; textos salvos permanecem.
- `/api/study` verifica exercícios fechados na ordem, registra erros/ajuda no comprovante criptografado e vincula a prática à conta, lição, modalidade e versão. `/api/rewards` exige esse comprovante para concluir. O comprovante dura até oito horas; revisões precisam ter começado no mesmo dia de São Paulo. Isso verifica o fluxo; não é um sistema antifraude para avaliações certificadas, pois os conteúdos e gabaritos são públicos no cliente.
- O Caderno mantém até 600 tentativas, 100 versões de escrita e 200 frases, com exportação e exclusão local. O laboratório mostra a última tentativa que errou ou usou apoio. Escrita livre tem auto-revisão e versões, sem uma nota inventada por comparação textual.
- Revisões vencidas evoluem em 1, 3, 7, 14 e 30 dias conforme os acertos sem erros/ajuda daquela prática. Apoio ou erro retorna a um dia; moedas não são descontadas. Recompensas seguem limitadas a dez revisões diárias; as demais ainda atualizam a agenda. O agendamento continua por lição e usa exercícios já conhecidos, não comprova transferência para contextos inéditos.
- A área móvel reserva espaço para o mascote, usa modal de altura dinâmica, uma região de rolagem, botão de fechar de 44 px, foco restaurado e erros dentro do modal. Voz começa com o mascote selecionado; ajustes ficam recolhidos. Microfone continua opcional e nunca inicia sozinho.

## Persistência e banco

O modo padrão preserva o cookie criptografado existente para conclusões, moedas e roupas. Rascunhos, tentativas e frases ficam no armazenamento local por conta, inclusive após logout. Pessoas com acesso ao mesmo perfil do navegador podem inspecionar esse armazenamento; o app explica isso e oferece exclusão. Não coloque informações sensíveis nos textos.

As mutações de recompensas usam Web Locks entre abas quando o navegador suporta. Sem banco, clientes que não usam essa trava ainda podem sobrescrever cookies; o cookie não fornece uma transação global.

O adaptador opcional de Supabase usa acesso exclusivo do servidor e uma chave derivada de `google:sub`, sem confundir a sessão Google com uma sessão Supabase Auth. A migração cria `sparky_account_progress`, revoga acesso de `anon`/`authenticated`, restringe atualizações de tabelas legadas e persiste recompensas com comparação de revisão. Conflitos retornam 409; indisponibilidade retorna 503, sem substituir progresso por um estado vazio.

Para ativar em um projeto Supabase existente:

1. Aplicar a migração inicial, se ainda não aplicada, e `20260905000100_durable_google_progress.sql`.
2. Configurar `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente nos ambientes apropriados do Vercel; nunca expor a chave administrativa ao cliente.
3. Testar duas contas, importação do cookie e compras simultâneas em ambiente isolado.
4. Definir `SPARKY_DURABLE_PROGRESS=true`, publicar e confirmar “Conclusões e recompensas sincronizadas na conta” no Perfil. O primeiro acesso importa o cookie apenas se a conta ainda não tiver estado. A fonte passa a ser o banco; cookies antigos não substituem registros existentes.

Este adaptador sincroniza conclusões/recompensas, não textos e tentativas. A ativação exige um banco provisionado e credenciais; não habilitar a flag antes disso. Planejar backup e exportação da base antes de ativar. Não retornar ao modo cookie após novas alterações no banco sem planejar a migração reversa, porque os cookies antigos estarão desatualizados.

## Validação

`npm test`, `npm run lint`, `npm run build`, `npm run audit:curriculum`, `npm audit --omit=dev`. Após build, `node scripts/preview-fixture.mjs` inicia uma conta fictícia exclusiva em localhost. `node scripts/smoke-study.mjs` exercita os endpoints reais pelo proxy; `node scripts/smoke-auth.mjs http://localhost:3200` verifica a proteção sem autenticação. O fixture recusa Vercel e não integra a aplicação publicada.

## Próximas etapas do roadmap

Não foram apresentados como ativos: sincronização de textos/tentativas, avaliação de escrita por IA, conversa com IA, avaliação fonética, áudios humanos gravados, diagnóstico CEFR validado, conteúdo B2/C1/C2, variantes inéditas de revisão e operações editoriais multiusuário. Exigem banco/serviço de IA ou acervo, rubricas, consentimento, limites de custo, avaliação pedagógica e testes próprios. A infraestrutura local desta entrega dá continuidade ao trabalho sem prometer capacidades que não estão conectadas.
