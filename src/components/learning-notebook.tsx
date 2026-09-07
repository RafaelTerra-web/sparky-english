"use client";
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
    <div className="page-heading"><div><p className="eyebrow">Aprender com evidências</p><h1>Seu caderno de inglês</h1></div></div>
    {message && <p role="status" className="notice">{message}</p>}
    <section className="profile-card notebook-section">
      <h2>Seu plano de estudo</h2>
      <label htmlFor="study-goal">O que você quer conseguir fazer?</label>
      <input id="study-goal" maxLength={120} value={workspace.goal} onChange={e => {
        if (!updateWorkspace(userId, current => ({ ...current, goal: e.target.value }))) setMessage("Não foi possível salvar a preferência neste navegador.");
      }} />
      <label htmlFor="study-minutes">Tempo que você reservou por dia</label>
      <select id="study-minutes" value={workspace.minutes} onChange={e => updateWorkspace(userId, current => ({ ...current, minutes: Number(e.target.value) }))}>
        {[5,10,15,20].map(minutes => <option key={minutes} value={minutes}>{minutes} minutos</option>)}
      </select>
      <p>Comece retomando sua prática, faça uma revisão pendente e avance quando couber no seu tempo. O nível escolhido no Perfil orienta o catálogo; não é um diagnóstico.</p>
    </section>
    <section className="profile-card notebook-section">
      <h2>O que sua prática mostra</h2>
      <p>{workspace.attempts.length} tentativas registradas neste dispositivo. Na tentativa mais recente de cada exercício: <strong>{independent} acertos sem ajuda</strong> e <strong>{practice.length} exercícios para recuperar sem apoio</strong>.</p>
      <p>Consultar uma explicação faz parte de aprender. Acertar após consultar ou tentar de novo não demonstra, sozinho, retenção. Estes dados não são uma nota de proficiência, escrita ou pronúncia.</p>
      <h3>Laboratório de erros e apoio</h3>
      {!practice.length && <p>Quando você errar ou consultar apoio, o exercício aparecerá aqui para uma nova prática.</p>}
      <div className="notebook-list">{practice.slice(-20).reverse().map(attempt => {
        const lesson = lessons.find(l => l.id === attempt.lessonId);
        return lesson && <article key={attempt.stepId}>
          <h4>{lesson.title}</h4><p>{attempt.correct ? "Acerto com apoio" : "Resposta para rever"} · {new Date(attempt.createdAt).toLocaleDateString("pt-BR")}</p>
          <details><summary>Consultar sua resposta e a explicação</summary><p lang="en">{attempt.answer}</p><p>{lesson.steps.find(s => `${lesson.id}:${s.kind}` === attempt.stepId)?.explanation}</p></details>
          <button className="secondary-button" onClick={() => onOpen(lesson, true)}>Praticar novamente</button>
        </article>;
      })}</div>
    </section>
    <section className="profile-card notebook-section">
      <h2>Frases para usar</h2><p>Guarde exemplos durante as lições. Tente lembrar o significado antes de revelar a tradução.</p>
      {!workspace.vocabulary.length && <p>Seu caderno de frases está vazio.</p>}
      <div className="notebook-list">{workspace.vocabulary.map(item => <article key={item.id}><p lang="en">{item.english}</p><details><summary>Ver significado</summary><p>{item.translation || "Sem tradução cadastrada."}</p></details></article>)}</div>
    </section>
    <section className="profile-card notebook-section">
      <h2>Escrita e novas versões</h2><p>Seus textos permanecem neste dispositivo. Revise clareza, estrutura e vocabulário; a auto-revisão não atribui uma nota automática.</p>
      {!workspace.writings.length && <p>As produções escritas das lições aparecerão aqui.</p>}
      {editing && <div className="production-workspace"><label htmlFor="writing-revision">Sua nova versão</label><textarea id="writing-revision" lang="en" rows={7} maxLength={writingLimit} value={editing.text} onChange={e => setEditing({ ...editing, text: e.target.value })} />
        <button className="primary-button" disabled={!editing.text.trim()} onClick={() => {
          const ok = updateWorkspace(userId, current => ({ ...current, writings: [...current.writings, { ...editing, id: crypto.randomUUID(), contentVersion, createdAt: new Date().toISOString() }].slice(-100) }));
          if (ok) { setEditing(null); setMessage("Nova versão salva; a anterior foi mantida."); } else setMessage("Não foi possível salvar. Copie seu texto antes de sair.");
        }}>Salvar nova versão</button></div>}
      <div className="notebook-list">{workspace.writings.slice(-20).reverse().map(writing => <article key={writing.id}><h3>{lessons.find(l => l.id === writing.lessonId)?.title || missionTitles[writing.lessonId] || "Produção escrita"}</h3><small>{new Date(writing.createdAt).toLocaleString("pt-BR")}</small><p lang="en" className="preserve-lines">{writing.text}</p><button className="secondary-button" onClick={() => setEditing({ lessonId: writing.lessonId, text: writing.text })}>Criar nova versão</button></article>)}</div>
    </section>
    <section className="profile-card notebook-section"><h2>Seus dados neste dispositivo</h2><p>O caderno guarda até 600 tentativas, 100 versões de texto e 200 frases. Dados antigos cedem espaço aos novos. Exporte antes de limpar os dados do site ou usar outro dispositivo. Em computadores compartilhados, apague o caderno ao terminar.</p>
      <button className="secondary-button" onClick={exportData}>Exportar caderno</button>{" "}
      <button className="text-button" onClick={() => {
        if (window.confirm("Apagar rascunhos, tentativas, textos, frases e preferências deste dispositivo? Exporte antes se quiser guardar uma cópia. Seu saldo e suas conclusões serão preservados.")) {
          setMessage(updateWorkspace(userId, () => blankWorkspace()) ? "Caderno apagado neste dispositivo." : "Não foi possível apagar o caderno.");
        }
      }}>Apagar caderno local</button>
    </section>
  </div>;
}
