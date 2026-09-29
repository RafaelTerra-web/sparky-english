import {test,expect,type Page} from '@playwright/test';
import type {InboxNotification} from '../../src/lib/notifications-shared';
const id=(n:number)=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
function notification(n:number):InboxNotification {return {id:id(n),kind:n%3===0?'resume':n%3===1?'review':'daily-goal',createdAt:new Date(Date.now()-n*3600000).toISOString(),readAt:null,
  content:{pt:{title:`Aviso ${n}`,body:'Um passo rápido para seu inglês.',action:'Abrir prática'},en:{title:`Notice ${n}`,body:'A quick step for your English.',action:'Open practice'}},destination:n===3?{view:'lesson',lessonId:'a1-1-1'}:{view:'today'}};}
async function account(page:Page, count=23, language='pt-BR') {
  await page.addInitScript(({language})=>{localStorage.setItem('sparky-opening-seen-v4','1');localStorage.setItem('sparky-language:notifications-test',language);localStorage.setItem('sparky-interface-language',language);localStorage.setItem('sparky-support-language:notifications-test',language);localStorage.setItem('sparky-push:snooze:notifications-test',String(Date.now()+86400000));}, {language});
  await page.route('**/api/session',r=>r.fulfill({json:{authenticated:true,user:{id:'notifications-test',name:'Ana',email:'ana@example.test'}}}));
  await page.route('**/api/onboarding',r=>r.fulfill({json:{enabled:false}}));
  await page.route('**/api/push',r=>r.fulfill({json:{available:false}}));
  await page.route('**/api/appearance',r=>r.fulfill({json:{preference:{palette:'sparky',mode:'dark'},storage:'account'}}));
  await page.route('**/api/rewards',r=>r.fulfill({json:{storage:'account',coins:455,completed:{},reviews:{},owned:[],mascot:'sparky',equipped:{sparky:{},pinky:{}},streak:{count:5,longest:5,lastDay:null}}}));
  const state={items:Array.from({length:count},(_,n)=>notification(n+1)),failed:false,opened:0,read:[] as string[],prefs:{revision:0,goalMinutes:10,pushEnabled:false,review:true,resume:true,dailyGoal:true,locale:language==='en'?'en':'pt'},arrival:false};
  await page.route('**/api/notifications*',async r=>{
    const req=r.request(), url=new URL(req.url());
    if(req.method()==='PATCH') {
      const body=req.postDataJSON();
      if(body.action==='open') {state.opened++;state.items.forEach(x=>x.readAt=new Date().toISOString());if(state.arrival){state.items.unshift(notification(999));state.arrival=false;}}
      if(body.action==='read'){state.read.push(body.id);state.items.filter(x=>x.id===body.id).forEach(x=>x.readAt=new Date().toISOString());}
      if(body.action==='preferences'){Object.assign(state.prefs,body.patch);state.prefs.revision++;return r.fulfill({json:{preferences:state.prefs}});}
      return r.fulfill({json:{ok:true,unread:state.items.filter(x=>!x.readAt).length}});
    }
    if(state.failed) return r.fulfill({status:503,json:{error:'notifications-unavailable'}});
    const requested=url.searchParams.get('id'),offset=url.searchParams.has('cursor')?20:0;
    const items=requested?state.items.filter(x=>x.id===requested):state.items.slice(offset,offset+20);
    return r.fulfill({json:{enabled:true,items,unread:state.items.filter(x=>!x.readAt).length,snapshot:'signed-opening',nextCursor:!requested&&offset===0&&state.items.length>20?'signed-page':null,preferences:state.prefs,dailyActiveMs:120000}});
  });
  await page.goto('/');
  await expect(page.getByRole('button',{name:/Notificações|Notifications/})).toBeVisible();
  return state;
}
test('bell, snapshot, paging, scroll lock and concurrent arrivals',async({page},info)=>{
  const state=await account(page);state.arrival=true;
  const bell=page.getByRole('button',{name:'Notificações: 23 não lidas'});
  await expect(bell).toBeVisible();
  expect(await bell.evaluate(e=>{const b=e.getBoundingClientRect();return b.width>=44&&b.height>=44;})).toBe(true);
  await expect(bell.locator('svg')).toBeVisible();
  await expect(bell.locator('span')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('island.png')});
  await bell.click();const dialog=page.getByRole('dialog',{name:'Notificações'});
  await expect(dialog).toBeVisible();await expect(dialog.locator('article')).toHaveCount(20);
  await expect(page.getByRole('button',{name:'Notificações: 1 não lidas'})).toBeAttached();
  expect(state.opened).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.dataset.scrollLocked)).toBe('true');
  const bounds=await dialog.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(await dialog.evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
  await page.screenshot({path:info.outputPath('notification-center.png')});
  await dialog.getByRole('button',{name:'Ver anteriores'}).click();
  await expect(dialog.locator('article')).toHaveCount(23);expect(state.opened).toBe(1);
  await dialog.getByRole('button',{name:'Fechar notificações'}).click();
  await expect(bell).toHaveCount(0);await expect(page.getByRole('button',{name:'Notificações: 1 não lidas'})).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.dataset.scrollLocked)).toBeUndefined();
});
test('failure preserves badge and retry, empty inbox and 99+ badge',async({page})=>{
  const state=await account(page,100);const bell=page.getByRole('button',{name:'Notificações: 100 não lidas'});
  await expect(bell).toHaveText('99+');state.failed=true;await bell.click();
  const dialog=page.getByRole('dialog',{name:'Notificações'});await expect(dialog.getByRole('alert')).toContainText('Não foi possível carregar');
  await expect(bell).toHaveText('99+');state.failed=false;state.items=[];
  await dialog.getByRole('button',{name:'Tentar novamente'}).click();await expect(dialog).toContainText('Tudo em dia por aqui.');
  await dialog.getByRole('button',{name:'Fechar notificações'}).click();await expect(page.getByRole('button',{name:'Notificações: nenhuma pendente'})).toHaveText('');
});
test('push opens only its item after authentication and offers restart without checkpoint',async({page})=>{
  const state=await account(page);await page.goto('/?notification='+id(3));
  await expect(page.getByRole('dialog',{name:'Recomeçar esta lição?'})).toBeVisible();
  expect(state.read).toContain(id(3));expect(state.opened).toBe(0);
  await page.getByRole('button',{name:'Mais tarde',exact:true}).click();
  await expect(page.getByRole('button',{name:'Notificações: 22 não lidas'})).toBeVisible();
});
test('push click survives an offline inbox and retries when connectivity returns',async({page})=>{
  const state=await account(page);state.failed=true;
  await page.goto('/?notification='+id(3));
  await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('sparky-pending-notification'))).toBe(id(3));
  expect(state.read).not.toContain(id(3));
  state.failed=false;
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await expect(page.getByRole('dialog',{name:'Recomeçar esta lição?'})).toBeVisible();
  expect(state.read).toContain(id(3));
  expect(await page.evaluate(()=>sessionStorage.getItem('sparky-pending-notification'))).toBeNull();
});
test('push click preserves a live lesson and queues destination until it closes',async({page})=>{
  const state=await account(page);
  await page.getByRole('button',{name:'Começar lição'}).first().click();
  const lesson=page.getByRole('dialog').filter({has:page.getByRole('button',{name:'Fechar lição'})});
  await lesson.getByRole('button',{name:'Começar',exact:true}).click();
  await expect(lesson.getByRole('button',{name:'Verificar'})).toBeVisible();
  const options=lesson.locator('[aria-pressed]');await options.first().click();
  await page.evaluate(notificationId=>navigator.serviceWorker.dispatchEvent(new MessageEvent('message',{data:{type:'SPARKY_NOTIFICATION_CLICK',notificationId}})),id(3));
  await expect(lesson).toContainText('Seu lembrete está guardado.');
  await expect(options.first()).toHaveAttribute('aria-pressed','true');
  expect(state.read).toContain(id(3));
  await lesson.getByRole('button',{name:'Fechar lição'}).click();
  await expect(page.getByRole('dialog',{name:'Abrir seu lembrete?'})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sparky-learning:notifications-test')!).checkpoints['a1-1-1:lesson'].answer.length)).toBeGreaterThan(0);
});
test('settings and inbox work in English, enlarged text and reduced motion',async({page},info)=>{
  const state=await account(page,1,'en');await page.emulateMedia({reducedMotion:'reduce'});
  await page.addStyleTag({content:'html{font-size:20px}'});
  await page.getByRole('button',{name:'Notifications: 1 unread'}).click();const dialog=page.getByRole('dialog',{name:'Notifications'});
  await expect(dialog).toContainText('Notice 1');await dialog.getByRole('button',{name:'Close notifications'}).click();
  await page.getByRole('button',{name:'Abrir configurações'}).or(page.getByRole('button',{name:'Open settings'})).click();
  await expect(page.getByRole('heading',{name:'Notifications and reminders'})).toBeVisible();
  await page.getByRole('switch',{name:/Available reviews/}).click();expect(state.prefs.review).toBe(false);
  await page.getByRole('button',{name:'Disable all'}).click();expect(state.prefs.resume).toBe(false);expect(state.prefs.dailyGoal).toBe(false);
  await expect(page.getByText(info.project.name==='iphone-pwa' ? 'On iPhone, add Sparky to the Home Screen and open it from its icon to receive notifications.' : 'Push is unavailable on this device. Notifications remain in the center.')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('notification-settings-en.png')});
});
