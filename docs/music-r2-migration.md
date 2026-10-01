# Musify: armazenamento privado no Cloudflare R2

## Arquitetura

O app e as APIs continuam no Vercel. `SPARKY_MUSIC_STORAGE=r2` seleciona o novo provedor sem fallback automático para o Blob suspenso. As APIs de áudio/vídeo autenticam a conta e validam o ID da música antes de responder com um redirecionamento 307 para um GET assinado de 30 minutos. O navegador recebe os bytes e faz requisições Range diretamente ao R2. Nenhum arquivo fica público e nenhuma chave chega ao cliente.

O catálogo lê apenas os manifestos aprovados, conferindo SHA-256 e tamanho. Leituras bem-sucedidas ficam em memória por dez minutos; falhas são descartadas para permitir nova tentativa. O player guarda a URL interna autenticada e a posição; “Tentar novamente” obtém um novo link temporário e mantém o desafio. Falha do vídeo mantém a arte e a animação disponíveis.

As 11 músicas mantêm seus IDs, versões, progresso, transcrições e identidades do Musify 1.2. Os seis arquivos de vídeo em 900p permanecem no conjunto aprovado. Os 40 arquivos privados somam 894.405.161 bytes; não são adicionados ao Git nem ao build.

## Configuração e transferência

1. Ativar R2 Standard na conta Cloudflare. Criar o bucket privado `sparky-reviewed-music`, sem domínio público nem `r2.dev`. A cobrança segue consumo; alertas não impõem teto.
2. Preparar uma credencial temporária de migração no bucket. Usar uma credencial administrativa apenas na preparação do bucket/CORS e uma credencial de objetos com leitura/escrita na transferência. As variáveis `R2_UPLOAD_ACCESS_KEY_ID` e `R2_UPLOAD_SECRET_ACCESS_KEY` ficam apenas num arquivo local ignorado e devem ser revogadas ao terminar. Não configurar essas duas variáveis no Vercel.
3. Configurar `R2_ACCOUNT_ID`, `R2_BUCKET` e `SPARKY_MUSIC_ALLOWED_ORIGINS` com as origens HTTPS exatas da produção e do preview. Não usar `*`.
4. Conferir o pacote local: `npm run music:r2:plan`. Transferir exclusivamente os arquivos da lista aprovada em `.music-assets`; não depender da leitura do Blob suspenso.
5. Preparar bucket/CORS com `node --env-file=tmp/.env.r2-migration scripts/migrate-music-r2.mjs --prepare-bucket` e transferir com o mesmo comando seguido de `--upload`. Se o bucket e o CORS já foram preparados no painel, executar apenas o upload.
6. Cada upload usa criação condicional, MD5 de transporte e SHA-256 no metadado. A migração baixa o objeto uma vez e compara o conteúdo integral. Só então registra tamanho, SHA-256, ETag, chave, conta, bucket e data de verificação. Retomadas usam o estado ignorado `.music-assets/r2-migration-state.json`; não substituem objetos divergentes.
7. Ao terminar os 40 arquivos, versionar `config/music-r2-receipt.json`. Esse recibo contém somente metadados de integridade. Não inventar recibos nem regenerar hashes para contornar uma divergência.
8. Criar uma chave separada com **Object Read only**, restrita ao bucket, para `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY`. Configurar no preview do Vercel junto de `R2_ACCOUNT_ID`, `R2_BUCKET` e `SPARKY_MUSIC_STORAGE=r2`.

O script aceita os dados de uma conta somente pelo endpoint oficial derivado do Account ID; não admite um endpoint externo arbitrário. Um erro de configuração ou transferência não troca o provedor em produção.

## Verificação e publicação

`node --env-file=tmp/.env.r2-runtime scripts/verify-music-release.mjs --r2` usa 40 HEADs para comparar o recibo e os metadados/ETags reais. Os builds R2 executam essa mesma conferência, sem baixar vídeos ou áudios. Um recibo incompleto, de outra conta/bucket, um objeto ausente ou uma alteração de conteúdo bloqueia o build.

Antes do corte:

- Conferir no painel que domínio público e `r2.dev` estão desativados.
- Testar no preview as 11 entradas do catálogo, GET autenticado, Range de áudio/vídeo, expiração e renovação, CORS das origens aprovadas e rejeição de outras origens.
- Conferir que GET anônimo retorna 401 e um ID desconhecido retorna 404; uma falha do armazenamento retorna 503 sem detalhes de credenciais.
- Executar lint, TypeScript, testes, build e Playwright. Publicar o commit verificado pelo fluxo GitHub/Vercel existente e conferir o SHA do domínio principal.
- Configurar alertas de cobrança de US$ 1 e US$ 5. Eles enviam avisos, sem pausar o serviço ou impor limite de gasto.
- Revogar credenciais temporárias e remover arquivos locais de credenciais de migração após a verificação. Preservar a cópia privada local e o Blob durante a transição.

Uma reversão exige selecionar explicitamente o provedor anterior **e confirmar que ele está operacional**. O Blob suspenso não é um fallback utilizável. Não apagar os arquivos anteriores para publicar esta migração.

## Estimativa de consumo

Hipótese: 10 mil reproduções completas/mês, 30 leituras Class B por reprodução incluindo Range e catálogo, pacote inferior a 1 GB e uma transferência inicial de 40 arquivos. Isso fica dentro da franquia Standard de 10 GB-mês, 1 milhão Class A e 10 milhões Class B, resultando em estimativa de US$ 0/mês. A quantidade real de Range depende dos aparelhos, rede e retomadas; acompanhar métricas após o corte. Não é uma garantia de custo zero.

Fontes oficiais consultadas em 01/10/2026: [preços R2](https://developers.cloudflare.com/r2/pricing/), [GETs temporários](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [CORS](https://developers.cloudflare.com/r2/buckets/cors/) e [alertas de orçamento](https://developers.cloudflare.com/billing/manage/budget-alerts/).
