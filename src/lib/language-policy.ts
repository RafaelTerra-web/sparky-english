export type InterfaceLocale = "pt-BR" | "en";
export type SupportLocale = "pt-BR" | "en";
export type TargetLanguage = "en";
export type LearningLanguageMode = "guided" | "bridge" | "immersion";
export const learningLanguageModes = {
  guided: { interfaceLocale: "pt-BR", supportLocale: "pt-BR" },
  bridge: { interfaceLocale: "en", supportLocale: "pt-BR" },
  immersion: { interfaceLocale: "en", supportLocale: "en" },
} as const;
export function languageMode(ui: InterfaceLocale, support: SupportLocale): LearningLanguageMode {
  return ui === "pt-BR" ? "guided" : support === "pt-BR" ? "bridge" : "immersion";
}
/** Learning stimuli, learner writing and assessment items bypass localization. */
export function targetText<T>(value: T): T { return value; }
/** A glossary contains English terms and authored Portuguese meanings, not UI copy. */
export function vocabularyEntries(text: string) {
  return text.split("\n").filter(line => line.trim()).map(line => {
    const separator = line.indexOf(" — ");
    return separator < 0 ? { term: line, meaning: undefined }
      : { term: line.slice(0, separator), meaning: line.slice(separator + 3) };
  });
}
/** Spelling exposure, not an error or a claim about the recorded accent. */
export function englishVariety(text: string): "US English" | "International English" {
  return /\b(colours?|favourites?|favours?|organisations?|centres?|behaviours?|programmes?|scepticism|coloured|emphasised|travelling|travelled)\b/i.test(text)
    ? "International English" : "US English";
}
