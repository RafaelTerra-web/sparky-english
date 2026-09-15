export type MascotVoice = "sparky" | "pinky";
export type RecognitionCallbacks = {
  onStart(): void; onResult(text: string, alternatives?: string[]): void;
  onError(code: string): void; onEnd(): void;
};
type RecognitionResult = { isFinal: boolean; length?: number; [index: number]: { transcript: string } };
type BrowserRecognition = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; abort(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserRecognition;
  webkitSpeechRecognition?: new () => BrowserRecognition;
};
/** Recognition only; mascot playback uses published, pre-generated audio files. */
export class BrowserSpeechProvider {
  private recognition: BrowserRecognition | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private recognitionConstructor() {
    if (typeof window === "undefined") return undefined;
    return (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
  }
  canRecognize() {
    return typeof window !== "undefined" && window.isSecureContext && Boolean(this.recognitionConstructor());
  }
  recognize(locale: string, callbacks: RecognitionCallbacks) {
    this.stop();
    const Recognition = this.recognitionConstructor();
    if (!Recognition || !this.canRecognize()) {
      callbacks.onError("not-supported"); callbacks.onEnd(); return;
    }
    const generation = this.generation;
    const recognition = new Recognition();
    this.recognition = recognition;
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.onstart = () => { if (generation === this.generation) callbacks.onStart(); };
    recognition.onresult = event => {
      if (generation !== this.generation) return;
      const finals = Array.from(event.results).filter(result => result.isFinal);
      if (!finals.length) return;
      const alternatives = Array.from({ length: Math.min(3, finals[0].length ?? 1) }, (_, rank) =>
        finals.map(result => (result[rank] ?? result[0]).transcript).join(" ").trim());
      const text = alternatives[0];
      if (!text) return;
      this.stop(); callbacks.onResult(text, alternatives); callbacks.onEnd();
    };
    recognition.onerror = event => {
      if (generation !== this.generation) return;
      this.stop(); callbacks.onError(event.error); callbacks.onEnd();
    };
    recognition.onend = () => {
      if (generation !== this.generation) return;
      this.stop(); callbacks.onEnd();
    };
    this.timer = setTimeout(() => {
      this.stop(); callbacks.onError("timeout"); callbacks.onEnd();
    }, 20000);
    try { recognition.start(); }
    catch { this.stop(); callbacks.onError("start-failed"); callbacks.onEnd(); }
  }
  stop() {
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const recognition = this.recognition;
    this.recognition = null;
    if (recognition) {
      recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
      try { recognition.abort(); } catch { /* Already ended by the browser. */ }
    }
  }
}
const nameVariants = [
  ["ana", "anna"], ["sara", "sarah"], ["sofia", "sophia"], ["john", "jon"],
  ["luca", "luka"], ["clara", "klara"], ["catherine", "katherine", "katharine"],
  ["steven", "stephen"], ["sean", "shawn", "shaun"], ["nora", "norah"], ["isabel", "isabelle"],
  ["lia", "lea", "leah"],
] as const;
const smallNumbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const spellingVariants: Record<string, string> = {
  coloured: "colored", travelling: "traveling", travelled: "traveled",
  emphasised: "emphasized", emphasise: "emphasize", emphasising: "emphasizing",
  programme: "program", programmes: "programs", scepticism: "skepticism",
  analyse: "analyze", analysed: "analyzed", analysing: "analyzing",
  colour:"color", colours:"colors", favourite:"favorite", favourites:"favorites",
  favour:"favor", favours:"favors", organisation:"organization", organisations:"organizations",
  judgement:"judgment", judgements:"judgments", centre:"center", centres:"centers",
  behaviour:"behavior", behaviours:"behaviors",
};
function spokenNumber(digits: string): string {
  // Only ordinary cardinals. Leading-zero codes and large identifiers stay literal.
  if (!/^(0|[1-9]\d{0,1})$/.test(digits)) return digits;
  const value = Number(digits);
  return smallNumbers[value] ?? [tens[Math.floor(value / 10)], value % 10 ? smallNumbers[value % 10] : ""].filter(Boolean).join(" ");
}
export function normalizeSpeech(text: string) {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[’‘]/g, "'")
    .replace(/\bcan't\b/g, "cannot").replace(/\bcan not\b/g, "cannot")
    .replace(/\bwon't\b/g, "will not").replace(/\bi'm\b/g, "i am")
    .replace(/\b(you|we|they)'re\b/g, "$1 are")
    .replace(/\b(i|you|we|they)'ve\b/g, "$1 have")
    .replace(/\b(i|you|we|they|he|she|it)'ll\b/g, "$1 will")
    // Expand 's only before clear nominal complements. Participles remain ambiguous (is/has).
    .replace(/\b(what|where|how|who|that|there|it|he|she)'s(?=\s+(?:a|an|the|my|your|his|her|our|their)\b)/g, "$1 is")
    .replace(/\b(is|are|was|were|do|does|did|has|have|had|could|would|should)n't\b/g, "$1 not")
    .replace(/(?<!\w)[-−](?=\d)/g, "minus ")
    .replace(/\b\d+\.\d+\b/g, number => {
      const [whole, fraction] = number.split(".");
      return spokenNumber(whole) + " point " + fraction.split("").map(digit => smallNumbers[Number(digit)]).join(" ");
    })
    .replace(/\b\d+\b/g, spokenNumber)
    .replace(/[^a-z0-9'\s]/g, " ").replace(/\b[a-z]+\b/g, word => spellingVariants[word] ?? word)
    .replace(/\s+/g, " ").trim();
}
/** Text alignment, not pronunciation grading. No fuzzy match of arbitrary words. */
export function compareTranscript(target: string, heard: string) {
  const tooLong = target.length > 4000 || heard.length > 4000;
  const rawExpected = normalizeSpeech(target.slice(0, 4000)).split(" ").filter(Boolean);
  const heardWords = normalizeSpeech(heard.slice(0, 4000)).split(" ").filter(Boolean);
  // Resolve the genuinely ambiguous 's from the published target: it may mean is or has.
  const rawReceived = heardWords.flatMap(word => {
    const match = /^(he|she|it)'s$/.exec(word);
    if (!match) return [word];
    const subject = match[1];
    if (rawExpected.some((expected, index) => expected === subject && rawExpected[index + 1] === "is")) return [subject, "is"];
    if (rawExpected.some((expected, index) => expected === subject && rawExpected[index + 1] === "has")) return [subject, "has"];
    return [word];
  });
  const limited = tooLong || rawExpected.length > 160 || rawReceived.length > 160;
  const names = new Set((target.slice(0, 4000).match(/\b[A-Z][a-z]+\b/g) ?? []).map(normalizeSpeech));
  const groups = nameVariants.filter(group => group.some(name => names.has(name)));
  const canonical = (word: string) => {
    const possessive = word.endsWith("'s") ? "'s" : "";
    const name = possessive ? word.slice(0, -2) : word;
    return (groups.find(group => (group as readonly string[]).includes(name))?.[0] ?? name) + possessive;
  };
  const expected = rawExpected.slice(0, 160).map(canonical);
  const received = rawReceived.slice(0, 160).map(canonical);
  const lengths = Array.from({ length: expected.length + 1 }, () => Array(received.length + 1).fill(0) as number[]);
  for (let i = expected.length - 1; i >= 0; i--)
    for (let j = received.length - 1; j >= 0; j--)
      lengths[i][j] = expected[i] === received[j] ? 1 + lengths[i + 1][j + 1] : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
  const matched = new Set<number>(), heardMatches = new Set<number>();
  let i = 0, j = 0;
  while (i < expected.length && j < received.length) {
    if (expected[i] === received[j]) { matched.add(i++); heardMatches.add(j++); }
    else if (lengths[i + 1][j] >= lengths[i][j + 1]) i++;
    else j++;
  }
  return {
    exact: !limited && expected.length > 0 && expected.join(" ") === received.join(" "),
    limited,
    nameVariantAccepted: !limited && expected.join(" ") === received.join(" ") && rawExpected.join(" ") !== rawReceived.join(" "),
    words: rawExpected.slice(0, 160).map((word, index) => ({ word, recognized: matched.has(index) })),
    extraWords: rawReceived.slice(0, 160).filter((_, index) => !heardMatches.has(index)),
  };
}
export function chooseTranscript(target: string, alternatives: string[]) {
  const candidates = alternatives.slice(0, 3);
  return candidates.find(text => compareTranscript(target, text).exact) ?? candidates[0] ?? "";
}
export function recognitionMessage(code: string) {
  const messages: Record<string, string> = {
    "not-allowed": "O acesso ao microfone foi recusado. Libere-o nas permissões do site para tentar novamente.",
    "service-not-allowed": "O serviço de reconhecimento não está autorizado neste navegador.",
    "audio-capture": "Nenhum microfone disponível. Confira a conexão e as configurações do dispositivo.",
    "no-speech": "Não foi detectada fala. Tente novamente em um ambiente mais silencioso.",
    network: "O serviço de reconhecimento não respondeu. Confira a internet e tente novamente.",
    "not-supported": "Este navegador não oferece reconhecimento de voz compatível. Você pode continuar os exercícios escritos.",
    timeout: "A escuta foi encerrada após 20 segundos. Toque novamente para outra tentativa.",
    aborted: "A escuta foi interrompida.",
  };
  return messages[code] ?? "Não foi possível reconhecer a fala agora. Tente novamente ou continue por escrito.";
}
