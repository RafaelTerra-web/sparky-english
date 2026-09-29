# Sparky Economy — operação e medição do piloto

**Piloto encerrado em 29 de setembro de 2026 por solicitação do proprietário.** As Expedições e histórias interativas foram retiradas da interface e suas rotas. Compras antigas recebem reembolso único em moedas; IDs, recibos e progresso ficam somente para migração e histórico. A regra abaixo de manter acesso permanente foi substituída por essa decisão explícita. A retenção dos eventos históricos de 90 dias continua em vigor.

Este documento complementa [sparky-economy.md](sparky-economy.md). Os preços, prazos e cargas de produção abaixo eram **hipóteses de planejamento**, não resultados observados. A antiga flag `SPARKY_ECONOMY_ENABLED` não reativa as Expedições após sua retirada; o relatório histórico não deve ser usado para declarar eficácia educacional sem a comparação de aprendizagem descrita no plano.

## Oferta e orçamento editorial

O catálogo inicial contém duas expedições permanentes de três episódios e um caso curto de um episódio, cada um adaptado a A1–A2, B1–B2 e C1–C2. São **21 versões de episódio** e três prévias gratuitas. A biblioteca, consulta e repetição não geram nova cobrança. Os três pacotes educacionais anteriores permanecem com suas compras e preços próprios.

IDs de ofertas e episódios vendidos formam um registro **append-only**: não reutilizar nem remover seus IDs, versões, metadados de preço pago ou conteúdo necessário para acesso e retomada. Retirar uma oferta da vitrine para novas compras não pode retirar o direito de quem a comprou; a oferta e seus episódios devem continuar resolvíveis para contas proprietárias. Qualquer substituição desse registro exige uma migração explícita dos recibos, direitos e progresso antes da retirada. O estado da conta não deve truncar silenciosamente o histórico conforme o catálogo cresce.

| Entrega | Quantidade | Reserva de autoria/revisão para planejar capacidade |
| --- | ---: | ---: |
| Prévia com promessa concreta e gancho jogável | 3 | 2 h por prévia = 6 h |
| Episódio por família de nível: situação, novidade, escolhas e transferência | 21 | 2 h de autoria + 1 h de revisão linguística + 1 h de gabarito/acessibilidade = 84 h |
| Teste de percurso, retomada, idiomas e variantes | 21 | 0,5 h por versão = 10,5 h |
| **Reserva inicial** | | **100,5 h**, antes de retrabalho, localização de mídia e manutenção |

Registrar horas reais por versão, correções posteriores, custo de áudio/ilustração, consumo por aluno e intervalo entre lançamentos. Reusar personagens, cenários e interface, mas revisar individualmente nuances e respostas aceitáveis. A próxima oferta só entra no calendário quando autoria, revisão independente e QA couberem na capacidade medida. Uma cadência de um caso novo por mês é hipótese para testar após o piloto, não promessa de catálogo ilimitado.

## Hipóteses de preço e esforço

O código atual preserva 10 moedas na primeira conclusão de lição, 20 adicionais ao terminar módulo, 2 por revisão elegível (até três ao dia) e 5 a cada marco de sete dias. O piloto apresenta **30 moedas** para o caso curto e **180 moedas** para uma expedição de três episódios. Os preços não dependem do nível CEFR. Nenhum desses valores altera saldos ou direitos anteriores.

Uma rotina de uma lição nova mais duas revisões elegíveis rende 14 moedas naquele dia: de saldo zero, o caso exigiria ao menos 3 dias e uma expedição ao menos 13. Sem lições novas, mesmo três revisões elegíveis por dia rendem no máximo 6: seriam ao menos 5 e 30 dias, respectivamente, e podem ser mais por falta de revisões disponíveis. O preço de 180 pode ser excessivo para veteranos; a meta de poupança não deve sugerir um prazo que ignore a elegibilidade real. O item de 60 moedas previsto no plano não está neste catálogo inicial.

Reavaliar preço após pelo menos quatro semanas de dados úteis por grupo, considerando desejo pela prévia, objetivo escolhido, tempo até compra, satisfação, recuperação posterior e saldos. Uma baixa taxa de compra exige investigar qualidade, clareza e alcance da oferta antes de elevar ou reduzir preços. Não modificar a emissão, confiscar saldo nem cobrar por erro para atingir uma razão de gasto arbitrária.

## Instrumentação mínima

Após autenticação e validação no servidor, `recordEconomyEvent(userId, event)` registra somente operações concluídas em `economy-v1/{environment}/{YYYY-MM}/{accountHash}/{eventHash}.json` no Vercel Blob **privado**. O `eventId` é UUID estável para a operação lógica; o hash inclui tipo e conta, impedindo duplicata por repetição da mesma gravação. A função retorna `false` quando a coleta está indisponível, sem cancelar compra, conclusão ou revisão. A rota deve aguardar a gravação após a persistência da operação e chamar somente quando houve mudança real. A ausência de Blob será lacuna de observação, não sucesso presumido.

| Evento | Momento | Dados persistidos além de data, ambiente e hash da conta |
| --- | --- | --- |
| `preview` | Prévia autenticada aberta | ID e versão da oferta |
| `goal` | Objetivo alterado | ID/versão da oferta ou `null`, saldo atual |
| `purchase` | Débito e direito persistidos | ID/versão, preço pago, saldo após compra |
| `episode_start` | Sessão criada | Oferta, episódio, família, hash da sessão |
| `episode_finish` | Conclusão validada | Mesmos IDs, aplicação independente sim/não |
| `recall` | Tentativa posterior validada | Mesmos IDs, acerto e confirmação sim/não |
| `satisfaction` | Primeira opinião direta após concluir | Mesmos IDs, sim/não |

Nunca registrar resposta, ordem de tokens, fala, gravação, nome, e-mail, texto livre, endereço IP ou identificador bruto de sessão. O helper reconstrói um objeto de campos permitidos e descarta propriedades extras. A conta é o mesmo hash usado pelo armazenamento existente; isso permite agregar trajetórias sem expor o ID de autenticação. Mesmo hashes são dados pseudônimos e exigem proteção.

O relatório `npm run audit:economy -- --from=2026-09-01 --to=2026-10-01 --environment=production` lê eventos privados com o token administrativo local e imprime **somente agregados**. `--to` é exclusivo. Ele traz prévias, metas, compras, moedas gastas, início/conclusão, aplicação independente, recuperação, satisfação e tempo observado entre escolha de meta e compra. Tabelas por oferta e família com menos de cinco contas são suprimidas. A relação início/conclusão da janela é descritiva: sessões iniciadas antes ou terminadas depois dela podem distorcê-la. Um relato de satisfação ou uma compra não prova aprendizagem.

O relatório não reconstrói sozinho toda a emissão, distribuição de saldos ou grupos iniciante/veterano, porque os eventos só captam saldos em metas e compras. Essas análises exigem um extrato administrativo separado do ledger de recompensas, com as mesmas regras de acesso e agregação. Não apresentar os valores parciais como saldo da economia inteira. Antes de comparar grupos, fixar a definição de elegibilidade e o período de observação; não comparar veteranos sem lições novas com iniciantes que têm lições disponíveis.

## Acesso, retenção e retirada

- O token `BLOB_READ_WRITE_TOKEN` fica apenas no ambiente de servidor/administração. Não há endpoint público para leitura dos eventos. Somente mantenedores responsáveis pelo piloto podem gerar relatórios; não publicar objetos brutos ou hashes em tickets, PRs ou painéis abertos.
- Separar `production`, `preview` e `local` pelo prefixo. Dados de teste não entram nas métricas de produção.
- O prazo de retenção dos eventos brutos é de **90 dias**, com remoção na limpeza diária seguinte, sujeita a atrasos de execução. A rotina já agendada em `/api/onboarding/cleanup` às 04h UTC executa também a retenção Economy quando `VERCEL_ENV=production`, mesmo se a limpeza do banco de onboarding falhar. Ela exige `CRON_SECRET` e o token administrativo de Blob, lista somente `economy-v1/production/` e apaga por lote apenas caminhos completos de eventos válidos com `uploadedAt` anterior a agora menos 90 dias. Não toca nos comprovantes, saldos, conteúdo comprado nem nos ambientes preview/local. A resposta traz apenas contagens `scanned`, `expired`, `deleted`, `failed` e o indicador `complete`; HTTP 503 indica falha ou execução incompleta e exige investigação/reexecução.
- A limpeza manual serve para recuperação operacional e para preview/local: executar uma leitura seca com `npm run prune:economy -- --environment=production --before=AAAA-MM-DD`, onde a data é no máximo hoje menos 90 dias; revisar a contagem e repetir com `--execute`. Trocar o ambiente para preview/local quando necessário. Esse comando só remove objetos sob `economy-v1/{environment}/` anteriores à data e não substitui a limpeza diária de produção.
- Relatórios agregados exportados podem ser mantidos por até **12 meses** em pasta restrita. Não guardar arquivos de eventos brutos baixados localmente após a análise. Um pedido de exclusão da conta exige localizar o hash da conta e excluir seus objetos em todos os meses/ambientes antes do próximo relatório.
- Monitorar o resultado da limpeza diária e corrigir falhas sem esperar a revisão mensal do acesso ao token. Em incidente de exposição, revogar/rotacionar o token e remover cópias indevidas. A retenção é uma regra operacional do piloto e deve ser revisada com a política de privacidade do produto antes de ampliar o público.

## Critérios de revisão do piloto

Avaliar conjuntamente: (1) interesse antes da compra, (2) tempo e esforço até acesso por grupo, (3) conclusão e satisfação, (4) aplicação independente e recuperação posterior, e (5) custo editorial por hora e ritmo de consumo. Repetição gratuita e revisão essencial continuam disponíveis para todos. Definir metas numéricas e desenho de comparação **antes** de analisar resultados; a sugestão de quatro semanas e de comparar o mesmo conteúdo gratuito vs. desbloqueado por moedas ainda não constitui experimento aprovado nem dado observado.
