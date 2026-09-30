# Musify: partial offline practice and recovery

The Sparky identity remains intact. `Musify` identifies this release in `/api/release` and in the update announcement.

## What is available offline

After a successful online visit installs the service worker, the browser saves a small anonymous package: the branded recovery page, its CSS/JavaScript, icons, the Sparky illustration and 12 real course lessons (two per level A1–C2). Each lesson has six choice/word-order exercises and optional reading support. `npm run offline:pack` regenerates `public/offline/practice.json` from the actual curriculum; production prebuild runs it automatically. A content fingerprint invalidates scratch checkpoints whenever the selected material changes.

The recovery page works when a navigation fails, exceeds eight seconds, or returns a server 5xx response. Its assets also fall back to the current cache on network failure or 5xx, so a server outage does not strip its styling, script or illustration. Reconnecting never reloads an active offline practice automatically. “Tentar novamente” checks the service and returns to the app only after a successful response.

The offline shell reads only the anonymous `sparky-interface-language` and `sparky-support-language` browser preferences, never account locale keys. Its PT/EN selectors control interface and explanatory language independently and work offline. The pack includes authored English prompts, feedback, context hints and reading support. English target sentences/options/tokens remain identical in every mode. Portuguese meanings and sentence translations appear only after the learner opens the corresponding disclosure; switching languages preserves the scratch checkpoint. Audio-based support labels are adapted to written examples because audio is not part of this offline package.

**First visit limitation:** a browser must have visited the origin online and completed service worker installation before its custom offline page is available. If the first visit is offline, the origin was never visited, installation failed, site data was cleared, or the browser does not support service workers, the browser's own unavailable page can appear. This cannot be replaced by a page served from an unreachable origin. A PWA installation is optional; a supported browser visit is sufficient. Service workers require HTTPS (localhost is allowed for development).

## Account and checkpoint boundaries

The service worker never caches application HTML, Next.js chunks, account sessions, auth responses, API responses, personalized audio, music streams or signed study receipts. Navigation remains network-first, and old Sparky caches are removed on activation. Only the explicit public asset allowlist can enter the current cache. All shell installation requests omit credentials and reject failed, redirected or private responses. Account logout and release refresh retain only the current anonymous shell and remove obsolete Sparky caches.

Offline drills save a separate, validated scratch checkpoint containing the public lesson ID, content fingerprint, exercise position and choice/token positions. They never read account workspaces, create signed receipts, alter official lesson completion, count toward a daily goal, claim streaks or award coins. Account logout removes this generic scratch checkpoint through the existing private-storage cleanup.

An in-progress online lesson uses the existing account-separated checkpoint. Loss of connection preserves its answer; answer verification and final completion continue to require the server. The fallback does not restore or display that private workspace without account validation. After reconnecting and signing into the same account, the existing lesson player can resume a valid checkpoint. Its existing expiration/content-version checks may require restarting an expired session. The offline drill is never converted into official completion or automatically submitted.

## Verification

- `node --test tests/service-worker.test.mjs tests/offline-practice.test.mjs`: real curriculum equivalence, content invalidation, untrusted scratch-data filtering, repeated-word tokens, anonymous cache cleanup, worker installation/migration, network/5xx recovery, excluded API/media/bundle requests and private-response rejection.
- `npm run test:e2e:offline`: actual Chromium service worker/cache on desktop and Android profiles, offline navigation, saved artwork, offline exercise feedback and scratch resume, full drill completion without study/reward API writes, every PT/EN interface/support combination, unchanged target phrases, requested translations, server 503 for navigation and all assets, light/dark/English screenshots, reconnect without interrupting work and the first-visit limitation. Its tiny fixture server serves the project's actual public files; app integration is verified separately by the normal application checks.
- Screenshots/traces use `tmp/offline-playwright/` so other Playwright suites do not overwrite the evidence.

## Illustration provenance

`public/visuals/musify-offline.webp` was generated with the built-in GPT Image tool in transparent-background mode, using `public/visuals/wardrobe/bases/sparky.png` as a visual identity reference. The generated PNG remains in the Codex generated-images directory. The project copy is 640×640 WebP with preserved alpha, approximately 43 KB. The illustration was visually inspected before integration.

Final prompt:

> Use case: stylized-concept. Asset type: small branded offline/unavailability illustration for the Sparky English learning app. Input image 1 is the exact mascot identity and illustration style reference, not an edit target. Create one warm, hopeful Sparky panda with the same cream fur, charcoal paws and eye patches, coral cheeks and ears, glossy eyes, compact round proportions and soft crisp illustrated shading. Sparky sits beside a small simple cream-and-coral Wi-Fi router, gently plugging a disconnected cable back into it; friendly calm expression, reassuring and capable. Composition: compact centered full mascot and router cutout, all objects fully visible, ample clean margin, square canvas, suitable at 200-300px. Genuinely transparent background. Match reference's charming polished 2D/soft 3D storybook style; no outfit change. No text, letters, logos, numbers, watermark, speech bubbles or scenery. Preserve Sparky's recognizable face and colors.
