import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
for(const mascot of ['sparky','pinky'] as const){
 test(`conversation tip uses ${mascot}, English examples and playback controls`,async({page},testInfo)=>{
  await page.route('**/api/session',r=>r.fulfill({json:{authenticated:true,user:{id:'tip-test',email:'test@example.com',name:'Ana'}}}));
  await page.route('**/api/rewards',r=>r.fulfill({json:{storage:'account',coins:0,completed:{},reviews:{},owned:[],notebookTheme:null,mascot,equipped:{sparky:{},pinky:{}}}}));
  await page.route('**/api/onboarding',r=>r.fulfill({json:{enabled:false}}));
  const wav=readFileSync('public/audio/tips/contractions-sparky.wav');
  let requested='';
  await page.route('**/audio/tips/**',r=>{requested=r.request().url();return r.fulfill({body:wav,contentType:'audio/mpeg'});});
  await page.goto('/');
  await page.getByRole('button',{name:'Começar a lição',exact:true}).click();
  for(let i=0;i<3;i++) await page.getByRole('button',{name:'Continuar',exact:true}).click();
  const tip=page.getByRole('complementary',{name:/Dica de conversa/});
  await expect(tip).toBeVisible();
  await expect(tip.getByText(mascot==='sparky'?'Dica de conversa · Sparky':'Dica de conversa · Pinky')).toBeVisible();
  await expect(tip.locator('[lang="en"]')).toContainText("I'm ready");
  await tip.getByRole('button',{name:'Ouvir devagar'}).click();
  await expect.poll(()=>requested).toContain(`contractions-${mascot}.wav`);
  if(testInfo.project.name === 'iphone') {
   // Windows WebKit cannot decode this media fixture; verify its accessible fallback.
   await expect(tip.getByRole('status')).toContainText(/não carregou|Não foi possível/);
   await expect(tip.getByRole('button',{name:'Ouvir dica'})).toBeEnabled();
  } else { await tip.getByRole('button',{name:'Parar áudio'}).click(); }
  await tip.getByText('Conferir a ideia',{exact:true}).click();
  await expect(tip.getByText(/A contração muda/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await tip.screenshot({path:testInfo.outputPath('tip.png')});
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect(tip).toHaveCount(0);
 });
}



