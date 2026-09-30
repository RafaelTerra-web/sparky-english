# Musify playback during a game

Choose the difficulty and playback speed before starting. Volume and lyric timing calibration are also available in the setup settings. Once the game starts, speed, settings, manual pause, seek, repeat and previous/next transport controls are removed from the game interface and keyboard navigation. Listening and vocabulary exploration retain their normal player controls.

Leaving the browser tab or placing the app in the background pauses the audio at its current media time. Returning to the foreground attempts to resume the same running round or outro, preserving the seed, answer history, lives and selected speed. The audio clock stays frozen while backgrounded; elapsed wall time does not consume lives. Browser autoplay restrictions may require the existing audio retry action. A network/media error also keeps the retry action available.

The audio remains mounted throughout the session. Reaching zero lives, closing the room or leaving the game prevents automatic background resume. A completed track remains stopped. Restarting a failed/completed game still creates a new session with three lives from the beginning.

`tests/music-game-edge.test.mjs` verifies setup-only speed controls and the absence of manual pause controls in every running/result phase. `tests/e2e/musify.spec.ts` verifies the real player, removed transport/settings, frozen background media time, retained round/seed/lives/speed on foreground resume, and no resume after failure.
