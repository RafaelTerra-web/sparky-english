# Mobile e notificações

## Publicação

O fluxo atual publica pelo GitHub/Vercel e verifica o pacote musical disponível no build. Antes da publicação, rode o build e confira as regras em `scripts/skip-missing-media.mjs` e `scripts/verify-music-release.mjs`; não suponha que um push resultou em publicação. Confirme o SHA do domínio principal em `/api/release`.

## Ativação do Web Push

1. Assinaturas push usam a tabela privada `sparky_media_progress`, criada por `supabase/migrations/20260914000100_media_progress.sql`. Para a central, aplique também `supabase/migrations/20260929000100_notification_center.sql`, após a migração do progresso por conta. Consulte [Central de notificações](notification-center.md) para implantação e ativação da flag.
2. Gere um par VAPID com `npx web-push generate-vapid-keys` e configure `SPARKY_VAPID_PUBLIC_KEY`, `SPARKY_VAPID_PRIVATE_KEY` e `SPARKY_VAPID_SUBJECT` no servidor. Guarde a chave privada apenas como segredo; mantenha o mesmo par entre publicações para não invalidar as assinaturas.
3. Configure `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SPARKY_DURABLE_PROGRESS=true` e `CRON_SECRET`. Após verificar a migração, habilite `SPARKY_NOTIFICATIONS_ENABLED=true`. Os três crons diários rodam às 15h, 19h e 22h UTC; até três eventos diferentes por conta/dia, com uma cópia por aparelho autorizado.
4. Publique em HTTPS. Ao entrar, a pessoa vê um card que explica o lembrete diário. Ao tocar em **Continuar**, o app solicita a permissão ao sistema e registra este aparelho. **Agora não** adia o convite por 30 dias. No iPhone/iPad, instale primeiro a PWA na Tela de Início e abra pelo ícone; o card mostra essa orientação quando necessário. A permissão pode ser revogada nos ajustes do aparelho. Sair da conta cancela a assinatura deste aparelho.

Se as chaves ou o banco não estiverem configurados, o convite não aparece e o app não solicita permissão. A central tem armazenamento independente do VAPID e funciona sem push. Configurações oferecem controles por tipo e desativação geral. O service worker inclui o ID do aviso; o clique marca apenas aquele item e encaminha após autenticação, preservando uma prática em andamento. O texto exibido não inclui nome nem respostas.

## Reprodução e atualização no celular

O Music Lab conserva a música e a posição na sessão do aparelho. Se o iOS reiniciar a PWA, a aba de Músicas e a sessão são reabertas; a reprodução aguarda um novo toque, exigido pelo navegador. Em telas de toque, o palco usa arte CSS no lugar de WebGL e vídeo decorativo, mantendo o áudio e o jogo. O relógio visual atualiza em até cerca de 10 quadros por segundo; o áudio continua no tempo nativo do elemento de mídia.

No Chrome para Android, a página desativa o gesto de atualização do navegador com `overscroll-behavior-y: none`. Um gesto iniciado no topo mostra a animação Sparky e busca os dados atuais sem recarregar o documento nem fechar uma música. O service worker busca navegações na rede e não guarda os blocos JavaScript do app em cache próprio; quando não há rede, mostra a página offline.
