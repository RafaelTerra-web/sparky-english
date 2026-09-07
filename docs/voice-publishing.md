# Publicação das vozes

Sparky usa Cedar e Pinky usa Marin no GPT-4o Mini TTS. O aluno ouve arquivos publicados; suas transcrições nunca se tornam entrada do TTS. Os perfis fixos estão em `src/lib/voice-config.ts`. A interface informa que a voz é gerada por IA.

## Preparação e custo

O pacote atual contém 312 exemplos (156 lições × 2 mascotes), cerca de 17 minutos a 140 palavras por minuto. Essa conta não inclui a narração integral de leituras e explicações. Repetições do mesmo arquivo não geram novas chamadas de TTS; armazenamento e tráfego seguem o plano de hospedagem. A estimativa por duração é apenas planejamento: a [cobrança oficial](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts) é por tokens de texto e áudio.

`OPENAI_API_KEY` é necessária apenas no processo administrativo de geração. Não use prefixo `NEXT_PUBLIC_`, não registre a chave no código e não coloque geração automática na build. O site em produção pode reproduzir os arquivos sem a chave. Se a chave estiver no Vercel, use o gerenciamento seguro de variáveis para disponibilizá-la ao processo administrativo, sem colá-la em logs ou conversas.

## Gerar e revisar

1. Execute `npm run voice:generate -- --limit=1000` para simular a fila sem custo.
2. Com a chave no ambiente do processo, execute `npm run voice:generate -- --generate --limit=2` para gerar o primeiro exemplo nas duas vozes.
3. Escute os arquivos em `public/audio/mascots/`: confira texto exato, pronúncia de Ana, naturalidade, volume e ausência de comentários extras. Ajuste os perfis se necessário antes do lote completo.
4. Execute `npm run voice:generate -- --generate --limit=1000`. Interrupções preservam cada arquivo já gerado. O hash inclui texto, modelo, voz e instruções; mudanças criam arquivos novos.
5. Revise amostras de todos os níveis, rode lint/build/testes e publique os MP3 junto de `src/lib/content/voice-manifest.json`.

O comando sem `--generate` nunca chama a API. O manifesto inicialmente vazio é intencional: nenhum áudio foi gerado ou avaliado sem a credencial. A interface mantém o microfone e explica a ausência de áudio. Não há fallback para voz do sistema nem controles de personalização vocal.

## Reconhecimento

A comparação aceita apenas variantes cadastradas de nomes capitalizados na frase-alvo. Exemplo: “Hi, I'm Anna” corresponde a “Hi, I'm Ana”. Não usa similaridade genérica para aprovar frases: palavras extras, inversões e negações continuam diferenças. Alternativas do reconhecedor são analisadas como frases completas. A lista de variantes pode crescer com casos reais, acompanhados por testes de aceitação e rejeição.

O serviço ainda depende da Web Speech API e de sua disponibilidade. A transcrição não permite provar quem falou, detectar toda brincadeira ou avaliar pronúncia. Por isso esta prática não concede recompensas nem serve como avaliação de proficiência.
