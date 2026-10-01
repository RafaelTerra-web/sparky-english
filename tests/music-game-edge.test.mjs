import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as game from '../src/lib/music-game.ts';
import * as performance from '../src/lib/music-performance.ts';
import * as ambience from '../src/lib/music-ambience.ts';
import * as visuals from '../src/lib/music-visuals.ts';
import * as runtime from '../src/lib/music-runtime.ts';
import * as musicScore from '../src/lib/music-score.ts';
import * as musicEffects from '../src/lib/music-effects.ts';
import * as musicTimeline from '../src/lib/music-visual-timeline.ts';
import { validateMusic } from '../src/lib/music.ts';

const lesson = {
  id: 'reviewed-song', version: 'test', title: 'Reviewed song', artist: 'Artist', level: 'B1', topic: 'Listening', duration: 80,
  source: '/audio.wav', rights: 'original', published: true,
  lines: Array.from({ length: 8 }, (_, index) => ({
    id: 'line-' + index, start: 4 + index * 9, end: 7 + index * 9, text: 'Keep your rhythm', translation: 'Mantenha seu ritmo', tip: 'Listen carefully.',
    words: ['Keep', 'your', 'rhythm'].map((text, word) => ({ text, start: 4 + index * 9 + word, end: 5 + index * 9 + word })),
  })),
  vocabulary: [{ id: 'rhythm', word: 'rhythm', meaning: 'ritmo', ipa: '/ˈrɪðəm/', usage: 'Listen carefully.', example: 'Keep your rhythm.' }],
  questions: [{ id: 'q1', prompt: 'What do you keep?', options: ['Your rhythm', 'A book'], answer: 0, explanation: 'Listen carefully.' }],
};
const emptyComponent = { default: () => null };
const icons = new Proxy({}, { get: () => () => null });
const imports = {
  '@/lib/interface-language': { t: text => text, supportT: text => text, localizeAttribute: text => text, useCurrentInterfaceLanguage: () => 'pt-BR', useSupportLanguage: () => 'pt-BR' },
  '@/lib/music-game': game, '@/lib/music-performance': performance, '@/lib/music-ambience': ambience, '@/lib/music-visuals': visuals,
  '@/lib/music-runtime': runtime, '@/lib/music-score': musicScore,
  '@/lib/music-effects': musicEffects, '@/lib/music-visual-timeline': musicTimeline,
  '@/lib/music-energy': { musicEnergy: {} }, '@/lib/music-art': { musicArtwork: () => undefined }, '@/lib/music-feedback': {},
  'next/image': emptyComponent, 'lucide-react': icons, './music-scene': emptyComponent, './music-video': emptyComponent,
  './musify-stage': emptyComponent, './music-ambience': emptyComponent,
};
const source = ts.transpileModule(readFileSync(new URL('../src/components/music-game.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function component(phase = 'ready') {
  const compiled = { exports: {} };
  new Function('require', 'module', 'exports', source)(name => {
    if (name === 'react') return { ...React, useSyncExternalStore: (_, snapshot, serverSnapshot) => serverSnapshot ? serverSnapshot() : snapshot(), useReducer: () => [{ ...game.initialGame, phase }, () => {}] };
    if (name === 'react/jsx-runtime') return jsx;
    if (!(name in imports)) throw new Error('Unknown test import: ' + name);
    return imports[name];
  }, compiled, compiled.exports);
  return compiled.exports.default;
}
const render = (content, phase) => renderToStaticMarkup(React.createElement(component(phase), {
  lesson: content, performance: performance.normalizeMusicPerformance(null), media: { current: null }, clock: 0, playing: false, speed: 1,
}));

test('speed is selectable only before a game and no round exposes manual pause controls', () => {
  assert.match(render(lesson, 'ready'), /clip-speed-control/);
  for (const phase of ['round', 'outro', 'failed', 'result']) {
    const markup = render(lesson, phase);
    assert.ok(!markup.includes('clip-speed-control'), phase);
    assert.ok(!markup.includes('Pausar jogo') && !markup.includes('Continuar jogo'), phase);
    assert.ok(!markup.includes('clip-mini-play'), phase);
  }
});

test('a valid listening lesson without reviewed challenge words offers listening instead of crashing', () => {
  const listening = structuredClone(lesson);
  listening.lines.forEach(line => line.words.forEach(word => { word.challengeEligible = false; }));
  validateMusic(listening);
  assert.deepEqual(game.buildMusicRounds(listening, 'level1'), []);
  const markup = render(listening);
  assert.match(markup, /data-phase="unavailable"/);
  assert.ok(markup.includes('Só ouvir a música') && markup.includes('Explorar palavras'));
  assert.ok(!markup.includes('Começar a jogar'));
  assert.ok(!markup.includes('NaN') && !markup.includes('Infinity'));
});

test('level setup keeps short-track scheduling without exposing segment counts', () => {
  const markup = render(lesson);
  for (const mode of ['level1', 'level2', 'level3', 'level4']) {
    const count = game.buildMusicRounds(lesson, mode).length;
    assert.equal(count, 8);
    assert.match(markup, new RegExp('data-mode="' + mode + '"'));
  }
  assert.ok(!/\d+ trechos/.test(markup));
});

test('a fully answered track preserves three lives and waits for the complete audio before its result', () => {
  for (const mode of ['level1', 'level2', 'level3', 'level4', 'quick']) {
    for (let seed = 0; seed < 20; seed++) {
      const rounds = game.buildMusicRounds(lesson, mode, seed), deadlines = rounds.map(round => round.closes);
      let state = game.musicGameReducer(game.initialGame, { type: 'start' });
      for (const round of rounds) {
        state = game.musicGameReducer(state, { type: 'answer', index: round.index, value: round.answer, expected: round.answer,
          time: game.musicAnswerOpens(round), opens: game.musicAnswerOpens(round), closes: round.closes });
        state = game.musicGameReducer(state, { type: 'tick', time: round.closes, deadlines, finishAt: lesson.duration });
      }
      assert.equal(state.phase, 'outro');
      assert.equal(state.correct, rounds.length);
      assert.equal(state.lives, 3);
      assert.equal(state.missed, 0);
      const result = game.musicGameReducer(state, { type: 'tick', time: lesson.duration, deadlines, finishAt: lesson.duration });
      assert.equal(result.phase, 'result');
      assert.equal(game.musicGameReducer(result, { type: 'start' }).correct, 0);
    }
  }
});

test('every mode closes its last window within the track and drops a legacy word with no response time', () => {
  const ending = { ...lesson, lines: [{ ...lesson.lines[0], start: 79, end: 79.8, text: 'hello',
    words: [{ text: 'hello', start: 79, end: 79.8 }] }] };
  for (const mode of ['level1', 'level2', 'level3', 'level4', 'quick', 'guided', 'challenge', 'typing']) {
    const rounds = game.buildMusicRounds(ending, mode, 1);
    assert.equal(rounds.length, 1, mode);
    assert.equal(rounds[0].closes, ending.duration, mode);
    assert.ok(rounds[0].closes > rounds[0].opens, mode);
    const state = game.musicGameReducer(game.musicGameReducer(game.initialGame, { type: 'start' }), {
      type: 'tick', time: ending.duration, deadlines: rounds.map(round => round.closes), finishAt: ending.duration,
    });
    assert.equal(state.phase, 'result', mode);
    assert.equal(state.missed, 1, mode);
  }
  const noLegacyWindow = { ...ending, lines: [{ ...ending.lines[0], end: 80, words: [{ text: 'hello', start: 79, end: 80 }] }] };
  for (const mode of ['guided', 'challenge', 'typing']) assert.deepEqual(game.buildMusicRounds(noLegacyWindow, mode), [], mode);
  for (const mode of ['level1', 'level2', 'level3', 'level4', 'quick']) assert.equal(game.buildMusicRounds(noLegacyWindow, mode).length, 1, mode);
});

test('distractors exclude unreviewed phrases and clear homophone pairs', () => {
  const pairs = [['see', 'sea'], ['here', 'hear'], ['be', 'bee'], ['one', 'won'], ['knew', 'new'], ['would', 'wood'],
    ['whole', 'hole'], ['where', 'wear'], ['week', 'weak'], ['piece', 'peace'], ['way', 'weigh'],
    ['sun', 'son'], ['meet', 'meat'], ['made', 'maid'], ['road', 'rode']];
  const clean = { ...lesson, duration: 300, lines: pairs.map(([left, right], index) => ({ id: 'homophone-' + index,
    start: 4 + index * 16, end: 8 + index * 16, words: [
      { text: left, start: 4 + index * 16, end: 5 + index * 16 },
      { text: right, start: 5 + index * 16, end: 6 + index * 16 },
      { text: 'a grouped editorial phrase', start: 6 + index * 16, end: 7 + index * 16 },
      { text: 'uncertain', start: 7 + index * 16, end: 8 + index * 16, challengeEligible: false },
    ] })) };
  for (const mode of ['level1', 'level2', 'level3', 'level4', 'quick', 'guided', 'challenge', 'typing']) {
    for (let seed = 0; seed < 25; seed++) for (const round of game.buildMusicRounds(clean, mode, seed)) {
      assert.ok(round.options.every(value => /^[a-z][a-z0-9]*(?:'[a-z]+)?$/i.test(value)), JSON.stringify(round.options));
      assert.ok(!round.options.includes('uncertain'));
      const pair = pairs.find(group => group.includes(round.answer));
      assert.ok(!round.options.includes(pair.find(value => value !== round.answer)), round.answer);
    }
  }
});
