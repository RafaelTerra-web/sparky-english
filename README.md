# Sparky English

PWA privada de inglês para falantes de português do Brasil. Navegação, instruções e feedback podem ser usados em PT-BR ou inglês, selecionados no Perfil; exemplos, diálogos e respostas são em inglês. A tradução pode ser consultada durante as lições.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Configure `SPARKY_GOOGLE_CLIENT_ID`, `SPARKY_SESSION_SECRET` (pelo menos 32 bytes aleatórios), `SPARKY_ALLOWED_EMAILS` (e-mails autorizados separados por vírgula) e `NEXT_PUBLIC_SITE_URL`. A lista vazia bloqueia o acesso. O antigo código compartilhado não autentica mais usuários.

`SPARKY_ADDITIONAL_ALLOWED_EMAILS` e `SPARKY_INVITED_EMAILS` acrescentam endereços à lista principal. Use a lista de convites para novas liberações quando as listas antigas estiverem armazenadas como segredos não recuperáveis. Todas as listas usam correspondência exata, ignorando espaços nas extremidades e diferenças entre maiúsculas e minúsculas.

No Google Cloud, crie um cliente OAuth do tipo Web com a origem exata do app em “Origens JavaScript autorizadas”. Para o ambiente local, autorize `http://localhost` e `http://localhost:3200`. O login usa Google Identity Services com nonce e validação do ID token no servidor; não precisa de client secret nem de acesso a Gmail, Drive ou contatos. O cookie de sessão usa criptografia autenticada, HttpOnly, SameSite=Lax, Secure em produção e duração de 7 dias. Remover um e-mail da lista revoga o acesso na próxima validação de sessão.

O convite nesta versão consiste na autorização do e-mail pelo administrador. A sessão Google não é usada como credencial de acesso direto ao Supabase. Se a sincronização de conta for habilitada, o servidor usa uma chave derivada do identificador Google e a chave administrativa fica exclusivamente no ambiente do servidor.

Há 176 lições (170 autorais e as 6 originais), em 31 módulos: 38 lições em A1, 44 em A2, 40 em B1, 14 em B2 e 20 em C1 e C2. O catálogo oferece busca por conteúdo, filtros de nível e de conclusão. Cada lição tem missão, descoberta, escuta antes da revelação, pronúncia, contraste de erros, três exercícios objetivos com feedback e transferência escrita e oral. O curso alterna oito sequências de atividade em vez de repetir uma ordem fixa. São 528 exercícios objetivos. A trilha orienta o estudo até temas C2; sua conclusão não comprova fluência nem cobertura integral do CEFR. As referências e os limites editoriais estão em [docs/curriculum.md](docs/curriculum.md), e o redesenho em [docs/pedagogical-review.md](docs/pedagogical-review.md).

Cada rascunho editorial tem um ID publicado explícito e as posições de progresso ficam congeladas em `src/lib/content/ledger.ts`; não reordene nem reutilize esses IDs. Isso preserva conclusões existentes mesmo se o catálogo mudar de posição.

Conclusões, revisões, moedas e roupas ficam em um cookie HttpOnly criptografado por até um ano no navegador atual. O Caderno mantém neste dispositivo a retomada da lição, tentativas, frases salvas, textos e preferências, separados pela conta. Ele permite exportar ou apagar esses dados locais. O service worker armazena apenas assets públicos e uma página offline, nunca respostas de autenticação ou recompensas.

O aluno precisa concluir os exercícios fechados na ordem para receber a recompensa. As respostas são validadas pelo servidor e um comprovante criptografado de até oito horas é vinculado à conta, à lição e ao modo de prática. Isso protege o fluxo normal do app, mas não transforma conteúdo público em uma avaliação certificada. Revisões independentes usam os intervalos de 3, 7, 14, 30 e 60 dias; uma tentativa com erro ou ajuda volta para três dias. A fila tem no máximo três revisões curtas por dia, intercaladas com lições novas.

Para sincronizar conclusões, revisões, moedas e roupas entre dispositivos, aplique as migrações em `supabase/migrations/`, configure `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor e só então defina `SPARKY_DURABLE_PROGRESS=true`. A migração de setembro revoga o acesso direto de clientes a essa tabela. Teste a migração em ambiente isolado antes de habilitá-la em produção. Textos, tentativas e frases continuam locais nesta entrega.

## Voz opcional

Nos exemplos, o aluno ouve primeiro e pode revelar o texto quando estiver pronto. Nos exemplos e nos microtreinos, Sparky e Pinky oferecem **Ouvir natural** e **Ouvir devagar**; a segunda opção reproduz o mesmo áudio a 75% da velocidade preservando a altura. Depois, o aluno pode fazer shadowing ou praticar com o microfone mediante consentimento explícito. A voz acompanha o mascote equipado; não há seletor livre de voz ou altura. `NEXT_PUBLIC_VOICE_ENABLED=false` desativa a interface na próxima build.

Sparky usa `gpt-4o-mini-tts-2025-12-15` com Cedar; Pinky usa `tts-1-hd` com Nova. As 168 lições possuem as duas vozes: 336 MP3, 16,78 minutos e 15,36 MiB. Os exemplos são gerados administrativamente; ouvir novamente não chama a API. Não há endpoint que aceite texto livre ou transcrição para geração de voz. Os arquivos possuem cache duradouro e nomes derivados do texto e perfil. O site não precisa de chave de API para reproduzi-los. Veja [docs/voice-publishing.md](docs/voice-publishing.md) para gerar e revisar futuras falas.

O reconhecimento usa o serviço do navegador, com no máximo três alternativas completas, limite de 20 segundos, parada explícita e descarte de eventos atrasados. A comparação aceita variantes conhecidas de nomes presentes no alvo, como Ana/Anna e Sara/Sarah, mas preserva ordem, negações e palavras extras. Não é um detector infalível de brincadeiras nem uma nota de pronúncia: não concede moedas ou conclui etapas. O app não grava a fala nem salva transcrições. O serviço do navegador pode processar voz remotamente e ter sua própria retenção; a política de privacidade e o consentimento informam essa limitação.

## Instalação no celular

O site é uma PWA instalável. No Android, o convite usa o diálogo nativo do navegador quando `beforeinstallprompt` está disponível e mantém instruções manuais como alternativa. No iPhone e iPad, o convite orienta o caminho real do Safari: **Compartilhar → Adicionar à Tela de Início → Abrir como App da Web**. O convite desaparece no modo standalone e pode ser dispensado durante a navegação atual.

O manifesto publica ícones próprios do Sparky em 192 e 512 px, uma versão maskable para os recortes do Android e um Apple Touch Icon de 180 px. O app instalado abre em janela própria, respeita as áreas seguras do aparelho e continua recebendo as versões publicadas pelo service worker. Detalhes de implementação e verificação estão em [docs/pwa-installation.md](docs/pwa-installation.md).

## Moedas e mascotes

A primeira conclusão de uma lição concede 10 moedas, terminar um módulo pela primeira vez concede mais 20 e uma revisão vencida concede 2, até três vezes ao dia. Repetições não geram saldo. O guarda-roupa fica no Perfil, exige confirmação antes da compra e oferece boné, lenço e moletom com compatibilidade por mascote. Itens equipados aparecem também na página inicial e nas lições. Não há dinheiro real, transferência, caixas aleatórias ou penalidade.

Sparky e Pinky são gratuitos. A Pinky usa uma arte original criada para o projeto com o GPT Image, sem antenas e com fundo transparente. A implementação e as limitações da primeira versão estão registradas em [docs/mascots-and-rewards-plan.md](docs/mascots-and-rewards-plan.md).

## Validation

A [nova loja e Pinky](docs/shop-and-pinky-2026-09.md) inclui looks integrados, cenários, missões extras e devolução dos acessórios antigos. `node scripts/smoke-shop.mjs` valida esse fluxo no fixture local com Playwright.

A [revisão do produto de 7 de setembro](docs/product-review-2026-09-07.md) registra o novo ícone, as correções de pronúncia, os aquecimentos de memória, os apoios de produção e as próximas lacunas pedagógicas. Para reproduzir os tamanhos do ícone a partir da arte aprovada, execute `node scripts/build-app-icons.mjs`.

```bash
npm run lint
npm run build
npm test
npm run audit:curriculum
npm run audit:experience
node scripts/smoke-auth.mjs https://sparky-english-iota.vercel.app
```

Após uma build local, `node scripts/preview-fixture.mjs` abre uma conta fictícia em `http://localhost:3201` exclusivamente para inspeção visual local. Esse processo não altera contas Google e não faz parte das rotas publicadas.

Com o fixture rodando, `node scripts/smoke-study.mjs` valida o fluxo autenticado de exercícios, proteção CSRF, comprovante de conclusão, persistência por cookie e bloqueio de recompensas duplicadas. A especificação de evolução, migração e limites desta entrega está em [docs/evolution-2026-09.md](docs/evolution-2026-09.md).

`node scripts/smoke-learning-ui.mjs` valida a interface com Playwright instalado: escuta antes da revelação, áudio natural/lento dos dois mascotes, níveis A1–C2, retorno à etapa anterior, revisão com contexto visível, reset de ajuda, variantes de nomes, rejeição de palavras extras, encerramento do microfone e retomada de textos avançados no celular. `PLAYWRIGHT_MODULE_PATH` pode apontar para o módulo `playwright/index.mjs` já instalado; `PLAYWRIGHT_CHANNEL=msedge` permite usar o Edge. O teste usa apenas a conta fictícia local e simula o reconhecedor, sem capturar voz real. Imagens de inspeção ficam em `.next/ui-checks`.

`node scripts/smoke-pwa-install.mjs` simula Safari no iPhone e Chrome no Android. Ele verifica as instruções do iOS, o prompt nativo do Android, a ocultação quando o app já está instalado, manifesto standalone, ícones e cabeçalhos do service worker.

O contrato de banco inicial está em `supabase/migrations/20260903000100_sparky_english.sql`; a sincronização só fica ativa após aplicar também `20260905000100_durable_google_progress.sql` e configurar a flag descrita acima.

A [atualização de 9 de setembro](docs/release-2026-09-09.md) acrescenta nivelamento direto pelo Perfil, preferência de idioma English e seis aulas narradas em inglês pelo Sparky, com visuais próprios e correção da voz da Pinky nos simulados.

## Curso guiado

A trilha, os filtros por disciplina e as recomendações estão documentados em [docs/course-guide.md](docs/course-guide.md). Execute `npm run audit:coverage` para atualizar o mapa de cobertura e verificar as referências pedagógicas.
