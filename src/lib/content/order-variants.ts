/** Equivalent placements explicitly reviewed for these sentence patterns. */
export function orderVariants(sentence: string): string[] {
  const text = sentence.replace(/[.!?]$/, "");
  const variants: string[] = [];
  const time = /^(.*) (every (?:day|morning|evening)|on (?:Sundays|Mondays|Monday|Thursday|Friday|Saturday)|last (?:night|week|weekend|month|year|Friday)|this (?:morning|evening|week|year)|yesterday|today|tomorrow)$/;
  const match = time.exec(text);
  if (match && !/^(?:What|How|Do |Does |Is |Are |Can |Could |Would |Please |See |Meet |When |If |Although |While )/.test(text)) {
    variants.push(match[2] + ", " + match[1] + ".");
  }
  const condition = /^(If|Although|While) ([^,]+), (.+)$/i.exec(text);
  if (condition) variants.push(condition[3] + " " + condition[1].toLowerCase() + " " + condition[2] + ".");
  const adjectives = /^(.*\b)(cold and windy|hot and sunny|large and quiet|small and quiet|quiet and free)(.*)$/;
  const joined = adjectives.exec(text);
  if (joined) {
    const [first, second] = joined[2].split(" and ");
    variants.push(joined[1] + second + " and " + first + joined[3] + ".");
  }
  return variants;
}
export const normalizeOrderAnswer = (value: string) => value.normalize("NFC").toLowerCase().replace(/[.,;:!?]/g, "").replace(/\s+/g, " ").trim();
