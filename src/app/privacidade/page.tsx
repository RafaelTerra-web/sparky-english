"use client";
import { supportT as t, uiT, useSupportLanguage, setSupportLanguage, useInterfaceLanguage } from "@/lib/interface-language";
import { useState } from "react";
import Link from "next/link";

export default function PrivacyPage() {
  useInterfaceLanguage();
  const support = useSupportLanguage();
  const [languageError, setLanguageError] = useState(false);
  return (
    <main className="privacy-page" lang={support}>
      <label htmlFor="privacy-language">Português / English </label><select id="privacy-language" value={support} onChange={event => { setLanguageError(false); void setSupportLanguage(event.target.value as "pt-BR" | "en").catch(() => setLanguageError(true)); }}><option value="pt-BR">Português (Brasil)</option><option value="en">English</option></select>
      {languageError && <p role="alert">{t("Não foi possível carregar o inglês. Tente novamente.")}</p>}
      <Link href="/">{uiT("← Voltar ao Sparky English")}</Link>
      <h1>{t("Como seus dados são usados")}</h1>
      <p>{t("O Sparky English é um espaço privado para estudar inglês com explicações em português do Brasil.")}</p>
      <h2>{t("Entrada com Google")}</h2>
      <p>{t("Ao entrar, recebemos do Google seu nome, e-mail verificado e identificador de conta. Esses dados identificam você e permitem verificar se o seu e-mail está autorizado. A integração usa apenas a identificação básica; não solicita acesso ao Gmail, Drive ou contatos.")}</p>
      <h2>{t("Sessão e progresso")}</h2>
      <p>{t("A sessão é mantida em um cookie criptografado, inacessível ao JavaScript da página, com validade de até 7 dias. Sair da conta apaga esse cookie no navegador.")}</p>
      <p>{t("Conclusões, sequência diária, datas de revisão, moedas, inventário, roupas equipadas e o mascote escolhido são compactados em um segundo cookie criptografado, inacessível ao JavaScript e ligado ao identificador da sua Conta Google. Ele pode permanecer neste navegador por até um ano mesmo depois do logout, para que o progresso reapareça no próximo acesso da mesma conta. Contas diferentes usam estados separados.")}</p>
      <p>{t("Com a sincronização por conta ativa, conclusões, sequência diária, revisões, moedas e inventário ficam no Supabase, sob um identificador derivado da conta Google. O servidor verifica a sessão e controla os acessos. O Perfil informa o modo ativo. Respostas de autenticação e dados privados não entram no cache offline. Uma falha ao salvar é mostrada ao aluno.")}</p>
      <h2>{t("Personalização e diagnóstico")}</h2>
      <p>{t("A paleta de cores e o modo claro, escuro ou do aparelho são salvos no Supabase, ligados à sua conta, para acompanhar você em outros dispositivos. Um cache local permite aplicar a aparência ao abrir o aplicativo e manter sua escolha durante falhas de conexão. As alterações pendentes são sincronizadas quando a conexão retorna.")}</p>
      <p>{t("Quando o onboarding estiver ativo, guardamos nome preferido, idade, faixa etária, mascote, nível escolhido ou estimado, score interno e evidência do diagnóstico. As etapas confirmadas e respostas do teste permitem retomar em outro dispositivo. Rascunhos abandonados expiram após 30 dias. O teste não constitui certificação oficial de proficiência.")}</p>
      <p>{t("Ao confirmar o nome, enviamos o nome validado em uma saudação curta ao Google Gemini para sintetizar a voz Achird do Sparky. Isso ocorre antes da pergunta sobre idade. Menores de 13 anos precisam posteriormente da confirmação de um responsável para concluir; a recusa remove a personalização e o áudio provisório do armazenamento do Sparky. Essa confirmação simples não verifica documentalmente a identidade do responsável.")}</p>
      <p>{t("Você pode ouvir a saudação e confirmar a pronúncia ou fornecer uma forma escrita de pronunciá-la em português brasileiro. Esse ajuste também é enviado ao Gemini e não altera o nome exibido. Depois de sua confirmação, o Sparky pode usar o nome em recados de boas-vindas e prática, gerados somente quando você pede para ouvir. Você pode continuar sem o nome falado e mudar essa escolha no Perfil.")}</p>
      <p>{t("Os áudios do nome e dos recados personalizados ficam em armazenamento privado, acessível somente à conta autenticada. O áudio provisório deixa de ser acessível em 24 horas e é removido na limpeza diária seguinte. Depois da conclusão, permanece até a mudança do nome, ajuste de pronúncia, escolha de continuar sem o nome falado ou exclusão da personalização. As preferências podem ser editadas no Perfil. A exclusão de dados nos sistemas do Google segue as condições do fornecedor; o Sparky não controla essa retenção.")}</p>
      <h2>{t("Caderno, tentativas e retomada")}</h2>
      <p>{t("O armazenamento local deste navegador guarda sua etapa atual, respostas, consultas a explicações e traduções, rascunhos, versões dos textos, frases favoritas e preferências de estudo. Esses dados ficam separados por conta e permanecem após fechar a aba ou sair. Não são criptografados no armazenamento local: em dispositivos compartilhados, use o botão Apagar caderno local ao terminar. O Caderno permite exportar uma cópia. Limpar os dados do site elimina a cópia local.")}</p>
      <p>{t("As respostas dos exercícios fechados são enviadas ao servidor para verificação. Um comprovante criptografado de até oito horas permite validar a conclusão sem guardar os textos das respostas no cookie. Escrita livre permanece local e não é enviada a um serviço de IA. O histórico local mantém até 600 tentativas, 100 versões de escrita e 200 frases. Os registros mais antigos cedem espaço aos novos.")}</p>
      <h2>{t("Moedas e roupas")}</h2>
      <p>{t("As moedas são virtuais, não têm valor monetário e não podem ser compradas, transferidas ou trocadas por dinheiro. O servidor calcula recompensas a partir da primeira conclusão de cada lição, da conclusão de módulos, de revisões vencidas e de marcos de sete dias de acesso. O app não usa voz, respostas erradas ou dados pessoais para reduzir recompensas.")}</p>
      <h2>{t("Ouvir a pronúncia")}</h2>
      <p>{t("As falas publicadas de Sparky e Pinky são geradas por IA a partir dos exemplos fixos do curso, com o Gemini 3.1 Flash TTS, e armazenadas como arquivos de áudio. Ouvir um exemplo fixo apenas carrega esse arquivo. Ao ouvir uma apresentação personalizada, enviamos ao Gemini a frase do curso com seu nome preferido para gerar a fala completa. Essa gravação fica apenas na memória da lição aberta, sem armazenamento permanente pelo Sparky. Transcrições do microfone não são enviadas por essa função. As vozes são predefinidas por mascote. Áudios ainda não publicados aparecem como indisponíveis na lição.")}</p>
      <h2>{t("Prática opcional com microfone")}</h2>
      <p>{t("O microfone não é ligado automaticamente. Primeiro você confirma o aviso na lição, depois clica em Começar a falar e autoriza o navegador quando solicitado. A escuta termina após um resultado ou no limite de 20 segundos. O botão Parar, a troca de etapa, o fechamento da lição e a saída da aba interrompem a captura.")}</p>
      <p>{t("O reconhecimento é fornecido pelo navegador. Dependendo dele, seu áudio pode ser enviado a um serviço externo, como o serviço do Google no Chrome, e exigir internet. As regras de processamento e retenção desse serviço são as do respectivo fornecedor; o Sparky não controla nem promete excluir dados dos sistemas dele. Não fale senhas ou informações pessoais durante a prática.")}</p>
      <p>{t("O Sparky não cria arquivos de gravação e não salva áudio ou transcrições em banco, armazenamento local ou cache. O texto reconhecido fica temporariamente em memória e pode ser apagado pelo botão Apagar transcrição; também desaparece ao trocar de etapa ou fechar a lição. O resultado compara palavras, não avalia fonemas, sotaque ou proficiência. Você pode concluir as lições sem usar voz.")}</p>
      <p>{t("Para revogar o acesso ao microfone, use as permissões do site no navegador. Negar a permissão não bloqueia o curso escrito.")}</p>
      <h2>{t("Call com Sparky ou Pinky")}</h2>
      <p>{t("A Call é uma prática opcional por turnos. O microfone só é ativado quando você toca em Falar. Cada trecho enviado tem no máximo 45 segundos e é convertido no navegador antes de ser processado pelo Alibaba Cloud Model Studio com Qwen para transcrever sua fala, preparar uma resposta pedagógica e gerar a voz do mascote.")}</p>
      <p>{t("O Sparky não armazena o arquivo de áudio da Call. A transcrição fica temporariamente no Supabase para permitir a retomada e é apagada ao encerrar por padrão. As respostas do mascote, o feedback e o resumo podem permanecer por até 30 dias. O feedback é formativo: não altera seu nível, não emite certificado e não avalia pronúncia apenas pelo texto transcrito. Você não deve falar senhas ou dados pessoais durante a conversa.")}</p>
      <h2>{t("Publicidade e contato")}</h2>
      <p>
        O app não exibe anúncios nem possui feed público. Para solicitar acesso
        ou tratar de dados da sua conta, fale com o administrador pelo e-mail{" "}
        <a href="mailto:rafaelmodiecai@gmail.com">{t("rafaelmodiecai@gmail.com")}</a>.
      </p>
    </main>
  );
}
