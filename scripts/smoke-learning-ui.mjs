// Development browser regression test: exclusively the isolated localhost fixture.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { lessons } from '../src/lib/curriculum.ts';
import { isExercise, exerciseId } from '../src/lib/study.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : 'playwright');
const voices = JSON.parse(await readFile(new URL('../src/lib/content/voice-manifest.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ headless:true, ...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {}) });
const context = await browser.newContext({ viewport:{width:1280,height:900}, serviceWorkers:'block' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const output = new URL('../.next/ui-checks/', import.meta.url);
await mkdir(output, {recursive:true});
await page.addInitScript(() => {
  window.__audio = [];
  const NativeAudio = window.Audio;
  window.Audio = class extends NativeAudio {
    constructor(...args) { super(...args); window.__audio.push(this); }
  };
  window.__recognitions = [];
  window.SpeechRecognition = class {
    constructor() { window.__recognitions.push(this); }
    start() { this.onstart?.(); }
    abort() { this.aborted = true; }
  };
});
const dialog = page.locator('.lesson-dialog');
const forward = () => dialog.locator('.lesson-forward-button').click();
async function nav(name) { await page.locator((page.viewportSize().width < 700 ? '.mobile-nav' : '.sidebar') + ' button').filter({hasText:new RegExp('^' + name + '$')}).click(); }
async function openLesson(lesson) {
  await nav('Curso');
  await page.locator('.catalog-levels button').filter({has:page.locator('strong', {hasText:new RegExp('^' + lesson.level + '$')})}).click();
  const button = page.locator('.catalog-lesson').filter({hasText:lesson.title});
  const courseModule = page.locator('.catalog-module').filter({has:button});
  if (!(await courseModule.evaluate(node => node.open))) await courseModule.locator('summary').click();
  await button.click();
  await dialog.waitFor({state:'visible'});
}
async function answer(step) {
  if (step.kind === 'order_words') {
    for (const word of step.answer.split(' ')) {
      await dialog.locator('.word-bank button:not(:disabled)').filter({hasText:new RegExp('^' + word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '$')}).first().click();
    }
  } else await dialog.locator('.answer-options button').filter({has:page.locator('span[lang="en"]', {hasText:new RegExp('^' + step.answer.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '$')})}).click();
  await forward();
  await dialog.getByText('Resposta correta.',{exact:true}).waitFor();
}
async function noOverflow() {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,'page horizontal overflow');
  if (await dialog.isVisible()) assert.equal(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth),true,'dialog horizontal overflow');
}
try {
  await page.goto('http://localhost:3201');
  await page.locator('.app-frame').waitFor();
  const legacy = lessons.find(lesson => lesson.id === 'a1-1-1');
  await openLesson(legacy);
  assert.equal(await dialog.getByRole('button',{name:'Voltar etapa'}).isDisabled(),true);
  await forward();
  await dialog.getByRole('button',{name:'Voltar etapa'}).click();
  await dialog.getByRole('heading',{name:legacy.steps[0].title}).waitFor();
  await forward();
  await dialog.getByRole('heading',{name:legacy.steps[1].title}).waitFor();
  await dialog.getByRole('heading',{name:'Fale com Sparky'}).waitFor();
  assert.equal(await dialog.locator('.speech-studio select,input[type="range"]').count(),0);
  if (voices[legacy.id]?.sparky) {
    await dialog.getByRole('button',{name:'Ouvir Sparky',exact:true}).click();
    await dialog.getByText('Sparky está falando…',{exact:true}).waitFor();
    assert.equal(await page.evaluate(() => window.__audio.at(-1).paused),false);
    await dialog.getByRole('button',{name:'Parar',exact:true}).click();
    assert.equal(await page.evaluate(() => window.__audio.at(-1).paused),true);
    assert.equal(await page.evaluate(() => window.__audio.at(-1).getAttribute('src')),null);
    const failedAudio = '**' + voices[legacy.id].sparky;
    await page.route(failedAudio, route => route.abort());
    await dialog.getByRole('button',{name:'Ouvir Sparky',exact:true}).click();
    await dialog.locator('.speech-live-status').filter({hasText:/Não foi possível/}).waitFor();
    await page.unroute(failedAudio);
    assert.equal(await dialog.getByRole('button',{name:'Ouvir Sparky',exact:true}).isEnabled(),true);
  }
  await dialog.locator('.speech-consent summary').click();
  await dialog.getByLabel('Autorizo o microfone nesta prática.').check();
  await dialog.getByRole('button',{name:'Começar a falar'}).click();
  await page.evaluate(() => window.__recognitions.at(-1).onresult({results:[{isFinal:true,length:1,0:{transcript:"Hi, I'm Anna."}}]}));
  await dialog.getByText('Frase reconhecida. A variação de escrita do nome foi aceita.',{exact:true}).waitFor();
  await dialog.getByRole('button',{name:'Começar a falar'}).click();
  await page.evaluate(() => window.__recognitions.at(-1).onresult({results:[{isFinal:true,length:1,0:{transcript:"Hi, I'm Anna and this is a joke."}}]}));
  await dialog.getByText('Ainda há diferenças. Confira as palavras destacadas e tente novamente.',{exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await noOverflow();
  await dialog.locator('.speech-studio').screenshot({path:new URL('speech-mobile.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await dialog.getByRole('button',{name:'Começar a falar'}).click();
  await dialog.getByRole('button',{name:'Fechar lição'}).click();
  assert.equal(await page.evaluate(() => window.__recognitions.at(-1).aborted),true);
  await openLesson(legacy);
  await dialog.getByRole('heading',{name:'Fale com Sparky'}).waitFor();
  assert.equal(await dialog.locator('.speech-result').count(),0,'transcription must not persist');
  await dialog.getByRole('button',{name:'Fechar lição'}).click();
  if (voices[legacy.id]?.pinky) {
    await nav('Perfil');
    const pinky = page.locator('.mascot-selector button').filter({hasText:'Pinky'});
    await pinky.click();
    await page.waitForFunction(() => [...document.querySelectorAll('.mascot-selector button')].some(button => button.textContent.includes('Pinky') && button.getAttribute('aria-pressed') === 'true'));
    await openLesson(legacy);
    await dialog.getByRole('heading',{name:'Fale com Pinky'}).waitFor();
    await dialog.getByRole('button',{name:'Ouvir Pinky',exact:true}).click();
    await dialog.getByText('Pinky está falando…',{exact:true}).waitFor();
    assert.ok((await page.evaluate(() => window.__audio.at(-1).src)).endsWith(voices[legacy.id].pinky));
    await dialog.getByRole('button',{name:'Fechar lição'}).click();
    assert.equal(await page.evaluate(() => window.__audio.at(-1).paused),true);
  }

  // Seed a completed authored lesson through the real API, in this fixture only.
  const authored = lessons.find(lesson => lesson.id === 'a1-identidade-01');
  await page.evaluate(async ({lessonId,steps}) => {
    let receipt = '';
    for (const step of steps) {
      const response = await fetch('/api/study',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lessonId,review:false,...step,assisted:false,receipt})});
      if (!response.ok) throw new Error('Fixture grading failed');
      receipt = (await response.json()).receipt;
    }
    const response = await fetch('/api/rewards',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'complete',lessonId,review:false,receipt})});
    if (!response.ok) throw new Error('Fixture completion failed');
  }, {lessonId:authored.id,steps:authored.steps.filter(isExercise).map(step => ({stepId:exerciseId(authored,step),answer:step.answer}))});
  await page.reload();
  await page.locator('.app-frame').waitFor();
  await nav('Revisão');
  await page.locator('.review-card').filter({hasText:authored.title}).getByRole('button').click();
  const reviewSteps = authored.steps.filter(isExercise);
  await dialog.locator('.english-example').waitFor();
  assert.equal(await dialog.locator('.english-example').innerText(),reviewSteps[0].english);
  assert.equal(await dialog.locator('.lesson-notes').evaluate(node => node.open),false);
  await dialog.locator('.lesson-notes summary').click();
  const submitted = page.waitForRequest(request => request.url().endsWith('/api/study') && request.method() === 'POST');
  await answer(reviewSteps[0]);
  assert.equal((await submitted).postDataJSON().assisted,true);
  await forward();
  await dialog.locator('.english-example').waitFor();
  assert.equal(await dialog.locator('.english-example').innerText(),reviewSteps[1].english);
  assert.equal(await dialog.locator('.lesson-notes').evaluate(node => node.open),false,'help must reset');
  await dialog.getByRole('button',{name:'Voltar etapa'}).click();
  await dialog.getByText('Resposta correta.',{exact:true}).waitFor();
  await forward();
  await dialog.locator('.english-example').filter({hasText:reviewSteps[1].english}).waitFor();
  const independent = page.waitForRequest(request => request.url().endsWith('/api/study') && request.method() === 'POST');
  await answer(reviewSteps[1]);
  assert.equal((await independent).postDataJSON().assisted,false);
  await noOverflow();
  await dialog.getByRole('button',{name:'Fechar lição'}).click();

  await nav('Curso');
  assert.equal(await page.locator('.catalog-levels button').count(),7);
  await page.locator('.catalog-levels button').filter({has:page.locator('strong',{hasText:/^C2$/})}).click();
  assert.equal(await page.locator('.catalog-lesson').count(),18);
  await noOverflow();
  await page.screenshot({path:new URL('course-c2-mobile.png',output).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
  const advanced = lessons.find(lesson => lesson.id === 'c2-producao-06');
  await openLesson(advanced);
  for (const step of advanced.steps) {
    await dialog.locator('#lesson-title').filter({hasText:step.title}).waitFor();
    if (step.kind === 'production') {
      await dialog.getByRole('heading',{name:'Leve a ideia para a fala'}).waitFor();
      assert.equal(await dialog.locator('.production-workspace li').count(),5);
      const essay = 'This evidence supports a revisable decision. '.repeat(140);
      await dialog.getByLabel('Seu rascunho (opcional)').fill(essay);
      await dialog.getByRole('button',{name:'Fechar lição'}).click();
      await openLesson(advanced);
      assert.equal(await dialog.getByLabel('Seu rascunho (opcional)').inputValue(),essay);
      await noOverflow();
      await dialog.locator('.lesson-body').screenshot({path:new URL('production-c2-mobile.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
      break;
    }
    if (isExercise(step)) await answer(step);
    await forward();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: mobile layout, six levels, backward lesson navigation, Ana/Anna, extra-word rejection, microphone cleanup, private transcript, help reset, visible review context and advanced writing resume.');
} finally { await browser.close(); }
