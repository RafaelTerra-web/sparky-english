# Laboratório de músicas — plano de produto e implementação

## Objetivo pedagógico

## Faixa escolhida pelo usuário

- **Do I Wanna Know? — Arctic Monkeys**, prioridade para a primeira experiência com música comercial.
- Vídeo oficial confirmado: https://www.youtube.com/watch?v=bpOSxM0rNPM (canal Official Arctic Monkeys).
- Integração prevista: player oficial incorporado, iniciado por clique, com link para abrir no YouTube caso a incorporação não esteja disponível. Não baixar nem hospedar o MP3.
- Atividades autorais: compreensão da intenção, contraste entre pergunta direta e hesitação e prática da redução informal `want to` → `wanna`, com exemplos criados para o aplicativo.
- Faixa pedagógica provisória: B1–B2, sujeita a revisão editorial; não representa uma classificação oficial da música.
- Legendas disponíveis pelo player oficial permanecem sob controle do provedor. Letra completa, tradução e legendas próprias sincronizadas só serão incluídas mediante licença; não presumir que o vídeo oficial concede esses direitos.
- Status: selecionada no plano; ainda não publicada no aplicativo.

## Objetivo pedagógico do módulo

Adicionar uma experiência de escuta com texto sincronizado para desenvolver percepção de fala conectada, vocabulário em contexto, ritmo, pronúncia e compreensão global. O recurso será complementar à trilha A1–C2 e não concederá conclusão de nível apenas por reprodução.

Cada música terá uma sequência curta:

1. antecipação do tema e de três palavras-chave;
2. primeira escuta sem texto, com uma pergunta global;
3. segunda escuta com linha ativa e destaque por expressão, sem efeito de karaokê letra por letra;
4. atividade de lacuna ou ordenação limitada a trechos curtos;
5. explicação de fala conectada, redução ou referência cultural;
6. repetição de um trecho curto em velocidade normal e a 75%;
7. produção livre relacionada ao tema da música.

As faixas serão classificadas por CEFR, densidade lexical, velocidade aproximada, clareza vocal, variedade de sotaque, linguagem sensível e habilidades. A primeira coleção terá ao menos duas faixas por nível, com pop, folk, soul, indie e música acústica.

## Direitos e proveniência

O aplicativo só armazenará áudio e texto quando houver licença ou autorização verificável. Ser privado e educativo não concede automaticamente o direito de baixar do YouTube, redistribuir uma gravação ou exibir a letra completa. Downloads do YouTube não farão parte do pipeline.

Fontes aceitas:

- composição e gravação originais encomendadas para o Sparky;
- obras em domínio público com gravação também em domínio público ou licenciada;
- CC0;
- CC BY e CC BY-SA quando os termos forem compatíveis e a atribuição estiver completa;
- áudio enviado pelo responsável pelo aplicativo acompanhado da licença necessária.

CC BY-ND não será usado porque sincronização, cortes didáticos e adaptação podem constituir transformação. Cada item terá `sourceUrl`, titular, licença, URL da licença, data de verificação, texto da atribuição, hash do áudio e confirmação separada dos direitos da composição, gravação e letra.

Referências técnicas e de licença:

- Creative Commons BY 4.0: https://creativecommons.org/licenses/by/4.0/
- Tipos de licença Creative Commons: https://creativecommons.org/share-your-work/use-remix/cc-licenses/
- WebVTT para texto sincronizado: https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API/Web_Video_Text_Tracks_Format

## Experiência e acessibilidade

O player terá reprodução/pausa, retorno de 5 segundos, velocidade 75%, 90% e 100%, volume e indicação de progresso. O texto sincronizado ficará disponível em inglês; tradução e explicação aparecerão por linha somente depois da primeira tentativa. A linha ativa terá contraste AA e não dependerá apenas de cor.

O usuário poderá desligar animações, navegar por teclado, escolher uma linha diretamente e usar leitor de tela. O player não iniciará automaticamente. Em `prefers-reduced-motion`, a transição entre linhas será instantânea. Um modo somente texto preservará a atividade quando o áudio falhar.

## Modelo de dados

```ts
type MusicLicense = {
  code: "original" | "public-domain" | "CC0-1.0" | "CC-BY-4.0" | "CC-BY-SA-4.0";
  holder: string;
  sourceUrl: string;
  licenseUrl: string;
  attribution: string;
  verifiedAt: string;
};

type MusicCue = {
  id: string;
  startMs: number;
  endMs: number;
  english: string;
  portuguese: string;
  focus?: string[];
};

type MusicLesson = {
  id: string;
  title: string;
  artist: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  audioPath: string;
  coverPath: string;
  durationMs: number;
  bpm?: number;
  cues: MusicCue[];
  license: MusicLicense;
  tasks: Array<{ id: string; kind: "gist" | "detail" | "gap" | "order" | "pronunciation" | "production" }>;
};
```

Os gabaritos ficarão no servidor. O bundle público receberá apenas o item atual e nunca a resposta correta. O progresso registrará tentativa, apoio consultado, conclusão e revisão recomendada, seguindo os mesmos IDs imutáveis das lições.

## Arquitetura

- `src/lib/music-catalog.ts`: projeção pública e validação de catálogo.
- `src/lib/music-bank.ts`: atividades e respostas server-only.
- `src/components/music-lab.tsx`: catálogo, player sincronizado e sequência pedagógica.
- `src/app/api/music/route.ts`: início, resposta, retomada e conclusão autenticados.
- `public/audio/music/`: somente arquivos com direitos registrados.
- `public/music/captions/`: WebVTT em inglês e português.
- `docs/music-assets.json`: manifesto de licença, hashes, duração e revisão editorial.

A sincronização usará `requestAnimationFrame` apenas durante a reprodução e busca binária sobre os intervalos. Alterar a velocidade não mudará os timestamps lógicos do elemento `<audio>`. O componente limpará eventos e animação ao sair da tela.

## Segurança e qualidade

- limite de tamanho e duração por faixa;
- MIME e assinatura do arquivo verificados;
- sem URLs remotas arbitrárias no player;
- respostas avaliadas no servidor e protegidas contra repetição;
- HTML ausente das linhas e metadados;
- áudio normalizado sem clipping e loudness consistente;
- revisão editorial das legendas, traduções, linguagem e nível;
- teste de alinhamento para impedir sobreposição, lacunas longas ou timestamps fora da duração.

## Entregas

### Entrega 1 — fundação

- tipos, catálogo vazio seguro, validador de licença e manifesto;
- player acessível com WebVTT, linha ativa e velocidades;
- rota server-only para exercícios;
- testes unitários de cue, licença, projeção pública e gabarito;
- testes Playwright em desktop, iPhone e Android.

### Entrega 2 — coleção piloto

- quatro músicas originais ou devidamente licenciadas, A1–B2;
- 24 atividades autorais;
- revisão por professor e inspeção auditiva;
- telemetria local de conclusão e apoios consultados.

### Entrega 3 — expansão

- ao menos doze faixas, duas por nível A1–C2;
- alternância de sotaques e gêneros;
- recomendações conectadas aos erros e às lições do curso;
- beta privado antes de qualquer alegação pública de alinhamento CEFR.

## Critérios de aceite

- nenhuma faixa sem direitos separados para gravação, composição e letra;
- todas as faixas com hash, atribuição, duração e revisão de licença;
- cues ordenados, sem sobreposição e dentro da duração;
- primeira escuta sem tradução ou transcrição revelada;
- texto e tradução equivalentes acessíveis depois da tentativa;
- velocidades preservam afinação;
- gabaritos ausentes do bundle público;
- retomada no último estágio sem duplicar recompensa;
- contraste WCAG AA nos dez temas e modos;
- testes de teclado, leitor de tela, movimento reduzido, iPhone e Android.
