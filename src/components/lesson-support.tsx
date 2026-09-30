"use client";
import { useState } from "react";
import type { Lesson } from "@/lib/curriculum";
import type { MascotId } from "@/lib/rewards-shared";
import { contentVersion } from "@/lib/content/build";
import { writingLimit, readWorkspace, updateWorkspace } from "@/lib/learning-local";
import { supportT, supportTemplate, t, useSupportLanguage, useCurrentInterfaceLanguage, localizeAttribute } from "@/lib/interface-language";
import { vocabularyEntries } from "@/lib/language-policy";
import { SpeechPractice } from "./speech-practice";

export default function LessonSupport({ lesson, mascot = "sparky", userId, textOnly = false }:
  { lesson: Lesson; mascot?: MascotId; userId?: string; textOnly?: boolean }) {
  const language = useSupportLanguage();
  useCurrentInterfaceLanguage();
  const support = lesson.support ?? lesson.steps;
  const example = support.find(step => step.kind === "example");
  const production = support.find(step => step.kind === "production");
  const speakingTemplate = "Crie uma versão pessoal de “{0}”. Diga-a uma vez com cuidado e outra copiando o ritmo natural do áudio.";
  const personalSpeaking = production?.speakingTask === speakingTemplate.replace("{0}", example?.english ?? "");
  const [writing, setWriting] = useState(() => userId ? readWorkspace(userId).writings.filter(item => item.lessonId === lesson.id).at(-1)?.text ?? "" : "");
  function save(text: string) {
    setWriting(text);
    if (!userId) return;
    updateWorkspace(userId, current => ({ ...current, writings: [...current.writings.filter(item => item.id !== "practice:" + lesson.id),
      { id: "practice:" + lesson.id, lessonId: lesson.id, text, createdAt: new Date().toISOString(), contentVersion }].slice(-100) }));
  }
  return <div className="quick-support" data-lesson-support>
    {support.filter(step => step.kind === "teach" || step.kind === "vocabulary").map((step, i) =>
      <section key={i}><h3>{t(step.kind === "teach" ? "A ideia principal" : "Vocabulário")}</h3>
        {step.kind === "vocabulary" ? (() => {
          const entries = vocabularyEntries(step.body);
          return <>
            <ul>{entries.map((item, n) => <li key={n}><span lang="en">{item.term}</span>{language === "pt-BR" && item.meaning && <> — <span lang="pt-BR">{item.meaning}</span></>}</li>)}</ul>
            {language === "en" && entries.some(item => item.meaning) && <details><summary>{t("Ver significados em português")}</summary>
              <ul>{entries.map((item, n) => <li key={n}><span lang="en">{item.term}</span>{item.meaning && <> — <span lang="pt-BR">{item.meaning}</span></>}</li>)}</ul>
            </details>}
          </>;
        })() : <p lang={language} style={{ whiteSpace: "pre-line" }}>{supportT(step.body)}</p>}</section>)}
    {example?.english && <details><summary>{t("Ouvir e praticar a pronúncia")}</summary>
      <p lang="en">{example.english}</p>
      {example.translation && <details><summary>{t("Ver tradução em português")}</summary><p lang="pt-BR" data-language-role="translation">{example.translation}</p></details>}
      {process.env.NEXT_PUBLIC_VOICE_ENABLED !== "false" && <SpeechPractice lessonId={lesson.id} text={example.english} initialMascot={mascot} personalVoiceDisabled={textOnly} />}
      {support.find(step => step.kind === "pronunciation")?.pronunciation && (() => {
        const guide = support.find(step => step.kind === "pronunciation")!.pronunciation!;
        return <section><h3 lang={language}>{supportT(guide.focus)}</h3><p lang={language}>{supportT(guide.mouth)}</p>
          <p lang={language}>{supportT(guide.natural)}</p><ol>{guide.drill.map((line, i) => <li key={i} lang="en">{line}</li>)}</ol></section>;
      })()}
    </details>}
    {support.filter(step => step.kind === "dialogue" || step.kind === "error_analysis").map((step, i) =>
      <details key={i}><summary>{t(step.kind === "dialogue" ? "Contexto completo" : "Entender o erro")}</summary>
        <p lang={language}>{supportT(step.body)}</p>
        {step.english && <p lang="en" style={{ whiteSpace: "pre-line" }}>{step.english}</p>}
        {step.translation && <details><summary>{t("Ver tradução em português")}</summary><p lang="pt-BR" data-language-role="translation">{step.translation}</p></details>}
        {step.contrasts?.map((item, n) => <p key={n} lang="en">{item.text}</p>)}
      </details>)}
    {production && <details><summary>{t("Praticar com suas palavras")}</summary>
      <p lang={language}>{supportT(production.body)}</p>
      <p lang={language}>{personalSpeaking ? supportTemplate(speakingTemplate, example!.english!) : supportT(production.speakingTask)}</p>
      {userId && <label>{t("Seu rascunho")}<textarea aria-label={localizeAttribute("Seu rascunho")} lang="en" value={writing} maxLength={writingLimit} rows={5} onChange={event => save(event.target.value)} /></label>}
    </details>}
  </div>;
}
