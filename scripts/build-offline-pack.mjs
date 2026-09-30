import { writeFileSync, mkdirSync } from 'node:fs';
import { createOfflinePack } from '../src/lib/offline-pack.ts';

const destination = new URL('../public/offline/', import.meta.url);
mkdirSync(destination, { recursive: true });
writeFileSync(new URL('practice.json', destination), JSON.stringify(createOfflinePack()) + '\n');
console.log('Offline pack: 12 public practice lessons, A1–C2.');
