# Onboarding v1

Fluxo obrigatório quando `SPARKY_ONBOARDING_ENABLED=true`: nome, idade e consentimento para menores de 13 anos, mascote, nível manual ou diagnóstico adaptativo, despedida. O perfil pode ser editado posteriormente. Progresso e compras continuam no ledger existente; a função SQL de conclusão atualiza somente o mascote no estado de recompensas.

## Operação

Aplicar as migrações `20260907000300_onboarding.sql` e `20260907000400_onboarding_audio_limit.sql` antes de habilitar. O teste `supabase/tests/onboarding_guards.sql` roda em transação revertida e verifica privilégios, preservação de recompensas e rejeição de conclusão duplicada.

Configuração: Supabase URL/service role, `GEMINI_API_KEY`, `GEMINI_TTS_PROVIDER=vertex`, `CRON_SECRET`, whitelist adicional e flag. Não versionar valores secretos. A chave criada no Google Cloud usa Vertex; o provedor padrão alternativo usa a API Gemini. Ambos mantêm exatamente `gemini-3.1-flash-tts-preview` e Achird, sem substituição automática.

`scripts/prepare-onboarding-deployed.ps1 -Deployment <URL>` prepara oito falas e doze listenings usando uma implantação protegida. O cabeçalho administrativo fica em `.env.onboarding-header.local`, fora do Git e do deploy. A rota administrativa só aceita IDs fixos e exige o segredo de cron. A rota pública serve apenas esse catálogo; nomes de alunos usam uma rota autenticada e cache privado. O manifesto registra modelo, voz, tamanho e hash dos 20 arquivos.

Áudio provisório deixa de ser servido após 24 horas. O cron diário remove arquivos expirados. Nome confirmado permanece até troca ou exclusão das preferências. Recusa do consentimento apaga os dados de personalização, preservando o histórico de estudo.

## Evidência e limites

O diagnóstico contém 72 itens autorais, com seleção de 18–28 itens e cobertura por habilidade. A dificuldade e a confiança são estimativas editoriais ainda sem calibração empírica: o resultado é orientativo, não certificação CEFR. A escolha manual não recebe score artificial.

Testes unitários cobrem validação, projeção pública dos itens, seleção adaptativa e WAV. Playwright cobre desktop, iPhone e Android com APIs simuladas, incluindo falha de voz e retomada. Esses testes não substituem uma sessão real de aluno em produção. Os áudios passam por inspeção automática de formato e transcrição; revisão auditiva humana e validação pedagógica continuam necessárias antes de alegações de validade do nivelamento.

Para validar: `npm run lint`, `npm test`, `npx playwright test`, `npm run build` e auditorias existentes. O script Python de revisão de voz usa faster-whisper e mantém resultados locais em `.voice-qa`, sem dados de alunos.
