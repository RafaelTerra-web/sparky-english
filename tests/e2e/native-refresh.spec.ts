import { test, expect, type Page } from '@playwright/test';

const rewards = {
  storage: 'account', coins: 0, completed: {}, reviews: {}, owned: [],
  notebookTheme: null, mascot: 'sparky', equipped: { sparky: {}, pinky: {} },
};
type Point = { x: number; y: number; id?: number };
const start = { x: 140, y: 100, id: 1 };
const indicator = (page: Page) => page.locator('.native-refresh');
const ownership = (page: Page) => page.locator('html');

function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

async function prepare(page: Page, releaseGate = Promise.resolve()) {
  const control = { rewardGets: 0, releaseChecks: 0, releaseVersion: '' };
  await page.addInitScript(() => {
    localStorage.setItem('sparky-opening-seen-v4', '1');
    localStorage.setItem('sparky-interface-language', 'pt-BR');
    localStorage.setItem('sparky-language:native-refresh-test', 'pt-BR');
    localStorage.setItem('sparky-support-language:native-refresh-test', 'pt-BR');
  });
  await page.route('**/api/session', route => route.fulfill({ json: {
    authenticated: true, user: { id: 'native-refresh-test', email: 'refresh@example.test', name: 'Ana' },
  } }));
  await page.route('**/api/rewards', route => {
    if (route.request().method() === 'GET') control.rewardGets++;
    return route.fulfill({ json: rewards });
  });
  await page.route('**/api/onboarding', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/appearance', route => route.fulfill({ json: {
    storage: 'account', preference: { palette: 'sparky', mode: 'light' },
  } }));
  await page.route('**/api/notifications', route => route.fulfill({ json: { enabled: false } }));
  await page.route('**/api/push', route => route.fulfill({ json: { available: false } }));
  await page.route('**/api/release?**', async route => {
    control.releaseChecks++;
    await releaseGate;
    await route.fulfill({ json: { version: control.releaseVersion } });
  });
  await page.goto('/');
  await expect(page.locator('.quick-today h1')).toBeVisible();
  await expect(ownership(page)).not.toHaveAttribute('data-scroll-locked', 'true');
  await expect(indicator(page)).toHaveAttribute('data-phase', 'idle');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  return control;
}

// Waiting for two frames lets both the scheduled gesture paint and React's phase
// update finish before we inspect the position a user would actually see.
async function frames(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function touch(page: Page, type: string, points: Point[], selector = 'body', changed = points) {
  const prevented = await page.evaluate(({ type, points, selector, changed }) => {
    const target = document.querySelector(selector)!;
    const make = (point: Point) => new Touch({
      identifier: point.id ?? 1, target, clientX: point.x, clientY: point.y,
    });
    let event: Event;
    try {
      event = new TouchEvent(type, {
        bubbles: true, cancelable: true,
        touches: points.map(make), changedTouches: changed.map(make),
      });
    } catch {
      // WebKit delivers native touches but rejects constructing them in script.
      // Keep synthetic lifecycle checks portable; Android also has a CDP case.
      const sample = (point: Point) => ({ identifier: point.id ?? 1, target, clientX: point.x, clientY: point.y });
      event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        touches: { value: points.map(sample) },
        changedTouches: { value: changed.map(sample) },
      });
    }
    target.dispatchEvent(event);
    return event.defaultPrevented;
  }, { type, points, selector, changed });
  await frames(page);
  return prevented;
}

async function position(page: Page) {
  return indicator(page).evaluate(element => {
    const style = getComputedStyle(element);
    return {
      y: new DOMMatrixReadOnly(style.transform).m42,
      offset: Number.parseFloat((element as HTMLElement).style.getPropertyValue('--pull-offset')),
      durations: style.transitionDuration.split(',').map(value => Number.parseFloat(value)),
    };
  });
}

async function pull(page: Page, distance = 130, selector = 'body') {
  await touch(page, 'touchstart', [start], selector);
  await touch(page, 'touchmove', [{ ...start, y: start.y + distance }], selector);
  await touch(page, 'touchend', [], selector, [{ ...start, y: start.y + distance }]);
}

async function idle(page: Page) {
  await expect(indicator(page)).toHaveAttribute('data-phase', 'idle');
  await expect(ownership(page)).not.toHaveAttribute('data-sparky-refreshing', 'true');
}

test('each drag frame follows the finger immediately and extra distance meets increasing resistance', async ({ page }, info) => {
  const control = await prepare(page);
  const before = control.rewardGets;
  await touch(page, 'touchstart', [start]);
  expect(await touch(page, 'touchmove', [{ ...start, y: start.y + 5 }])).toBe(false);
  await expect(indicator(page)).toHaveAttribute('data-phase', 'idle');

  const positions: number[] = [];
  for (const distance of [40, 100, 180, 260]) {
    expect(await touch(page, 'touchmove', [{ ...start, y: start.y + distance }])).toBe(true);
    const sample = await position(page);
    expect(sample.durations.every(value => value === 0)).toBe(true);
    expect(Math.abs(sample.y - sample.offset)).toBeLessThan(.1);
    positions.push(sample.y);
  }
  await expect(indicator(page)).toHaveAttribute('data-phase', 'ready');
  await expect(indicator(page)).toContainText('Solte para atualizar');
  await page.screenshot({ path: info.outputPath('pull-refresh-ready.png') });
  await expect(ownership(page)).toHaveAttribute('data-sparky-refreshing', 'true');
  for (let index = 1; index < positions.length; index++) expect(positions[index]).toBeGreaterThan(positions[index - 1]);
  expect(positions[3] - positions[2]).toBeLessThan(positions[2] - positions[1]);
  expect(positions[3] - positions[2]).toBeLessThan(80);

  await touch(page, 'touchmove', [{ ...start, y: start.y + 60 }]);
  await expect(indicator(page)).toHaveAttribute('data-phase', 'pulling');
  expect((await position(page)).y).toBeLessThan(positions[1]);
  await touch(page, 'touchend', []);
  await idle(page);
  expect(control.rewardGets).toBe(before);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('short pulls, retreat, horizontal swipes, cancellation and a second finger never refresh', async ({ page }) => {
  const control = await prepare(page);
  const before = control.rewardGets;
  for (const scenario of ['short', 'retreat', 'horizontal', 'cancel', 'two fingers', 'different finger']) {
    await test.step(scenario, async () => {
      await touch(page, 'touchstart', [start]);
      if (scenario === 'horizontal') {
        expect(await touch(page, 'touchmove', [{ ...start, x: 280, y: 125 }])).toBe(false);
      } else {
        await touch(page, 'touchmove', [{ ...start, y: scenario === 'short' ? 165 : 230 }]);
        if (scenario === 'retreat') await touch(page, 'touchmove', [{ ...start, y: 170 }]);
        if (scenario === 'cancel') await touch(page, 'touchcancel', []);
        if (scenario === 'two fingers') {
          await touch(page, 'touchstart', [{ ...start, y: 230 }, { x: 190, y: 230, id: 2 }]);
          await touch(page, 'touchend', [{ ...start, y: 230 }], 'body', [{ x: 190, y: 230, id: 2 }]);
        }
        if (scenario === 'different finger') await touch(page, 'touchmove', [{ ...start, y: 240, id: 2 }]);
      }
      await touch(page, 'touchend', []);
      await idle(page);
      expect(control.rewardGets).toBe(before);
    });
  }
});

test('page scrolling, nested scrollers, open dialogs and text inputs keep their own gestures', async ({ page }) => {
  const control = await prepare(page);
  const before = control.rewardGets;
  await page.evaluate(() => {
    const scroller = document.createElement('div');
    scroller.id = 'refresh-scroller';
    scroller.style.cssText = 'position:fixed;top:300px;height:80px;width:180px;overflow-y:auto';
    scroller.innerHTML = '<div id="refresh-scroll-content" style="height:600px">Scrollable content</div>';
    document.body.append(scroller);
  });
  await pull(page, 150, '#refresh-scroll-content');
  await page.locator('#refresh-scroller').evaluate(element => { element.scrollTop = 80; });
  await pull(page, 150, '#refresh-scroll-content');
  await idle(page);
  await page.locator('#refresh-scroller').evaluate(element => element.remove());

  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.id = 'refresh-spacer'; spacer.style.height = '1500px'; document.body.append(spacer);
    window.scrollTo(0, 160);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1);
  await pull(page);
  await idle(page);
  await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector('#refresh-spacer')!.remove(); });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.evaluate(() => {
    const dialog = document.createElement('dialog');
    dialog.id = 'refresh-dialog'; dialog.textContent = 'Open dialog'; document.body.append(dialog); dialog.showModal();
  });
  await pull(page, 150, '#refresh-dialog');
  await idle(page);
  await page.locator('#refresh-dialog').evaluate(element => { (element as HTMLDialogElement).close(); element.remove(); });
  await page.evaluate(() => {
    const input = document.createElement('input'); input.id = 'refresh-input'; document.body.append(input);
  });
  await pull(page, 150, '#refresh-input');
  await idle(page);
  expect(control.rewardGets).toBe(before);
});

test('a slow refresh stays visible and ignores additional pulls until its single request completes', async ({ page }, info) => {
  await prepare(page);
  const response = gate();
  let calls = 0;
  await page.route('**/api/rewards', async route => {
    calls++; await response.promise; await route.fulfill({ json: { ...rewards, coins: 75 } });
  });
  const url = page.url();
  await pull(page);
  await expect.poll(() => calls).toBe(1);
  await expect(indicator(page)).toHaveAttribute('data-refreshing', 'true');
  await expect(indicator(page)).toContainText('Atualizando Sparky');
  await pull(page);
  await page.waitForTimeout(400); // Longer than the spinner's minimum display time.
  expect(calls).toBe(1);
  await page.screenshot({ path: info.outputPath('pull-refresh-updating.png') });
  await expect(indicator(page)).toHaveAttribute('data-refreshing', 'true');
  await expect(ownership(page)).toHaveAttribute('data-sparky-refreshing', 'true');
  response.resolve();
  await idle(page);
  await expect(page.locator('.wallet-chip')).toContainText('75');
  expect(page.url()).toBe(url);
});

test('a network error releases the gesture and a later pull can refresh successfully', async ({ page }) => {
  await prepare(page);
  let calls = 0;
  await page.route('**/api/rewards', route => {
    calls++;
    return calls === 1 ? route.abort('internetdisconnected') : route.fulfill({ json: { ...rewards, coins: 42 } });
  });
  await pull(page);
  await expect(indicator(page)).toHaveAttribute('data-refreshing', 'true');
  await idle(page);
  expect(calls).toBe(1);
  await expect(page.locator('.wallet-chip')).toContainText('0');
  await pull(page);
  await idle(page);
  expect(calls).toBe(2);
  await expect(page.locator('.wallet-chip')).toContainText('42');
});

test('reduced motion keeps direct dragging and removes settling transitions and spinner rotation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await prepare(page);
  await touch(page, 'touchstart', [start]);
  await touch(page, 'touchmove', [{ ...start, y: 230 }]);
  const sample = await position(page);
  expect(sample.durations.every(value => value === 0)).toBe(true);
  expect(Math.abs(sample.y - sample.offset)).toBeLessThan(.1);
  expect(await indicator(page).locator('svg').evaluate(element => getComputedStyle(element).transform)).toBe('none');
  await touch(page, 'touchend', []);
  await expect(indicator(page)).toHaveAttribute('data-refreshing', 'true');
  expect(await indicator(page).locator('.native-refresh-icon').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  expect((await position(page)).durations.every(value => value === 0)).toBe(true);
  await idle(page);
});

test('a pending release waits through the active drag and request before opening its modal', async ({ page }) => {
  const release = gate();
  const control = await prepare(page, release.promise);
  const response = gate();
  let calls = 0;
  await page.route('**/api/rewards', async route => {
    calls++; await response.promise; await route.fulfill({ json: rewards });
  });
  await touch(page, 'touchstart', [start]);
  await touch(page, 'touchmove', [{ ...start, y: 230 }]);
  await expect(ownership(page)).toHaveAttribute('data-sparky-refreshing', 'true');
  control.releaseVersion = 'native-refresh-new-release';
  const checked = page.waitForResponse('**/api/release?**');
  release.resolve();
  await checked;
  await frames(page);
  await expect(page.locator('[data-release-update]')).toHaveCount(0);

  await touch(page, 'touchend', []);
  await expect.poll(() => calls).toBe(1);
  await page.waitForTimeout(400);
  await expect(indicator(page)).toHaveAttribute('data-refreshing', 'true');
  await expect(ownership(page)).toHaveAttribute('data-sparky-refreshing', 'true');
  await expect(page.locator('[data-release-update]')).toHaveCount(0);
  response.resolve();
  await idle(page);
  await expect(page.locator('[data-release-update]')).toBeVisible();
});

test('an Android browser touch refreshes once without scrolling or navigating the page', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('android'));
  const control = await prepare(page);
  const before = control.rewardGets;
  await page.evaluate(() => {
    const spacer = document.createElement('div'); spacer.style.height = '1500px'; document.body.append(spacer);
  });
  expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight)).toBe(true);
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  const session = await page.context().newCDPSession(page);
  const point = (y: number) => [{ x: 140, y, id: 1, radiusX: 1, radiusY: 1, force: 1 }];
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(100) });
    for (const y of [135, 180, 235]) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(y) });
      await frames(page);
    }
    await expect(indicator(page)).toHaveAttribute('data-phase', 'ready');
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => control.rewardGets).toBe(before + 1);
    await idle(page);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(navigations).toBe(0);
  } finally {
    await session.detach();
  }
});
