import { existsSync } from 'node:fs';

// A Git checkout cannot contain the reviewed private music bundle. Vercel
// interprets 0 as "skip deployment" and 1 as "continue the build".
process.exit(existsSync('.music-assets/manifest.json') ? 1 : 0);
