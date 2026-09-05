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

Há 114 lições completas (108 novas e as 6 originais), em 18 módulos: 38 lições por nível A1, A2 e B1. O catálogo oferece busca por conteúdo, filtros de nível e de conclusão. Cada nova lição inclui explicação em PT-BR, exemplo traduzido, vocabulário, cuidado de uso, leitura contextualizada, três exercícios objetivos com feedback, produção escrita opcional e resumo. São 342 exercícios objetivos no total. As referências e os limites editoriais estão em [docs/curriculum.md](docs/curriculum.md).

XP, conclusão, revisão, moedas e roupas são ligados ao usuário Google e persistidos em um cookie HttpOnly criptografado por até um ano no navegador atual. Esse armazenamento compacto impede adulteração pelo JavaScript, mas não sincroniza entre aparelhos e pode ser apagado com os cookies do site. Compras simultâneas em abas diferentes não são recomendadas. O service worker armazena apenas assets públicos e uma página offline, nunca respostas de autenticação ou recompensas. Lições privadas e progresso offline sincronizável ainda não estão disponíveis.

## Voz opcional

Nos exemplos, o aluno pode ouvir a frase em inglês, reduzir a velocidade e praticar com o microfone mediante consentimento explícito. `NEXT_PUBLIC_VOICE_ENABLED=false` desativa a interface na próxima build. A implementação usa Web Speech API do navegador, sem chave de serviço pago. O suporte varia conforme navegador, sistema e vozes instaladas.

Sparky e Pinky têm perfis de altura e velocidade diferentes, com preferência por vozes-base masculinas e femininas quando identificáveis. São aproximações leves de vozes jovens, não vozes infantis neurais exclusivas. O seletor permite escolher outra voz inglesa. Reconhecimento compara palavras transcritas; não mede fonemas, sotaque ou proficiência. Áudio, rascunhos e transcrições não são salvos pelo app. O serviço do navegador pode processar voz remotamente e ter sua própria retenção; a política de privacidade e o consentimento informam essa limitação.

`src/lib/speech.ts` contém o adaptador ao vivo e seu contrato independente de fornecedor. O contrato futuro baseado em arquivos continua em `src/lib/sparky-types.ts`. Para conectar vozes customizadas será necessário escolher e validar um serviço, configurar credenciais no servidor e revisar custos, consentimento e retenção.

## Moedas e mascotes

A primeira conclusão de uma lição concede 10 moedas, terminar um módulo pela primeira vez concede mais 20 e uma revisão vencida concede 2, até dez vezes ao dia. Repetições não geram saldo. O guarda-roupa fica no Perfil, exige confirmação antes da compra e oferece boné, lenço e moletom com compatibilidade por mascote. Itens equipados aparecem também na página inicial e nas lições. Não há dinheiro real, transferência, caixas aleatórias ou penalidade.

Sparky e Pinky são gratuitos. A Pinky usa uma arte original criada para o projeto com o GPT Image, sem antenas e com fundo transparente. A implementação e as limitações da primeira versão estão registradas em [docs/mascots-and-rewards-plan.md](docs/mascots-and-rewards-plan.md).

## Validation

```bash
npm run lint
npm run build
npm test
npm run audit:curriculum
node scripts/smoke-auth.mjs https://sparky-english-iota.vercel.app
```

Após uma build local, `node scripts/preview-fixture.mjs` abre uma conta fictícia em `http://localhost:3201` exclusivamente para inspeção visual local. Esse processo não altera contas Google e não faz parte das rotas publicadas.

O contrato de banco está em `supabase/migrations/20260903000100_sparky_english.sql`. Sua existência não significa que a persistência esteja conectada ao app publicado.
