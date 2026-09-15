# Backend da Call com Qwen

## Contrato

Todas as mutações usam sessão Google, `Origin` igual ao site e um header
`Idempotency-Key` único (UUID recomendado).

- `POST /api/call`, JSON `{ action: "start", level?, locale?, mascot?, topic? }`
  retorna `sessionId`, `objectives`, `openingTurn` e `revision`.
- `POST /api/call`, multipart com `sessionId` e `audio` retorna
  `learnerTranscript`, `assistantTurn`, `objectives`, `feedback` e `revision`.
- `POST /api/call`, JSON `{ action: "end", sessionId }` retorna o resumo.
- `GET /api/call?sessionId=...` retoma a sessão da mesma conta.

O áudio do aluno deve ser WAV mono PCM 16-bit a 16 kHz, entre 1 e 45 segundos,
com no máximo 1,5 MB. O navegador deve converter o fluxo do microfone para esse
formato. A resposta de áudio é WAV PCM a 24 kHz em Base64.

## Provedores e segurança

O pipeline fixo é `qwen3-asr-flash-realtime` → `qwen3.8-flash` →
`qwen3-tts-flash-realtime`. A conexão Realtime ocorre no servidor e a chave
`DASHSCOPE_API_KEY` nunca chega ao navegador. Use uma chave de região Singapura
e, de preferência, preencha `DASHSCOPE_WORKSPACE_ID` para o domínio dedicado.

O Qwen 3.8 Flash é solicitado em JSON Object; o contrato completo vai no prompt,
há no máximo uma tentativa de reparo e toda saída passa por Zod. Áudio, texto do aluno e
histórico são tratados como entrada não confiável. O modelo não pode mudar o
nível do aluno, emitir certificado ou avaliar pronúncia pelo transcript. Falhas
do provedor retornam indisponibilidade e nunca aprovam, reprovam ou alteram o
progresso.

A migração `20260911000100_calls.sql` cria tabelas privadas, RLS sem políticas
para clientes, funções exclusivas do `service_role`, limite por minuto, limite
diário de 20 Calls e expiração. Transcrições sustentam a retomada apenas durante
a sessão e são apagadas ao encerrar por padrão. Para retenção maior, é necessário
consentimento e atualização da política de privacidade antes de definir
`SPARKY_CALL_STORE_TRANSCRIPTS=true`.

## Desenvolvimento

`SPARKY_CALL_MOCK=true` habilita respostas determinísticas somente fora de
Production. O mock não sintetiza áudio. Produção falha de forma segura quando
faltam Supabase, migração ou credenciais Qwen.
