"use client";
import { useState } from "react";
import { uiT, supportT, useCurrentInterfaceLanguage, useSupportLanguage, setLearningLanguageMode } from "@/lib/interface-language";
import { languageMode, type LearningLanguageMode } from "@/lib/language-policy";

export function LearningLanguagePreferences({ userId }: { userId: string }) {
  const locale = useCurrentInterfaceLanguage();
  const support = useSupportLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function choose(mode: LearningLanguageMode) {
    setBusy(true); setError(false);
    try { await setLearningLanguageMode(mode, userId); }
    catch { setError(true); }
    finally { setBusy(false); }
  }
  return <section className="learning-language-preferences" aria-labelledby="learning-language-label">
    <div className="profile-setting">
      <label id="learning-language-label" htmlFor="learning-language-mode">{uiT("Idiomas e apoio")}</label>
      <select id="learning-language-mode" value={locale === "pt-BR" && support === "en" ? "custom" : languageMode(locale, support)} disabled={busy} onChange={event => void choose(event.target.value as LearningLanguageMode)}>
        {locale === "pt-BR" && support === "en" && <option value="custom" disabled>{uiT("Português + explicações em inglês")}</option>}
        <option value="guided">{uiT("Português + prática em inglês")}</option>
        <option value="bridge">{uiT("Interface em inglês + apoio em português")}</option>
        <option value="immersion">{uiT("Imersão em inglês")}</option>
      </select>
    </div>
    <p lang={support} className="language-preference-note">{supportT("As frases e os exercícios continuam em inglês. A tradução em português fica disponível quando você pedir.")}</p>
    <details><summary>{uiT("Qual modo escolher?")}</summary><p lang={support}>{supportT("Comece com português nos níveis A1–B1. Experimente a interface em inglês mantendo o apoio; a partir de B2, a imersão é uma opção. Você decide quando mudar.")}</p><p lang={support}>{supportT("Esta preferência fica salva para sua conta neste navegador. Ela não muda suas lições, notas ou progresso.")}</p></details>
    {error && <p role="alert" lang={support}>{supportT("Não foi possível carregar o inglês. Tente novamente.")}</p>}
  </section>;
}
