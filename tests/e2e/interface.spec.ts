import { test, expect, type Page } from '@playwright/test';

async function account(page: Page) {
  await page.route('**/api/session', r => r.fulfill({ json: { authenticated: true, user: { id: 'comfort-test', email: 'ana@example.com', name: 'Ana' } } }));
  await page.route('**/api/rewards', r => r.fulfill({ json: { storage: 'account', coins: 40, completed: {}, reviews: {}, owned: [], notebookTheme: null, mascot: 'sparky', equipped: { sparky: {}, pinky: {} } } }));
  await page.route('**/api/onboarding', r => r.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', r => r.fulfill({ json: { preference: { palette: 'sparky', mode: 'light' }, storage: 'account' } }));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Começar a lição', exact: true })).toBeVisible();
  await page.addStyleTag({ content: 'nextjs-portal{display:none}' });
}

test('installation does not obstruct study and remains available in profile', async ({ page }, info) => {
  await account(page);
  const prompt = page.getByRole('complementary', { name: 'Instalar Sparky English no celular' });
  if (info.project.name !== 'desktop') {
    await expect(prompt).toBeAttached();
    expect(await prompt.evaluate(el => getComputedStyle(el).position)).toBe('relative');
    await page.getByRole('button', { name: 'Fechar convite de instalação' }).click();
    await expect(prompt).toHaveCount(0);
  }
  await page.getByRole('button', { name: 'Abrir perfil de Ana' }).click();
  if (info.project.name !== 'desktop') {
    await expect(prompt).toBeAttached();
    await page.getByRole('button', { name: 'Ver como instalar' }).click();
    await expect(prompt.getByRole('listitem')).toHaveCount(3);
    await page.getByRole('button', { name: 'Ocultar instruções' }).click();
  }
  await page.getByRole('button', { name: 'Curso', exact: true }).filter({visible:true}).click();
  await expect(page.locator('.catalog-levels')).toBeVisible();
  await expect(prompt).toHaveCount(0);
  await page.getByLabel('Buscar no curso').fill('palavra-inexistente-xyz');
  await expect(page.getByRole('heading', {name:'Nenhuma lição neste filtro'})).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page.getByLabel('Buscar no curso')).toHaveValue('');
  await page.getByRole('button', { name: /Simulados ·/ }).click();
  if (info.project.name !== 'desktop') {
    await expect(page.getByRole('navigation', { name:'Navegação no celular' }).getByRole('button', { name:'Curso', exact:true })).toHaveAttribute('aria-current','page');
  }
});

test('layout fits narrow screens and lesson transitions start at the top', async ({ page }, info) => {
  await account(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({width,height:800});
    for (const screen of ['Hoje','Curso','Caderno','Loja']) {
      await page.getByRole('button',{name:screen,exact:true}).filter({visible:true}).click();
      await page.locator(screen==='Curso'?'.catalog-levels':screen==='Caderno'?'.learning-notebook':screen==='Loja'?'.shop-v2':'.next-lesson').waitFor();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${screen} at ${width}px`).toBe(true);
      if(width===390 || width===1440) await page.screenshot({path:info.outputPath(`${screen}-${width}.png`)});
      if(width<=700) {
        const nav=page.getByRole('navigation',{name:'Navegação no celular'});
        expect(await nav.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(5);
        const boxes=await nav.getByRole('button').evaluateAll(items=>items.map(el=>el.getBoundingClientRect().top));
        expect(new Set(boxes).size).toBe(1);
      }
    }
    await page.getByRole('button',{name:'Abrir perfil de Ana'}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Profile at ${width}px: ${await page.evaluate(()=>Array.from(document.querySelectorAll('main *')).filter(el=>el.getBoundingClientRect().right>innerWidth).map(el=>el.className).join(', '))}`).toBe(true);
  }
  await page.setViewportSize({width:info.project.name==='desktop'?1280:390,height:800});
  await page.getByRole('button',{name:'Hoje',exact:true}).filter({visible:true}).click();
  await page.getByRole('button',{name:'Começar a lição',exact:true}).click();
  const body=page.locator('.lesson-body');
  const illustration=page.locator('.lesson-illustration');
  await expect(illustration).toBeVisible();
  const image=illustration.locator('img');
  await expect.poll(()=>image.evaluate(el=>(el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const box=await illustration.boundingBox();
  const imageBox=await image.boundingBox();
  expect(imageBox!.height).toBeLessThanOrEqual(box!.height+1);
  await expect.poll(()=>body.evaluate(el=>el.scrollTop)).toBe(0);
  await page.screenshot({path:info.outputPath('lesson-comfort.png')});
  await body.evaluate(el=>el.scrollTop=el.scrollHeight);
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect.poll(()=>body.evaluate(el=>el.scrollTop)).toBe(0);
  await page.getByRole('button',{name:'Voltar etapa',exact:true}).click();
  await expect.poll(()=>body.evaluate(el=>el.scrollTop)).toBe(0);
  await page.getByRole('button',{name:'Fechar lição'}).click();
  await expect(page.getByRole('button',{name:/Continuar de onde parei/,exact:true})).toBeFocused();
});
