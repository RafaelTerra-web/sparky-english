"use client";
import { getInterfaceLocale, t } from "@/lib/interface-language";
import { useState } from "react";
import { lessons, type Lesson } from "@/lib/curriculum";
import { contentVersion } from "@/lib/content/build";
import { storeMissions } from "@/lib/content/store-missions";
import { notebookThemeCatalog } from "@/lib/rewards-shared";
import { blankWorkspace, updateWorkspace, writingLimit, type LearningWorkspace } from "@/lib/learning-local";

const missionTitles = Object.fromEntries(Object.entries(storeMissions).flatMap(([packId, missions]) => missions.map(m => [`mission:${packId}:${m.id}`, `Missão: ${m.title}`])));

export default function LearningNotebook({ userId, workspace, onOpen, themeId }: {
  userId: string; workspace: LearningWorkspace; onOpen: (lesson: Lesson, review?: boolean) => void; themeId: string | null;
}) {
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<{ lessonId: string; text: string } | null>(null);
  const latest = new Map<string, typeof workspace.attempts[number]>();
  for (const attempt of workspace.attempts) latest.set(`${attempt.contentVersion}:${attempt.stepId}`, attempt);
  const practice = [...latest.values()].filter(a => a.contentVersion === contentVersion && (!a.correct || a.assisted));
  const independent = [...latest.values()].filter(a => a.contentVersion === contentVersion && a.correct && !a.assisted).length;
  function exportData() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...workspace }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "sparky-caderno.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Caderno exportado. O arquivo contém seus textos e respostas pessoais.");
  }
  const theme = notebookThemeCatalog.find(item => item.id === themeId);
  return <div className={`learning-notebook ${theme?.className ?? ""}`}>
    <div className="page-heading"><div><p className="eyebrow">{t("Acompanhe seu aprendizado")}</p><h1>{t("Seu caderno de inglês")}</h1></div></div>
    {message && <p role="status" className="notice">{t(message)}</p>}
    <section className="profile-card notebook-section">
      <h2>{t("Seu plano de estudo")}</h2>
      <label htmlFor="study-goal">{t("O que você quer conseguir fazer?")}</label>
      <input id="study-goal" maxLength={120} value={workspace.goal} onChange={e => {
        if (!updateWorkspace(userId, current => ({ ...current, goal: e.target.value }))) setMessage("Não foi possível salvar a preferência neste navegador.");
      }} />
      <label htmlFor="study-minutes">{t("Tempo que você reservou por dia")}</label>
      <select id="study-minutes" value={workspace.minutes} onChange={e => updateWorkspace(userId, current => ({ ...current, minutes: Number(e.target.value) }))}>
        {[5,10,15,20].map(minutes => <option key={minutes} value={minutes}>{t(minutes)}{t(" minutos")}</option>)}
      </select>
      <p>{t("Comece retomando sua prática, faça uma revisão pendente e avance quando couber no seu tempo. O nível escolhido no Perfil orienta o catálogo; não é um diagnóstico.")}</p>
    </section>
    <section className="profile-card notebook-section">
      <h2>{t("O que sua prática mostra")}</h2>
      <p>{t(workspace.attempts.length)}{t(" tentativas registradas neste dispositivo. Considerando a resposta mais recente de cada exercício:")}<strong>{t(independent)}{t(" acertos sem ajuda")}</strong>{t(" e")}<strong>{t(practice.length)}{t(" exercícios para praticar novamente")}</strong>.</p>
      <p>{t("Consultar uma explicação faz parte de aprender. Depois, tente responder sem ajuda para conferir o que lembra. Estes registros não avaliam seu nível de inglês, sua escrita ou sua pronúncia.")}</p>
      <h3>{t("Exercícios para rever")}</h3>
      {!practice.length && <p>{t("Os exercícios em que você errar ou consultar uma explicação aparecerão aqui para praticar novamente.")}</p>}
      <div className="notebook-list">{practice.slice(-20).reverse().map(attempt => {
        const lesson = lessons.find(l => l.id === attempt.lessonId);
        return lesson && <article key={attempt.stepId}>
          <h4>{t(lesson.title)}</h4><p>{t(attempt.correct ? "Acerto com ajuda" : "Resposta para rever")} · {t(new Date(attempt.createdAt).toLocaleDateString(getInterfaceLocale()))}</p>
          <details><summary>{t("Consultar sua resposta e a explicação")}</summary><p lang="en">{attempt.answer}</p><p>{t(lesson.steps.find(s => `${lesson.id}:${s.kind}` === attempt.stepId)?.explanation)}</p></details>
          <button className="secondary-button" onClick={() => onOpen(lesson, true)}>{t("Praticar novamente")}</button>
        </article>;
      })}</div>
    </section>
    <section className="profile-card notebook-section">
      <h2>{t("Frases para usar")}</h2><p>{t("Guarde exemplos durante as lições. Tente lembrar o significado antes de revelar a tradução.")}</p>
      {!workspace.vocabulary.length && <p>{t("Seu caderno de frases está vazio.")}</p>}
      <div className="notebook-list">{workspace.vocabulary.map(item => <article key={item.id}><p lang="en">{item.english}</p><details><summary>{t("Ver significado")}</summary><p>{t(item.translation || "Sem tradução cadastrada.")}</p></details></article>)}</div>
    </section>
    <section className="profile-card notebook-section">
      <h2>{t("Escrita e novas versões")}</h2><p>{t("Seus textos ficam salvos neste dispositivo. Releia o que escreveu e revise a clareza, a estrutura e o vocabulário. Esta revisão não gera uma nota automática.")}</p>
      {!workspace.writings.length && <p>{t("As produções escritas das lições aparecerão aqui.")}</p>}
      {editing && <div className="production-workspace"><label htmlFor="writing-revision">{t("Sua nova versão")}</label><textarea id="writing-revision" lang="en" rows={7} maxLength={writingLimit} value={editing.text} onChange={e => setEditing({ ...editing, text: e.target.value })} />
        <button className="primary-button" disabled={!editing.text.trim()} onClick={() => {
          const ok = updateWorkspace(userId, current => ({ ...current, writings: [...current.writings, { ...editing, id: crypto.randomUUID(), contentVersion, createdAt: new Date().toISOString() }].slice(-100) }));
          if (ok) { setEditing(null); setMessage("Nova versão salva; a anterior foi mantida."); } else setMessage("Não foi possível salvar. Copie seu texto antes de sair.");
        }}>{t("Salvar nova versão")}</button></div>}
      <div className="notebook-list">{workspace.writings.slice(-20).reverse().map(writing => <article key={writing.id}><h3>{t(lessons.find(l => l.id === writing.lessonId)?.title || missionTitles[writing.lessonId] || "Produção escrita")}</h3><small>{t(new Date(writing.createdAt).toLocaleString(getInterfaceLocale()))}</small><p lang="en" className="preserve-lines">{writing.text}</p><button className="secondary-button" onClick={() => setEditing({ lessonId: writing.lessonId, text: writing.text })}>{t("Criar nova versão")}</button></article>)}</div>
    </section>
    <section className="profile-card notebook-section"><h2>{t("Seus dados neste dispositivo")}</h2><p>{t("O caderno guarda até 600 tentativas, 100 versões de texto e 200 frases. Dados antigos cedem espaço aos novos. Exporte antes de limpar os dados do site ou usar outro dispositivo. Em computadores compartilhados, apague o caderno ao terminar.")}</p>
      <button className="secondary-button" onClick={exportData}>{t("Exportar caderno")}</button>{t(" ")}
      <button className="text-button" onClick={() => {
        if (window.confirm("Apagar rascunhos, tentativas, textos, frases e preferências deste dispositivo? Exporte antes se quiser guardar uma cópia. Seu saldo e suas conclusões serão preservados.")) {
          setMessage(updateWorkspace(userId, () => blankWorkspace()) ? "Caderno apagado neste dispositivo." : "Não foi possível apagar o caderno.");
        }
      }}>{t("Apagar caderno local")}</button>
    </section>
  </div>;
}
