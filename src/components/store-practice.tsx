"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { practiceCatalog } from "@/lib/rewards-shared";
import { storeMissions, type StoreMission } from "@/lib/content/store-missions";
import { readWorkspace, updateWorkspace } from "@/lib/learning-local";
import { contentVersion } from "@/lib/content/build";

function Decision({ data, number }: { data: StoreMission["decisions"][number]; number: number }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  return <fieldset className="mission-decision"><legend>{number}. {data.question}</legend>
    <div className="mission-options">{data.options.map((option, index) => <button key={option} aria-pressed={choice === index} onClick={() => { setChoice(index); setChecked(false); }} lang="en">{option}</button>)}</div>
    <button className="secondary-button" disabled={choice === null || checked} onClick={() => setChecked(true)}>Conferir decisão</button>
    {checked && <div className="mission-feedback" role="status"><strong>{choice === data.answer ? "Essa escolha atende ao contexto." : "Releia a pista e tente outra escolha."}</strong><p>{data.explanation}</p></div>}
  </fieldset>;
}

function Mission({ data, userId, packId }: { data: StoreMission; userId: string; packId: string }) {
  const writingId = `mission:${packId}:${data.id}`;
  const [draft, setDraft] = useState(() => readWorkspace(userId).writings.filter(w => w.lessonId === writingId).at(-1)?.text.slice(0, 6000) ?? "");
  const [saveError, setSaveError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <article className="store-mission"><h3 ref={heading} tabIndex={-1}>{data.title}</h3>
    <p>Leia a situação, tome duas decisões e crie uma resposta sua.</p>
    <blockquote lang="en">{data.scene}</blockquote>
    {data.decisions.map((decision, index) => <Decision key={index} data={decision} number={index + 1} />)}
    <section className="mission-writing"><h4>Agora use suas palavras</h4><p>{data.writing}</p>
      <label htmlFor="mission-draft">Seu rascunho da missão</label><textarea id="mission-draft" lang="en" rows={6} maxLength={6000} value={draft} onChange={event => {
        const text = event.target.value; setDraft(text);
        setSaveError(!updateWorkspace(userId, current => ({ ...current, writings: [...current.writings.filter(w => w.id !== writingId), { id: writingId, lessonId: writingId, text, createdAt: new Date().toISOString(), contentVersion }].slice(-100) })));
      }} />
      <p role={saveError ? "alert" : undefined}>{saveError ? "O navegador não conseguiu salvar. Copie seu texto antes de sair." : "Rascunho salvo no Caderno deste navegador. Você pode fechar e retomar, exportar ou apagar pelo Caderno."}</p>
      <details className="learning-disclosure"><summary>Ver uma resposta possível</summary><blockquote lang="en">{data.model}</blockquote><p>Use como referência e adapte ao seu objetivo. Nos textos longos, este é um trecho para começar.</p></details>
      <h4>Confira sua produção</h4><ul>{data.checklist.map(item => <li key={item}>{item}</li>)}</ul>
      <p>Diga sua resposta em voz alta e depois reformule sem ler. Esta prática extra não atribui nota, moedas ou conclusão no curso principal.</p>
    </section>
  </article>;
}

export function StorePractice({ packId, userId, onClose }: { packId: string; userId: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const pack = practiceCatalog.find(item => item.id === packId)!;
  const missions = storeMissions[packId];
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  return <dialog ref={dialog} className="store-practice-dialog" aria-labelledby="store-practice-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><p className="eyebrow">Missões extras · {pack.level}</p><h2 id="store-practice-title">{pack.name}</h2></div><button className="icon-button" aria-label="Fechar missões" onClick={onClose}><X size={20} /></button></header>
    <div className="mission-tabs" role="group" aria-label="Escolher missão">{missions.map((mission, i) => <button key={mission.id} aria-pressed={i === index} onClick={() => setIndex(i)}>{i + 1}. {mission.title}</button>)}</div>
    <Mission key={missions[index].id} data={missions[index]} userId={userId} packId={packId} />
  </dialog>;
}
