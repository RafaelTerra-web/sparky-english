# Central de notificações

A central reúne até 30 dias de lembretes por conta, independentemente da permissão push do aparelho. O histórico começa na implantação; push antigos não são reconstruídos. O sino fica entre moedas e configurações, com contador de não lidas limitado visualmente a `99+`.

## Dados e migração

Aplicar `supabase/migrations/20260929000100_notification_center.sql` **antes** de habilitar `SPARKY_NOTIFICATIONS_ENABLED=true`. A central também exige `SPARKY_DURABLE_PROGRESS=true`, pois as revisões usam o progresso persistido por conta. Ela depende das tabelas de progresso das migrações `20260905000100_durable_google_progress.sql` e `20260914000100_media_progress.sql`. Os registros de assinatura existentes continuam em `sparky_media_progress`; não existe uma migração separada de assinaturas push.

As quatro tabelas novas têm RLS e acesso exclusivo de `service_role`: preferências, resumos operacionais de sessão, avisos e entregas. Funções usam direitos do invocador e não são executáveis por `public`, `anon` ou `authenticated`. Nenhum nome, e-mail, resposta, áudio, rascunho ou recibo criptografado entra nesses registros.

Preferências dos três tipos começam ativas. O consentimento de envio é importado apenas para contas com assinatura existente; eventuais duplicatas antigas de um mesmo endpoint conservam o proprietário com atualização mais recente. A meta local é importada uma única vez, quando a preferência da conta ainda não existe; alterações posteriores usam revisão para evitar sobrescrita concorrente. Lembretes da meta importada começam no próximo dia de Brasília. Não se importa tempo local anterior à implantação.

O tempo ativo vem do relógio atual da prática, limitado ao tempo decorrido no servidor. Não certifica proficiência nem gera recompensa. A conclusão exige o recibo validado e grava recompensa e resumo na mesma transação. Sessões concluídas são terminais; heartbeats anteriores não as reabrem. Conclusões e revisões da trilha contam na meta como antes; Expedições não acrescentam minutos.

## APIs e leitura

`GET /api/notifications` retorna 20 itens, preferências, tempo do dia, contador, snapshot assinado e cursor assinado. Filtros e tokens são vinculados à sessão. `PATCH` aceita abertura do snapshot, leitura individual, preferências, importação inicial e presença. Todas as respostas usam `private, no-store`; alterações exigem origem válida e corpo limitado.

Abrir a central marca todos os itens anteriores ao snapshot, inclusive páginas ainda não carregadas. Inserções e snapshots se serializam por conta; chegadas posteriores conservam o contador. O próximo cursor mantém a mesma fronteira. BroadcastChannel, foco, retorno à rede e polling visível sincronizam abas/aparelhos. Uma falha preserva o último contador e não fecha a prática.

O service worker usa ID e tag por evento. O app confirma o clique antes de abrir seu destino, aguardando autenticação e cadastro. Durante uma prática o destino fica pendente; a lição e seu checkpoint permanecem. Sem checkpoint utilizável, a retomada oferece recomeçar a mesma lição. Versões antigas sem suporte ao protocolo navegam para a URL do aviso.

## Agendamentos e envio

| Tipo | Cron UTC | Janela Brasília | Condição |
| --- | --- | --- | --- |
| Revisão | 15h | 12h–12h59 | Revisões elegíveis da trilha (limite de três) ou Expedições |
| Retomada | 19h | 16h–16h59 | Última lição interrompida, atividade entre uma e sete horas atrás |
| Meta | 22h | 19h–19h59 | Meta configurada e tempo do dia abaixo dela |

São tarefas diárias compatíveis com a precisão do plano [Vercel Hobby](https://vercel.com/docs/cron-jobs/usage-and-pricing). O cron exige `CRON_SECRET`, rejeita horários fora da janela e não envia em deployments preview. Uma restrição única por conta/tipo/dia limita a três eventos lógicos. As condições são recalculadas a partir do progresso persistido antes de cada aparelho. Estudo ativo e atividade nos últimos 15 minutos suprimem criação/envio.

O aviso é persistido antes do push. Uma função adquire atomicamente a entrega por aviso/aparelho; `sending`, `sent` e `uncertain` não podem ser adquiridos novamente. Só rejeições explícitas 429/503 são retryable (máximo três tentativas, intervalo mínimo de um minuto, dentro da janela). Timeout sem resposta e interrupção após aquisição são incertos e não reenviam automaticamente. 404/410 removem a assinatura. A troca de conta de um endpoint é atômica.

A limpeza diária já existente exclui avisos e entregas por cascata após 30 dias, além de resumos operacionais vencidos, mesmo se a flag de envio for pausada depois da implantação. Antes da migração, a rotina ignora a ausência das tabelas. Ela preserva preferências, progresso, compras e moedas.

## Validação e ativação

1. `npm run lint`, `npm test`, `npm run build` e `npm run test:e2e:notifications`.
2. Conferir a migração em preview/banco autorizado: tabelas, RLS, grants, funções e restrições. Os testes SQL usam PostgreSQL WASM isolado e nunca acessam contas reais.
3. Aplicar e verificar a migração no banco configurado. Ativar a flag no preview apenas depois disso, com as variáveis de autenticação/banco adequadas. Crons preview continuam inativos.
4. Publicar o commit validado pelo GitHub/Vercel; ativar a flag em produção e confirmar `/api/release`, domínio principal e API privada. Desabilitar a flag reverte a central/agendamentos sem apagar o histórico ou os dados principais.

Push real depende de um aparelho autorizado, permissão do sistema e disponibilidade do fornecedor. Testes com assinatura simulada não comprovam entrega física.
