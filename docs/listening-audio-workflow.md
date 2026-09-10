# Produção das conversas avançadas

1. Exporte os roteiros: `node scripts/prepare-listening-audio.mjs --out=.release-work/listening-composer`.
2. No Composer multilocutor do AI Studio, selecione exatamente `gemini-3.1-flash-tts-preview`, Achird para Sparky e Zephyr para Pinky. Use cena, direção e turnos do arquivo correspondente; metadados e instruções não fazem parte das falas. Confira a seleção no painel antes de gerar. Se o modelo estiver indisponível, interrompa a geração, sem substituí-lo.
3. Baixe WAV mono PCM16 de 24 kHz. Importe com `node scripts/prepare-listening-audio.mjs --id=b2-service-repair --file="C:/caminho/conversa.wav"`.
4. A importação mede a duração e rejeita arquivos inválidos, silenciosos e fora da faixa do nível. Preserva o original e registra o arquivo como pendente em `src/lib/content/listening-assets.json`. Reimportar o mesmo conteúdo é idempotente; substituições conflitantes são bloqueadas. Um lock impede importações simultâneas de sobrescrever o manifesto.
5. Confira por audição todas as falas e a correspondência exata ao roteiro. Modelo e vozes registrados são a configuração declarada do fluxo, não uma inferência do WAV. `generatedAt` registra a ingestão; guarde o histórico de geração do AI Studio como evidência adicional. Nenhuma análise automática prova o modelo usado ou a qualidade pedagógica.
6. Somente após a revisão, registre explicitamente os cinco critérios: pronúncia, naturalidade, áudio limpo, turnos e coerência. Uma revisão parcial jamais habilita reprodução como áudio aprovado. A aprovação dos áudios não substitui a revisão docente das lições.
7. Execute `node scripts/audit-advanced-expansion.mjs --release --out=.release-work/advanced-review`. O relatório confere hash do arquivo, hash do roteiro e duração medida. Enquanto houver pendências o comando falha e as candidatas continuam fora do currículo ativo.

Em 10/09: 176 lições publicadas, 36 candidatas, 0 áudios avançados aprovados. Após aceitação do conjunto: 212 lições, 37 módulos e 708 exercícios objetivos. A meta antiga de 204 foi ultrapassada pelas oito lições publicadas paralelamente.

## Geração direta autorizada em 10/09

A chave fornecida pelo usuário funcionou no endpoint Vertex `generateContent`. O script `node scripts/generate-listening-audio.mjs --id=b2-service-repair` recebe `GEMINI_API_KEY` apenas pelo ambiente e gera uma conversa fixa por execução. Ele confere a versão retornada pelo provedor, as configurações Achird/Zephyr, o formato PCM e a duração; conserva WAV e relatório em `.release-work/listening-generated`, fora da publicação. Não possui fallback de modelo nem aprova automaticamente os arquivos.

Duas tentativas reais da conversa sobre conserto de bicicleta produziram 63,84 e 68,80 segundos, ambas abaixo dos 75 segundos mínimos. A segunda solicitou ritmo mais calmo; continua pendente. Os arquivos não foram importados ao manifesto público. A próxima revisão deve verificar o roteiro por transcrição e audição e ajustar a entrega sem acrescentar silêncio artificial para cumprir duração.
