# Evolução da voz e extensão A1–C2 — 7 de setembro de 2026

## Resultado

- 36 novas lições, em seis módulos B2/C1/C2: 156 lições e 468 exercícios objetivos no total. IDs e posições anteriores no registro de progresso foram preservados.
- Critérios de auto-revisão específicos, propostas orais e projetos de síntese nos níveis avançados. Escrita ampliada para 10.000 caracteres, incluindo edição no Caderno e recuperação de rascunhos.
- Ana/Anna e outras variantes cadastradas de nomes não invalidam a frase. Contrações comuns, cardinais de 0 a 99 e decimais são normalizados; ordem, palavras extras, negações e números diferentes continuam relevantes. Não há aprovação por porcentagem de palavras isoladas.
- Microfone com consentimento, limite de 20 segundos, cancelamento ao sair e descarte de eventos antigos. Transcrição temporária, sem moedas ou conclusão automática de exercícios.
- Perfis fixos de Sparky/Pinky, sem controles de voz pelo aluno. Pipeline administrativo de GPT-4o Mini TTS com arquivos reutilizáveis, sem geração paga em cada reprodução e sem entrada de texto livre.
- Revisão mantém o texto e a lacuna visíveis como parte da pergunta; ajuda por explicação/tradução é registrada separadamente e reiniciada entre etapas.
- Correções editoriais A2: infinitivo em pedidos de direção, troca de ônibus e validade de pedidos curtos como “No cheese, please”.

## Validação

29 testes unitários passaram, incluindo cobertura dos arquivos de voz; lint e build de produção passaram. Auditoria editorial: 150 lições autorais, 33.117 palavras nos campos antes da renderização, sem falhas estruturais. `npm audit --omit=dev`: zero vulnerabilidades reportadas.

Smoke de API no fixture local passou: correção, tentativa errada, CSRF, comprovantes, persistência por cookie e prevenção de recompensa duplicada. Smoke Playwright no Edge passou com viewport móvel de 390 × 844: nomes, palavras extras, encerramento do microfone, transcrição descartada, contexto visível, reset de ajuda, filtros A1–C2 e retomada de um texto com mais de 4.000 caracteres. A inspeção visual conferiu catálogo, prática de voz e escrita. Reconhecimento foi simulado no teste; não se trata de avaliação acústica com falantes reais.

## Ativação e limites

A conferência por transcrição correspondeu ao alvo nas 312 falas, aceitando variantes explícitas de nomes e grafias britânicas/americanas. Dois casos inicialmente divergentes foram conferidos com GPT-4o Transcribe, sem fornecer o texto-alvo ao reconhecedor, que recuperou o texto correto. Não houve geração de áudio a partir de fala ou dados de alunos.

**Atualização de ativação:** os 312 arquivos foram gerados com a credencial fornecida para o processo administrativo e o manifesto foi preenchido. O site reproduz arquivos públicos e não depende da chave no ambiente Production. A credencial não foi gravada no repositório ou no pacote publicado. A conferência de sinal decodificou todos os MP3: 16,17 minutos, 14,81 MiB, sem saturação detectada. O smoke de navegador agora também testa reprodução real de Sparky e Pinky, parada, recuperação de erro de carregamento e troca de mascote.

O pacote inicial cobre 312 frases de exemplo; não narra as aulas completas. As lições avançadas formam uma extensão inicial, não um programa completo ou certificado de fluência. Próximos avanços pedagógicos: ampliar escuta de gêneros variados, conversação espontânea e feedback de professores sobre produção oral e escrita. O reconhecimento permanece dependente do serviço e do suporte do navegador. A validação automática dos áudios não equivale a uma avaliação humana de naturalidade.
