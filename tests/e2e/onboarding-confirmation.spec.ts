import { test, expect, type Page } from '@playwright/test';

const profile = { name:'Anselmot', normalizedName:'anselmot', age:65, ageBand:'adult', mascot:'sparky', level:'B1', levelMethod:'self-assessment', score:null, confidence:null, guardianConsent:false, onboardingCompleted:true };
const item = (id:string) => ({id,skill:'grammar',prompt:`Escolha a frase correta (${id}).`,options:['I am ready.','I is ready.','I be ready.','I are ready.'],audio:null});
async function setup(page:Page, mode:'test'|'pronunciation'|'profile') {
  const state = {
    enabled:true, revision:1,
    profile: mode === 'profile' ? {...profile} as Record<string,unknown> : null as Record<string,unknown>|null,
    draft: mode === 'profile' ? null : {...profile,onboardingCompleted:false,step:mode,namePronunciation:'Anselmot'} as Record<string,unknown>|null,
    placement: mode === 'test' ? {count:0,complete:false,result:null,item:item('question-1')} : null,
  };
  const actions:Record<string,unknown>[]=[];
  let failNextAnswer=false;
  const pcm=Buffer.alloc(4800);for(let i=0;i<2400;i++)pcm.writeInt16LE(Math.round(Math.sin(i/10)*9000),i*2);
  const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(pcm.length+36,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(24000,24);header.writeUInt32LE(48000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
  await page.route('**/api/**', async route => {
    const request=route.request(), path=new URL(request.url()).pathname;
    if(path==='/api/session')return route.fulfill({json:{authenticated:true,user:{id:'name-confirmation-test',email:'test@example.com',name:'Anselmot'}}});
    if(path==='/api/rewards')return route.fulfill({json:{storage:'account',coins:123,completed:{},reviews:{},owned:[],notebookTheme:null,mascot:'sparky',equipped:{sparky:{},pinky:{}}}});
    if(path==='/api/appearance')return route.fulfill({json:{preference:{palette:'beatrice',mode:'dark'},storage:'account'}});
    if(path==='/api/onboarding/audio')return request.method()==='POST'?route.fulfill({json:{ready:true}}):route.fulfill({contentType:'audio/wav',body:Buffer.concat([header,pcm])});
    if(path!=='/api/onboarding')return route.fulfill({status:503,json:{error:'test-no-network'}});
    if(request.method()==='POST') {
      const body=request.postDataJSON(); actions.push(body);
      if(body.action==='answer' && failNextAnswer) {failNextAnswer=false;return route.fulfill({status:503,json:{error:'Não foi possível enviar. Tente novamente.'}});}
      state.revision++;
      if(body.action==='answer' && state.placement){expect(body.id).toBe(state.placement.item.id);state.placement.count++;state.placement.item=item(`question-${state.placement.count+1}`);}
      if(body.action==='pronunciation-start')state.draft={...profile,step:'pronunciation',pronunciationOnly:true,namePronunciation:'Anselmot'};
      if(body.action==='pronunciation' && state.draft)state.draft.namePronunciation=body.pronunciation;
      if(body.action==='confirm-pronunciation' && state.draft) {
        Object.assign(state.draft,{namePronunciationStatus:body.status,namePronunciationVersion:2});
        if(state.draft.pronunciationOnly){state.profile={...profile,...state.draft,onboardingCompleted:true};state.draft=null;}
        else state.draft.step='mascot';
      }
    }
    return route.fulfill({json:state});
  });
  await page.goto('/');
  await page.addStyleTag({content:'nextjs-portal{display:none}'});
  return {state,actions,failAnswer:()=>{failNextAnswer=true;}};
}

test('placement selection waits for confirmation and failed sends keep the selected answer',async({page})=>{
  const {actions,failAnswer}=await setup(page,'test');
  const confirm=page.getByRole('button',{name:'Confirmar resposta',exact:true});
  await expect(confirm).toBeDisabled();
  await page.getByRole('button',{name:'I is ready.',exact:true}).click();
  await page.getByRole('button',{name:'I am ready.',exact:true}).click();
  expect(actions.filter(a=>a.action==='answer')).toHaveLength(0);
  await expect(page.getByRole('button',{name:'I am ready.',exact:true})).toHaveAttribute('aria-pressed','true');
  failAnswer(); await confirm.click();
  await expect(page.locator('.onboarding').getByRole('alert')).toContainText('Não foi possível enviar');
  await expect(page.getByRole('button',{name:'I am ready.',exact:true})).toHaveAttribute('aria-pressed','true');
  await confirm.click();
  await expect(page.getByRole('heading',{name:'Escolha a frase correta (question-2).'})).toBeVisible();
  await expect(confirm).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Escolha a frase correta (question-2).'})).toBeVisible();
  await expect(confirm).toBeDisabled();
  expect(actions.filter(a=>a.action==='answer').map(a=>a.answer)).toEqual([0,0]);
});

test('Sparky asks naturally, offers adjustments only after no, and requires listening before yes',async({page},info)=>{
  const {state,actions}=await setup(page,'pronunciation');
  const yes=page.getByRole('button',{name:'Sim, falou certinho!',exact:true});
  await expect(page.getByText('Que bom conhecer você,',{exact:false})).toBeVisible();
  await expect(page.getByLabel('Como se pronuncia seu nome?')).toHaveCount(0);
  await expect(yes).toBeDisabled();
  await page.getByRole('button',{name:'Ouvir Sparky',exact:true}).click();
  // Playwright's Windows WebKit has no audio backend, even though canPlayType says "probably".
  // Verify the accessible failure path there; Chromium exercises actual playback and approval below.
  if (info.project.name === 'iphone' && process.platform === 'win32') {
    await expect(page.locator('.onboarding').getByRole('alert')).toContainText('áudio está indisponível');
    await expect(yes).toBeDisabled();
    await page.getByRole('button',{name:'Não, vamos ajustar',exact:true}).click();
    await page.getByLabel('Como se pronuncia seu nome?').fill('An sél mo');
    await page.getByRole('button',{name:'Salvar ajuste e gerar novamente',exact:true}).click();
    await page.getByRole('button',{name:'Ajustar depois e continuar sem o nome falado',exact:true}).click();
    await expect(page.getByRole('button',{name:'Pinky',exact:true})).toBeVisible();
    expect(state.draft?.namePronunciationStatus).toBe('text-only');
    return;
  }
  await expect(yes).toBeEnabled();
  await page.getByRole('button',{name:'Não, vamos ajustar',exact:true}).click();
  await page.getByLabel('Como se pronuncia seu nome?').fill('An sél mo');
  await expect(yes).toBeDisabled();
  await page.getByRole('button',{name:'Salvar ajuste e gerar novamente',exact:true}).click();
  await page.getByRole('button',{name:'Ouvir Sparky',exact:true}).click();
  await expect(yes).toBeEnabled();
  await page.screenshot({path:info.outputPath('name-conversation.png'),fullPage:true});
  await yes.click();
  await expect(page.getByRole('button',{name:'Pinky',exact:true})).toBeVisible();
  expect(state.draft?.name).toBe('Anselmot');
  expect(state.draft?.namePronunciation).toBe('An sél mo');
  expect(actions.filter(a=>a.action==='confirm-pronunciation')).toHaveLength(1);
});

test('existing student fixes only pronunciation and returns with progress and a personal greeting',async({page},info)=>{
  const {state,actions}=await setup(page,'profile');
  await page.getByRole('button',{name:'Abrir perfil de Anselmot',exact:true}).click();
  await page.getByRole('button',{name:'Corrigir pronúncia do meu nome',exact:true}).click();
  await page.getByRole('button',{name:'Ouvir Sparky',exact:true}).click();
  const unsupportedAudio = info.project.name === 'iphone' && process.platform === 'win32';
  if (unsupportedAudio) {
    await expect(page.locator('.onboarding').getByRole('alert')).toContainText('áudio está indisponível');
    await page.getByRole('button',{name:'Ajustar depois e continuar sem o nome falado',exact:true}).click();
  } else await page.getByRole('button',{name:'Sim, falou certinho!',exact:true}).click();
  await page.getByRole('button',{name:'Hoje',exact:true}).filter({visible:true}).click();
  await expect(page.getByRole('complementary',{name:'Um recado do Sparky'})).toContainText('Anselmot, que bom ter você por aqui!');
  if (unsupportedAudio) await expect(page.getByRole('button',{name:'Ouvir recado do Sparky'})).toHaveCount(0);
  else await expect(page.getByRole('button',{name:'Ouvir recado do Sparky'})).toBeVisible();
  expect(state.profile?.level).toBe('B1');
  expect(actions.map(a=>a.action)).toEqual(['pronunciation-start','confirm-pronunciation']);
});

test('continuing without a spoken name disables even a matching published name recording',async({page})=>{
  const {state}=await setup(page,'profile');
  Object.assign(state.profile!,{name:'Ana',normalizedName:'ana',level:'A1',namePronunciationStatus:'text-only'});
  await page.reload();
  await page.getByRole('button',{name:'Começar a lição',exact:true}).click();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect(page.getByText('Você escolheu continuar sem o nome falado.',{exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:'Ouvir natural',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Ouvir devagar',exact:true})).toBeDisabled();
});
