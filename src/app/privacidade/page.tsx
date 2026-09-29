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
      <p>{t("O cadastro começa em texto, sem gerar áudio do nome. Menores de 13 anos precisam da confirmação de um responsável para concluir. No Perfil, você pode configurar a pronúncia e pedir uma saudação sintetizada pelo Google Gemini. Essa confirmação simples não verifica documentalmente a identidade do responsável.")}</p>
      <p>{t("Você pode ouvir a saudação e confirmar a pronúncia ou fornecer uma forma escrita de pronunciá-la em português brasileiro. Esse ajuste também é enviado ao Gemini e não altera o nome exibido. Depois de sua confirmação, o Sparky pode usar o nome em recados de boas-vindas e prática, gerados somente quando você pede para ouvir. Você pode continuar sem o nome falado e mudar essa escolha no Perfil.")}</p>
      <p>{t("Os áudios do nome e dos recados personalizados ficam em armazenamento privado, acessível somente à conta autenticada. O áudio provisório deixa de ser acessível em 24 horas e é removido na limpeza diária seguinte. Depois da conclusão, permanece até a mudança do nome, ajuste de pronúncia, escolha de continuar sem o nome falado ou exclusão da personalização. As preferências podem ser editadas no Perfil. A exclusão de dados nos sistemas do Google segue as condições do fornecedor; o Sparky não controla essa retenção.")}</p>
      <h2>{t("Prática com músicas")}</h2>
      <p>{t("Seu avanço e vocabulário de músicas são sincronizados na conta quando o serviço está disponível. Gravações de shadowing são opcionais, duram até 15 segundos e ficam somente na memória desta aba. O áudio não é enviado ao servidor e é descartado ao sair da prática.")}</p>
      <h2>{t("Tentativas e retomada")}</h2>
      <p>{t("O armazenamento local deste navegador guarda sua etapa atual, respostas, consultas a explicações e traduções, rascunhos, versões dos textos, preferências de estudo. Esses dados ficam separados por conta e permanecem após fechar a aba ou sair. Não são criptografados no armazenamento local: em dispositivos compartilhados, limpe os dados do site ao terminar. Limpar os dados do site elimina a cópia local.")}</p>
      <p>{t("As respostas dos exercícios fechados são enviadas ao servidor para verificação. Um comprovante criptografado de até oito horas permite validar a conclusão sem guardar os textos das respostas no cookie. Escrita livre permanece local e não é enviada a um serviço de IA. O histórico local mantém até 600 tentativas, 100 versões de escrita e 200 frases. Os registros mais antigos cedem espaço aos novos.")}</p>
      <h2>{t("Ritmo de estudo")}</h2>
      <p>{t("Para avaliar o ritmo das lições, guardamos no armazenamento privado da Vercel um identificador derivado da conta, sessão, versão do conteúdo, questão atual, acertos, erros, uso de ajuda e tempo ativo. Os eventos registram início, tentativa, abandono e conclusão, sem nome, e-mail, texto de respostas ou áudio. O relatório compara conclusão, duração e retorno em 1 e 7 dias. Recordes do Desafio ficam neste dispositivo, separados por conta e versão.")}</p>
      <h2>{t("Moedas e roupas")}</h2>
      <p>{t("As moedas são virtuais, não têm valor monetário e não podem ser compradas, transferidas ou trocadas por dinheiro. O servidor calcula recompensas a partir da primeira conclusão de cada lição, da conclusão de módulos, de revisões vencidas e de marcos de sete dias de acesso. O app não usa voz, respostas erradas ou dados pessoais para reduzir recompensas.")}</p>
      <h2>{support === "en" ? "Retired Expeditions" : "Expedições encerradas"}</h2>
      <p>{support === "en"
        ? "Expeditions and interactive stories are no longer offered. Coins paid for Expeditions are returned to the account balance once. Purchase receipts and previous progress remain in the account for recordkeeping; they are no longer used to suggest activities or send review reminders."
        : "Expedições e histórias interativas deixaram de ser oferecidas. As moedas pagas por Expedições voltam uma única vez ao saldo da conta. Comprovantes de compra e progresso anterior permanecem na conta como registro; não são usados para sugerir atividades ou enviar revisões."}</p>
      <p>{support === "en"
        ? "Past pilot events in Vercel private storage retain their original 90-day limit and are removed by the following daily cleanup, subject to scheduling delays. They contain derived account identifiers and closed results, without names, email addresses, answer text or audio."
        : "Eventos anteriores do piloto no armazenamento privado da Vercel mantêm o prazo original de 90 dias e são removidos na limpeza diária seguinte, sujeita a atrasos de execução. Contêm identificadores derivados da conta e resultados fechados, sem nome, e-mail, texto das respostas ou áudio."}</p>
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
      <h2>{t("Notificações")}</h2>
      <p>{support === "en"
        ? "The notification center stores study reminders, their internal destination, creation and read time for 30 days, linked to a derived account identifier. Opening the center marks its existing notices as read across your devices. The history starts with this feature; earlier pushes were not saved. Daily cleanup removes expired notices and delivery records, subject to scheduling delays."
        : "A central guarda lembretes de estudo, destino interno, criação e horário de leitura por 30 dias, sob um identificador derivado da conta. Abrir a central marca os avisos existentes como lidos nos seus aparelhos. O histórico começa com este recurso; os push anteriores não eram guardados. A limpeza diária remove avisos e entregas vencidos, sujeita a atrasos de execução."}</p>
      <p>{support === "en"
        ? "We sync your daily goal and minimal lesson summaries: objective, session identifier, start, last activity, completion and counted active time. These summaries expire after 30 days and contain no answer text, drafts or authentication tokens. Completed lesson and trail-review time is counted once per session. Goal reminders start the day after importing your preference; no previous study time is invented."
        : "Sincronizamos a meta diária e resumos mínimos das lições: objetivo, identificador da sessão, início, última atividade, conclusão e tempo ativo contabilizado. Esses resumos expiram após 30 dias e não contêm respostas, rascunhos ou tokens de autenticação. O tempo das lições e revisões da trilha concluídas é contado uma vez por sessão. Lembretes de meta começam no dia seguinte à importação da preferência; não inventamos tempo estudado anteriormente."}</p>
      <p>{support === "en"
        ? "Push permission is requested only when you choose to enable it. A technical device subscription and separate delivery status allow up to one review, one resume and one goal push each day per account, with a copy on each authorized device. Settings control these reminders. The center also works without push permission. Dismissing a system push does not mark it as read. Signing out cancels this device's subscription; expired subscriptions are removed after rejection by the provider."
        : "A permissão push é solicitada somente quando você escolhe ativá-la. Uma assinatura técnica do aparelho e registros separados de entrega permitem até um push de revisão, um de retomada e um de meta por dia na conta, com cópia em cada aparelho autorizado. Você controla os tipos nas configurações. A central também funciona sem permissão push. Dispensar o aviso do sistema não o marca como lido. Sair cancela a assinatura neste aparelho; assinaturas vencidas são removidas após rejeição do serviço."}</p>
      <h2>{t("Publicidade e contato")}</h2>
      <p>
        O app não exibe anúncios nem possui feed público. Para solicitar acesso
        ou tratar de dados da sua conta, fale com o administrador pelo e-mail{" "}
        <a href="mailto:rafaelmodiecai@gmail.com">{t("rafaelmodiecai@gmail.com")}</a>.
      </p>
    </main>
  );
}
