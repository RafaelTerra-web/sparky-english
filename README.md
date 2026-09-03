# Sparky English

Private, installable English-learning PWA for invited learners. The first slice includes an invite gate, a Today dashboard, A1–B1 lesson path, spaced-review view, contextual Sparky feedback, a lesson player, an offline shell, WebMCP lesson start, and a Supabase-ready schema.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `SPARKY_INVITE_CODE` locally to enable the invite gate. In production prefer `SPARKY_INVITE_CODE_SHA256` and keep the raw code out of deployment logs and files.

## Validation

```bash
npm run lint
npm run build
```

The database contract is in `supabase/migrations/20260903000100_sparky_english.sql`. Voice is intentionally disabled; `src/lib/sparky-types.ts` defines the provider contract for a future transcription, speech, and pronunciation layer.
