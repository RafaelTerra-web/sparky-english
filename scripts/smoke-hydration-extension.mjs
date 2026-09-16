import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});

try {
  const page = await browser.newPage();
  const messages = [];
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') messages.push(message.text());
  });
  // Mirrors extensions that mark the document as processed between parsing
  // <body> and React hydration—the exact failure reported in the lab preview.
  await page.addInitScript(() => {
    new MutationObserver(() => {
      if (document.body && !document.body.hasAttribute('__processed_extension_test__')) {
        document.body.setAttribute('__processed_extension_test__', 'true');
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('http://127.0.0.1:3221/');
  await page.getByText('Seu estudo de hoje').waitFor();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('body').getAttribute('__processed_extension_test__'), 'true');
  assert.deepEqual(messages.filter(message => /hydrated|hydration|didn't match/i.test(message)), []);

  const nestedPage = await browser.newPage();
  const nestedMessages = [];
  nestedPage.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') nestedMessages.push(message.text());
  });
  await nestedPage.addInitScript(() => {
    new MutationObserver(() => {
      const appRoot = document.body?.querySelector(':scope > div');
      if (appRoot && !appRoot.hasAttribute('__nested_mismatch_test__')) {
        appRoot.setAttribute('__nested_mismatch_test__', 'true');
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await nestedPage.goto('http://127.0.0.1:3221/');
  await nestedPage.waitForTimeout(500);
  assert.equal(nestedMessages.filter(message => /hydrated|hydration|didn't match/i.test(message)).length, 1);
  console.log('PASS: body annotations are tolerated; nested application mismatches still surface.');
} finally {
  await browser.close();
}
