// Prepare a reviewable, atomic bootstrap for a NEW project only. Execution is
// deliberately separate: use Supabase SQL Editor after confirming the project.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { assessmentVersion } from '../src/lib/assessment-policy.ts';
import { rubric as assessmentRubric } from '../src/lib/assessment-rubric.ts';

const migrations = ['20260903000100_sparky_english.sql', '20260905000100_durable_google_progress.sql', '20260907000100_advanced_assessments.sql', '20260907000200_assessment_service_privileges.sql'];
const parts = [];
for (const name of migrations) {
  const source = await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
  parts.push(`-- ${name}\n-- SHA-256: ${createHash('sha256').update(source).digest('hex')}\n${source.replace(/^begin;\s*$/gmi, '').replace(/^commit;\s*$/gmi, '')}`);
}
const quote = value => `'${value.replaceAll("'", "''")}'`;
const output = `-- Sparky English: NEW DATABASE ONLY. Review before executing.\n-- Project confirmed: pqtlsrmzciriabzzgmzc (Sao Paulo).\nbegin;\nselect pg_advisory_xact_lock(2026090701);\ndo $$ begin\n if exists (select 1 from pg_tables where schemaname = 'public') then\n  raise exception 'Bootstrap requires an empty public schema; use migrations for an existing database';\n end if;\nend $$;\n${parts.join('\n')}\ninsert into public.sparky_rubrics(version, specification, status) values (${quote(assessmentVersion)}, ${quote(JSON.stringify(assessmentRubric))}::jsonb, 'beta');\n-- Confirm every application table has RLS before the transaction can commit.\ndo $$ begin\n if exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity) then\n  raise exception 'An application table has no RLS';\n end if;\n if has_table_privilege('anon', 'public.sparky_certificates', 'SELECT') or\n    has_table_privilege('authenticated', 'public.sparky_assessment_answers', 'SELECT') or\n    has_function_privilege('anon', 'public.sparky_take_assessment_slot(text)', 'EXECUTE') then\n  raise exception 'Private assessment access was not revoked';\n end if;\nend $$;\ncommit;\nselect tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;\n`;
if (!process.argv[2]) throw new Error('Provide a destination .sql path. This script never executes SQL.');
await writeFile(process.argv[2], output, 'utf8');
console.log(`Prepared ${migrations.length} migrations and beta rubric; ${output.length} characters.`);
