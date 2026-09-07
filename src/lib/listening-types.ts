export type ListeningQuestion = { question: string; choices: [string, string, string]; explanation: string };
export type ListeningConversation = {
  id: string;
  level: "B2" | "C1" | "C2";
  title: string;
  scene: string;
  context: string;
  turns: { speaker: "sparky" | "pinky"; text: string; translation: string }[];
  gist: ListeningQuestion;
  detail: ListeningQuestion;
  inference: ListeningQuestion;
  mediation: string;
};
export type ListeningAsset = {
  id: string;
  path: string;
  sha256: string;
  scriptSha256: string;
  durationSeconds: number;
  model: "gemini-3.1-flash-tts-preview";
  voices: { sparky: "Achird"; pinky: "Zephyr" };
  generatedAt: string;
  review: { status: "pending" | "approved"; pronunciation: boolean; naturalness: boolean; cleanAudio: boolean; turns: boolean; coherence: boolean };
};
