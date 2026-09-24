import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Editorial timing pass over the user-supplied video. Kept as compact source
// data so a later timing review can regenerate the private manifest exactly.
const cues = [
  [18.24,21.68,"Forget it I'll do it sometime",'Esquece, eu faço isso algum dia.'],
  [21.68,24.94,"I'm locked up on the button",'Estou preso no botão.'],
  [26.76,29.60,"Can't you do it sometime",'Você não consegue fazer isso algum dia?'],
  [31.16,32.52,'Pushed it in too far','Empurrou longe demais.'],
  [34.76,38.02,'Fine electrify mine','Tudo bem, eletrifique o meu.'],
  [38.78,41.38,'Electrify my golden tooth','Eletrifique meu dente de ouro.'],
  [43.30,45.12,"Can't look at your eyes",'Não consigo olhar para os seus olhos.'],
  [46.26,48.18,'Without sparking some','Sem provocar alguma faísca.'],
  [48.18,53.20,'Electrify my heart','Eletrifique meu coração.'],
  [62.24,67.28,'Electrify my heart','Eletrifique meu coração.'],
  [82.00,85.66,"Yeah surprise I'm in the same time",'É, surpresa: estou no mesmo tempo.'],
  [86.58,88.58,'Beneath the same sun','Sob o mesmo sol.'],
  [88.58,93.68,'Oh man you cut me to size','Nossa, você me deixou no tamanho certo.'],
  [94.54,97.86,'My little buttercup that hurt','Minha pequena buttercup, isso doeu.'],
  [97.86,101.98,'Fine electrify mine','Tudo bem, eletrifique o meu.'],
  [103.10,105.80,'Electrify my golden tooth','Eletrifique meu dente de ouro.'],
  [105.80,109.84,"Can't look at those eyes",'Não consigo olhar para aqueles olhos.'],
  [109.84,112.52,'Without sparking some','Sem provocar alguma faísca.'],
  [112.52,118.80,'Electrify my heart','Eletrifique meu coração.'],
  [120.62,127.08,'Electrify my heart','Eletrifique meu coração.'],
];

const vocabulary = [
  ['forget','forget','esquecer'], ['sometime','sometime','algum dia'], ['locked','locked','preso'],
  ['button','button','botão'], ['pushed','pushed','empurrou'], ['far','far','longe'],
  ['electrify','electrify','eletrificar'], ['golden','golden','dourado'], ['tooth','tooth','dente'],
  ['look','look','olhar'], ['eyes','eyes','olhos'], ['sparking','sparking','provocando faíscas'],
  ['heart','heart','coração'], ['beneath','beneath','sob'], ['sun','sun','sol'], ['hurt','hurt','doeu'],
].map(([id, word, meaning]) => ({ id, word, meaning, ipa: '', usage: `Use “${word}” in the phrase from the song.`, example: word }));

function words(text, start, end) {
  const parts = text.split(' ');
  const span = (end - start) / parts.length;
  return parts.map((text, index) => ({
    text,
    start: Number((start + span * index).toFixed(3)),
    end: Number((index === parts.length - 1 ? end : start + span * (index + 1)).toFixed(3)),
    vocabularyId: vocabulary.find(item => item.id === text.toLowerCase().replace(/[^a-z]/g, ''))?.id,
  }));
}

const lines = cues.map(([start, end, text, translation], index) => ({
  id: `buttercup-${String(index + 1).padStart(2, '0')}`,
  start, end, text, translation,
  tip: 'Ouça a pulsação da frase e repita em blocos curtos; primeiro o ritmo, depois cada palavra.',
  words: words(text, start, end),
}));

const manifest = {
  id: 'buttercup-local', version: 'buttercup-timing-2', title: 'Buttercup', artist: 'Jack Stauber',
  level: 'B1', topic: 'Ritmo, imagens e repetição', duration: 208.144,
  source: '/api/music/audio?trackId=buttercup-local', rights: 'user-provided', published: true,
  visualSource: '/api/music/video?trackId=buttercup-local', lines, vocabulary,
  questions: [
    { id: 'buttercup-q1', prompt: 'Qual palavra se relaciona a “coração”?', options: ['heart', 'button', 'sun'], answer: 0, explanation: '“Heart” significa coração.' },
    { id: 'buttercup-q2', prompt: 'O que “beneath” indica?', options: ['acima de', 'sob', 'depois de'], answer: 1, explanation: '“Beneath” significa sob ou abaixo de.' },
    { id: 'buttercup-q3', prompt: 'Qual verbo descreve dar energia elétrica?', options: ['forget', 'electrify', 'look'], answer: 1, explanation: '“Electrify” é eletrificar.' },
  ],
};

await writeFile(resolve('.music-assets/buttercup-local/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
