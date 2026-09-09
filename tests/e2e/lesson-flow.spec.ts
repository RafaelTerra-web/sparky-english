import { test, expect } from '@playwright/test';
import { lessons } from '../../src/lib/curriculum';
import { contentVersion } from '../../src/lib/content/build';

async function account(page: import('@playwright/test').Page, kind: 'production' | 'choice') {
  const lesson = lessons.find(item => item.id === 'a1-1-1')!;
  const index = lesson.steps.findIndex(step => step.kind === kind);
  await page.addInitScript(({ index, contentVersion }) => {
    const checkpoint = { lessonId:'a1-1-1', review:false, index, furthestIndex:index, answer:'', tokens:[], checked:false, correct:false, translation:false, assisted:false, contextVisible:false, receipt:'existing-receipt', draft:'My existing draft.', updatedAt:new Date().toISOString(), contentVersion, revealed:false, listened:false };
    if (!localStorage.getItem('sparky-learning:flow-test')) localStorage.setItem('sparky-learning:flow-test',JSON.stringify({version:1,checkpoints:{'a1-1-1:lesson':checkpoint},writings:[],attempts:[],vocabulary:[]}));
  }, { index, contentVersion });
  await page.route('**/api/session', r => r.fulfill({json:{authenticated:true,user:{id:'flow-test',email:'test@example.com',name:'Ana'}}}));
  await page.route('**/api/rewards', r => r.fulfill({json:{storage:'account',coins:40,completed:{},reviews:{},owned:[],mascot:'sparky',equipped:{sparky:{},pinky:{}}}}));
  await page.route('**/api/onboarding',r=>r.fulfill({json:{enabled:false}}));
  await page.route('**/api/appearance',r=>r.fulfill({json:{preference:{palette:'beatrice',mode:'dark'},storage:'account'}}));
  await page.goto('/');
  await page.addStyleTag({content:'nextjs-portal{display:none}'});
  await page.getByRole('button',{name:'Continuar de onde parei',exact:true}).click();
}

test('old final writing step resumes at the concise ending and keeps the old draft',async({page})=>{
  await account(page,'production');
  await expect(page.locator('.lesson-body')).toHaveAttribute('data-step-kind','summary');
  await expect(page.locator('.lesson-dialog textarea')).toHaveCount(0);
  await expect(page.locator('.lesson-dialog')).not.toContainText('Caderno');
  await expect(page.getByRole('button',{name:'Concluir',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Fechar lição'}).click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('sparky-learning:flow-test')!));
  expect(saved.writings[0].text).toBe('My existing draft.');
  expect(saved.checkpoints['a1-1-1:lesson'].receipt).toBe('existing-receipt');
  await page.reload();
  await page.addStyleTag({content:'nextjs-portal{display:none}'});
  await page.getByRole('button',{name:'Continuar de onde parei',exact:true}).click();
  await expect(page.locator('.lesson-body')).toHaveAttribute('data-step-kind','summary');
  await page.getByRole('button',{name:'Voltar etapa',exact:true}).click();
  await expect(page.locator('.lesson-body')).toHaveAttribute('data-step-kind','order_words');
});

test('question command and options stay large and fit a narrow phone',async({page},info)=>{
  await page.setViewportSize({width:320,height:740});
  await account(page,'choice');
  const command=page.locator('.lesson-body > .step-explanation');
  await expect(command).toBeVisible();
  expect(await page.locator('.answer-options').evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('.lesson-notes')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);

  expect(await command.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(22);
  expect(await page.locator('.answer-options > button').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(18);
  expect(await page.locator('.lesson-body').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await expect.poll(()=>page.locator('.lesson-illustration img').evaluate(el=>(el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({path:info.outputPath('larger-command.png')});
});

for (const mascot of ['sparky','pinky'] as const) test(`new C1 lesson plays ${mascot} at natural and slow speeds`,async({page})=>{
  const lessonId='c1-intencoes-e-impacto-01';
  await page.addInitScript(({contentVersion,lessonId})=>{
    const checkpoint={lessonId,review:false,index:1,furthestIndex:1,flowVersion:2,answer:'',tokens:[],checked:false,correct:false,translation:false,assisted:false,contextVisible:false,receipt:'',draft:'',updatedAt:new Date().toISOString(),contentVersion,revealed:false,listened:false};
    localStorage.setItem('sparky-learning:voice-flow',JSON.stringify({version:1,checkpoints:{[lessonId+':lesson']:checkpoint},writings:[],attempts:[],vocabulary:[]}));
    const NativeAudio=window.Audio;
    window.Audio=class extends NativeAudio { constructor(src?:string){ super(src); Object.defineProperty(window,'lastTestAudio',{value:this,configurable:true}); } };
  },{contentVersion,lessonId});
  await page.route('**/api/session',r=>r.fulfill({json:{authenticated:true,user:{id:'voice-flow',email:'test@example.com',name:'Ana'}}}));
  await page.route('**/api/rewards',r=>r.fulfill({json:{storage:'account',coins:0,completed:{},reviews:{},owned:[],mascot,equipped:{sparky:{},pinky:{}}}}));
  await page.route('**/api/onboarding',r=>r.fulfill({json:{enabled:false}}));
  await page.route('**/api/appearance',r=>r.fulfill({json:{preference:null,storage:'account'}}));
  await page.goto('/');await page.addStyleTag({content:'nextjs-portal{display:none}'});
  await page.getByRole('button',{name:'Continuar de onde parei',exact:true}).click();
  await expect(page.locator('.lesson-body')).toHaveAttribute('data-step-kind','example');
  const studio=page.getByRole('region',{name:'Ouvir e praticar fala'});
  const natural=studio.getByRole('button',{name:"Ouvir natural",exact:true});
  await natural.click();
  const audioState=()=>page.evaluate(()=>{
    const audio=(window as unknown as {lastTestAudio:HTMLAudioElement}).lastTestAudio;
    return {src:audio.src,rate:audio.playbackRate,preservesPitch:audio.preservesPitch};
  });
  const first=await audioState();expect(first.rate).toBe(1);expect(first.src).toMatch(/\/audio\/mascots\/[a-f0-9]{32}\.wav$/);
  await expect(studio.getByRole('status')).toContainText('em velocidade natural');
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {lastTestAudio:HTMLAudioElement}).lastTestAudio.currentTime)).toBeGreaterThan(0);
  await studio.getByRole('button',{name:/Parar/}).click();
  await studio.getByRole('button',{name:'Ouvir devagar',exact:true}).click();
  const slow=await audioState();expect(slow.src).toBe(first.src);expect(slow.rate).toBe(.75);expect(slow.preservesPitch).toBe(true);
  await expect(studio.getByRole('status')).toContainText('devagar');
});
