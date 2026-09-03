# Sparky English

PWA privada de inglês para falantes de português do Brasil. Navegação, instruções e feedback são em PT-BR; exemplos, diálogos e respostas são em inglês. A tradução pode ser consultada durante as lições.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Configure `SPARKY_GOOGLE_CLIENT_ID`, `SPARKY_SESSION_SECRET` (pelo menos 32 bytes aleatórios), `SPARKY_ALLOWED_EMAILS` (e-mails autorizados separados por vírgula) e `NEXT_PUBLIC_SITE_URL`. A lista vazia bloqueia o acesso. O antigo código compartilhado não autentica mais usuários.

No Google Cloud, crie um cliente OAuth do tipo Web com a origem exata do app em “Origens JavaScript autorizadas”. Para o ambiente local, autorize `http://localhost` e `http://localhost:3200`. O login usa Google Identity Services com nonce e validação do ID token no servidor; não precisa de client secret nem de acesso a Gmail, Drive ou contatos. O cookie de sessão usa criptografia autenticada, HttpOnly, SameSite=Lax, Secure em produção e duração de 7 dias. Remover um e-mail da lista revoga o acesso na próxima validação de sessão.

O convite nesta versão consiste na autorização do e-mail pelo administrador. Convites de uso único, persistência em banco e Supabase Auth ainda não estão conectados. As tabelas e os clientes Supabase anteriores foram preservados para essa etapa; a sessão Google atual não deve ser usada como credencial de acesso direto ao Supabase.

Há 6 lições completas, uma por módulo, com conteúdos próprios nos níveis A1–B1. As outras 24 são identificadas como “Em preparação” e não abrem uma lição repetida. XP, conclusão e revisão refletem o estudo desta sessão. O progresso fica em sessionStorage por usuário e é apagado ao sair ou fechar a aba; não há sincronização entre dispositivos ainda. O service worker armazena apenas assets públicos e uma página offline, nunca respostas de autenticação.

## Validation

```bash
npm run lint
npm run build
node --test tests/auth-session.test.mjs
node scripts/smoke-auth.mjs https://sparky-english-iota.vercel.app
```

Após uma build local, `node scripts/preview-fixture.mjs` abre uma conta fictícia em `http://localhost:3201` exclusivamente para inspeção visual local. Esse processo não altera contas Google e não faz parte das rotas publicadas.

O contrato de banco está em `supabase/migrations/20260903000100_sparky_english.sql`. A voz permanece desativada; `src/lib/sparky-types.ts` define a interface para conexão futura.
