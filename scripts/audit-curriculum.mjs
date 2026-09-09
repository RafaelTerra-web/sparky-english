import { fluentPracticeModules } from "../src/lib/content/fluent-practice.ts";
import { a1Modules } from '../src/lib/content/a1.ts';
import { a2Modules } from '../src/lib/content/a2.ts';
import { a2CommunicationModules } from '../src/lib/content/a2-practice.ts';
import { b1Modules } from '../src/lib/content/b1.ts';
import { b2Modules } from '../src/lib/content/b2.ts';
import { c1Modules } from '../src/lib/content/c1.ts';
import { c1ExtensionModules } from '../src/lib/content/c1-extension.ts';
import { c2Modules } from '../src/lib/content/c2.ts';
import { c2ExtensionModules } from '../src/lib/content/c2-extension.ts';
const rows = [...a1Modules, ...a2Modules, ...a2CommunicationModules, ...b1Modules, ...b2Modules, ...c1Modules, ...c1ExtensionModules, ...c2Modules, ...c2ExtensionModules, ...fluentPracticeModules].flatMap(m => m.lessons);
let failures = 0;
const minimum = { rule: 150, pitfall: 65, dialogue: 71, dialogueTranslation: 61, production: 61, explanation: 51, gapExplanation: 46 };
for (const row of rows) for (const [field, length] of Object.entries(minimum)) {
  if (row[field].length < length) { failures++; console.log(`${row.title}: ${field} (${row[field].length}/${length})`); }
}
for (const field of ['rule', 'example', 'dialogue', 'question', 'production']) {
  const seen = new Map();
  for (const row of rows) {
    if (field === "example" && row.exampleFrom) {
      const source = rows.find(item => item.id === row.exampleFrom);
      if (!source || source.example !== row.example || source.translation !== row.translation) { failures++; console.log("Invalid reused example: " + row.id); }
      continue;
    }
    if (seen.has(row[field])) { failures++; console.log(`Duplicate ${field}: ${seen.get(row[field])} / ${row.title}`); }
    seen.set(row[field], row.title);
  }
}
console.log(`${rows.length} new lessons; ${rows.reduce((sum, row) => sum + Object.values(row).filter(v => typeof v === 'string').join(' ').split(/\s+/).length, 0)} authored words across lesson fields (before rendering).`);
if (failures) process.exitCode = 1;
