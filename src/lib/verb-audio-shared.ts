import manifest from './verb-audio-manifest.json' with { type:'json' };
import { verbAudioText } from './verb-practice.ts';
export const verbAudioModel='gemini-3.8-flash-tts';
export const verbAudioVoices={sparky:'Achird',pinky:'Zephyr'} as const;
export type VerbAudioMascot=keyof typeof verbAudioVoices;
export const verbAudioStyle='Warm adult English tutor. Natural American English, clear articulation, calm conversational pace. Brief pauses between the three verb forms. No music, sound effects or additional words.';
export function verbAudioIdentity(id:string,mascot:VerbAudioMascot){const text=verbAudioText(id);return text?{model:verbAudioModel,voice:verbAudioVoices[mascot],style:verbAudioStyle,text}:null;}
export function verbAudioUrl(id:string,mascot:VerbAudioMascot){return (manifest as Record<string,string>)[id+':'+mascot]??null;}
