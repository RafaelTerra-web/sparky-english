# Dicas de conversa v1

12 dicas autorais distribuídas em 24 lições, durante a etapa de pronúncia. Cada uma contém explicação em português, exemplo em inglês, tradução, pequena tarefa de aplicação e resposta revelável. Não alteram IDs, notas, moedas ou etapas do currículo.

O cartão acompanha o mascote selecionado. Cada roteiro tem uma gravação de Sparky e outra de Pinky, com explicações em português e exemplos falados em inglês. São mantidas as vozes existentes: Sparky com GPT-4o Mini TTS/Cedar; Pinky com tts-1-hd/Nova. Não foi usada a interface do AI Studio nesta entrega. A geração é administrativa; ouvir não dispara cobranças nem envia dados do aluno.

O conteúdo distingue variações de sotaque e contexto de regras absolutas. A dica sobre iron apresenta a referência americana e britânica e não repete a alegação sem evidência de que uma pronúncia será necessariamente entendida como I don't. Links de referência ficam disponíveis em cada cartão; exemplos e desafios são autorais.

## Produção dos áudios

Executar `scripts/prepare-tip-audio.ps1 -Deployment <URL>` com cabeçalho administrativo local, excluído do Git. Apenas 12 IDs e dois mascotes são permitidos. WAVs temporários ficam em `.voice-qa/tips` e no bucket privado. `scripts/encode-tip-audio.py` usa PyAV para produzir MP3s públicos menores e um manifesto com modelo, voz, hash do roteiro e hashes dos arquivos. Ao alterar um roteiro, gerar uma nova versão dos arquivos; não reutilizar o cache anterior.

Triagem automática usa `scripts/review-onboarding-audio.py` e Whisper. Transcrição automática de fala bilíngue tem limitações, especialmente em palavras isoladas, e não constitui aprovação auditiva humana. A referência de dicionário permite comparar modelos de pronúncia humana.

## Validação

Testes verificam os 12 IDs, seis níveis, 24 vínculos com lições existentes e conteúdo bilíngue. Playwright testa os dois mascotes em desktop, Android e layout de iPhone. No WebKit executado neste Windows, a reprodução da amostra de mídia falha; ali é testada a mensagem acessível de falha e a disponibilidade do texto. Reprodução sonora em um iPhone físico ainda requer verificação. Desktop e Android simulados exercitam reprodução e parada com MP3.
