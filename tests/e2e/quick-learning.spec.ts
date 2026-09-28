import english from "../../public/locales/en.json" with { type: "json" };
import { test, expect, type Page } from "@playwright/test";
import { lessons, type Lesson } from "../../src/lib/curriculum";
import { studyExercises } from "../../src/lib/study";

const userId="local-visual-fixture";
const dialog=(page:Page)=>page.locator('dialog[aria-labelledby="quick-title"]');
async function prepare(page:Page, language="pt-BR") {
 await page.addInitScript(({userId,language})=>{
  localStorage.setItem("sparky-opening-seen-v4","1");
  localStorage.setItem("sparky-language:"+userId,language);
  localStorage.setItem("sparky-interface-language",language);
  localStorage.setItem("sparky-support-language:"+userId,language);
 },{userId,language});
 await page.route("**/api/appearance",r=>r.fulfill({json:{storage:"device",preference:{palette:"sparky",mode:"light"}}}));
 await page.goto("/");
 await expect(page.locator(".quick-today h1")).toBeVisible();
}
async function openLesson(page:Page, lesson:Lesson, mode="normal") {
 await page.locator(".quick-home-links button").first().click();
 await page.getByRole("button",{name:/Treinar por disciplina|Practice by subject|Practice by discipline|Train by subject/}).click();
 await page.locator(".quick-filter-details summary").click();
 await page.getByLabel(/Nível|Level/,{exact:true}).selectOption("all");
 await page.getByRole("textbox",{name:/Buscar assunto ou expressão|Search for a topic or expression/}).fill(lesson.title);
 const translatedTitle = (english as Record<string,string>)[lesson.title] ?? lesson.title;
 await page.locator(".guided-lesson").filter({hasText:lesson.title}).or(page.locator(".guided-lesson").filter({hasText:translatedTitle})).first().click();
 await expect(dialog(page)).toBeVisible();
 if(mode==="challenge") await dialog(page).getByRole("radio",{name:/Desafio|Challenge/}).check();
 else await expect(dialog(page).getByRole("radio",{name:"Normal",exact:false})).toBeChecked();
 await dialog(page).getByRole("button",{name:/^(Começar|Start)$/}).click();
 await expect(dialog(page).getByText("1/6",{exact:true})).toBeVisible();
}
async function answer(page:Page, lesson:Lesson, index:number, keyboard=false, reviewIds?:string[]) {
 const steps=studyExercises(lesson,Boolean(reviewIds),reviewIds),step=steps[index];
 const area=dialog(page);
 if(step.kind==="choice"){
  const option=area.getByRole("button",{name:new RegExp("^[A-C] "+step.answer!.replace(/[.*+?^$()|[\]\\]/g,"\\$&")+"$")});
  if(keyboard){await option.focus();await page.keyboard.press("Enter");}else await option.click();
 }else{
  const bank=area.getByRole("group",{name:/Banco de palavras|Word bank/});
  for(const word of step.answer!.split(" ")){
   const candidates=await bank.getByRole("button",{name:word,exact:true}).all();
   for(const button of candidates)if(await button.isEnabled()){
    if(keyboard){await button.focus();await page.keyboard.press("Enter");}else await button.click();break;
   }
  }
 }
 const check=area.getByRole("button",{name:/^(Verificar|Check)$/});
 if(keyboard){await check.focus();await page.keyboard.press("Enter");}else await check.click();
 await expect(area.locator("[data-answer-feedback]")).toContainText(/Boa!|Nice!/);
}
async function advance(page:Page,last=false){
 await dialog(page).getByRole("button",{name:last?/^(Concluir|Finish)$/:/^(Continuar|Continue)$/}).click();
}

test("normal session requires correction, keyboard ordering and exactly six server answers",async({page},info)=>{
 await prepare(page);
 const lesson=lessons.find(l=>l.id==="a1-identidade-01")!;
 await openLesson(page,lesson);
 const wrong=lesson.exercises![0].options!.find(o=>o!==lesson.exercises![0].answer)!;
 await dialog(page).getByRole("button",{name:new RegExp(wrong.replace(/[.*+?^$()|[\]\\]/g,"\\$&"))}).click();
 await dialog(page).getByRole("button",{name:"Verificar",exact:true}).click();
 await expect(dialog(page).locator("[data-answer-feedback]")).toContainText("Vamos corrigir.");
 await expect(dialog(page).getByText("1/6",{exact:true})).toBeVisible();
 await expect(dialog(page).getByRole("button",{name:"Continuar",exact:true})).toHaveCount(0);
 await dialog(page).getByRole("button",{name:"Tentar novamente",exact:true}).click();
 for(let i=0;i<6;i++){await answer(page,lesson,i,true);await advance(page,i===5);}
 await expect(page.locator(".lesson-completion-moment")).toBeVisible();
 await expect(page.locator(".lesson-completion-moment")).toContainText("Você praticou, corrigiu e avançou.");
 await page.screenshot({path:info.outputPath("completion.png"),animations:"disabled"});
 await page.locator(".lesson-completion-moment").getByRole("button",{name:"Próxima lição",exact:true}).click();
 await expect(dialog(page)).toBeVisible();
 const wallet=await page.request.get("/api/rewards").then(r=>r.json());
 expect(wallet.completed[lesson.id]).toBeTruthy();
});

for(const sample of [1,0])for(const level of ["A1","A2","B1","B2","C1","C2"])test((sample===0?"additional representative lesson in ":"six quick questions in ")+level,async({page},info)=>{
 await prepare(page);
 const lesson=lessons.filter(l=>l.level===level)[sample];
 await openLesson(page,lesson);
 for(let i=0;i<6;i++){
  if(i===1||i===5)await page.screenshot({path:info.outputPath(level+"-"+i+".png")});
  await answer(page,lesson,i);await advance(page,i===5);
 }
 await expect(page.locator(".lesson-completion-moment")).toBeVisible();
});

test("a failed connection and reload keep current selection and exercise sequence",async({page})=>{
 await prepare(page);
 const lesson=lessons.find(l=>l.id==="a1-pessoas-03")!;
 await openLesson(page,lesson);
 const step=lesson.exercises![0];
 await dialog(page).getByRole("button",{name:new RegExp(step.answer!)}).click();
 let aborted=false;
 await page.route("**/api/study",route=>{
  if(!aborted&&!route.request().postDataJSON()?.action){aborted=true;return route.abort("internetdisconnected");}
  return route.continue();
 });
 await dialog(page).getByRole("button",{name:"Verificar",exact:true}).click();
 await expect(dialog(page).getByRole("alert")).toContainText("A conexão falhou.");
 await page.unroute("**/api/study");
 const before=await page.evaluate(userId=>JSON.parse(localStorage.getItem("sparky-learning:"+userId)!).checkpoints,userId);
 await page.reload();
 await expect(page.locator(".next-lesson button")).toContainText("Continuar de onde parei");
 await page.locator(".next-lesson button").click();
 await expect(dialog(page).getByRole("button",{name:new RegExp(step.answer!)})).toHaveAttribute("aria-pressed","true");
 const after=await page.evaluate(userId=>JSON.parse(localStorage.getItem("sparky-learning:"+userId)!).checkpoints,userId);
 expect((Object.values(after)[0] as {answer:string}).answer).toEqual((Object.values(before)[0] as {answer:string}).answer);
 expect((Object.values(after)[0] as {exerciseIds:string[]}).exerciseIds).toEqual((Object.values(before)[0] as {exerciseIds:string[]}).exerciseIds);
 await answer(page,lesson,0);await advance(page);
 await expect(dialog(page).getByText("2/6",{exact:true})).toBeVisible();
 await dialog(page).getByRole("group",{name:"Banco de palavras"}).getByRole("button").first().click();
 await dialog(page).getByRole("button",{name:"Fechar lição",exact:true}).click();
 await page.locator(".next-lesson button").click();
 await expect(dialog(page).getByRole("group",{name:"Frase montada"}).getByRole("button")).toHaveCount(1);
});

test("challenge pauses in hints, feedback and network; timeout continues with validated answers",async({page})=>{
 await page.clock.install();
 await prepare(page);
 const lesson=lessons.find(l=>l.id==="a1-pessoas-03")!;
 await openLesson(page,lesson,"challenge");
 await page.clock.fastForward(15000);
 await dialog(page).getByText("Entender melhor",{exact:true}).click();
 await page.clock.fastForward(60000);
 let checkpoint=await page.evaluate(userId=>Object.values(JSON.parse(localStorage.getItem("sparky-learning:"+userId)!).checkpoints)[0] as {challenge:{activeMs:number}},userId);
 expect(checkpoint.challenge.activeMs).toBeLessThan(20000);
 await dialog(page).getByText("Entender melhor",{exact:true}).click();
 await page.evaluate(()=>{
  Object.defineProperty(document,"hidden",{configurable:true,value:true});
  document.dispatchEvent(new Event("visibilitychange"));
 });
 await page.clock.fastForward(60000);
 checkpoint=await page.evaluate(userId=>Object.values(JSON.parse(localStorage.getItem("sparky-learning:"+userId)!).checkpoints)[0] as typeof checkpoint,userId);
 expect(checkpoint.challenge.activeMs).toBeLessThan(20000);
 await page.evaluate(()=>{
  Reflect.deleteProperty(document,"hidden");
  document.dispatchEvent(new Event("visibilitychange"));
 });
 let resumeNetwork:()=>void=()=>{};
 const networkGate=new Promise<void>(resolve=>{resumeNetwork=resolve;});
 await page.route("**/api/study",async route=>{await networkGate;await route.continue();});
 await dialog(page).getByRole("button",{name:new RegExp(lesson.exercises![0].answer!)}).click();
 await dialog(page).getByRole("button",{name:"Verificar",exact:true}).click();
 await expect(dialog(page).getByRole("button",{name:"Verificando…",exact:true})).toBeDisabled();
 // Stay within the existing 15-second request timeout while testing the paused clock.
 await page.clock.fastForward(10000);
 checkpoint=await page.evaluate(userId=>Object.values(JSON.parse(localStorage.getItem("sparky-learning:"+userId)!).checkpoints)[0] as typeof checkpoint,userId);
 expect(checkpoint.challenge.activeMs).toBeLessThan(20000);
 resumeNetwork();
 await expect(dialog(page).locator("[data-answer-feedback]")).toContainText("Boa!");
 await page.unroute("**/api/study");
 await expect(dialog(page).getByLabel("Tempo restante")).toContainText("50 pontos");
 await page.clock.fastForward(60000);
 checkpoint=await page.evaluate(userId=>Object.values(JSON.parse(localStorage.getItem("sparky-learning:"+userId)!).checkpoints)[0] as typeof checkpoint,userId);
 expect(checkpoint.challenge.activeMs).toBeLessThan(20000);
 await advance(page);
 await page.clock.fastForward(130000);
 await expect(dialog(page).getByText("O tempo terminou.",{exact:true})).toBeVisible();
 await dialog(page).getByRole("button",{name:"Continuar no modo normal",exact:true}).click();
 await expect(dialog(page).getByText("2/6",{exact:true})).toBeVisible();
 await answer(page,lesson,1);
});

test("review starts with a fixed three-question selection and requires all answers",async({page})=>{
 await prepare(page);
 const lesson=lessons.find(l=>l.id==="a2-passado-05")!;
 await page.route("**/api/rewards",r=>r.fulfill({json:{storage:"device",coins:40,completed:{[lesson.id]:"2026-01-01"},reviews:{[lesson.id]:"2026-01-02"},owned:[],mascot:"sparky",equipped:{sparky:{},pinky:{}}}}));
 await page.reload();
 await page.locator(".quick-home-links button").last().click();
 await page.locator(".quick-practice-card").filter({hasText:"Revisão diária"}).click();
 await page.locator(".review-card button").first().click();
 await dialog(page).getByRole("button",{name:"Começar",exact:true}).click();
 await expect(dialog(page).getByText("1/3",{exact:true})).toBeVisible();
 await expect.poll(()=>page.evaluate(userId=>Boolean(Object.values(JSON.parse(localStorage.getItem("sparky-learning:"+userId) ?? "{\"checkpoints\":{}}").checkpoints)[0]),userId)).toBe(true);
 const checkpoint=await page.evaluate(userId=>Object.values(JSON.parse(localStorage.getItem("sparky-learning:"+userId)!).checkpoints)[0] as {exerciseIds:string[]},userId);
 expect(checkpoint.exerciseIds).toHaveLength(3);
 for(let i=0;i<3;i++){await answer(page,lesson,i,false,checkpoint.exerciseIds);await advance(page,i===2);}
 await expect(page.locator(".lesson-completion-moment")).toContainText("Revisão concluída");
});

test("English support, large text, focus and reduced motion fit the mobile viewport",async({page},info)=>{
 await page.setViewportSize({width:320,height:640});await page.emulateMedia({reducedMotion:"reduce"});
 await prepare(page,"en");
 await expect(page.locator("html")).toHaveAttribute("lang","en");
 const nav=page.locator(".mobile-nav");
 await expect(nav.getByRole("button")).toHaveCount(4);
 await openLesson(page,lessons.find(l=>l.id==="c2-nuance-02")!);
 await expect(dialog(page).getByRole("heading")).toContainText("Identify irony");
 await page.addStyleTag({content:"dialog h2{font-size:34px!important}dialog button{font-size:20px!important}"});
 const action=dialog(page).getByRole("button",{name:"Check",exact:true});
 const bounds=await action.boundingBox();expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(640);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const aria=await dialog(page).ariaSnapshot();expect(aria).toContain("dialog");expect(aria).toContain("group");
 await page.screenshot({path:info.outputPath("english-large-text.png")});
});

test("old unfinished session restarts with draft intact and completed progress preserved",async({page})=>{
 await prepare(page);
 await page.evaluate(userId=>localStorage.setItem("sparky-learning:"+userId,JSON.stringify({version:1,checkpoints:{old:{lessonId:"a1-identidade-01",receipt:"old",draft:"My existing draft.",contentVersion:"old",updatedAt:new Date().toISOString()}},writings:[],attempts:[],vocabulary:[]})),userId);
 await page.reload();
 await expect(page.getByRole("status").filter({hasText:"As lições ganharam seis questões rápidas."})).toBeVisible();
 await openLesson(page,lessons.find(l=>l.id==="a1-identidade-01")!);
 const writings=await page.evaluate(userId=>JSON.parse(localStorage.getItem("sparky-learning:"+userId)!).writings,userId);
 expect(writings[0].text).toBe("My existing draft.");
 await expect(dialog(page).getByText("1/6",{exact:true})).toBeVisible();
});

test("quick onboarding resumes at the first pending stage with no automatic voice request",async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("sparky-opening-seen-v4","1"));
 const state:{enabled:boolean;profile:Record<string,unknown>|null;revision:number;draft:Record<string,unknown>|null;placement:null}={enabled:true,profile:null,revision:0,draft:{step:"pronunciation",name:"Ana Maria",age:12,guardianConsent:true,mascot:"sparky"},placement:null};
 let voiceCalls=0;
 await page.route("**/api/onboarding/audio**",r=>{voiceCalls++;return r.fulfill({status:503});});
 await page.route("**/api/onboarding",async r=>{
  if(r.request().method()==="POST"){
   const b=r.request().postDataJSON();state.revision++;
   if(b.action==="level")Object.assign(state.draft!,{level:b.level,levelMethod:"self-assessment",step:"finish"});
   if(b.action==="quick-finish"){state.profile={...state.draft,mascot:b.mascot,onboardingCompleted:true,namePronunciationStatus:"text-only"};state.draft=null;}
  }
  await r.fulfill({json:state});
 });
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Seu ponto de partida",exact:true})).toBeVisible();
 await page.getByRole("button",{name:/B2/}).click();
 await page.getByRole("button",{name:"Continuar",exact:true}).click();
 await page.reload();
 await expect(page.getByRole("heading",{name:"Vamos praticar?",exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Pinky",exact:true}).click();
 await page.getByRole("button",{name:"Começar a praticar",exact:true}).click();
 await expect(page.locator(".quick-today")).toBeVisible();
 expect(state.profile?.mascot).toBe("pinky");expect(state.profile?.level).toBe("B2");expect(voiceCalls).toBe(0);
});

test("new release waits for the current question, then refreshes safely",async({page})=>{
 await page.clock.install();
 await prepare(page);
 await openLesson(page,lessons.find(l=>l.id==="a1-identidade-01")!);
 await page.route("**/api/release?**",r=>r.fulfill({json:{version:"new-preview-release"}}));
 await page.evaluate(()=>window.dispatchEvent(new Event("online")));
 await page.clock.fastForward(61000);
 await page.evaluate(()=>window.dispatchEvent(new Event("online")));
 await expect(page.locator("[data-release-update]")).toBeVisible();
 await expect(dialog(page)).toBeVisible();
 await dialog(page).getByRole("button",{name:"Fechar lição",exact:true}).click();
 await expect(page.locator(".quick-today")).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem("sparky-release-reloaded"))).toBe("new-preview-release");
});

test("expired evidence restarts without granting a reward",async({page})=>{
 await prepare(page);
 const lesson=lessons.find(l=>l.id==="a1-identidade-01")!;
 await openLesson(page,lesson);
 await dialog(page).getByRole("button",{name:"Fechar lição",exact:true}).click();
 await page.evaluate(({userId,lessonId})=>{
  const key="sparky-learning:"+userId,workspace=JSON.parse(localStorage.getItem(key)!);
  workspace.checkpoints[lessonId+":lesson"].receipt="expired-proof";
  localStorage.setItem(key,JSON.stringify(workspace));
 },{userId,lessonId:lesson.id});
 await page.reload();
 await page.locator(".next-lesson button").click();
 await dialog(page).getByRole("button",{name:new RegExp(lesson.exercises![0].answer!)}).click();
 await dialog(page).getByRole("button",{name:"Verificar",exact:true}).click();
 await expect(dialog(page).getByRole("alert")).toContainText("A sessão expirou.");
 await expect(dialog(page).getByRole("button",{name:"Começar",exact:true})).toBeVisible();
 const wallet=await page.request.get("/api/rewards").then(r=>r.json());
 expect(wallet.completed[lesson.id]).toBeUndefined();
 await dialog(page).getByRole("button",{name:"Começar",exact:true}).click();
 await expect(dialog(page).getByText("1/6",{exact:true})).toBeVisible();
});

test("completed challenge saves a personal best and replay grants no duplicate coins",async({page})=>{
 await prepare(page);
 const lesson=lessons.find(l=>l.id==="a1-identidade-01")!;
 await openLesson(page,lesson,"challenge");
 for(let i=0;i<6;i++){await answer(page,lesson,i);await advance(page,i===5);}
 await expect(page.locator(".lesson-completion-moment")).toContainText("600 pontos");
 await expect(page.locator(".lesson-completion-moment")).toContainText("Novo recorde!");
 const wallet=await page.request.get("/api/rewards").then(r=>r.json());
 await page.locator(".lesson-completion-moment").getByRole("button",{name:"Voltar ao início",exact:true}).click();
 await openLesson(page,lesson,"challenge");
 for(let i=0;i<6;i++){await answer(page,lesson,i);await advance(page,i===5);}
 await expect(page.locator(".lesson-completion-moment")).toBeVisible();
 const replay=await page.request.get("/api/rewards").then(r=>r.json());
 expect(replay.coins).toBe(wallet.coins);
});
