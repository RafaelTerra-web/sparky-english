# Instalação móvel do Sparky English

## Experiência do aluno

O convite de instalação aparece apenas em iPhone, iPad e Android quando o site está aberto em uma aba comum. Ele fica acima da navegação móvel, pode ser fechado e desaparece automaticamente quando o app está em modo standalone.

No Android, o componente guarda o evento `beforeinstallprompt` e só abre o diálogo do navegador após o toque explícito em **Instalar app**. Se o navegador ainda não oferecer o evento, o mesmo cartão explica o caminho pelo menu para **Instalar app** ou **Adicionar à tela inicial**. O evento é usado uma única vez, conforme o contrato do navegador.

No iPhone e iPad, navegadores Chromium não oferecem `beforeinstallprompt`. O cartão ensina o fluxo do Safari: **Compartilhar**, **Adicionar à Tela de Início**, ativar **Abrir como App da Web** quando a opção aparecer e confirmar em **Adicionar**. Quando o endereço foi aberto em outro navegador, o primeiro passo orienta abrir a página no Safari.

## Identidade visual e manifesto

O ícone anterior, um livro genérico, foi substituído por uma marca compacta baseada no rosto, no cachecol coral e na paleta do Sparky. Os arquivos publicados são:

- `sparky-192-v2.png` e `sparky-512-v2.png` para lançadores que preservam a composição quadrada;
- `sparky-maskable-512-v2.png`, com margem adicional para recortes adaptativos no Android;
- `apple-touch-icon-v2.png` em 180 px para iPhone e iPad;
- `src/app/icon.png` para os metadados do Next.js, com fallback ICO em 16, 32 e 48 px. A mesma marca aparece no cabeçalho e no convite de instalação.

A versão v2 usa ilustração gerada com GPT Image a partir do Sparky original, substituindo o SVG rejeitado. O master é `public/visuals/sparky-app-icon.png`; `node scripts/build-app-icons.mjs` reproduz os tamanhos sem novas chamadas de geração. Os PNG antigos continuam disponíveis para clientes durante a transição; o manifesto e o service worker v5 apontam para a nova arte. Ícones já fixados na tela inicial dependem da atualização do sistema; remover e adicionar o atalho novamente permite buscar a nova imagem.

O manifesto define `id`, `scope` e `start_url` na raiz, `display: standalone`, cores de tema e fundo, categorias educacionais e `prefer_related_applications: false`. A viewport usa `viewport-fit=cover`; as barras e rodapés móveis já incluem `env(safe-area-inset-bottom)`.

## Atualização e teste

O service worker usa escopo raiz, ignora o cache HTTP ao procurar sua própria atualização e inclui os ícones no shell público. `/sw.js` é servido com revalidação obrigatória e `Service-Worker-Allowed: /`, evitando que uma versão antiga impeça a chegada de uma publicação nova.

Com `node scripts/preview-fixture.mjs` em execução, `node scripts/smoke-pwa-install.mjs` valida os dois sistemas móveis, o fluxo nativo simulado, a supressão em modo instalado, os metadados, todos os ícones e os cabeçalhos do worker. As capturas ficam em `.next/ui-checks/install-iphone.png` e `.next/ui-checks/install-android.png`.

O teste cobre aceitação e cancelamento do prompt e executa o service worker real para confirmar o fallback sem conexão e a ausência de endpoints privados no cache. Os cenários iOS/Android usam identificação e viewport simuladas no Chromium; a confirmação do sistema e a instalação física precisam ser verificadas em aparelhos reais. O modo offline continua sendo uma tela de reconexão, não um pacote completo de lições offline.

Referências: [fluxo de instalação no Safari, Apple](https://support.apple.com/pt-br/guide/iphone/iphea86e5236/ios) e [evento e ciclo do prompt de instalação, web.dev](https://web.dev/articles/customize-install).
