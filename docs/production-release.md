# Publicacao em producao

O projeto da Vercel e `rafaelterra-webs-projects/sparky-english`
(`prj_K5rsgA0viDFIwDIAjLT7LMnbQX09`). O plano Hobby limita o upload de
arquivos fonte pela CLI a 100 MB. Por isso, o bundle privado de musica nao e
enviado junto com o codigo: os 11 arquivos aprovados ficam no Vercel Blob
**privado** `sparky-reviewed-music`, sob `reviewed-v1/`. O projeto conectado
recebe `BLOB_READ_WRITE_TOKEN` no servidor. Nunca coloque o bundle ou esse
token no Git, no navegador ou em um store publico.

`scripts/skip-missing-media.mjs` permite o build de commits vindos do GitHub.
Antes do `next build`, `scripts/verify-music-release.mjs` baixa e confere o
SHA-256 de todos os arquivos privados contra a lista aprovada. Um arquivo
ausente ou diferente faz o deploy falhar, mantendo o anterior em producao.
As rotas de audio e video verificam a sessao e emitem URLs privadas de curta
duracao; manifests sao lidos no servidor. Nao remova essa validacao.

Para aprovar uma mudanca de musica, valide o bundle local e envie arquivos
novos para um prefixo versionado no mesmo store, sem sobrescrever os objetos
publicados. Atualize os hashes, o prefixo no codigo e os testes no mesmo PR.
Com o projeto vinculado (`npx vercel link`), a CLI aceita:

```powershell
node scripts/verify-music-release.mjs --required
npx vercel blob put .music-assets/audio.mp3 --pathname reviewed-v2/audio.mp3 --access private
node --env-file=.env.local scripts/verify-music-release.mjs --remote
```

Para um release de codigo, rode `npm ci`, `npm run lint`, `npm test`,
`npm run audit:curriculum`, `npm run build` e os testes Playwright focados.
Confira o PR e os checks do GitHub, una-o a `main` e acompanhe o deployment
da Vercel. Nao use `vercel deploy` com a pasta de midia privada: excede o
limite da CLI e nao corresponde ao commit de `main`.

Depois que o GitHub/Vercel publicar, compare o SHA de `origin/main` com
`https://sparky-english-iota.vercel.app/api/release`, confira
`Cache-Control: private, no-store` em `/`, valide o trailer, uma licao e as
rotas de musica com uma conta autorizada. Se os SHAs nao coincidirem, nao
declare a publicacao concluida: consulte os logs do deployment e o gate dos
blobs antes de qualquer nova tentativa.
