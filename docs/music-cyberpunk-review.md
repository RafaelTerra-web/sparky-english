# Cyberpunk music session

The listening game now prioritizes lyrics and answers within the visible mobile viewport. The permanent bottom navigation is removed for every track; the completed result opens lyrics, vocabulary and achievements. Returning from a review preserves the result. Perfect uses Geist, Heartless uses Space Grotesk and the Cyberpunk session uses Rajdhani, including narrative lyrics.

## Media and editorial preparation

- Track: `stay-at-your-house-local`, B1, `stay-at-your-house-timing-1`, 247.989125 seconds.
- 74 editorial phrases, 396 word occurrences, 104 vocabulary entries, 24 scheduled challenges in each difficulty.
- User-provided H.264/AAC AMV retained byte-for-byte as private `video.mp4`. A silent H.264 Main/yuv420p 720p/30fps `background.mp4` is served instead: the original triggered a Chromium decoder failure following a buffering/seek sequence. The derivative uses one-second keyframes and fast-start metadata.
- Audio extracted locally with PyAV/FFmpeg, encoded as 192 kbps MP3. Peak-limited preparation follows Heartless's 0.26 peak convention; playback remains at the existing 60% default. The Perfect/Heartless bytes and release hashes are unchanged.
- Local Whisper small.en, medium.en, large-v3-turbo and large-v3 passes were compared; Demucs isolated the vocal track for analysis only. The dense chorus produced inconsistent ASR, including hallucinated speech in the instrumental ending. Raw ASR was not published directly.
- The editorial transcript was aligned separately against mix and vocals. Zero-duration tokens, compound tokenization and discrepancies up to 1.46 seconds were inspected individually. Explicit boundary choices are preserved locally in `editorial-decisions.json`; six groups of larger outliers were also inspected as annotated vocal waveforms. First-word context padding is excluded without changing interior word timing. No global adjustment was applied to existing songs.
- This is an editorial and acoustic-data review, not a claim of a human listening certification. Some sung consonants in the processed chorus remain intrinsically ambiguous.
- Private evidence lives under `.music-lab/stay-at-your-house/`: original ASR passes, editorial transcript, dual alignment, waveform review and decisions. Private lyrics/media are excluded from Git and supplied separately to Vercel.

## Visual playback

Only this track has `visualSource`, pointing to the authenticated `/api/music/video?trackId=stay-at-your-house-local` route. The route resolves an allowlisted asset and supports bounded byte ranges, suffix ranges and 416 responses. It uses private/no-store caching, as do existing music routes.

The silent inline video follows the same corrected clock used by words and challenges. It fades in for refrains, interludes, bridge and ending. Audio remains authoritative: video failure cannot block it, buffering pauses decoration, and seek/rate changes correct drift. Reduced motion removes the video element entirely. The Three.js skyline, neon windows, grid and particles share the existing 30fps/DPR cap, visibility handling, disposal and CSS fallback.

## Acceptance checks

- Preserve old track counts/versions, personal ranks, achievements and saved vocabulary.
- No permanent bottom mode buttons; result review paths remain keyboard accessible.
- Four answers and the timer remain within 320×568, 360×800, 390×844, 430×932 and compact landscape. Simulated keyboard visual viewport preserves typing input; this does not replace native phone keyboard testing.
- Verify authenticated local audio/video ranges, allowlist rejection, three speeds, offset, backward seek, buffering, WebGL context loss and reduced motion.
- Run unit tests, TypeScript, changed-file ESLint, production build and room/full/remaster/lyrics/ranks/multitrack/authenticated/Cyberpunk smokes.
- Deploy a candidate, inspect its exact uploaded asset hashes and build, then promote. Remote authenticated gameplay requires an existing authorized session; no Vercel protection bypass or fabricated production identity.

## Local validation results

157 unit tests, TypeScript, changed-file ESLint and the production build pass. Musical room, full gameplay, remaster, lyrics, ranks, multitrack, authenticated API and Cyberpunk browser smokes pass. The new track's idempotent progress update survives readback; audio and silent video pass normal and suffix Range requests. Screenshots cover the chorus, all four portrait sizes, compact landscape and a simulated 390px keyboard viewport. Existing tracks retain their release hashes.
