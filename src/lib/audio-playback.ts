let activeSession: { owner: object; stop: () => void } | null = null;

export function claimAudioSession(owner: object, stop: () => void) {
  if (activeSession?.owner !== owner) activeSession?.stop();
  activeSession = { owner, stop };
}

export function releaseAudioSession(owner: object) {
  if (activeSession?.owner === owner) activeSession = null;
}

/** Keeps narration, listening activities and exam audio from speaking over each other. */
export function claimAudioPlayback(audio: HTMLMediaElement) {
  claimAudioSession(audio, () => audio.pause());
}

export function releaseAudioPlayback(audio: HTMLMediaElement) {
  releaseAudioSession(audio);
}
