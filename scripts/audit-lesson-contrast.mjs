// Runs against an already running local app. All account requests are mocked.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lessons } from '../src/lib/curriculum.ts';
import { contentVersion } from '../src/lib/content/build.ts';

const output = process.env.SPARKY_AUDIT_OUTPUT ?? join(tmpdir(), 'sparky-lesson-contrast');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
await page.route('**/api/**', route => {
  const pathname = new URL(route.request().url()).pathname;
  const responses = {
    '/api/session': { authenticated: true, user: { id: 'contrast-audit', email: 'audit@example.com', name: 'Ana' } },
    '/api/rewards': { storage: 'account', coins: 40, completed: {}, reviews: {}, owned: [], notebookTheme: null, mascot: 'sparky', equipped: { sparky: {}, pinky: {} } },
    '/api/onboarding': { enabled: false },
    '/api/appearance': { preference: null, storage: 'account' },
  };
  return route.fulfill({ status: pathname in responses ? 200 : 503, json: responses[pathname] ?? { error: 'audit-no-network' } });
});
const failures = [];
let samples = 0;
try {
  await page.goto(process.env.SPARKY_AUDIT_URL ?? 'http://localhost:3211');
  await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}nextjs-portal{display:none}'});
  await page.getByRole('button', { name: 'Começar a lição', exact: true }).waitFor();
  // Cover the original lesson, a warmup, and advanced production/support cards.
  const selected = [lessons[0], lessons.find(l => l.title === 'Falar da idade'), lessons.find(l => l.level === 'C2')].filter(Boolean);
  for (const lesson of selected) for (let index = 0; index < lesson.steps.length; index++) {
    const checkpoint = { lessonId: lesson.id, review: false, index, answer: '', tokens: [], checked: false, correct: false,
      translation: true, assisted: true, contextVisible: true, revealed: true, listened: true,
      receipt: '', draft: '', updatedAt: new Date().toISOString(), contentVersion };
    await page.evaluate(checkpoint => {
      localStorage.setItem('sparky-learning:contrast-audit', JSON.stringify({ version: 1,
        checkpoints: { [checkpoint.lessonId + ':lesson']: checkpoint }, attempts: [], writings: [], vocabulary: [], goal: '', minutes: 10 }));
      dispatchEvent(new Event('sparky-workspace'));
    }, checkpoint);
    await page.getByRole('button', { name: 'Continuar de onde parei', exact: true }).click();
    await page.locator('.lesson-dialog[open]').waitFor();
    await page.locator('.lesson-body details').evaluateAll(nodes => nodes.forEach(n => { n.open = true; }));
    for (const palette of ['sparky', 'beatrice', 'ocean', 'sunset', 'graphite']) for (const mode of ['light', 'dark']) {
      await page.evaluate(({palette,mode}) => { document.documentElement.dataset.palette = palette; document.documentElement.dataset.theme = mode; }, {palette,mode});
      const issues = await page.evaluate(() => {
        const rgb = color => (color.match(/[\d.]+/g) ?? []).map(Number);
        const over = (front, back) => front.slice(0, 3).map((v, i) => v * (front[3] ?? 1) + back[i] * (1 - (front[3] ?? 1)));
        const lum = a => a.slice(0, 3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
        const issues = [];
        for (const el of document.querySelector('.lesson-dialog').querySelectorAll('*')) {
          if (!el.checkVisibility() || !Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())) continue;
          const style = getComputedStyle(el);
          const parents = []; for (let p = el; p; p = p.parentElement) parents.unshift(p);
          let bg = [255, 255, 255]; for (const p of parents) bg = over(rgb(getComputedStyle(p).backgroundColor), bg);
          const fg = over(rgb(style.color), bg), a = lum(fg), b = lum(bg);
          const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
          const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
          if (ratio < (large ? 3 : 4.5)) issues.push({ selector: el.tagName + '.' + el.className,
            parent: el.parentElement.className, text: el.textContent.trim().slice(0, 65), ratio: +ratio.toFixed(2), fg: style.color, bg });
        }
        return issues;
      });
      failures.push(...issues.map(issue => ({lesson:lesson.id,kind:lesson.steps[index].kind,palette,mode,...issue})));
      samples++;
      if (lesson.id === selected[0].id && lesson.steps[index].kind === 'pronunciation' && palette === 'beatrice') {
        await page.locator('.speech-practice').scrollIntoViewIfNeeded();
        await page.screenshot({path:`${output}/voice-${mode}.png`});
      }
    }
    if (['hook','pronunciation','production','choice'].includes(lesson.steps[index].kind)) {
      await page.locator('.lesson-body').evaluate(el => { el.scrollTop = 0; });
      await page.screenshot({ path: `${output}/${lesson.id}-${index}.png` });
    }
    await page.getByRole('button', {name:'Fechar lição',exact:true}).click();
  }
  writeFileSync(`${output}/findings.json`, JSON.stringify(failures, null, 2));
  const unique = [...new Map(failures.map(f => [f.selector + f.parent + f.fg + f.bg, f])).values()];
  console.log(JSON.stringify({samples,failures:failures.length,unique,output},null,2));
  if (failures.length) process.exitCode = 1;
} finally { await browser.close(); }
