import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as policy from '../src/lib/language-policy.ts';
import { compareTranscript } from '../src/lib/speech.ts';

function runtime(fetcher) {
  const source = ts.transpileModule(readFileSync(new URL('../src/lib/interface-language.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const compiled = { exports: {} }, storage = new Map();
  const document = { documentElement: { lang: '', dataset: {} } };
  new Function('require', 'module', 'exports', 'fetch', 'document', 'localStorage', source)(
    name => name === 'react' ? {} : policy, compiled, compiled.exports, fetcher, document,
    { setItem: (key, value) => storage.set(key, value), getItem: key => storage.get(key) ?? null });
  return { api: compiled.exports, storage, document };
}
const dictionary = { 'Continuar': 'Continue', 'Em português, usamos idade.': 'In Portuguese, we use age.', 'What is your name?': 'DO NOT TRANSLATE THE STIMULUS' };
test('English menus retain Portuguese support, immersion is explicit, stimuli are immutable', async () => {
  const { api, storage } = runtime(async () => ({ ok: true, json: async () => dictionary }));
  await api.setLearningLanguageMode('bridge', 'ana');
  assert.equal(api.uiT('Continuar').trim(), 'Continue');
  assert.equal(api.supportT('Em português, usamos idade.').trim(), 'Em português, usamos idade.');
  assert.equal(api.targetText('What is your name?'), 'What is your name?');
  await api.setLearningLanguageMode('immersion', 'ana');
  assert.equal(api.supportT('Em português, usamos idade.').trim(), 'In Portuguese, we use age.');
  await api.setSupportLanguage('pt-BR', 'ana');
  assert.equal(api.getInterfaceLocale(), 'en');
  assert.equal(storage.get('sparky-support-language:ana'), 'pt-BR');
  assert.equal(api.supportT('Em português, usamos idade.').trim(), 'Em português, usamos idade.');
});
test('a slow English load cannot overwrite a newer account or mode choice', async () => {
  let resolve;
  const { api, storage } = runtime(() => new Promise(done => { resolve = done; }));
  const old = api.setLearningLanguageMode('immersion', 'ana');
  await api.setLearningLanguageMode('guided', 'omar');
  resolve({ ok: true, json: async () => dictionary }); await old;
  assert.equal(api.getInterfaceLocale(), 'pt-BR');
  assert.equal(api.getSupportLocale(), 'pt-BR');
  assert.equal(storage.has('sparky-language:ana'), false);
});
test('dictionary failure preserves the current mode and permits a retry', async () => {
  let calls = 0;
  const { api } = runtime(async () => ({ ok: ++calls > 1, json: async () => dictionary }));
  await assert.rejects(api.setLearningLanguageMode('immersion', 'ana'));
  assert.equal(api.getSupportLocale(), 'pt-BR');
  await api.setLearningLanguageMode('bridge', 'ana');
  assert.equal(api.getInterfaceLocale(), 'en');
});
test('editorial spelling labels do not reject legitimate variants or accept changed meaning', () => {
  assert.equal(policy.englishVariety('The organisation travelled to the centre.'), 'International English');
  assert.equal(policy.englishVariety('The organization traveled to the center.'), 'US English');
  assert.equal(compareTranscript('We analysed the coloured programme.', 'We analyzed the colored program.').exact, true);
  assert.equal(compareTranscript('We travelled there.', 'We did not travel there.').exact, false);
});
