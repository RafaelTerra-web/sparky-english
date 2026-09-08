import { writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
async function account(page) {
 await page.route('**/api/session',r=>r.fulfill({json:{authenticated:true,user:{id:'appearance-test',email:'test@example.com',name:'Ana'}}}));
 await page.route('**/api/rewards',r=>r.fulfill({json:{storage:'account',coins:40,completed:{},reviews:{},owned:[],notebookTheme:null,mascot:'sparky',equipped:{sparky:{},pinky:{}}}}));
 await page.route('**/api/onboarding',r=>r.fulfill({json:{enabled:false}}));
 let preference=null;
 await page.route('**/api/appearance',r=>{if(r.request().method()==='PUT')preference=r.request().postDataJSON();return r.fulfill({json:{preference,storage:'account'}});});
}
async function audit(page) {
 return page.evaluate(()=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
  const lum=a=>a.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((x,v,i)=>x+v*[.2126,.7152,.0722][i],0);
  const issues=[];
  for(const el of (document.querySelector('dialog[open]')||document).querySelectorAll('p,span,small,strong,h1,h2,h3,summary,label,button,blockquote')){
   if(!el.getClientRects().length||!el.textContent.trim()||!Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))continue;
   const st=getComputedStyle(el); let parent=el,bg;
   while(parent){const v=rgb(getComputedStyle(parent).backgroundColor);if(v.length===3||v[3]===1){bg=v;break}parent=parent.parentElement;}
   if(!bg)continue;const fg=rgb(st.color),a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   const large=parseFloat(st.fontSize)>=24||(parseFloat(st.fontSize)>=18.66&&parseInt(st.fontWeight)>=700);
   if(ratio<(large?3:4.5)-.03)issues.push({selector:el.tagName+'.'+el.className,text:el.textContent.trim().slice(0,55),ratio:ratio.toFixed(2),fg:st.color,bg});
  }return issues;
 });
}
test('palettes, lesson readability and compact navigation',async({page},info)=>{
 test.setTimeout(120000);await account(page);await page.goto('/');await page.addStyleTag({content:'nextjs-portal{display:none}*,*::before,*::after{transition:none!important;animation:none!important}'});
 await expect(page.getByRole('button',{name:/Começar a lição|Continuar de onde parei/,exact:true})).toBeVisible();
 if(info.project.name!=='desktop'){
  const nav=page.getByRole('navigation',{name:'Navegação no celular'});await expect(nav.getByRole('button')).toHaveCount(5);
  const tops=await nav.getByRole('button').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().top));expect(new Set(tops).size).toBe(1);
 }
 const failures=[];
 for(const palette of ['sparky','beatrice','ocean','sunset','graphite'])for(const mode of ['light','dark']){
  await page.evaluate(({palette,mode})=>{localStorage.setItem('sparky-appearance-v1',JSON.stringify({palette,mode,pending:false}));dispatchEvent(new StorageEvent('storage',{key:'sparky-appearance-v1'}));},{palette,mode});
  await expect(page.locator('html')).toHaveAttribute('data-palette',palette);
  failures.push(...(await audit(page)).map(x=>({palette,mode,screen:'home',...x})));
  await page.getByRole('button',{name:/Começar a lição|Continuar de onde parei/,exact:true}).click();
  await expect(page.locator('.lesson-dialog')).toBeVisible();
  const illustration=page.locator('.lesson-illustration img');
  await expect(illustration).toBeVisible();
  await expect(illustration).toHaveAttribute('src',/a1-1-1\.png/);
  await expect.poll(()=>illustration.evaluate(image=>image.complete?image.naturalWidth:0)).toBeGreaterThan(0);
  const dimensions=await illustration.evaluate(image=>({width:image.naturalWidth,height:image.naturalHeight}));
  expect(dimensions.width/dimensions.height).toBeCloseTo(1.5,1);
  failures.push(...(await audit(page)).map(x=>({palette,mode,screen:'lesson',...x})));
  if(palette==='beatrice'&&mode==='dark')await page.screenshot({path:info.outputPath('beatrice-lesson.png')});
    await page.locator('.lesson-dialog > header button').click();
  for(const screen of ['Curso','Caderno','Loja']){
   await page.getByRole('button',{name:screen,exact:true}).filter({visible:true}).click();
   await page.locator(screen==='Curso'?'.catalog-levels':screen==='Caderno'?'.learning-notebook':'.shop-v2').waitFor({state:'visible'});
   failures.push(...(await audit(page)).map(x=>({palette,mode,screen,...x})));
  }
  await page.getByRole('button',{name:'Abrir perfil de Ana'}).click();
  failures.push(...(await audit(page)).map(x=>({palette,mode,screen:'profile',...x})));
  await page.getByRole('button',{name:'Hoje',exact:true}).filter({visible:true}).click();
 }
 await page.getByRole('button',{name:'Abrir perfil de Ana'}).click();
 await page.getByRole('button',{name:/Beatrice/}).click();
 await page.getByRole('button',{name:'Escuro',exact:true}).click();
 await expect(page.getByText('Aparência sincronizada na sua conta.')).toBeVisible();
 await page.screenshot({path:info.outputPath('appearance.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 writeFileSync(info.outputPath('contrast.json'),JSON.stringify(failures,null,2));
 await info.attach('contrast.json',{body:JSON.stringify(failures,null,2),contentType:'application/json'});
 expect(failures).toEqual([]);
});
