# Laboratório de músicas

## Versão integral aprovada para publicação — 14/09/2026

A revisão atual substitui as descrições históricas abaixo: faixa inteira de 263,407 s, 49 versos, 285 ocorrências e 127 entradas de vocabulário com significado, IPA e contexto. O reconhecimento e o alinhamento são locais; traduções e correções editoriais ficam no fixture privado. Os novos tempos são automáticos e ainda podem precisar de ajuste auditivo fino.

Uma semente criptográfica é criada no início de cada partida, fora da renderização inicial. O algoritmo determinístico daquela partida sorteia qualquer posição de palavra e embaralha alternativas. Cada pergunta abre após o fim acústico da palavra e recebe exatamente três segundos de mídia (3 s em 1×, 4 s em 0,75×, 6 s em 0,5×). Perguntas que se sobrepõem entram em fila sem perder prazo. O último verso tem o mesmo tempo; o resultado aguarda o fim instrumental. A faixa fornecida tem espaço suficiente no final para todas as seleções testadas.

Cada ocorrência tem sua própria resposta; o primeiro toque registra acerto ou erro. Erro anima o botão em vermelho durante 420 ms e toca scratch sintetizado suave, respeitando volume/mute. A música não passa pelo grafo do efeito e mantém o ganho aprovado. A aba Palavras permite buscar nas 127 entradas.

`scripts/transcribe-music-local.py` gera a transcrição privada; `scripts/complete-music-fixture.py` aplica revisão e exige cobertura integral do vocabulário. `scripts/package-music-release.py` converte a cópia suave para MP3 (~4,2 MB, pico 0,258), preservando duração, e prepara `.music-assets/`. Essa pasta não entra no Git nem em `public/`: o bundle de servidor serve áudio e catálogo somente após autenticação. A `.vercelignore` inclui apenas esse bundle de publicação e exclui o laboratório/ambiente Python.

Validação atual: `tests/music-session.test.mjs`, `scripts/smoke-music-full.mjs` (1.000 sementes, todas as rodadas, replay, erro, vocabulário e larguras mobile), `scripts/smoke-music-room.mjs` (49 linhas, palavras e reprodução integral), auditoria do manifesto, tipos, lint e build.

Publicação usa o projeto Vercel existente `sparky-english`. A migração `20260914000100_media_progress.sql` deve estar aplicada antes da promoção para preservar progresso na conta. Nunca habilitar `SPARKY_MUSIC_LAB` no servidor publicado.

## Histórico das revisões anteriores

## Jogo contínuo + identidade Sparky (revisão atual)

Esta revisão substitui a pausa entre frases descrita nas versões anteriores. O relógio do áudio avança automaticamente as oito lacunas, com ou sem resposta. A janela abre no início acústico da palavra-alvo e fecha no início da frase seguinte (a última fecha no fim do trecho de teste). Não há seek, replay ou pause automáticos nas transições. No fim dos ~48 segundos, o trecho de teste termina e mostra o resultado. Pausa manual e pausa ao ocultar/sair da aba continuam por segurança; buffering também congela o relógio do jogo.

Respostas antecipadas, atrasadas, repetidas ou destinadas à frase anterior são rejeitadas pelo reducer. A atualização recupera saltos de tempo sem duplicar pontuação. Palavras não acertadas entram na revisão; acertos, acertos de primeira, tentativas e sequência são contagens locais reais, não notas de pronúncia. A digitação limpa seu conteúdo entre frases. Nenhuma alteração no arquivo ou ganho do áudio aprovado.

A interface agora usa as variáveis de cor do próprio app (verde, creme, terracota e cores semânticas), o ícone do Sparky e uma nova ilustração de fones criada com GPT Image. Arquivo, referência e prompt estão em `docs/music-art.md`. Layout e botões continuam mobile-first; a pausa manual está no rodapé do jogo.

Verificação: testes unitários de relógio/limites/placar; teste browser dos oito trechos sem pausas intermediárias, erro/acerto/expiração, pausa manual, digitação, saída e três tamanhos de celular; regressão da escuta livre; TypeScript e lint.

## Interface de jogo a partir da referência (atual)

A entrada da sessão agora é um jogo musical: capa gráfica própria no topo (não um vídeo), lacuna por trecho, alternativas 2×2, repetição, pausa automática ao fim da linha, feedback e resultado real da rodada. Os modos Guiado, Desafio e Sem pistas oferecem respectivamente duas opções, quatro opções e digitação. Alternativas priorizam contrastes de som/forma quando cadastrados. O áudio quiet-v2 e seus ganhos permanecem sem alteração.

A resposta só é habilitada depois do fim da palavra no relógio da mídia. Acertos revelam a palavra; erros permitem nova escuta; avançar exige acertar. O placar conta acertos de primeira, sequência e tentativas extras, sem nota de pronúncia, moedas ou cronômetro fictício. O estado do jogo é desta rodada e reinicia ao sair da aba Jogar; o progresso de estudo existente permanece separado. A versão tem oito trechos locais, não a música completa.

`node scripts/smoke-music-game.mjs` verifica os oito trechos, pausa pelo relógio de áudio, bloqueio antes de ouvir, resposta incorreta/correta, placar, repetição de rodada, digitação, larguras mobile e saída. `tests/music-game.test.mjs` cobre a lógica independente. Não houve implantação nem mudança do áudio aprovado.

## Revisão mobile atual (substitui os detalhes da revisão anterior abaixo)

A sala agora usa uma superfície mobile clara, largura máxima de 480 px, letra com rolagem própria e controles fixos ao alcance do polegar. A navegação de cinco etapas foi substituída por Letra / Palavras / Minha voz. Tradução fica na escuta; volume e compensação de atraso do fone ficam em Ajustes. Exercícios continuam após ouvir, explorar e praticar.

O player não serve mais o MP3 alto: `scripts/prepare-music-audio.py` gera `.music-lab/audio-soft.wav` e `audio-report.json` privados, preservando o original. Atenuação estática de 13,49 dB, RMS 0,055 e pico 0,264, medidos também no áudio decodificado pelo navegador. A rota falha sem a cópia preparada, sem fallback para o MP3. Execute o script novamente ao trocar o áudio de teste. Isso não restaura distorção já presente na gravação.

As oito linhas foram realinhadas com modelo acústico CTC independente (`scripts/align-music-ctc.py`, execução local, somente download de pesos). Inícios de palavra agora vêm do caminho acústico; o destaque permanece até a próxima palavra, evitando apagar durante vogais alongadas. A versão do manifesto invalida posições antigas. Os tempos ainda não receberam aprovação auditiva humana. A compensação de ±1 s nos ajustes é para latência de saída, não substitui correções por palavra.

Branch `codex/music-lab`, worktree `C:/Users/rpta/Documents/SparkyEnglish-music-lab`. A pasta original e produção permanecem intactas.

## Abrir a prévia

Execute `npm run lab:music` nesta pasta. O arquivo local `.music-lab/config.json` aponta para o MP3 já existente em Downloads; também é possível passar o caminho como argumento. Abra http://127.0.0.1:3221 e escolha Músicas. O script cria uma conta fictícia e uma chave de sessão efêmera, remove credenciais de serviços do ambiente filho, recusa `.env.local` e escuta somente no loopback. Não execute como serviço de rede pública.

O catálogo de teste e as marcações estão em `.music-lab/manifest.json`, ignorado pelo Git. O MP3 é lido no caminho original por uma rota autenticada com suporte a Range; não foi copiado. Essa rota e o manifesto privado são desativados fora de desenvolvimento. A execução não aplica migrações nem chama Supabase.

## O que testar

1. Preparar → Ouvir → Explorar → Repetir → Praticar.
2. Clique no tempo da linha, acompanhe palavra/linha, altere velocidade e repita um trecho.
3. Explore vocabulário e revele a tradução sob demanda.
4. Grave até 15 segundos, ouça sua gravação e descarte. O áudio nunca sai da aba. Sem microfone, marque a prática manual.
5. Responda aos exercícios e conclua. Reabra a música para verificar retomada.

O servidor local simula a conta sincronizada com revisão otimista em memória; os registros reiniciam com o servidor, e a cópia local pode reenviá-los. A implementação Supabase e sua migração estão preparadas, mas precisam ser verificadas em projeto de homologação dedicado antes de produção.

## Limitações editoriais desta entrega de testes

O fixture usa somente as oito primeiras linhas de Perfect. A distribuição uniforme foi removida: os tempos agora vêm de transcrição e alinhamento forçado locais (faster-whisper, small.en), com o texto conhecido. A reprodução guiada para no fim do trecho, em 47,26 s; não promete letra para o restante da faixa. O alinhamento automático ainda exige aprovação auditiva/editorial, especialmente nas vogais cantadas. O catálogo publicável fica vazio até inclusão de uma faixa original/licenciada revisada.

## Revisão da sala de escuta

A sessão abre em um dialog modal nativo de tela inteira, com fundo próprio, coluna vertical e navegação do app inerte. Letra, exploração e voz são áreas alternadas; Escape e o botão de saída fecham a sala, interrompem a mídia e restauram foco/rolagem. A etapa visível não é mais sobrescrita pelo maior progresso remoto.

O MP3 decodificado no Chrome apresentou pico de 1,143 e 1.295 amostras acima de 0,999 no canal medido. O player inicia em ganho 0,455 e limita o controle máximo a 0,7 (pico projetado inferior a 0,81). Não há amplificação, alteração do MP3 ou mudança do volume do Windows. Isso cria margem na reprodução, mas não restaura eventual distorção já gravada na fonte.

`scripts/align-music-local.py` é um diagnóstico offline após download do modelo; requer faster-whisper no Python local e o manifesto privado. Não é dependência do aplicativo nem é executado no servidor. Não envia mídia. Os resultados automáticos precisam de inspeção antes de substituir um manifesto.

## Remoção do Caderno

A tela, importação dinâmica, navegação, botões de guardar frases, temas da loja, estilos e ação da API foram removidos nesta branch. Os bits históricos de compras permanecem reservados para preservar as identidades dos outros itens. Não há exclusão de dados de usuários ou alteração do banco de produção. Preferências, tentativas e checkpoints que sustentam a retomada das lições continuam; vocabulário de músicas é consultado dentro de Músicas.

## Verificação

`npm test` (100 testes), `npm run audit:music -- .music-lab/manifest.json`, `npx tsc --noEmit` e ESLint passaram. A build otimizada compilou em `.next-build-check`. `node scripts/smoke-music.mjs` valida a prévia em execução: telas responsivas, autenticação, byte ranges, payload inválido e conflitos. A prévia foi inspecionada em 320, 390, 768 e 1440 px, com sessão completa, retomada e microfone simulado.

Produção depende de aprovação, catálogo revisado e validação da migração em homologação. Não há deploy automático neste laboratório.

Após a revisão visual: `node scripts/smoke-music-room.mjs` verifica modal, ganho, sincronização do relógio com cada linha/palavra cadastrada, larguras 320/390/768/1440, aba de voz, parada no fim do trecho e limpeza ao sair. Esse teste de relógio não substitui a avaliação auditiva da precisão do alinhamento.
