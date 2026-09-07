# Pinky e Loja de descobertas

## O problema e a solução

A loja estava dentro do Perfil e apresentava acessórios abstratos, com pouca relação entre a compra e a prática. As roupas eram camadas CSS posicionadas por porcentagens sobre ilustrações com anatomias diferentes. Ajustar essas porcentagens não resolveria a sobreposição de mãos, tecido, orelhas e alças em todos os tamanhos.

A nova loja tem uma área própria na navegação. Usa looks completos ilustrados, com roupas integradas ao corpo, mais um cenário independente. A Pinky foi redesenhada com postura sentada, orelhas mais largas, olhos grandes, focinho arredondado e almofadas violetas. Sua identidade continua sendo um personagem original; a referência do usuário orientou a intenção visual, sem uma reprodução literal.

## Fluxo de compra

1. Escolher Sparky ou Pinky.
2. Explorar Looks, Cenários, Missões extras ou Meus itens.
3. Experimentar um visual sem alterar saldo ou equipamento. A prévia identifica esse estado explicitamente.
4. Conferir o preço e o saldo restante antes de confirmar a compra permanente.
5. Usar ou remover um visual adquirido. Um look e um cenário podem coexistir; dois looks não se sobrepõem.

Itens sem saldo suficiente mostram quanto falta e um caminho de volta ao estudo. O botão de prática prioriza revisões vencidas quando existem. As aquisições continuam validadas e persistidas no servidor; comprar novamente algo adquirido não cobra outra vez. Trocar de mascote preserva o visual de cada um.

## Economia de estudo

Mantidas as recompensas verificadas: 10 moedas na primeira conclusão de lição, 20 no primeiro módulo completo e 2 por revisão vencida elegível, até dez revisões remuneradas por dia. Corrigir um erro não retira moedas. Repetir uma conclusão não gera saldo adicional.

Há quatro looks, três cenários e três pacotes permanentes de prática. A primeira escolha visual custa 30 moedas; um look de entrada ou o pacote do cotidiano custa 40. Os looks Academia e Ateliê mantêm os IDs e preços anteriores. Não há compra com dinheiro, aleatoriedade, expiração, multiplicador de nota ou pagamento para avançar no curso principal.

As novas missões oferecem um uso educacional concreto às moedas:

| Pacote | Faixa orientativa | Moedas | Situações |
|---|---|---:|---|
| Passaporte do cotidiano | A1–A2 | 40 | Corrigir um pedido no café; conferir hóspedes de uma reserva |
| Inglês em equipe | B1–B2 | 60 | Negociar uma entrega parcial; adaptar uma oficina diante da chuva |
| Laboratório de nuances | C1–C2 | 80 | Sintetizar indicadores diferentes; revisar pressupostos e responsabilidade |

Cada pacote oferece duas situações, quatro decisões com explicação e duas propostas de produção com modelo e checklist. São seis missões, doze decisões e seis tarefas de escrita. A prática é repetível e não gera moedas ou conclusão no curso principal. As decisões têm feedback local; a produção escrita não recebe avaliação automática. Os textos não possuem novos áudios gravados.

Rascunhos entram no mesmo Caderno das lições, separados por conta, com limite de 6.000 caracteres por rascunho de missão. Podem ser retomados, revisados, exportados e apagados pelo fluxo existente. A limitação global de cem versões do Caderno continua valendo.

## Compatibilidade e devolução

Os oito acessórios CSS retirados são reembolsados integralmente a quem os possui: lenço 60, boné 80, moletom 150, óculos 90, fones 110, boina 95, bolsa 125 e cardigã 150. IDs duplicados não duplicam a devolução. O máximo é 860 moedas.

`normalizeRewardState` reconhece o estado antigo, remove os itens retirados, limpa as posições incompatíveis e devolve o saldo correspondente. O estado normalizado recebe `wardrobeVersion: 2` e `wardrobeRefund`; novas normalizações não acrescentam moedas novamente. A próxima gravação persiste o estado migrado. A leitura anterior à gravação é determinística: recalcula a mesma migração a partir do mesmo estado antigo.

Conclusões, revisões, mascote escolhido e looks completos comprados são preservados. O Ateliê mantém a propriedade e recebe a arte da nova Pinky. Persistência permanece conforme a configuração existente: cookie criptografado no navegador ou estado com controle de revisão no banco. A migração não muda essa arquitetura.

## Arte e proveniência

Produção com a ferramenta integrada `image_gen`, sem CLI de API. Os sprites usados pelo app foram verificados como PNG com canal alfa real e empacotados em quadros de 640×640, sem distorção de proporção:

- `public/visuals/pinky-v2.png`
- `public/visuals/pinky-atelier-v2.png`
- `public/visuals/pinky-focus-v2.png`
- `public/visuals/sparky-explorer-v2.png`

O look Academia existente continua em uso. Os arquivos antigos ficam disponíveis durante a transição de clientes. A prática de voz também usa a nova Pinky; seus arquivos de TTS e configuração de voz permanecem iguais.

Prompt final da base:

> Redesign this original app mascot Pinky as a charming seated pink fantasy creature. Retain her friendly identity and pink color family, but give her a wider head, broad purple rounded nose, large shiny oval dark eyes with delicate lashes, and huge ears swept outward and slightly upward instead of tall mouse ears. Feet forward with violet paw pads; little forepaws resting together; pale pink muzzle and belly. Small curved tuft above the head, gentle confident closed smile. Soft clean illustrated 2D shading consistent with a premium learning app. Original character design. Full body centered within a square with 8 percent margin around entire ears and feet. No clothes, objects, text, watermark, ground or backdrop. Isolated sprite with actual transparent alpha background.

Prompts dos looks:

> Pinky Ateliê: Edit only the clothing of this original Pinky mascot. Preserve exactly the seated pose, head, facial expression, giant pink ears, body proportions, camera, and transparent background. Dress her in a neatly fitted lavender artist beret resting on the tuft between the ears, an open soft plum cardigan fitted to the torso with forepaws naturally in front, and a tiny teal crossbody sketchbook satchel at her side. All clothing physically follows her body, nothing floating. Keep her entire face, ears and feet unobstructed. Same polished illustration style. One full-body character in a square transparent PNG with comfortable padding. No text or other scene.

> Pinky em foco: Edit only the outfit of this original Pinky mascot. Preserve the exact seated pose, facial features, ear silhouette, expression and body proportions. Dress her in a soft teal hooded sweatshirt, hood down behind neck, fitted to her short seated torso, sleeves around her arms, forepaws visibly in front. Add small comfortable teal headphones fitted between and around the bases of her giant ears, never covering the eyes. Same clean softly shaded illustration. One full-body character centered on actual transparent background, no text, scenery or ground. Entire ears and feet visible.

> Sparky explorador: Edit this original Sparky panda mascot into a casual explorer outfit. Preserve the exact panda face, eye patches, expression, seated pose and proportions. Remove glasses and navy cardigan. Keep coral scarf, add a well-fitted forest green campus cap between his round ears and a tan canvas messenger bag resting at his side. He holds the same small book. Headwear sits physically on his head and bag strap follows torso behind forepaws. Same clean softly shaded illustration. Full body in square transparent PNG with all ears and feet visible and comfortable margin. No text, scenery, ground or extra objects.

Os três looks passaram por uma edição adicional porque a primeira saída continha um quadriculado opaco. Prompt de extração:

> Background extraction only. Remove the entire gray and white checkerboard background from this mascot outfit image and output an RGBA PNG with genuine alpha transparency outside the character. Preserve every character pixel, clothing, colors, proportions and pose as closely as possible. Do not draw a checkerboard, white background or any new scene. Isolated transparent cutout, soft clean edges, same full character and framing.

## Validação

Os testes cobrem migração idempotente, devolução sem duplicação, preservação de progresso, saldo insuficiente, compra repetida, propriedade, compatibilidade de mascote, look com cenário e estrutura dos pacotes. Os sprites possuem verificação automatizada de transparência. O limite do cookie inclui todos os itens da loja, inclusive pacotes.

`scripts/smoke-shop.mjs` usa exclusivamente o fixture local: ganha moedas com comprovantes reais de lições, testa prévia, cancelamento, compras, aplicação de look e cenário, abertura de missão, feedback, rascunho no Caderno e persistência após recarregar. Há inspeção em 390 px e desktop. Os testes existentes de lições, voz e instalação continuam sendo executados.

Os preços e a organização são decisões de produto ainda sem estudo com alunos. O próximo acompanhamento útil é observar descoberta da loja, tempo até a primeira escolha, uso efetivo das missões e retorno às revisões, sem usar compra como medida de aprendizagem.
