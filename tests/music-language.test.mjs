import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as policy from '../src/lib/language-policy.ts';
import * as game from '../src/lib/music-game.ts';
import * as performance from '../src/lib/music-performance.ts';
import * as music from '../src/lib/music.ts';
import * as ambience from '../src/lib/music-ambience.ts';
import * as visuals from '../src/lib/music-visuals.ts';
import * as translation from '../src/lib/music-translation.ts';
import { musifyCurriculum } from '../scripts/review-musify-curriculum.mjs';

const dictionary = JSON.parse(readFileSync(new URL('../public/locales/en.json', import.meta.url), 'utf8'));
function compile(path, imports, { globals = {}, react = {}, append = '' } = {}) {
  const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(globals), source + append)(name => {
    if (name === 'react') return { ...React, useSyncExternalStore: (_, snapshot) => snapshot(), ...react };
    if (name === 'react/jsx-runtime') return jsx;
    if (!(name in imports)) throw new Error('Unknown test import: ' + name);
    return imports[name];
  }, compiled, compiled.exports, ...Object.values(globals));
  return compiled.exports;
}
async function runtime(mode) {
  const api = compile('../src/lib/interface-language.tsx', { './language-policy': policy }, { globals: {
    fetch: async () => ({ ok: true, json: async () => ({ ...dictionary, 'A song title': 'BROKEN TITLE', 'Test artist': 'BROKEN ARTIST', 'Keep your rhythm': 'BROKEN LYRIC', 'rhythm': 'BROKEN WORD' }) }),
    document: { documentElement: { dataset: {} } }, localStorage: { setItem() {} },
  } });
  await api.setLearningLanguageMode(mode);
  return api;
}
const emptyComponent = { default: () => null };
const icons = new Proxy({}, { get: () => () => null });
const lesson = {
  id: 'language-fixture', version: 'test', title: 'A song title', artist: 'Test artist', level: 'A2', topic: 'Listening', duration: 80,
  source: '/fixture.wav', rights: 'original', published: true,
  lines: Array.from({ length: 8 }, (_, i) => ({
    id: 'line-' + i, start: 4 + i * 9, end: 7 + i * 9, text: 'Keep your rhythm', translation: 'Mantenha seu ritmo', tip: 'Uma orientação editorial ainda sem tradução.',
    words: ['Keep', 'your', 'rhythm'].map((text, j) => ({ text, start: 4 + i * 9 + j, end: 5 + i * 9 + j, vocabularyId: j === 2 ? 'rhythm' : undefined, translationSpans: [[{ start: 0, end: 8 }], [{ start: 9, end: 12 }], [{ start: 13, end: 18 }]][j] })),
  })),
  vocabulary: [{ id: 'rhythm', word: 'rhythm', meaning: 'ritmo', ipa: '/ˈrɪðəm/', usage: 'Use “rhythm” in the phrase from the song.', example: 'Keep your rhythm.' }],
  questions: [{ id: 'q1', prompt: 'What do you keep?', options: ['Your rhythm', 'A book'], answer: 0, explanation: 'Observe a palavra rhythm.' }],
};
function session(api, { translation = false } = {}) {
  let stateIndex = 0;
  return compile('../src/components/music-library.tsx', {
    '@/lib/interface-language': api, '@/lib/music-game': game, '@/lib/music-performance': performance, '@/lib/music': music,
    '@/lib/music-art': { musicArtwork: () => undefined }, '@/lib/musify-identity': { musifyIdentity: () => ({}) },
    'next/image': emptyComponent, 'lucide-react': icons, './music-game': emptyComponent, './music-achievements': emptyComponent,
    './mascot-moment': emptyComponent, './music-shelf.module.css': { default: {} },
  }, {
    globals: { localStorage: { getItem: () => null } },
    react: { useState(initial) {
      const index = stateIndex++;
      const value = index === 0 ? 'learn' : index === 11 ? translation : index === 14 ? 'rhythm' : typeof initial === 'function' ? initial() : initial;
      return [value, () => {}];
    } },
    append: '\nexports.TestSession = MusicSession; exports.TestSupport = MusicSupportText;',
  });
}

test('Musify support and word meanings follow the support language; Portuguese translations remain explicit help', async () => {
  const before = JSON.stringify(lesson);
  for (const mode of ['guided', 'bridge', 'immersion']) {
    const api = await runtime(mode);
    const { TestSession } = session(api);
    const markup = renderToStaticMarkup(React.createElement(TestSession, { lesson, userId: 'test', onClose() {}, lab: false }));
    assert.ok(!/BROKEN TITLE|BROKEN ARTIST|BROKEN LYRIC|BROKEN WORD/.test(markup));
    assert.ok(markup.includes('A song title') && markup.includes('Test artist') && markup.includes('Keep your rhythm'));
    assert.ok(!markup.includes('Mantenha seu ritmo'), mode + ': translation starts hidden');
    assert.ok(markup.includes(mode === 'guided' ? 'Ver tradução em português' : 'Show Portuguese translation'));
    if (mode === 'immersion') {
      assert.match(markup, /<details><summary> Show Portuguese meaning <\/summary><p lang="pt-BR">ritmo<\/p><\/details>/);
      assert.ok(markup.includes('Listen to the excerpt and repeat it in short chunks.'));
      assert.match(markup, /<details><summary> Show Portuguese guidance <\/summary><p lang="pt-BR">Uma orientação editorial ainda sem tradução\.<\/p><\/details>/);
      assert.ok(markup.includes('Use “rhythm” in the phrase from the song.'));
    } else {
      assert.match(markup, /<p lang="pt-BR">ritmo<\/p>/);
      assert.ok(markup.includes('Uma orientação editorial ainda sem tradução.'));
      assert.ok(markup.includes('Use “rhythm” na frase da música.'));
    }
    const open = session(api, { translation: true }).TestSession;
    const translated = renderToStaticMarkup(React.createElement(open, { lesson, userId: 'test', onClose() {}, lab: false }));
    assert.match(translated, /<p lang="pt-BR">Mantenha seu ritmo<\/p>/);
  }
  assert.equal(JSON.stringify(lesson), before);
});

test('Musify ready and failure controls translate independently from the pedagogical explanation', async () => {
  for (const mode of ['guided', 'bridge', 'immersion']) {
    const api = await runtime(mode);
    const englishUI = mode !== 'guided';
    for (const phase of ['ready', 'failed']) {
      const Game = compile('../src/components/music-game.tsx', {
        '@/lib/interface-language': api, '@/lib/music-game': game, '@/lib/music-performance': performance,
        '@/lib/music-ambience': ambience, '@/lib/music-visuals': visuals, '@/lib/music-energy': { musicEnergy: {} },
        '@/lib/music-art': { musicArtwork: () => undefined }, '@/lib/music-feedback': {}, 'next/image': emptyComponent, 'lucide-react': icons,
        './music-scene': emptyComponent, './music-video': emptyComponent, './music-chorus-fx': emptyComponent,
        './musify-identity-fx': emptyComponent, './music-ambience': emptyComponent,
      }, { react: { useReducer: () => [{ ...game.initialGame, phase, lives: phase === 'failed' ? 0 : 3 }, () => {}] } }).default;
      const markup = renderToStaticMarkup(React.createElement(Game, {
        lesson, performance: performance.normalizeMusicPerformance(null), media: { current: null }, clock: 0, playing: false, speed: 1,
      }));
      assert.ok(markup.includes(englishUI ? 'Listening game' : 'Jogo de escuta'));
      assert.ok(markup.includes(englishUI ? 'Flow mode' : 'Modo fluxo') || phase === 'failed');
      assert.ok(markup.includes(englishUI ? phase === 'ready' ? 'Start playing' : 'Try again · 3 lives' : phase === 'ready' ? 'Começar a jogar' : 'Tentar de novo · 3 vidas'));
      assert.ok(markup.includes(mode === 'immersion' ? phase === 'ready' ? 'Three lives per game.' : 'You are out of lives.' : phase === 'ready' ? 'Três vidas por partida.' : 'Suas vidas acabaram.'));
      assert.ok(markup.includes('A song title') && markup.includes('Test artist'));
      assert.ok(!markup.includes('BROKEN'));
    }
  }
});

test('authored English music guidance is identified explicitly and never mislabeled as Portuguese', async () => {
  for (const mode of ['guided', 'bridge', 'immersion']) {
    const api = await runtime(mode);
    const { TestSupport } = session(api);
    const markup = renderToStaticMarkup(React.createElement(TestSupport, {
      text: 'Listen for the rhythm in this phrase.', sourceLanguage: 'en',
      fallback: 'Ouça o trecho e repita em blocos curtos. Preste atenção ao ritmo e às palavras que se ligam.',
    }));
    assert.match(markup, /<p lang="en">Listen for the rhythm in this phrase\.<\/p>/);
    assert.ok(!markup.includes('Portuguese') && !markup.includes('português'));
    if (mode === 'immersion') assert.ok(!markup.includes('<details>'));
    else {
      assert.ok(markup.includes('Ouça o trecho e repita em blocos curtos.'));
      assert.ok(markup.includes(mode === 'guided' ? 'Ver orientação em inglês' : 'Show English guidance'));
    }
  }
});

test('ambient lyrics show translation context while masking pending equivalents and preserve immersion', async () => {
  const rounds = [{ ...game.buildMusicRounds(lesson, 'level1', 1)[0], lineIndex: 0, index: 0, target: 2, targets: [2] }];
  for (const mode of ['guided', 'bridge', 'immersion']) {
    const api = await runtime(mode);
    const Ambience = compile('../src/components/music-ambience.tsx', {
      '@/lib/interface-language': api, '@/lib/music-visuals': visuals, '@/lib/music-ambience': ambience, '@/lib/music-translation': translation,
    }).default;
    const render = completed => renderToStaticMarkup(React.createElement(Ambience, { lines: lesson.lines, index: rounds[0].lineIndex, clock: 7, rounds, completed }));
    assert.ok(!render(0).includes('Mantenha seu ritmo'), mode + ': planned question masks its translation');
    assert.ok(!render(0).includes('BROKEN'));
    if (mode === 'immersion') {
      assert.ok(!render(0).includes('clip-phrase-translation'));
      assert.ok(!render(1).includes('Mantenha seu ritmo'));
    } else {
      assert.match(render(0), /Mantenha seu <span[^>]+class="clip-translation-mask"[^>]+>•••<\/span>/);
      assert.ok(!render(0).includes('>ritmo<'));
      assert.ok(render(1).includes('Mantenha seu ritmo'));
    }
  }
});

test('connection and release controls have English dictionary entries', async () => {
  const api = await runtime('immersion');
  for (const key of [
    'Sem conexão no momento.', 'Sua lição continua aqui. Reconecte-se para verificar respostas e salvar conclusões.',
    'Abrir prática offline', 'Nova versão disponível', 'Atualize para continuar com as novidades do Sparky.',
    'Sem conexão. Tente atualizar novamente quando estiver online.', 'Atualizando…', 'Atualizar', 'Mais tarde',
  ]) assert.notEqual(api.translate(key, 'en'), key, key);
});

test('all seven new tracks have editorial English topics and usage guidance without changing examples', async () => {
  const api = await runtime('immersion');
  const { TestSupport } = session(api);
  const before = JSON.stringify(musifyCurriculum);
  assert.equal(Object.keys(musifyCurriculum).length, 7);
  const entries = Object.values(musifyCurriculum).flatMap(track => track.vocabulary);
  assert.equal(entries.length, 43);
  for (const track of Object.values(musifyCurriculum)) {
    assert.notEqual(api.translate(track.topic, 'en'), track.topic, track.topic);
    for (const entry of track.vocabulary) {
      const english = api.translate(entry.usage, 'en');
      assert.notEqual(english, entry.usage, entry.word);
      const markup = renderToStaticMarkup(React.createElement(TestSupport, {
        text: entry.usage, fallback: 'Compare a palavra com o exemplo em inglês. Depois, use-a em uma frase sua.',
      }));
      assert.ok(!markup.includes('<details>'), entry.word + ': editorial English is available directly');
      assert.ok(markup.startsWith('<p lang="en">'), entry.word);
    }
  }
  assert.equal(JSON.stringify(musifyCurriculum), before);
});
