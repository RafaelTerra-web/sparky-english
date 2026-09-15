# Revisão da remasterização musical

Base: `origin/codex/music-lab`, commits `2ae726b` e `15fc6cd`.

## Interface

- Capa e biblioteca reutilizam a arte aprovada do Sparky. A capa tem movimento lento somente durante a reprodução, um indicador decorativo de ritmo e progresso da faixa.
- Contagem, entrada da frase e confirmação de resposta têm animações curtas sem alterar a geometria dos controles.
- Lyrics ambientais mostram até três linhas já iniciadas pelo relógio corrigido, com opacidade de 30%, sem palavra destacada e sem interação. Não antecipam a próxima linha. Mantêm a última linha nas pausas instrumentais e acompanham seeks para trás.
- O fundo aparece enquanto se aguarda o próximo desafio, depois da resposta e no final instrumental. Durante contagem e resposta ele não fornece pistas.
- A transcrição decorativa está fora da árvore de acessibilidade. A aba Letra mantém a versão interativa. Movimento reduzido desliga todas as novas animações.
- A sala acompanha `visualViewport` e usa uma composição compacta quando o teclado reduz a área visível, inclusive em navegadores que mantêm a altura do layout.

Não foram alterados o motor das 24 rodadas, timestamps, volume, velocidades, IDs, versão do conteúdo, esquema do progresso ou remoção do Caderno.

## Revisão do relatório de alinhamento

Esta é uma **revisão dos dados e do método**, não aprovação por escuta do áudio. O áudio original foi localizado em Downloads e o bundle foi recuperado da versão aprovada na Vercel. O MP3 publicado mantém os mesmos bytes e volume dessa versão.

O relatório contém 49 linhas, 285 palavras, zero divergências de tokens e 58 palavras com algum limite divergente em mais de 300 ms. Medianas de início e fim: −20 ms. O maior desvio absoluto é 6,87 s.

O script força o alinhamento do texto conhecido em janelas recortadas entre linhas. A correspondência de tokens confirma a compatibilidade do alinhamento, mas não é uma transcrição independente que comprove o instante da voz. Palavras nas bordas podem absorver silêncio ou música instrumental.

| Linha / palavra | Intervalo vigente, s | Proposta do alinhador, s | Avaliação |
| --- | --- | --- | --- |
| full-41 / Baby | 207,60–208,86 | 200,73–207,23 | Início exatamente no limite esquerdo da janela (200,73). Forte indício de absorção do intervalo instrumental; não aplicar. |
| full-40 / tonight | 192,50–193,86 | 192,20–198,54 | Fim estendido 4,68 s no intervalo anterior à próxima linha. Precisa de escuta isolada de voz e instrumental. |
| verse-1 / I | 3,046–3,227 | 0,00–3,08 | Início cravado em zero, abrangendo a introdução. Não aplicar automaticamente. |
| full-20 / Well | 98,24–99,20 | 96,53–101,37 | Início igual à borda da janela; duração proposta de 4,84 s. Revisar com áudio. |
| verse-1 / love → for | 3,708–6,113 → 6,113–7,255 | 3,72–4,28 → 4,28–6,42 | Redistribuição de vogal sustentada entre palavras. Mudaria a abertura de respostas; requer revisão auditiva. |
| full-29 / time | 143,90–145,84 | 143,88–144,48 | Início praticamente igual, fim encurtado em 1,36 s. Possível diferença entre fim da voz e retenção visual da palavra. |
| full-33 / I'm | 161,76–163,84 | 162,02–165,06 | Fim estendido sobre a lacuna anterior a “Dancing”. Revisar antes de mexer nas janelas de resposta. |

**Decisão:** nenhum timestamp alterado. A mediana pequena não justifica deslocamento global, e os maiores desvios têm sinais de erro de fronteira. Próxima revisão auditiva: 188–214 s, 0–9 s, 96–104 s, 138–146 s e 160–168 s, usando o áudio aprovado e comparação A/B sem sobrescrever o manifesto.

## Validação e limites

- `npm test`: 145 testes; inclui regressões da linha ambiental em limites, silêncio, seek, pausa, velocidades e ajuste de latência, além da sequência diária e migrações da loja.
- TypeScript, ESLint e build otimizada verificados.
- `smoke-music-room.mjs` e `smoke-music-full.mjs`: executados novamente com a faixa real de 263,407 s, 49 linhas e 127 vocábulos. Conferem todas as linhas, 24 desafios, 1.000 agendas no smoke, áudio contínuo e geometria mobile.
- `smoke-music-remaster.mjs`: verifica ausência de pistas durante desafios, fundo após resposta e no outro, seeks em 1×/0,75×/0,5×, pausa, movimento reduzido, 320×568, 390×844, 430×932, desktop e duas formas de redução da área visível no typing. O teclado do sistema ainda requer um dispositivo real.
- `smoke-music-authenticated.mjs`: verifica versão, 49 linhas, 285 palavras, 127 vocábulos, Range 206 e escrita/leitura do progresso. A escrita reenvia o estado existente; apenas a revisão muda. Fixture sintético exige opt-in explícito e só é aceito em loopback.
- 12 testes de navegador passaram após integrar `origin/main`: foguinho, marcos, movimento reduzido, contraste da loja, migração do guarda-roupa, navegação, abertura de lições e separação dos idiomas. As APIs de conta desses testes são fixtures; o smoke musical usa o backend isolado local.

## Retomada com a faixa real e candidato

O pacote `.music-assets/manifest.json` e `.music-assets/audio.mp3` foi recuperado de `dpl_A19hmuaCfqY5UHqqtt2mj9mwHWzv`, sem regenerar o áudio publicado. `scripts/verify-music-release.mjs` verifica seus SHA-256 no prebuild da Vercel e impede deploys com pacote ausente ou diferente do aprovado. Os arquivos privados continuam fora do Git e entram somente no upload autorizado da release. Um deploy disparado apenas pelo Git falhará até receber esse pacote.

Foram integrados os 12 commits de `origin/main` até `8195385`, restaurando o foguinho, as celebrações, o guarda-roupa e melhorias de navegação. O Caderno permanece removido. Bits antigos de compras, progresso musical e identificadores foram preservados.

Na revisão adicional de 15/09, o histórico remoto não apresentou outras features faltantes. Login Google, onboarding, arquivos de performance, estilos e assets da loja e componente do foguinho coincidem com a versão mais recente da `main`. Passaram mais três verificações de navegador de aparência e performance no desktop/Android. A inspeção do login real revelou que o botão Google não acompanhava reduções de largura; um `ResizeObserver` agora redesenha somente o botão, preservando a preparação de autenticação e o foco. A regressão passou em desktop e Android.

Os smokes aceitam `MUSIC_BASE_URL` e `MUSIC_STORAGE_STATE` (caminho local de uma sessão Playwright já autorizada). Nenhum script obtém cookies do perfil pessoal, cria sessão de produção ou contorna a proteção da Vercel. Não versionar arquivos de sessão.

O usuário autorizou posteriormente a promoção direta após a revisão, mesmo sem a sessão de teste. A validação pública de produção confere login, configuração Google, assets restaurados e proteção dos endpoints. O smoke autenticado remoto e o teclado nativo continuam sem validação; os resultados do laboratório não devem ser apresentados como autenticação real em produção. A build sem o bundle continua bloqueada.
