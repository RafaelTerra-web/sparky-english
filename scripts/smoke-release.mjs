import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { lessons } from '../src/lib/curriculum.ts';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const results=[];
try{for(const viewport of [{width:390,height:844},{width:1440,height:1000}]){
 const context=await browser.newContext({viewport,serviceWorkers:'block'});const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const profile={name:'Ana',age:20,mascot:'pinky',level:'A2',levelMethod:'self-assessment',onboardingCompleted:true,namePronunciationStatus:'text-only'};
 let draft=null,revision=1;let actions=[];const studied=lessons.filter(l=>l.level==='A1').slice(0,12);
 await page.route('**/api/session',r=>r.fulfill({json:{authenticated:true,user:{id:'release-fixture',name:'Ana',email:'fixture@example.test'}}}));
 await page.route('**/api/rewards',r=>r.fulfill({json:{coins:120,completed:Object.fromEntries(studied.map(l=>[l.id,'completed'])),reviews:Object.fromEntries(studied.map(l=>[l.id,'2026-09-01T03:00:00Z'])),owned:[],notebookTheme:null,mascot:'pinky',equipped:{sparky:{},pinky:{}},dailyReviews:{day:'2026-09-09',count:0}}}));
 await page.route('**/api/appearance',r=>r.fulfill({json:{theme:'light',palette:'original'}}));
 await page.route('**/api/onboarding',async r=>{if(r.request().method()==='POST'){const b=r.request().postDataJSON();actions.push(b.action);if(b.action==='placement-start')draft={...profile,step:'test'};if(b.action==='preferences-start')draft={...profile,step:'level'};if(b.action==='cancel-edit')draft=null;revision++;}await r.fulfill({json:{enabled:true,profile,draft,revision,placement:draft?.step==='test'?{count:0,complete:false,result:null,item:{id:'fixture',skill:'grammar',prompt:'Choose the correct sentence.',options:['I am ready.','I is ready.'],audio:null}}:null}})});
 await page.goto('http://127.0.0.1:3211/');await page.getByRole('heading').first().waitFor();
 // Profile entry is present even at mobile widths.
 await page.getByRole('button',{name:/Abrir perfil|Perfil|preferências/i}).filter({visible:true}).first().click();
 await page.getByRole('button',{name:'Fazer nivelamento',exact:true}).click();await page.getByText('Choose the correct sentence.',{exact:true}).waitFor();
 await page.getByRole('button',{name:/Perfil/}).click();await page.getByRole('heading',{name:'Perfil e preferências',exact:true}).waitFor();
 await page.getByRole('button',{name:/Nível das lições recomendadas/}).click();await page.getByRole('heading',{name:'Por onde vamos começar sua jornada no inglês?',exact:true}).waitFor();await page.getByRole('button',{name:/Perfil/}).click();
 await page.locator('#interface-language').selectOption('en');await page.getByRole('heading',{name:'Profile and preferences',exact:true}).waitFor();
 if(await page.locator('html').getAttribute('lang')!=='en')throw new Error('Locale not set');
 await page.reload();await page.getByRole('button',{name:/Open.*profile|Profile/i}).filter({visible:true}).first().click();await page.getByRole('heading',{name:'Profile and preferences',exact:true}).waitFor();
 await fs.mkdir('.release-work/screenshots',{recursive:true});await page.screenshot({path:'.release-work/screenshots/profile-'+viewport.width+'.png',fullPage:true});
 await page.getByRole('button',{name:/^Review/}).filter({visible:true}).first().click();if(await page.locator('.review-card[data-priority="due"]').count()!==3)throw new Error('Daily queue not capped');
 await page.locator('.review-card button').first().click();await page.locator('dialog[open]').waitFor();
 const dialog=page.locator('dialog[open]');await dialog.screenshot({path:'.release-work/screenshots/review-'+viewport.width+'.png'});await dialog.getByRole('button',{name:/Close|Exit|Fechar|Sair/}).first().click();
 await page.getByRole('button',{name:'Course',exact:true}).filter({visible:true}).first().click();await page.getByRole('button',{name:/classroom/i}).click();await page.getByRole('heading',{name:'Your English classroom'}).waitFor();
 const audio=page.locator('audio');await audio.evaluate(async el=>{el.load();await el.play();});await page.waitForTimeout(500);if(await audio.evaluate(el=>el.currentTime)<=0)throw new Error('Class audio did not play');await audio.evaluate(el=>el.pause());
 await page.screenshot({path:'.release-work/screenshots/classroom-'+viewport.width+'.png',fullPage:true});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);if(overflow){console.log(await page.locator('body *').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().right>innerWidth+2).map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width})).slice(0,15)));throw new Error('Horizontal overflow');}if(errors.length)throw new Error(errors.join('\n'));
 results.push({viewport,placement:actions.includes('placement-start'),preferences:actions.includes('preferences-start'),english:true,reviewCap:3,audio:true,overflow:false});await context.close();
}await fs.writeFile('.release-work/ui-result.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));}finally{await browser.close();}
