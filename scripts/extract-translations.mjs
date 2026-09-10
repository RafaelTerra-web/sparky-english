import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const files=[]; function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())walk(p);else if(/\.tsx?$/.test(p))files.push(p)}}walk('src');
const strings=new Set();
for(const file of files){const source=fs.readFileSync(file,'utf8'),sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);function visit(n){if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isJsxText(n)){const text=n.text.replace(/\s+/g,' ').trim();if(text&&(/[À-ÿ]/.test(text)||(/[A-Za-z]/.test(text)&&/ /.test(text))||/^[A-Z][a-z]+$/.test(text)))strings.add(text)} if(ts.isTemplateExpression(n)){let t=n.head.text; n.templateSpans.forEach((s,i)=>t+='{'+i+'}'+s.literal.text);if(/[À-ÿ ]/.test(t))strings.add(t.replace(/\s+/g,' ').trim())}ts.forEachChild(n,visit)}visit(sf)}
fs.mkdirSync('.release-work',{recursive:true});fs.writeFileSync('.release-work/translation-source.json',JSON.stringify([...strings].sort(),null,2));console.log(strings.size+' source strings');
