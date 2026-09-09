import { writeFile } from 'node:fs/promises';
import { auditCourseCoverage } from '../src/lib/course-coverage.ts';
const report=auditCourseCoverage();
await writeFile('docs/course-coverage.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({lessons:report.lessonCount,modules:report.moduleCount,paths:report.paths,errors:report.errors}));
if(report.errors.length) process.exitCode=1;
