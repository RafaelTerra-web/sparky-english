# Lições mais legíveis e prática intermediária/avançada

O curso passa de 168 para 176 lições, de 27 para 31 módulos e de 504 para 528 exercícios objetivos. Foram acrescentadas duas lições em cada nível B1, B2, C1 e C2, sem reutilizar IDs ou posições antigas do ledger.

| Nível | Novos contextos | Objetivo comunicativo |
| --- | --- | --- |
| B1 | Atraso e atendimento de um produto com defeito | Explicar um problema, esclarecer detalhes e combinar uma ação |
| B2 | Convivência e roteiro com acessibilidade | Negociar condições, comparar restrições e verificar informações |
| C1 | Pedido indireto e feedback vago | Delimitar responsabilidades e transformar comentários em orientação útil |
| C2 | Pergunta com pressuposto e ironia mal interpretada | Distinguir premissa de preocupação legítima e reparar o efeito de uma fala |

As lições têm contextos autorais com Sparky/Pinky, explicação em português, vocabulário, compreensão contextual, lacuna, montagem de frase, feedback e prática oral opcional. A última lição retoma explicitamente o modelo de ironia de `c2-nuance-02`, aplicando-o à reparação de um mal-entendido; seu diálogo, pergunta e tarefa são novos. Repetição deliberada desse modelo é validada pela referência `exampleFrom`.

A progressão considera recepção e interação, além de precisão gramatical, com referência aos [descritores CEFR do Conselho da Europa](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors). Isso orienta o material; não comprova proficiência, cobertura integral do nível ou validação externa. A avaliação editorial e auditiva por professores continua sendo uma etapa humana desejável antes de fortalecer qualquer alegação de alinhamento.

## Interface e preservação do estudo

- Retirada a tela final de produção escrita do percurso obrigatório. O encerramento é breve e não pede anotações no Caderno.
- Produção oral fica disponível, opcionalmente, durante a prática de pronúncia. Os textos pedagógicos de produção permanecem no currículo para uso futuro.
- Enunciados objetivos com 22–26 px, peso 700, contraste dos tokens do tema e quebra segura de linhas; alternativas com 18–21 px.
- “Consultar explicação e vocabulário” aparece depois das alternativas ou do banco de palavras. Abrir a explicação continua registrando ajuda.
- `lessonFlowVersion: 2` remapeia checkpoints, histórico e posição máxima ao retirar a tela. Mantém recibos de avaliação, tentativas, rascunhos, progresso e compras. Não altera a ordem dos exercícios avaliados.
- Estimativas de tempo deixam de incluir o rascunho opcional removido. Os novos módulos reutilizam ilustrações de contextos relacionados, sem novos assets visuais gerados nesta entrega.

## Vozes

Modelo exclusivo: `gemini-3.1-flash-tts-preview`; Sparky usa Achird e Pinky usa Zephyr. A geração usa instruções de fala ligada, contrações, pausas por ideia e ritmo conversacional mais ágil em B1–C2. O Gemini permite orientar ritmo e estilo por prompt, conforme a [documentação oficial de TTS](https://ai.google.dev/gemini-api/docs/speech-generation).

Os alvos de palavras por minuto são orientações de geração, não garantias do provedor nem critérios CEFR. Frases curtas e palavras polissilábicas variam bastante. A inspeção técnica verifica WAV PCM mono/24 kHz/16 bits, sinal audível, saturação, duração, identidade e hash; ela não equivale a escutar e revisar cada frase.

Há 188 associações de áudio em B1–C2: 187 usam a nova entrega e uma preserva a gravação Gemini 3.1/Zephyr anterior (`b1-argumentos-03`, Pinky), após recusa do provedor. Dois pares de lição/mascote reutilizam os modelos de ironia de outra lição, totalizando 185 arquivos distintos novos. A exceção está explícita em `preservedDelivery` e é coberta por teste. Nenhum outro modelo de TTS foi introduzido.

“Ouvir natural” reproduz em 1×. “Ouvir devagar” usa o mesmo arquivo em 0,75×, preservando o tom. Os testes reproduzem os WAVs reais do novo C1 em Chromium e WebKit, incluindo avanço do relógio de reprodução e alternância de velocidade.

## Operação e validação

`scripts/generate-voices.mjs` gera localmente ou usa a rota administrativa `/api/admin/lesson-audio`. A rota exige `SPARKY_AUDIO_ADMIN_TOKEN`, aceita somente lições publicadas e mascotes fixos, mantém cache privado no Supabase e não aceita texto livre. Chaves permanecem fora do Git e do navegador. O parâmetro administrativo `refresh=1` destina-se somente à preparação editorial anterior à publicação de um URL de hash.

O job persiste cada arquivo concluído, permite retomada, limita concorrência e tentativas e interrompe retentativas de uma recusa explícita do filtro do provedor. `scripts/audit-lesson-audio.mjs` produz a evidência em `.voice-qa/lesson-audio-v2.json`.

Validação concluída: lint e build; 81 testes unitários; auditorias de currículo, experiência e áudio; 21 cenários Playwright distintos de fluxo, áudio, legibilidade, paletas e navegação, incluindo a checagem final do link de apoio abaixo das alternativas. As emulações de celular não substituem teste em aparelhos físicos.
