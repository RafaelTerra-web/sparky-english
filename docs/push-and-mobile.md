# Mobile e notificações

## Ativação do Web Push

1. Aplique `supabase/migrations/20260924000100_push_subscriptions.sql` no projeto Supabase do Sparky.
2. Gere um par VAPID com `npx web-push generate-vapid-keys` e configure `SPARKY_VAPID_PUBLIC_KEY`, `SPARKY_VAPID_PRIVATE_KEY` e `SPARKY_VAPID_SUBJECT` no servidor. Guarde a chave privada apenas como segredo; mantenha o mesmo par entre publicações para não invalidar as assinaturas.
3. Configure `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET`. O endpoint `/api/push/reminder` exige o segredo do cron e envia no máximo um lembrete a cada 20 horas por aparelho inscrito. O cron está agendado para 15:00 UTC.
4. Publique em HTTPS. No Perfil, o usuário toca em **Permitir notificações** para abrir o diálogo do sistema. No iPhone/iPad, instale primeiro a PWA na Tela de Início e abra pelo ícone. O botão **Desativar notificações** cancela a assinatura deste aparelho. Sair da conta também a cancela.

Se as chaves ou o banco não estiverem configurados, o Perfil informa que notificações estão indisponíveis e não solicita permissão. O service worker recebe o evento push, mostra uma notificação visível e reabre o Sparky ao toque. Os lembretes são genéricos; não incluem dados de progresso ou identidade.

## Reprodução e atualização no celular

O Music Lab conserva a música e a posição na sessão do aparelho. Se o iOS reiniciar a PWA, a aba de Músicas e a sessão são reabertas; a reprodução aguarda um novo toque, exigido pelo navegador. Em telas de toque, o palco usa arte CSS no lugar de WebGL e vídeo decorativo, mantendo o áudio e o jogo. O relógio visual atualiza em até cerca de 10 quadros por segundo; o áudio continua no tempo nativo do elemento de mídia.

No Chrome para Android, a página desativa o gesto de atualização do navegador com `overscroll-behavior-y: none`. Um gesto iniciado no topo mostra a animação Sparky e busca os dados atuais sem recarregar o documento nem fechar uma música. O service worker busca navegações na rede e não guarda os blocos JavaScript do app em cache próprio; quando não há rede, mostra a página offline.
