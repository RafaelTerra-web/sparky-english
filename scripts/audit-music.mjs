import { musicCatalog } from '../src/lib/music-catalog.ts';
import { validateMusic } from '../src/lib/music.ts';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const catalog = process.argv[2] ? [JSON.parse(await readFile(process.argv[2],'utf8'))] : musicCatalog;
for (const entry of catalog) validateMusic(entry);
const tracked=execFileSync('git',['ls-files'],{encoding:'utf8'});
if (tracked.split('\n').some(x=>x.startsWith('.music-lab/') || /perfect.*\.(mp3|json|wav|vtt)/i.test(x))) throw Error('Private test asset is tracked');
console.log(`${catalog.length} music manifests validated; private fixtures excluded from Git.`);
