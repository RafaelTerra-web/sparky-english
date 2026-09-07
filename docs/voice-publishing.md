# Publicação das vozes

Sparky usa Cedar no GPT-4o Mini TTS; Pinky usa Nova no `tts-1-hd`. O modelo HD não aceita instruções de estilo, portanto o perfil da Pinky fixa modelo e voz sem enviar esse campo. O aluno ouve arquivos publicados; suas transcrições nunca se tornam entrada do TTS. Os perfis fixos estão em `src/lib/voice-config.ts`. A interface informa que a voz é gerada por IA.

## Preparação e custo

O pacote publicado contém 336 exemplos (168 lições × 2 mascotes), com duração decodificada total de 16,78 minutos e 15,36 MiB. Isso não inclui a narração integral de leituras e explicações. Repetições do mesmo arquivo não geram novas chamadas de TTS; armazenamento e tráfego seguem o plano de hospedagem. O [GPT-4o Mini TTS](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts) é cobrado por tokens de texto e áudio; o [`tts-1-hd`](https://developers.openai.com/api/docs/models/tts-1-hd) custa US$ 30 por milhão de caracteres.

`OPENAI_API_KEY` é necessária apenas no processo administrativo de geração. Não use prefixo `NEXT_PUBLIC_`, não registre a chave no código e não coloque geração automática na build. O site em produção pode reproduzir os arquivos sem a chave. Se a chave estiver no Vercel, use o gerenciamento seguro de variáveis para disponibilizá-la ao processo administrativo, sem colá-la em logs ou conversas.

## Gerar e revisar

1. Execute `npm run voice:generate -- --limit=1000` para simular a fila sem custo.
2. Com a chave no ambiente do processo, execute `npm run voice:generate -- --generate --limit=2` para gerar o primeiro exemplo nas duas vozes.
3. Escute os arquivos em `public/audio/mascots/`: confira texto exato, pronúncia de Ana, naturalidade, volume e ausência de comentários extras. Ajuste os perfis se necessário antes do lote completo.
4. Execute `npm run voice:generate -- --generate --limit=1000`. Use `--mascot=pinky` ou `--mascot=sparky` para limitar a fila. Interrupções preservam cada arquivo já gerado. O hash inclui texto, modelo, voz e as instruções quando o modelo as aceita; mudanças criam arquivos novos.
5. Rode `node scripts/prune-voice-assets.mjs` para inspecionar arquivos fora do manifesto e acrescente `--apply` somente depois da revisão.
6. Revise amostras de todos os níveis, rode lint/build/testes e publique os MP3 junto de `src/lib/content/voice-manifest.json`.

O comando sem `--generate` nunca chama a API. `--concurrency=3` permite até três requisições simultâneas (máximo quatro). Arquivos e manifesto são gravados atomicamente; a primeira falha impede iniciar novos itens, preservando respostas já recebidas. Não há repetição automática de chamadas com resultado desconhecido. A interface explica a ausência de áudio se um arquivo ainda não tiver sido publicado. Não há fallback para voz do sistema nem controles de personalização vocal.

`node scripts/audit-voice-assets.mjs` usa Playwright para decodificar todos os arquivos, medir duração e verificar silêncio/saturação, sem chamadas pagas. Usa as mesmas variáveis `PLAYWRIGHT_MODULE_PATH` e `PLAYWRIGHT_CHANNEL` do smoke de interface.

`node scripts/check-voice-transcripts.mjs` simula a fila de conferência de conteúdo. Com `--check` e chave no processo, transcreve os áudios gerados usando GPT-4o Mini Transcribe, sem informar a resposta esperada ao modelo. É uma operação administrativa paga, separada do reconhecimento do aluno. `--recheck --model=gpt-4o-transcribe` confere novamente apenas divergências. Os resultados ficam em `.voice-qa/`, ignorados pelo Git, e são reutilizados. A conferência textual e a análise do sinal não substituem avaliação humana de naturalidade e timbre.

## Reconhecimento

A comparação aceita apenas variantes cadastradas de nomes capitalizados na frase-alvo. Exemplo: “Hi, I'm Anna” corresponde a “Hi, I'm Ana”. Também normaliza contrações condicionadas ao alvo e grafias britânicas/americanas conhecidas. Não usa similaridade genérica para aprovar frases: palavras extras, inversões e negações continuam diferenças. Alternativas do reconhecedor são analisadas como frases completas. A lista de variantes pode crescer com casos reais, acompanhados por testes de aceitação e rejeição.

O serviço ainda depende da Web Speech API e de sua disponibilidade. A transcrição não permite provar quem falou, detectar toda brincadeira ou avaliar pronúncia. Por isso esta prática não concede recompensas nem serve como avaliação de proficiência.
