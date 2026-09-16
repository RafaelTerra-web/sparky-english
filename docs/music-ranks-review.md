# Letra contínua, ranks e conquistas

## Letra e refrão

O jogo usa uma única camada de letra, com linhas e palavras identificadas de forma estável. A palavra-alvo recebe uma máscara absoluta; seu texto mantém a largura original e fica oculto visualmente e da árvore de acessibilidade. Responder revela a palavra no mesmo elemento, sem trocar fonte, tamanho ou geometria da frase. Se a música avança enquanto uma resposta está pendente, a pergunta continua na linha anterior e a letra atual segue abaixo.

As partículas do refrão usam o relógio corrigido do áudio, assim como as palavras e a intensidade visual. Pausar congela suas posições; seek e velocidade acompanham o mesmo relógio. O refrão também aumenta o brilho e o tamanho das partículas 3D. Movimento reduzido remove partículas móveis e mantém uma iluminação estática. O áudio e os quatro arquivos privados de catálogo/reprodução permanecem inalterados.

## Pontos e ranks

Cada acerto vale 100 pontos; erros não retiram pontos. O total da partida é derivado dos acertos aceitos pelo reducer, que já impede tentativas duplicadas. Não há moeda de loja nem recompensa financeira associada. Cada partida mantém 24 perguntas, pontuação máxima de 2.400 e sua dificuldade indicada.

| Rank | Pontuação mínima |
| --- | ---: |
| E | 0 |
| D | 500 |
| C | 1.000 |
| B | 1.500 |
| A | 1.900 |
| A+ | 2.200 |
| S | 2.400 |

Recordes de acertos, sequência e resultado concluído são separados por música e dificuldade. O placar ao vivo mostra pontos da partida; a aba Conquistas mostra recordes. As sete conquistas cobrem primeiro acerto, 5/10 seguidos, conclusão, rank A, partida perfeita e 12 acertos em Sem pistas. As conquistas de conclusão só são liberadas quando a música termina.

## Persistência e compatibilidade

`MusicProgress.performance` é um campo adicional no JSON existente: não exige migração de tabela. Campos antigos, palavras salvas, respostas e histórico de prática continuam preservados. Progresso anterior recebe recordes vazios; escritas de clientes antigos não apagam recordes já existentes. A mesclagem usa máximos por dificuldade, sem somar snapshots e sem duplicar pontos. A API rejeita contagens impossíveis e mantém a revisão otimista e a separação por conta/faixa.

Os resultados permanecem no navegador imediatamente e seguem a sincronização existente com a conta; a conclusão tenta sincronizar de imediato. A aba Conquistas mostra o status do salvamento. Estes são recordes pessoais, sem classificação competitiva entre usuários.

A etapa Minha voz, gravação, consentimento de microfone e exercício final associado foram retirados do Music Lab. O resultado agora leva a recordes/conquistas ou a outra partida. A remoção não afeta as atividades de voz do restante do curso, nem apaga dados antigos.

## Verificações

- 156 testes unitários: limites dos ranks, acerto único, mesclagem idempotente, dados inválidos, progresso antigo e retenção de pergunta anterior.
- `smoke-music-ranks.mjs`: largura e identidade do elemento antes/depois da resposta, +100 por acerto, rejeição de pontuação inválida, S com 24/24, seis conquistas, persistência e reabertura, partículas pausadas e movimento reduzido. Executa somente no laboratório local porque grava conquistas de teste.
- Smokes de sala, jogo completo, letra, remaster, duas faixas e API autenticada; TypeScript, ESLint e build.
- Capturas em `.music-lab/ranks-review/`. Validação autenticada usa o laboratório isolado; a produção segue sem sessão autenticada disponível para esse smoke.
