import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { lessons } from '../src/lib/curriculum.ts';
import { lessonMetadata } from '../src/lib/course-guide.ts';
import * as policy from '../src/lib/language-policy.ts';
import * as classes from '../src/lib/english-classes.ts';
import * as personalVoice from '../src/lib/personal-voice-shared.ts';
import * as quickPractice from '../src/lib/quick-practice.ts';

const dictionary = JSON.parse(readFileSync(new URL('../public/locales/en.json', import.meta.url), 'utf8'));
function compile(path, imports, globals = {}) {
  const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(globals), source)(
    name => {
      if (name === 'react') return { ...React, useSyncExternalStore: (_, snapshot) => snapshot() };
      if (name === 'react/jsx-runtime') return jsx;
      if (!(name in imports)) throw new Error('Unknown test import: ' + name);
      return imports[name];
    }, compiled, compiled.exports, ...Object.values(globals));
  return compiled.exports;
}
async function runtime(mode, extra = {}) {
  const api = compile('../src/lib/interface-language.tsx', { './language-policy': policy }, {
    fetch: async () => ({ ok: true, json: async () => ({ ...dictionary, ...extra }) }),
    document: { documentElement: { dataset: {} } }, localStorage: { setItem() {} },
  });
  await api.setLearningLanguageMode(mode);
  return api;
}
function supportComponent(api) {
  return compile('../src/components/lesson-support.tsx', {
    '@/lib/interface-language': api, '@/lib/language-policy': policy,
    '@/lib/content/build': { contentVersion: 'test' }, '@/lib/learning-local': {},
    './speech-practice': { SpeechPractice: () => null },
  }).default;
}
const normalize = text => text.replace(/\s+/g, ' ').trim();

test('all 176 lessons have both prompt/feedback languages and translated reference guidance', async () => {
  const api = await runtime('immersion');
  assert.equal(lessons.length, 176);
  for (const lesson of lessons) {
    assert.notEqual(api.translate(lesson.title, 'en'), lesson.title, lesson.id + ': title');
    const outcome = lessonMetadata[lesson.id]?.outcome ?? lesson.experience.application;
    assert.notEqual(api.translate(outcome, 'en'), normalize(outcome), lesson.id + ': outcome');
    for (const step of lesson.exercises) {
      assert.ok(step.bodyEnglish && step.explanationEnglish, lesson.id + ': prompt and feedback');
      if (step.kind === 'order_words') assert.deepEqual([...step.options].sort(), step.answer.split(' ').sort(), lesson.id + ': immutable tokens');
      else assert.ok(step.options.includes(step.answer), lesson.id + ': immutable key');
      if (step.contextHint) {
        assert.ok(step.contextHint.english && step.contextHint.portuguese);
        assert.ok(!step.english.includes(step.contextHint.portuguese), lesson.id + ': support hint is separate');
      }
    }
    for (const step of lesson.support) {
      if (['teach', 'dialogue', 'error_analysis', 'production'].includes(step.kind)) {
        assert.notEqual(api.translate(step.body, 'en'), normalize(step.body), lesson.id + ':' + step.kind);
      }
      if (step.speakingTask) assert.notEqual(api.translate(step.speakingTask, 'en'), normalize(step.speakingTask), lesson.id + ': speaking');
      if (step.pronunciation) for (const field of ['focus', 'mouth', 'natural']) {
        assert.notEqual(api.translate(step.pronunciation[field], 'en'), normalize(step.pronunciation[field]), lesson.id + ': ' + field);
      }
    }
  }
  assert.equal(lessons.flatMap(lesson => lesson.exercises).filter(step => step.contextHint).length, 14);
});

test('glossaries preserve English terms, Portuguese meanings and authored line breaks', () => {
  const entries = policy.vocabularyEntries('Monday — segunda-feira\nOctober — outubro\nbirthday — aniversário');
  assert.deepEqual(entries, [
    { term: 'Monday', meaning: 'segunda-feira' }, { term: 'October', meaning: 'outubro' },
    { term: 'birthday', meaning: 'aniversário' },
  ]);
  assert.deepEqual(policy.vocabularyEntries("Hi, I'm Ana."), [{ term: "Hi, I'm Ana.", meaning: undefined }]);
});

test('guided, bridge and immersion render support and optional translations with their own language', async () => {
  const lesson = lessons.find(lesson => lesson.id === 'a1-identidade-01');
  for (const mode of ['guided', 'bridge', 'immersion']) {
    const api = await runtime(mode, { 'What is your name?': 'BROKEN TARGET' });
    const Support = supportComponent(api);
    const markup = renderToStaticMarkup(React.createElement(Support, { lesson }));
    assert.ok(!markup.includes('BROKEN TARGET'), mode + ': even templated English is preserved');
    const support = policy.learningLanguageModes[mode].supportLocale;
    assert.ok(markup.includes('lang="' + support + '"'));
    assert.ok(markup.includes(mode === 'immersion' ? 'What asks for information.' : "What pergunta &#x27;o quê/qual&#x27;."));
    assert.ok(markup.includes(mode === 'guided' ? 'A ideia principal' : 'The main idea'));
    assert.match(markup, /<details><summary> (?:Ver tradução em português|Show Portuguese translation) <\/summary><p lang="pt-BR" data-language-role="translation">Qual é o seu nome\?<\/p><\/details>/);
    if (mode === 'immersion') assert.ok(markup.includes('Show Portuguese meanings'));
  }
});

test('support scaffolds insert target text and learner names without dictionary substitution', async () => {
  const api = await runtime('immersion', {
    'What is your name?': 'BROKEN TARGET', 'Ana': 'BROKEN NAME',
    'Olá, {0}.': 'Hello, {0}.',
  });
  assert.equal(api.supportTemplate('Olá, {0}.', 'Ana'), 'Hello, Ana.');
  assert.equal(api.supportTemplate('Crie uma versão pessoal de “{0}”. Diga-a uma vez com cuidado e outra copiando o ritmo natural do áudio.', 'What is your name?'),
    'Create a personal version of “What is your name?”. Say it once carefully and once copying the natural rhythm of the audio.');
  assert.equal(api.supportTemplate(personalVoice.personalVoiceTemplate('welcome'), 'Ana'),
    'Ana, great to have you here! Let’s set aside a moment for English? Choose a lesson and come with me.');
  assert.ok(personalVoice.personalVoiceText('Ana', 'welcome').startsWith('Ana,'));
});

test('every exercise across all 176 lessons renders immutable English targets in all three modes', async () => {
  const targets = Object.fromEntries(lessons.flatMap(lesson => lesson.exercises.flatMap(step => [step.english, step.cue, ...step.options].filter(Boolean))).map(value => [value, 'BROKEN TARGET']));
  const before = JSON.stringify(lessons);
  const encoded = text => renderToStaticMarkup(React.createElement('span', null, text)).slice(6, -7);
  for (const mode of ['guided', 'bridge', 'immersion']) {
    const api = await runtime(mode, targets);
    let initial;
    const Player = compile('../src/components/lesson-player.tsx', {
      'next/dynamic': { default: () => () => null },
      'lucide-react': Object.fromEntries(['X', 'Check', 'ArrowRight', 'RotateCcw', 'Clock3'].map(name => [name, () => null])),
      '@/lib/interface-language': api,
      '@/lib/learning-local': { readWorkspace: () => ({ checkpoints: { current: initial } }), checkpointKey: () => 'current' },
      '@/lib/content/build': { contentVersion: 'test' }, '@/lib/study': {},
      '@/lib/lesson-flow': { migrateLessonCheckpoint: checkpoint => checkpoint, lessonSteps: lesson => lesson.exercises },
      '@/lib/quick-practice': { ...quickPractice, readPersonalRecord: () => null },
      '@/lib/interface-sound': {}, '@/lib/course-guide': { lessonMetadata },
      './mascot-moment': { default: () => null }, './quick-player.module.css': { default: {} },
    }).default;
    for (const lesson of lessons) for (const [index, step] of lesson.exercises.entries()) {
      initial = { index, receipt: 'test', exerciseIds: lesson.exercises.map(step => step.id) };
      const markup = renderToStaticMarkup(React.createElement(Player, { userId: 'test', lesson, review: false, mascot: 'sparky', saving: false }));
      assert.ok(!markup.includes('BROKEN TARGET'), mode + ':' + lesson.id + ':' + step.id);
      for (const target of [step.english, step.cue, ...step.options].filter(Boolean)) assert.ok(markup.includes(encoded(target)), lesson.id + ': ' + target);
      const support = policy.learningLanguageModes[mode].supportLocale;
      assert.ok(markup.includes(encoded(support === 'en' ? step.bodyEnglish : step.body)), lesson.id + ': prompt');
    }
  }
  assert.equal(JSON.stringify(lessons), before, 'language presentation never mutates content or keys');
});

test('all narrated English classes provide Portuguese support while preserving English comprehension items', async () => {
  for (const mode of ['guided', 'bridge', 'immersion']) {
    const api = await runtime(mode, { [classes.englishClasses[0].question]: 'BROKEN QUESTION', [classes.englishClasses[0].options[0]]: 'BROKEN OPTION' });
    const Classroom = compile('../src/components/english-classroom.tsx', {
      '@/lib/interface-language': api, '@/lib/english-classes': classes,
      '@/lib/audio-playback': {}, 'next/image': { default: () => null },
    }).default;
    for (const lesson of classes.englishClasses) {
      const support = classes.englishClassSupport[lesson.id];
      assert.equal(support.focus.length, lesson.focus.length);
      assert.ok(support.explanation && support.task);
      const markup = renderToStaticMarkup(React.createElement(Classroom, { level: lesson.level }));
      assert.ok(!/BROKEN QUESTION|BROKEN OPTION/.test(markup));
      assert.ok(markup.includes(mode === 'guided' ? 'Sua sala de inglês' : 'Your English classroom'));
      assert.ok(markup.includes(mode === 'immersion' ? lesson.task : support.task));
      assert.match(markup, /<fieldset lang="en">/);
    }
  }
});
