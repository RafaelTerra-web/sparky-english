# Interface, apoio pedagógico e conteúdo em inglês

Esta revisão incorpora o relatório pedagógico fornecido em 12/09/2026. O diagnóstico foi confirmado: a função global `t()` traduzia explicações contrastivas, traduções já escritas em português e alguns estímulos dos exercícios ao selecionar a interface inglesa. O problema era de apresentação; os campos existentes do currículo já separavam exemplos, traduções e explicações.

## Decisões implementadas

`language-policy.ts` define `InterfaceLocale`, `SupportLocale`, `TargetLanguage` e os modos de aprendizagem. `interface-language.tsx` oferece `uiT` para controles, `supportT` para orientações e `targetText` para conteúdo que passa sem alteração. O alias `t` permanece somente por compatibilidade com a interface existente.

O Perfil oferece:

| Modo | Interface | Explicações | Recomendação |
| --- | --- | --- | --- |
| Português + prática em inglês | pt-BR | pt-BR | Início, especialmente A1–B1 |
| Interface em inglês + apoio em português | en | pt-BR | Transição gradual |
| Imersão em inglês | en | en | Opção a partir de B2 |

O nível não muda preferências automaticamente. Usuários que já escolheram inglês recebem apoio em português até optarem pela imersão. As preferências são locais, separadas por identificador de conta; não se afirma sincronização entre dispositivos. Progresso, moedas, inventário e avaliações não são migrados nem modificados por esta escolha. Carregamentos concorrentes do dicionário compartilham uma requisição e respostas antigas não substituem uma escolha mais recente.

## Classificação do conteúdo

- **UI:** navegação, títulos de tela, botões e seleção de opções de configuração.
- **Support:** explicações, estratégias, orientações de pronúncia, feedback, regras de loja e sequência, orientações de uso do Caderno, introdução e relatório de ELTiS, consentimento e política de privacidade.
- **Target:** frases-modelo, palavras a ordenar, alternativas, exemplos contrastados, IPA, transcrições de conversas, textos da loja e produções do aluno.
- **Assessment:** enunciados, alternativas e textos de ELTiS e nivelamento, mantidos na redação original. Nenhum gabarito é adicionado ao cliente.

Botões que prometem **tradução em português** sempre revelam o campo português literal, inclusive na imersão. Esse é um pedido explícito de ajuda, distinto do idioma das explicações. O Caderno e a Call seguem a mesma regra. Traduções continuam recolhidas inicialmente. Em ordenação de palavras, o estímulo português é preservado: traduzi-lo para inglês revelaria a frase que o aluno deveria montar.

Listening mantém a trava da primeira tentativa e a exceção de transcrição acessível com registro de apoio. A mudança de idioma não abre transcrição, não altera respostas e não fornece uma tradução durante o simulado. Exemplos introdutórios continuam com a opção acessível de revelar a frase; não se condiciona acesso ao texto à capacidade de ouvir.

As apresentações de dicas gravadas em português com exemplos ingleses continuam acessíveis com interface inglesa. Na imersão, os controles ficam numa seção opcional claramente identificada. O roteiro exibido é o roteiro real da gravação, não sua tradução automática. Não foram gerados novos áudios nesta revisão.

## Variedade do inglês

US English é o padrão editorial de produção. A seção recolhível “Idiomas desta lição” identifica exposição a grafias britânicas como International English, sem atribuir um sotaque à gravação a partir de sua grafia. O detector é uma indicação baseada em vocabulário conhecido, não uma classificação linguística completa. A comparação de transcrição aceita equivalências explícitas adicionais, como travelled/traveled e analysed/analyzed, preservando diferenças de sentido, negação e palavras extras.

Revisões futuras devem registrar variedades por trecho em metadados editoriais aprovados; não se deve inferir UK English, inglês australiano ou sotaques apenas de palavras isoladas. A aceitação de grafia na prática de voz não constitui avaliação acústica de pronúncia.

## Validação e limites

Testes de comportamento cobrem separação UI/apoio, imersão opt-in, cache, falha e nova tentativa do dicionário, disputa entre escolhas e variantes legítimas. Playwright testa desktop, iPhone e Android: tradução portuguesa com interface inglesa, retomada, persistência dos modos sem alterar o estudo, ordenação sem vazamento de resposta e estímulos de ELTiS protegidos contra entradas indevidas no dicionário.

As traduções inglesas existentes continuam sendo a base editorial. Esta atualização corrige a arquitetura e as superfícies afetadas; não equivale a revisão humana de todas as traduções, calibração CEFR ou certificação de fluência. Na ausência de tradução editorial, mantém-se o texto original. Continuam recomendadas revisão especializada dos níveis avançados, metadados de variedade por trecho e estudos com alunos para validar a progressão do apoio.

### Correções encontradas na regressão visual

O cabeçalho com o foguinho recebeu ajustes para larguras de até 380 px, preservando os controles de perfil e tema sem rolagem horizontal. O auditor de contraste passou a interpretar `color(srgb ...)` na escala correta (0–1 convertido para 0–255), evitando falsos alertas nos fundos criados por `color-mix`. O cálculo de contraste e os limites de aprovação permanecem os mesmos.

Validação: 133 testes unitários/de integração, 12 casos Playwright de idiomas em três dispositivos, lint, build e auditorias de currículo e experiência. A cobertura publicada nesta revisão é de 176 lições e 31 módulos; materiais de expansão fora do currículo ativo não são apresentados como lições já publicadas.
Regressão visual adicional: 24 casos Playwright aprovados, incluindo cinco paletas em claro/escuro, navegação e layout de 320 px.
