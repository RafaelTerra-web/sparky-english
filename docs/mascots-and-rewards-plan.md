# Sparky, Pinky e guarda-roupa

Implementação inicial — atualizada em 5 de setembro de 2026. Moedas, compras, inventário, roupas e troca visual de mascote estão disponíveis. A persistência desta fase usa estado compacto autenticado em cookie, conforme as limitações registradas abaixo; banco e sincronização continuam como evolução necessária.

## Experiência

Ao concluir uma lição pela primeira vez, o aluno recebe moedas virtuais. Um aviso discreto no resumo mostra o ganho e oferece “Ver acessórios”; continuar estudando permanece a ação principal. O guarda-roupa fica no Perfil. Não adicionar uma quinta aba de navegação nem abrir a loja automaticamente.

Sparky e Pinky ficam disponíveis gratuitamente. O aluno escolhe seu companheiro e pode trocar sem perder roupas ou progresso. O mascote não interfere em respostas, dificuldade, XP ou acesso a conteúdo. Sem dinheiro real, compra de moedas, anúncios, trocas entre usuários, caixas aleatórias ou penalidade por interromper a sequência de estudo.

## Economia inicial proposta

Valores para testar, não regras já publicadas:

| Evento | Moedas | Limite |
| --- | ---: | --- |
| Primeira conclusão de lição | 10 | Uma recompensa por usuário e lição |
| Primeira conclusão de módulo | 20 | Uma recompensa por usuário e módulo |
| Revisão que estava vencida | 2 | Até 10 moedas por dia, eventos distintos |
| Repetir lição já concluída | 0 | Pode estudar sem limite |

Itens iniciais: lenço (60), boné (80), moletom (150). O primeiro acessório deve caber em aproximadamente um módulo, sem exigir estudo diário. Preços podem mudar para compras futuras; itens adquiridos não são retirados e saldo não expira. Erros, uso de dicas, consulta à tradução e escolha de não usar o microfone não reduzem a recompensa.

As primeiras conclusões de 114 lições renderiam 1.140 moedas; os 18 módulos, mais 360. Usar esse total como limite de referência para um catálogo pequeno, evitando inflação artificial ou centenas de objetos apenas para prolongar o uso.

## Guarda-roupa

- Prévia do item no mascote antes da compra, com preço e saldo após a compra.
- Confirmação explícita para gastar, mensagem clara de saldo insuficiente e opção de continuar estudando.
- Categorias: cabeça, corpo e acessório. No máximo um item equipado por categoria.
- Itens comprados ficam em “Meus itens”; equipar e remover é gratuito.
- Catálogo marca compatibilidade com Sparky, Pinky ou ambos. Um mesmo item pode ter duas artes adaptadas; não esticar uma roupa entre corpos diferentes.
- Navegação por teclado, nomes acessíveis, estado equipado anunciado e nenhuma informação dependente só de cor. Respeitar redução de movimento.

## Personagens e arte

Sparky mantém o panda minimalista já utilizado: formas limpas, poucos detalhes e expressões legíveis em tamanho pequeno. Pinky será uma companheira rosa, acolhedora e de silhueta própria, usando as orelhas grandes como principal característica.

Brief da Pinky: corpo inteiro de frente, pose neutra adequada a roupas, orelhas grandes arredondadas, barriga rosa clara, focinho compacto e poucos detalhes. **Sem antenas, fios, prolongamentos na cabeça ou tentáculos.** Fundo transparente. Não copiar logotipo, nome ou acessórios da personagem da referência. Testar legibilidade a 48, 96 e 256 px. Paleta curta, contorno consistente com Sparky, sem texturas ou excesso de brilho.

A primeira tentativa de transformar diretamente a referência foi bloqueada. Em 5 de setembro foi criada, sem usar a referência como entrada, uma direção inteiramente original pelo GPT Image: corpo rosa compacto, barriga clara, nariz ameixa, duas orelhas grandes, sem antenas e em fundo transparente. O arquivo mestre publicado é `public/visuals/pinky-mascot.png`. O perfil de voz “Pinky” funciona independentemente da imagem.

Preparar poses controladas: neutra, explicação, dúvida, incentivo, comemoração e revisão. Primeiro aprovar a neutra e suas proporções; só depois produzir variantes. Cada mascote precisa de pontos de ancoragem normalizados para cabeça, tronco e mãos, camadas de frente/fundo e máscara para respeitar as orelhas. Definir isso antes de desenhar chapéus e roupas.

## Pré-requisito: persistência confiável

Nesta primeira versão, o estado é calculado por uma rota autenticada e selado com criptografia autenticada em um cookie HttpOnly diferente por identificador Google. Isso impede que o JavaScript altere moedas ou gabaritos e sobrevive a logout e fechamento da aba no mesmo navegador. Não é sincronização entre dispositivos nem substitui um banco transacional: limpar cookies remove os dados e alterações simultâneas em abas distintas podem sobrescrever estado. A interface e a política avisam essa limitação.

O login atual usa sessão Google validada no servidor, não Supabase Auth. Mapear o `sub` Google a um usuário interno estável. Toda rota consulta a sessão e a lista de acesso; o cliente nunca escolhe arbitrariamente `user_id`. A credencial administrativa de banco permanece exclusivamente no servidor. Para acesso direto pelo cliente, seria necessária integração explícita de identidade e políticas RLS compatíveis; a sessão atual sozinha não concede isso.

## Modelo e transações

- `lesson_completions`: usuário, lição, versão, conclusão validada e data do servidor; chave única de primeira conclusão por usuário/lição.
- `wallets`: usuário, saldo inteiro não negativo e atualização; alteração somente por operação transacional do servidor.
- `coin_ledger`: lançamentos imutáveis, delta, motivo, referência e `event_key` único por usuário. Saldo deve ser reconciliável com o histórico.
- `cosmetic_items`: código estável, preço inteiro, categoria, compatibilidade, arte e estado publicado.
- `user_inventory`: usuário/item únicos e referência da compra; não apagar itens porque saíram do catálogo.
- `mascot_preferences`: mascote selecionado.
- `equipped_items`: usuário/mascote/categoria únicos, referenciando um item compatível e realmente possuído.

Conclusão validada → transação única cria conclusão, lançamento e saldo; a mesma requisição repetida retorna o resultado anterior. Bônus de módulo usa sua própria chave idempotente. A contagem diária usa horário do servidor em `America/Sao_Paulo`, não relógio manipulável do aparelho.

Compra → conferir sessão, publicação e preço atual; bloquear a carteira na transação; verificar saldo; debitar, registrar lançamento e conceder item atomicamente. Chave de idempotência e unicidade do inventário evitam compra dupla. Se o preço mudou desde a prévia, solicitar nova confirmação com o preço atual. Não aceitar preço, recompensa ou saldo enviados pelo cliente como autoridade.

RLS deve negar leitura cruzada de carteiras, inventário e progresso. Usuários não podem escrever diretamente em saldo ou histórico. Rotas que utilizarem credencial de serviço precisam manter suas próprias verificações de identidade, pois essa credencial ignora RLS. Ações mutáveis exigem validação de origem e proteção contra CSRF, além da sessão.

## Offline, migração e privacidade

No futuro, conclusões offline entram numa fila identificada por usuário e evento. A interface pode indicar recompensa pendente, mas não conceder saldo gastável antes da confirmação do servidor. Reenvio não duplica moedas; erros não apagam progresso já confirmado. Comprar exige conexão no primeiro lançamento.

Não importar automaticamente conclusões ou saldo informados pelo armazenamento local atual. Qualquer concessão retroativa precisa de fonte verificável no servidor ou política de compensação administrativa explícita, com lançamento auditável. Logout limpa caches privados locais, mas não apaga carteira ou roupas persistidas. Não registrar áudio ou transcrição para justificar recompensas.

## Voz dos mascotes

Implementado agora: Web Speech API opcional, seleção de voz inglesa e perfis suaves de altura/velocidade. Sparky prefere voz-base masculina e Pinky feminina quando o dispositivo oferece uma identificação utilizável. A idade e o gênero do timbre não são garantidos; não há clonagem ou voz infantil neural própria. Falta validar a qualidade percebida em diferentes aparelhos com ouvintes humanos.

Uma fase futura pode adicionar vozes originais estáveis em um adaptador de serviço. Exigirá escolha do fornecedor/modelo, validação de disponibilidade, credenciais seguras, orçamento, política de retenção e novo consentimento quando mudar o destino do áudio. Não imitar a voz de uma criança identificável. A prática oral continua opcional e não altera moedas.

## Etapas e aceite

1. Persistir progresso autenticado; testar isolamento entre as duas contas e sobrevivência a logout e novo dispositivo.
2. Implementar carteira e histórico, transações e idempotência; testar repetição, concorrência, saldo negativo, usuário incorreto e relógio adulterado.
3. Aprovar arte original dos dois mascotes e três acessórios; testar ancoragens, compatibilidade, tamanhos pequenos e contraste.
4. Construir resumo de recompensa e guarda-roupa; testar teclado, leitores de tela, compra cancelada, saldo insuficiente, compra simultânea e equipar item não possuído.
5. Pilotar com as contas convidadas, reconciliar saldo com histórico e ajustar preços antes de ampliar o catálogo.

Critérios adicionais: repetir conclusão não gera dinheiro; comprar em duas abas não produz saldo negativo; falha de rede não debita sem conceder; logout não remove propriedade; remoção de acesso bloqueia operações; fila de uma conta nunca sincroniza para outra. Publicar cada etapa apenas depois desses testes.
