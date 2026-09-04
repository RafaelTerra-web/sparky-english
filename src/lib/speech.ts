export type MascotVoice = "sparky" | "pinky";
export type VoiceOption = {
  id: string;
  name: string;
  locale: string;
  local: boolean;
};
export type RecognitionCallbacks = {
  onStart(): void;
  onResult(text: string): void;
  onError(code: string): void;
  onEnd(): void;
};
export interface LiveSpeechProvider {
  voices(): VoiceOption[];
  canSpeak(): boolean;
  canRecognize(): boolean;
  speak(
    text: string,
    options: { voiceId: string; mascot: MascotVoice; slow: boolean },
    onEnd: (error?: string) => void,
  ): void;
  recognize(locale: string, callbacks: RecognitionCallbacks): void;
  stop(): void;
}

export const mascotVoiceProfiles = {
  sparky: { pitch: 1.2, rate: 0.94, label: "Sparky · perfil masculino leve" },
  pinky: { pitch: 1.4, rate: 0.96, label: "Pinky · perfil feminino leve" },
} as const;

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<RecognitionResult>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserRecognition;
  webkitSpeechRecognition?: new () => BrowserRecognition;
};

/** Browser adapter: no recording files, server upload route, token or persisted transcript. */
export class BrowserSpeechProvider implements LiveSpeechProvider {
  private recognition: BrowserRecognition | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private recognitionConstructor() {
    if (typeof window === "undefined") return undefined;
    return (
      (window as SpeechWindow).SpeechRecognition ??
      (window as SpeechWindow).webkitSpeechRecognition
    );
  }
  canSpeak() {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window
    );
  }
  canRecognize() {
    return (
      typeof window !== "undefined" &&
      window.isSecureContext &&
      Boolean(this.recognitionConstructor())
    );
  }
  voices() {
    if (!this.canSpeak()) return [];
    return window.speechSynthesis
      .getVoices()
      .filter((voice) => /^en(?:-|_)/i.test(voice.lang))
      .map((voice) => ({
        id: voice.voiceURI,
        name: voice.name,
        locale: voice.lang,
        local: voice.localService,
      }));
  }
  speak(
    text: string,
    options: { voiceId: string; mascot: MascotVoice; slow: boolean },
    onEnd: (error?: string) => void,
  ) {
    this.stop();
    if (!this.canSpeak()) {
      onEnd("synthesis-unavailable");
      return;
    }
    const voice = window.speechSynthesis
      .getVoices()
      .find(
        (item) =>
          item.voiceURI === options.voiceId && /^en(?:-|_)/i.test(item.lang),
      );
    if (!voice) {
      onEnd("voice-unavailable");
      return;
    }
    const generation = this.generation;
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 2000));
    const profile = mascotVoiceProfiles[options.mascot];
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.pitch = profile.pitch;
    utterance.rate = options.slow ? 0.72 : profile.rate;
    this.utterance = utterance;
    const finish = (error?: string) => {
      if (generation !== this.generation) return;
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      this.utterance = null;
      onEnd(error);
    };
    utterance.onend = () => finish();
    utterance.onerror = () => finish("synthesis-error");
    this.timer = setTimeout(() => {
      this.stop();
      onEnd("synthesis-timeout");
    }, 45000);
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      this.stop();
      onEnd("synthesis-error");
    }
  }
  recognize(locale: string, callbacks: RecognitionCallbacks) {
    this.stop();
    const Recognition = this.recognitionConstructor();
    if (!Recognition || !this.canRecognize()) {
      callbacks.onError("not-supported");
      callbacks.onEnd();
      return;
    }
    const generation = this.generation;
    const recognition = new Recognition();
    this.recognition = recognition;
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      if (generation === this.generation) callbacks.onStart();
    };
    recognition.onresult = (event) => {
      if (generation !== this.generation) return;
      const text = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim()
        .slice(0, 2000);
      if (text) {
        this.stop();
        callbacks.onResult(text);
        callbacks.onEnd();
      }
    };
    recognition.onerror = (event) => {
      if (generation !== this.generation) return;
      this.stop();
      callbacks.onError(event.error);
      callbacks.onEnd();
    };
    recognition.onend = () => {
      if (generation !== this.generation) return;
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      this.recognition = null;
      callbacks.onEnd();
    };
    this.timer = setTimeout(() => {
      this.stop();
      callbacks.onError("timeout");
      callbacks.onEnd();
    }, 20000);
    try {
      recognition.start();
    } catch {
      this.stop();
      callbacks.onError("start-failed");
      callbacks.onEnd();
    }
  }
  stop() {
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition.abort();
      this.recognition = null;
    }
    if (this.utterance) {
      this.utterance.onend = null;
      this.utterance.onerror = null;
      this.utterance = null;
      window.speechSynthesis.cancel();
    }
  }
}

// Text comparison only. This deliberately is not a phonetic/pronunciation score.
export function normalizeSpeech(text: string) {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\b(can't)\b/g, "cannot")
    .replace(/\bwon't\b/g, "will not")
    .replace(/\b(i'm)\b/g, "i am")
    .replace(/\b(you're)\b/g, "you are")
    .replace(/\b(we're)\b/g, "we are")
    .replace(/\b(they're)\b/g, "they are")
    .replace(/\b(isn't)\b/g, "is not")
    .replace(/\b(aren't)\b/g, "are not")
    .replace(/\b(don't)\b/g, "do not")
    .replace(/\b(doesn't)\b/g, "does not")
    .replace(/\b(didn't)\b/g, "did not")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function compareTranscript(target: string, heard: string) {
  const expected = normalizeSpeech(target).split(" ").filter(Boolean);
  const received = normalizeSpeech(heard).split(" ").filter(Boolean);
  // Longest common subsequence respects order and repeated words.
  const lengths = Array.from(
    { length: expected.length + 1 },
    () => Array(received.length + 1).fill(0) as number[],
  );
  for (let i = expected.length - 1; i >= 0; i--)
    for (let j = received.length - 1; j >= 0; j--) {
      lengths[i][j] =
        expected[i] === received[j]
          ? 1 + lengths[i + 1][j + 1]
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  const matched = new Set<number>();
  let i = 0,
    j = 0;
  while (i < expected.length && j < received.length) {
    if (expected[i] === received[j]) {
      matched.add(i);
      i++;
      j++;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) i++;
    else j++;
  }
  return {
    exact: expected.length > 0 && expected.join(" ") === received.join(" "),
    words: expected.map((word, index) => ({
      word,
      recognized: matched.has(index),
    })),
  };
}

export function recognitionMessage(code: string) {
  const messages: Record<string, string> = {
    "not-allowed":
      "O acesso ao microfone foi recusado. Você pode liberá-lo nas permissões do site e tentar novamente.",
    "service-not-allowed":
      "O serviço de reconhecimento não está autorizado neste navegador.",
    "audio-capture":
      "Nenhum microfone disponível. Confira a conexão e as configurações do dispositivo.",
    "no-speech":
      "Não foi detectada fala. Tente novamente em um ambiente mais silencioso.",
    network:
      "O serviço de reconhecimento não respondeu. Confira a internet e tente novamente.",
    "not-supported":
      "Este navegador não oferece reconhecimento de voz compatível. Você pode continuar os exercícios escritos.",
    timeout:
      "A escuta foi encerrada após 20 segundos. Toque novamente para outra tentativa.",
    aborted: "A escuta foi interrompida.",
  };
  return (
    messages[code] ??
    "Não foi possível reconhecer a fala agora. Tente novamente ou continue por escrito."
  );
}
