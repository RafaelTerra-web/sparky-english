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

test('store surfaces and text keep accessible contrast in every palette', async ({ page }) => {
  await account(page);
  await page.getByRole('button', { name: 'Loja', exact: true }).filter({ visible: true }).click();
  await page.locator('.shop-v2').waitFor();
  const palettes = ['sparky', 'beatrice', 'ocean', 'sunset', 'graphite'];
  for (const palette of palettes) {
    for (const mode of ['light', 'dark']) {
      await page.evaluate(({ palette, mode }) => {
        document.documentElement.dataset.palette = palette;
        document.documentElement.dataset.theme = mode;
      }, { palette, mode });
      const result = await page.evaluate(() => {
        const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const luminance = (value: string) => {
          const channels = rgb(value).map((part) => { const v = part / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
          return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
        };
        const ratio = (foreground: string, background: string) => {
          const a = luminance(foreground), b = luminance(background);
          return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        };
        const pairs = ['.shop-v2', '.shop-card', '.shop-card-art', '.shop-card-copy>p:last-child'].map((selector) => {
          const element = document.querySelector(selector)!;
          const style = getComputedStyle(element);
          let parent: Element | null = element;
          let background = style.backgroundColor;
          while ((background === 'rgba(0, 0, 0, 0)' || background === 'transparent' || rgb(background).length < 3) && parent?.parentElement) {
            parent = parent.parentElement;
            background = getComputedStyle(parent).backgroundColor;
          }
          return { selector, ratio: ratio(style.color, background), background };
        });
        return pairs;
      });
      for (const pair of result) {
        expect(pair.ratio, `${palette}/${mode} ${pair.selector}`).toBeGreaterThanOrEqual(4.5);
        if (mode === 'dark') expect(pair.background, `${palette} must not show white cards`).not.toBe('rgb(255, 255, 255)');
      }
    }
  }
});

test('modular wardrobe combines an outfit and an accessory without scenes', async ({ page }) => {
  type TestSlot = 'outfit' | 'head' | 'face' | 'neck' | 'back';
  type TestMascot = 'sparky' | 'pinky';
  const state: {
    storage: string; coins: number; completed: object; reviews: object; owned: string[];
    notebookTheme: null; mascot: TestMascot;
    equipped: Record<TestMascot, Partial<Record<TestSlot, string>>>;
  } = {
    storage: 'account', coins: 500, completed: {}, reviews: {},
    owned: ['pinky-focus-look', 'accessory-urban-cap-v4', 'accessory-explorer-satchel-v4'], notebookTheme: null,
    mascot: 'pinky', equipped: { sparky: {}, pinky: { outfit: 'pinky-focus-look' } },
  };
  await page.route('**/api/session', (route) => route.fulfill({ json: { authenticated: true, user: { id: 'wardrobe-test', email: 'ana@example.com', name: 'Ana' } } }));
  await page.route('**/api/onboarding', (route) => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', (route) => route.fulfill({ json: { preference: { palette: 'beatrice', mode: 'dark' }, storage: 'account' } }));
  await page.route('**/api/rewards', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { action: string; mascot: TestMascot; slot: TestSlot; itemId: string };
      if (body.action === 'equip') state.equipped[body.mascot][body.slot] = body.itemId;
      if (body.action === 'reset-look') state.equipped[body.mascot] = {};
    }
    await route.fulfill({ json: state });
  });
  await page.addInitScript(() => localStorage.setItem('sparky-appearance-v1', JSON.stringify({ palette: 'beatrice', mode: 'dark' })));
  await page.goto('/');
  await page.getByRole('button', { name: 'Loja', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'Cenários', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Acessórios', exact: true }).click();
  const card = page.locator('[data-item="accessory-urban-cap-v4"]');
  await card.getByRole('button', { name: 'Experimentar' }).click();
  const previewLayer = page.locator('.mascot-preview .wardrobe-head');
  await expect(previewLayer).toBeVisible();
  // naturalWidth is density-corrected for a responsive srcset, so it may be
  // smaller than the source PNG on high-density mobile screens.
  await expect.poll(() => previewLayer.evaluate((element) => {
    const image = element as HTMLImageElement;
    return image.complete && image.naturalWidth > 0;
  })).toBe(true);
  await page.getByRole('button', { name: 'Usar este item' }).click();
  await expect(card.getByText('Em uso')).toBeVisible();
  await expect(page.locator('.mascot-preview .mascot-base')).toHaveAttribute('src', /pinky-focus-look/);
  await expect(page.locator('.mascot-preview .wardrobe-head')).toHaveAttribute('src', /urban-cap-pinky/);
  await page.getByRole('button', { name: 'Bolsas', exact: true }).click();
  await page.locator('[data-item="accessory-explorer-satchel-v4"]').getByRole('button', { name: 'Experimentar' }).click();
  await expect(page.locator('.mascot-preview .wardrobe-back + .mascot-base')).toBeVisible();
  await page.getByRole('button', { name: 'Usar este item' }).click();
  await page.getByRole('button', { name: 'Remover cabeça', exact: true }).click();
  await expect(page.locator('.mascot-preview .wardrobe-head')).toHaveCount(0);
  await expect(page.locator('.mascot-preview .wardrobe-back')).toBeVisible();
  await expect(page.locator('.mascot-preview .mascot-base')).toHaveAttribute('src', /pinky-focus-look/);
  await page.reload();
  await page.getByRole('button', { name: 'Loja', exact: true }).filter({ visible: true }).click();
  await expect(page.locator('.mascot-preview .wardrobe-back')).toBeVisible();
  await page.getByRole('button', { name: 'Restaurar visual básico' }).click();
  await expect(page.locator('.mascot-preview .wardrobe-layer')).toHaveCount(0);
  await expect(page.locator('.mascot-preview .mascot-base')).toHaveAttribute('src', /bases%2Fpinky/);
});
