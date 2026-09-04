export type LessonStepKind =
  | "teach"
  | "example"
  | "dialogue"
  | "vocabulary"
  | "production"
  | "choice"
  | "complete_sentence"
  | "order_words"
  | "match"
  | "summary";

export type ReviewItem = {
  id: string;
  userId: string;
  lessonStepId: string;
  dueAt: string;
  intervalDays: number;
  ease: number;
  repetitions: number;
  lapses: number;
};

export interface SpeechProvider {
  transcribe(input: Blob, locale: string): Promise<{ text: string; confidence?: number }>;
  synthesize(text: string, voice: string, locale: string): Promise<{ audioUrl: string }>;
  scorePronunciation?(input: {
    audio: Blob;
    targetText: string;
    transcript: string;
  }): Promise<{ score: number; wordScores: Array<{ word: string; score: number }> }>;
}
