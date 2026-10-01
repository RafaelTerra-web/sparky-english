import { expect, test, type Page } from '@playwright/test';
import { buildMusicRounds } from '../../src/lib/music-game';
import type { MusicLesson } from '../../src/lib/music';
import { readFile } from 'node:fs/promises';

const names = [
  ['still-into-you','Still Into You'], ['do-i-wanna-know','Do I Wanna Know?'], ['she-knows','She Knows'],
  ['made-for-loving-you','I Was Made for Lovin’ You'], ['savage','Savage'], ['out-of-order','Out of Order'], ['king-for-a-day','King for a Day'],
];
const catalog: MusicLesson[] = names.map(([id,title]) => ({
  id, title, artist:'Test Artist', version:'musify-test', level:'B1', topic:'Listening', duration:80,
  source:`/api/music/audio?trackId=${id}`, ...(['out-of-order','made-for-loving-you'].includes(id) ? {} : {visualSource:`/api/music/video?trackId=${id}`}),
  rights:'user-provided', published:true, translationAlignmentVersion:'editorial-1',
  lines:Array.from({length:8},(_,i)=>({ id:`line-${i}`,start:4+i*9,end:7+i*9,text:'I see butterflies tonight',translation:'Vejo borboletas esta noite',tip:'Listen carefully.',words:[
    {text:'I',start:4+i*9,end:4.5+i*9,challengeEligible:false}, {text:'see',start:4.5+i*9,end:5+i*9,translationSpans:[{start:0,end:4}]},
    {text:'butterflies',start:5+i*9,end:6+i*9,translationSpans:[{start:5,end:15}]}, {text:'tonight',start:6+i*9,end:7+i*9,translationSpans:[{start:16,end:26}]},
  ]})),
  vocabulary:[{id:'butterflies',word:'butterflies',meaning:'borboletas',ipa:'/ˈbʌtərflaɪz/',usage:'Feeling',example:'I saw butterflies.'}],
  questions:[{id:'q1',prompt:'What did you hear?',options:['butterflies','flowers','lights'],answer:0,explanation:'Listen for the word.'}],
}));
const wav = Buffer.alloc(44 + 80 * 8000 * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8); wav.writeUInt32LE(16,16);
wav.writeUInt16LE(1,20); wav.writeUInt16LE(1,22); wav.writeUInt32LE(8000,24); wav.writeUInt32LE(16000,28);
wav.writeUInt16LE(2,32); wav.writeUInt16LE(16,34); wav.write('data',36); wav.writeUInt32LE(wav.length-44,40);

test('authenticated server catalog contains all eleven reviewed tracks with KISS audio only',async({request})=>{
  const response=await request.get('/api/music');
  expect(response.ok()).toBe(true);
  expect(response.headers()['cache-control']).toContain('no-store');
  const result=await response.json();
  expect(result.catalog).toHaveLength(11);
  for(const [id] of names) {
    const track=result.catalog.find((track:MusicLesson)=>track.id===id);
    expect(track).toBeTruthy();expect(track.version).toBe('musify-1');expect(track.lines.length).toBeGreaterThan(20);
    expect(track.vocabulary.length).toBeGreaterThanOrEqual(6);
  }
  expect(result.catalog.find((track:MusicLesson)=>track.id==='made-for-loving-you').visualSource).toBeUndefined();
});

async function open(page:Page, english=false) {
  await page.addInitScript(({english})=>{
    localStorage.setItem('sparky-opening-seen-v4','1');
    localStorage.setItem('sparky-interface-language',english?'en':'pt-BR');
    localStorage.setItem('sparky-support-language',english?'en':'pt-BR');
    localStorage.setItem('sparky-language:musify-test',english?'en':'pt-BR');
    localStorage.setItem('sparky-support-language:musify-test',english?'en':'pt-BR');
  },{english});
  await page.route('**/api/session',route=>route.fulfill({json:{authenticated:true,user:{id:'musify-test',name:'Ana',email:'musify@example.test'}}}));
  await page.route('**/api/rewards',route=>route.fulfill({json:{storage:'account',coins:0,completed:{},reviews:{},owned:[],mascot:'sparky',equipped:{sparky:{},pinky:{}}}}));
  await page.route('**/api/onboarding',route=>route.fulfill({json:{enabled:false}}));
  await page.route('**/api/music',route=>route.fulfill({json:{catalog,storage:'account'}}));
  await page.route('**/api/media-progress*',route=>route.fulfill({json:{version:'musify-test',revision:0,position:0,positionAt:0}}));
  await page.route('**/api/music/audio*',route=>{
    const range=/^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range||'');
    const start=range?Number(range[1]):0,end=range&&range[2]?Math.min(Number(range[2]),wav.length-1):wav.length-1;
    return route.fulfill({status:range?206:200,contentType:'audio/wav',body:wav.subarray(start,end+1),headers:{'accept-ranges':'bytes',...(range?{'content-range':`bytes ${start}-${end}/${wav.length}`}:{})}});
  });
  await page.route('**/api/music/video*',route=>route.fulfill({status:503}));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang',english?'en':'pt-BR');
  await page.getByRole('button',{name:english?'Practice':'Praticar',exact:true}).click();
  await page.getByRole('button',{name:english?/^Music /:/^Músicas /}).click();
  await expect(page.getByRole('heading',{name:'Musify',exact:true})).toBeVisible();
}
async function seek(page:Page,time:number) {
  await page.locator('audio').evaluate((audio:HTMLAudioElement,time)=>new Promise<void>((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Media seek did not finish')),4000);
    audio.addEventListener('seeked',()=>{clearTimeout(timer);resolve();},{once:true});
    audio.currentTime=time;
  }),time);
}
async function visibility(page:Page,hidden:boolean) {
  await page.evaluate(hidden=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
    document.dispatchEvent(new Event('visibilitychange'));
  },hidden);
}
test('gameplay removes transport and speed controls and resumes the same round after backgrounding',async({page})=>{
  await open(page);
  await page.locator('[data-track-id="still-into-you"]').click();
  const game=page.locator('.clip-game');
  await expect(game.getByRole('group',{name:'Velocidade do jogo'})).toBeVisible();
  await game.getByRole('button',{name:'0,75×',exact:true}).click();
  await page.getByRole('button',{name:'Ajustes de reprodução'}).click();
  await expect(page.getByRole('slider',{name:'Volume da música'})).toBeVisible();
  await expect(page.getByRole('slider',{name:'Posição da música'})).toHaveCount(0);
  await page.getByRole('button',{name:'Começar a jogar'}).click();
  await expect(game).toHaveAttribute('data-playing','true');
  await expect(game.getByRole('group',{name:'Velocidade do jogo'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Ajustes de reprodução'})).toHaveCount(0);
  await expect(page.locator('.listen-transport,.listen-timeline,.clip-mini-play')).toHaveCount(0);
  await expect(page.getByRole('button',{name:/Pausar jogo|Continuar jogo|Pausar música/})).toHaveCount(0);
  const seed=await game.getAttribute('data-session-seed');
  const round=buildMusicRounds(catalog[0],'level1',Number(seed))[0];
  await seek(page,round.opens+.1);
  const roundIndex=await game.locator('.clip-round').getAttribute('data-round');
  await visibility(page,true);
  await expect.poll(()=>page.locator('audio').evaluate((audio:HTMLAudioElement)=>audio.paused)).toBe(true);
  const pausedTime=await page.locator('audio').evaluate((audio:HTMLAudioElement)=>audio.currentTime);
  await page.waitForTimeout(180);
  expect(await page.locator('audio').evaluate((audio:HTMLAudioElement)=>audio.currentTime)).toBeCloseTo(pausedTime,3);
  await visibility(page,false);
  await expect(game).toHaveAttribute('data-playing','true');
  await expect(game).toHaveAttribute('data-session-seed',seed!);
  await expect(game.locator('.clip-round')).toHaveAttribute('data-round',roundIndex!);
  await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives','3');
  expect(await page.locator('audio').evaluate((audio:HTMLAudioElement)=>audio.playbackRate)).toBe(.75);
  await page.getByRole('button',{name:'Todas as músicas'}).click();
  await expect(page.locator('audio')).toHaveCount(0);
});
test('all seven tracks open with their own identity and mobile video support',async({page},info)=>{
  await open(page);
  for(const lesson of catalog) {
    await page.locator(`[data-track-id="${lesson.id}"]`).click();
    const room=page.getByRole('dialog',{name:lesson.title});
    await expect(room).toBeVisible();
    await expect(room).toHaveAttribute('data-musify','true');
    await expect(room.locator('.clip-lives')).toHaveAttribute('data-lives','3');
    await expect(room.locator('.clip-levels')).not.toContainText('2 palavras');
    await expect(room.locator('video')).toHaveCount(lesson.visualSource?1:0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(lesson.id==='still-into-you') await page.screenshot({path:info.outputPath('musify-ready.png')});
    await room.getByRole('button',{name:'Todas as músicas'}).click();
  }
});
test('single-word answers show context with the translated target masked, consume lives once and restart cleanly',async({page},info)=>{
  await open(page);
  await page.locator('[data-track-id="still-into-you"]').click();
  await page.getByRole('button',{name:'Começar a jogar'}).click();
  const game=page.locator('.clip-game');
  await expect(game).toHaveAttribute('data-phase','round');
  await expect(game).toHaveAttribute('data-playing','true');
  const seed=Number(await game.getAttribute('data-session-seed'));
  const rounds=buildMusicRounds(catalog[0],'level1',seed);
  for(let index=0;index<3;index++) {
    const round=rounds[index];
    await seek(page,round.opens+.1);
    const question=game.locator('.clip-round');
    await expect(question).toHaveAttribute('data-round',String(index));
    await expect(question.locator('.clip-word-mask')).toHaveCount(1);
    const translation=question.locator('[data-question=true] .clip-phrase-translation');
    await expect(translation).toHaveAttribute('data-alignment','reviewed');
    await expect(translation.locator('.clip-translation-mask')).toHaveCount(1);
    await expect(translation).toContainText('•••');
    expect((await translation.innerText()).replace('•••','').trim().length).toBeGreaterThan(0);
    await expect(question.locator('[data-question=true]')).not.toContainText('Vejo borboletas esta noite');
    const wrong=round.options.find(value=>value!==round.answer)!;
    const option=question.locator('.clip-options button').filter({hasText:wrong});
    await expect(option).toBeEnabled(); await option.click();
    await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives',String(2-index));
    if(index<2) await expect(question.locator('[data-question=true] .clip-phrase-translation')).toHaveText('Vejo borboletas esta noite');
    if(index<2) await seek(page,round.closes+.03);
  }
  await expect(game).toHaveAttribute('data-phase','failed');
  await expect(game).toHaveAttribute('data-playing','false');
  await expect(game).toContainText('FIM DA PARTIDA');
  await expect(game).not.toContainText('MÚSICA CONCLUÍDA');
  await visibility(page,true); await visibility(page,false);
  await expect(game).toHaveAttribute('data-playing','false');
  await expect(game).toHaveAttribute('data-phase','failed');
  await page.screenshot({path:info.outputPath('musify-lives.png')});
  await page.getByRole('button',{name:'Tentar de novo · 3 vidas'}).click();
  await expect(game).toHaveAttribute('data-phase','round');
  await expect(game.locator('.clip-lives')).toHaveAttribute('data-lives','3');
});
test('English immersion and reduced motion keep target English and suppress moving video',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await open(page,true);
  await page.locator('[data-track-id="still-into-you"]').click();
  const game=page.locator('.clip-game');
  await expect(game).toContainText('Choose your level');
  await expect(game.locator('video')).toHaveCount(0);
  await page.getByRole('button',{name:'Start playing'}).click();
  await expect(game).toHaveAttribute('data-playing','true');
  const rounds=buildMusicRounds(catalog[0],'level1',Number(await game.getAttribute('data-session-seed')));
  await seek(page,rounds[0].opens+.1);
  await expect(game.locator('.clip-options button').first()).toBeEnabled();
  await expect(game.locator('.clip-phrase-translation')).toHaveCount(0);
  await expect(game.locator('.clip-unified-lyrics')).toHaveAttribute('lang','en');
  await expect(game.locator('.musify-stage')).toHaveAttribute('data-mode','reduced');
  await expect(game.locator('.musify-stage')).toHaveAttribute('data-running','false');
});

test('prepared H264 video decodes, follows the audio clock and stays decorative',async({page},info)=>{
  await open(page);
  const bytes=await readFile('.music-assets/still-into-you/video.mp4');
  await page.route('**/api/music/video*',route=>{
    const range=/^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range||'');
    const start=range?Number(range[1]):0,end=range&&range[2]?Math.min(Number(range[2]),bytes.length-1):bytes.length-1;
    return route.fulfill({status:range?206:200,contentType:'video/mp4',body:bytes.subarray(start,end+1),headers:{'accept-ranges':'bytes',...(range?{'content-range':`bytes ${start}-${end}/${bytes.length}`}:{})}});
  });
  await page.locator('[data-track-id="still-into-you"]').click();
  await page.getByRole('button',{name:'Começar a jogar'}).click();
  const game=page.locator('.clip-game'),video=game.locator('video');
  await expect.poll(()=>video.evaluate((media:HTMLVideoElement)=>media.readyState)).toBeGreaterThanOrEqual(2);
  await seek(page,5.2);
  await expect.poll(()=>page.evaluate(()=>Math.abs(document.querySelector('video')!.currentTime-document.querySelector('audio')!.currentTime))).toBeLessThan(.5);
  await expect(game.locator('.music-video')).toHaveAttribute('data-active','true');
  expect(await video.evaluate((media:HTMLVideoElement)=>({muted:media.muted,inline:media.playsInline}))).toEqual({muted:true,inline:true});
  await page.screenshot({path:info.outputPath('musify-video.png')});
});
