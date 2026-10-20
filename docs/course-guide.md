# Curso guiado e treino por disciplina

A atualização organiza 178 lições em uma trilha por nível e em seis percursos de competência. Os IDs anteriores não mudam: conclusões, moedas, compras e revisões continuam válidos. Duas lições B2 acrescentam condicionais mistas, preservando as posições anteriores no ledger.

## Navegação

- Hoje: próxima lição, motivo, meta de tempo e uma revisão curta intercalada. A fila continua limitada a três revisões por dia. O aluno pode pausar quando atingir sua meta.
- Seguir meu curso: sequência a partir do nível recomendado, posição atual, objetivos observáveis, progresso e bases recomendadas sem bloqueios. As lições complementares B1 agora aparecem antes de B2 na trilha.
- Treinar por disciplina: filtros combináveis por nível, disciplina, habilidade em foco, função, conteúdo linguístico e status. As conclusões livres também contam no curso e não apagam lacunas anteriores.
- Perfil: disciplina preferida e tempo diário. Português e inglês cobrem as novas telas e os objetivos.
- Simulado: dois botões abrem lições publicadas em contextos escolares, próximas do nível do aluno, para a habilidade com menor resultado.
- Encerramento: objetivo praticado, aplicação em outro contexto quando a lição integra um percurso e próxima lição da trilha.

## Dados e critérios

A classificação editorial está em src/lib/course-metadata.ts. A tabela lessonMetadata em src/lib/course-guide.ts associa todos os IDs reais às dimensões pedagógicas. As habilidades disponíveis são separadas das habilidades em foco, para os filtros não retornarem sempre todo o catálogo. O foco considera a atividade pedagógica da lição e os ajustes explícitos por ID.

O índice src/lib/grammar-topics.ts reúne 63 tópicos em A1–C2 com nomes em inglês, descrições e termos de busca em português e inglês. Cada tópico aponta apenas para lições que realmente ensinam o conteúdo. As classificações são pontos de entrada orientativos do curso; a lista não representa cobertura integral de toda a gramática de cada nível. Zero e First Conditional começam em A2; Second em B1; Third e Mixed em B2. As duas condicionais mistas distinguem causa passada com efeito atual de característica atual com resultado passado. A explicação foi conferida com a referência do [British Council](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/conditionals-third-mixed).

Os percursos de opinião/mediação, trabalho, viagens, ciência, tecnologia e intercâmbio ligam fundamentos, prática guiada, transferência e consolidação em níveis crescentes. Eles reutilizam lições reais e acrescentam tarefas explícitas de aplicação; não representam novas aulas narradas. Conclusão indica prática realizada, não certificação de domínio.

A trilha principal mantém a sequência. As práticas complementares usam a última resposta por questão, a habilidade mais fraca do último simulado, a disciplina preferida e a variedade das disciplinas concluídas. Uma resposta corrigida substitui o erro anterior na recomendação. Sugestões de simulado, rascunhos, tentativas e preferências ficam neste dispositivo, separados por conta; conclusões e recompensas mantêm a sincronização existente.

## Auditoria

A auditoria também roda automaticamente antes do build de produção. Execute npm run audit:coverage para rodá-la isoladamente. O comando regenera docs/course-coverage.json e falha se houver taxonomia inválida, habilidade ausente de um nível (inclusive como foco), disciplina com menos de duas habilidades, conteúdo complexo com menos de três ocorrências, módulo sem objetivo, base incompatível para B2/C1 ou referência inválida em percursos e sugestões do simulado.

A auditoria descreve cobertura estrutural, incluindo aplicações opcionais de fala e escrita. Não substitui avaliação editorial da qualidade ou da dificuldade das atividades.

Validação automatizada: tests/course-guide.test.mjs e scripts/smoke-course-guide.mjs, além da suíte anterior. O smoke usa APIs simuladas para navegação e fechamento de lições; a validação de respostas e recompensas tem testes de servidor separados.
