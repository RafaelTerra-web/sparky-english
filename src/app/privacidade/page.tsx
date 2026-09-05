import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <Link href="/">← Voltar ao Sparky English</Link>
      <h1>Como seus dados são usados</h1>
      <p>
        O Sparky English é um espaço privado para estudar inglês com explicações
        em português do Brasil.
      </p>
      <h2>Entrada com Google</h2>
      <p>
        Ao entrar, recebemos do Google seu nome, e-mail verificado e
        identificador de conta. Esses dados identificam você e permitem
        verificar se o seu e-mail está autorizado. A integração usa apenas a
        identificação básica; não solicita acesso ao Gmail, Drive ou contatos.
      </p>
      <h2>Sessão e progresso</h2>
      <p>
        A sessão é mantida em um cookie criptografado, inacessível ao JavaScript
        da página, com validade de até 7 dias. Sair da conta apaga esse cookie
        no navegador.
      </p>
      <p>
        Conclusões, datas de revisão, moedas, inventário, roupas equipadas e o
        mascote escolhido são compactados em um segundo cookie criptografado,
        inacessível ao JavaScript e ligado ao identificador da sua Conta Google.
        Ele pode permanecer neste navegador por até um ano mesmo depois do
        logout, para que o progresso reapareça no próximo acesso da mesma conta.
        Contas diferentes usam estados separados.
      </p>
      <p>
        Essa persistência ainda não é um banco de dados e não sincroniza entre
        navegadores ou dispositivos. Limpar os cookies do site remove o
        progresso, saldo e inventário daquele navegador. Alterações simultâneas
        em abas diferentes podem sobrescrever a mudança mais recente; faça
        compras em uma aba por vez. Respostas de autenticação e dados da conta
        não são armazenados no cache offline. Rascunhos de escrita continuam
        temporários e são apagados ao avançar ou fechar a lição.
      </p>
      <h2>Moedas e roupas</h2>
      <p>
        As moedas são virtuais, não têm valor monetário e não podem ser compradas,
        transferidas ou trocadas por dinheiro. O servidor calcula recompensas a
        partir da primeira conclusão de cada lição, da conclusão de módulos e de
        revisões vencidas. O app não usa voz, respostas erradas ou dados pessoais
        para reduzir recompensas.
      </p>
      <h2>Ouvir a pronúncia</h2>
      <p>
        A reprodução usa a síntese de voz do navegador e vozes disponibilizadas
        pelo dispositivo. Algumas são locais; outras podem enviar o texto do
        exemplo ao serviço de síntese do navegador. O seletor identifica a
        informação de processamento local fornecida pelo navegador. Apenas a
        frase do curso é enviada para reprodução, não seus rascunhos ou dados da
        conta. Os perfis dos mascotes ajustam velocidade e altura; não clonam
        vozes de pessoas reais.
      </p>
      <h2>Prática opcional com microfone</h2>
      <p>
        O microfone não é ligado automaticamente. Primeiro você confirma o aviso
        na lição, depois clica em Começar a falar e autoriza o navegador quando
        solicitado. A escuta termina após um resultado ou no limite de 20
        segundos. O botão Parar, a troca de etapa, o fechamento da lição e a
        saída da aba interrompem a captura.
      </p>
      <p>
        O reconhecimento é fornecido pelo navegador. Dependendo dele, seu áudio
        pode ser enviado a um serviço externo, como o serviço do Google no
        Chrome, e exigir internet. As regras de processamento e retenção desse
        serviço são as do respectivo fornecedor; o Sparky não controla nem
        promete excluir dados dos sistemas dele. Não fale senhas ou informações
        pessoais durante a prática.
      </p>
      <p>
        O Sparky não cria arquivos de gravação e não salva áudio ou transcrições
        em banco, armazenamento local ou cache. O texto reconhecido fica
        temporariamente em memória e pode ser apagado pelo botão Apagar
        transcrição; também desaparece ao trocar de etapa ou fechar a lição. O
        resultado compara palavras, não avalia fonemas, sotaque ou proficiência.
        Você pode concluir as lições sem usar voz.
      </p>
      <p>
        Para revogar o acesso ao microfone, use as permissões do site no
        navegador. Negar a permissão não bloqueia o curso escrito.
      </p>
      <h2>Publicidade e contato</h2>
      <p>
        O app não exibe anúncios nem possui feed público. Para solicitar acesso
        ou tratar de dados da sua conta, fale com o administrador pelo e-mail{" "}
        <a href="mailto:rafaelmodiecai@gmail.com">rafaelmodiecai@gmail.com</a>.
      </p>
    </main>
  );
}
